const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const { formatString } = require('../utils/utilities');
const nexmoSettings = require('../config/index').nexmo;
const Schema = mongoose.Schema;
const { FirebaseAdmin } = require('../utils/firebase');
const { DatabaseError, PhoneCallsAmountExeededError, NexmoPhoneCallsServiceError, NexmoError} = require('../utils/errors');
const { STATUS_CODES } = require('../utils/status_codes');

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
            .countDocuments({ caller: user._id});
        return currentCallsBalance;
    },

    userAllowsToMakeAnotherCall(currentCallsBalance) {
        return currentCallsBalance + 1 <= nexmoSettings.CALL.CALLS_MAX_BALANCE;
    },

    getCallByConversationId(conversationId) {
        const CallModel = this;
        return CallModel
            .findOne({ nexmo_conversation_id: conversationId })
            .exec();
    },

    async updateCallStatusToAnswered(callInstance) {
        let session;
        try {
            if (callInstance.status === CONVERSATION_STATUS.ANSWERED) {
                throw new NexmoError('Call status already modified');
            }
            session = await mongoose.startSession();
            session.startTransaction({ writeConcern: { w: 1 } });
            callInstance.status = CONVERSATION_STATUS.ANSWERED;
            await callInstance.save();
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw new NexmoError('Failed to modify call status');
        }
    },

    async sendPushNotification(callInstance) {
        const callerId = callInstance.caller;
        const recieverId = callInstance.reciever;
        const callingUser = await User.getUserById(callerId);
        const recieverUser = await User.getUserById(recieverId);
        if (!callingUser || !recieverUser) { // use logs
            throw new NexmoError('Caller / Reciever users not found');
        }
        const pushNotificationsToken = callingUser.push_notifications_token;
        if (pushNotificationsToken) {
            const pushNotificationMessage = {
                title: 'Call answered',
                body: formatString(STATUS_CODES.STATUS_2006.message, recieverUser.name)
            }
            const pushNotificationData = {
                status_code: STATUS_CODES.STATUS_2006.code,
                target_phone_number: recieverUser.phone_number
            }
            FirebaseAdmin.sendPushNotification(pushNotificationMessage,
                pushNotificationData,
                pushNotificationsToken);
        }
    },

    async callUser(callingUser, targetPhoneNumberToCall) {
        let targetUserToCall;
        targetUserToCall = await User.getUserByPhoneNumber(targetPhoneNumberToCall);
        if (!targetUserToCall) {
            throw new DatabaseError('Target user to call not found');
        }
        const isPartOfMyContacts = User.getApprovedContactOfUserById(callingUser, targetUserToCall._id)
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

        await this.createCallInstance(conversationId, textToSpeachMessage,
            callingUser._id, targetUserToCall._id);
        const answeredCallsBalance = currentCallsBalance + 1
        const remainingCallsBalance = nexmoSettings.CALL.CALLS_MAX_BALANCE - answeredCallsBalance;
        return { remainingCallsBalance, answeredCallsBalance };
    },

    async createCallInstance(conversationId, textToSpeachMessage,
        callingUserId, reciverId) {
        const CallModel = this;
        let newCallInstance = new CallModel({
            nexmo_conversation_id: conversationId,
            text_to_speach: textToSpeachMessage,
            caller: callingUserId,
            reciever: reciverId,
            status: CONVERSATION_STATUS.STARTED
        });
        let session;
        try {
            session = await mongoose.startSession();
            session.startTransaction({ writeConcern: { w: 1 } });
            await newCallInstance.save();
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw new DatabaseError('Failed to create call intance on db');
        }

    }

};

mongoose.model('Call', CallSchema);
