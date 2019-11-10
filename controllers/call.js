const mongoose = require('mongoose');
const Call = mongoose.model('Call');

exports.callUser = (req, res, next) => {
    const callingUser = req.user;
    const { targetPhoneNumberToCall,
        textToSpeach } = req.body;
    Call.callUser(callingUser,
        targetPhoneNumberToCall,
        textToSpeach)
        .then(_ => {
            res.status(201).send('Call has been sent');
        })
        .catch(err => {
            res.status(418).send(err.message);
        })

}
