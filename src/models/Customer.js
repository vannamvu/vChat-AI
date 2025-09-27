const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  facebookId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  profilePic: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  locale: {
    type: String,
    default: 'vi_VN'
  },
  timezone: {
    type: Number,
    default: 7
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  tags: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  leadStatus: {
    type: String,
    enum: ['prospect', 'qualified', 'customer', 'lost'],
    default: 'prospect'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ lastInteraction: -1 });
CustomerSchema.index({ leadStatus: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);