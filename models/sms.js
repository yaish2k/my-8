const mongoose = require('mongoose');
const User = mongoose.model('User');
const { PHONE_VALIDATOR } = require('../utils/validators');
const { NexmoHandler } = require('../utils/nexmo');
const Schema = mongoose.Schema;

/**
 * SMS Schema
 */

const SmsSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    sms_text: {
        type: String,
        required: [true, 'sms text is required']
    }
});

/**
 * Statics
 */

SmsSchema.statics = {
    sendSmsToUser: async function (sendingUser,
        targetPhoneCallToSend,
        smsText) {
        if (!smsText) {
            throw Error('SMS text cannot be empty');
        }
        let targetUserToSend;
        targetUserToSend = await User.getUserByPhoneNumber(targetPhoneCallToSend);
        if (!targetUserToSend) {
            throw Error('Target user to send not found');
        }

        let messageWasSent;

        try {
            messageWasSent = await NexmoHandler.sendSmsMessage(sendingUser.phone_number,
                targetUserToSend.phone_number,
                smsText);
        } catch (err) {
            throw Error('Failed to send SMS');
        }
        const SmsModel = this;
        let smsInstance = new SmsModel({
            from: sendingUser._id,
            target: targetUserToSend._id,
            sms_text: smsText,
        });
        try {
            await smsInstance.save();
            return messageWasSent;
        } catch (err) {
            throw new Error('Failed to create sms intance on db');
        }


    }
};

mongoose.model('SMS', SmsSchema);
