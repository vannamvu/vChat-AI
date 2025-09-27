const Faq = require('../models/Faq');

class FaqService {
  // Find best matching FAQ for user message
  async findBestMatch(messageText, minScore = 0.3) {
    try {
      if (!messageText || messageText.trim().length === 0) {
        return null;
      }

      const searchText = messageText.toLowerCase().trim();
      
      // First try text search index
      const textSearchResults = await Faq.find(
        {
          $text: { $search: searchText },
          isActive: true
        },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" }, priority: -1 });

      if (textSearchResults.length > 0) {
        return textSearchResults[0];
      }

      // If no text search results, try keyword matching
      const keywordResults = await Faq.find({
        isActive: true,
        keywords: { $in: [new RegExp(searchText, 'i')] }
      }).sort({ priority: -1, usageCount: -1 });

      if (keywordResults.length > 0) {
        return keywordResults[0];
      }

      // Fallback: fuzzy matching with keywords
      const allFaqs = await Faq.find({ isActive: true }).sort({ priority: -1 });
      
      let bestMatch = null;
      let bestScore = 0;

      for (const faq of allFaqs) {
        const score = this.calculateSimilarity(searchText, faq);
        if (score > bestScore && score >= minScore) {
          bestScore = score;
          bestMatch = faq;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('❌ Error finding FAQ match:', error);
      return null;
    }
  }

  // Calculate similarity score between message and FAQ
  calculateSimilarity(messageText, faq) {
    const message = messageText.toLowerCase();
    let maxScore = 0;

    // Check question similarity
    const questionScore = this.getTextSimilarity(message, faq.question.toLowerCase());
    maxScore = Math.max(maxScore, questionScore);

    // Check keyword matches
    for (const keyword of faq.keywords) {
      if (message.includes(keyword.toLowerCase())) {
        maxScore = Math.max(maxScore, 0.8); // High score for exact keyword match
      }
      
      const keywordScore = this.getTextSimilarity(message, keyword.toLowerCase());
      maxScore = Math.max(maxScore, keywordScore);
    }

    return maxScore;
  }

  // Simple text similarity calculation
  getTextSimilarity(text1, text2) {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
        matches++;
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  // Get FAQs by category
  async getFaqByCategory(category, limit = 10) {
    try {
      const faqs = await Faq.find({
        category: category,
        isActive: true
      })
      .sort({ priority: -1, usageCount: -1 })
      .limit(limit);

      return faqs;
    } catch (error) {
      console.error('❌ Error getting FAQ by category:', error);
      return [];
    }
  }

  // Create new FAQ
  async createFaq(faqData) {
    try {
      const faq = new Faq(faqData);
      await faq.save();
      
      console.log('✅ Created new FAQ:', faq.question);
      return faq;
    } catch (error) {
      console.error('❌ Error creating FAQ:', error);
      throw error;
    }
  }

  // Update FAQ
  async updateFaq(faqId, updates) {
    try {
      const faq = await Faq.findByIdAndUpdate(faqId, updates, { new: true });
      
      if (!faq) {
        throw new Error('FAQ not found');
      }

      console.log('✅ Updated FAQ:', faq.question);
      return faq;
    } catch (error) {
      console.error('❌ Error updating FAQ:', error);
      throw error;
    }
  }

  // Delete FAQ
  async deleteFaq(faqId) {
    try {
      const faq = await Faq.findByIdAndDelete(faqId);
      
      if (!faq) {
        throw new Error('FAQ not found');
      }

      console.log('✅ Deleted FAQ:', faq.question);
      return true;
    } catch (error) {
      console.error('❌ Error deleting FAQ:', error);
      throw error;
    }
  }

  // Get all FAQs with pagination
  async getAllFaqs(page = 1, limit = 20, category = null) {
    try {
      const skip = (page - 1) * limit;
      const filter = category ? { category, isActive: true } : { isActive: true };
      
      const faqs = await Faq.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Faq.countDocuments(filter);

      return {
        faqs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error getting all FAQs:', error);
      throw error;
    }
  }

  // Get FAQ analytics
  async getFaqAnalytics(startDate, endDate) {
    try {
      const analytics = await Faq.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$category',
            totalFaqs: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            avgUsage: { $avg: '$usageCount' },
            mostUsed: { $max: '$usageCount' }
          }
        },
        {
          $sort: { totalUsage: -1 }
        }
      ]);

      const topFaqs = await Faq.find({
        isActive: true,
        usageCount: { $gt: 0 }
      })
      .sort({ usageCount: -1 })
      .limit(10)
      .select('question usageCount category');

      return {
        categoryStats: analytics,
        topFaqs
      };
    } catch (error) {
      console.error('❌ Error getting FAQ analytics:', error);
      throw error;
    }
  }

  // Seed initial FAQs for demo
  async seedInitialFaqs() {
    try {
      const existingFaqs = await Faq.countDocuments();
      
      if (existingFaqs > 0) {
        console.log('📚 FAQs already exist, skipping seed');
        return;
      }

      const initialFaqs = [
        {
          question: 'Công ty Nam Việt IT cung cấp những dịch vụ gì?',
          answer: 'Nam Việt IT chuyên cung cấp các dịch vụ:\n\n📱 Phát triển ứng dụng mobile (iOS, Android)\n💻 Thiết kế website, ứng dụng web\n🤖 Giải pháp AI và Chatbot\n☁️ Dịch vụ Cloud và DevOps\n🔧 Tư vấn và bảo trì hệ thống IT\n\n📞 Liên hệ: 0971.735.735 để tư vấn chi tiết!',
          keywords: ['dịch vụ', 'cung cấp', 'làm gì', 'chuyên về'],
          category: 'general',
          priority: 10
        },
        {
          question: 'Bảng giá dịch vụ của Nam Việt IT như thế nào?',
          answer: 'Giá dịch vụ tùy thuộc vào yêu cầu cụ thể:\n\n💻 Website cơ bản: 5-15 triệu VNĐ\n📱 App mobile: 50-200 triệu VNĐ\n🤖 Chatbot: 10-50 triệu VNĐ\n☁️ Cloud setup: 3-20 triệu VNĐ\n\n*Giá chỉ mang tính tham khảo*\n\n📞 Liên hệ 0971.735.735 để báo giá chính xác!',
          keywords: ['giá', 'bảng giá', 'chi phí', 'báo giá', 'giá cả'],
          category: 'pricing',
          priority: 9
        },
        {
          question: 'Làm sao để liên hệ với Nam Việt IT?',
          answer: '📞 **Thông tin liên hệ Nam Việt IT:**\n\n🌐 Website: https://namvietit.com.vn\n📱 Hotline: 0971.735.735\n📧 Email: info@namvietit.com.vn\n📍 Địa chỉ: [Cần cập nhật địa chỉ]\n\n🕒 Thời gian làm việc: 8:00 - 18:00 (T2-T7)\n\nChúng tôi luôn sẵn sàng hỗ trợ bạn! 🤝',
          keywords: ['liên hệ', 'hotline', 'điện thoại', 'email', 'địa chỉ'],
          category: 'general',
          priority: 8
        },
        {
          question: 'Thời gian hoàn thành dự án như thế nào?',
          answer: 'Thời gian hoàn thành tùy thuộc vào quy mô dự án:\n\n⚡ Website đơn giản: 1-2 tuần\n💻 Website phức tạp: 1-3 tháng\n📱 App mobile: 2-6 tháng\n🤖 Chatbot: 1-4 tuần\n☁️ Cloud migration: 2-8 tuần\n\nChúng tôi cam kết đúng timeline và chất lượng!\n\n📞 Gọi 0971.735.735 để lên kế hoạch cụ thể.',
          keywords: ['thời gian', 'hoàn thành', 'bao lâu', 'timeline', 'dự án'],
          category: 'general',
          priority: 7
        },
        {
          question: 'Nam Việt IT có hỗ trợ bảo hành không?',
          answer: '✅ **Chế độ bảo hành Nam Việt IT:**\n\n🔧 Bảo hành lỗi kỹ thuật: 12 tháng\n🆘 Hỗ trợ 24/7 trong thời gian bảo hành\n🔄 Cập nhật và bảo trì định kỳ\n📞 Hotline hỗ trợ: 0971.735.735\n\nChúng tôi cam kết chất lượng và hỗ trợ tận tình!',
          keywords: ['bảo hành', 'hỗ trợ', 'sau bán', 'bảo trì'],
          category: 'support',
          priority: 6
        }
      ];

      for (const faqData of initialFaqs) {
        await this.createFaq(faqData);
      }

      console.log('✅ Seeded initial FAQs successfully');
    } catch (error) {
      console.error('❌ Error seeding FAQs:', error);
    }
  }
}

module.exports = new FaqService();