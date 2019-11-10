const express = require('express');
const callController = require('../controllers/call');
const { tokenVerificationMiddleware, authenticationMiddleware } = require('../config/middlewares');

const router = express.Router();

router.post('/call-user', tokenVerificationMiddleware, authenticationMiddleware,
    callController.callUser);
