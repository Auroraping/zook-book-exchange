import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

// 模拟联系人数据
const INITIAL_CHATS = [
  { id: 'room_chen', name: '书友小陈', avatar: '陈', lastMsg: '那本数学分析还在吗？' },
  { id: 'room_li', name: '李学姐', avatar: '李', lastMsg: '已经收到书了，谢谢！' },
];

// 将 socket 移入组件或确保其单例连接
const socket = io('http://localhost:3001', {
  reconnection: true
});

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(INITIAL_CHATS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      user = { username: 'Guest_' + Math.floor(Math.random() * 1000), id: 'U' + Math.floor(Math.random() * 1000000) };
    } else if (!user.id) {
      // 为旧用户补全 ID
      user.id = 'U' + Math.floor(Math.random() * 1000000);
      localStorage.setItem('user', JSON.stringify(user));
    }
    setCurrentUser(user);

    // 如果已经连接，立即更新状态
    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join_room', activeChat.id);
    }

    const onConnect = () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      socket.emit('join_room', activeChat.id);
    };

    const onDisconnect = () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    };

    const onHistory = (history) => {
      console.log('Received history:', history);
      setIsConnected(true); // 收到历史记录也说明连接是通的
      setMessages(history);
    };

    const onMessage = (data) => {
      console.log('Received message:', data);
      if (data.roomId === activeChat.id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === data.id || (m.text === data.text && m.sender === data.sender && Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 1000));
          if (exists) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_history', onHistory);
    socket.on('receive_message', onMessage);

    // 切换房间时重新加入
    socket.emit('join_room', activeChat.id);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_history', onHistory);
      socket.off('receive_message', onMessage);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // 模拟搜索逻辑：如果是新 ID，则创建一个新聊天会话
    // 在真实应用中，这里应该请求后端查询用户是否存在
    const newChatId = searchQuery.startsWith('room_') ? searchQuery : `room_${searchQuery}`;
    const existingChat = chats.find(c => c.id === newChatId || c.name === searchQuery);

    if (existingChat) {
      switchChat(existingChat);
    } else {
      const newChat = {
        id: newChatId,
        name: searchQuery,
        avatar: searchQuery.charAt(0).toUpperCase(),
        lastMsg: '新发起的聊天'
      };
      setChats(prev => [newChat, ...prev]);
      switchChat(newChat);
    }
    setSearchQuery('');
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
          <div className="current-user-tag">
            <span>{currentUser?.username}</span>
            <span className="user-id">ID: {currentUser?.id}</span>
          </div>
          <form className="search-bar" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="搜索用户名字或 ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        <div className="chat-list">
          {chats.map(chat => (
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
