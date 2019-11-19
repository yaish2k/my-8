const config = require('./index');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const SMS = mongoose.model('SMS')
const Call = mongoose.model('Call');
const { FirebaseAdmin } = require('../utils/firebase');

exports.asyncMiddleware = (controllerFn) => {
    return (req, res, next) => {
        controllerFn(req, res, next).catch(err => {
            next(err);
        });
    }
}
exports.tokenVerificationMiddleware = (req, res, next) => {
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
    const userId = req.userTokenId;
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
        });

}

exports.messageStatusCallbackMiddleware = async (req, res, next) => {
    const { messageId, status } = req.body
    try {
        const messageInstance = await SMS.getSmsByMessageId(messageId);
        if (messageInstance && status === 'accepted') {
            req.messageInstance = messageInstance;
            return next();
        } else {
            return res.sendStatus(200);
        }
    } catch (err) {
        return res.sendStatus(200);
    }
}

exports.conversationStatusCallbackMiddleware = async (req, res, next) => {
    const { conversation_uuid, status } = req.body;
    try {
        const callInstance = await Call.getCallByConversationId(conversation_uuid);
        if (callInstance && status === 'answered') {
            req.callInstance = callInstance;
            return next();
        } else {
            return res.sendStatus(200);
        }
    } catch (err) {
        return res.sendStatus(200);
    }
}
