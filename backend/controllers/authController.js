const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const {
  sendPasswordResetEmail,
  sendEmailChangeOtp,
} = require('../utils/emailService');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// =====================================================
// HELPER
// =====================================================

const getUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  currency: user.currency,
  monthlyIncome: user.monthlyIncome,
  profilePicture: user.profilePicture,
  authProvider: user.authProvider,
  token: generateToken(user._id),
});

// =====================================================
// REGISTER USER
// =====================================================

const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    currency,
    monthlyIncome,
  } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error(
      'Please provide name, email and password'
    );
  }

  const normalizedEmail = email
    .toLowerCase()
    .trim();

  const userExists = await User.findOne({
    email: normalizedEmail,
  });

  if (userExists) {
    res.status(400);
    throw new Error(
      'User already exists with this email'
    );
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    currency: currency || 'INR',
    monthlyIncome: monthlyIncome || 0,
    authProvider: 'local',
    profilePicture: null,
  });

  res.status(201).json(
    getUserResponse(user)
  );
});

// =====================================================
// LOGIN USER
// =====================================================

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error(
      'Please provide email and password'
    );
  }

  const normalizedEmail = email
    .toLowerCase()
    .trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (
    user &&
    user.password &&
    (await user.matchPassword(password))
  ) {
    res.status(200).json(
      getUserResponse(user)
    );
  } else {
    res.status(401);
    throw new Error(
      'Invalid email or password'
    );
  }
});

// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error(
      'Please provide your email address'
    );
  }

  const normalizedEmail = email
    .toLowerCase()
    .trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  const message =
    'If an account exists with this email, a password reset link has been sent.';

  if (!user) {
    return res.status(200).json({
      message,
    });
  }

  const resetToken = crypto
    .randomBytes(32)
    .toString('hex');

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordExpire =
    Date.now() + 15 * 60 * 1000;

  await user.save({
    validateBeforeSave: false,
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken,
    });

    return res.status(200).json({
      message,
    });
  } catch (error) {
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save({
      validateBeforeSave: false,
    });

    console.error(
      'Password reset email failed:',
      error
    );

    res.status(500);

    throw new Error(
      'Unable to send password reset email. Please try again later.'
    );
  }
});

// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error(
      'Please provide a new password'
    );
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error(
      'Password must be at least 6 characters'
    );
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    res.status(400);
    throw new Error(
      'Password reset link is invalid or has expired'
    );
  }

  user.password = password;

  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;

  await user.save();

  res.status(200).json({
    message:
      'Password reset successful. Please login with your new password.',
  });
});

// =====================================================
// GOOGLE LOGIN
// =====================================================

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error(
      'Google credential is required'
    );
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(500);
    throw new Error(
      'Google authentication is not configured'
    );
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    console.error(
      'Google token verification failed:',
      error.message
    );

    res.status(401);
    throw new Error(
      'Invalid Google credential'
    );
  }

  const payload = ticket.getPayload();

  if (!payload) {
    res.status(401);
    throw new Error(
      'Invalid Google account information'
    );
  }

  const googleId = payload.sub;

  const email = payload.email
    ?.toLowerCase()
    .trim();

  const name =
    payload.name || 'Google User';

  const picture =
    payload.picture || null;

  if (!googleId || !email) {
    res.status(400);
    throw new Error(
      'Google account information is incomplete'
    );
  }

  if (!payload.email_verified) {
    res.status(401);
    throw new Error(
      'Google email address is not verified'
    );
  }

  let user = await User.findOne({
    email,
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (
      picture &&
      user.profilePictureSource !== 'custom'
    ) {
      user.profilePicture = picture;
      user.profilePictureSource = 'google';
    }

    await user.save({
      validateBeforeSave: false,
    });
  } else {
    user = await User.create({
      name,
      email,
      password: null,
      googleId,
      profilePicture: picture,
      profilePictureSource: 'google',
      authProvider: 'google',
      currency: 'INR',
      monthlyIncome: 0,
    });
  }

  res.status(200).json(
    getUserResponse(user)
  );
});

// =====================================================
// GET PROFILE
// =====================================================

const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    currency: req.user.currency,
    monthlyIncome: req.user.monthlyIncome,
    profilePicture: req.user.profilePicture,
    authProvider: req.user.authProvider,
  });
});

// =====================================================
// UPDATE BASIC PROFILE
// =====================================================

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(
    req.user._id
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (
    req.body.name !== undefined &&
    req.body.name.trim()
  ) {
    user.name = req.body.name.trim();
  }

  if (req.body.currency !== undefined) {
    user.currency = req.body.currency;
  }

  if (req.body.monthlyIncome !== undefined) {
    const income = Number(
      req.body.monthlyIncome
    );

    if (Number.isNaN(income) || income < 0) {
      res.status(400);
      throw new Error(
        'Monthly income must be a valid positive number'
      );
    }

    user.monthlyIncome = income;
  }

  await user.save();

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    monthlyIncome: user.monthlyIncome,
    profilePicture: user.profilePicture,
    authProvider: user.authProvider,
  });
});

// =====================================================
// CHANGE PASSWORD
// =====================================================

// @route PUT /api/auth/change-password
// @access Private

