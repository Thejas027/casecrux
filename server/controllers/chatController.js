const openai = require("../utils/openaiClient");

const chatHistory = new Map();

async function handleChat(req, res) {
  const { sessionId, message, stream } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }


  const history = chatHistory.get(sessionId) || [];
  history.push({ role: "user", content: message });

  const cleanedHistory = history.map(m => ({
    role: m.role,
    content: m.content
  }));

  try {
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      console.log("Sending history:", cleanedHistory);
      const completion = await openai.chat.completions.create(
        {
          model: "gpt-4o",
          messages: [{ role: "system", content: "You are helpful." }, ...cleanedHistory],
          stream: true
        },
        { responseType: "stream" }
      );

      completion.data.on("data", chunk => {
        const payloads = chunk.toString().split("\n\n");
        for (const p of payloads) {
          if (p.includes("[DONE]")) {
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
          if (p.startsWith("data: ")) {
            const data = JSON.parse(p.replace("data: ", ""));
            const delta = data.choices[0].delta?.content;
            if (delta) res.write(`data: ${delta}\n\n`);
          }
        }
      });
      completion.data.on("end", () => res.end());
      completion.data.on("error", err => {
        console.error("Stream error:", err);
        res.end();
      });
    } else {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: "You are helpful." }, ...history]
      });

      const reply = resp.choices[0]?.message?.content || "";
      history.push({ role: "assistant", content: reply });
      chatHistory.set(sessionId, history);
      res.json({ reply });
    }
  } catch (err) {
  console.error("❌ OpenAI failed:", err.message);
  if (err.response) console.error("Status:", err.response.status, err.response.data);
  return res.status(500).json({ error: "OpenAI request failed" });
}
}

module.exports = { handleChat };
