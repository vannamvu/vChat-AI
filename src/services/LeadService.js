const Lead = require('../models/Lead');
const Customer = require('../models/Customer');

class LeadService {
  // Create or update lead from conversation
  async createOrUpdateLead(customer, conversation, messageText) {
    try {
      let lead = await Lead.findOne({
        customerId: customer._id,
        status: { $nin: ['closed_won', 'closed_lost'] }
      });

      if (lead) {
        // Update existing lead
        lead.notes.push({
          content: `Tin nhắn mới: ${messageText}`,
          addedBy: 'system',
          addedAt: new Date()
        });
        
        // Update lead score based on engagement
        lead.score = Math.min(100, lead.score + 5);
        
        await lead.save();
        console.log('📈 Updated existing lead:', lead._id);
      } else {
        // Create new lead
        lead = new Lead({
          customerId: customer._id,
          conversationId: conversation._id,
          status: 'new',
          score: this.calculateInitialScore(messageText, customer),
          interestedIn: this.extractInterests(messageText),
          notes: [{
            content: `Lead được tạo từ tin nhắn: ${messageText}`,
            addedBy: 'system',
            addedAt: new Date()
          }]
        });

        await lead.save();
        console.log('✅ Created new lead:', lead._id);

        // Update customer lead status
        customer.leadStatus = 'qualified';
        await customer.save();
      }

      return lead;
    } catch (error) {
      console.error('❌ Error creating/updating lead:', error);
      throw error;
    }
  }

  // Calculate initial lead score based on message content and customer data
  calculateInitialScore(messageText, customer) {
    let score = 50; // Base score

    const highValueKeywords = ['mua', 'đặt hàng', 'báo giá', 'hợp đồng', 'ký kết'];
    const mediumValueKeywords = ['quan tâm', 'tư vấn', 'thông tin', 'liên hệ'];
    const urgentKeywords = ['gấp', 'ngay', 'sớm', 'khẩn cấp'];

    // Check message keywords
    const message = messageText.toLowerCase();
    
    if (highValueKeywords.some(keyword => message.includes(keyword))) {
      score += 30;
    } else if (mediumValueKeywords.some(keyword => message.includes(keyword))) {
      score += 15;
    }

    if (urgentKeywords.some(keyword => message.includes(keyword))) {
      score += 20;
    }

    // Customer engagement score
    if (customer.totalMessages > 5) {
      score += 10;
    }
    
    if (customer.phone || customer.email) {
      score += 10;
    }

    return Math.min(100, score);
  }

