const axios = require('axios');
const FaqService = require('./FaqService');
const LeadService = require('./LeadService');

class MessengerService {
  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.apiUrl = 'https://graph.facebook.com/v18.0/me/messages';
  }

  // Send message to Facebook user
  async sendMessage(recipientId, message) {
    try {
      const requestBody = {
        recipient: {
          id: recipientId
        },
        message: this.formatMessage(message),
        messaging_type: 'RESPONSE'
      };

      const response = await axios.post(
        `${this.apiUrl}?access_token=${this.accessToken}`,
        requestBody
      );

      console.log('✅ Message sent successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Format message for Facebook API
  formatMessage(message) {
    if (typeof message === 'string') {
      return { text: message };
    }

    const formattedMessage = {};

    if (message.text) {
      formattedMessage.text = message.text;
    }

    if (message.quickReplies && message.quickReplies.length > 0) {
      formattedMessage.quick_replies = message.quickReplies.map(reply => ({
        content_type: 'text',
        title: reply.text,
        payload: reply.payload || reply.text
      }));
    }

    if (message.attachments && message.attachments.length > 0) {
      // Handle attachments (images, videos, etc.)
      const attachment = message.attachments[0];
      formattedMessage.attachment = {
        type: attachment.type,
        payload: {
          url: attachment.url,
          is_reusable: true
        }
      };
      delete formattedMessage.text; // Can't send text with attachments
    }

    if (message.buttons && message.buttons.length > 0) {
      formattedMessage.attachment = {
        type: 'template',
        payload: {
          template_type: 'button',
          text: message.text || 'Chọn một tùy chọn:',
          buttons: message.buttons.map(button => ({
            type: 'postback',
            title: button.text,
            payload: button.payload
          }))
        }
      };
      delete formattedMessage.text;
    }

    return formattedMessage;
  }

  // Process incoming message and generate response
  async processMessage(messageText, customer, conversation) {
    try {
      console.log(`🤖 Processing message: "${messageText}"`);

      // Update customer's last interaction
      customer.lastInteraction = new Date();
      customer.totalMessages += 1;
      await customer.save();

      // Check for FAQ match first
      const faqResponse = await FaqService.findBestMatch(messageText);
      
      if (faqResponse) {
        console.log('📚 Found FAQ match:', faqResponse.question);
        
        // Update FAQ usage
        faqResponse.usageCount += 1;
        faqResponse.lastUsed = new Date();
        await faqResponse.save();

        return this.buildFaqResponse(faqResponse, customer, conversation);
      }

      // Check for lead generation keywords
      const leadKeywords = ['mua', 'giá', 'bán', 'sản phẩm', 'dịch vụ', 'tư vấn', 'báo giá', 'liên hệ'];
      const isLeadQuery = leadKeywords.some(keyword => 
        messageText.toLowerCase().includes(keyword)
      );

      if (isLeadQuery) {
        console.log('💼 Detected lead generation query');
        await LeadService.createOrUpdateLead(customer, conversation, messageText);
        
        return {
          text: `Cảm ơn ${customer.firstName} đã quan tâm! Để tư vấn chính xác nhất, vui lòng cho biết:`,
          quickReplies: [
            { text: '📱 Số điện thoại', payload: 'COLLECT_PHONE' },
            { text: '📧 Email', payload: 'COLLECT_EMAIL' },
            { text: '🏢 Tên công ty', payload: 'COLLECT_COMPANY' },
            { text: '💬 Tư vấn trực tiếp', payload: 'REQUEST_CALLBACK' }
          ]
        };
      }

      // Check for greeting
      const greetings = ['xin chào', 'chào', 'hello', 'hi', 'hey'];
      const isGreeting = greetings.some(greeting => 
        messageText.toLowerCase().includes(greeting)
      );

      if (isGreeting) {
        return {
          text: `Xin chào ${customer.firstName}! 👋\n\nTôi là vChat-AI, trợ lý ảo của Nam Việt IT. Tôi có thể hỗ trợ bạn:`,
          quickReplies: [
            { text: '❓ Câu hỏi thường gặp', payload: 'FAQ_MENU' },
            { text: '💼 Tư vấn dịch vụ', payload: 'SALES_SUPPORT' },
            { text: '📞 Liên hệ hotline', payload: 'CONTACT_INFO' },
            { text: '🆘 Hỗ trợ kỹ thuật', payload: 'TECH_SUPPORT' }
          ]
        };
      }

      // Default response for unmatched messages
      return {
        text: `Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Vui lòng chọn một trong các tùy chọn sau:`,
        quickReplies: [
          { text: '❓ FAQ', payload: 'FAQ_MENU' },
          { text: '👨‍💼 Tư vấn', payload: 'SALES_SUPPORT' },
          { text: '📞 Hotline: 0971.735.735', payload: 'CONTACT_INFO' }
        ]
      };

    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng liên hệ hotline: 0971.735.735 để được hỗ trợ.'
      };
    }
  }

  // Process postback (button clicks)
  async processPostback(payload, customer, conversation) {
    try {
      console.log(`🔘 Processing postback: ${payload}`);

      switch (payload) {
        case 'FAQ_MENU':
          return {
            text: 'Chọn chủ đề bạn muốn tìm hiểu:',
            quickReplies: [
              { text: '💻 Dịch vụ IT', payload: 'FAQ_SERVICES' },
              { text: '💰 Bảng giá', payload: 'FAQ_PRICING' },
              { text: '🚚 Giao hàng', payload: 'FAQ_SHIPPING' },
              { text: '🔧 Hỗ trợ kỹ thuật', payload: 'FAQ_SUPPORT' }
            ]
          };

        case 'SALES_SUPPORT':
          await LeadService.createOrUpdateLead(customer, conversation, 'Yêu cầu tư vấn dịch vụ');
          return {
            text: `Cảm ơn ${customer.firstName}! Để tư vấn tốt nhất, vui lòng cung cấp thông tin:`,
            quickReplies: [
              { text: '📱 Số điện thoại', payload: 'COLLECT_PHONE' },
              { text: '📧 Email', payload: 'COLLECT_EMAIL' },
              { text: '💬 Tư vấn ngay', payload: 'REQUEST_CALLBACK' }
            ]
          };

        case 'CONTACT_INFO':
          return {
            text: `📞 **Nam Việt IT - Thông tin liên hệ**\n\n` +
                  `🏢 Website: https://namvietit.com.vn\n` +
                  `📱 Hotline: 0971.735.735\n` +
                  `📧 Email: info@namvietit.com.vn\n\n` +
                  `🕒 Thời gian làm việc: 8:00 - 18:00 (T2-T7)`
          };

        case 'REQUEST_CALLBACK':
          await LeadService.createOrUpdateLead(customer, conversation, 'Yêu cầu gọi lại');
          return {
            text: `Chúng tôi sẽ liên hệ lại với ${customer.firstName} trong thời gian sớm nhất!\n\n` +
                  `📞 Hoặc gọi trực tiếp: 0971.735.735`
          };

        default:
          if (payload.startsWith('FAQ_')) {
            const category = payload.replace('FAQ_', '').toLowerCase();
            const faqs = await FaqService.getFaqByCategory(category);
            
            if (faqs.length > 0) {
              const faqList = faqs.slice(0, 3).map((faq, index) => 
                `${index + 1}. ${faq.question}`
              ).join('\n');
              
              return {
                text: `Câu hỏi thường gặp về ${category}:\n\n${faqList}\n\nGửi số thứ tự để xem câu trả lời chi tiết.`
              };
            }
          }

          return {
            text: 'Xin lỗi, tôi không hiểu yêu cầu này. Vui lòng chọn lại từ menu.'
          };
      }

    } catch (error) {
      console.error('❌ Error processing postback:', error);
      return {
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
      };
    }
  }

  // Build response for FAQ matches
  buildFaqResponse(faq, customer, conversation) {
    const response = {
      text: faq.answer
    };

    if (faq.quickReplies && faq.quickReplies.length > 0) {
      response.quickReplies = faq.quickReplies;
    }

    if (faq.attachments && faq.attachments.length > 0) {
      response.attachments = faq.attachments;
    }

    return response;
  }

  // Get user profile from Facebook
  async getUserProfile(userId) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.accessToken}`
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting user profile:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new MessengerService();