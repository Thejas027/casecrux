const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema({
  caseId: { type: String, required: true }, // e.g. 'robbery-case-1'
  pdfName: { type: String, required: true },
  summary: { type: mongoose.Schema.Types.Mixed, required: true }, // can be string or object
  category: { type: String }, // new: legal category
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Summary", SummarySchema);
