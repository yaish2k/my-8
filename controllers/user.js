const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.createUser = (req, res, next) => {
    const body = req.body;
    User.createUser(body)
        .then(_ => {
            res.sendStatus(201)
        })
        .catch(err => {
            res.status(418).send(err)
        });
};

exports.editUser = (req, res, next) => {
    const fieldsToUpdate = req.body;
    User.editUser(req.user.id, fieldsToUpdate)
        .then(_ => res.sendStatus(200))
        .catch(err => res.status(418).send(err));
};

exports.getUserInformation = (req, res, next) => {
    const user = req.user;
    User.getUserInformation(user.id)
        .then(info => res.status(200).send(info))
        .catch(err => res.status(418).send(err));
};

exports.removeContacts = (req, res, next) => {

}




