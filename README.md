# 浙里淘书 zook

浙江大学校园二手书交易与知识流转系统。

<p align="center">
  <img src="./client/public/logo.png" alt="浙里淘书 zook Logo" width="120" />
</p>

**浙里淘书** 面向浙江大学师生，围绕二手教材交易、课表教材推荐、知识社区、消息通知和桃酥 AI 助手，帮助学生降低教材成本、提升找书效率，并把课程资料和经验沉淀下来。

---

## 当前实现

- **前端**：`client/`，Vue 3 + Vite + Tailwind CSS，使用 Composition API 和 `<script setup>`。
- **后端**：`server/`，Express + Socket.IO，提供浙大统一身份认证、课表/教材爬虫代理、消息服务和桃酥 AI 代理。
- **本地数据**：前端模拟数据集中放在 `client/public/data/*.json`，没有依赖数据库。
- **AI 助手**：桃酥通过后端调用 DeepSeek API，前端不直接接触密钥。

核心页面包括：首页、购书广场、书籍详情、发布书籍、购物清单、订单、消息、个人中心、课表推荐、知识社区、笔记详情和桃酥 AI 对话页。

---

## 目录结构

```text
group1/
├─ client/                 # 前端 Vue 应用
│  ├─ public/data/         # JSON 模拟数据
│  ├─ public/              # Logo、桃酥形象等静态资源
│  └─ src/
│     ├─ components/       # 页面拆分组件
│     ├─ composables/      # useAuth、useApi、useDataLoader
│     ├─ pages/            # 路由页面
│     ├─ router/           # Vue Router
│     └─ tailwind.css      # Tailwind 入口样式
├─ server/                 # 后端 Express 服务
│  ├─ aiService.js         # DeepSeek 后端代理
│  ├─ authService.js       # 浙大 CAS 登录
│  ├─ scheduleService.js   # 课表与教材爬虫
│  └─ index.js             # API 与 Socket.IO 入口
└─ prototype/              # 原型、截图和展示材料
```

---

## 启动系统

### 环境要求

- Node.js 18 或更高版本
- npm
- Windows PowerShell 或任意可运行 npm 的终端

以下命令默认项目位于：

```text
C:\Users\Flow_Young\Desktop\group1
```

### 首次安装依赖

首次拉取项目后，分别安装前后端依赖：

```powershell
cd C:\Users\Flow_Young\Desktop\group1\server
npm install
```

```powershell
cd C:\Users\Flow_Young\Desktop\group1\client
npm install
```

### 日常启动

请打开两个终端，分别启动后端和前端。

### 1. 启动后端

```powershell
cd C:\Users\Flow_Young\Desktop\group1\server
npm start
```

后端地址：

```text
http://localhost:3001
```

健康检查：

```text
http://localhost:3001/api/health
```

### 2. 启动前端

```powershell
cd C:\Users\Flow_Young\Desktop\group1\client
npm run dev
```

前端地址：

```text
http://127.0.0.1:5173
```

Vite 已配置 `/api` 代理，前端请求会转发到 `http://localhost:3001`。

如果直接打开 `http://localhost:3001`，看到 JSON 状态信息即表示后端运行正常；真正使用系统请打开前端地址 `http://127.0.0.1:5173`。

---

## DeepSeek 配置

桃酥 AI 由后端读取环境变量调用 DeepSeek，密钥不要写进前端代码。

本地运行时在 `server/.env.local` 中配置：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-v4-pro
```

仓库中只保留 `server/.env.example` 示例文件，真实的 `.env.local` 已被 `.gitignore` 忽略，不会被推送到远程仓库。

如果没有配置 DeepSeek 密钥，桃酥 AI 接口会返回“后端尚未配置 `DEEPSEEK_API_KEY`”，其他前端页面仍可正常查看模拟数据。

---

## 教务功能

后端提供以下教务相关接口：

- `POST /api/login`：浙大统一身份认证登录。
- `POST /api/schedule`：拉取真实课表。
- `POST /api/textbooks`：拉取教材预订页面和 jqGrid 课程列表。

教材预订接口会按照教务网真实页面脚本请求 `xsxjc_cxXsxjcIndex.html?doType=query`。如果教务网返回课程但教材详情字段为空，系统会在前端如实提示“教材详情暂未填写”，不会编造官方教材。

---

## 知识社区

知识社区数据位于：

```text
client/public/data/notes.json
```

当前已模拟六门课程，每门课程两篇笔记：

- 微积分
- 线性代数
- 微观经济学
- 宏观经济学
- 概率论与数理统计
- 毛概

笔记卡片可点击进入详情页：

```text
/community/note/:id
```

---

## 构建与检查

前端构建：

```powershell
cd C:\Users\Flow_Young\Desktop\group1\client
npm run build
```

后端语法检查：

```powershell
cd C:\Users\Flow_Young\Desktop\group1
node --check server\index.js
node --check server\scheduleService.js
node --check server\aiService.js
```

作业约束已按当前代码整理：

- Vue 页面使用 Composition API 和 `<script setup>`。
- 前端业务数据放在 `client/public/data/*.json`。
- 页面被拆分为多个组件，除根/布局外样式使用 scoped。
- Vue template 已控制在 50 个非空行以内。
- `client/src` 与核心后端文件不使用 `var`。
- 自定义 Tailwind 入口已移到 `client/src/tailwind.css`，`client/src/assets` 不放自定义 CSS。
- 已删除旧 React 备份和旧版 `client/app.js`。

---

## 品牌与功能

### 品牌资产

| Logo | Wordmark | 桃酥 |
| --- | --- | --- |
| <img src="./client/public/logo.png" alt="zook logo" width="92" /> | <img src="./client/public/zook_text.png" alt="zook wordmark" width="160" /> | <img src="./client/public/taosu.png" alt="桃酥" width="96" /> |

### 核心功能

1. **二手书交易**：按校区、价格、成色和课程匹配筛选教材。
2. **课表推荐**：登录后可同步真实课表，并匹配平台在售二手教材。
3. **知识社区**：沉淀课程笔记、复习重点和学习经验。
4. **消息通知**：支持私信、系统通知和订单动态。
5. **桃酥 AI**：既能回答通用问题，也能在教材、课程、交易场景下给出选书建议。

---

## 团队信息

- **项目名称**：浙里淘书 zook
- **课程归属**：浙江大学《Web 编程》课程作业 - 第一小组
- **项目定位**：浙大二手书知识流转平台
- **品牌口号**：好书淘不尽，浙里 top three
- **AI 助手**：桃酥

© 2026 zook / 浙里淘书
