const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../utils/emailService');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
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

  const normalizedEmail = email.toLowerCase().trim();

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
    name,
    email: normalizedEmail,
    password,
    currency,
    monthlyIncome,
    authProvider: 'local',
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    monthlyIncome: user.monthlyIncome,
    profilePicture: user.profilePicture,
    authProvider: user.authProvider,
    token: generateToken(user._id),
  });
});

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error(
      'Please provide email and password'
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (
    user &&
    user.password &&
    (await user.matchPassword(password))
  ) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error(
      'Please provide your email address'
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  // Always return the same message so attackers
  // cannot discover whether an email exists.
  const message =
    'If an account exists with this email, a password reset link has been sent.';

  if (!user) {
    return res.status(200).json({ message });
  }

  // Generate a cryptographically secure random token.
  const resetToken = crypto
    .randomBytes(32)
    .toString('hex');

  // Store only the SHA-256 hash in MongoDB.
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires after 15 minutes.
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

    return res.status(200).json({ message });
  } catch (error) {
    // Clean up token if email delivery fails.
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

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
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

  // Update password.
  user.password = password;

  // Invalidate reset token immediately.
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;

  // User model will hash the password automatically.
  await user.save();

  res.status(200).json({
    message:
      'Password reset successful. Please login with your new password.',
  });
});

// @desc    Authenticate user with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error(
      'Google credential is required'
    );
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error(
      'GOOGLE_CLIENT_ID is not configured'
    );

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

  const emailVerified =
    payload.email_verified;

  if (!googleId || !email) {
    res.status(400);
    throw new Error(
      'Google account information is incomplete'
    );
  }

  if (!emailVerified) {
    res.status(401);
    throw new Error(
      'Google email address is not verified'
    );
  }

  let user = await User.findOne({
    email,
  });

  if (user) {
    // Existing account.
    // Link Google account if it has not been linked yet.
    if (!user.googleId) {
      user.googleId = googleId;
    }

    // Update Google profile picture.
    user.profilePicture = picture;

    // Do not change an existing local account
    // into a Google-only account.
    if (!user.authProvider) {
      user.authProvider = 'local';
    }

    await user.save({
      validateBeforeSave: false,
    });
  } else {
    // Create a new Google account.
    user = await User.create({
      name,
      email,
      password: null,
      googleId,
      profilePicture: picture,
      authProvider: 'google',
      currency: 'INR',
      monthlyIncome: 0,
    });
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    monthlyIncome: user.monthlyIncome,
    profilePicture: user.profilePicture,
    authProvider: user.authProvider,
    token: generateToken(user._id),
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc    Update logged-in user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(
    req.user._id
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name =
    req.body.name || user.name;

  user.currency =
    req.body.currency || user.currency;

  user.monthlyIncome =
    req.body.monthlyIncome ??
    user.monthlyIncome;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    currency: updated.currency,
    monthlyIncome: updated.monthlyIncome,
    profilePicture: updated.profilePicture,
    authProvider: updated.authProvider,
  });
});

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};