const changePassword = asyncHandler(async (req, res) => {
  const {
    oldPassword,
    newPassword,
    confirmPassword,
  } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error(
      'Please provide old and new password'
    );
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error(
      'New password must be at least 6 characters'
    );
  }

  if (
    confirmPassword !== undefined &&
    newPassword !== confirmPassword
  ) {
    res.status(400);
    throw new Error(
      'New password and confirm password do not match'
    );
  }

  const user = await User.findById(
    req.user._id
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Google account without local password
  if (!user.password) {
    res.status(400);
    throw new Error(
      'Password change is not available because this account uses Google authentication'
    );
  }

  const isOldPasswordCorrect =
    await user.matchPassword(oldPassword);

  if (!isOldPasswordCorrect) {
    res.status(401);
    throw new Error(
      'Old password is incorrect'
    );
  }

  if (oldPassword === newPassword) {
    res.status(400);
    throw new Error(
      'New password must be different from old password'
    );
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    message:
      'Password changed successfully',
  });
});

// =====================================================
// REQUEST EMAIL CHANGE OTP
// =====================================================

// @route POST /api/auth/email-change/request
// @access Private

const requestEmailChange = asyncHandler(
  async (req, res) => {
    const { newEmail } = req.body;

    if (!newEmail) {
      res.status(400);
      throw new Error(
        'Please provide a new email address'
      );
    }

    const normalizedEmail = newEmail
      .toLowerCase()
      .trim();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error(
        'Please provide a valid email address'
      );
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      res.status(404);
      throw new Error(
        'User not found'
      );
    }

    if (normalizedEmail === user.email) {
      res.status(400);
      throw new Error(
        'New email must be different from your current email'
      );
    }

    const emailExists = await User.findOne({
      email: normalizedEmail,
      _id: {
        $ne: user._id,
      },
    });

    if (emailExists) {
      res.status(400);
      throw new Error(
        'This email is already registered with another account'
      );
    }

    // Generate 6 digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Store only hash
    const otpHash = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    user.pendingEmail =
      normalizedEmail;

    user.emailChangeOtpHash =
      otpHash;

    // OTP valid for 10 minutes
    user.emailChangeOtpExpire =
      Date.now() + 10 * 60 * 1000;

    await user.save({
      validateBeforeSave: false,
    });

    try {
      await sendEmailChangeOtp({
        to: normalizedEmail,
        name: user.name,
        otp,
      });
    } catch (error) {
      user.pendingEmail = null;
      user.emailChangeOtpHash = null;
      user.emailChangeOtpExpire = null;

      await user.save({
        validateBeforeSave: false,
      });

      console.error(
        'Email change OTP failed:',
        error
      );

      res.status(500);

      throw new Error(
        'Unable to send OTP. Please try again later.'
      );
    }

    res.status(200).json({
      message:
        'OTP sent successfully to your new email address',
    });
  }
);

// =====================================================
// VERIFY EMAIL CHANGE OTP
// =====================================================

// @route POST /api/auth/email-change/verify
// @access Private

const verifyEmailChange = asyncHandler(
  async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
      res.status(400);
      throw new Error(
        'Please enter the OTP'
      );
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      res.status(404);
      throw new Error(
        'User not found'
      );
    }

    if (
      !user.pendingEmail ||
      !user.emailChangeOtpHash ||
      !user.emailChangeOtpExpire
    ) {
      res.status(400);
      throw new Error(
        'No email change request found'
      );
    }

    if (
      user.emailChangeOtpExpire <
      Date.now()
    ) {
      user.pendingEmail = null;
      user.emailChangeOtpHash = null;
      user.emailChangeOtpExpire = null;

      await user.save({
        validateBeforeSave: false,
      });

      res.status(400);
      throw new Error(
        'OTP has expired. Please request a new OTP'
      );
    }

    const otpHash = crypto
      .createHash('sha256')
      .update(String(otp).trim())
      .digest('hex');

    if (
      otpHash !==
      user.emailChangeOtpHash
    ) {
      res.status(400);
      throw new Error(
        'Invalid OTP'
      );
    }

    // Check again before changing email
    const emailExists = await User.findOne({
      email: user.pendingEmail,
      _id: {
        $ne: user._id,
      },
    });

    if (emailExists) {
      user.pendingEmail = null;
      user.emailChangeOtpHash = null;
      user.emailChangeOtpExpire = null;

      await user.save({
        validateBeforeSave: false,
      });

      res.status(400);
      throw new Error(
        'This email is already registered with another account'
      );
    }

    user.email = user.pendingEmail;

    user.pendingEmail = null;
    user.emailChangeOtpHash = null;
    user.emailChangeOtpExpire = null;

    await user.save();

    res.status(200).json({
      message:
        'Email address changed successfully',
      email: user.email,
    });
  }
);

// =====================================================
// UPLOAD PROFILE PHOTO
// =====================================================

const uploadProfilePhoto = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error(
        'Please select an image'
      );
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      res.status(404);
      throw new Error(
        'User not found'
      );
    }

    user.profilePicture =
      `/uploads/profile/${req.file.filename}`;

    user.profilePictureSource =
      'custom';

    await user.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      message:
        'Profile photo updated successfully',
      profilePicture:
        user.profilePicture,
    });
  }
);

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
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
};