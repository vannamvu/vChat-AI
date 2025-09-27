const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  facebookId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'pending', 'escalated'],
    default: 'active'
  },
  assignedAgent: {
    type: String
  },
  messages: [{
    messageId: String,
    text: String,
    attachments: [{
      type: String,
      url: String
    }],
    sender: {
      type: String,
      enum: ['customer', 'bot', 'agent'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['support', 'sales', 'general', 'complaint'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Number // in seconds
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ status: 1 });
ConversationSchema.index({ category: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);