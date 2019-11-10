const mongoose = require('mongoose');
const SMS = mongoose.model('SMS');

exports.sendSmsToUser = (req, res, next) => {
    const sendingUser = req.user;
    const { targetPhoneCallToSend,
        smsText } = req.body;
    SMS.sendSmsToUser(sendingUser,
        targetPhoneCallToSend,
        smsText)
        .then(_ => {
            res.status(201).send('SMS has been sent');
        })
        .catch(err => {
            res.status(418).send(err.message);
        })

}
