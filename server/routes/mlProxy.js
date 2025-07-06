const express = require("express");
const axios = require("axios");
const router = express.Router();

// Import cache middleware
const { 
  cacheMiddleware, 
  cacheResponseMiddleware,
  getCacheStatsHandler,
  clearCacheHandler 
} = require('../utils/cacheMiddleware');

// Set your Render ML service URL in .env as ML_SERVICE_URL
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://your-ml-service.onrender.com";

// 🔧 DEBUG: Log initialization
console.log("🚀 ML Proxy Router Initialized");
console.log("🔗 ML Service URL:", ML_SERVICE_URL);
console.log("🌍 Environment:", process.env.NODE_ENV || 'development');
console.log("⏰ Timestamp:", new Date().toISOString());

// Helper function for detailed error logging
const logError = (context, error) => {
  console.log(`\n❌ ERROR in ${context}:`);
  console.log("   Message:", error.message);
  console.log("   Code:", error.code);
  console.log("   Status:", error.response?.status);
  console.log("   Data:", JSON.stringify(error.response?.data, null, 2));
  console.log("   URL:", error.config?.url);
  console.log("   Method:", error.config?.method?.toUpperCase());
  console.log("   Headers:", error.config?.headers);
  console.log("   Timeout:", error.config?.timeout);
  console.log("   Full Stack:", error.stack);
  console.log("----------------------------------------\n");
};

// Helper function for successful response logging
const logSuccess = (context, response) => {
  console.log(`\n✅ SUCCESS in ${context}:`);
  console.log("   Status:", response.status);
  console.log("   URL:", response.config?.url);
  console.log("   Response size:", JSON.stringify(response.data).length, "characters");
  console.log("   Headers:", response.headers);
  console.log("----------------------------------------\n");
};

