const express = require('express');
const settingsController = require('../controllers/settings');
const { tokenVerificationMiddleware, authenticationMiddleware } = require('../config/middlewares');
const router = express.Router();

router.get('/', tokenVerificationMiddleware, authenticationMiddleware,
    settingsController.getAppSettings);

module.exports = router;