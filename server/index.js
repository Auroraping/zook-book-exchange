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

// AI 聊天接口 (模拟)
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  console.log(`[AI] Thinking about: ${message}`);

  // 模拟 AI 的延迟思考
  setTimeout(() => {
    let reply = "";
    if (message.includes("高数")) {
      reply = "高数是浙大理科的‘四大天王’之首。学长建议：一定要买带笔记的，尤其是那种大面积红笔纠错的，那都是学霸的血泪经验。";
    } else if (message.includes("计科") || message.includes("编程")) {
      reply = "计科的课教材只是参考，最重要的还是多刷 PAT。不过那本《数据结构》的学霸笔记确实很抢手，看到 20 元以下的可以直接秒杀。";
    } else if (message.includes("你好") || message.includes("在吗")) {
      reply = "你好呀！我是你的淘书助手‘桃酥’。你可以问我关于教材选择、课程难度或者是省钱攻略的问题哦！";
    } else {
      reply = "这个问题很有趣！根据目前的‘浙里淘书’大数据，这本书在紫金港校区的流通率很高，建议你找同校区的卖家，还能省个运费。";
    }
    res.json({ reply });
  }, 1000);
});

server.listen(3001, () => {
  console.log('ZJU Auth & Chat Proxy Server running at http://localhost:3001');
});