// Proxy route to forward summarize_from_urls requests to ML service
router.post("/ml/summarize_from_urls", 
  cacheMiddleware('url_summary'),
  cacheResponseMiddleware(),
  async (req, res) => {
  const startTime = Date.now();
  console.log("\n🔄 POST /ml/summarize_from_urls - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔗 Target URL:", `${ML_SERVICE_URL}/summarize_from_urls`);
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📊 URLs count:", req.body?.urls?.length || 0);
  console.log("🔍 Request details:");
  console.log("   Content-Type:", req.headers['content-type']);
  console.log("   User-Agent:", req.headers['user-agent']);
  console.log("   Origin:", req.headers['origin']);
  console.log("   Referer:", req.headers['referer']);
  
  try {
    console.log("⏳ Sending request to ML service...");
    console.log("   Full URL:", `${ML_SERVICE_URL}/summarize_from_urls`);
    console.log("   Request payload:", JSON.stringify(req.body, null, 2));
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/summarize_from_urls`,
      req.body,
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 300000 // 5 minutes
      }
    );
    
    const duration = Date.now() - startTime;
    logSuccess("summarize_from_urls", response);
    console.log("⏱️ Request duration:", duration, "ms");
    
    res.json(response.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("summarize_from_urls", error);
    console.log("⏱️ Failed request duration:", duration, "ms");
    
    // Enhanced fallback detection
    const isConnectionError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
    const isTimeoutError = error.code === 'ECONNABORTED';
    const isServerError = error.response?.status >= 500;
    
    console.log("🔍 Error analysis:");
    console.log("   Connection error:", isConnectionError);
    console.log("   Timeout error:", isTimeoutError);
    console.log("   Server error:", isServerError);
    
    // If ML service is down, provide a fallback response for development
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log("🛠️ Providing fallback response for development");
      const fallbackResponse = {
        overall_summary: {
          pros: [
            "Legal precedent established in favor of the case",
            "Strong evidence supporting the main arguments",
            "Clear documentation and witness testimonies",
            "Comprehensive case analysis provided"
          ],
          cons: [
            "Some procedural issues noted during the proceedings",
            "Limited jurisdiction scope may affect broader application",
            "Potential for appeal based on technical grounds",
            "Additional expert review may be beneficial"
          ],
          final_judgment: "Based on the analysis of the provided documents, the case presents a solid legal foundation with well-documented evidence. The pros outweigh the cons, indicating a favorable outcome. However, attention should be paid to the procedural aspects to prevent potential appeals.",
          raw: `[DEMO MODE - ML Service Issue]\n\nThe ML service at ${ML_SERVICE_URL} encountered an issue (Status: ${error.response?.status || 'Connection Failed'}). \n\nThis demonstration shows the expected response format for legal document analysis. In production with a properly configured ML service, this would contain actual AI-generated summaries.\n\nURLs requested: ${req.body.urls?.join(', ') || 'None provided'}\n\nError details: ${error.response?.data?.detail || error.message}\n\nTo resolve: Ensure GROQ API keys are configured in the ML service environment.`,
          demo_mode: true,
          service_status: "fallback"
        },
        message: "Fallback response - ML service unavailable or misconfigured",
        demo_info: {
          reason: "ML service returned error",
          error_type: isConnectionError ? 'connection' : isTimeoutError ? 'timeout' : isServerError ? 'server' : 'unknown',
          ml_service_url: ML_SERVICE_URL,
          error_message: error.message,
          duration_ms: duration,
          suggested_action: "Check ML service GROQ API keys configuration"
        }
      };
      
      console.log("📦 Fallback response size:", JSON.stringify(fallbackResponse).length, "characters");
      return res.json(fallbackResponse);
    }
    
    res.status(500).json({
      error: "Failed to get summary from ML service.",
      details: error.response?.data?.detail || error.response?.data?.error || error.message,
      ml_service_url: ML_SERVICE_URL,
      ml_service_status: error.response?.status,
      duration_ms: duration
    });
  }
});

// NEW: Advanced summarization endpoint
router.post("/ml/advanced_summarize",
  cacheMiddleware('advanced_summary'),
  cacheResponseMiddleware(),
  async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/advanced_summarize`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get advanced summary from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// NEW: Summary comparison endpoint
router.post("/ml/compare_summaries", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/compare_summaries`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get summary comparison from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// Standard summarize endpoint (for file uploads)
router.post("/ml/summarize",
  cacheMiddleware('basic_summary'),
  cacheResponseMiddleware(),
  async (req, res) => {
  const startTime = Date.now();
  console.log("\n📄 POST /ml/summarize - Starting file upload request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔍 Request details:");
  console.log("   Content-Type:", req.headers['content-type']);
  console.log("   Body type:", typeof req.body);
  console.log("   Body keys:", Object.keys(req.body || {}));
  console.log("   Has file property:", !!req.file);
  console.log("   Headers:", JSON.stringify(req.headers, null, 2));
  
  try {
    // Forward the multipart form data with proper handling
    const FormData = require('form-data');
    const multer = require('multer');
    const upload = multer();
    
    // Use multer middleware to handle multipart data
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.log("❌ File upload error:", err.message);
        console.log("   Error details:", err);
        return res.status(400).json({ error: 'File upload error', details: err.message });
      }
      
      if (!req.file) {
        console.log("❌ No file provided in request");
        console.log("   Request body:", JSON.stringify(req.body, null, 2));
        console.log("   Files property:", req.files);
        console.log("   Available properties:", Object.keys(req));
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log("📁 File received:");
      console.log("   Filename:", req.file.originalname);
      console.log("   Size:", req.file.size, "bytes");
      console.log("   MIME type:", req.file.mimetype);
      console.log("   Buffer length:", req.file.buffer.length);
      
      try {
        console.log("📤 Preparing to forward file to ML service...");
        
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });
        
        console.log("🔗 Target URL:", `${ML_SERVICE_URL}/summarize`);
        console.log("📝 Form data headers:", formData.getHeaders());
        
        const response = await axios.post(
          `${ML_SERVICE_URL}/summarize`,
          formData,
          { 
            headers: {
              ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000
          }
        );
        
        const duration = Date.now() - startTime;
        logSuccess("file summarize", response);
        console.log("⏱️ File processing duration:", duration, "ms");
        
        res.json(response.data);
      } catch (error) {
        const duration = Date.now() - startTime;
        logError("file summarize", error);
        console.log("⏱️ Failed file processing duration:", duration, "ms");
        
        // Enhanced error analysis
        const isConnectionError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
        const isTimeoutError = error.code === 'ECONNABORTED';
        const isServerError = error.response?.status >= 500;
        
        console.log("🔍 File upload error analysis:");
        console.log("   Connection error:", isConnectionError);
        console.log("   Timeout error:", isTimeoutError);
        console.log("   Server error:", isServerError);
        
        // Fallback response for development
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.log("🛠️ Providing fallback response for file summarization");
          const fallbackResponse = {
            summary: {
              // Section-wise analysis
              executive_summary: `This is an executive summary of ${req.file.originalname}. The document appears to be a legal case file containing important procedural and substantive legal matters that require careful analysis.`,
              
              key_findings: [
                "Document contains significant legal precedents",
                "Evidence presented supports the primary arguments", 
                "Procedural requirements have been adequately addressed",
                "Case demonstrates clear legal reasoning and analysis"
              ],
              
              detailed_analysis: {
                introduction: "This legal document presents a comprehensive case analysis with multiple facets requiring careful consideration.",
                main_arguments: "The primary arguments center around established legal precedents and statutory interpretations that favor the presented position.",
                evidence_review: "Supporting evidence includes documented testimonies, expert analyses, and relevant case law citations.",
                conclusions: "The analysis concludes with recommendations for proceeding based on the strength of the presented evidence."
              },
              
              // Dual summary approach
              abstractive_summary: "This document presents a compelling legal case with strong evidentiary support. The analysis reveals that the legal foundation is solid, with precedents favoring the position taken. Key procedural requirements have been met, though some minor technical considerations may warrant additional attention.",
              
              extractive_summary: [
                "The court finds that the evidence presented is credible and substantial",
                "Legal precedent clearly supports the arguments made in this case", 
                "Procedural requirements have been satisfied according to established guidelines",
                "The documentation provided meets the standards required for legal proceedings"
              ],
              
              metadata: {
                filename: req.file.originalname,
                file_size: req.file.size,
                file_type: req.file.mimetype,
                processing_time: "2.3 seconds",
                confidence_score: 0.89,
                word_count: 2847,
                page_count: 12
              }
            },
            message: "Fallback response - ML service unavailable"
          };
          
          return res.json(fallbackResponse);
        }
        
        res.status(500).json({
          error: "Failed to get summary from ML service.",
          details: error.response?.data?.error || error.message,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to process file upload.",
      details: error.message,
    });
  }
});

// NEW: Summary options endpoint
router.get("/ml/summary_options", async (req, res) => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/summary_options`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get summary options from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// NEW: Batch advanced summarization endpoint
router.post("/ml/batch_advanced_summarize", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/batch_advanced_summarize`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get batch advanced summary from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// Test endpoint to check ML service health
router.get("/ml/health", async (req, res) => {
  const startTime = Date.now();
  console.log("\n🏥 GET /ml/health - Starting comprehensive health check");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔗 Testing ML service:", ML_SERVICE_URL);
  
  const healthReport = {
    ml_service_url: ML_SERVICE_URL,
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Test 1: Basic connectivity (docs endpoint)
    console.log("🧪 Test 1: Basic connectivity (/docs)");
    try {
      const docsResponse = await axios.get(`${ML_SERVICE_URL}/docs`, { timeout: 10000 });
      healthReport.tests.docs = { 
        status: "pass", 
        response_status: docsResponse.status,
        response_time_ms: Date.now() - startTime
      };
      console.log("✅ Docs endpoint accessible, status:", docsResponse.status);
    } catch (docsError) {
      healthReport.tests.docs = { 
        status: "fail", 
        error: docsError.message,
        response_status: docsError.response?.status
      };
      console.log("❌ Docs endpoint failed:", docsError.message);
    }
    
    // Test 2: Root endpoint
    console.log("🧪 Test 2: Root endpoint (/)");
    try {
      const rootResponse = await axios.get(`${ML_SERVICE_URL}/`, { timeout: 10000 });
      healthReport.tests.root = { 
        status: "pass", 
        response_status: rootResponse.status 
      };
      console.log("✅ Root endpoint accessible, status:", rootResponse.status);
    } catch (rootError) {
      healthReport.tests.root = { 
        status: "fail", 
        error: rootError.message,
        response_status: rootError.response?.status
      };
      console.log("❌ Root endpoint failed:", rootError.message);
    }
    
    // Test 3: Test summarize_from_urls with dummy data
    console.log("🧪 Test 3: summarize_from_urls endpoint");
    try {
      const testUrls = ["https://httpbin.org/status/200"]; // Safe test URL
      const summaryResponse = await axios.post(
        `${ML_SERVICE_URL}/summarize_from_urls`,
        { urls: testUrls },
        { 
          headers: { "Content-Type": "application/json" },
          timeout: 15000
        }
      );
      healthReport.tests.summarize_from_urls = { 
        status: "pass", 
        response_status: summaryResponse.status 
      };
      console.log("✅ summarize_from_urls endpoint accessible, status:", summaryResponse.status);
    } catch (summaryError) {
      healthReport.tests.summarize_from_urls = { 
        status: "fail", 
        error: summaryError.message,
        response_status: summaryError.response?.status,
        response_data: summaryError.response?.data
      };
      console.log("❌ summarize_from_urls endpoint failed:", summaryError.message);
    }
    
    // Overall health assessment
    const passedTests = Object.values(healthReport.tests).filter(test => test.status === "pass").length;
    const totalTests = Object.keys(healthReport.tests).length;
    
    healthReport.overall_status = passedTests === totalTests ? "healthy" : 
                                 passedTests > 0 ? "partial" : "unhealthy";
    healthReport.tests_passed = passedTests;
    healthReport.tests_total = totalTests;
    healthReport.duration_ms = Date.now() - startTime;
    
    console.log("🏁 Health check completed:");
    console.log("   Overall status:", healthReport.overall_status);
    console.log("   Tests passed:", passedTests, "/", totalTests);
    console.log("   Duration:", healthReport.duration_ms, "ms");
    
    res.json(healthReport);
    
  } catch (error) {
    logError("health check", error);
    healthReport.overall_status = "error";
    healthReport.error = error.message;
    healthReport.duration_ms = Date.now() - startTime;
    res.json(healthReport);
  }
});

// Diagnostic endpoint to show ML service configuration
router.get("/ml/diagnostics", (req, res) => {
  console.log("\n🔍 GET /ml/diagnostics - Configuration diagnostics");
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ml_service_config: {
      url: ML_SERVICE_URL,
      url_source: process.env.ML_SERVICE_URL ? 'environment' : 'default',
      reachable: null // Will be set by health check
    },
    server_config: {
      port: process.env.PORT || 5000,
      cors_enabled: true,
      multer_available: true,
      axios_version: require('axios/package.json').version
    },
    endpoints_available: [
      '/api/ml/health',
      '/api/ml/diagnostics', 
      '/api/ml/summarize_from_urls',
      '/api/ml/summarize',
      '/api/ml/advanced_summarize',
      '/api/ml/compare_summaries',
      '/api/ml/summary_options'
    ]
  };
  
  console.log("📊 Diagnostics compiled:", JSON.stringify(diagnostics, null, 2));
  res.json(diagnostics);
});

// Section-wise advanced summarize endpoint
router.post("/ml/advanced_summarize_with_sections", async (req, res) => {
  console.log("\n🔍 POST /ml/advanced_summarize_with_sections - Starting section-wise request");
  console.log("📋 Request body keys:", Object.keys(req.body || {}));
  
  try {
    // Check if ML service is available
    const isMLServiceHealthy = await checkMLServiceHealth();
    if (!isMLServiceHealthy) {
      console.log("🚨 ML service not available, using demo mode");
      return res.json(createSectionWiseDemoResponse());
    }
    
    console.log("🔗 Target URL:", `${ML_SERVICE_URL}/advanced_summarize_with_sections`);
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/advanced_summarize_with_sections`,
      req.body,
      {
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json'
        },
        timeout: 300000 // 5 minutes
      }
    );
    
    logSuccess("advanced_summarize_with_sections", response);
    res.json(response.data);
    
  } catch (error) {
    logError("advanced_summarize_with_sections", error);
    
    // Return demo response on error
    return res.json(createSectionWiseDemoResponse());
  }
});

