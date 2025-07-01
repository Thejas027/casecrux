const express = require('express');
const router = express.Router();
const UploadedPdf = require('../models/UploadedPdf');
const BatchSummaryHistory = require('../models/BatchSummaryHistory');
const logger = require('../utils/logger');

// GET /api/all-categories - Get all unique categories from uploaded PDFs and batch summaries
router.get('/all-categories', async (req, res) => {
  try {
    // Get categories from uploaded PDFs
    const pdfCategories = await UploadedPdf.distinct('category');
    
    // Get categories from batch summary history
    const historyCategories = await BatchSummaryHistory.distinct('category');
    
    // Combine and deduplicate categories
    const allCategories = [...new Set([...pdfCategories, ...historyCategories])]
      .filter(category => category && category.trim()) // Remove empty/null categories
      .sort(); // Sort alphabetically
    
    logger.info('Retrieved all categories', { 
      totalCategories: allCategories.length,
      pdfCategories: pdfCategories.length,
      historyCategories: historyCategories.length
    });
    
    res.json({ 
      categories: allCategories,
      count: allCategories.length,
      sources: {
        pdfs: pdfCategories.length,
        history: historyCategories.length
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve categories', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve categories',
      details: error.message 
    });
  }
});

// GET /api/categories-with-counts - Get all categories with document counts
router.get('/categories-with-counts', async (req, res) => {
  try {
    // Aggregate categories with PDF counts
    const pdfCategoryCounts = await UploadedPdf.aggregate([
      { $match: { category: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$category", pdfCount: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get unique categories from batch history
    const historyCategories = await BatchSummaryHistory.distinct('category');
    
    // Create comprehensive category list with counts
    const categoryMap = new Map();
    
    // Add PDF categories with counts
    pdfCategoryCounts.forEach(item => {
      categoryMap.set(item._id, {
        category: item._id,
        pdfCount: item.pdfCount,
        hasHistory: historyCategories.includes(item._id)
      });
    });
    
    // Add history-only categories
    historyCategories.forEach(category => {
      if (category && category.trim() && !categoryMap.has(category)) {
        categoryMap.set(category, {
          category: category,
          pdfCount: 0,
          hasHistory: true
        });
      }
    });
    
    const categoriesWithCounts = Array.from(categoryMap.values())
      .sort((a, b) => a.category.localeCompare(b.category));
    
    logger.info('Retrieved categories with counts', { 
      totalCategories: categoriesWithCounts.length
    });
    
    res.json({ 
      categories: categoriesWithCounts,
      count: categoriesWithCounts.length
    });
  } catch (error) {
    logger.error('Failed to retrieve categories with counts', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve categories with counts',
      details: error.message 
    });
  }
});

module.exports = router;
