const mongoose = require('mongoose');
const User = mongoose.model('User');
const SMS = mongoose.model('SMS');
const Call = mongoose.model('Call');
const ContactRequest = mongoose.model('ContactRequest');
const { UserCreatedResponse, UserEditedResponse,
    UserDeletedResponse } = require('../utils/responses');
const { asyncMiddleware } = require('../config/middlewares');
const { DatabaseError } = require('../utils/errors');
const nexmoSettings = require('../config/index').nexmo;

exports.createUser = asyncMiddleware(async (req, res, next) => {
    const body = req.body;
    try {
        await User.createUser(body);
        res.status(200).send(new UserCreatedResponse());
    } catch (err) {
        throw new DatabaseError(err.message);
    }

});

exports.editUser = asyncMiddleware(async (req, res, next) => {
    const fieldsToUpdate = req.body;
    try {
        await User.editUser(req.user.id, fieldsToUpdate);
        res.status(200).send(new UserEditedResponse());
    } catch (err) {
        throw new DatabaseError(err.message);
    }
});

exports.getUserInformation = asyncMiddleware(async (req, res, next) => {
    const user = req.user;
    try {
        const userWaitingList = await ContactRequest
            .getUserWaitingList(user.id);
        const userPendingList = await ContactRequest
            .getUserPendingList(user.phone_number);
        const userInformation = await User
            .getUserInformation(user.id);
        const creditsStatus = user.getUserCreditsStatus();
        let userData = User.serialize(userInformation, userPendingList, userWaitingList);
        userData.smsBalance = creditsStatus.remainingMessagesAmount;
        userData.callBalance = creditsStatus.remainingCallsBalance;
        res.status(200).send(userData);
    } catch (err) {
        throw new DatabaseError(err.message);
    }

});

exports.removeContact = asyncMiddleware(async (req, res, next) => {
    const user = req.user;
    const { contactId } = req.body;
    try {
        await user.removeContact(contactId);
        res.status(200).send(new UserDeletedResponse());
    }
    catch (err) {
        throw new DatabaseError(err.message);
    }


});




