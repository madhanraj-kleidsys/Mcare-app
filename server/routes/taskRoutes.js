// routes/tasks.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getTasks } = require('../controllers/taskController');

router.get('/lists',authenticateToken, getTasks);

module.exports = router;
