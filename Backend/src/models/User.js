const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries unless explicitly asked
    },
    role: {
      type: String,
      enum: ['entrepreneur', 'investor'],
      required: [true, 'Role is required'],
    },
    avatarUrl: {
      type: String,
      default: function () {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
      },
    },
    bio: { type: String, default: '', maxlength: 1000 },
    isOnline: { type: Boolean, default: false },

    // ── Entrepreneur-specific fields ──────────────────────────────────────
    startupName:   { type: String, default: '' },
    pitchSummary:  { type: String, default: '' },
    fundingNeeded: { type: String, default: '' },
    industry:      { type: String, default: '' },
    location:      { type: String, default: '' },
    foundedYear:   { type: Number },
    teamSize:      { type: Number, default: 1 },

    // ── Investor-specific fields ──────────────────────────────────────────
    investmentInterests: { type: [String], default: [] },
    investmentStage:     { type: [String], default: [] },
    portfolioCompanies:  { type: [String], default: [] },
    totalInvestments:    { type: Number, default: 0 },
    minimumInvestment:   { type: String, default: '' },
    maximumInvestment:   { type: String, default: '' },

    // ── Password reset ────────────────────────────────────────────────────
    resetPasswordToken:  { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
