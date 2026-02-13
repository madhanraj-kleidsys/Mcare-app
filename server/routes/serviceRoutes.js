const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { getServiceRequests } = require('../controllers/serviceRequestController');

router.get('/registered', authenticateToken, getServiceRequests);

module.exports = router;