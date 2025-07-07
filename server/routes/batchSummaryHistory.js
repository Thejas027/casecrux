const express = require('express');
const router = express.Router();
const BatchSummaryHistory = require('../models/BatchSummaryHistory');

// Get all batch summaries
router.get('/batch-summary-history', async (req, res) => {
  try {
    const history = await BatchSummaryHistory.find().sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch batch summary history' });
  }
});

// Get batch summaries by category
router.get('/batch-summary-history/category/:category', async (req, res) => {
  try {
    const history = await BatchSummaryHistory.find({ 
      category: req.params.category 
    }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch batch summary history by category' });
  }
});

// Get a specific batch summary
router.get('/batch-summary-history/:id', async (req, res) => {
  try {
    const summary = await BatchSummaryHistory.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Batch summary not found' });
    }
    res.json(summary);
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to fetch batch summary' });
  }
});

// Create a new batch summary
router.post('/batch-summary-history', async (req, res) => {
  try {
    const { category, summary, pdfUrls, pdfNames } = req.body;
    
    if (!category || !summary) {
      return res.status(400).json({ error: 'Category and summary are required' });
    }
    
    const newBatchSummary = new BatchSummaryHistory({
      category,
      summary,
      pdfUrls: pdfUrls || [],
      pdfNames: pdfNames || []
    });
    
    const savedSummary = await newBatchSummary.save();
    res.status(201).json(savedSummary);
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to create batch summary' });
  }
});

// Add a translation to a batch summary
router.post('/batch-summary-history/:id/translations', async (req, res) => {
  try {
    const { language, text } = req.body;
    
    if (!language || !text) {
      return res.status(400).json({ error: 'Language and text are required' });
    }
    
    const batchSummary = await BatchSummaryHistory.findById(req.params.id);
    if (!batchSummary) {
      return res.status(404).json({ error: 'Batch summary not found' });
    }
    
    // Add or update translation
    const existingIndex = batchSummary.translations.findIndex(
      t => t.language === language
    );
    
    if (existingIndex >= 0) {
      // Update existing translation
      batchSummary.translations[existingIndex].text = text;
    } else {
      // Add new translation
      batchSummary.translations.push({ language, text });
    }
    
    await batchSummary.save();
    res.json(batchSummary);
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to add translation' });
  }
});

// Delete a batch summary
router.delete('/batch-summary-history/:id', async (req, res) => {
  try {
    const result = await BatchSummaryHistory.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Batch summary not found' });
    }
    res.json({ success: true });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to delete batch summary' });
  }
});

module.exports = router;
