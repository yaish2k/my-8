const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const { formatString } = require('../utils/utilities');
const nexmoSettings = require('../config/index').nexmo;
const Schema = mongoose.Schema;
const { DatabaseError, PhoneCallsAmountExeededError, NexmoPhoneCallsServiceError } = require('../utils/errors');

/**
 * Call Schema
 */

const CONVERSATION_STATUS = {
    STARTED: 'started',
    ANSWERED: 'answered'
}
const CallSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    nexmo_conversation_id: { type: String, required: true },
    text_to_speach: { type: String, required: true },
    caller: { type: Schema.Types.ObjectId, ref: 'User' },
    reciever: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, require: true, default: CONVERSATION_STATUS.STARTED }
});

/**
 * Statics
 */

CallSchema.statics = {

    async getCallsBalanceByUser(user) {
        const CallModel = this;
        let currentCallsBalance;
        currentCallsBalance = await CallModel
            .countDocuments({ caller: user._id, status: CONVERSATION_STATUS.ANSWERED });
        return currentCallsBalance;
    },

    userAllowsToMakeAnotherCall(currentCallsBalance) {
        return currentCallsBalance + 1 <= nexmoSettings.CALL.CALLS_MAX_BALANCE;
    },

    async callUser(callingUser, targetPhoneNumberToCall) {
        const CallModel = this;
        let targetUserToCall;
        targetUserToCall = await User.getUserByPhoneNumber(targetPhoneNumberToCall);
        if (!targetUserToCall) {
            throw new DatabaseError('Target user to call not found');
        }
        const isPartOfMyContacts = User.getContactOfUserById(callingUser, targetUserToCall._id)
        if (!isPartOfMyContacts) {
            throw new UserIsNotAllowedToSendMessageError('Target user is not part of current user approved contacts');
        }
        const currentCallsBalance = await this.getCallsBalanceByUser(callingUser);
        if (!this.userAllowsToMakeAnotherCall(currentCallsBalance)) {
            throw new PhoneCallsAmountExeededError('Not enough calls balance remaining');
        }
        let textToSpeachMessage = formatString(nexmoSettings.CALL.SERVER_MESSAGE, callingUser.name);
        let conversationId;
        try {
            conversationId = await NexmoHandler.sendTextToSpeach(callingUser.name, targetPhoneNumberToCall,
                textToSpeachMessage);
        } catch (err) {
            throw new NexmoPhoneCallsServiceError('Error while trying to call from nexmo');
        }
        let newCallInstance = new CallModel({
            nexmo_conversation_id: conversationId,
            text_to_speach: textToSpeachMessage,
            caller: callingUser._id,
            reciever: targetUserToCall._id,
        });
        try {
            return await newCallInstance.save();
        } catch (err) {
            throw new DatabaseError('Failed to create call intance on db');
        }


    }

};

mongoose.model('Call', CallSchema);
