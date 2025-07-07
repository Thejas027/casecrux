const express = require("express");
const axios = require("axios");
const router = express.Router();

// Maximum length for translation chunks
const MAX_CHUNK_SIZE = 400; // Reduced for better reliability

// Language code mapping for common Indian languages not directly supported by LibreTranslate
const LANGUAGE_MAPPING = {
  'kn': 'hi', // Kannada -> Hindi as fallback
  'ta': 'hi', // Tamil -> Hindi as fallback
  'te': 'hi', // Telugu -> Hindi as fallback
  'ml': 'hi', // Malayalam -> Hindi as fallback
  'gu': 'hi', // Gujarati -> Hindi as fallback
  'mr': 'hi', // Marathi -> Hindi as fallback
  'pa': 'hi', // Punjabi -> Hindi as fallback
  'bn': 'hi'  // Bengali -> Hindi as fallback
};

// Helper function to split text into chunks that respect sentence boundaries
function splitTextIntoChunks(text, maxLength) {
  // If text is short enough, return it as a single chunk
  if (text.length <= maxLength) {
    return [text.trim()];
  }

  const chunks = [];
  let currentChunk = '';
  
  // Clean up the text first - remove extra whitespace and normalize line breaks
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  
  // Split by paragraphs first (double line breaks or markdown headers)
  const paragraphs = cleanText.split(/\n\s*\n|(?=#{1,6}\s)/);
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    // If single paragraph exceeds limit, split by sentences
    if (trimmedParagraph.length > maxLength) {
      // First, add any existing chunk
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split by sentences - improved sentence detection
      const sentences = trimmedParagraph.split(/(?<=[.!?])\s+(?=[A-Z])/);
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        // If adding this sentence would exceed max length, start a new chunk
        if (currentChunk.length + trimmedSentence.length + 1 > maxLength) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          // If a single sentence is still longer than maxLength, split by phrases
          if (trimmedSentence.length > maxLength) {
            const phrases = trimmedSentence.split(/[,;:()]/);
            for (const phrase of phrases) {
              const trimmedPhrase = phrase.trim();
              if (!trimmedPhrase) continue;
              
              if (currentChunk.length + trimmedPhrase.length + 1 > maxLength) {
                if (currentChunk.length > 0) {
                  chunks.push(currentChunk.trim());
                  currentChunk = '';
                }
                
                // If even a phrase is too long, split by words
                if (trimmedPhrase.length > maxLength) {
                  const words = trimmedPhrase.split(/\s+/);
                  for (const word of words) {
                    if (currentChunk.length + word.length + 1 > maxLength) {
                      if (currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = word;
                      } else {
                        // Single word longer than max length - force include it
                        chunks.push(word);
                      }
                    } else {
                      currentChunk += (currentChunk ? ' ' : '') + word;
                    }
                  }
                } else {
                  currentChunk = trimmedPhrase;
                }
              } else {
                currentChunk += (currentChunk ? ' ' : '') + trimmedPhrase;
              }
            }
          } else {
            currentChunk = trimmedSentence;
          }
        } else {
          // Add the sentence to the current chunk
          currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        }
      }
    } else {
      // Check if adding this paragraph would exceed max length
      if (currentChunk.length + trimmedParagraph.length + 2 > maxLength) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // Filter out empty chunks
  const filteredChunks = chunks.filter(chunk => chunk.trim().length > 0);
  
   => `${i+1}: ${chunk.length} chars`));
  
  return filteredChunks;
}

