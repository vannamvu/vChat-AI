const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  keywords: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    enum: ['general', 'product', 'service', 'pricing', 'support', 'shipping'],
    default: 'general'
  },
  language: {
    type: String,
    default: 'vi'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'file', 'link']
    },
    url: String,
    caption: String
  }],
  quickReplies: [{
    text: String,
    payload: String
  }],
  followUpActions: [{
    action: {
      type: String,
      enum: ['collect_info', 'create_lead', 'escalate', 'schedule_callback']
    },
    parameters: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Text search index for better FAQ matching
FaqSchema.index({ 
  question: 'text', 
  keywords: 'text', 
  answer: 'text' 
});

FaqSchema.index({ category: 1, isActive: 1 });
FaqSchema.index({ priority: -1 });

module.exports = mongoose.model('Faq', FaqSchema);