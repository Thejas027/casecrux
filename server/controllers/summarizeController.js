const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data"); // Added
const Summary = require("../models/Summary");
const MultiSummary = require("../models/MultiSummary"); // Import MultiSummary

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
    // Prevent duplicate summary for same PDF name
    const { caseid } = req.body; // allow client to send a caseid
    let summaryDoc = await Summary.findOne({ pdfName: req.file.originalname });
    const category =
      response.data.summary.category ||
      (response.data.summary && response.data.summary.category) ||
      null;
    if (summaryDoc) {
      // Update existing summary
      summaryDoc.summary = response.data.summary;
      summaryDoc.caseId = caseid || summaryDoc.caseId || "default-case";
      summaryDoc.category = category;
      await summaryDoc.save();
    } else {
      summaryDoc = await Summary.create({
        caseId: caseid || "default-case",
        pdfName: req.file.originalname,
        summary: response.data.summary,
        category: category,
      });
    }
    res.json({
      _id: summaryDoc._id,
      pdfName: summaryDoc.pdfName,
      summary: summaryDoc.summary,
      category: summaryDoc.category,
    });
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

// GET /api/summaries - return all summaries (unique by pdfName, latest wins)
const getAllSummariesController = async (req, res) => {
  try {
    // Get all summaries, sort by createdAt descending (latest first)
    const all = await Summary.find({}, { __v: 0 }).sort({ createdAt: -1 });
    // Filter to only unique pdfName (latest wins)
    const seen = new Set();
    const summaries = [];
    for (const s of all) {
      if (!seen.has(s.pdfName)) {
        summaries.push(s);
        seen.add(s.pdfName);
      }
    }
    res.json({ summaries });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summaries." });
  }
};

