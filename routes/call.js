const express = require('express');
const callController = require('../controllers/call');
const { tokenVerificationMiddleware, authenticationMiddleware,
    conversationStatusCallbackMiddleware } = require('../config/middlewares');

const router = express.Router();

router.post('/call-user', tokenVerificationMiddleware, authenticationMiddleware,
    callController.callUser);

router.post('/answer', conversationStatusCallbackMiddleware,
    callController.updateCallStatus);

module.exports = router;