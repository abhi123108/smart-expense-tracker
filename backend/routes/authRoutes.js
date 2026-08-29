const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  requestEmailChange,
  verifyEmailChange,
  uploadProfilePhoto,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// =====================================================
// MULTER PROFILE PHOTO UPLOAD
// =====================================================

const uploadDirectory = path.join(
  __dirname,
  '../uploads/profile'
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `profile-${req.user._id}-${Date.now()}${extension}`;

    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only JPG, PNG, WEBP and GIF images are allowed'
      )
    );
  }
};

const uploadProfile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================================
// AUTH
// =====================================================

router.post(
  '/register',
  registerUser
);

router.post(
  '/login',
  loginUser
);

router.post(
  '/google',
  googleLogin
);

// =====================================================
// PASSWORD RESET
// =====================================================

router.post(
  '/forgot-password',
  forgotPassword
);

router.post(
  '/reset-password/:token',
  resetPassword
);

// =====================================================
// PROFILE
// =====================================================

router.get(
  '/profile',
  protect,
  getProfile
);

router.put(
  '/profile',
  protect,
  updateProfile
);

// =====================================================
// CHANGE PASSWORD
// =====================================================

router.put(
  '/change-password',
  protect,
  changePassword
);

// =====================================================
// CHANGE EMAIL
// =====================================================

// Send OTP to new email
router.post(
  '/email-change/request',
  protect,
  requestEmailChange
);

// Verify OTP and change email
router.post(
  '/email-change/verify',
  protect,
  verifyEmailChange
);

// =====================================================
// PROFILE PHOTO
// =====================================================

router.post(
  '/profile/photo',
  protect,
  uploadProfile.single(
    'profilePicture'
  ),
  uploadProfilePhoto
);

module.exports = router;