const mongoose = require('mongoose');
const User = mongoose.model('User');
const { NexmoHandler } = require('../utils/nexmo');
const Schema = mongoose.Schema;

/**
 * Call Schema
 */

const CallSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    text_to_speach: {
        type: String,
        required: [true, 'Text to speach is required']
    }
});

/**
 * Statics
 */

CallSchema.statics = {
    callUser: async function (callingUser,
        targetPhoneNumberToCall,
        textToSpeach) {

        if (!textToSpeach) {
            throw Error('Text to speach must be specified');
        }
        let userTargetToCall;
        userTargetToCall = await User.getUserByPhoneNumber(targetPhoneNumberToCall);
        if (!userTargetToCall) {
            throw Error('Target user to call not found');
        }

        try {
            await NexmoHandler.sendTextToSpeach(userTargetToCall.phone_number,
                textToSpeach);
        } catch (err) {
            throw Error('Text to speach conversation failed');
        }
        const CallModel = this;
        let newCallInstance = new CallModel({
            from: callingUser._id,
            target: userTargetToCall._id,
            text_to_speach: textToSpeach,
        });
        try {
            return await newCallInstance.save();
        } catch (err) {
            throw new Error('Failed to create call instance on db');
        }


    }

};

mongoose.model('Call', CallSchema);
