const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const MessengerService = require('./MessengerService');

class ConversationService {
  // Get or create customer from Facebook profile
  async getOrCreateCustomer(facebookId) {
    try {
      let customer = await Customer.findOne({ facebookId });

      if (!customer) {
        // Get user profile from Facebook
        const profile = await MessengerService.getUserProfile(facebookId);
        
        if (profile) {
          customer = new Customer({
            facebookId,
            firstName: profile.first_name || 'User',
            lastName: profile.last_name || '',
            profilePic: profile.profile_pic,
            gender: profile.gender,
            locale: profile.locale || 'vi_VN',
            timezone: profile.timezone || 7
          });
        } else {
          // Fallback if profile fetch fails
          customer = new Customer({
            facebookId,
            firstName: 'User',
            lastName: ''
          });
        }

        await customer.save();
        console.log('✅ Created new customer:', customer.firstName);
      }

      return customer;
    } catch (error) {
      console.error('❌ Error getting/creating customer:', error);
      throw error;
    }
  }

  // Get or create conversation for customer
  async getOrCreateConversation(customerId, facebookId) {
    try {
      let conversation = await Conversation.findOne({
        customerId,
        status: { $in: ['active', 'pending'] }
      }).sort({ lastActivity: -1 });

      if (!conversation) {
        conversation = new Conversation({
          customerId,
          facebookId,
          status: 'active',
          messages: []
        });

        await conversation.save();
        console.log('✅ Created new conversation for customer:', customerId);
      }

      return conversation;
    } catch (error) {
      console.error('❌ Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Add message to conversation
  async addMessage(conversationId, messageData) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const message = {
        messageId: messageData.messageId,
        text: messageData.text,
        attachments: messageData.attachments || [],
        sender: messageData.sender,
        timestamp: new Date(),
        isRead: messageData.sender === 'customer' ? false : true
      };

      conversation.messages.push(message);
      conversation.lastActivity = new Date();

      await conversation.save();

      console.log(`✅ Added ${messageData.sender} message to conversation:`, conversationId);
      return message;
    } catch (error) {
      console.error('❌ Error adding message:', error);
      throw error;
    }
  }

  // Get conversation history
  async getConversationHistory(customerId, limit = 50) {
    try {
      const conversations = await Conversation.find({ customerId })
        .populate('customerId', 'firstName lastName facebookId')
        .sort({ lastActivity: -1 })
        .limit(limit);

      return conversations;
    } catch (error) {
      console.error('❌ Error getting conversation history:', error);
      throw error;
    }
  }

  // Mark conversation as resolved
  async resolveConversation(conversationId, resolvedBy = 'bot') {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.status = 'resolved';
      conversation.assignedAgent = resolvedBy;
      await conversation.save();

      console.log('✅ Conversation resolved:', conversationId);
      return conversation;
    } catch (error) {
      console.error('❌ Error resolving conversation:', error);
      throw error;
    }
  }

  // Escalate conversation to human agent
  async escalateConversation(conversationId, reason = 'Customer request') {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.status = 'escalated';
      conversation.priority = 'high';
      
      // Add system message about escalation
      await this.addMessage(conversationId, {
        text: `Cuộc hội thoại đã được chuyển cho nhân viên hỗ trợ. Lý do: ${reason}`,
        sender: 'bot'
      });

      await conversation.save();

      console.log('⬆️ Conversation escalated:', conversationId);
      return conversation;
    } catch (error) {
      console.error('❌ Error escalating conversation:', error);
      throw error;
    }
  }

  // Get active conversations for dashboard
  async getActiveConversations(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const conversations = await Conversation.find({
        status: { $in: ['active', 'pending', 'escalated'] }
      })
      .populate('customerId', 'firstName lastName facebookId profilePic')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Conversation.countDocuments({
        status: { $in: ['active', 'pending', 'escalated'] }
      });

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error getting active conversations:', error);
      throw error;
    }
  }

  // Get conversation analytics
  async getConversationAnalytics(startDate, endDate) {
    try {
      const matchStage = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const analytics = await Conversation.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            activeConversations: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            resolvedConversations: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            escalatedConversations: {
              $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] }
            },
            avgResponseTime: { $avg: '$responseTime' },
            totalMessages: { $sum: { $size: '$messages' } }
          }
        }
      ]);

      return analytics[0] || {
        totalConversations: 0,
        activeConversations: 0,
        resolvedConversations: 0,
        escalatedConversations: 0,
        avgResponseTime: 0,
        totalMessages: 0
      };
    } catch (error) {
      console.error('❌ Error getting conversation analytics:', error);
      throw error;
    }
  }

  // Update customer information
  async updateCustomerInfo(customerId, updates) {
    try {
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { $set: updates },
        { new: true }
      );

      if (!customer) {
        throw new Error('Customer not found');
      }

      console.log('✅ Customer updated:', customerId);
      return customer;
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      throw error;
    }
  }
}

module.exports = new ConversationService();