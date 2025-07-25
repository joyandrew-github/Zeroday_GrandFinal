// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const cloudinary = require('../config/cloudinary');
// const asyncHandler = require('express-async-handler');

// // Register Admin
// const registerAdmin = asyncHandler(async (req, res) => {
//   const { name, email, phoneNo, password, adminSecretKey } = req.body;
//   const file = req.file;

//   if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
//     res.status(401);
//     throw new Error('Invalid admin secret key');
//   }

//   let profileImage = '';
//   if (file) {
//     try {
//       const result = await new Promise((resolve, reject) => {
//         cloudinary.uploader.upload_stream(
//           { folder: 'campuslink/profiles' },
//           (error, result) => {
//             if (error) reject(error);
//             resolve(result);
//           }
//         ).end(file.buffer);
//       });
//       profileImage = result.secure_url;
//     } catch (error) {
//       console.error('Cloudinary Upload Error:', error);
//       res.status(500);
//       throw new Error('Failed to upload profile image');
//     }
//   }

//   const userExists = await User.findOne({ email });
//   if (userExists) {
//     res.status(400);
//     throw new Error('User already exists');
//   }

//   const user = await User.create({
//     name,
//     email,
//     phoneNo,
//     password,
//     role: 'admin',
//     adminSecretKey,
//     profileImage,
//   });

//   if (user) {
//     const token = generateToken(user._id, user.role);
//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       token,
//     });
//   } else {
//     res.status(400);
//     throw new Error('Invalid user data');
//   }
// });

// // Register Student (Admin only)
// const registerStudent = asyncHandler(async (req, res) => {
//   const { name, email, phoneNo, password, rollNo, dept, year, accommodation } = req.body;
//   const file = req.file;

//   let profileImage = '';
//   if (file) {
//     try {
//       const result = await new Promise((resolve, reject) => {
//         cloudinary.uploader.upload_stream(
//           { folder: 'campuslink/profiles' },
//           (error, result) => {
//             if (error) reject(error);
//             resolve(result);
//           }
//         ).end(file.buffer);
//       });
//       profileImage = result.secure_url;
//     } catch (error) {
//       console.error('Cloudinary Upload Error:', error);
//       res.status(500);
//       throw new Error('Failed to upload profile image');
//     }
//   }

//   const userExists = await User.findOne({ email });
//   if (userExists) {
//     res.status(400);
//     throw new Error('User already exists');
//   }

//   const rollNoExists = await User.findOne({ rollNo });
//   if (rollNoExists) {
//     res.status(400);
//     throw new Error('Roll number already exists');
//   }

//   const user = await User.create({
//     name,
//     email,
//     phoneNo,
//     password,
//     role: 'student',
//     rollNo,
//     dept,
//     year,
//     accommodation,
//     profileImage,
//   });

//   if (user) {
//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//     });
//   } else {
//     res.status(400);
//     throw new Error('Invalid student data');
//   }
// });

// // Login User
// const loginUser = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });
//   if (user && (await user.matchPassword(password))) {
//     const token = generateToken(user._id, user.role);
//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       token,
//     });
//   } else {
//     res.status(401);
//     throw new Error('Invalid email or password');
//   }
// });

// // Generate JWT
// const generateToken = (id, role) => {
//   return jwt.sign({ id, role }, process.env.JWT_SECRET, {
//     expiresIn: '30d',
//   });
// };

// module.exports = { registerAdmin, registerStudent, loginUser };




const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

// Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, phoneNo, password, adminSecretKey } = req.body;
  const file = req.file;

  // Compare provided adminSecretKey with the plain text ADMIN_SECRET_KEY from .env
  const isSecretKeyValid = await bcrypt.compare(adminSecretKey, await bcrypt.hash(process.env.ADMIN_SECRET_KEY, 10));
  if (!isSecretKeyValid) {
    res.status(401);
    throw new Error('Invalid admin secret key');
  }

  let profileImage = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/profiles' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      profileImage = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload profile image');
    }
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    phoneNo,
    password,
    role: 'admin',
    adminSecretKey, // Will be hashed by the pre('save') hook
    profileImage,
  });

  if (user) {
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Register Student (Admin only)
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, phoneNo, password, rollNo, dept, year, accommodation } = req.body;
  const file = req.file;

  let profileImage = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/profiles' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      profileImage = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload profile image');
    }
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const rollNoExists = await User.findOne({ rollNo });
  if (rollNoExists) {
    res.status(400);
    throw new Error('Roll number already exists');
  }

  const user = await User.create({
    name,
    email,
    phoneNo,
    password,
    role: 'student',
    rollNo,
    dept,
    year,
    accommodation,
    profileImage,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid student data');
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id, user.role);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = { registerAdmin, registerStudent, loginUser };