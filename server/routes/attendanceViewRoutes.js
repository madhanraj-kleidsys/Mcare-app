const express = require('express');
const router = express.Router();
const { getEmployeeList, getAttendanceRecords } = require('../controllers/attendanceViewController');
const { authenticateToken } = require('../middleware/authMiddleware');


router.get('/employeeslists', authenticateToken, getEmployeeList);

//fetch lave records 
router.get('/records', authenticateToken, getAttendanceRecords);

module.exports = router;