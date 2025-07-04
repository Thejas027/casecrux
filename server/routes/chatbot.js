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

    // Find or create conversation
    let conversation;
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

    // Get user context for AI response
    const userContext = await buildUserContext(context);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, userContext);

    // Save AI response
    const assistantMessage = await ChatMessage.create({
      conversationId: conversation._id,
      type: 'assistant',
      content: aiResponse.content,
      metadata: aiResponse.metadata || {}
    });

    console.log("✅ Chat message processed successfully");
    res.json({
      response: aiResponse.content,
      conversationId: conversation._id,
      messageId: assistantMessage._id,
      metadata: aiResponse.metadata
    });

  } catch (error) {
    console.error("❌ Chat message failed:", error.message);
    console.error("📊 Error details:", error);
    
    res.status(500).json({
      error: "Failed to process chat message",
      details: error.message
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

    // Get user's summaries
    const [individualSummaries, batchSummaries, overallSummaries] = await Promise.all([
      Summary.find({}).sort({ createdAt: -1 }).limit(5),
      BatchSummaryHistory.find({}).sort({ createdAt: -1 }).limit(3),
      MultiSummary.find({}).sort({ createdAt: -1 }).limit(3)
    ]);

    context.summaries = [
      ...individualSummaries.map(s => ({
        id: s._id,
        type: 'individual',
        title: s.pdfName,
        content: typeof s.summary === 'string' ? s.summary : (s.summary?.output_text || ''),
        createdAt: s.createdAt
      })),
      ...batchSummaries.map(s => ({
        id: s._id,
        type: 'batch',
        title: s.category,
        content: s.summary?.raw || '',
        createdAt: s.createdAt
      })),
      ...overallSummaries.map(s => ({
        id: s._id,
        type: 'overall',
        title: 'Overall Analysis',
        content: s.finalSummary || '',
        createdAt: s.createdAt
      }))
    ];

    context.totalDocuments = individualSummaries.length;
    context.providedContext = providedContext;

    return context;
  } catch (error) {
    console.error("Failed to build user context:", error);
    return { summaries: [], totalDocuments: 0, recentActivity: [] };
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

    // Try to get AI response from ML service
    let aiContent;
    try {
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
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      aiContent = response.data.response || response.data.content || response.data.message;
      console.log("✅ AI response received from ML service");
      
    } catch (mlError) {
      console.warn("⚠️ ML service unavailable, using rule-based response");
      aiContent = generateRuleBasedResponse(message, context);
    }

    return {
      content: aiContent,
      metadata: {
        responseType: aiContent.includes('[RULE-BASED]') ? 'rule-based' : 'ai-generated',
        contextUsed: context.summaries?.length > 0,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      content: generateFallbackResponse(message),
      metadata: {
        responseType: 'fallback',
        error: error.message
      }
    };
  }
}

// Rule-based response for when ML service is unavailable
function generateRuleBasedResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  // Document-related questions
  if (lowerMessage.includes('summary') || lowerMessage.includes('document')) {
    if (context.summaries && context.summaries.length > 0) {
      return `## Your Document Analysis 📄

I can see you have **${context.summaries.length}** recent summaries in your account:

${context.summaries.slice(0, 3).map((summary, idx) => 
  `**${idx + 1}. ${summary.title}** (${summary.type} summary)\n` +
  `- Created: ${new Date(summary.createdAt).toLocaleDateString()}\n` +
  `- Preview: ${summary.content.substring(0, 150)}...\n`
).join('\n')}

**What would you like to know more about?**
- Explain specific legal terms
- Compare summaries
- Translate content
- Export summaries

*This is a rule-based response. For more detailed analysis, please ensure the ML service is properly configured.*`;
    } else {
      return `## Welcome to CaseCrux! 🏛️

I notice you haven't uploaded any documents yet. Here's how to get started:

**1. Upload Legal Documents**
- Go to "PDF Summarizer" to upload individual documents
- Use "Category Batch" for multiple related documents
- Supported formats: PDF files

**2. Get AI Analysis**
- Automatic legal summaries
- Key points extraction  
- Pros and cons analysis
- Risk assessment

**3. Advanced Features**
- Multi-language translation
- Batch processing
- Overall analysis across documents
- Export and sharing

**Ready to analyze your first document?** Head to the PDF Summarizer section!

*This is a rule-based response. For AI-powered analysis, please upload some documents first.*`;
    }
  }

  // Legal guidance questions
  if (lowerMessage.includes('legal') || lowerMessage.includes('law') || lowerMessage.includes('advice')) {
    return `## Legal Information & Guidance ⚖️

I can help you understand legal concepts, but please note:

**⚠️ IMPORTANT DISCLAIMER:** 
*This is general legal information only and not legal advice. Always consult with a qualified attorney for specific legal matters.*

**What I can help with:**
- **Document Analysis**: Explain terms in your uploaded documents
- **Legal Concepts**: Define legal terminology and procedures  
- **Research Guidance**: Suggest areas to investigate further
- **Document Organization**: Help structure your legal materials

**For your specific situation:**
${context.totalDocuments > 0 
  ? `I can analyze your ${context.totalDocuments} uploaded document(s) to provide context-specific insights.`
  : 'Upload your legal documents first, and I can provide specific analysis.'
}

**What specific legal topic would you like me to explain?**

*This is a rule-based response. For AI-powered legal analysis, ensure the ML service is configured.*`;
  }

  // Translation questions
  if (lowerMessage.includes('translate') || lowerMessage.includes('language')) {
    return `## Translation Services 🌐

CaseCrux supports multi-language translation for all your legal documents:

**Supported Languages:**
- Hindi (हिन्दी), Kannada (ಕನ್ನಡ)
- Tamil (தமிழ்), Telugu (తెలుగు)
- French, Spanish, German, Italian
- Portuguese, Russian, Japanese, Korean
- Chinese, Arabic, and more!

**How to translate:**
1. **Individual Summaries**: Use the translation section in any summary view
2. **Batch Summaries**: Translate entire category analyses  
3. **Chat Messages**: I can help translate specific content
4. **Export**: Download translated versions

${context.summaries?.length > 0 
  ? `**Your documents ready for translation:**\n${context.summaries.slice(0, 2).map(s => `- ${s.title}`).join('\n')}`
  : '**Upload documents first** to enable translation features.'
}

**What would you like to translate?**

*This is a rule-based response.*`;
  }

  // General help
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    return `## How Can I Help You? 🤝

I'm your CaseCrux Legal Assistant! Here's what I can do:

**📄 Document Analysis**
- Analyze uploaded PDFs for key insights
- Extract legal arguments, risks, and opportunities
- Provide structured summaries

**💬 Interactive Q&A**
- Answer questions about your documents
- Explain complex legal terminology
- Provide research guidance

**🌐 Translation Support**
- Translate documents to 15+ languages
- Multi-language legal communication
- Cultural context awareness

**📊 Comparative Analysis**
- Compare multiple documents
- Track legal themes across cases
- Overall portfolio insights

**Current Status:**
${context.totalDocuments > 0 
  ? `✅ You have ${context.totalDocuments} document(s) ready for analysis`
  : '📤 No documents uploaded yet - start by uploading a PDF!'
}

**Popular questions:**
- "Explain my latest summary"
- "What are the risks in this case?"
- "Compare my documents"
- "Translate this to Hindi"

**What would you like to explore?**

*This is a rule-based response.*`;
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

module.exports = router;
