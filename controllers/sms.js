const mongoose = require('mongoose');
const SMS = mongoose.model('SMS');
const { asyncMiddleware } = require('../config/middlewares');
const { SmsWasSentSuccessfullyResponse } = require('../utils/responses');

exports.sendSmsToUser = asyncMiddleware(async (req, res, next) => {
    const sendingUser = req.user;
    const { targetPhoneCallToSend } = req.body;
    const successMessage = await SMS.sendSmsToUser(sendingUser,
        targetPhoneCallToSend);
    res.status(200).send(new SmsWasSentSuccessfullyResponse());

});