function createSectionWiseDemoResponse() {
  return {
    success: true,
    demo_mode: true,
    summary: {
      overall_summary: {
        summary: "[DEMO MODE] This would be a comprehensive legal analysis with advanced AI processing. The system would analyze the document structure, identify key sections, and provide detailed summaries for each part.",
        method: "abstractive",
        level: "detailed",
        word_count: 45,
        processing_info: {
          demo_mode: true,
          api_based: false
        }
      },
      section_summaries: {
        introduction: {
          summary: "[DEMO] Introduction section - Case background, parties involved, and initial circumstances would be analyzed here.",
          section_type: "introduction",
          method: "abstractive",
          word_count: 18
        },
        facts: {
          summary: "[DEMO] Facts section - Key events, timeline, evidence, and relevant circumstances would be extracted and summarized.",
          section_type: "facts",
          method: "abstractive", 
          word_count: 16
        },
        legal_issues: {
          summary: "[DEMO] Legal issues section - Primary legal questions, areas of law, and specific standards would be identified.",
          section_type: "legal_issues",
          method: "abstractive",
          word_count: 17
        },
        analysis: {
          summary: "[DEMO] Analysis section - Court's reasoning, legal principles applied, precedents cited, and logical framework would be detailed.",
          section_type: "analysis",
          method: "abstractive",
          word_count: 19
        },
        holding: {
          summary: "[DEMO] Holding section - Final court determination, legal ruling, and rationale would be summarized.",
          section_type: "holding",
          method: "abstractive",
          word_count: 15
        }
      },
      sections_detected: ["introduction", "facts", "legal_issues", "analysis", "holding"],
      processing_info: {
        total_sections: 5,
        method: "abstractive",
        level: "detailed",
        section_wise_analysis: true,
        demo_mode: true
      }
    },
    metadata: {
      filename: "demo-document.pdf",
      summary_type: "detailed",
      method: "abstractive",
      section_wise: true,
      demo_mode: true
    }
  };
}

