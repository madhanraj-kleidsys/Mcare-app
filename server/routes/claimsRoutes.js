const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { getClaims } = require('../controllers/claimController');

router.get('/lists', authenticateToken, getClaims);

module.exports = router;