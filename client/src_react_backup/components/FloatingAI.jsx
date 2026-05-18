import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import './FloatingAI.css';

const FloatingAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: '你好！我是桃酥，你的浙大淘书智库。有什么我可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: '抱歉，我的脑子好像断网了...请稍后再试。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`floating-ai-wrapper ${isOpen ? 'active' : ''}`}>
      {/* 悬浮球 */}
      <button className="ai-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <div className="trigger-inner"><Sparkles size={24} className="sparkle-icon" /><span>桃酥</span></div>}
      </button>

      {/* 对话窗口 */}
      <div className="ai-chat-window">
        <div className="ai-chat-header">
          <div className="header-main">
            <div className="ai-avatar">酥</div>
            <div>
              <h4>桃酥 AI 助手</h4>
              <p className="status">在线 · 浙大知识库已加载</p>
            </div>
          </div>
        </div>

        <div className="ai-message-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-message ${msg.role}`}>
              <div className="msg-content">{msg.content}</div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-message ai typing">
              <div className="dot-flashing"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="ai-input-form" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="问问桃酥：高数书怎么选？" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim() || isTyping}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FloatingAI;
