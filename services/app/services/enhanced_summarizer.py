"""
Enhanced Summarizer Service with Multiple Levels and Methods
- Multiple summarization levels: detailed, concise, executive, technical, bullets
- Multiple methods: abstractive, extractive, hybrid
- Advanced text processing and analysis capabilities
"""

from typing import Dict, List, Union, Tuple
import re
import json
from collections import Counter
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.summarize import load_summarize_chain
from langchain.chains.llm import LLMChain
from langchain_groq import ChatGroq
from app.utils.pdf_reader import extract_text_from_pdf
from app.config import get_next_groq_api_key
from app.utils.logger import logger

# Text processing libraries for extractive summarization
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords


class SummaryLevelManager:
    """Manages different summary levels with specific prompts and configurations"""
    
    @staticmethod
    def get_prompts(level: str) -> Dict[str, str]:
        prompts = {
            'detailed': {
                'map': """
                Write a **comprehensive and detailed legal analysis** of the following content. Include:
                - Background context and case details
                - All key legal arguments and evidence
                - Legal precedents and citations mentioned
                - Court's reasoning and analysis
                - Important procedural aspects
                - Any dissenting opinions or alternate views
                
                Content: {text}
                """,
                'combine': """
                Given the detailed analyses below, create a **comprehensive legal summary** that:
                - Provides complete case background
                - Details all significant legal arguments
                - Explains the court's complete reasoning
                - Includes all relevant precedents and citations
                - Covers procedural history and outcomes
                - Maintains legal accuracy and thoroughness
                
                Analyses: {text}
                """
            },
            'concise': {
                'map': """
                Write a **concise summary** of the following legal content focusing on:
                - Core legal issue (1-2 sentences)
                - Key evidence or arguments (2-3 points)
                - Final outcome (1-2 sentences)
                
                Keep it under 200 words while maintaining accuracy.
                
                Content: {text}
                """,
                'combine': """
                Combine the following concise summaries into a **unified concise summary** (300 words max):
                - State the main legal issue clearly
                - Present key evidence/arguments briefly
                - Provide clear final outcome
                
                Summaries: {text}
                """
            },
            'executive': {
                'map': """
                Create an **executive summary** suitable for business decision-makers:
                - Business impact and implications
                - Financial or operational consequences
                - Risk assessment
                - Key takeaways for leadership
                
                Focus on business relevance, not legal technicalities.
                
                Content: {text}
                """,
                'combine': """
                Create a **unified executive summary** for senior leadership:
                - Overall business impact
                - Strategic implications
                - Risk factors to consider
                - Recommended actions or considerations
                
                Executive summaries: {text}
                """
            },
            'technical': {
                'map': """
                Provide a **technical legal analysis** for legal professionals:
                - Specific legal doctrines and principles applied
                - Statutory interpretations and citations
                - Precedential value and distinguishing factors
                - Procedural posture and jurisdictional issues
                - Technical legal reasoning and methodology
                
                Use appropriate legal terminology and citation format.
                
                Content: {text}
                """,
                'combine': """
                Synthesize the technical analyses into a **comprehensive legal technical summary**:
                - Consolidate legal principles and doctrines
                - Organize citations and precedents
                - Explain technical legal reasoning
                - Assess precedential impact
                
                Technical analyses: {text}
                """
            },
            'bullets': {
                'map': """
                Extract key information as **clear bullet points**:
                • Main legal issue
                • Key parties involved
                • Primary arguments (2-3 bullets)
                • Court's decision
                • Important outcomes or implications
                
                Use concise, scannable bullet format.
                
                Content: {text}
                """,
                'combine': """
                Organize the bullet points into a **structured summary**:
                
                ## Case Overview
                • [Main issue/dispute]
                
                ## Key Arguments
                • [Primary arguments, max 4 bullets]
                
                ## Court Decision  
                • [Decision and reasoning, max 3 bullets]
                
                ## Implications
                • [Key outcomes, max 3 bullets]
                
                Bullet points: {text}
                """
            }
        }
        return prompts.get(level, prompts['detailed'])


