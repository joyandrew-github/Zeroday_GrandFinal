const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Complaint = require('../models/Complaint');

// Create complaint with AI categorization (Students)
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Validate required fields
  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  // Call AI model to categorize complaint
  let category = 'other';
  try {
    console.log('Sending AI model request:', { complaint: description });
    const aiResponse = await axios.post(process.env.AI_MODEL_URL, {
      complaint: description,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // 10-second timeout
    });
    console.log('AI model response:', aiResponse.data);

    category = aiResponse.data.label || 'other';
    const validCategories = [
      'cleaning',
      'maintenance',
      'food',
      'noise',
      'staff',
      'water',
      'electricity',
      'wifi issue',
      'room condition',
      'washroom issue',
      'laundry',
      'security',
      'pest control',
      'air conditioning',
      'fan or light not working',
      'bed or furniture damage',
      'mess timing',
      'power backup',
      'waste disposal',
      'drinking water',
      'plumbing',
      'other'
    ];
    if (!validCategories.includes(category)) {
      console.warn(`Invalid category from AI model: ${category}, defaulting to 'other'`);
      category = 'other';
    }
  } catch (error) {
    console.error('AI Model Error:', error.message, error.response?.data || '');
    // Continue with default category if AI fails
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    submittedBy: req.user._id,
  });

  res.status(201).json(complaint);
});

// Get all complaints (Admins) or user's complaints (Students)
const getComplaints = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  let query = {};
  if (req.user.role === 'student') {
    query.submittedBy = req.user._id; // Students see only their complaints
  }
  if (status) query.status = status;
  if (category) query.category = category;

  const complaints = await Complaint.find(query)
    .populate('submittedBy', 'name')
    .sort({ createdAt: -1 });

  res.json(complaints);
});

// Get single complaint by ID (Admins or complaint owner)
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('submittedBy', 'name');
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  if (
    req.user.role === 'student' &&
    complaint.submittedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to view this complaint');
  }
  res.json(complaint);
});

// Update complaint (Admins or complaint owner)
const updateComplaint = asyncHandler(async (req, res) => {
  const { title, description, status } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Authorization: Admins or complaint owner
  if (
    req.user.role === 'student' &&
    complaint.submittedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to update this complaint');
  }

  // Restrict status updates to admins
  if (req.user.role === 'student' && status) {
    res.status(401);
    throw new Error('Students cannot update complaint status');
  }

  // Re-run AI categorization if description changes
  let updatedCategory = complaint.category;
  if (description && description !== complaint.description) {
    try {
      console.log('Sending AI model request for update:', { complaint: description });
      const aiResponse = await axios.post(process.env.AI_MODEL_URL, {
        complaint: description,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      console.log('AI model response for update:', aiResponse.data);

      updatedCategory = aiResponse.data.label || 'other';
      const validCategories = [
        'cleaning',
        'maintenance',
        'food',
        'noise',
        'staff',
        'water',
        'electricity',
        'wifi issue',
        'room condition',
        'washroom issue',
        'laundry',
        'security',
        'pest control',
        'air conditioning',
        'fan or light not working',
        'bed or furniture damage',
        'mess timing',
        'power backup',
        'waste disposal',
        'drinking water',
        'plumbing',
        'other'
      ];
      if (!validCategories.includes(updatedCategory)) {
        console.warn(`Invalid category from AI model: ${updatedCategory}, defaulting to 'other'`);
        updatedCategory = 'other';
      }
    } catch (error) {
      console.error('AI Model Error during update:', error.message, error.response?.data || '');
      // Keep existing category if AI fails
    }
  }

  complaint.title = title || complaint.title;
  complaint.description = description || complaint.description;
  complaint.status = req.user.role === 'admin' ? status || complaint.status : complaint.status;
  complaint.category = updatedCategory;

  await complaint.save();
  res.json(complaint);
});

// Delete complaint (Admins or complaint owner)
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Authorization: Admins or complaint owner
  if (
    req.user.role === 'student' &&
    complaint.submittedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to delete this complaint');
  }

  await complaint.deleteOne();
  res.json({ message: 'Complaint deleted successfully' });
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
};