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

// Enhanced Rule-based response system with comprehensive legal knowledge
function generateRuleBasedResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  // Advanced judgment and case law queries
  if (lowerMessage.includes('judgment') || lowerMessage.includes('judgement') || lowerMessage.includes('case law') ||
      lowerMessage.includes('precedent') || lowerMessage.includes('supreme court') || lowerMessage.includes('high court') ||
      lowerMessage.includes('landmark') || lowerMessage.includes('ratio') || lowerMessage.includes('obiter') ||
      lowerMessage.includes('appeal') || lowerMessage.includes('revision') || lowerMessage.includes('bail order') ||
      lowerMessage.includes('sentence') || lowerMessage.includes('acquittal') || lowerMessage.includes('conviction')) {
    
    return handleJudgmentAndCaseLawQuery(message, lowerMessage, context);
  }

  // Specific legal questions about laws, sections, and cases
  if (lowerMessage.includes('section') || lowerMessage.includes('ipc') || lowerMessage.includes('crpc') || 
      lowerMessage.includes('robbery') || lowerMessage.includes('theft') || lowerMessage.includes('murder') ||
      lowerMessage.includes('criminal') || lowerMessage.includes('civil') || lowerMessage.includes('law') ||
      lowerMessage.includes('code') || lowerMessage.includes('act') || lowerMessage.includes('procedure')) {
    
    return handleSpecificLegalQuery(message, lowerMessage, context);
  }

  // Document-related questions with AI-like analysis
  if (lowerMessage.includes('summary') || lowerMessage.includes('document') || 
      lowerMessage.includes('explain') || lowerMessage.includes('analyze')) {
    
    if (context.summaries && context.summaries.length > 0) {
      // AI-like document analysis
      const documentTypes = [...new Set(context.summaries.map(s => s.type))];
      const recentDocs = context.summaries.slice(0, 3);
      
      return `## Your Legal Document Portfolio Analysis 📊

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

  // Translation with AI-like language processing
  if (lowerMessage.includes('translate') || lowerMessage.includes('language') || 
      lowerMessage.includes('hindi') || lowerMessage.includes('spanish')) {
    
    return `## AI-Powered Legal Translation Services 🌐🤖

I can help you navigate legal documents across multiple languages with intelligent translation that preserves legal meaning and context.

### **Advanced Translation Capabilities:**

**📚 Supported Languages (${context.summaries?.length > 0 ? 'Ready for your documents' : 'Available when you upload documents'}):**

**Indian Languages:**
- 🇮🇳 Hindi (हिन्दी) - Full legal terminology support
- 🇮🇳 Kannada (ಕನ್ನಡ) - Regional legal context
- 🇮🇳 Tamil (தமிழ்) - Traditional legal terms
- 🇮🇳 Telugu (తెలుగు) - Commercial law focus

**International Languages:**
- 🇪🇸 Spanish - Contract and business law
- 🇫🇷 French - International legal frameworks
- 🇩🇪 German - Regulatory and compliance
- 🇮🇹 Italian - Commercial and civil law
- 🇵🇹 Portuguese - Brazilian legal system
- 🇷🇺 Russian - Eastern European legal context
- 🇯🇵 Japanese - Asian business law
- 🇰🇷 Korean - Technology and IP law
- 🇨🇳 Chinese - Trade and investment law
- 🇸🇦 Arabic - Islamic legal principles

### **Intelligent Translation Features:**
- **Legal Term Preservation** → Maintains critical legal meanings
- **Cultural Context** → Adapts to local legal systems
- **Consistent Terminology** → Uses standardized legal vocabulary
- **Format Preservation** → Keeps document structure intact

${context.summaries?.length > 0 
  ? `### **Your Documents Ready for Translation:**
${context.summaries.slice(0, 3).map((s, idx) => 
  `**${idx + 1}. ${s.title}** (${s.type})
   - Document type: ${categorizeDocument(s.content)}
   - Translation complexity: ${assessTranslationComplexity(s.content)}
   - Recommended languages: ${suggestLanguages(s.content)}`
).join('\n')}

**Translation Process:**
1. Select document → Choose target language → Review translation
2. I maintain legal accuracy while ensuring readability
3. Export in your preferred format`
  : `### **Getting Started with Translation:**
1. Upload your legal documents first
2. I'll analyze content and suggest optimal translation approaches
3. Choose target languages based on your needs
4. Receive professionally translated legal content`
}

**What documents would you like me to help translate?**`;
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

  // Fallback with AI personality
  return `## I'm Here to Help with Your Legal Questions! 🤖

Thanks for reaching out! I'm your AI legal assistant, and I'm ready to help you with any legal document questions or analysis.

### **What I Understood:**
You asked: *"${message}"*

### **How I Can Assist:**
Based on your question, I can help you with:

**📄 Document Analysis**
- Review and explain legal documents
- Identify important terms and clauses
- Assess risks and opportunities
- Provide structured summaries

**💡 Legal Guidance**
- Explain legal concepts in simple terms
- Guide you through legal processes
- Suggest areas for professional review
- Help with document organization

**🔍 Research Support**
- Answer specific legal questions
- Compare different documents
- Provide context for legal terms
- Translate legal content

${context.summaries?.length > 0 
  ? `### **Your Current Documents:**
I can see you have **${context.summaries.length}** summaries available. I can analyze these documents and answer specific questions about them.

**Try asking:**
- "What are the main points in my documents?"
- "Explain the legal terms in my contracts"
- "What should I be concerned about?"
- "How do these documents compare?"`
  : `### **Getting Started:**
Upload your legal documents first, then I can provide detailed analysis and answer specific questions about your legal materials.`
}

**Could you rephrase your question or let me know what specific legal topic you'd like help with?**

I'm here to make legal documents easier to understand! 🚀`;
}

// Advanced Judgment and Case Law Analysis System
function handleJudgmentAndCaseLawQuery(message, lowerMessage, context) {
  
  // Judgment analysis
  if (lowerMessage.includes('judgment') || lowerMessage.includes('judgement')) {
    return `## Advanced Judgment Analysis System ⚖️📊

### **🎯 Comprehensive Judgment Analysis:**

**1. Judgment Structure Review**
- **Header Analysis**: Court jurisdiction, case details, parties
- **Facts Summary**: Incident chronology, evidence overview
- **Legal Framework**: Applicable laws and precedents cited
- **Reasoning Quality**: Logic flow and legal soundness
- **Conclusion Validity**: Findings and final orders

**2. Quality Assessment (1-10 Scale)**
- **Evidence Evaluation**: Witness credibility, document analysis
- **Precedent Application**: Relevant case law citation
- **Legal Reasoning**: Clarity and logical progression
- **Procedural Compliance**: Court rules adherence
- **Order Appropriateness**: Relief granted vs. sought

### **🔍 Criminal Judgment Analysis:**

**Key Elements to Review:**
- **Charge Sheet Analysis**: Sections invoked, evidence summary
- **Prosecution Case**: Witness examination, expert evidence
- **Defense Strategy**: Cross-examination, alternative theory
- **Court's Findings**: Evidence appreciation, guilt assessment
- **Sentencing**: Punishment quantum, victim compensation

**Quality Indicators:**
- ✅ Detailed evidence analysis
- ✅ Relevant precedents cited
- ✅ Clear reasoning for conclusions
- ✅ Proper legal framework application

### **📋 Civil Judgment Analysis:**

**Structure Elements:**
- **Pleadings Review**: Plaint, written statement, issues
- **Evidence Assessment**: Plaintiff/defendant evidence
- **Legal Application**: Contract, tort, property law
- **Relief Analysis**: Decree type, execution prospects

**Appeal Grounds:**
- Misappreciation of evidence
- Wrong application of law
- Procedural violations
- Inadequate reasoning

### **⚖️ Appeal Viability Assessment:**

**Strong Appeal Grounds:**
- Legal errors in judgment
- Factual findings against evidence
- Procedural non-compliance
- Perverse conclusions

**Success Probability Factors:**
- Error gravity and impact
- Precedent support availability
- Evidence strength review
- Cost-benefit analysis

${context.summaries?.length > 0 
  ? `\n**Your Judgment Documents:**
I can analyze your uploaded judgments for:
- Quality assessment (1-10 rating)
- Appeal prospects and strategy
- Legal precedent research
- Error identification
- Strategic recommendations

**Ask me:**
- "Analyze this judgment quality"
- "What are my appeal chances?"
- "Rate this judgment's legal merit"
- "Find grounds for appeal"`
  : ''
}

**What specific judgment analysis would you like me to perform?**`;
  }

  // Case law and precedent research
  if (lowerMessage.includes('case law') || lowerMessage.includes('precedent')) {
    return `## Case Law & Precedent Research System 📚⚖️

### **🎯 Comprehensive Precedent Research:**

**1. Precedent Hierarchy Analysis**
- **Supreme Court**: Binding on all courts nationwide
- **High Court**: Binding within state jurisdiction
- **Coordinate Benches**: Persuasive value
- **Foreign Courts**: Academic reference only

**2. Legal Principle Extraction**
- **Ratio Decidendi**: Core binding principle
- **Obiter Dicta**: Persuasive judicial observations
- **Per Incuriam**: Decision without relevant law
- **Sub Silentio**: Point not specifically considered

### **📊 Research Categories:**

**Criminal Law Precedents:**
- Evidence appreciation standards
- Confession admissibility rules
- Death penalty guidelines
- Bail jurisprudence evolution

**Civil Law Precedents:**
- Contract interpretation principles
- Tort liability standards
- Property rights evolution
- Commercial law development

**Constitutional Precedents:**
- Fundamental rights expansion
- Directive principles implementation
- Federal structure interpretation
- Judicial review scope

### **🔍 Advanced Research Features:**

**Precedent Search by:**
- Legal principle or doctrine
- Factual similarity matrix
- Court and judge preferences
- Time period analysis

**Application Strategy:**
- Direct precedent citation
- Analogical reasoning application
- Adverse case distinguishing
- Policy argument support

**Precedent Strength Assessment:**
- Binding vs. persuasive value
- Factual similarity degree
- Legal principle clarity
- Current validity status

### **📚 Major Landmark Cases:**

**Constitutional Law:**
- Kesavananda Bharati (Basic Structure)
- Maneka Gandhi (Article 21 expansion)
- Minerva Mills (Constitutional balance)

**Criminal Law:**
- Bachan Singh (Death penalty guidelines)
- Lily Thomas (Instant triple talaq)
- Aarushi case (Circumstantial evidence)

**Civil Law:**
- M.C. Mehta (Environmental law)
- Vishaka (Sexual harassment)
- Common Cause (Right to die)

${context.summaries?.length > 0 
  ? `\n**Your Case Research:**
I can help research precedents for your documents:
- Find relevant Supreme Court decisions
- Identify supporting precedents
- Distinguish adverse cases
- Build legal argument framework
- Create precedent citation lists`
  : ''
}

**What specific precedent research do you need?**`;
  }

  // Supreme Court specific
  if (lowerMessage.includes('supreme court')) {
    return `## Supreme Court Judgment Research 🇮🇳⚖️

### **🏛️ Supreme Court Authority:**

**Constitutional Powers:**
- Final interpreter of Constitution
- Guardian of fundamental rights
- Federal dispute resolution
- Judicial review authority

**Jurisdiction Types:**
- **Original**: Inter-state disputes, fundamental rights
- **Appellate**: Civil, criminal, constitutional appeals
- **Advisory**: Presidential reference under Article 143
- **Writ**: Article 32 jurisdiction

### **📚 Landmark SC Judgments:**

**Fundamental Rights:**
- **Right to Life**: Maneka Gandhi, Francis Coralie
- **Equality**: E.P. Royappa, Indra Sawhney
- **Speech**: Bennett Coleman, Indian Express
- **Religion**: S.R. Bommai, Aruna Roy

**Criminal Law:**
- **Death Penalty**: Bachan Singh, Machhi Singh
- **Evidence**: Sharad Birdhichand, State of UP v. Krishna Gopal
- **Procedure**: D.K. Basu, Joginder Kumar
- **Bail**: Gurbaksh Singh, Sanjay Chandra

**Civil Law:**
- **Contract**: Satyabrata Ghose, Alopi Parshad
- **Tort**: Municipal Corporation v. Subhash Chandra
- **Property**: State of Tamil Nadu v. L. Abu Kavur Bai

### **🔍 SC Judgment Analysis:**

**Structure Elements:**
- Comprehensive fact summary
- Extensive legal research
- Multiple precedent discussion
- Clear ratio decidendi
- Practical implementation guidelines

**Quality Standards:**
- Constitutional interpretation depth
- Legal principle clarity
- Precedent harmonization
- Future guidance provision

**Research Methodology:**
- Issue-wise precedent search
- Bench composition analysis
- Judicial philosophy trends
- Dissenting opinion value

${context.summaries?.length > 0 
  ? `\n**Supreme Court Research for Your Cases:**
I can help find SC precedents relevant to your documents:
- Constitutional law applications
- Civil and criminal precedents
- Procedural compliance standards
- Recent SC developments
- Citation and application strategy`
  : ''
}

**Which Supreme Court area would you like to research?**`;
  }

  // Default judgment response
  return `## Legal Judgment & Case Law Services 🏛️⚖️

### **🎯 Available Analysis Services:**

**Judgment Quality Assessment:**
- Structure and legal framework review
- Evidence evaluation quality check
- Precedent citation analysis
- Reasoning clarity assessment
- Appeal viability determination

**Case Law Research:**
- Relevant precedent identification
- Legal principle extraction
- Application strategy development
- Counter-precedent analysis
- Citation methodology

**Strategic Legal Analysis:**
- Error identification and impact
- Success probability assessment
- Cost-benefit evaluation
- Timeline and procedure guidance
- Alternative remedy exploration

### **📚 Specialized Areas:**

**Criminal Matters:**
- Conviction/acquittal analysis
- Evidence appreciation review
- Sentencing guideline compliance
- Procedural error identification

**Civil Disputes:**
- Decree enforcement prospects
- Evidence sufficiency review
- Legal principle application
- Relief adequacy assessment

**Constitutional Issues:**
- Fundamental rights impact
- Constitutional validity questions
- PIL effectiveness review
- Remedy appropriateness

### **🔍 Research Capabilities:**

- Supreme Court precedent database
- High Court judgment analysis
- Similar case identification
- Legal trend analysis
- Argument strengthening support

**Upload your judgment documents and ask specific questions for comprehensive analysis!**

**Examples:**
- "Analyze this judgment quality"
- "Find relevant precedents"
- "What are my appeal chances?"
- "Research Supreme Court cases on [topic]"`;
}

// Handle specific legal queries with comprehensive legal knowledge
function handleSpecificLegalQuery(message, lowerMessage, context) {
  // Robbery-related queries
  if (lowerMessage.includes('robbery')) {
    return `## Legal Sections for Robbery Cases 🏛️⚖️

Based on your query about robbery cases, here's a comprehensive breakdown of applicable legal sections:

### **🔴 Primary Criminal Sections (Indian Penal Code - IPC):**

**Section 390 - Robbery**
- **Definition**: Theft + extortion = robbery
- **Elements**: When theft is committed with intent to cause death, hurt, or wrongful restraint
- **Punishment**: Imprisonment up to 10 years + fine

**Section 391 - Dacoity** 
- **Definition**: When 5 or more persons commit or attempt robbery
- **Punishment**: Imprisonment for life or up to 10 years + fine

**Section 392 - Punishment for Robbery**
- **Basic Punishment**: Rigorous imprisonment up to 10 years + fine
- **Minimum**: 3 years imprisonment (in most states)

**Section 393 - Attempt to Commit Robbery**
- **Punishment**: Imprisonment up to 7 years + fine
- **Note**: Attempt itself is punishable even if robbery not completed

**Section 394 - Robbery with Hurt**
- **Enhanced Punishment**: Imprisonment for life or up to 10 years
- **Aggravated Form**: When hurt is voluntarily caused during robbery

**Section 395 - Dacoity with Murder**
- **Maximum Punishment**: Death penalty or imprisonment for life
- **Most Serious**: When murder is committed during dacoity

### **🔵 Related Criminal Sections:**

**Section 379 - Theft** (often combined with robbery)
**Section 384 - Extortion** (component of robbery)
**Section 354 - Assault/Criminal Force** (if woman molested during robbery)
**Section 307 - Attempt to Murder** (if applicable during robbery)
**Section 302 - Murder** (if death occurs during robbery)

### **📋 Procedural Sections (CrPC):**

**Section 41 - Arrest Without Warrant**
- Police can arrest for robbery (cognizable, non-bailable offense)

**Section 154 - FIR Registration**
- Mandatory FIR for robbery cases

**Section 161 - Recording Statements**
- Victim and witness statement procedures

**Section 207 - Supply of Copies**
- Providing case documents to accused

### **📊 Case Analysis Framework:**

**Investigation Steps:**
1. **FIR under Section 392 IPC** (primary charge)
2. **Scene of crime analysis** and evidence collection  
3. **Victim statement** under Section 161 CrPC
4. **Witness examination** and identification parade
5. **Recovery of stolen property** (if any)
6. **Medical examination** (if hurt caused)

**Charge Sheet Sections:**
- Primary: IPC 392 (Robbery)
- Additional: IPC 394 (if hurt caused)
- Supplementary: IPC 379 (theft), 384 (extortion)

**Punishment Guidelines:**
- **Simple Robbery**: 3-10 years RI + fine
- **Robbery with Hurt**: Life imprisonment or 10 years
- **Dacoity**: Life imprisonment or 10 years  
- **Dacoity with Murder**: Death or life imprisonment

### **⚖️ Legal Strategy Considerations:**

**For Prosecution:**
- Establish theft + extortion elements
- Prove intention to cause death/hurt/restraint
- Strong identification evidence required
- Recovery of stolen property strengthens case

**For Defense:**
- Challenge identification evidence
- Question intention element
- Argue lack of threat/force
- Explore compromise possibilities

${context.summaries?.length > 0 
  ? `\n**Analysis of Your Documents:**
If you have robbery-related case documents, I can help analyze them for:
- Applicable sections and charges
- Evidence requirements
- Procedural compliance
- Defense strategies`
  : ''
}

**Would you like me to explain any specific section in detail or discuss robbery case strategies?**`;
  }

  // For other legal queries, provide comprehensive legal information
  return `## Comprehensive Legal Information System 📚⚖️

I can provide detailed information about:

### **🔴 Criminal Law:**
- **IPC Sections**: All major crimes with definitions and punishments
- **CrPC Procedures**: Investigation, arrest, trial procedures
- **Evidence Law**: Proof standards, evidence rules
- **Special Laws**: NDPS, POCSO, Prevention of Corruption

### **🔵 Civil Law:**
- **Contract Law**: Formation, breach, remedies
- **Property Law**: Transfer, ownership, disputes
- **Family Law**: Marriage, divorce, succession
- **Tort Law**: Negligence, defamation, damages

### **📋 Specific Legal Topics:**
- Crime sections and punishments
- Court procedures and jurisdiction
- Legal definitions and interpretations
- Case law and precedents
- Rights and remedies available

**Please ask me about any specific legal topic, section, or procedure!**

**Examples:**
- "What are sections for theft cases?"
- "Explain bail provisions in CrPC"
- "What is difference between 302 and 304 IPC?"
- "How to file civil suit?"
- "What are dowry case sections?"`;
}

// Helper functions for AI-like analysis
function extractKeyLegalTerms(content) {
  const legalTerms = [
    'contract', 'agreement', 'liability', 'indemnification', 'breach', 'termination',
    'intellectual property', 'confidentiality', 'non-disclosure', 'warranty', 'damages',
    'force majeure', 'jurisdiction', 'governing law', 'arbitration', 'mediation',
    'employment', 'severance', 'non-compete', 'consideration', 'obligations'
  ];
  
  const foundTerms = legalTerms.filter(term => 
    content.toLowerCase().includes(term.toLowerCase())
  );
  
  return foundTerms.slice(0, 3);
}

function generateDocumentAssessment(content, type) {
  const lowerContent = content.toLowerCase();
  
  if (type === 'individual') {
    if (lowerContent.includes('contract') || lowerContent.includes('agreement')) {
      if (lowerContent.includes('liability') || lowerContent.includes('risk')) {
        return "This appears to be a comprehensive agreement with defined liability provisions. Key focus should be on understanding risk allocation.";
      }
      return "Standard contractual document with typical terms and conditions. Review recommended for specific obligations.";
    }
    if (lowerContent.includes('employment')) {
      return "Employment-related document requiring attention to compensation, benefits, and termination clauses.";
    }
    return "Legal document requiring professional review for compliance and risk assessment.";
  }
  
  if (type === 'batch') {
    return "Multi-document analysis revealing patterns and trends across related legal materials.";
  }
  
  if (type === 'overall') {
    return "Comprehensive portfolio analysis providing strategic insights across all documents.";
  }
  
  return "Document contains important legal provisions requiring careful review.";
}

function generateRecommendations(summaries) {
  const recommendations = [];
  
  if (summaries.length >= 3) {
    recommendations.push("Consider conducting a comprehensive legal audit across all documents");
  }
  
  const hasContracts = summaries.some(s => 
    s.content.toLowerCase().includes('contract') || s.content.toLowerCase().includes('agreement')
  );
  
  if (hasContracts) {
    recommendations.push("Review all contractual obligations and deadlines for compliance");
  }
  
  const hasEmployment = summaries.some(s => 
    s.content.toLowerCase().includes('employment') || s.content.toLowerCase().includes('employee')
  );
  
  if (hasEmployment) {
    recommendations.push("Ensure employment documents align with current labor law requirements");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Regular legal review recommended to ensure ongoing compliance");
  }
  
  return recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n');
}

function categorizeDocument(content) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('employment') || lowerContent.includes('employee')) {
    return "Employment Agreement";
  }
  if (lowerContent.includes('nda') || lowerContent.includes('confidentiality')) {
    return "Confidentiality Agreement";
  }
  if (lowerContent.includes('license') || lowerContent.includes('licensing')) {
    return "License Agreement";
  }
  if (lowerContent.includes('service') || lowerContent.includes('services')) {
    return "Service Agreement";
  }
  if (lowerContent.includes('lease') || lowerContent.includes('rental')) {
    return "Lease Agreement";
  }
  
  return "Legal Contract";
}

function assessTranslationComplexity(content) {
  const legalTermCount = extractKeyLegalTerms(content).length;
  const contentLength = content.length;
  
  if (legalTermCount >= 3 && contentLength > 500) {
    return "High (Complex legal terminology)";
  }
  if (legalTermCount >= 2 || contentLength > 300) {
    return "Medium (Standard legal content)";
  }
  return "Low (Basic legal document)";
}

function suggestLanguages(content) {
  const lowerContent = content.toLowerCase();
  const suggestions = [];
  
  if (lowerContent.includes('international') || lowerContent.includes('global')) {
    suggestions.push("Spanish, French, Chinese");
  } else if (lowerContent.includes('india') || lowerContent.includes('indian')) {
    suggestions.push("Hindi, Tamil, Kannada");
  } else if (lowerContent.includes('business') || lowerContent.includes('commercial')) {
    suggestions.push("Spanish, German, Japanese");
  } else {
    suggestions.push("Hindi, Spanish, French");
  }
  
  return suggestions[0] || "Hindi, Spanish";
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
