import './chatBot.scss';
import { IoSendSharp } from "react-icons/io5";
import { useState } from 'react';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
     { sender: 'bot', text: 'Hello! How can I help you?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const botReply = { sender: 'bot', text: `You said: ${input}` };

    setMessages(prev => [...prev, userMessage, botReply]);
    setInput('');
  };

  return (
    <div className='chatbot'>
      <div className="displayChatsBox">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
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