// GET /api/overall-summary - summarize all summaries using ML service and store in MultiSummary
const getOverallSummaryController = async (req, res) => {
  console.log("\n🔄 GET /api/overall-summary - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  
  try {
    const summaries = await Summary.find(
      {},
      { summary: 1, pdfName: 1, _id: 0 }
    ).sort({ createdAt: 1 });
    
    console.log("📊 Found summaries count:", summaries.length);
    
    if (!summaries.length) {
      const message = "No summaries available.";
      console.log("⚠️ No summaries found, returning message:", message);
      return res.json({ overallSummary: message });
    }
    
    console.log("🔄 Calling ML service for overall summary...");
    console.log("📝 Summaries to process:", summaries.map(s => ({ pdfName: s.pdfName, summaryLength: s.summary?.length || 0 })));
    
    const mlServiceUrl = "https://casecrux.onrender.com/summarize_overall";
    const response = await axios.post(
      mlServiceUrl,
      { summaries },
      { timeout: 300000 }
    );
    
    console.log("✅ ML Service Response Status:", response.status);
    console.log("✅ ML Service Response Headers:", response.headers['content-type']);
    
    let overallSummaryData = response.data.overall_summary || response.data;
    
    console.log("✅ ML Service Response Data Type:", typeof overallSummaryData);
    console.log("✅ ML Service Response Preview:", JSON.stringify(overallSummaryData).substring(0, 300) + "...");
    console.log("✅ ML Service Full Response:", JSON.stringify(overallSummaryData, null, 2));
    
    // Convert the complex JSON structure to markdown format
    let overallSummary;
    if (typeof overallSummaryData === 'string') {
      overallSummary = overallSummaryData;
    } else if (overallSummaryData && typeof overallSummaryData === 'object') {
      // Convert the structured data to readable markdown
      overallSummary = `# Overall Legal Analysis Summary

## Category Overview
${overallSummaryData.category_explanation || 'No category explanation available'}

## Individual Cases Analysis
`;
      
      if (overallSummaryData.individual_cases && overallSummaryData.individual_cases.length > 0) {
        overallSummaryData.individual_cases.forEach((caseItem, index) => {
          overallSummary += `
### Case ${index + 1}: ${caseItem.case_name || 'Unnamed Case'}

**Key Points:**
${caseItem.key_points ? caseItem.key_points.map(point => `• ${point}`).join('\n') : '• No key points available'}

**Pros:**
${caseItem.pros ? caseItem.pros.map(pro => `• ${pro}`).join('\n') : '• No pros listed'}

**Cons:**
${caseItem.cons ? caseItem.cons.map(con => `• ${con}`).join('\n') : '• No cons listed'}

**Final Judgment:** ${caseItem.final_judgment || 'No judgment provided'}

**Judgment Against:** ${caseItem.judgment_against || 'Not specified'}

---
`;
        });
      }
      
      if (overallSummaryData.overall_summary) {
        overallSummary += `
## Overall Summary

**Dominant Legal Themes:**
${overallSummaryData.overall_summary.dominant_legal_themes ? 
  overallSummaryData.overall_summary.dominant_legal_themes.map(theme => `• ${theme}`).join('\n') : 
  '• No themes identified'}

**Common Pros:**
${overallSummaryData.overall_summary.common_pros ? 
  overallSummaryData.overall_summary.common_pros.map(pro => `• ${pro}`).join('\n') : 
  '• No common pros identified'}

**Common Cons:**
${overallSummaryData.overall_summary.common_cons ? 
  overallSummaryData.overall_summary.common_cons.map(con => `• ${con}`).join('\n') : 
  '• No common cons identified'}

**Overall Assessment:** ${overallSummaryData.overall_summary.overall_assessment || 'No assessment provided'}

**Success Rate:** ${overallSummaryData.overall_summary.success_rate || 'Not determined'}
`;
      }
      
      if (overallSummaryData.legal_insights) {
        overallSummary += `
## Legal Insights

**Key Precedents:**
${overallSummaryData.legal_insights.key_precedents ? 
  overallSummaryData.legal_insights.key_precedents.map(precedent => `• ${precedent}`).join('\n') : 
  '• No precedents identified'}

**Strategic Recommendations:**
${overallSummaryData.legal_insights.strategic_recommendations ? 
  overallSummaryData.legal_insights.strategic_recommendations.map(rec => `• ${rec}`).join('\n') : 
  '• No recommendations provided'}

**Risk Factors:**
${overallSummaryData.legal_insights.risk_factors ? 
  overallSummaryData.legal_insights.risk_factors.map(risk => `• ${risk}`).join('\n') : 
  '• No risk factors identified'}

**Emerging Trends:**
${overallSummaryData.legal_insights.emerging_trends ? 
  overallSummaryData.legal_insights.emerging_trends.map(trend => `• ${trend}`).join('\n') : 
  '• No trends identified'}
`;
      }
      
      if (overallSummaryData.metadata) {
        overallSummary += `
## Analysis Metadata
- **Total Cases:** ${overallSummaryData.metadata.total_cases || 'Unknown'}
- **Analysis Scope:** ${overallSummaryData.metadata.analysis_scope || 'Not specified'}
`;
      }
      
    } else {
      overallSummary = "Unable to process overall summary - unexpected data format";
    }
    
    // Save to MultiSummary collection (history)
    const multiSummaryDoc = await MultiSummary.create({
      caseId: req.body?.caseId || `case-${Date.now()}`,
      summaries,
      finalSummary: overallSummary,
      pros: overallSummaryData.overall_summary?.common_pros || [],
      cons: overallSummaryData.overall_summary?.common_cons || [],
    });
    
    console.log("✅ Formatted overall summary length:", overallSummary.length);
    console.log("✅ Formatted overall summary preview:", overallSummary.substring(0, 200) + "...");
    console.log("✅ MultiSummary saved with ID:", multiSummaryDoc._id);
    console.log("✅ Sending response with overallSummary field...");
    
    res.json({ overallSummary, multiSummaryId: multiSummaryDoc._id });
  } catch (error) {
    console.error(
      "❌ Error in getOverallSummaryController:",
      error.message
    );
    console.error("📊 Error response data:", error.response?.data);
    console.error("📊 Error stack:", error.stack);
    res.status(500).json({ error: "Failed to get overall summary." });
  }
};

// GET /api/overall-history - get all overall summaries (history)
const getOverallHistoryController = async (req, res) => {
  try {
    const history = await MultiSummary.find({}, { __v: 0 }).sort({
      createdAt: -1,
    });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overall summary history." });
  }
};

// GET /api/overall-summary/:id - get a specific overall summary by id
const getOverallSummaryByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MultiSummary.findById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overall summary." });
  }
};

// DELETE /api/summaries/:id - delete a summary by _id
const deleteSummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    await Summary.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete summary." });
  }
};

// DELETE /api/overall-summary/:id - delete an overall summary by _id
const deleteOverallSummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    await MultiSummary.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete overall summary." });
  }
};

module.exports = {
  summarizePdfController,
  getAllSummariesController,
  getOverallSummaryController,
  deleteSummaryController,
  upload, // Export multer instance for the route
  getOverallHistoryController,
  getOverallSummaryByIdController,
  deleteOverallSummaryController, // Export new controller
};
