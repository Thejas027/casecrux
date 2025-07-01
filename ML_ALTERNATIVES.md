# Machine Learning Alternatives for Resource-Constrained Environments

## 🚨 Problem: Local ML Processing Limitations

Your laptop may not have sufficient resources for:
- Heavy NLP libraries (transformers, torch, tensorflow)
- Large language models
- Complex ML computations
- Memory-intensive operations

## 🎯 Solution Options

### Option 1: Cloud-Based ML Services (Recommended)

#### A. Use External APIs
```python
# Instead of local ML processing, use cloud APIs
import requests

class CloudSummarizer:
    def __init__(self):
        self.apis = {
            'groq': 'https://api.groq.com/openai/v1/chat/completions',
            'openai': 'https://api.openai.com/v1/chat/completions',
            'anthropic': 'https://api.anthropic.com/v1/messages',
            'huggingface': 'https://api-inference.huggingface.co/models/'
        }
    
    def abstractive_summarize(self, text, level='detailed'):
        # Use Groq API (already in your system)
        return self.groq_summarize(text, level)
    
    def extractive_summarize(self, text, level='detailed'):
        # Use lightweight text processing
        return self.lightweight_extractive(text, level)
```

#### B. Hybrid Approach (Light Local + Cloud)
```python
class HybridSummarizer:
    def __init__(self):
        self.local_processor = LightweightProcessor()  # Basic text processing
        self.cloud_ai = CloudAIProcessor()            # Heavy AI work
    
    def summarize(self, text, method='abstractive'):
        if method == 'extractive':
            return self.local_processor.extract_key_sentences(text)
        else:
            return self.cloud_ai.generate_summary(text)
```

### Option 2: Lightweight Local Processing

#### A. Simple Extractive Summarization (No ML)
```python
import re
from collections import Counter
from typing import List, Dict

class LightweightExtractor:
    def __init__(self):
        self.stop_words = set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
        ])
    
    def extract_key_sentences(self, text: str, num_sentences: int = 5) -> List[str]:
        """Extract key sentences using simple frequency analysis"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        # Score sentences based on word frequency
        word_freq = self.get_word_frequencies(text)
        sentence_scores = []
        
        for sentence in sentences:
            score = sum(word_freq.get(word.lower(), 0) 
                       for word in sentence.split() 
                       if word.lower() not in self.stop_words)
            sentence_scores.append((sentence, score))
        
        # Return top sentences
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)
        return [sentence for sentence, score in top_sentences[:num_sentences]]
    
    def get_word_frequencies(self, text: str) -> Dict[str, int]:
        """Get word frequency without heavy NLP libraries"""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        words = [w for w in words if w not in self.stop_words and len(w) > 3]
        return Counter(words)
```

#### B. Rule-Based Legal Text Processing
```python
class LegalTextProcessor:
    def __init__(self):
        self.legal_keywords = [
            'court', 'judge', 'plaintiff', 'defendant', 'ruling', 'decision',
            'evidence', 'testimony', 'verdict', 'appeal', 'statute', 'law'
        ]
        self.section_headers = [
            'background', 'facts', 'analysis', 'conclusion', 'holding'
        ]
    
    def extract_legal_structure(self, text: str) -> Dict[str, str]:
        """Extract legal document structure using patterns"""
        sections = {}
        
        # Find section headers
        for header in self.section_headers:
            pattern = rf'(?i){header}[:\s]*(.*?)(?={"|".join(self.section_headers)}|$)'
            match = re.search(pattern, text, re.DOTALL)
            if match:
                sections[header] = match.group(1).strip()[:500]  # Limit length
        
        return sections
    
    def extract_key_legal_points(self, text: str) -> List[str]:
        """Extract sentences containing legal keywords"""
        sentences = re.split(r'[.!?]+', text)
        legal_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in self.legal_keywords):
                legal_sentences.append(sentence.strip())
        
        return legal_sentences[:10]  # Top 10 legal sentences
```

### Option 3: Simplified Implementation

Let me create a lightweight version that works without heavy ML dependencies:

