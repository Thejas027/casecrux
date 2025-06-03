const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data"); // Added
const Summary = require("../models/Summary");
const MultiSummary = require("../models/MultiSummary");

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Store summary after single PDF summarization
const summarizePdfController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const mlServiceUrl = "https://casecrux.onrender.com/summarize";
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
    });
    const response = await axios.post(mlServiceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 300000,
    });
    // Save summary to MongoDB
    const { caseid } = req.body; // allow client to send a caseid
    await Summary.create({
      caseId: caseid || "default-case",
      pdfName: req.file.originalname,
      summary: response.data.summary,
    });
    res.json(response.data); // Assuming the ML service returns { "summary": "..." }
  } catch (error) {
    console.error("Error calling ML service:", error.message);
    if (error.response) {
      console.error("ML Service Response:", error.response.data);
      return res.status(error.response.status || 500).json({
        error: "Error from ML service.",
        details: error.response.data,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to summarize PDF.", details: error.message });
  }
};

// Multi-PDF summarization: Accepts multiple PDFs, stores each summary, then generates a meta-summary
const multiPdfSummarizeController = async (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }
  const { caseid } = req.body;
  if (!caseid) {
    return res
      .status(400)
      .json({ error: "caseid is required for multi-summary." });
  }
  try {
    const mlServiceUrl = "https://casecrux.onrender.com/summarize";
    // Summarize each PDF and store
    const summaries = [];
    for (const file of req.files) {
      const formData = new FormData();
      formData.append("file", file.buffer, { filename: file.originalname });
      const response = await axios.post(mlServiceUrl, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 300000,
      });
      const summaryObj = {
        pdfName: file.originalname,
        summary: response.data.summary,
      };
      summaries.push(summaryObj);
      await Summary.create({
        caseId: caseid,
        pdfName: file.originalname,
        summary: response.data.summary,
      });
    }
    // Aggregate all summaries and get meta-summary (pros/cons)
    const allSummariesText = summaries
      .map(
        (s) =>
          `PDF: ${s.pdfName}\n$${
            typeof s.summary === "string"
              ? s.summary
              : s.summary.output_text || JSON.stringify(s.summary)
          }`
      )
      .join("\n\n");
    const metaPrompt = `Given the following summaries of a legal case, write a final summary and list the pros and cons of the judgment.\n\n${allSummariesText}`;
    // Prevent sending too-large prompts to the ML service
    if (metaPrompt.length > 12000) {
      return res.status(400).json({
        error:
          "Meta-summary prompt is too large. Please reduce the number or size of PDFs.",
      });
    }
    // Send metaPrompt to ML service as a text file
    const metaFormData = new FormData();
    metaFormData.append("file", Buffer.from(metaPrompt, "utf-8"), {
      filename: "meta_prompt.txt",
    });
    const metaResponse = await axios.post(mlServiceUrl, metaFormData, {
      headers: { ...metaFormData.getHeaders() },
      timeout: 300000,
    });
    // Parse pros/cons from meta-summary (simple split, can be improved)
    let finalSummary = "",
      pros = [],
      cons = [];
    const metaText =
      typeof metaResponse.data.summary === "string"
        ? metaResponse.data.summary
        : metaResponse.data.summary.output_text ||
          JSON.stringify(metaResponse.data.summary);
    const prosMatch = metaText.match(
      /pros\s*[:\-\n]+([\s\S]*?)(cons\s*[:\-\n]+|$)/i
    );
    const consMatch = metaText.match(/cons\s*[:\-\n]+([\s\S]*)/i);
    if (prosMatch)
      pros = prosMatch[1]
        .split(/\n|\*/)
        .map((s) => s.trim())
        .filter(Boolean);
    if (consMatch)
      cons = consMatch[1]
        .split(/\n|\*/)
        .map((s) => s.trim())
        .filter(Boolean);
    finalSummary = metaText.split(/pros\s*[:\-\n]+/i)[0].trim();
    // Store meta-summary
    await MultiSummary.findOneAndUpdate(
      { caseId: caseid },
      {
        caseId: caseid,
        summaries,
        finalSummary,
        pros,
        cons,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
    res.json({ summaries, finalSummary, pros, cons });
  } catch (error) {
    console.error("Error in multiPdfSummarizeController:", error.message);
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: "Error from ML service.",
        details: error.response.data,
      });
    }
    res.status(500).json({
      error: "Failed to summarize multiple PDFs.",
      details: error.message,
    });
  }
};

module.exports = {
  summarizePdfController,
  multiPdfSummarizeController,
  upload, // Export multer instance for the route
};
