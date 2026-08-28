const asyncHandler = require("express-async-handler");
const streamifier = require("streamifier");

const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// =====================================================
// UPLOAD PROFILE PHOTO
// =====================================================

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  // Check uploaded file
  if (!req.file) {
    res.status(400);
    throw new Error("Please select an image");
  }

  // Find logged-in user
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const uploadFromBuffer = () =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "expenseai/profile-pictures",
          public_id: `user_${user._id}`,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier
        .createReadStream(req.file.buffer)
        .pipe(stream);
    });

  try {
    // Upload image to Cloudinary
    const result = await uploadFromBuffer();

    // Save Cloudinary URL in MongoDB
    user.profilePicture = result.secure_url;
    user.profilePictureSource = "custom";

    await user.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      message: "Profile photo updated successfully",
      profilePicture: user.profilePicture,
      profilePictureSource: user.profilePictureSource,
    });
  } catch (error) {
    // Detailed backend error for debugging
    console.error(
      "========== PROFILE UPLOAD ERROR =========="
    );

    console.error("message:", error.message);
    console.error("name:", error.name);
    console.error("http_code:", error.http_code);
    console.error("full error:", error);

    console.error(
      "=========================================="
    );

    res.status(500);

    throw new Error(
      error.message || "Unable to upload profile photo"
    );
  }
});

// =====================================================
// REMOVE PROFILE PHOTO
// =====================================================

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Remove profile photo
  user.profilePicture = null;
  user.profilePictureSource = null;

  await user.save({
    validateBeforeSave: false,
  });

  res.status(200).json({
    message: "Profile photo removed",
    profilePicture: null,
    profilePictureSource: null,
  });
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  uploadProfilePhoto,
  removeProfilePhoto,
};