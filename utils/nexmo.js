const Nexmo = require('nexmo');
const config = require('../config/index');
const { promisify } = require('../utils/utilities');

const nexmo = new Nexmo(config.nexmo.credentials);

class NexmoHandler {
    static async sendSmsMessage(from, to, text) {
        try {
            responseData = await promisify(nexmo.message.sendSms, from, to, text);
            if (responseData.messages[0].status
                === config.nexmo.SMS.SUCESS_MESSAGE_ID) {
                return config.nexmo.SMS.MESSAGE_SEND_SUCCESSFULLY;
            } else {
                throw `${config.nexmo.SMS.MESSAGE_FAILED_WITH_ERROR}: ${responseData.messages[0]['error-text']}`;
            }
        } catch (err) {
            throw err;
        }
    }

    static async sendTextToSpeach(callToNumber, textToSpeach) {
        const callConfig = [
            {
                action: nexmo.CALL.ACTION,
                voiceName: nexmo.CALL.ACTION,
                text: textToSpeach,
            },
        ];
        const fromConfig = { type: nexmo.CALL.TYPE, number: nexmo.CALL.SERVER_PHONE_NUMBER };
        const toConfig = [{ type: nexmo.CALL.TYPE, number: callToNumber }];
        try {
            result = await promisify(nexmo.calls.create, {
                from: fromConfig,
                to: toConfig,
                ncco: callConfig
            });
            return result;
        } catch (err) {
            throw err;
        }
    }
}
module.exports = {
    NexmoHandler
}

