const express = require('express');
const smsController = require('../controllers/sms');
const { tokenVerificationMiddleware, authenticationMiddleware } = require('../config/middlewares');

const router = express.Router();

router.post('/send-sms-to-user', tokenVerificationMiddleware, authenticationMiddleware,
    smsController.sendSmsToUser);

module.exports = router;