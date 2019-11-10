const mongoose = require('mongoose');
const User = mongoose.model('User');
const ContactRequest = mongoose.model('ContactRequest');

exports.createUser = (req, res, next) => {
    const body = req.body;
    User.createUser(body)
        .then(_ => {
            res.sendStatus(201);
        })
        .catch(err => {
            res.status(418).send(err.message);
        });
};

exports.editUser = (req, res, next) => {
    const fieldsToUpdate = req.body;
    User.editUser(req.user.id, fieldsToUpdate)
        .then(_ => res.sendStatus(200))
        .catch(err => res.status(418).send(err.message));
};

exports.getUserInformation = async (req, res, next) => {
    try {
        const user = req.user;
        const userWaitingList = await ContactRequest
            .getUserWaitingList(user.id);
        const userPendingList = await ContactRequest
            .getUserPendingList(user.phone_number);
        const userInformation = await User
            .getUserInformation(user.id);

        res.status(200).send(
            User.serialize(userInformation, userPendingList, userWaitingList)
        )
    } catch (err) {
        res.status(418).send(err.message);
    }

};

exports.removeContact = (req, res, next) => {
    const user = req.user;
    const { contactId } = req.body
    user.removeContact(contactId)
        .then(_ => {
            res.status(200).send('Deleted');
        })
        .catch(err => {
            res.status(418).send(err.message);
        });

}




