const config = require('./index');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { FirebaseAdmin } = require('../utils/firebase')

exports.tokenVerificationMiddleware = (req, res, next) => {
    return next();
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }
    FirebaseAdmin.verifyIdToken(token)
        .then(decodedToken => {
            req.userTokenId = decodedToken.uid || decodedToken.id;
            return next()
        })
        .catch(err => {
            return res.status(401).send("Access denied. Token verfication failed");
        })
}

exports.authenticationMiddleware = (req, res, next) => {
    // const userId = req.userTokenId;
    const userId = 'WbgU62Fx4eQDfEV7f8ZcjUHUmGa2';
    FirebaseAdmin.getUser(userId)
        .then(userRecord => {
            const userData = userRecord.toJSON();
            const { phoneNumber } = userData;
            return User.getUserByPhoneNumber(phoneNumber);
        })
        .then(user => {
            req.user = user;
            return next();
        })
        .catch(err => {
            return res.status(404).send("User not found.");
        })

}

