const express = require('express');
const statsController = require('./controller');

const router = express.Router();

router.get('/homepage', statsController.getHomepageStats);

module.exports = router;
