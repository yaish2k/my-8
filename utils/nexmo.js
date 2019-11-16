const Nexmo = require('nexmo');
const config = require('../config/index');
const { phoneNumberDigitsOnly, promisify, formatString } = require('../utils/utilities');


const nexmo = new Nexmo(config.nexmo.credentials);

class NexmoHandler {
    static async sendSmsMessage(senderUserName, targetPhoneNumber, textToSend) {
        textToSend = textToSend || formatString(config.nexmo.SMS.SERVER_MESSAGE, senderUserName);
        const serverPhoneNumber = config.nexmo.SERVER_PHONE_NUMBER;
        try {
            const responseData = await promisify(nexmo.message.sendSms.bind(nexmo.message),
                serverPhoneNumber, phoneNumberDigitsOnly(targetPhoneNumber), textToSend);
            if (this.messageWasSentSuccessfully(responseData)) {
                return this.extractMessageId(responseData);
            } else {
                throw new Error('Failed to send Message to user');
            }
        } catch (err) {
            throw new Error('Failed to send Message to user');
        }
    }

    static extractMessageId(responseData) {
        return responseData.messages[0]['message-id'];
    }
    static messageWasSentSuccessfully(responseData) {
        return responseData.messages[0].status
            === config.nexmo.SMS.SUCESS_MESSAGE_ID
    }

    static async sendTextToSpeach(callingUsername, targetPhoneNumber, textToSpeach) {
        textToSpeach = textToSpeach || formatString(config.nexmo.CALL.SERVER_MESSAGE, callingUsername);
        const serverPhoneNumber = config.nexmo.SERVER_PHONE_NUMBER;
        let phoneResult;

        const callConfig = [
            {
                action: config.nexmo.CALL.ACTION,
                voiceName: config.nexmo.CALL.VOICE_NAME,
                text: textToSpeach,
            },
        ];
        const fromConfig = { type: config.nexmo.CALL.TYPE, number: serverPhoneNumber };
        const toConfig = [{ type: config.nexmo.CALL.TYPE, number: phoneNumberDigitsOnly(targetPhoneNumber) }];
        try {
            phoneResult = await promisify(nexmo.calls.create.bind(nexmo.calls), {
                from: fromConfig,
                to: toConfig,
                ncco: callConfig
            });
            return phoneResult.conversation_uuid;
        } catch (err) {
            throw new Error('Failed to call user');
        }
    }
}
module.exports = {
    NexmoHandler
}

