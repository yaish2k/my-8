const mongoose = require('mongoose');
const PaymentPlan = mongoose.model('PaymentPlan');
const { asyncMiddleware } = require('../config/middlewares');

exports.buyCredits = asyncMiddleware(async (req, res, next) => {
    const buyingUser = req.user;
    const {
        transactionId,
        planType,
        giftType,
        paymentReciept
    } = req.body;
    await PaymentPlan.buyUserCredits(buyingUser,
        transactionId, planType, giftType, paymentReciept);
    res.sendStatus(200);
})