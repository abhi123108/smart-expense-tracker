const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
      default: null,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    profilePictureSource: {
      type: String,
      enum: ['google', 'custom', null],
      default: null,
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    currency: {
      type: String,
      default: 'INR',
    },

    monthlyIncome: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // PASSWORD RESET
    // =====================================================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },

    // =====================================================
    // EMAIL CHANGE OTP
    // =====================================================

    pendingEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    emailChangeOtpHash: {
      type: String,
      default: null,
    },

    emailChangeOtpExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// PASSWORD HASH
// =====================================================

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );

  next();
});

// =====================================================
// PASSWORD MATCH
// =====================================================

userSchema.methods.matchPassword = async function (
  enteredPassword
) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(
    enteredPassword,
    this.password
  );
};

module.exports = mongoose.model('User', userSchema);