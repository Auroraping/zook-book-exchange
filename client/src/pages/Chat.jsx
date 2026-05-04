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

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 生成唯一的房间 ID (确保 A->B 和 B->A 进入同一个房间)
  const getRoomId = (id1, id2) => {
    const sortedIds = [id1, id2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  };

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      user = { username: 'Guest_' + Math.floor(Math.random() * 1000), id: 'U' + Math.floor(Math.random() * 1000000) };
    } else if (!user.id || user.id === 'me') {
      user.id = 'U' + Math.floor(Math.random() * 1000000);
      localStorage.setItem('user', JSON.stringify(user));
    }
    setCurrentUser(user);

    // 始终加入自己的通知房间 (用于接收“新聊天”提醒)
    if (user && user.id) {
      socket.emit('join_room', `notify_${user.id}`);
    }

    const onConnect = () => {
      console.log('[Chat] Socket connected');
      setIsConnected(true);
      if (activeChat) socket.emit('join_room', activeChat.id);
      if (user?.id) socket.emit('join_room', `notify_${user.id}`);
    };

    const onDisconnect = () => {
      console.log('[Chat] Socket disconnected');
      setIsConnected(false);
    };

    const onHistory = (history) => {
      console.log('[Chat] Received history:', history);
      setMessages(history);
    };

    const onMessage = (data) => {
      console.log('[Chat] Received message:', data);
      
      // 如果收到的是当前聊天的消息
      if (data.roomId === activeChat.id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      } else {
        // 如果收到的是发给我的消息，但不在当前聊天窗口
        // 这里可以通过通知系统处理，或者直接在侧边栏提示
        setChats(prev => {
          const exists = prev.find(c => c.id === data.roomId);
          if (exists) return prev;
          return [{
            id: data.roomId,
            name: data.sender,
            avatar: data.sender.charAt(0).toUpperCase(),
            lastMsg: data.text
          }, ...prev];
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_history', onHistory);
    socket.on('receive_message', onMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_history', onHistory);
      socket.off('receive_message', onMessage);
    };
  }, [activeChat.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const messageData = {
      id: `${currentUser.id}_${Date.now()}`,
      roomId: activeChat.id,
      sender: currentUser.username,
      senderId: currentUser.id,
      text: inputText,
      timestamp: new Date().toISOString()
    };

    console.log('[Chat] Emitting send_message:', messageData);
    socket.emit('send_message', messageData);
    setInputText('');
  };

  const switchChat = (chat) => {
    setActiveChat(chat);
    setMessages([]); // 切换时先清空，等待 receive_history
    socket.emit('join_room', chat.id);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !currentUser) return;

    const targetId = searchQuery.startsWith('U') ? searchQuery : null;
    const targetName = searchQuery;

    // 生成唯一的 1对1 房间 ID
    let roomId;
    if (targetId) {
      if (targetId === currentUser.id) {
        alert("不能和自己聊天哦");
        return;
      }
      roomId = getRoomId(currentUser.id, targetId);
    } else {
      // 如果搜的是名字，暂时回退到旧逻辑或提示
      roomId = `room_${targetName}`;
    }

    const existingChat = chats.find(c => c.id === roomId);
    if (existingChat) {
      switchChat(existingChat);
    } else {
      const newChat = {
        id: roomId,
        name: targetId ? `书友 (${targetId})` : targetName,
        avatar: targetName.charAt(0).toUpperCase(),
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
