const express = require('express');
const router = express.Router();
const LeadService = require('../services/LeadService');

// Get all leads with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const filters = {
      status: req.query.status,
      minScore: req.query.minScore,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const result = await LeadService.getLeads(page, limit, filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await LeadService.getLeadById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('❌ Error fetching lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const lead = await LeadService.updateLead(req.params.id, req.body);
    res.json(lead);
  } catch (error) {
    console.error('❌ Error updating lead:', error);
    if (error.message === 'Lead not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add note to lead
router.post('/:id/notes', async (req, res) => {
  try {
    const { content, addedBy } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const lead = await LeadService.addLeadNote(req.params.id, content, addedBy);
    res.json(lead);
  } catch (error) {
    console.error('❌ Error adding note to lead:', error);
    if (error.message === 'Lead not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lead contact information
router.put('/:id/contact', async (req, res) => {
  try {
    const lead = await LeadService.updateLeadContact(req.params.id, req.body);
    res.json(lead);
  } catch (error) {
    console.error('❌ Error updating lead contact:', error);
    if (error.message === 'Lead not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Close lead
router.put('/:id/close', async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!status || !reason) {
      return res.status(400).json({ error: 'Status and reason are required' });
    }

    const lead = await LeadService.closeLead(req.params.id, status, reason);
    res.json(lead);
  } catch (error) {
    console.error('❌ Error closing lead:', error);
    if (error.message === 'Lead not found' || error.message === 'Invalid close status') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule follow-up
router.post('/:id/follow-up', async (req, res) => {
  try {
    const { followUpDate, note } = req.body;
    
    if (!followUpDate) {
      return res.status(400).json({ error: 'Follow-up date is required' });
    }

    const lead = await LeadService.scheduleFollowUp(req.params.id, followUpDate, note || '');
    res.json(lead);
  } catch (error) {
    console.error('❌ Error scheduling follow-up:', error);
    if (error.message === 'Lead not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leads analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const analytics = await LeadService.getLeadsAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('❌ Error fetching leads analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get hot leads
router.get('/hot/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const hotLeads = await LeadService.getHotLeads(limit);
    res.json(hotLeads);
  } catch (error) {
    console.error('❌ Error fetching hot leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;