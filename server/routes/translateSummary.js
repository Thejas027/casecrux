const express = require("express");
const axios = require("axios");
const router = express.Router();

// Maximum length for translation chunks
const MAX_CHUNK_SIZE = 400;

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
  if (text.length <= maxLength) {
    return [text.trim()];
  }

  const chunks = [];
  let currentChunk = '';
  
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  const paragraphs = cleanText.split(/\n\s*\n|(?=#{1,6}\s)/);
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    if (trimmedParagraph.length > maxLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const sentences = trimmedParagraph.split(/(?<=[.!?])\s+(?=[A-Z])/);
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        if (currentChunk.length + trimmedSentence.length + 1 > maxLength) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          if (trimmedSentence.length > maxLength) {
            const words = trimmedSentence.split(/\s+/);
            for (const word of words) {
              if (currentChunk.length + word.length + 1 > maxLength) {
                if (currentChunk.length > 0) {
                  chunks.push(currentChunk.trim());
                  currentChunk = word;
                } else {
                  chunks.push(word);
                }
              } else {
                currentChunk += (currentChunk ? ' ' : '') + word;
              }
            }
          } else {
            currentChunk = trimmedSentence;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        }
      }
    } else {
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
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

// Helper function to translate a single text chunk
async function translateChunk(text, targetLang, normalizedLang, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  const libreTranlateInstances = [
    "https://translate.argosopentech.com",
    "https://libretranslate.com", 
    "https://translate.terraprint.co",
    "https://libretranslate.de"
  ];
  
  let lastError;
  
  // Try LibreTranslate instances first
  for (const baseUrl of libreTranlateInstances) {
    try {
      const response = await axios.post(`${baseUrl}/translate`, {
        q: text.trim(),
        source: "auto",
        target: normalizedLang,
        format: "text"
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CaseCrux-Legal-Assistant/1.0'
        }
      });

      if (response.data && response.data.translatedText) {
        return response.data.translatedText.trim();
      } else {
        throw new Error("Invalid response format from LibreTranslate");
      }
    } catch (err) {
      lastError = err;
      if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        continue;
      }
    }
  }
  
  // Try MyMemory API as fallback
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get`;
    const response = await axios.get(myMemoryUrl, {
      params: {
        q: text.trim(),
        langpair: `en|${targetLang}`,
        de: "casecrux@legal.app"
      },
      timeout: 10000
    });

    if (response.data && 
        response.data.responseData && 
        response.data.responseData.translatedText &&
        response.data.responseData.translatedText !== text) {
      return response.data.responseData.translatedText.trim();
    } else {
      throw new Error("Invalid or unchanged response from MyMemory API");
    }
  } catch (err) {
    lastError = err;
  }
  
  // Retry logic with exponential backoff
  if (retryCount < MAX_RETRIES) {
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    return translateChunk(text, targetLang, normalizedLang, retryCount + 1);
  }
  
  throw lastError || new Error("All translation services failed for this chunk");
}

// Main translation route
router.post("/", async (req, res) => {
  const { summary, targetLang } = req.body;
  
  if (!summary || !targetLang) {
    return res.status(400).json({ 
      error: "Missing required fields", 
      details: "Both summary and targetLang are required" 
    });
  }
  
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

  const normalizedLang = LANGUAGE_MAPPING[targetLang] || targetLang;

  try {
    const chunks = splitTextIntoChunks(summary, MAX_CHUNK_SIZE);
    const translatedChunks = [];
    const errors = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const translatedChunk = await translateChunk(chunks[i], targetLang, normalizedLang);
        translatedChunks.push(translatedChunk);
      } catch (err) {
        console.error(`Translation failed for chunk ${i + 1}:`, err.message);
        errors.push({
          chunkIndex: i,
          originalText: chunks[i].substring(0, 100) + "...",
          error: err.message
        });
        
        // Use original text if translation fails for a chunk
        translatedChunks.push(`[Translation failed: ${chunks[i]}]`);
      }
    }
    
    const translatedText = translatedChunks.join(' ').trim();
    const successfulChunks = chunks.length - errors.length;

    const response = { 
      translated: translatedText,
      originalLength: summary.length,
      translatedLength: translatedText.length,
      chunksProcessed: chunks.length,
      successfulChunks: successfulChunks,
      targetLanguage: targetLang,
      normalizedLanguage: normalizedLang
    };
    
    if (errors.length > 0) {
      response.warnings = {
        message: `${errors.length} chunks failed to translate completely`,
        failedChunks: errors.length,
        details: errors
      };
    }
    
    return res.json(response);
    
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ 
      error: "Translation failed", 
      details: error.message || "Unknown error occurred during translation",
      targetLanguage: targetLang,
      textLength: summary.length
    });
  }
});

module.exports = router;
