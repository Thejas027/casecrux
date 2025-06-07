const mongoose = require("mongoose");

const MultiSummarySchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  summaries: [
    {
      pdfName: String,
      summary: mongoose.Schema.Types.Mixed,
    },
  ],
  finalSummary: { type: String },
  pros: { type: [String] },
  cons: { type: [String] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MultiSummary", MultiSummarySchema);
