const mongoose = require('mongoose');
const ContactRequest = mongoose.model('ContactRequest');
const { asyncMiddleware } = require('../config/middlewares');
const { ContactRequestCreatedResponse,
    ContactRequestDeclinedResponse, ContactRequestApprovedResponse, ContactRequestRemovedResponse } = require('../utils/responses');
const { DatabaseError } = require('../utils/errors');

exports.createContactRequest = asyncMiddleware(async (req, res, next) => {
    const askingUser = req.user;
    const { targetPhoneNumber, targetContactName } = req.body;
    await ContactRequest
        .createContactRequest(askingUser, targetPhoneNumber, targetContactName);
    res.status(200).send(new ContactRequestCreatedResponse());
});

exports.declineContactRequest = asyncMiddleware(async (req, res, next) => {
    const decliningUser = req.user;
    const { askingPhoneNumber } = req.body;
    await ContactRequest
        .declineContactRequest(decliningUser, askingPhoneNumber);
    res.status(200).send(new ContactRequestDeclinedResponse());
});

exports.approveContactRequest = asyncMiddleware(async (req, res, next) => {
    const approvingUser = req.user;
    const { askingPhoneNumber } = req.body;
    await ContactRequest
        .approveContactRequest(approvingUser, askingPhoneNumber)
    res.status(200).send(new ContactRequestApprovedResponse());
});

exports.removeRequestFromWaitingList = asyncMiddleware(async (req, res, next) => {
    const askingUser = req.user;
    const { targetPhoneNumber } = req.body;
    try {
        await ContactRequest
            .removeRequestFromWaitingList(askingUser, targetPhoneNumber)
        res.status(200).send(new ContactRequestRemovedResponse());
    } catch (err) {
        return new DatabaseError('Failed to remove request from waiting list');
    }


});

