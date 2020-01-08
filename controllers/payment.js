const mongoose = require('mongoose');
const PaymentPlan = mongoose.model('PaymentPlan');
const { asyncMiddleware } = require('../config/middlewares');

exports.buyCredits = asyncMiddleware(async (req, res, next) => {
    const buyingUser = req.user;
    const {
        transactionId,
        planType,
        giftType,
        paymentReceipt
    } = req.body;
    await PaymentPlan.buyUserCredits(buyingUser,
        transactionId, planType, giftType, paymentReceipt);
     //todo: gal,pls return new sms/calls balance or tell which api to use to get current balance
    res.status(200).send({text:'ok'});
})