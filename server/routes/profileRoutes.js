const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getProfileData, resetPassword } = require('../controllers/profileController');

// GET for profile
router.get('/getProfileData', authenticateToken, getProfileData);

// POST for password reset (Safe)
router.post('/resetPassword', authenticateToken, resetPassword);

module.exports = router;