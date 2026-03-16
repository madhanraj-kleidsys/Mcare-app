const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAttendanceLogs, punchAttendance } = require('../controllers/attendancetodayController');
const { authenticateToken } = require('../middleware/authMiddleware');

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/attendance/'); // Folder where .jpg is saved
  },
  filename: (req, file, cb) => {
    // Saves as: UserId_Timestamp.jpg (e.g., 1_1771479358.jpg)
    const uniqueSuffix = Date.now();
    cb(null, `${req.user.id}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Routes
router.get('/logs', authenticateToken, getAttendanceLogs);
router.post('/punch', authenticateToken, upload.single('image'), punchAttendance);

module.exports = router;