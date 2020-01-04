const mongoose = require('mongoose');
const SMS = mongoose.model('SMS');
const { asyncMiddleware } = require('../config/middlewares');
const { SmsWasSentSuccessfullyResponse } = require('../utils/responses');

exports.sendSmsToUser = asyncMiddleware(async (req, res, next) => {
    const sendingUser = req.user;
    const { targetPhoneCallToSend } = req.body;
    const { remainingMessagesAmount, sentMessagesAmount } = await SMS.sendSmsToUser(sendingUser,
        targetPhoneCallToSend);
    res.status(200).send(new SmsWasSentSuccessfullyResponse(remainingMessagesAmount, sentMessagesAmount));
});

exports.updateSmsStatus = asyncMiddleware(async (req, res, next) => {
    const message = req.messageInstance;
    await SMS.updateSmsStatusToRecieved(message);
    await SMS.sendPushNotificationWhenSmsRecieved(message);
    res.sendStatus(200);
});

exports.getSmsList = asyncMiddleware(async (req, res, next) => {
    const smsList = await SMS.getSerializedSmsBalance(req.user);
    res.status(200).send(smsList);
})
