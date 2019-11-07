const express = require('express');
const contactRequestController = require('../controllers/contact-request');
const { tokenVerificationMiddleware, authenticationMiddleware } = require('../config/middlewares');
const router = express.Router();

router.post('/create-contact-request', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.createContactRequest);

router.post('/decline-contact-request', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.declineContactRequest);

router.post('/approve-contact-request', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.approveContactRequest);

module.exports = router;