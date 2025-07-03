from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.summarize import load_summarize_chain
from langchain_groq import ChatGroq
from app.utils.pdf_reader import extract_text_from_pdf
from app.config import get_next_groq_api_key
from app.utils.logger import logger


# Enhanced prompts with focus on final judgments and structured outputs
PROMPTS = {
    'detailed': {
        'map': """
        Write a comprehensive legal analysis of the following content with special focus on FINAL JUDGMENTS. Include:
        
        ## FINAL JUDGMENT ANALYSIS
        - Complete final judgment/ruling details
        - Court's final determination and reasoning
        - Precedential value established
        - Appeal outcomes (if applicable)
        
        ## COMPREHENSIVE LEGAL ANALYSIS
        - Complete background context and case details
        - All key legal arguments and evidence presented
        - Legal precedents and citations mentioned
        - Court's complete reasoning process
        - Important procedural aspects and compliance
        - Any dissenting opinions or alternate judicial views
        
        ## STRATEGIC IMPLICATIONS
        - Impact on future similar cases
        - Broader legal landscape effects
        
        Content: {text}
        """,
        'combine': """
        Create a comprehensive legal summary in STRUCTURED MARKDOWN format:
        
        # COMPREHENSIVE LEGAL ANALYSIS
        
        ## FINAL JUDGMENT SUMMARY
        [Detailed analysis of final judicial determinations]
        
        ## CASE BACKGROUND
        [Complete case background and context]
        
        ## LEGAL ARGUMENTS & EVIDENCE
        [All significant legal arguments presented]
        
        ## COURT'S REASONING
        [Complete judicial reasoning process]
        
        ## PRECEDENTS & CITATIONS
        [All relevant precedents and legal citations]
        
        ## PROCEDURAL ANALYSIS
        [Procedural history and compliance issues]
        
        ## STRATEGIC IMPLICATIONS
        [Broader legal and precedential implications]
        
        Analyses: {text}
        """
    },
    'concise': {
        'map': """
        Extract key legal points focusing on FINAL JUDGMENTS:
        
        ## FINAL JUDGMENT
        - Court's final ruling/decision
        - Key legal determination
        - Immediate outcome
        
        ## ESSENTIAL POINTS
        - Main legal issue resolved
        - Critical arguments accepted/rejected
        - Precedential impact
        
        Content: {text}
        """,
        'combine': """
        Create a concise summary in STRUCTURED FORMAT:
        
        # KEY LEGAL POINTS SUMMARY
        
        ## FINAL JUDGMENT
        **Court's Determination:** [Final judicial ruling]
        **Legal Standard Applied:** [Key legal test/standard]
        **Outcome:** [Definitive result]
        
        ## CRITICAL FINDINGS
        **Primary Issue:** [Main legal question]
        **Key Evidence:** [Critical evidence considered]
        **Precedential Value:** [Future case impact]
        
        ## PRACTICAL IMPLICATIONS
        **Immediate Effect:** [Direct consequences]
        **Strategic Impact:** [Broader implications]
        
        Analyses: {text}
        """
    },
    'executive': {
        'map': """
        Provide executive summary focusing on FINAL JUDGMENTS and STRATEGIC IMPLICATIONS:
        
        ## FINAL JUDGMENT IMPACT
        - Business/strategic impact of final ruling
        - Risk assessment from judgment
        - Competitive implications
        
        ## EXECUTIVE INSIGHTS
        - Key business risks identified
        - Strategic recommendations
        - Compliance requirements
        - Action items for leadership
        
        Content: {text}
        """,
        'combine': """
        Create an executive summary in DASHBOARD FORMAT:
        
        # EXECUTIVE LEGAL SUMMARY
        
        ## FINAL JUDGMENT IMPACT
        **Strategic Significance:** [Business impact of ruling]
        **Risk Assessment:** [Key risks identified]
        **Competitive Position:** [Market implications]
        
        ## STRATEGIC RECOMMENDATIONS
        **Immediate Actions:** [Priority steps]
        **Risk Mitigation:** [Protective measures]
        **Opportunity Capture:** [Strategic advantages]
        
        ## COMPLIANCE REQUIREMENTS
        **Legal Obligations:** [New compliance needs]
        **Timeline:** [Critical deadlines]
        **Resources:** [Required allocations]
        
        ## BOTTOM LINE
        **Financial Impact:** [Cost/benefit analysis]
        **Strategic Priority:** [Importance level]
        **Next Steps:** [Action plan]
        
        Analyses: {text}
        """
    },
    'technical': {
        'map': """
        Provide a technical legal analysis:
        - Statutory framework
        - Case law analysis
        - Legal methodology
        - Precedential impact
        
        Content: {text}
        """,
        'combine': """
        Create a technical summary covering:
        - Legal principles and doctrines
        - Citations and precedents
        - Technical legal reasoning
        - Precedential analysis
        
        Analyses: {text}
        """
    },
    'bullets': {
        'map': """
        Extract key information as clear bullet points:
        • Main legal issue
        • Key parties involved
        • Primary arguments
        • Court's decision
        • Important outcomes
        
        Content: {text}
        """,
        'combine': """
        Organize into structured bullet points:
        
        ## Case Overview
        • [Main issue]
        
        ## Key Arguments
        • [Arguments]
        
        ## Decision
        • [Court decision]
        
        ## Implications
        • [Key outcomes]
        
        Analyses: {text}
        """
    }
}


