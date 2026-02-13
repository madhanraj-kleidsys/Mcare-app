const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { calendarHighlights, calendarEvents, debugAvailableDates} = require('../controllers/calendarController');

router.get('/events', authenticateToken, calendarEvents);
router.get('/highlights', authenticateToken, calendarHighlights);

router.get('/debug-calendar-dates',authenticateToken, debugAvailableDates);

module.exports = router;