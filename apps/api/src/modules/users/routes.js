const express = require('express');
const userController = require('./controller');
const { auth } = require('../../middleware/auth');

const router = express.Router();

router.get('/profile', auth, userController.getProfile);

module.exports = router;
