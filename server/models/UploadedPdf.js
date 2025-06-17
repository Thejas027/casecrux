const mongoose = require("mongoose");

const UploadedPdfSchema = new mongoose.Schema({
  public_id: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  filename: { type: String, required: true },
  category: { type: String },
  bytes: { type: Number },
  format: { type: String },
  created_at: { type: Date },
  resource_type: { type: String },
  folder: { type: String },
});

module.exports = mongoose.model("UploadedPdf", UploadedPdfSchema);
