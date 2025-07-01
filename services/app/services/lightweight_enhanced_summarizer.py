"""
Lightweight Enhanced Summarizer - No Heavy ML Dependencies
Works on resource-constrained environments while providing advanced features
"""

import re
import json
from collections import Counter
from typing import Dict, List, Union
from app.utils.pdf_reader import extract_text_from_pdf
from app.utils.logger import logger

# Import only the existing working components
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.summarize import load_summarize_chain
from langchain.chains.llm import LLMChain
from langchain_groq import ChatGroq
from app.config import get_next_groq_api_key


class LightweightSummaryLevelManager:
    """Manages different summary levels with specific prompts"""
    
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


class LightweightExtractiveSummarizer:
    """Lightweight extractive summarization using basic text processing"""
    
    def __init__(self):
        self.stop_words = set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they',
            'them', 'their', 'there', 'where', 'when', 'who', 'what', 'which', 'why'
        ])
        
        self.legal_terms = {
            'court': 4, 'judge': 4, 'ruling': 5, 'decision': 5, 'verdict': 5,
            'plaintiff': 4, 'defendant': 4, 'evidence': 4, 'testimony': 3,
            'appeal': 4, 'statute': 4, 'law': 3, 'legal': 3, 'case': 3,
            'held': 5, 'ruled': 5, 'decided': 5, 'found': 4, 'concluded': 4,
            'jurisdiction': 3, 'precedent': 4, 'contract': 3, 'liability': 4,
            'damages': 4, 'injunction': 3, 'motion': 3, 'order': 3, 'judgment': 5
        }
        
    def extract_sentences(self, text: str, num_sentences: int = 5) -> List[str]:
        """Extract top sentences using frequency-based scoring"""
        sentences = self._split_sentences(text)
        
        if len(sentences) <= num_sentences:
            return sentences
            
        # Score sentences
        sentence_scores = []
        word_freq = self._get_word_frequencies(text)
        
        for sentence in sentences:
            score = self._score_sentence(sentence, word_freq)
            sentence_scores.append((sentence, score))
        
        # Sort by score and return top sentences
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)
        return [sentence for sentence, score in top_sentences[:num_sentences]]
    
    def extract_key_phrases(self, text: str, num_phrases: int = 10) -> List[str]:
        """Extract key phrases using frequency analysis"""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        words = [w for w in words if w not in self.stop_words and len(w) > 3]
        
        word_freq = Counter(words)
        
        # Boost legal terms
        for word, count in word_freq.items():
            if word in self.legal_terms:
                word_freq[word] = count + self.legal_terms[word]
        
        return [word for word, count in word_freq.most_common(num_phrases)]
    
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
            'extraction_method': 'frequency_legal_weighted'
        }
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        return sentences
    
    def _get_word_frequencies(self, text: str) -> Dict[str, int]:
        """Get word frequencies"""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        words = [w for w in words if w not in self.stop_words and len(w) > 3]
        return Counter(words)
    
    def _score_sentence(self, sentence: str, word_freq: Dict[str, int]) -> float:
        """Score a sentence based on word frequencies and legal terms"""
        words = sentence.lower().split()
        score = 0.0
        word_count = 0
        
        for word in words:
            if word not in self.stop_words and len(word) > 3:
                # Base frequency score
                score += word_freq.get(word, 0)
                # Bonus for legal terms
                if word in self.legal_terms:
                    score += self.legal_terms[word] * 2
                word_count += 1
        
        # Normalize by sentence length (prefer medium-length sentences)
        if word_count > 0:
            score = score / word_count
            # Penalty for very short or very long sentences
            if word_count < 5 or word_count > 50:
                score *= 0.7
                
        return score


class LightweightAdvancedSummarizer:
    """Main lightweight summarizer class"""
    
    def __init__(self):
        self.extractive_summarizer = LightweightExtractiveSummarizer()
        self.level_manager = LightweightSummaryLevelManager()
        
    def summarize_pdf(self, file_bytes: bytes, summary_type: str = 'detailed', 
                     method: str = 'abstractive') -> Dict:
        """
        Advanced PDF summarization with multiple levels and methods
        Uses lightweight processing for extractive, Groq API for abstractive
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
            logger.error(f"Error in lightweight PDF summarization: {e}")
            raise
    
    def _abstractive_summarize(self, text: str, level: str) -> Dict:
        """Generate abstractive summary using Groq API (existing working method)"""
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
                'model_used': 'groq-llama3-8b-8192',
                'api_based': True
            }
        }
    
    def _extractive_summarize(self, text: str, level: str) -> Dict:
        """Generate extractive summary using lightweight processing"""
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
                'sentences_analyzed': len(re.split(r'[.!?]+', text)),
                'local_processing': True
            }
        }
    
    def _hybrid_summarize(self, text: str, level: str) -> Dict:
        """Generate hybrid summary combining lightweight extractive with Groq abstractive"""
        # Get extractive summary first (lightweight)
        extractive_result = self._extractive_summarize(text, level)
        
        # Use top extractive sentences as context for abstractive summary
        key_context = " ".join(extractive_result['key_sentences'][:8])
        
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
                'abstractive_model': 'groq-llama3-8b-8192',
                'hybrid_approach': 'lightweight_extractive_guided_abstractive'
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
                    },
                    'processing_method': 'lightweight_local_and_cloud_hybrid'
                }
            }
            
        except Exception as e:
            logger.error(f"Error in lightweight summary comparison: {e}")
            raise


# Create global instance
lightweight_advanced_summarizer = LightweightAdvancedSummarizer()