```python
# lightweight_summarizer.py
import re
import json
from collections import Counter
from typing import Dict, List, Union

class SimplifiedSummarizer:
    """Lightweight summarizer that doesn't require heavy ML libraries"""
    
    def __init__(self):
        self.stop_words = self.load_stop_words()
        self.legal_terms = self.load_legal_terms()
    
    def load_stop_words(self) -> set:
        """Load common stop words"""
        return set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
        ])
    
    def load_legal_terms(self) -> dict:
        """Load legal terms with weights"""
        return {
            'court': 3, 'judge': 3, 'ruling': 4, 'decision': 4, 'verdict': 4,
            'plaintiff': 3, 'defendant': 3, 'evidence': 3, 'testimony': 2,
            'appeal': 3, 'statute': 3, 'law': 2, 'legal': 2, 'case': 2,
            'held': 4, 'ruled': 4, 'decided': 4, 'found': 3, 'concluded': 3
        }
    
    def summarize_pdf(self, file_bytes: bytes, summary_type: str = 'detailed', 
                     method: str = 'extractive') -> Dict:
        """Main summarization function"""
        try:
            # Extract text (you already have this function)
            from app.utils.pdf_reader import extract_text_from_pdf
            text = extract_text_from_pdf(file_bytes)
            
            if method == 'extractive':
                return self.extractive_summarize(text, summary_type)
            else:  # abstractive - use existing Groq API
                return self.abstractive_summarize(text, summary_type)
                
        except Exception as e:
            raise Exception(f"Summarization failed: {str(e)}")
    
    def extractive_summarize(self, text: str, level: str) -> Dict:
        """Lightweight extractive summarization"""
        # Configure based on level
        configs = {
            'detailed': {'sentences': 15, 'phrases': 20},
            'concise': {'sentences': 8, 'phrases': 10},
            'executive': {'sentences': 6, 'phrases': 8},
            'technical': {'sentences': 12, 'phrases': 15},
            'bullets': {'sentences': 10, 'phrases': 12}
        }
        
        config = configs.get(level, configs['detailed'])
        
        # Extract key sentences
        key_sentences = self.extract_key_sentences(text, config['sentences'])
        key_phrases = self.extract_key_phrases(text, config['phrases'])
        
        # Format summary
        if level == 'bullets':
            summary = "• " + "\n• ".join(key_sentences[:8])
        else:
            summary = " ".join(key_sentences)
        
        return {
            'summary': summary,
            'method': 'extractive',
            'level': level,
            'word_count': len(summary.split()),
            'key_sentences': key_sentences,
            'key_phrases': key_phrases,
            'processing_info': {
                'extraction_method': 'frequency_based',
                'sentences_analyzed': len(re.split(r'[.!?]+', text))
            }
        }
    
    def abstractive_summarize(self, text: str, level: str) -> Dict:
        """Use existing Groq API for abstractive summarization"""
        # Use your existing Groq-based summarizer
        from app.services.summarizer import summarize_pdf
        
        # Create a temporary file-like object
        import io
        text_bytes = text.encode('utf-8')
        
        # Call existing summarizer
        result = summarize_pdf(text_bytes)
        
        return {
            'summary': result['output_text'] if isinstance(result, dict) else str(result),
            'method': 'abstractive',
            'level': level,
            'word_count': len(str(result).split()),
            'processing_info': {
                'model_used': 'groq-llama3',
                'api_based': True
            }
        }
    
    def extract_key_sentences(self, text: str, num_sentences: int) -> List[str]:
        """Extract key sentences using frequency analysis"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        if len(sentences) <= num_sentences:
            return sentences
        
        # Score sentences
        sentence_scores = []
        word_freq = self.get_word_frequencies(text)
        
        for sentence in sentences:
            score = 0
            words = sentence.lower().split()
            
            for word in words:
                if word not in self.stop_words:
                    # Base frequency score
                    score += word_freq.get(word, 0)
                    # Bonus for legal terms
                    score += self.legal_terms.get(word, 0) * 2
            
            sentence_scores.append((sentence, score))
        
        # Sort by score and return top sentences
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)
        return [sentence for sentence, score in top_sentences[:num_sentences]]
    
    def extract_key_phrases(self, text: str, num_phrases: int) -> List[str]:
        """Extract key phrases using frequency analysis"""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        words = [w for w in words if w not in self.stop_words and len(w) > 3]
        
        word_freq = Counter(words)
        
        # Boost legal terms
        for word, count in word_freq.items():
            if word in self.legal_terms:
                word_freq[word] = count + self.legal_terms[word]
        
        return [word for word, count in word_freq.most_common(num_phrases)]
    
    def get_word_frequencies(self, text: str) -> Dict[str, int]:
        """Get word frequencies"""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        words = [w for w in words if w not in self.stop_words and len(w) > 3]
        return Counter(words)
```

## 🚀 Recommended Implementation Strategy

### 1. Remove Heavy Dependencies
```bash
# Remove these from requirements.txt:
# transformers
# torch
# tensorflow
# nltk
# scikit-learn

# Keep only lightweight ones:
# pypdf
# langchain
# groq
# requests
```

### 2. Use Cloud APIs for AI Tasks
```python
# Use Groq API (already configured) for abstractive
# Use simple algorithms for extractive
# Combine both for hybrid
```

### 3. Gradual Enhancement
1. Start with basic extractive (no ML)
2. Add Groq-based abstractive (already working)
3. Enhance with more cloud services if needed

### 4. Benefits of This Approach
- ✅ Works on any laptop
- ✅ Fast processing
- ✅ Low memory usage
- ✅ Still provides advanced features
- ✅ Scalable to cloud when needed

Would you like me to implement this lightweight version that will work perfectly on your laptop?
