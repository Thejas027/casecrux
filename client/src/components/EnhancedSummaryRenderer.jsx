import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Enhanced Summary Renderer Component
const EnhancedSummaryRenderer = ({ summaryData, title = "Legal Analysis" }) => {
  // Helper function to render different types of summary data
  const renderSummaryContent = (data) => {
    if (typeof data === 'string') {
      return (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-[#7f5af0] mb-4 border-b border-[#7f5af0]/30 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold text-[#2cb67d] mb-3 mt-6">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-[#e0e7ef] mb-2 mt-4">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-[#e0e7ef] mb-4 leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 space-y-1 text-[#e0e7ef]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-1 text-[#e0e7ef]">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-[#e0e7ef] mb-1">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[#7f5af0] pl-4 italic text-[#a786df] mb-4">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="text-[#2cb67d] font-semibold">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="text-[#7f5af0] italic">
                  {children}
                </em>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border border-[#7f5af0]/30 rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-[#7f5af0]/20">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="bg-[#18181b]/50">
                  {children}
                </tbody>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2 text-left text-[#7f5af0] font-semibold border-b border-[#7f5af0]/30">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 text-[#e0e7ef] border-b border-[#7f5af0]/10">
                  {children}
                </td>
              ),
            }}
          >
            {data}
          </ReactMarkdown>
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      return renderStructuredData(data);
    }

    return <div className="text-[#e0e7ef]">{String(data)}</div>;
  };

  // Helper function to render structured JSON data
  const renderStructuredData = (data) => {
    return (
      <div className="space-y-6">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-[#18181b] rounded-lg p-6 border border-[#7f5af0]/30">
            <h4 className="text-lg font-semibold text-[#7f5af0] mb-4 capitalize">
              {key.replace(/_/g, ' ')}
            </h4>
            {renderValue(value)}
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render different types of values
  const renderValue = (value) => {
    if (typeof value === 'string') {
      if (value.includes('##') || value.includes('**') || value.includes('###')) {
        return (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          </div>
        );
      }
      return <div className="text-[#e0e7ef] whitespace-pre-line">{value}</div>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc pl-6 space-y-2">
          {value.map((item, index) => (
            <li key={index} className="text-[#e0e7ef]">
              {typeof item === 'string' ? item : (item.output_text || 'No content available')}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-3">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="bg-[#23272f] rounded-lg p-4 border border-[#2cb67d]/20">
              <h5 className="text-md font-medium text-[#2cb67d] mb-2 capitalize">
                {subKey.replace(/_/g, ' ')}
              </h5>
              {renderValue(subValue)}
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-[#e0e7ef]">{String(value)}</div>;
  };

  // Special handling for different summary types
  const getSummaryIcon = (data) => {
    if (data.batch_type === 'detailed_comprehensive') return '📋';
    if (data.batch_type === 'concise_key_points') return '⚖️';
    if (data.batch_type === 'executive_strategic') return '📊';
    if (data.analysis_type === 'category_batch_analysis') return '📁';
    return '📄';
  };

  const getSummaryTitle = (data) => {
    if (data.batch_type === 'detailed_comprehensive') return 'Comprehensive Legal Analysis';
    if (data.batch_type === 'concise_key_points') return 'Key Legal Points & Final Judgments';
    if (data.batch_type === 'executive_strategic') return 'Executive Strategic Summary';
    if (data.analysis_type === 'category_batch_analysis') return 'Category Batch Analysis';
    return title;
  };

  return (
    <div className="enhanced-summary-renderer">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{getSummaryIcon(summaryData)}</span>
        <h2 className="text-2xl font-bold text-[#7f5af0]">
          {getSummaryTitle(summaryData)}
        </h2>
      </div>

      {/* Summary Type Badge */}
      {summaryData.batch_type && (
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#7f5af0]/20 text-[#7f5af0] border border-[#7f5af0]/30">
            {summaryData.batch_type.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      )}

      {/* Confidence and Metadata */}
      {(summaryData.confidence_level || summaryData.format) && (
        <div className="flex gap-4 mb-6">
          {summaryData.confidence_level && (
            <div className="flex items-center gap-2 text-sm text-[#2cb67d]">
              <span>🎯</span>
              <span>Confidence: {summaryData.confidence_level}</span>
            </div>
          )}
          {summaryData.format && (
            <div className="flex items-center gap-2 text-sm text-[#7f5af0]">
              <span>📋</span>
              <span>Format: {summaryData.format.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {renderSummaryContent(summaryData)}
      </div>

      {/* Demo Mode Notice */}
      {summaryData.demo_mode && (
        <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <span>⚠️</span>
            <span className="font-semibold">Demo Mode</span>
          </div>
          <p className="text-yellow-300 mt-2 text-sm">
            This is a demonstration of the enhanced summary rendering capabilities. 
            In production, this would contain actual AI-generated legal analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSummaryRenderer;
