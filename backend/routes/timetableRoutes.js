const express = require('express');
const router = express.Router();
const { updateTimetable, editClass, getTimetable, deleteClass } = require('../controllers/timetableController');
const { protect, student } = require('../middleware/authMiddleware');

router.post('/', protect, student, updateTimetable); // Create or overwrite full schedule
router.put('/class', protect, student, editClass); // Edit specific class
router.get('/', protect, student, getTimetable); // Get timetable
router.delete('/class', protect, student, deleteClass); // Delete class

module.exports = router;