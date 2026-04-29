import express from 'express';
import cors from 'cors';
import { authenticateZJU } from './authService.js';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// 简单的内存消息存储
const messages = [];

// Socket.io 逻辑
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 监听加入房间 (以买卖双方 ID 组合为房间名)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    // 发送历史消息
    const history = messages.filter(m => m.roomId === roomId);
    socket.emit('receive_history', history);
  });

  // 监听发送消息
  socket.on('send_message', (data) => {
    const messageData = {
      ...data,
      timestamp: new Date().toISOString()
    };
    messages.push(messageData);
    io.to(data.roomId).emit('receive_message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// 登录接口
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log(`[Auth] Attempting login for: ${username}`);
  
  const result = await authenticateZJU(username, password);
  
  if (result.success) {
    res.json({ success: true, user: { username } });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
});

server.listen(3001, () => {
  console.log('ZJU Auth & Chat Proxy Server running at http://localhost:3001');
});
