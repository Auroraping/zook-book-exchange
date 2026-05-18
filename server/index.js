import express from 'express';
import cors from 'cors';
import { authenticateZJU } from './authService.js';
import { fetchSchedule, fetchTextbooks } from './scheduleService.js';
import { askTaosu } from './aiService.js';
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

app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'ZJU Used Book Backend',
    message: '后端服务运行中。前端请访问 http://127.0.0.1:5173',
    endpoints: ['/api/health', '/api/login', '/api/schedule', '/api/textbooks', '/api/ai/chat'],
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'ZJU Used Book Backend',
    aiModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
  });
});

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

// AI 聊天接口：密钥只放在后端环境变量中，前端永不接触
app.post('/api/ai/chat', async (req, res) => {
  try {
    const result = await askTaosu(req.body || {});
    res.json({ success: true, ...result });
  } catch (error) {
    const status = error.status || 502;
    console.error('[AI] DeepSeek request failed:', error.message);
    res.status(status).json({
      success: false,
      message: status === 503 ? error.message : '桃酥暂时无法连接模型服务，请稍后再试',
    });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`ZJU Auth & Chat Proxy Server running at http://localhost:${PORT}`);
});
