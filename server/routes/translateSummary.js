const express = require("express");
const axios = require("axios");
const router = express.Router();

// Maximum length for translation chunks
const MAX_CHUNK_SIZE = 450; // Slightly less than 500 to be safe

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
    return [text];
  }
  
  const chunks = [];
  let currentChunk = '';
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    // If single paragraph exceeds limit, split by sentences
    if (paragraph.length > maxLength) {
      // Split by common sentence endings
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        // If adding this sentence would exceed max length, start a new chunk
        if (currentChunk.length + sentence.length > maxLength) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = '';
          }
          
          // If a single sentence is longer than maxLength, split by word boundary
          if (sentence.length > maxLength) {
            let remainingSentence = sentence;
            while (remainingSentence.length > 0) {
              let chunkEndIndex = maxLength;
              
              // Try to find a word boundary
              if (remainingSentence.length > maxLength) {
                const lastSpace = remainingSentence.substring(0, maxLength).lastIndexOf(' ');
                if (lastSpace > 0) {
                  chunkEndIndex = lastSpace;
                }
              }
              
              chunks.push(remainingSentence.substring(0, chunkEndIndex));
              remainingSentence = remainingSentence.substring(chunkEndIndex).trim();
            }
          } else {
            currentChunk = sentence;
          }
        } else {
          // Add the sentence to the current chunk
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else {
      // Check if adding this paragraph would exceed max length
      if (currentChunk.length + paragraph.length > maxLength) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Helper function to translate a single text chunk
async function translateChunk(text, targetLang, normalizedLang) {
  // Try multiple LibreTranslate instances in case one is down
  const libreTranlateInstances = [
    "https://translate.argosopentech.com",
    "https://translate.terraprint.co", 
    "https://libretranslate.de"
  ];
  
  // Try each instance until one works
  let lastError;
  
  // STEP 1: Try LibreTranslate instances first
  for (const baseUrl of libreTranlateInstances) {
    try {
      console.log(`Trying LibreTranslate instance: ${baseUrl}`);
      
      const response = await axios.post(`${baseUrl}/translate`, {
        q: text,
        source: "auto",  // Auto-detect source language
        target: normalizedLang,
        format: "text"
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Translation successful with ${baseUrl}`);
      
      // If we get here, translation worked
      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      } else {
        throw new Error("Invalid response format from LibreTranslate");
      }
    } catch (err) {
      // Save error and try next server
      lastError = err;
      console.log(`Translation failed with ${baseUrl}, error: ${err.message}`);
    }
  }
  
  // STEP 2: If all LibreTranslate instances fail, try MyMemory API as fallback
  console.log("All LibreTranslate servers failed for chunk, trying MyMemory API...");
  try {
    // Use original target language for MyMemory since it supports more languages
    const myMemoryUrl = `https://api.mymemory.translated.net/get`;
    const response = await axios.get(myMemoryUrl, {
      params: {
        q: text,
        langpair: `en|${targetLang}`,
        de: "your-email@example.com" // MyMemory requires an email
      },
      timeout: 30000
    });
    
    console.log("MyMemory response:", response.data);
    
    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    } else {
      throw new Error("Invalid response from MyMemory API");
    }
  } catch (err) {
    console.log("MyMemory API also failed for chunk:", err.message);
  }
  
  // If we reach here, all translation attempts for this chunk failed
  throw lastError || new Error("All translation services failed for this chunk");
}

router.post("/", async (req, res) => {
  console.log("Translation request received:", req.body);
  
  const { summary, targetLang } = req.body;
  if (!summary || !targetLang) {
    console.log("Missing required fields:", { summary: !!summary, targetLang: !!targetLang });
    return res.status(400).json({ 
      error: "Missing required fields", 
      details: "Both summary and targetLang are required" 
    });
  }
  
  console.log(`Starting translation to ${targetLang}, text length: ${summary.length}`);
  
  // Convert language code if needed for LibreTranslate
  const normalizedLang = LANGUAGE_MAPPING[targetLang] || targetLang;
  console.log(`Using normalized language: ${normalizedLang}`);
  
  try {
    // Split text into manageable chunks
    const chunks = splitTextIntoChunks(summary, MAX_CHUNK_SIZE);
    console.log(`Splitting text into ${chunks.length} chunks for translation`);
    
    // Translate each chunk
    const translatedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Translating chunk ${i+1}/${chunks.length} (${chunks[i].length} chars)`);
      const translatedChunk = await translateChunk(chunks[i], targetLang, normalizedLang);
      translatedChunks.push(translatedChunk);
      
      // Add a small delay between requests to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Combine the translated chunks
    const translatedText = translatedChunks.join(' ');
    console.log(`Translation completed. Original length: ${summary.length}, Translated length: ${translatedText.length}`);
    
    return res.json({ 
      translated: translatedText,
      originalLength: summary.length,
      translatedLength: translatedText.length,
      chunksProcessed: chunks.length
    });
  } catch (error) {
    console.error("Translation error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Translation failed", 
      details: error.response?.data?.error || error.message 
    });
  }
});

module.exports = router;
