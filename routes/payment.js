const express = require('express');
const paymentController = require('../controllers/payment');
const { tokenVerificationMiddleware, authenticationMiddleware, messageStatusCallbackMiddleware } = require('../config/middlewares');

const router = express.Router();


router.post('/buy-credits', tokenVerificationMiddleware, authenticationMiddleware,
    paymentController.buyCredits);

module.exports = router;