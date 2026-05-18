import express from 'express';
import cors from 'cors';
import { authenticateZJU } from './authService.js';
import { fetchSchedule, fetchTextbooks } from './scheduleService.js';
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

// 简单的内存存储
const messages = [];
const users = new Map([
  ['U_MOCK_001', '书友小陈'],
  ['U_MOCK_002', '李学姐'],
  ['U_MOCK_003', '计科王同学'],
  ['U_MOCK_004', '高数笔记小助手']
]);

// Socket.io 逻辑
io.on('connection', (socket) => {
  console.log('[Socket] User connected:', socket.id);

  // 注册用户
  socket.on('register_user', (user) => {
    if (user && user.id) {
      const displayName = user.name || user.username || '匿名用户';
      users.set(user.id, displayName);
      console.log(`[Socket] User registered: ${displayName} (${user.id})`);
      console.log(`[Socket] Current registry:`, Array.from(users.values()));
    }
  });

  // 诊断测试
  socket.on('ping_test', () => {
    console.log(`[Socket] Received ping from ${socket.id}`);
    socket.emit('pong_test');
  });

  // 搜索用户
  socket.on('search_user', (query) => {
    if (!query) return socket.emit('search_results', []);
    
    console.log(`[Socket] Search request from ${socket.id} for: "${query}"`);
    const results = [];
    const lowerQuery = query.toLowerCase();

    // 健壮性匹配
    users.forEach((name, id) => {
      const safeName = name ? String(name).toLowerCase() : '';
      const safeId = id ? String(id).toLowerCase() : '';
      
      if (safeId.includes(lowerQuery) || safeName.includes(lowerQuery)) {
        results.push({ id, name: name || '未知用户' });
      }
    });
    
    console.log(`[Socket] Returning ${results.length} results to ${socket.id}`);
    socket.emit('search_results', results.slice(0, 10));
  });

  // 监听加入房间
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] ${socket.id} joined room: ${roomId}`);
    
    // 发送该房间的历史消息
    const history = messages.filter(m => m.roomId === roomId);
    console.log(`[Socket] Sending ${history.length} history messages for room: ${roomId}`);
    socket.emit('receive_history', history);
  });

  // 监听发送消息
  socket.on('send_message', (data) => {
    console.log(`[Socket] Message from ${data.sender} in room ${data.roomId}: ${data.text}`);
    const messageData = {
      ...data,
      timestamp: new Date().toISOString()
    };
    messages.push(messageData);
    // 广播给房间内的所有人（包括发送者自己，以确认发送成功）
    io.to(data.roomId).emit('receive_message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] User disconnected');
  });
});

// 登录接口
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  console.log(`[Auth] Attempting login for: ${username}`);

  const result = await authenticateZJU(username, password);

  if (result.success) {
    // 登录成功后缓存凭据用于后续课表拉取
    userCredentials.set(username, password);
    
    // 一键极速同步：登录成功瞬间在后台拉取一次课表，以提取并同步真实的个人信息
    let realInfo = {};
    try {
      const scheduleData = await fetchSchedule(username, password);
      if (scheduleData && scheduleData.raw) {
        const raw = scheduleData.raw;
        realInfo = {
          realName: raw.xm || '',
          studentId: raw.xh || '',
          college: raw.xy || '',
          major: raw.zy || '',
          class: raw.xzb || ''
        };
        console.log(`[Auth] 成功为用户 ${username} (${raw.xm}) 同步个人实名信息`);
      }
    } catch (e) {
      console.warn('[Auth] 登录时静默同步个人课表与身份信息失败:', e.message);
    }

    res.json({ 
      success: true, 
      user: { 
        username,
        ...realInfo
      } 
    });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
});

// 课表拉取接口
const userCredentials = new Map();

app.post('/api/schedule', async (req, res) => {
  const { username, password } = req.body;

  // 优先使用请求中的凭据，其次使用缓存的凭据
  const pwd = password || userCredentials.get(username);
  if (!username || !pwd) {
    return res.status(400).json({ success: false, message: '请提供学号和密码' });
  }

  console.log(`[Schedule] Fetching schedule for: ${username}`);

  try {
    const scheduleData = await fetchSchedule(username, pwd);
    console.log(`[Schedule] Success! Got ${scheduleData.courses.length} courses`);
    res.json({ success: true, ...scheduleData });
  } catch (error) {
    console.error(`[Schedule] Error:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 教材预订拉取接口
app.post('/api/textbooks', async (req, res) => {
  const { username, password } = req.body;

  const pwd = password || userCredentials.get(username);
  if (!username || !pwd) {
    return res.status(400).json({ success: false, message: '请提供学号和密码' });
  }

  console.log(`[Textbooks] Fetching textbooks for: ${username}`);

  try {
    const data = await fetchTextbooks(username, pwd);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error(`[Textbooks] Error:`, error.message);
    res.status(500).json({ success: false, message: error.message });
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
