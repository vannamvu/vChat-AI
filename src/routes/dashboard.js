const express = require('express');
const router = express.Router();
const path = require('path');
const ConversationService = require('../services/ConversationService');
const LeadService = require('../services/LeadService');
const FaqService = require('../services/FaqService');

// Dashboard main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// API: Get dashboard statistics
router.get('/api/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get conversation stats
    const conversationStats = await ConversationService.getConversationAnalytics(startOfMonth, today);
    
    // Get lead stats
    const leadStats = await LeadService.getLeadsAnalytics(startOfMonth, today);
    
    // Get FAQ stats
    const faqStats = await FaqService.getFaqAnalytics(startOfMonth, today);
    
    // Get hot leads
    const hotLeads = await LeadService.getHotLeads(5);

    const stats = {
      conversations: {
        total: conversationStats.totalConversations || 0,
        active: conversationStats.activeConversations || 0,
        resolved: conversationStats.resolvedConversations || 0,
        escalated: conversationStats.escalatedConversations || 0,
        avgResponseTime: Math.round(conversationStats.avgResponseTime || 0)
      },
      leads: {
        total: leadStats.summary?.totalLeads || 0,
        new: leadStats.summary?.newLeads || 0,
        qualified: leadStats.summary?.qualifiedLeads || 0,
        closedWon: leadStats.summary?.closedWonLeads || 0,
        conversionRate: Math.round(leadStats.summary?.conversionRate || 0),
        avgScore: Math.round(leadStats.summary?.avgScore || 0)
      },
      faq: {
        totalFaqs: faqStats.categoryStats?.length || 0,
        topFaqs: faqStats.topFaqs || []
      },
      hotLeads: hotLeads
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get recent conversations
router.get('/api/conversations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await ConversationService.getActiveConversations(page, limit);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get recent leads
router.get('/api/leads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await LeadService.getLeads(page, limit);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Conversations management page
router.get('/conversations', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/conversations.html'));
});

// Leads management page
router.get('/leads', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/leads.html'));
});

// FAQ management page
router.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/faq.html'));
});

// Analytics page
router.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/analytics.html'));
});

module.exports = router;