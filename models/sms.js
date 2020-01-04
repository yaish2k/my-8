const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const nexmoSettings = require('../config/index').nexmo;
const { formatString } = require('../utils/utilities');
const Schema = mongoose.Schema;
const { DatabaseError, UserIsNotAllowedToSendMessageError,
    SmsAmountExeededError, NexmoSmsServiceError, NexmoError } = require('../utils/errors');
const { FirebaseAdmin } = require('../utils/firebase');
const { STATUS_CODES } = require('../utils/status_codes');

/**
 * SMS Schema
 */

const SMS_STATUS = {
    SENT: 'sent',
    RECIEVED: 'recieved'
}
const SmsSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    nexmo_message_id: { type: String, require: true },
    sms_text: { type: String, require: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    reciever: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, require: true, default: SMS_STATUS.SENT },
    is_collected: { type: Boolean, default: false }
});

/**
 * Statics
 */

SmsSchema.statics = {

    async getSerializedSmsBalance(user) {
        SmsModel = this;
        messages = await SmsModel.find({ sender: user._id })
            .populate({
                path: 'reciever',
                model: 'User',
                select: 'image_url phone_number name',
            })
            .lean(true)
            .exec();

        serializedMessages = messages.map(m => ({
            date: m.created_at.toLocaleDateString(),
            name: m.reciever.name,
            collected: m.is_collected
        }));
        return serializedMessages;
    },

    async isAllowToSendMessage(sendingUser, targetUserToSend) {
        let decreaseBalanceToTargetUser = false;
        if (!this.userAllowsToSendAnotherMessage(sendingUser.credits.remaining_sms)) {
            // we will check if the target user balance is ok and take 1 message from him
            if (!this.userAllowsToSendAnotherMessage(targetUserToSend.credits.remaining_sms)) {
                throw new SmsAmountExeededError('Not enough sms balance remaining');
            }
            else {
                decreaseBalanceToTargetUser = true;
            }
        }
        return decreaseBalanceToTargetUser;

    },
    async getMessagesBalanceByUser(user) {
        const SmsModel = this;
        let currentMessagesBalance;
        currentMessagesBalance = await SmsModel
            .countDocuments({ sender: user._id });
        return currentMessagesBalance;
    },

    async updateSmsStatusToRecieved(smsMessageIntance) {
        let session;
        if (smsMessageIntance.status === SMS_STATUS.RECIEVED) {
            throw new NexmoError('Sms status already modified');
        }
        try {
            session = await mongoose.startSession();
            session.startTransaction({ writeConcern: { w: 1 } });
            smsMessageIntance.status = SMS_STATUS.RECIEVED;
            await smsMessageIntance.save();
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw new NexmoError('Failed to modify sms status');
        }
    },

    async sendPushNotificationWhenSmsRecieved(smsMessageIntance) {
        const senderId = smsMessageIntance.sender;
        const recieverId = smsMessageIntance.reciever;
        const senderUser = await User.getUserById(senderId);
        const recieverUser = await User.getUserById(recieverId);
        if (!senderUser || !recieverUser) { // use logs
            throw new NexmoError('Sender / Reciever users not found');
        }
        const pushNotificationsToken = senderUser.push_notifications_token;
        if (pushNotificationsToken) {
            const pushNotificationMessage = {
                title: 'Sms received',
                body: formatString(STATUS_CODES.STATUS_2003.message, recieverUser.name)
            }
            const pushNotificationData = {
                status_code: STATUS_CODES.STATUS_2003.code,
                target_phone_number: recieverUser.phone_number
            }
            FirebaseAdmin.sendPushNotification(pushNotificationMessage,
                pushNotificationData,
                pushNotificationsToken);
        }

    },

    userAllowsToSendAnotherMessage(currentMessagesBalance) {
        return currentMessagesBalance - 1 >= 0;
    },

    getSmsByMessageId(messageId) {
        const SmsModel = this;
        return SmsModel
            .findOne({ nexmo_message_id: messageId })
            .exec();
    },


    async sendSmsToUser(sendingUser, targetPhoneCallToSend) {
        let targetUserToSend;
        targetUserToSend = await User.getUserByPhoneNumber(targetPhoneCallToSend);
        if (!targetUserToSend) {
            throw new DatabaseError('Target user to send not found');
        }
        const isPartOfMyContacts = User.getApprovedContactOfUserById(sendingUser, targetUserToSend._id)
        if (!isPartOfMyContacts) {
            throw new UserIsNotAllowedToSendMessageError('Target user is not part of current user approved contacts');
        }

        let decreaseBalanceFromTargetUser, isCollected;
        decreaseBalanceFromTargetUser = isCollected =
            this.isAllowToSendMessage(sendingUser, targetUserToSend);

        let messageText = formatString(nexmoSettings.SMS.SERVER_MESSAGE, sendingUser.name);
        let messageId = this.sendSmsMessage(sendingUser.name, targetUserToSend.phone_number, messageText);
        await this.createSmsInstance(messageId, messageText, sendingUser._id, targetUserToSend._id, isCollected);

        if (decreaseBalanceFromTargetUser) {
            this.sendPushNotificationWhenChangingTargetUserMessagesBalance(sendingUser, targetUserToSend);
            await targetUserToSend.decreaseAmountOfSmsCredits(1);
        } else {
            sendingUser = await sendingUser.decreaseAmountOfSmsCredits(1);
        }

        const remainingMessagesAmount = sendingUser.credits.remaining_sms;
        const sentMessagesAmount = sendingUser.credits.amount_of_sms - sendingUser.credits.remaining_sms;
        return { remainingMessagesAmount, sentMessagesAmount };
    },

    async sendPushNotificationWhenChangingTargetUserMessagesBalance(askingUser, loaningUser) {
        const pushNotificationsToken = loaningUser.push_notifications_token; // target user
        if (pushNotificationsToken) {
            const pushNotificationMessage = {
                title: 'Sms credit was loaned',
                body: formatString(STATUS_CODES.STATUS_2007.message, "1", askingUser.name)
            }
            const pushNotificationData = {
                status_code: STATUS_CODES.STATUS_2007.code,
            }
            FirebaseAdmin.sendPushNotification(pushNotificationMessage,
                pushNotificationData,
                pushNotificationsToken);
        }
    },

    async sendSmsMessage(sendingUserName, targetUserPhoneNumber, messageText) {
        let messageId;
        try {
            messageId = await NexmoHandler.sendSmsMessage(sendingUserName,
                targetUserPhoneNumber,
                messageText);
        } catch (err) {
            throw new NexmoSmsServiceError('Error while trying to send sms from nexmo');
        }
        return messageId;
    },
    async createSmsInstance(messageId, messageText, senderId, recieverId, isCollected) {
        const SmsModel = this;
        let smsInstance = new SmsModel({
            nexmo_message_id: messageId,
            sms_text: messageText,
            sender: senderId,
            reciever: recieverId,
            status: SMS_STATUS.SENT,
            is_collected: isCollected
        });
        let session;
        try {
            session = await mongoose.startSession();
            session.startTransaction({ writeConcern: { w: 1 } });
            await smsInstance.save();
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw new DatabaseError('Failed to create sms intance on db');
        }
    }
};

mongoose.model('SMS', SmsSchema);