def advanced_summarize_pdf(file_bytes: bytes, summary_type: str = 'detailed', method: str = 'abstractive') -> dict:
    """
    Advanced PDF summarization with multiple levels and methods
    """
    try:
        text = extract_text_from_pdf(file_bytes)
        logger.info(f"Starting {method} summarization with {summary_type} level")
        
        if method == 'abstractive':
            return _abstractive_summarize(text, summary_type)
        elif method == 'extractive':
            return _extractive_summarize(text, summary_type)
        else:  # hybrid
            return _hybrid_summarize(text, summary_type)
            
    except Exception as e:
        logger.error(f"Error in advanced PDF summarization: {e}")
        return _create_demo_response(summary_type, method)


def compare_summarize_pdf(file_bytes: bytes, summary_type: str = 'detailed') -> dict:
    """
    Generate all three summary methods for comparison
    """
    try:
        text = extract_text_from_pdf(file_bytes)
        
        abstractive = _abstractive_summarize(text, summary_type)
        extractive = _extractive_summarize(text, summary_type)
        hybrid = _hybrid_summarize(text, summary_type)
        
        return {
            'abstractive': abstractive,
            'extractive': extractive,
            'hybrid': hybrid,
            'analysis': {
                'total_source_words': len(text.split()),
                'compression_ratios': {
                    'abstractive': round(len(text.split()) / abstractive.get('word_count', 1), 2),
                    'extractive': round(len(text.split()) / extractive.get('word_count', 1), 2),
                    'hybrid': round(len(text.split()) / hybrid.get('word_count', 1), 2)
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error in summary comparison: {e}")
        return _create_comparison_demo_response(summary_type)


def _abstractive_summarize(text: str, level: str) -> dict:
    """Generate abstractive summary using Groq API"""
    try:
        chunks = [Document(page_content=text[i:i+3000]) for i in range(0, len(text), 3000)]
        
        prompts = PROMPTS.get(level, PROMPTS['detailed'])
        map_prompt = PromptTemplate.from_template(prompts['map'])
        combine_prompt = PromptTemplate.from_template(prompts['combine'])
        
        llm = ChatGroq(groq_api_key=get_next_groq_api_key(), model_name="llama3-8b-8192")
        chain = load_summarize_chain(
            llm, chain_type="map_reduce", 
            map_prompt=map_prompt, 
            combine_prompt=combine_prompt
        )
        
        result = chain.invoke(chunks)
        summary_text = result['output_text'] if isinstance(result, dict) else str(result)
        
        return {
            'summary': summary_text,
            'method': 'abstractive',
            'level': level,
            'word_count': len(summary_text.split()),
            'chunks_processed': len(chunks)
        }
        
    except Exception as e:
        logger.error(f"Error in abstractive summarization: {e}")
        return _create_demo_response(level, 'abstractive')


def _extractive_summarize(text: str, level: str) -> dict:
    """Generate extractive summary using sentence scoring"""
    try:
        sentences = text.split('.')
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        # Simple scoring based on word frequency
        words = text.lower().split()
        word_freq = {}
        for word in words:
            if len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Score sentences
        sentence_scores = []
        for i, sentence in enumerate(sentences):
            score = 0
            words_in_sentence = sentence.lower().split()
            for word in words_in_sentence:
                if word in word_freq:
                    score += word_freq[word]
            if len(words_in_sentence) > 0:
                score = score / len(words_in_sentence)
            sentence_scores.append((score, i, sentence))
        
        # Select top sentences based on level
        num_sentences = {
            'detailed': 10,
            'concise': 5,
            'executive': 6,
            'technical': 8,
            'bullets': 7
        }.get(level, 10)
        
        top_sentences = sorted(sentence_scores, key=lambda x: x[0], reverse=True)[:num_sentences]
        top_sentences = sorted(top_sentences, key=lambda x: x[1])  # Restore order
        
        summary = '. '.join([s[2] for s in top_sentences])
        
        return {
            'summary': summary,
            'method': 'extractive',
            'level': level,
            'word_count': len(summary.split()),
            'sentences_selected': len(top_sentences)
        }
        
    except Exception as e:
        logger.error(f"Error in extractive summarization: {e}")
        return _create_demo_response(level, 'extractive')


def _hybrid_summarize(text: str, level: str) -> dict:
    """Generate hybrid summary combining extractive and abstractive"""
    try:
        # First get extractive summary
        extractive_result = _extractive_summarize(text, level)
        
        # Then refine with abstractive
        refined_prompt = f"""
        Refine and improve the following extractive summary to make it more coherent and comprehensive:
        
        {extractive_result['summary']}
        
        Make it a {level} level summary with proper flow and structure.
        """
        
        llm = ChatGroq(groq_api_key=get_next_groq_api_key(), model_name="llama3-8b-8192")
        refined_summary = llm.invoke(refined_prompt).content
        
        return {
            'summary': refined_summary,
            'method': 'hybrid',
            'level': level,
            'word_count': len(refined_summary.split()),
            'extractive_base': extractive_result['sentences_selected']
        }
        
    except Exception as e:
        logger.error(f"Error in hybrid summarization: {e}")
        return _create_demo_response(level, 'hybrid')


def _create_demo_response(level: str, method: str) -> dict:
    """Create demo response when processing fails"""
    return {
        'summary': f"[DEMO MODE] This would be a {level} {method} summary of the legal document. Advanced AI processing would analyze the content and provide structured insights based on the selected level and method.",
        'method': method,
        'level': level,
        'word_count': 25,
        'demo_mode': True
    }


def _create_comparison_demo_response(level: str) -> dict:
    """Create demo comparison response"""
    return {
        'abstractive': _create_demo_response(level, 'abstractive'),
        'extractive': _create_demo_response(level, 'extractive'),
        'hybrid': _create_demo_response(level, 'hybrid'),
        'analysis': {
            'total_source_words': 1000,
            'compression_ratios': {
                'abstractive': 40.0,
                'extractive': 20.0,
                'hybrid': 30.0
            }
        },
        'demo_mode': True
    }
