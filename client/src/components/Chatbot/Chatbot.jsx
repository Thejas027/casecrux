import './chatBot.scss';
import { IoSendSharp } from "react-icons/io5";
import { useState, useRef } from 'react';
import { sendMessageToBot } from "../../services/chatService";

const Chatbot = () => {
  const sessionId = useRef("user-" + Date.now()).current;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I help you?" }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const reply = await sendMessageToBot(sessionId, input);
      setMessages(prev => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." }
      ]);
    }
  };

  return (
    <div className='chatbot'>
      <div className="displayChatsBox">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="sendMessageBox">
        <div className="input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
        </div>
        <div className="sendIcon" onClick={handleSend}>
          <IoSendSharp />
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