// Helper function to translate a single text chunk with improved error handling
async function translateChunk(text, targetLang, normalizedLang, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  // Improved LibreTranslate instances - more reliable servers
  const libreTranlateInstances = [
    "https://translate.argosopentech.com",
    "https://libretranslate.com", 
    "https://translate.terraprint.co",
    "https://libretranslate.de"
  ];
  
  // Try each instance until one works
  let lastError;
  
  // STEP 1: Try LibreTranslate instances first
  for (const baseUrl of libreTranlateInstances) {
    try {
      `);
      
      const response = await axios.post(`${baseUrl}/translate`, {
        q: text.trim(),
        source: "auto",  // Auto-detect source language
        target: normalizedLang,
        format: "text"
      }, {
        timeout: 15000, // Reduced timeout for faster failover
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CaseCrux-Legal-Assistant/1.0'
        }
      });

      // If we get here, translation worked
      if (response.data && response.data.translatedText) {
        return response.data.translatedText.trim();
      } else {
        throw new Error("Invalid response format from LibreTranslate");
      }
    } catch (err) {
      // Save error and try next server
      lastError = err;

      // If it's a timeout or network error, try the next server immediately
      if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        continue;
      }
    }
  }
  
  // STEP 2: If all LibreTranslate instances fail, try MyMemory API as fallback
  
  try {
    // Use original target language for MyMemory since it supports more languages
    const myMemoryUrl = `https://api.mymemory.translated.net/get`;
    const response = await axios.get(myMemoryUrl, {
      params: {
        q: text.trim(),
        langpair: `en|${targetLang}`,
        de: "casecrux@legal.app" // MyMemory requires an email
      },
      timeout: 10000
    });

    if (response.data && 
        response.data.responseData && 
        response.data.responseData.translatedText &&
        response.data.responseData.translatedText !== text) { // Ensure it was actually translated
      
      return response.data.responseData.translatedText.trim();
    } else {
      throw new Error("Invalid or unchanged response from MyMemory API");
    }
  } catch (err) {
    
    lastError = err;
  }
  
  // STEP 3: Retry logic with exponential backoff
  if (retryCount < MAX_RETRIES) {
     after delay...`);
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000)); // 1s, 2s, 4s delays
    return translateChunk(text, targetLang, normalizedLang, retryCount + 1);
  }
  
  // If we reach here, all translation attempts for this chunk failed
  }..."`);
  throw lastError || new Error("All translation services failed for this chunk");
}

router.post("/", async (req, res) => {

  const { summary, targetLang } = req.body;
  if (!summary || !targetLang) {
    
    return res.status(400).json({ 
      error: "Missing required fields", 
      details: "Both summary and targetLang are required" 
    });
  }
  
  // Validate summary length
  if (summary.length === 0) {
    return res.status(400).json({ 
      error: "Empty text", 
      details: "Summary text cannot be empty" 
    });
  }
  
  if (summary.length > 10000) {
    return res.status(400).json({ 
      error: "Text too long", 
      details: "Summary text cannot exceed 10,000 characters" 
    });
  }

  // Convert language code if needed for LibreTranslate
  const normalizedLang = LANGUAGE_MAPPING[targetLang] || targetLang;
  `);
  
  try {
    // Split text into manageable chunks
    const chunks = splitTextIntoChunks(summary, MAX_CHUNK_SIZE);

    if (chunks.length === 0) {
      throw new Error("Failed to split text into chunks");
    }
    
    // Translate each chunk with progress tracking
    const translatedChunks = [];
    const errors = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkProgress = `${i + 1}/${chunks.length}`;
      `);
      
      try {
        const translatedChunk = await translateChunk(chunks[i], targetLang, normalizedLang);
        translatedChunks.push(translatedChunk);

        // Add a small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
        }
      } catch (chunkError) {
        
        errors.push({
          chunkIndex: i,
          chunkText: chunks[i].substring(0, 100) + "...",
          error: chunkError.message
        });
        
        // For now, use original text if translation fails for a chunk
        // This ensures partial translation rather than complete failure
        translatedChunks.push(`[Translation failed: ${chunks[i]}]`);
      }
    }
    
    // Combine the translated chunks
    const translatedText = translatedChunks.join(' ').trim();
    
    // Log results
    const successfulChunks = chunks.length - errors.length;

    // Prepare response
    const response = { 
      translated: translatedText,
      originalLength: summary.length,
      translatedLength: translatedText.length,
      chunksProcessed: chunks.length,
      successfulChunks: successfulChunks,
      targetLanguage: targetLang,
      normalizedLanguage: normalizedLang
    };
    
    // Include errors if any occurred, but still return the partial translation
    if (errors.length > 0) {
      response.warnings = {
        message: `${errors.length} chunks failed to translate completely`,
        failedChunks: errors.length,
        details: errors
      };
      
    }
    
    return res.json(response);
    
  } catch (error) {

    res.status(500).json({ 
      error: "Translation failed", 
      details: error.message || "Unknown error occurred during translation",
      targetLanguage: targetLang,
      textLength: summary.length
    });
  }
});

module.exports = router;
