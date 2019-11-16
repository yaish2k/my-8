const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const nexmoSettings = require('../config/index').nexmo;
const { formatString } = require('../utils/utilities');
const Schema = mongoose.Schema;
const { DatabaseError, UserIsNotAllowedToSendMessageError,
    SmsAmountExeededError, NexmoSmsServiceError } = require('../utils/errors');

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

    userAllowsToSendAnotherMessage(currentMessagesBalance) {
        return currentMessagesBalance + 1 <= nexmoSettings.SMS.MESSAGES_MAX_BALANCE;
    },

    async sendSmsToUser(sendingUser, targetPhoneCallToSend) {
        const SmsModel = this;
        let targetUserToSend;
        targetUserToSend = await User.getUserByPhoneNumber(targetPhoneCallToSend);
        if (!targetUserToSend) {
            throw new DatabaseError('Target user to send not found');
        }
        const isPartOfMyContacts = User.getContactOfUserById(sendingUser, targetUserToSend._id)
        if (!isPartOfMyContacts) {
            throw new UserIsNotAllowedToSendMessageError('Target user is not part of current user approved contacts');
        }

        const currentMessagesBalance = await this.getMessagesBalanceByUser(sendingUser);
        if (!this.userAllowsToSendAnotherMessage(currentMessagesBalance)) {
            throw new SmsAmountExeededError('Not enough sms balance remaining');
        }
        let smsMessage = formatString(nexmoSettings.SMS.SERVER_MESSAGE, sendingUser.name);
        let messageId;
        try {
            messageId = await NexmoHandler.sendSmsMessage(sendingUser.name,
                targetUserToSend.phone_number,
                smsMessage);
        } catch (err) {
            throw new NexmoSmsServiceError('Error while trying to send sms from nexmo');
        }
        let smsInstance = new SmsModel({
            nexmo_message_id: messageId,
            sms_text: smsMessage,
            sender: sendingUser._id,
            reciever: targetUserToSend._id,
        });
        try {
            return await smsInstance.save();
        } catch (err) {
            throw new DatabaseError('Failed to create sms intance on db');
        }


    }
};

mongoose.model('SMS', SmsSchema);
