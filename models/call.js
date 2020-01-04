const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const { formatString } = require('../utils/utilities');
const nexmoSettings = require('../config/index').nexmo;
const Schema = mongoose.Schema;
const { FirebaseAdmin } = require('../utils/firebase');
const { DatabaseError, PhoneCallsAmountExeededError, NexmoPhoneCallsServiceError, NexmoError } = require('../utils/errors');
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
    status: { type: String, require: true, default: CONVERSATION_STATUS.STARTED },
    is_collected: { type: Boolean, default: false }

});

/**
 * Statics
 */

CallSchema.statics = {

    async getCallsList(user) {
        CallsModel = this;
        calls = await CallsModel.find({ caller: user._id })
            .populate({
                path: 'reciever',
                model: 'User',
                select: 'name',
            })
            .lean(true)
            .exec();

        seiralizedCalls = calls.map(call => ({
            date: call.created_at.toLocaleDateString(),
            name: call.reciever.name,
            collected: call.is_collected
        }));
        return seiralizedCalls;
    },

    async getCallsBalanceByUser(user) {
        const CallModel = this;
        let currentCallsBalance;
        currentCallsBalance = await CallModel
            .countDocuments({ caller: user._id });
        return currentCallsBalance;
    },

    userAllowsToMakeAnotherCall(currentCallsBalance) {
        return currentCallsBalance - 1 >= 0;
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

    async isAllowToMakeCall(callingUser, targetUserToCall) {
        let decreaseBalanceToTargetUser = false;
        if (!this.userAllowsToMakeAnotherCall(callingUser.credits.remaining_calls)) {
            // we will check if the target user balance is ok and take 1 call from him
            if (!this.userAllowsToMakeAnotherCall(targetUserToCall.credits.remaining_calls)) {
                throw new PhoneCallsAmountExeededError('Not enough calls balance remaining');
            } else {
                decreaseBalanceToTargetUser = true;
            }

        }
        return decreaseBalanceToTargetUser;
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
        let decreaseBalanceFromTargetUser, isCollected;
        decreaseBalanceFromTargetUser = isCollected =
            this.isAllowToMakeCall(callingUser, targetUserToCall);

        let textToSpeachMessage = formatString(nexmoSettings.CALL.SERVER_MESSAGE, callingUser.name);
        const conversationId =
            this.sendTextToSpeach(callingUser, targetPhoneNumberToCall, textToSpeachMessage);
        await this.createCallInstance(conversationId, textToSpeachMessage,
            callingUser._id, targetUserToCall._id, isCollected);

        if (decreaseBalanceFromTargetUser) {
            this.sendPushNotificationWhenChangingTargetUserCallsBalance(callingUser, targetUserToCall);
            await targetUserToCall.decreaseAmountOfCallsCredits(1);
        } else {
            callingUser = await callingUser.decreaseAmountOfCallsCredits(1);
        }

        const remainingCallsBalance = callingUser.credits.remaining_calls;
        const answeredCallsBalance = callingUser.credits.amount_of_calls - callingUser.credits.remaining_calls;
        return { remainingCallsBalance, answeredCallsBalance };
    },

    async sendPushNotificationWhenChangingTargetUserCallsBalance(askingUser, loaningUser) {
        const pushNotificationsToken = loaningUser.push_notifications_token; // target user
        if (pushNotificationsToken) {
            const pushNotificationMessage = {
                title: 'Call credit was loaned',
                body: formatString(STATUS_CODES.STATUS_2008.message, "1", askingUser.name)
            }
            const pushNotificationData = {
                status_code: STATUS_CODES.STATUS_2007.code,
            }
            FirebaseAdmin.sendPushNotification(pushNotificationMessage,
                pushNotificationData,
                pushNotificationsToken);
        }
    },

    async sendTextToSpeach(callingUser, targetPhoneNumberToCall, textToSpeachMessage) {
        let conversationId;
        try {
            conversationId = await NexmoHandler.sendTextToSpeach(callingUser.name,
                targetPhoneNumberToCall,
                textToSpeachMessage);
        } catch (err) {
            throw new NexmoPhoneCallsServiceError('Error while trying to call from nexmo');
        };

        return conversationId;
    },

    async createCallInstance(conversationId, textToSpeachMessage,
        callingUserId, reciverId) {
        const CallModel = this;
        let newCallInstance = new CallModel({
            nexmo_conversation_id: conversationId,
            text_to_speach: textToSpeachMessage,
            caller: callingUserId,
            reciever: reciverId,
            status: CONVERSATION_STATUS.STARTED,
            is_collected: isCollected
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