class ExtractiveSummarizer:
    """Handles extractive summarization using sentence ranking algorithms"""
    
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        
    def extract_sentences(self, text: str, num_sentences: int = 5) -> List[str]:
        """Extract top sentences using TF-IDF scoring"""
        sentences = sent_tokenize(text)
        if len(sentences) <= num_sentences:
            return sentences
            
        # Calculate TF-IDF scores for sentences
        vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        
        try:
            tfidf_matrix = vectorizer.fit_transform(sentences)
            sentence_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
            
            # Get top sentences by score
            top_indices = sentence_scores.argsort()[-num_sentences:][::-1]
            top_sentences = [sentences[i] for i in sorted(top_indices)]
            
            return top_sentences
        except Exception as e:
            logger.warning(f"TF-IDF extraction failed, using first sentences: {e}")
            return sentences[:num_sentences]
    
    def extract_key_phrases(self, text: str, num_phrases: int = 10) -> List[str]:
        """Extract key phrases using frequency analysis"""
        words = word_tokenize(text.lower())
        words = [w for w in words if w.isalpha() and w not in self.stop_words and len(w) > 3]
        
        # Get most common words/phrases
        word_freq = Counter(words)
        return [phrase for phrase, count in word_freq.most_common(num_phrases)]
    
    def create_extractive_summary(self, text: str, level: str) -> Dict[str, Union[str, List[str]]]:
        """Create extractive summary based on level"""
        level_configs = {
            'detailed': {'sentences': 15, 'phrases': 20},
            'concise': {'sentences': 8, 'phrases': 10},
            'executive': {'sentences': 6, 'phrases': 8},
            'technical': {'sentences': 12, 'phrases': 15},
            'bullets': {'sentences': 10, 'phrases': 12}
        }
        
        config = level_configs.get(level, level_configs['detailed'])
        
        key_sentences = self.extract_sentences(text, config['sentences'])
        key_phrases = self.extract_key_phrases(text, config['phrases'])
        
        # Format based on level
        if level == 'bullets':
            summary = "• " + "\n• ".join(key_sentences[:8])
        else:
            summary = " ".join(key_sentences)
            
        return {
            'summary': summary,
            'key_sentences': key_sentences,
            'key_phrases': key_phrases,
            'extraction_method': 'tfidf_ranking'
        }