  // Extract interests from message text
  extractInterests(messageText) {
    const interests = [];
    const message = messageText.toLowerCase();

    const serviceKeywords = {
      'website': ['website', 'web', 'trang web'],
      'mobile_app': ['app', 'ứng dụng', 'mobile', 'ios', 'android'],
      'chatbot': ['chatbot', 'bot', 'tự động'],
      'cloud': ['cloud', 'server', 'hosting'],
      'ai': ['ai', 'trí tuệ nhân tạo', 'machine learning']
    };

    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        interests.push({
          service: service,
          category: 'technology'
        });
      }
    }

    return interests;
  }

  // Update lead information
  async updateLead(leadId, updates) {
    try {
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { $set: updates },
        { new: true }
      );

      if (!lead) {
        throw new Error('Lead not found');
      }

      console.log('✅ Lead updated:', leadId);
      return lead;
    } catch (error) {
      console.error('❌ Error updating lead:', error);
      throw error;
    }
  }

  // Add note to lead
  async addLeadNote(leadId, noteContent, addedBy = 'system') {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }

      lead.notes.push({
        content: noteContent,
        addedBy: addedBy,
        addedAt: new Date()
      });

      await lead.save();
      console.log('📝 Added note to lead:', leadId);
      return lead;
    } catch (error) {
      console.error('❌ Error adding lead note:', error);
      throw error;
    }
  }

  // Update lead contact information
  async updateLeadContact(leadId, contactInfo) {
    try {
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { 
          $set: { 
            contactInfo: { ...lead.contactInfo, ...contactInfo },
            score: Math.min(100, lead.score + 15) // Boost score when contact info provided
          }
        },
        { new: true }
      );

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Also update customer record
      if (contactInfo.phone || contactInfo.email) {
        await Customer.findByIdAndUpdate(lead.customerId, {
          $set: {
            phone: contactInfo.phone || undefined,
            email: contactInfo.email || undefined
          }
        });
      }

      console.log('📞 Updated lead contact info:', leadId);
      return lead;
    } catch (error) {
      console.error('❌ Error updating lead contact:', error);
      throw error;
    }
  }

  // Close lead with reason
  async closeLead(leadId, status, reason) {
    try {
      const validCloseStatuses = ['closed_won', 'closed_lost'];
      
      if (!validCloseStatuses.includes(status)) {
        throw new Error('Invalid close status');
      }

      const lead = await Lead.findByIdAndUpdate(
        leadId,
        {
          $set: {
            status: status,
            closedAt: new Date(),
            closedReason: reason
          }
        },
        { new: true }
      );

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Update customer status
      const customerStatus = status === 'closed_won' ? 'customer' : 'lost';
      await Customer.findByIdAndUpdate(lead.customerId, {
        $set: { leadStatus: customerStatus }
      });

      console.log(`🎯 Lead ${status}:`, leadId);
      return lead;
    } catch (error) {
      console.error('❌ Error closing lead:', error);
      throw error;
    }
  }

  // Get leads with pagination and filters
  async getLeads(page = 1, limit = 20, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      
      // Build query from filters
      const query = {};
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.minScore) {
        query.score = { $gte: parseInt(filters.minScore) };
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }

      const leads = await Lead.find(query)
        .populate('customerId', 'firstName lastName facebookId profilePic phone email')
        .populate('conversationId', 'status lastActivity')
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Lead.countDocuments(query);

      return {
        leads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error getting leads:', error);
      throw error;
    }
  }

  // Get lead by ID
  async getLeadById(leadId) {
    try {
      const lead = await Lead.findById(leadId)
        .populate('customerId', 'firstName lastName facebookId profilePic phone email totalMessages')
        .populate('conversationId', 'status lastActivity messages');

      return lead;
    } catch (error) {
      console.error('❌ Error getting lead by ID:', error);
      throw error;
    }
  }

  // Get leads analytics
  async getLeadsAnalytics(startDate, endDate) {
    try {
      const matchStage = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const analytics = await Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            newLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
            },
            qualifiedLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] }
            },
            closedWonLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
            },
            closedLostLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'closed_lost'] }, 1, 0] }
            },
            avgScore: { $avg: '$score' },
            totalDealValue: { $sum: '$dealValue.amount' }
          }
        }
      ]);

      // Get conversion rate
      const result = analytics[0] || {};
      const totalClosed = (result.closedWonLeads || 0) + (result.closedLostLeads || 0);
      result.conversionRate = totalClosed > 0 ? (result.closedWonLeads / totalClosed * 100) : 0;

      // Get leads by status for chart
      const statusBreakdown = await Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        summary: result,
        statusBreakdown
      };
    } catch (error) {
      console.error('❌ Error getting leads analytics:', error);
      throw error;
    }
  }

  // Get hot leads (high score, recent activity)
  async getHotLeads(limit = 10) {
    try {
      const hotLeads = await Lead.find({
        status: { $nin: ['closed_won', 'closed_lost'] },
        score: { $gte: 70 }
      })
      .populate('customerId', 'firstName lastName facebookId profilePic')
      .sort({ score: -1, createdAt: -1 })
      .limit(limit);

      return hotLeads;
    } catch (error) {
      console.error('❌ Error getting hot leads:', error);
      return [];
    }
  }

  // Schedule follow-up for lead
  async scheduleFollowUp(leadId, followUpDate, note) {
    try {
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        {
          $set: { followUpDate: new Date(followUpDate) },
          $push: {
            notes: {
              content: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}: ${note}`,
              addedBy: 'system',
              addedAt: new Date()
            }
          }
        },
        { new: true }
      );

      if (!lead) {
        throw new Error('Lead not found');
      }

      console.log('📅 Follow-up scheduled for lead:', leadId);
      return lead;
    } catch (error) {
      console.error('❌ Error scheduling follow-up:', error);
      throw error;
    }
  }
}

module.exports = new LeadService();