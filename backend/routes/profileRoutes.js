const express = require('express');

const {
  uploadProfilePhoto,
  removeProfilePhoto,
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post(
  '/photo',
  protect,
  upload.single('profilePicture'),
  uploadProfilePhoto
);

router.delete(
  '/photo',
  protect,
  removeProfilePhoto
);

module.exports = router;