const asyncHandler = require('express-async-handler');
const Timetable = require('../models/Timetable');

// Create or update full timetable (Students only)
const updateTimetable = asyncHandler(async (req, res) => {
  const { schedule } = req.body;

  let timetable = await Timetable.findOne({ user: req.user._id });
  if (timetable) {
    timetable.schedule = schedule;
    await timetable.save();
  } else {
    timetable = await Timetable.create({
      user: req.user._id,
      schedule,
    });
  }

  res.status(201).json(timetable);
});

// Edit a specific class in the timetable (Students only)
const editClass = asyncHandler(async (req, res) => {
  const { day, classIndex, courseName, startTime, endTime, location } = req.body;

  const timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable) {
    res.status(404);
    throw new Error('Timetable not found');
  }

  const daySchedule = timetable.schedule.find((s) => s.day === day);
  if (!daySchedule) {
    res.status(400);
    throw new Error('Day not found in timetable');
  }

  if (classIndex >= daySchedule.classes.length) {
    res.status(400);
    throw new Error('Invalid class index');
  }

  // Update the specific class
  daySchedule.classes[classIndex] = {
    courseName: courseName || daySchedule.classes[classIndex].courseName,
    startTime: startTime || daySchedule.classes[classIndex].startTime,
    endTime: endTime || daySchedule.classes[classIndex].endTime,
    location: location || daySchedule.classes[classIndex].location,
  };

  await timetable.save();
  res.json(timetable);
});

// Get timetable (Students only)
const getTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable) {
    res.status(404);
    throw new Error('Timetable not found');
  }
  res.json(timetable);
});

// Delete class from timetable (Students only)
const deleteClass = asyncHandler(async (req, res) => {
  const { day, classIndex } = req.body;
  const timetable = await Timetable.findOne({ user: req.user._id });

  if (!timetable) {
    res.status(404);
    throw new Error('Timetable not found');
  }

  const daySchedule = timetable.schedule.find((s) => s.day === day);
  if (!daySchedule || classIndex >= daySchedule.classes.length) {
    res.status(400);
    throw new Error('Invalid day or class index');
  }

  daySchedule.classes.splice(classIndex, 1);
  await timetable.save();
  res.json(timetable);
});

module.exports = { updateTimetable, editClass, getTimetable, deleteClass };