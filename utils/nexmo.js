const Nexmo = require('nexmo');
const config = require('../config/index');
const nexmoHandler = new Nexmo(config.nexmo.credentials);

const SUCCESS_MESSAGE = "0";

exports.sendSMS = (senderNumber, targetNumber, smsText) => {
    return new Promise((resolve, reject) => {
        nexmoHandler.message.sendSms(senderNumber, targetNumber, smsText,
            (err, responseData) => {
                if (err) {
                    reject(err);
                } else {
                    if (responseData.messages[0]['status'] === SUCCESS_MESSAGE) {
                        resolve("Message sent successfully.");
                    } else {
                        reject(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                    }
                }
            })
    })

};

exports.sendTextToSpeach = (fromNumber, callingNumber, targetNumber, textToSpeach) => {
    return new Promise((resolve, reject) => {
        const ncco = [
            {
                action: 'talk',
                voiceName: 'Kendra',
                text: textToSpeach,
            },
        ];

        nexmo.calls.create(
            {
                to: [{ type: 'phone', number: callingNumber }],
                from: { type: 'phone', number: fromNumber },
                ncco,
            },
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            },
        );
    })
}


