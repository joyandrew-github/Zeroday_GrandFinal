const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const cloudinary = require('../config/cloudinary');

// Create announcement with optional image (Admin only)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  const file = req.file;

  let image = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/announcements' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      image = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload announcement image');
    }
  }

  const announcement = await Announcement.create({
    title,
    description,
    category,
    image,
    postedBy: req.user._id,
  });

  res.status(201).json(announcement);
});

// Get all announcements (Students and Admins)
const getAnnouncements = asyncHandler(async (req, res) => {
  const { category, sortBy } = req.query;
  let query = {};
  if (category) query.category = category;

  const sortOptions = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const announcements = await Announcement.find(query)
    .populate('postedBy', 'name')
    .sort(sortOptions);

  res.json(announcements);
});

// Get single announcement by ID (Students and Admins)
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('postedBy', 'name');
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }
  res.json(announcement);
});

// Update announcement with optional image (Admin only)
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  const file = req.file;

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  if (announcement.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this announcement');
  }

  let image = announcement.image;
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/announcements' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      image = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload announcement image');
    }
  }

  announcement.title = title || announcement.title;
  announcement.description = description || announcement.description;
  announcement.category = category || announcement.category;
  announcement.image = image;

  await announcement.save();
  res.json(announcement);
});

// Delete announcement (Admin only)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  if (announcement.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this announcement');
  }

  await announcement.deleteOne();
  res.json({ message: 'Announcement deleted successfully' });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};