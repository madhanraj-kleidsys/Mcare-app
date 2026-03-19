const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { getServiceRequests } = require('../controllers/serviceRequestController');

const { getServiceCallView } = require('../controllers/serviceCallViewController');

router.get('/calls', authenticateToken, getServiceRequests);
router.get('/callview/:servReqID', authenticateToken, getServiceCallView);

module.exports = router;