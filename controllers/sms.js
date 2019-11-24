const mongoose = require('mongoose');
const SMS = mongoose.model('SMS');
const { asyncMiddleware } = require('../config/middlewares');
const { SmsWasSentSuccessfullyResponse } = require('../utils/responses');

exports.sendSmsToUser = asyncMiddleware(async (req, res, next) => {
    const sendingUser = req.user;
    const { targetPhoneCallToSend } = req.body;
    const { remainingMessagesAmount, sentMessagesAmmount } = await SMS.sendSmsToUser(sendingUser,
        targetPhoneCallToSend);
    res.status(200).send(new SmsWasSentSuccessfullyResponse(remainingMessagesAmount, sentMessagesAmmount));
});

exports.updateSmsStatus = asyncMiddleware(async (req, res, next) => {
    const message = req.messageInstance;
    await SMS.updateSmsStatusToRecieved(message);
    await SMS.sendPushNotification(message);
    res.sendStatus(200);

});
