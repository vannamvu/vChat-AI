const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  source: {
    type: String,
    default: 'facebook_messenger'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  interestedIn: [{
    product: String,
    service: String,
    category: String
  }],
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'VND'
    }
  },
  timeline: {
    type: String,
    enum: ['immediate', 'within_week', 'within_month', 'within_quarter', 'future']
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String,
    company: String,
    position: String
  },
  notes: [{
    content: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followUpDate: {
    type: Date
  },
  assignedTo: {
    type: String
  },
  tags: [{
    type: String
  }],
  dealValue: {
    amount: Number,
    currency: {
      type: String,
      default: 'VND'
    }
  },
  closedAt: {
    type: Date
  },
  closedReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ score: -1 });
LeadSchema.index({ followUpDate: 1 });

module.exports = mongoose.model('Lead', LeadSchema);