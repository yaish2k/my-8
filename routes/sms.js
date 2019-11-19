const express = require('express');
const smsController = require('../controllers/sms');
const { tokenVerificationMiddleware, authenticationMiddleware, messageStatusCallbackMiddleware } = require('../config/middlewares');

const router = express.Router();

router.post('/send-sms-to-user', tokenVerificationMiddleware, authenticationMiddleware,
    smsController.sendSmsToUser);

router.post('/sms-status', messageStatusCallbackMiddleware,
    smsController.updateSmsStatus);

module.exports = router;