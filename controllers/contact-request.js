const mongoose = require('mongoose');
const ContactRequest = mongoose.model('ContactRequest');


exports.createContactRequest = (req, res, next) => {
    const askingUser = req.user;
    const { targetPhoneNumber, targetContactName } = req.body;
    ContactRequest
        .createContactRequest(
            askingUser,
            targetPhoneNumber,
            targetContactName)
        .then(_ => {
            res.sendStatus(201);
        })
        .catch(err => {
            res.status(418).send(err.message);
        })
};

exports.declineContactRequest = (req, res, next) => {
    const decliningUser = req.user;
    const { askingPhoneNumber } = req.body;
    ContactRequest
        .declineContactRequest(decliningUser, askingPhoneNumber)
        .then(_ => {
            res.status(200).send('Contact declined');
        })
        .catch(err => {
            res.status(418).send(err.message);
        })
};

exports.approveContactRequest = (req, res, next) => {
    const approvingUser = req.user;
    const { askingPhoneNumber } = req.body;
    ContactRequest
        .approveContactRequest(approvingUser, askingPhoneNumber)
        .then(_ => {
            res.status(200).send('Contact approved');
        })
        .catch(err => {
            res.status(418).send(err.message);
        })
};

exports.removeRequestFromWaitingList = (req, res, next) => {
    const askingUser = req.user;
    const { targetPhoneNumber } = req.body;
    ContactRequest
        .removeRequestFromWaitingList(askingUser, targetPhoneNumber)
        .then(_ => {
            res.status(201).send('Contact request deleted');
        })
        .catch(err => {
            res.status(418).send(err.message);
        })
}
exports.getRequestsForCurrentUser = (req, res, next) => {
    const requestedUser = req.user;
    ContactRequest
        .getContactRequestsWhoRequestedPhoneNumber(requestedUser.phone_number)
        .then(currentUserRequests => {
            res.status(200).json(currentUserRequests);
        })
        .catch(err => {
            res.status(418).send(err.message);
        })

}
