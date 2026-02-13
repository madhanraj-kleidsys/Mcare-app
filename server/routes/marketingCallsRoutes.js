const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { getMarketingCalls } = require('../controllers/marketingCallController');

router.get('/calls', authenticateToken, getMarketingCalls);

module.exports = router;