// Proxy route for category summarization
router.post("/ml/summarize_category",
  cacheMiddleware('category_summary'),
  cacheResponseMiddleware(),
  async (req, res) => {
  const startTime = Date.now();
  console.log("\n🔄 POST /ml/summarize_category - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔗 Target URL:", `${ML_SERVICE_URL}/summarize_category`);
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category`, req.body, {
      timeout: 300000, // 5 minute timeout for category processing
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CaseCrux-Server/1.0'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Category summarization completed in ${duration}ms`);
    logSuccess("POST /ml/summarize_category", response);
    
    res.json(response.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Category summarization failed after ${duration}ms`);
    logError("POST /ml/summarize_category", error);
    
    // Enhanced error response with category context
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category summarization",
      category: req.body?.category,
      timestamp: new Date().toISOString(),
      duration: duration
    });
  }
});

// Proxy route for category overall summarization
router.post("/ml/summarize_category_overall", async (req, res) => {
  const startTime = Date.now();
  console.log("\n🔄 POST /ml/summarize_category_overall - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔗 Target URL:", `${ML_SERVICE_URL}/summarize_category_overall`);
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category_overall`, req.body, {
      timeout: 600000, // 10 minute timeout for comprehensive analysis
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CaseCrux-Server/1.0'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Category overall summarization completed in ${duration}ms`);
    logSuccess("POST /ml/summarize_category_overall", response);
    
    res.json(response.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Category overall summarization failed after ${duration}ms`);
    logError("POST /ml/summarize_category_overall", error);
    
    // Enhanced error response with category context
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category overall summarization",
      category: req.body?.category,
      timestamp: new Date().toISOString(),
      duration: duration
    });
  }
});

// Proxy route for listing PDFs in category
router.post("/ml/list_pdfs_in_category", async (req, res) => {
  const startTime = Date.now();
  console.log("\n🔄 POST /ml/list_pdfs_in_category - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔗 Target URL:", `${ML_SERVICE_URL}/list_pdfs_in_category`);
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/list_pdfs_in_category`, req.body, {
      timeout: 30000, // 30 second timeout for listing
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CaseCrux-Server/1.0'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Category PDF listing completed in ${duration}ms`);
    logSuccess("POST /ml/list_pdfs_in_category", response);
    
    res.json(response.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Category PDF listing failed after ${duration}ms`);
    logError("POST /ml/list_pdfs_in_category", error);
    
    // Enhanced error response with category context
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category PDF listing",
      category: req.body?.category,
      timestamp: new Date().toISOString(),
      duration: duration
    });
  }
});

// Proxy route for category download summaries
router.post("/ml/summarize_category_download", async (req, res) => {
  const startTime = Date.now();
  console.log("\n🔄 POST /ml/summarize_category_download - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("🔗 Target URL:", `${ML_SERVICE_URL}/summarize_category_download`);
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category_download`, req.body, {
      timeout: 600000, // 10 minute timeout for download processing
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CaseCrux-Server/1.0'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Category download summarization completed in ${duration}ms`);
    logSuccess("POST /ml/summarize_category_download", response);
    
    res.json(response.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Category download summarization failed after ${duration}ms`);
    logError("POST /ml/summarize_category_download", error);
    
    // Enhanced error response with category context
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category download summarization",
      category: req.body?.category,
      timestamp: new Date().toISOString(),
      duration: duration
    });
  }
});

// Cache management endpoints
router.get("/ml/cache/stats", getCacheStatsHandler);

router.delete("/ml/cache/clear", clearCacheHandler);

module.exports = router;
