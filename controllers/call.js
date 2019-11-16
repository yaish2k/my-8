const mongoose = require('mongoose');
const Call = mongoose.model('Call');
const { asyncMiddleware } = require('../config/middlewares');
const { ConversationWasCreatedSuccessfullyResponse } = require('../utils/responses');

exports.callUser = asyncMiddleware(async (req, res, next) => {
    const callingUser = req.user;
    const { targetPhoneNumberToCall } = req.body;
    await Call.callUser(callingUser,
        targetPhoneNumberToCall);
    res.status(200).send(new ConversationWasCreatedSuccessfullyResponse());

});
