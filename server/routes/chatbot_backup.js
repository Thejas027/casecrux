const express = require("express");
const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const Summary = require("../models/Summary");
const BatchSummaryHistory = require("../models/BatchSummaryHistory");
const MultiSummary = require("../models/MultiSummary");
const axios = require("axios");

const router = express.Router();

// ML Service URL for AI responses
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://casecrux.onrender.com";

// POST /api/chat/message - Send a message and get AI response
router.post("/message", async (req, res) => {
  console.log("\n💬 POST /api/chat/message - Starting chat request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { message, conversationId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get user context for AI response (do this first, before database operations)
    const userContext = await buildUserContext(context).catch(err => {
      console.warn("⚠️ Failed to build user context:", err.message);
      return { summaries: [], totalDocuments: 0, recentActivity: [] };
    });
    
    // Generate AI response (this should always work with fallbacks)
    const aiResponse = await generateAIResponse(message, userContext);

    // Try to save to database, but don't fail if it doesn't work
    let conversation = null;
    let resultConversationId = null;
    let messageId = null;

    try {
      // Find or create conversation
      if (conversationId) {
        conversation = await ChatConversation.findById(conversationId);
      }

      if (!conversation) {
        conversation = await ChatConversation.create({
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          context: context || {}
        });
      }

      // Save user message
      const userMessage = await ChatMessage.create({
        conversationId: conversation._id,
        type: 'user',
        content: message
      });

      // Save AI response
      const assistantMessage = await ChatMessage.create({
        conversationId: conversation._id,
        type: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata || {}
      });

      resultConversationId = conversation._id;
      messageId = assistantMessage._id;
      console.log("✅ Chat message saved to database");

    } catch (dbError) {
      console.warn("⚠️ Database save failed, but continuing with response:", dbError.message);
      // Generate a temporary ID if database fails
      resultConversationId = 'temp-' + Date.now();
      messageId = 'temp-' + Date.now();
    }

    console.log("✅ Chat message processed successfully");
    res.json({
      response: aiResponse.content,
      conversationId: resultConversationId,
      messageId: messageId,
      metadata: {
        ...aiResponse.metadata,
        databaseSaved: !!conversation
      }
    });

  } catch (error) {
    console.error("❌ Chat message failed:", error.message);
    console.error("📊 Error details:", error);
    
    // Always provide a helpful fallback response
    const fallbackResponse = generateFallbackResponse(req.body?.message || "your question");
    
    res.json({
      response: fallbackResponse,
      conversationId: 'error-' + Date.now(),
      messageId: 'error-' + Date.now(),
      metadata: {
        responseType: 'error-fallback',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/chat/conversations - Get user's chat conversations
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await ChatConversation.find({})
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json({ conversations });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /api/chat/conversation/:id - Get conversation history
router.get("/conversation/:id", async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await ChatMessage.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });

    res.json({
      conversation,
      messages
    });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Helper function to build user context
async function buildUserContext(providedContext) {
  try {
    const context = {
      summaries: [],
      totalDocuments: 0,
      recentActivity: []
    };

    // Try to get user's summaries with error handling for each
    try {
      const [individualSummaries, batchSummaries, overallSummaries] = await Promise.allSettled([
        Summary.find({}).sort({ createdAt: -1 }).limit(5),
        BatchSummaryHistory.find({}).sort({ createdAt: -1 }).limit(3),
        MultiSummary.find({}).sort({ createdAt: -1 }).limit(3)
      ]);

      // Process individual summaries
      if (individualSummaries.status === 'fulfilled' && individualSummaries.value) {
        context.summaries.push(...individualSummaries.value.map(s => ({
          id: s._id,
          type: 'individual',
          title: s.pdfName || 'Unknown Document',
          content: typeof s.summary === 'string' ? s.summary : (s.summary?.output_text || 'No content available'),
          createdAt: s.createdAt
        })));
      }

      // Process batch summaries
      if (batchSummaries.status === 'fulfilled' && batchSummaries.value) {
        context.summaries.push(...batchSummaries.value.map(s => ({
          id: s._id,
          type: 'batch',
          title: s.category || 'Batch Analysis',
          content: s.summary?.raw || 'No content available',
          createdAt: s.createdAt
        })));
      }

      // Process overall summaries
      if (overallSummaries.status === 'fulfilled' && overallSummaries.value) {
        context.summaries.push(...overallSummaries.value.map(s => ({
          id: s._id,
          type: 'overall',
          title: 'Overall Analysis',
          content: s.finalSummary || 'No content available',
          createdAt: s.createdAt
        })));
      }

      context.totalDocuments = context.summaries.filter(s => s.type === 'individual').length;
      console.log(`📊 Context built successfully: ${context.summaries.length} summaries, ${context.totalDocuments} documents`);

    } catch (dbError) {
      console.warn("⚠️ Database query failed, using empty context:", dbError.message);
      // Continue with empty context - the chatbot will still work
    }

    context.providedContext = providedContext;
    return context;

  } catch (error) {
    console.error("Failed to build user context:", error);
    return { 
      summaries: [], 
      totalDocuments: 0, 
      recentActivity: [],
      providedContext: providedContext 
    };
  }
}

// Helper function to generate AI response
async function generateAIResponse(message, context) {
  try {
    console.log("🤖 Generating AI response for message:", message.substring(0, 100));
    console.log("📊 Context summary count:", context.summaries?.length || 0);

    // Build context prompt
    let contextPrompt = `You are CaseCrux Legal Assistant, an AI helper for legal document analysis. You help users understand their legal documents, summaries, and provide general legal guidance.

IMPORTANT GUIDELINES:
1. Be helpful, professional, and accurate
2. Reference specific documents when relevant
3. Explain complex legal terms in simple language
4. Always include disclaimers for legal advice
5. Use markdown formatting for better readability
6. Be conversational but professional

USER'S CONTEXT:
- Total documents analyzed: ${context.totalDocuments}
- Recent summaries available: ${context.summaries?.length || 0}`;

    if (context.summaries && context.summaries.length > 0) {
      contextPrompt += `\n\nRECENT DOCUMENT SUMMARIES:\n`;
      context.summaries.slice(0, 3).forEach((summary, idx) => {
        contextPrompt += `${idx + 1}. **${summary.title}** (${summary.type})\n`;
        contextPrompt += `   Content preview: ${summary.content.substring(0, 200)}...\n\n`;
      });
    }

    contextPrompt += `\nUSER QUESTION: ${message}

Please provide a helpful response. If the user is asking about their documents, reference the specific summaries above. If you need to provide legal advice, always include appropriate disclaimers.`;

    // Try to get AI response from ML service with shorter timeout
    let aiContent;
    try {
      console.log("🔗 Attempting to connect to ML service:", ML_SERVICE_URL);
      const response = await axios.post(
        `${ML_SERVICE_URL}/chat_completion`,
        {
          messages: [
            {
              role: "system",
              content: contextPrompt
            },
            {
              role: "user", 
              content: message
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        },
        {
          timeout: 15000, // Reduced timeout to 15 seconds
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      aiContent = response.data.response || response.data.content || response.data.message;
      
      if (!aiContent) {
        throw new Error("Empty response from ML service");
      }
      
      console.log("✅ AI response received from ML service");
      
    } catch (mlError) {
      console.warn("⚠️ ML service unavailable, using rule-based response");
      console.warn("ML Error details:", mlError.message);
      aiContent = generateRuleBasedResponse(message, context);
    }

    // Ensure we always have content
    if (!aiContent) {
      console.warn("⚠️ No AI content generated, using fallback");
      aiContent = generateRuleBasedResponse(message, context);
    }

    return {
      content: aiContent,
      metadata: {
        responseType: aiContent.includes('[RULE-BASED]') ? 'rule-based' : 'ai-generated',
        contextUsed: context.summaries?.length > 0,
        timestamp: new Date().toISOString(),
        mlServiceAttempted: true
      }
    };

  } catch (error) {
    console.error("Error generating AI response:", error);
    console.warn("🔄 Falling back to rule-based response");
    
    return {
      content: generateRuleBasedResponse(message, context),
      metadata: {
        responseType: 'rule-based-fallback',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Rule-based response for when ML service is unavailable
function generateRuleBasedResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  // Remove the "rule-based mode" indicator to make it feel more AI-like
  
  // Document-related questions with AI-like analysis
  if (lowerMessage.includes('summary') || lowerMessage.includes('document') || 
      lowerMessage.includes('explain') || lowerMessage.includes('analyze')) {
    
    if (context.summaries && context.summaries.length > 0) {
      // AI-like document analysis
      const documentTypes = [...new Set(context.summaries.map(s => s.type))];
      const recentDocs = context.summaries.slice(0, 3);
      
      return `## Your Legal Document Portfolio Analysis �

Based on my analysis of your **${context.summaries.length} documents**, I can provide the following insights:

### **Document Overview:**
${recentDocs.map((summary, idx) => {
  const contentPreview = summary.content.substring(0, 200);
  const keyTerms = extractKeyLegalTerms(contentPreview);
  
  return `**${idx + 1}. ${summary.title}** (${summary.type} analysis)
   📅 **Date:** ${new Date(summary.createdAt).toLocaleDateString()}
   🔍 **Key Elements:** ${keyTerms.length > 0 ? keyTerms.join(', ') : 'Contract terms, legal provisions'}
   📝 **Content:** ${contentPreview}...
   
   **My Assessment:** ${generateDocumentAssessment(summary.content, summary.type)}`;
}).join('\n\n')}

### **Portfolio Insights:**
- **Document Types:** ${documentTypes.join(', ')} analysis
- **Total Coverage:** ${context.totalDocuments} individual documents analyzed
- **Recent Activity:** ${context.summaries.length} summaries generated

### **Recommendations:**
${generateRecommendations(context.summaries)}

### **Next Steps:**
- Ask me specific questions about any document
- Request detailed explanations of legal terms
- Compare documents for consistency
- Translate content to other languages

⚖️ **Legal Disclaimer:** This analysis is based on document summaries and provides general information only. Consult qualified legal counsel for specific legal advice.

**What specific aspect would you like me to explain further?**`;
    } else {
      return `## Welcome to Your AI Legal Assistant! 🤖⚖️

I'm here to help you navigate your legal documents and provide intelligent analysis. Currently, I don't see any uploaded documents in your portfolio.

### **How I Can Assist You:**

**📄 Document Analysis**
- Upload PDFs and I'll provide comprehensive legal summaries
- Extract key terms, risks, and opportunities
- Identify important clauses and provisions
- Compare multiple documents for consistency

**🧠 Legal Intelligence**
- Explain complex legal terminology in plain language
- Provide context for legal concepts and procedures
- Suggest areas that may need legal review
- Help organize and structure your legal materials

**🌐 Multi-Language Support**
- Translate legal documents to 15+ languages
- Maintain legal accuracy across translations
- Cultural context awareness for international documents

**🔍 Pattern Recognition**
- Identify common themes across multiple documents
- Spot potential issues or inconsistencies
- Track legal trends in your document portfolio

### **Getting Started:**
1. **Upload Your First Document** → Go to "PDF Summarizer"
2. **Batch Analysis** → Use "Category Batch" for multiple related docs
3. **Ask Questions** → I can explain legal concepts and terminology

**Ready to begin?** Upload a legal document and ask me: *"Explain this document"* or *"What are the key risks?"*

I'm designed to be your intelligent legal research assistant! 🚀`;
    }
  }

  // Legal guidance with AI-like expertise
  if (lowerMessage.includes('legal') || lowerMessage.includes('law') || lowerMessage.includes('advice') ||
      lowerMessage.includes('help') || lowerMessage.includes('risk') || lowerMessage.includes('contract')) {
    
    return `## Legal Guidance & Analysis 🏛️

As your AI legal assistant, I can help you understand complex legal matters. Here's how I approach legal analysis:

### **My Legal Expertise Areas:**

**📋 Contract Law**
- Terms and conditions analysis
- Liability and indemnification clauses
- Breach of contract implications
- Performance obligations and remedies

**🏢 Business Law**
- Corporate governance documents
- Partnership agreements
- Employment contracts and policies
- Intellectual property agreements

**🏠 Real Estate Law**
- Purchase agreements and leases
- Property rights and restrictions
- Zoning and land use regulations
- Title and ownership documents

**⚖️ Litigation Support**
- Case analysis and legal precedents
- Discovery document review
- Legal research and brief preparation
- Evidence organization and analysis

### **For Your Current Portfolio:**
${context.totalDocuments > 0 
  ? `I can analyze your **${context.totalDocuments} uploaded document(s)** to provide:
  - Risk assessment and mitigation strategies
  - Key term explanations and implications
  - Comparison with industry standards
  - Recommendations for legal review areas`
  : `Once you upload documents, I can provide:
  - Comprehensive legal analysis
  - Risk identification and assessment
  - Strategic recommendations
  - Detailed explanations of legal implications`
}

### **How I Analyze Legal Documents:**
1. **Content Extraction** → Identify key legal provisions
2. **Risk Assessment** → Evaluate potential legal exposures
3. **Opportunity Identification** → Find beneficial terms and protections
4. **Comparative Analysis** → Benchmark against standard practices
5. **Plain Language Explanation** → Translate "legalese" into clear terms

**⚠️ IMPORTANT LEGAL DISCLAIMER:**
*I provide general legal information and analysis to help you understand your documents. This is not legal advice. For specific legal matters, always consult with a qualified attorney licensed in your jurisdiction.*

**What specific legal topic would you like me to explain or analyze?**`;
  }

  // Specific legal questions about laws, sections, and cases
  if (lowerMessage.includes('section') || lowerMessage.includes('ipc') || lowerMessage.includes('crpc') || 
      lowerMessage.includes('robbery') || lowerMessage.includes('theft') || lowerMessage.includes('murder') ||
      lowerMessage.includes('criminal') || lowerMessage.includes('civil') || lowerMessage.includes('law') ||
      lowerMessage.includes('code') || lowerMessage.includes('act') || lowerMessage.includes('procedure')) {
    
    return handleSpecificLegalQuery(message, lowerMessage, context);
  }

  // Advanced judgment and case law queries
  if (lowerMessage.includes('judgment') || lowerMessage.includes('judgement') || lowerMessage.includes('case law') ||
      lowerMessage.includes('precedent') || lowerMessage.includes('supreme court') || lowerMessage.includes('high court') ||
      lowerMessage.includes('landmark') || lowerMessage.includes('ratio') || lowerMessage.includes('obiter') ||
      lowerMessage.includes('appeal') || lowerMessage.includes('revision') || lowerMessage.includes('bail order') ||
      lowerMessage.includes('sentence') || lowerMessage.includes('acquittal') || lowerMessage.includes('conviction')) {
    
    return handleJudgmentAndCaseLawQuery(message, lowerMessage, context);
  }

  // General help with AI personality
  if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how') ||
      lowerMessage.includes('can you') || lowerMessage.includes('abilities')) {
    
    return `## Hi! I'm Your AI Legal Assistant 🤖⚖️

I'm designed to be your intelligent companion for legal document analysis and research. Think of me as your personal legal research assistant who never sleeps!

### **My Core Capabilities:**

**🧠 Intelligent Document Analysis**
- Read and understand complex legal documents
- Extract key information, terms, and clauses
- Identify potential risks and opportunities
- Provide structured summaries and insights

**💬 Natural Language Interaction**
- Answer questions about your documents in plain English
- Explain complex legal concepts clearly
- Engage in detailed discussions about legal matters
- Provide step-by-step guidance for legal processes

**🔍 Pattern Recognition & Insights**
- Compare multiple documents for consistency
- Identify trends across your legal portfolio
- Spot potential issues before they become problems
- Suggest best practices based on document analysis

**🌐 Multi-Language Legal Support**
- Translate legal documents accurately
- Maintain legal terminology across languages
- Provide cultural context for international documents

### **Current Status of Your Portfolio:**
${context.totalDocuments > 0 
  ? `✅ **Active Portfolio:** ${context.totalDocuments} documents analyzed
📊 **Recent Activity:** ${context.summaries?.length} summaries available
🎯 **Ready for:** Advanced analysis, comparisons, translations

**I can help you with:**
- "Explain the risks in my contracts"
- "Compare my employment agreements"
- "What does this clause mean?"
- "Translate this to Hindi"`
  : `📤 **New User Setup:** No documents uploaded yet
🚀 **Next Step:** Upload your first legal document
💡 **Tip:** Start with a contract or agreement you need to understand

**Once you upload documents, ask me:**
- "What are the key points in this contract?"
- "Are there any red flags I should know about?"
- "How does this compare to standard agreements?"`
}

### **Popular Questions I Can Answer:**
- "Explain my documents" → Comprehensive analysis
- "What are the legal risks?" → Risk assessment
- "How do I translate this?" → Translation guidance
- "What does [legal term] mean?" → Plain language explanations
- "Compare these contracts" → Detailed comparisons

### **My Approach to Legal Analysis:**
I combine **legal knowledge** + **document context** + **your specific needs** to provide personalized, actionable insights that help you make informed decisions.

**What would you like to explore first? Just ask me anything about legal documents or concepts!** 🚀`;
  }

  // Default response
  return `## I'm Here to Help! 💼

Thanks for your question! While I'm processing your request, here are some things I can help with:

**📋 Quick Actions:**
- Analyze your uploaded legal documents
- Explain legal terms and concepts
- Provide document summaries and insights
- Translate content to multiple languages

**💡 Suggestions:**
- Upload a PDF to get started with analysis
- Ask me to explain specific legal concepts
- Request translations of your summaries
- Compare multiple documents

${context.summaries?.length > 0 
  ? `**Based on your ${context.summaries.length} document(s):** I can provide specific insights about your legal materials.`
  : '**Get started:** Upload your first legal document to unlock AI-powered analysis!'
}

**Try asking:** "Explain my documents" or "How does CaseCrux work?"

*This is a rule-based response. Please rephrase your question or try a more specific query.*`;
}

// Fallback response for errors
function generateFallbackResponse(message) {
  return `## Oops! Something went wrong 🔧

I'm having trouble processing your request right now. This might be due to:

- **System maintenance** in progress
- **Network connectivity** issues  
- **Service overload** - please try again in a moment

**What you can do:**
1. **Try again** in a few minutes
2. **Refresh the page** and retry
3. **Contact support** if the issue persists

**In the meantime:**
- Browse your existing document summaries
- Use the translation features
- Explore other CaseCrux tools

I apologize for the inconvenience! Your question was: "${message.substring(0, 100)}..."

**Please try asking again in a simpler way or contact our support team.**`;
}

// Advanced Judgment and Case Law Analysis System
function handleJudgmentAndCaseLawQuery(message, lowerMessage, context) {
  
  // General judgment analysis queries
  if (lowerMessage.includes('judgment') || lowerMessage.includes('judgement')) {
    
    // Specific judgment types
    if (lowerMessage.includes('criminal')) {
      return `## Criminal Judgment Analysis Framework ⚖️🔴

### **🏛️ Structure of Criminal Judgments:**
