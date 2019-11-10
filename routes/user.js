const express = require('express');
const userController = require('../controllers/user');
const { tokenVerificationMiddleware, authenticationMiddleware } = require('../config/middlewares');
const router = express.Router();

router.post('/create-user', tokenVerificationMiddleware,
    userController.createUser);

router.post('/edit-user', tokenVerificationMiddleware, authenticationMiddleware,
    userController.editUser);

router.get('/get-user-info', tokenVerificationMiddleware, authenticationMiddleware,
    userController.getUserInformation);

router.post('/remove-contact', tokenVerificationMiddleware, authenticationMiddleware,
    userController.removeContact);

module.exports = router;


