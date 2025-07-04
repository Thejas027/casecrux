import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ButtonSpinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [userSummaries, setUserSummaries] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and user context
  useEffect(() => {
    loadConversations();
    loadUserContext();
    startNewConversation();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chat/conversations`);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadUserContext = async () => {
    try {
      const [summariesRes, batchRes, overallRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/summaries`).catch(() => ({ data: { summaries: [] } })),
        axios.get(`${BACKEND_URL}/api/batch-summary-history`).catch(() => ({ data: { history: [] } })),
        axios.get(`${BACKEND_URL}/api/overall-history`).catch(() => ({ data: { history: [] } }))
      ]);

      const allSummaries = [
        ...(summariesRes.data.summaries || []).map(s => ({ ...s, type: 'individual' })),
        ...(batchRes.data.history || []).map(s => ({ ...s, type: 'batch' })),
        ...(overallRes.data.history || []).map(s => ({ ...s, type: 'overall' }))
      ];

      setUserSummaries(allSummaries);
    } catch (err) {
      console.error('Failed to load user context:', err);
    }
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: `# Welcome to CaseCrux Legal Assistant! 🏛️

I'm your AI-powered legal companion, ready to help you navigate complex legal documents and provide insightful analysis.

## What I Can Help You With:

### 📄 **Document Analysis**
- Analyze your uploaded legal PDFs
- Extract key legal arguments and findings
- Identify risks, opportunities, and precedents
- Provide structured legal summaries

### 💬 **Interactive Q&A**
- Answer questions about your specific documents
- Explain complex legal terminology
- Clarify legal concepts and procedures
- Provide research guidance and suggestions

### 🌐 **Multi-Language Support**
- Translate legal documents to 15+ languages
- Explain translated legal terms and concepts
- Cross-cultural legal communication assistance

### 📊 **Comparative Analysis**
- Compare multiple legal documents
- Identify patterns across your case portfolio
- Track legal themes and precedents
- Generate comprehensive overall insights

## Quick Start Tips:

${userSummaries.length > 0 
  ? `**✅ Great! You have ${userSummaries.length} document(s) ready for analysis.**

**Try asking:**
- "Explain my latest summary"
- "What are the key risks in my documents?"
- "Compare my recent cases"
- "Translate my summary to [language]"`
  
  : `**📤 Ready to get started?**

**First steps:**
1. Upload your legal documents using the PDF Summarizer
2. Return here to ask questions about your documents
3. Get AI-powered insights and analysis

