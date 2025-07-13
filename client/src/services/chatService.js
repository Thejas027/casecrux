export async function sendMessageToBot(sessionId, message) {
  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message })
    });

    const data = await res.json();  // read once

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data.reply;

  } catch (err) {
    console.error("❌ sendMessageToBot failed:", err);
    throw err;
  }
}
