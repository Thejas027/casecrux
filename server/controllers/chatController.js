const axios = require("axios");
require("dotenv").config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Maintain chat history per session (in-memory for demo)
    if (!global.chatHistory) global.chatHistory = {};
    if (!global.chatHistory[sessionId]) global.chatHistory[sessionId] = [];
    global.chatHistory[sessionId].push({ role: "user", content: message });

    // Prepare messages for Groq API
    const groqMessages = global.chatHistory[sessionId].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Groq API
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192", // or 'llama3-8b-8192'
        messages: groqMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = groqResponse.data.choices[0].message.content;

    // Save assistant reply to history
    global.chatHistory[sessionId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (error) {
    console.error("Groq error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Chatbot failed to respond." });
  }
};
