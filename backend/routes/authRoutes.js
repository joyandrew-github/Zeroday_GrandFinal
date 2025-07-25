const express = require('express');
const router = express.Router();
const { registerAdmin, registerStudent, loginUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/admin/register', upload.single('profileImage'), registerAdmin);
router.post('/student/register', protect, admin, upload.single('profileImage'), registerStudent);
router.post('/login', loginUser);

module.exports = router;