class AdvancedSummarizer:
    """Main class handling multiple summarization levels and methods"""
    
    def __init__(self):
        self.extractive_summarizer = ExtractiveSummarizer()
        self.level_manager = SummaryLevelManager()
        
    def summarize_pdf(self, file_bytes: bytes, summary_type: str = 'detailed', 
                     method: str = 'abstractive') -> Dict:
        """
        Advanced PDF summarization with multiple levels and methods
        
        Args:
            file_bytes: PDF file content
            summary_type: 'detailed', 'concise', 'executive', 'technical', 'bullets'
            method: 'abstractive', 'extractive', 'hybrid'
        """
        try:
            text = extract_text_from_pdf(file_bytes)
            logger.info(f"Starting {method} summarization with {summary_type} level")
            
            if method == 'abstractive':
                return self._abstractive_summarize(text, summary_type)
            elif method == 'extractive':
                return self._extractive_summarize(text, summary_type)
            else:  # hybrid
                return self._hybrid_summarize(text, summary_type)
                
        except Exception as e:
            logger.error(f"Error in advanced PDF summarization: {e}")
            raise
    
    def _abstractive_summarize(self, text: str, level: str) -> Dict:
        """Generate abstractive summary using LLM"""
        chunks = [Document(page_content=text[i:i+3000]) 
                 for i in range(0, len(text), 3000)]
        
        prompts = self.level_manager.get_prompts(level)
        map_prompt = PromptTemplate.from_template(prompts['map'])
        combine_prompt = PromptTemplate.from_template(prompts['combine'])
        
        llm = ChatGroq(groq_api_key=get_next_groq_api_key(), model_name="llama3-8b-8192")
        chain = load_summarize_chain(
            llm, chain_type="map_reduce", 
            map_prompt=map_prompt, 
            combine_prompt=combine_prompt
        )
        
        result = chain.invoke(chunks)
        
        return {
            'summary': result['output_text'] if isinstance(result, dict) else str(result),
            'method': 'abstractive',
            'level': level,
            'word_count': len(result['output_text'].split()) if isinstance(result, dict) else len(str(result).split()),
            'processing_info': {
                'chunks_processed': len(chunks),
                'model_used': 'llama3-8b-8192'
            }
        }
    
    def _extractive_summarize(self, text: str, level: str) -> Dict:
        """Generate extractive summary using sentence ranking"""
        extractive_result = self.extractive_summarizer.create_extractive_summary(text, level)
        
        return {
            'summary': extractive_result['summary'],
            'method': 'extractive',
            'level': level,
            'word_count': len(extractive_result['summary'].split()),
            'key_sentences': extractive_result['key_sentences'],
            'key_phrases': extractive_result['key_phrases'],
            'processing_info': {
                'extraction_method': extractive_result['extraction_method'],
                'sentences_analyzed': len(sent_tokenize(text))
            }
        }
    
    def _hybrid_summarize(self, text: str, level: str) -> Dict:
        """Generate hybrid summary combining abstractive and extractive methods"""
        # Get extractive summary first
        extractive_result = self._extractive_summarize(text, level)
        
        # Use extractive key sentences as context for abstractive summary
        key_context = " ".join(extractive_result['key_sentences'][:10])
        
        prompts = self.level_manager.get_prompts(level)
        hybrid_prompt = f"""
        Using the following key extracted sentences as context, create a {level} summary that:
        1. Incorporates the most important extracted information
        2. Adds interpretive analysis and connections
        3. Maintains accuracy to the source material
        
        Key extracted context:
        {key_context}
        
        {prompts['map'].replace('{text}', 'Based on the extracted context above')}
        """
        
        llm = ChatGroq(groq_api_key=get_next_groq_api_key(), model_name="llama3-8b-8192")
        chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template("{prompt}"))
        
        abstractive_result = chain.run({"prompt": hybrid_prompt})
        
        return {
            'summary': abstractive_result,
            'method': 'hybrid',
            'level': level,
            'word_count': len(abstractive_result.split()),
            'key_sentences': extractive_result['key_sentences'],
            'key_phrases': extractive_result['key_phrases'],
            'processing_info': {
                'extractive_sentences': len(extractive_result['key_sentences']),
                'abstractive_model': 'llama3-8b-8192',
                'hybrid_approach': 'extractive_guided_abstractive'
            }
        }
    
    def compare_summaries(self, file_bytes: bytes, level: str = 'detailed') -> Dict:
        """Generate all three summary methods for comparison"""
        try:
            text = extract_text_from_pdf(file_bytes)
            
            abstractive = self._abstractive_summarize(text, level)
            extractive = self._extractive_summarize(text, level)
            hybrid = self._hybrid_summarize(text, level)
            
            return {
                'comparison_results': {
                    'abstractive': abstractive,
                    'extractive': extractive,
                    'hybrid': hybrid
                },
                'analysis': {
                    'total_source_words': len(text.split()),
                    'compression_ratios': {
                        'abstractive': round(len(text.split()) / abstractive['word_count'], 2),
                        'extractive': round(len(text.split()) / extractive['word_count'], 2),
                        'hybrid': round(len(text.split()) / hybrid['word_count'], 2)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in summary comparison: {e}")
            raise


# Create global instance
advanced_summarizer = AdvancedSummarizer()
