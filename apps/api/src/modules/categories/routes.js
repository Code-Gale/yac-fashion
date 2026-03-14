const express = require('express');
const categoryController = require('./controller');

const router = express.Router();

router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);

module.exports = router;
