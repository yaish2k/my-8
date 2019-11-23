const express = require('express');
const contactRequestController = require('../controllers/contact-request');
const { tokenVerificationMiddleware, authenticationMiddleware } = require('../config/middlewares');
const router = express.Router();

router.post('/create-contact-request', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.createContactRequest);

router.post('/approve-contact-request', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.approveContactRequest);
    
router.post('/decline-contact-request', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.declineContactRequest);

router.post('/remove-request-from-waiting-list', tokenVerificationMiddleware, authenticationMiddleware,
    contactRequestController.removeRequestFromWaitingList)

module.exports = router;