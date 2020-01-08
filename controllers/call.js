const mongoose = require('mongoose');
const Call = mongoose.model('Call');
const { asyncMiddleware } = require('../config/middlewares');
const { ConversationWasCreatedSuccessfullyResponse } = require('../utils/responses');

exports.callUser = asyncMiddleware(async (req, res, next) => {
    const callingUser = req.user;
    const { targetPhoneNumberToCall } = req.body;
    const { remainingCallsBalance, answeredCallsBalance } = await Call.callUser(callingUser,
        targetPhoneNumberToCall);
    res.status(200).send(new ConversationWasCreatedSuccessfullyResponse(remainingCallsBalance,
        answeredCallsBalance));

});

exports.updateCallStatus = asyncMiddleware(async (req, res, next) => {
    const callInstance = req.callInstance;
    await Call.updateCallStatusToAnswered(callInstance);
    await Call.sendPushNotification(callInstance);
    res.status(200).send({text:'ok'});
});

exports.getCallsList = asyncMiddleware(async (req, res, next) => {
    const callsList = await Call.getCallsList(req.user);
    res.status(200).send(callsList);
})
