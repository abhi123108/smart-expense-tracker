const asyncHandler = require('express-async-handler');
const streamifier = require('streamifier');

const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please select an image');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const uploadFromBuffer = () =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'expenseai/profile-pictures',
          public_id: `user_${user._id}`,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

  try {
    const result = await uploadFromBuffer();

    user.profilePicture = result.secure_url;
    user.profilePictureSource = 'custom';

    await user.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      message: 'Profile photo updated successfully',
      profilePicture: user.profilePicture,
      profilePictureSource: user.profilePictureSource,
    });
  } catch (error) {
    console.error(
      'Profile photo upload failed:',
      error
    );

    res.status(500);
    throw new Error(
      'Unable to upload profile photo'
    );
  }
});

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // If Google account exists, restore Google photo.
  if (user.googleId) {
    user.profilePicture = null;
    user.profilePictureSource = null;

    await user.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      message: 'Custom profile photo removed',
      profilePicture: user.profilePicture,
      profilePictureSource: user.profilePictureSource,
    });

    return;
  }

  user.profilePicture = null;
  user.profilePictureSource = null;

  await user.save({
    validateBeforeSave: false,
  });

  res.status(200).json({
    message: 'Profile photo removed',
    profilePicture: null,
    profilePictureSource: null,
  });
});

module.exports = {
  uploadProfilePhoto,
  removeProfilePhoto,
};