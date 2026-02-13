const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { getDashboardData } = require('../controllers/homeController');
const { getNotifications } = require('../controllers/notificationController');

// Protect the dashboard route with the middleware
router.get('/dashboard', authenticateToken, getDashboardData);

// GET /api/dashboard/notifications
router.get('/notifications', authenticateToken, getNotifications);

module.exports = router;

// const express = require('express');
// const router = express.Router();

// // 1. Double check this path and the braces {}
// const { authenticateToken } = require('../middleware/authMiddleware'); 

// // 2. Double check this path and the braces {}
// const { getDashboardData } = require('../controllers/homeController');

// // 3. Log them to your terminal to find which one is undefined
// console.log('Auth Middleware:', typeof authenticateToken); // Should be 'function'
// console.log('Dashboard Controller:', typeof getDashboardData); // Should be 'function'

// if (typeof authenticateToken === 'function' && typeof getDashboardData === 'function') {
//     router.get('/dashboard', authenticateToken, getDashboardData);
// } else {
//     console.error("❌ ERROR: One of the route handlers is not a function!");
// }

module.exports = router;