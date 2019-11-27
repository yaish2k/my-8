const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const nexmoSettings = require('../config/index').nexmo;
const { formatString } = require('../utils/utilities');
const Schema = mongoose.Schema;
const { DatabaseError, UserIsNotAllowedToSendMessageError,
    SmsAmountExeededError, NexmoSmsServiceError, NexmoError} = require('../utils/errors');
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
    status: { type: String, require: true, default: SMS_STATUS.SENT }
});

/**
 * Statics
 */

SmsSchema.statics = {
    async getMessagesBalanceByUser(user) {
        const SmsModel = this;
        let currentMessagesBalance;
        currentMessagesBalance = await SmsModel
            .countDocuments({ sender: user._id, status: SMS_STATUS.RECIEVED });
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

    async sendPushNotification(smsMessageIntance) {
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
        return currentMessagesBalance + 1 <= nexmoSettings.SMS.MESSAGES_MAX_BALANCE;
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

        const currentMessagesBalance = await this.getMessagesBalanceByUser(sendingUser);
        if (!this.userAllowsToSendAnotherMessage(currentMessagesBalance)) {
            throw new SmsAmountExeededError('Not enough sms balance remaining');
        }
        let messageText = formatString(nexmoSettings.SMS.SERVER_MESSAGE, sendingUser.name);
        let messageId;
        try {
            messageId = await NexmoHandler.sendSmsMessage(sendingUser.name,
                targetUserToSend.phone_number,
                messageText);
        } catch (err) {
            throw new NexmoSmsServiceError('Error while trying to send sms from nexmo');
        }

        await this.createSmsInstance(messageId, messageText, sendingUser._id, targetUserToSend._id);
        const sentMessagesAmount = currentMessagesBalance + 1;
        const remainingMessagesAmount = nexmoSettings.SMS.MESSAGES_MAX_BALANCE - sentMessagesAmount;
        return { remainingMessagesAmount, sentMessagesAmount };
    },


    async createSmsInstance(messageId, messageText, senderId, recieverId) {
        const SmsModel = this;
        let smsInstance = new SmsModel({
            nexmo_message_id: messageId,
            sms_text: messageText,
            sender: senderId,
            reciever: recieverId,
            status: SMS_STATUS.SENT
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
