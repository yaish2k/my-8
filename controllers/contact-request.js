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
            res.status(418).send(err);
        })
};

exports.declineContactRequest = (req, res, next) => {
    const decliningUser = req.user;
    const { targetPhoneNumberToDecline } = req.body;
    ContactRequest
        .declineContactRequest(decliningUser, targetPhoneNumberToDecline)
        .then(_ => {
            res.status(200).send('Contact declined')
        })
        .catch(err => {
            res.status(418).send(err)
        })
};

exports.approveContactRequest = (req, res, next) => {
    const approvingUser = req.user;
    const { targetPhoneNumberToApprove } = req.body;
    ContactRequest
        .approveContactRequest(approvingUser, targetPhoneNumberToApprove)
        .then(_ => {
            res.status(200).send('Contact approved');
        })
        .catch(err => {
            res.status(418).send(err);
        })
};
