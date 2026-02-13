const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the POST login route
// Endpoint will be: /api/login (depending on how you mount it in app.js)
router.post('/login', authController.login);
router.post('/refresh',authController.refresh);

module.exports = router;