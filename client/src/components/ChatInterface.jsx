import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ButtonSpinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ChatInterface() {
  const location = useLocation();
  
  // Don't show floating chat on dedicated chat page
  if (location.pathname === '/chat') {
    return null;
  }
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `# Welcome to CaseCrux Legal Assistant! 👋

I'm here to help you with:
- **Document Analysis**: Ask questions about your uploaded PDFs
- **Summary Clarification**: Explain complex legal terms and concepts  
- **Legal Guidance**: Provide general legal information
- **Translation Help**: Translate legal documents and summaries
- **Research Assistance**: Help find relevant legal information

**How to get started:**
- Upload some PDFs first, then ask me questions about them
- Type questions like "Explain my latest summary" or "What are the key risks?"
- I can access all your document history for context

What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [userSummaries, setUserSummaries] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user's summaries for context
  useEffect(() => {
    loadUserContext();
  }, []);

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
          recentSummaries: userSummaries.slice(0, 3).map(s => ({
            id: s._id,
            type: s.type,
            title: s.pdfName || s.category || 'Summary',
            preview: typeof s.summary === 'string' 
              ? s.summary.substring(0, 200) 
              : (s.summary?.output_text || s.finalSummary || '').substring(0, 200)
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
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I apologize, but I'm having trouble processing your request right now. Please try again in a moment.

**Error details:** ${err.response?.data?.error || err.message}`,
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
        "How do I upload documents?",
        "What languages do you support?"
      ];
    }

    return [
      "Explain my latest summary",
      "What are the key risks in my documents?",
      "Compare my recent summaries",
      "Translate my summary to Hindi",
      "What legal precedents are relevant?",
      "Summarize all my documents"
    ];
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Legal Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-[#23272f] border border-[#7f5af0] rounded-lg shadow-2xl w-96 h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">CaseCrux Assistant</span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-white/20 p-1 rounded"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#18181b]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white'
                    : 'bg-[#23272f] border border-[#7f5af0]/30 text-[#e0e7ef]'
                }`}
              >
                {message.type === 'assistant' ? (
                  <div className="prose prose-invert max-w-none prose-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-[#7f5af0] mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold text-[#2cb67d] mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-medium text-[#a786df] mb-1">{children}</h3>,
                        p: ({ children }) => <p className="text-sm text-[#e0e7ef] mb-2 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm text-[#e0e7ef]">{children}</ul>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="text-[#2cb67d] font-semibold">{children}</strong>,
                        code: ({ inline, children }) => 
                          inline ? (
                            <code className="bg-[#18181b] px-1 py-0.5 rounded text-[#7f5af0] text-xs">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-[#18181b] p-2 rounded overflow-x-auto">
                              <code className="text-[#2cb67d] text-xs">{children}</code>
                            </pre>
                          ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#23272f] border border-[#7f5af0]/30 text-[#e0e7ef] rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#7f5af0] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#7f5af0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#7f5af0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-[#a786df] ml-2">Assistant is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="p-3 border-t border-[#7f5af0]/30 bg-[#18181b]">
            <div className="text-xs text-[#a786df] mb-2">Quick questions:</div>
            <div className="flex flex-wrap gap-1">
              {getSuggestedQuestions().slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentMessage(question)}
                  className="text-xs bg-[#23272f] hover:bg-[#7f5af0]/20 text-[#7f5af0] px-2 py-1 rounded border border-[#7f5af0]/30 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[#7f5af0]/30 bg-[#23272f] rounded-b-lg">
          <div className="flex gap-2">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your legal documents..."
              className="flex-1 resize-none rounded-lg border border-[#7f5af0]/30 bg-[#18181b] text-[#e0e7ef] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7f5af0] focus:border-transparent"
              rows="2"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isTyping}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white font-medium text-sm transition-all duration-200 flex items-center gap-1 ${
                !currentMessage.trim() || isTyping ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {isTyping ? (
                <ButtonSpinner size="small" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
