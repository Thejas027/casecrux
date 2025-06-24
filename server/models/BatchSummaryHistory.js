const mongoose = require('mongoose');

const BatchSummaryHistorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  summary: {
    pros: [String],
    cons: [String],
    final_judgment: String,
    raw: String
  },
  pdfUrls: [String], // URLs of the PDFs that were summarized
  pdfNames: [String], // Names of the PDFs that were summarized
  translations: [{
    language: String,
    text: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BatchSummaryHistory = mongoose.model('BatchSummaryHistory', BatchSummaryHistorySchema);

module.exports = BatchSummaryHistory;
