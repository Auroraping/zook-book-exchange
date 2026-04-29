import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

// 模拟联系人数据
const INITIAL_CHATS = [
  { id: 'room_chen', name: '书友小陈', avatar: '陈', lastMsg: '那本数学分析还在吗？' },
  { id: 'room_li', name: '李学姐', avatar: '李', lastMsg: '已经收到书了，谢谢！' },
  { id: 'room_test', name: '测试用户 (Test)', avatar: 'T', lastMsg: '你好，来测试一下吧' }
];

// 将 socket 移入组件或确保其单例连接
const socket = io('http://localhost:3001', {
  reconnection: true
});

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChat, setActiveChat] = useState(INITIAL_CHATS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Guest' };
    setCurrentUser(user);

    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      socket.emit('join_room', activeChat.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 监听历史记录
    socket.on('receive_history', (history) => {
      console.log('Received history:', history);
      setMessages(history);
    });

    // 监听单条新消息
    socket.on('receive_message', (data) => {
      console.log('Received message:', data);
      if (data.roomId === activeChat.id) {
        setMessages((prev) => {
          // 检查是否已经存在（防止自己发的消息重复显示）
          const exists = prev.some(m => m.id === data.id || (m.text === data.text && m.sender === data.sender && Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 1000));
          if (exists) return prev;
          return [...prev, data];
        });
      }
    });

    // 切换房间时重新加入
    socket.emit('join_room', activeChat.id);

    return () => {
      socket.off('receive_history');
      socket.off('receive_message');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [activeChat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const messageData = {
      id: Date.now().toString(), // 添加唯一 ID
      roomId: activeChat.id,
      sender: currentUser.username,
      text: inputText,
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', messageData);
    
    // 1. 立即在前端显示（解决消失问题）
    setMessages((prev) => [...prev, messageData]);
    
    // 2. 发送给后端
    socket.emit('send_message', messageData);
    
    setInputText('');
  };

  const switchChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
    socket.emit('join_room', chat.id);
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="title-row">
            <h2>消息中心</h2>
            <span className={`conn-status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '已连接' : '连接中...'}
            </span>
          </div>
          <div className="current-user-tag">身份: {currentUser?.username}</div>
        </div>
        <div className="chat-list">
          {INITIAL_CHATS.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChat.id === chat.id ? 'active' : ''}`}
              onClick={() => switchChat(chat)}
            >
              <div className="avatar">{chat.avatar}</div>
              <div className="chat-info">
                <span className="name">{chat.name}</span>
                <span className="last-msg">{chat.lastMsg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="header-info">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            <h3>{activeChat.name}</h3>
          </div>
        </div>

        <div className="message-area">
          {messages.length === 0 && (
            <div className="empty-chat">暂无消息，打个招呼吧 👋</div>
          )}
          {messages.map((msg, index) => (
            <div 
              key={msg.id || index} 
              className={`message-bubble ${msg.sender === currentUser?.username ? 'sent' : 'received'}`}
            >
              <div className="bubble-sender">{msg.sender}</div>
              <div className="bubble-content">
                {msg.text}
              </div>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder={isConnected ? `发消息给 ${activeChat.name}...` : '正在连接服务器...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isConnected}
          />
          <button type="submit" className="send-btn" disabled={!isConnected}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