**Or ask me general questions like:**
- "How does legal document analysis work?"
- "What should I look for in contracts?"
- "Explain common legal terms"`
}

---

**⚖️ Legal Disclaimer:** I provide general legal information and document analysis, not legal advice. Always consult with qualified attorneys for specific legal matters.

**What would you like to explore today?**`,
        timestamp: new Date()
      }
    ]);
    setConversationId(null);
  };

  const loadConversation = async (convId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chat/conversation/${convId}`);
      const { conversation, messages: convMessages } = res.data;
      
      setConversationId(convId);
      setMessages(convMessages.map(msg => ({
        id: msg._id,
        type: msg.type,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        metadata: msg.metadata
      })));
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat/message`, {
        message: currentMessage,
        conversationId,
        context: {
          summariesCount: userSummaries.length,
          recentSummaries: userSummaries.slice(0, 5).map(s => ({
            id: s._id,
            type: s.type,
            title: s.pdfName || s.category || 'Summary',
            preview: typeof s.summary === 'string' 
              ? s.summary.substring(0, 300) 
              : (s.summary?.output_text || s.finalSummary || '').substring(0, 300)
          }))
        }
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        metadata: response.data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.conversationId && !conversationId) {
        setConversationId(response.data.conversationId);
        loadConversations(); // Refresh conversations list
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `## Oops! Something went wrong 🔧

I apologize, but I'm having trouble processing your request right now. This could be due to:

- **Network connectivity issues**
- **Service maintenance** 
- **High system load**

**What you can try:**
1. **Wait a moment** and try again
2. **Refresh the page** if needed
3. **Check your internet connection**

**Your question was:** "${currentMessage.substring(0, 100)}${currentMessage.length > 100 ? '...' : ''}"

**Error details:** ${err.response?.data?.error || err.message}

Please try again, and if the issue persists, contact our support team.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSuggestedQuestions = () => {
    if (userSummaries.length === 0) {
      return [
        "How does CaseCrux work?",
        "What types of legal documents can I analyze?",
        "How do I get started with document analysis?",
        "What languages do you support for translation?",
        "Explain legal document structure",
        "What should I look for in contracts?"
      ];
    }

    return [
      "Explain my latest document summary",
      "What are the key legal risks in my documents?",
      "Compare my recent legal cases",
      "Translate my summary to Hindi",
      "Find legal precedents relevant to my case",
      "Generate an overall analysis of all my documents",
      "What legal arguments are strongest in my files?",
      "Identify potential compliance issues"
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-[#23272f] border-r border-[#7f5af0]/30 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#7f5af0]/30">
            <h2 className="text-xl font-bold text-[#7f5af0] mb-2">Legal Assistant</h2>
            <div className="flex gap-2">
              <button
                onClick={startNewConversation}
                className="flex-1 bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white px-3 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
              >
                + New Chat
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-2 bg-[#18181b] border border-[#7f5af0]/30 rounded-lg text-sm hover:bg-[#7f5af0]/10 transition-colors"
              >
                Home
              </button>
            </div>
          </div>

          {/* Document Context */}
          <div className="p-4 border-b border-[#7f5af0]/30">
            <h3 className="text-sm font-semibold text-[#2cb67d] mb-2">Your Documents</h3>
            {userSummaries.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-[#a786df]">
                  📄 {userSummaries.filter(s => s.type === 'individual').length} Individual summaries
                </div>
                <div className="text-xs text-[#a786df]">
                  📚 {userSummaries.filter(s => s.type === 'batch').length} Batch analyses
                </div>
                <div className="text-xs text-[#a786df]">
                  🔍 {userSummaries.filter(s => s.type === 'overall').length} Overall insights
                </div>
                <div className="text-xs text-[#7f5af0] mt-2">
                  ✅ Ready for AI analysis
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#a786df]">
                📤 No documents yet
                <br />
                <span className="text-[#7f5af0] hover:underline cursor-pointer" onClick={() => navigate('/pdf-summarizer')}>
                  Upload your first PDF →
                </span>
              </div>
            )}
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-[#2cb67d] mb-2">Recent Conversations</h3>
            {conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.slice(0, 10).map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => loadConversation(conv._id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      conversationId === conv._id 
                        ? 'bg-[#7f5af0]/20 border border-[#7f5af0]/50' 
                        : 'bg-[#18181b] border border-[#7f5af0]/20 hover:bg-[#7f5af0]/10'
                    }`}
                  >
                    <div className="font-medium truncate text-[#e0e7ef]">
                      {conv.title}
                    </div>
                    <div className="text-[#a786df] mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#a786df]">
                No conversations yet
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-[#7f5af0]/30">
            <h3 className="text-sm font-semibold text-[#2cb67d] mb-2">Quick Actions</h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate('/pdf-summarizer')}
                className="w-full text-left text-xs text-[#7f5af0] hover:text-[#2cb67d] py-1"
              >
                📄 Upload Document
              </button>
              <button
                onClick={() => navigate('/category-batch-pdf-summarizer')}
                className="w-full text-left text-xs text-[#7f5af0] hover:text-[#2cb67d] py-1"
              >
                📚 Batch Analysis
              </button>
              <button
                onClick={() => setCurrentMessage("Explain all my documents")}
                className="w-full text-left text-xs text-[#7f5af0] hover:text-[#2cb67d] py-1"
              >
                🔍 Analyze All Docs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#23272f] border-b border-[#7f5af0]/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-[#7f5af0]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#7f5af0]">CaseCrux Legal Assistant</h1>
            <div className="bg-[#2cb67d]/20 text-[#2cb67d] px-2 py-1 rounded-full text-xs font-medium">
              AI-Powered
            </div>
          </div>
          <div className="text-sm text-[#a786df]">
            {userSummaries.length} documents ready for analysis
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-4xl rounded-xl p-4 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white'
                    : 'bg-[#23272f] border border-[#7f5af0]/30 text-[#e0e7ef]'
                }`}
              >
                {message.type === 'assistant' ? (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-[#7f5af0] mb-4 border-b border-[#7f5af0]/30 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold text-[#2cb67d] mb-3 mt-6">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-medium text-[#a786df] mb-2 mt-4">{children}</h3>,
                        p: ({ children }) => <p className="text-[#e0e7ef] mb-4 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-[#e0e7ef]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-[#e0e7ef]">{children}</ol>,
                        li: ({ children }) => <li className="text-[#e0e7ef] mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="text-[#2cb67d] font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="text-[#7f5af0] italic">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[#7f5af0] pl-4 italic text-[#a786df] my-4 bg-[#18181b] py-2 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        code: ({ inline, children }) => 
                          inline ? (
                            <code className="bg-[#18181b] px-2 py-1 rounded text-[#7f5af0] font-mono text-sm border border-[#7f5af0]/30">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-[#18181b] p-4 rounded-lg overflow-x-auto border border-[#7f5af0]/30 my-4">
                              <code className="text-[#2cb67d] font-mono text-sm">{children}</code>
                            </pre>
                          ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
                <div className="text-xs opacity-70 mt-3 flex items-center gap-2">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.metadata?.responseType && (
                    <span className="bg-black/20 px-2 py-0.5 rounded text-xs">
                      {message.metadata.responseType}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#23272f] border border-[#7f5af0]/30 text-[#e0e7ef] rounded-xl p-4 max-w-4xl">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#7f5af0] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#7f5af0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#7f5af0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-[#a786df] ml-2">Legal Assistant is analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="border-t border-[#7f5af0]/30 bg-[#18181b]/50 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-sm text-[#a786df] mb-3">💡 Suggested questions to get started:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {getSuggestedQuestions().slice(0, 6).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMessage(question)}
                    className="text-left text-sm bg-[#23272f] hover:bg-[#7f5af0]/20 text-[#7f5af0] p-3 rounded-lg border border-[#7f5af0]/30 transition-all duration-200 hover:border-[#7f5af0]/50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[#7f5af0]/30 bg-[#23272f] p-4">
          <div className="max-w-4xl mx-auto flex gap-4">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your legal documents, legal concepts, or how CaseCrux works..."
              className="flex-1 resize-none rounded-lg border border-[#7f5af0]/30 bg-[#18181b] text-[#e0e7ef] p-3 focus:outline-none focus:ring-2 focus:ring-[#7f5af0] focus:border-transparent"
              rows="3"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isTyping}
              className={`px-6 py-3 rounded-lg bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                !currentMessage.trim() || isTyping ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-[#7f5af0]/25'
              }`}
            >
              {isTyping ? (
                <ButtonSpinner />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
