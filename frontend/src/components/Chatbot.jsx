import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, X, Send, Bot, User, Sparkles, Shield, Cloud, FileText, Zap } from 'lucide-react';
import './Chatbot.css';



const QUICK_REPLIES = [
  { icon: <Shield size={13} />, label: 'My Coverage', query: 'What does my current insurance policy cover?' },
  { icon: <FileText size={13} />, label: 'File Claim', query: 'How do I file an insurance claim?' },
  { icon: <Cloud size={13} />, label: 'Weather Risk', query: 'What is the current weather risk in my area?' },
  { icon: <Zap size={13} />, label: 'Auto Triggers', query: 'How do parametric auto-triggers work?' },
];

const SYSTEM_PROMPT = `You are GigCover AI Assistant, a helpful chatbot for GigCover — India's AI-powered parametric insurance platform for gig delivery workers.

Key facts about GigCover:
- Protects gig workers (Swiggy, Zomato, Dunzo, etc.) from income loss due to weather disruptions
- Uses parametric triggers: Rain >50mm, AQI >400, Temp >45°C automatically trigger claims
- Three plans: Essential Guard (basic), Smart Partner (recommended), Total Resilience (premium)
- Weekly pricing model with AI-driven dynamic pricing based on location and weather
- Claims are auto-approved and paid via UPI when triggers are detected
- Fraud detection system checks GPS location, weather data, duplicate claims
- NOT health or vehicle insurance — ONLY income loss protection

Guidelines:
- Be concise and helpful (2-4 sentences max)
- Use ₹ for currency
- If asked about health/vehicle insurance, clarify we only cover income loss
- Be friendly and use relevant emojis sparingly
- Answer in the same language the user asks in (Hindi, Tamil, Telugu, Bengali, Marathi, English)`;

export default function Chatbot() {
  const { currentUser, weatherData, currentLocation } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${currentUser?.firstName || 'there'}! 👋 I'm your GigCover AI assistant. I can help with:\n\n• Policy coverage details\n• Filing claims\n• Weather risk analysis\n• Plan recommendations\n\nHow can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const history = messages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'bot' : 'user',
        content: m.content
      }));

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: history
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.message || 'Sorry, I couldn\'t process that. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting to my service. Please try again later. 🔄',
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <button
        className={`chatbot-bubble ${isOpen ? 'bubble-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="GigCover AI Assistant"
      >
        <MessageCircle size={24} />
        <span className="bubble-pulse" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <h4>GigCover AI</h4>
                <span className="chatbot-status">
                  <Sparkles size={10} /> Powered by Gemini AI
                </span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className="msg-bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="msg-avatar"><Bot size={14} /></div>
                <div className="msg-bubble typing">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="quick-replies">
            {QUICK_REPLIES.map((qr, i) => (
              <button key={i} className="quick-reply-btn" onClick={() => sendMessage(qr.query)}>
                {qr.icon}
                {qr.label}
              </button>
            ))}
          </div>

          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your policy, claims, weather..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="btn-send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
