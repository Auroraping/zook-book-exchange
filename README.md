# 浙里淘书 zook

<p align="center">
  <img src="./client/public/logo.png" alt="浙里淘书 zook Logo" width="120" />
</p>

浙里淘书是面向浙江大学师生的二手教材交易与知识流转系统。系统围绕购书广场、课表教材匹配、知识社区、订单消息和“小酥” AI 助手组织功能。项目不依赖数据库：Flask 统一承接业务 API，并把可变业务状态持久化到 `client/public/data/*.json`。

## 技术结构

```text
group1/
|-- client/                  # Vue 3 + Vite 前端
|   |-- public/data/         # 业务演示数据 JSON
|   |-- public/              # 图片与静态资源
|   `-- src/
|       |-- components/      # 页面拆分组件
|       |-- composables/      # 数据、认证和 API 复用逻辑
|       |-- pages/           # 路由页面
|       `-- router/          # Vue Router
|-- server/                  # Flask 后端
|   |-- app.py               # API 和 Socket.IO 入口
|   |-- json_store.py        # JSON 持久化与并发写入封装
|   |-- auth_service.py      # 浙大 CAS 认证
|   |-- schedule_service.py  # 课表和教材抓取
|   `-- ai_service.py        # DeepSeek 后端代理
`-- prototype/               # 原型文档和截图
```

## 已有功能

- 首页与功能导航。
- 二手书检索、详情、收藏、发布审核、举报、购物清单、下单、支付、确认、取消和评价。
- 课表同步、本地课表兜底、官方教材信息同步和平台二手书匹配。
- 消息会话、通知已读、个人中心、成就和求购心愿匹配。
- 知识社区笔记列表、详情、点赞和下载计数。
- “小酥” AI 教材分析与对话。
- 后端 CAS 登录、本地 JSON 演示账号注册、教务课表抓取、教材抓取、AI 代理和内存 Socket.IO 消息事件。

## 无数据库业务流

- 书籍、心愿、购物清单、订单、收藏、评价、通知、社区笔记统计和聊天记录都由 Flask API 读写 JSON。
- 卖家发布后产生待审核书籍；管理员审核通过后进入购书广场，并匹配已有求购心愿。
- 买家收藏或加入购物清单后可创建订单；订单按未支付、履约中、已完成或已取消流转，完成后可评价。
- 页面静态配置和演示种子仍在 `client/public/data/`，Vue 页面不把业务数据集硬编码到组件中。

## 品牌与团队

- 项目名称：浙里淘书 zook
- 课程归属：浙江大学《Web 编程》课程作业，第一小组
- 项目定位：浙大二手书知识流转平台
- 品牌口号：好书淘不尽，浙里 top three
- AI 助手：小酥

## 作业约束落实

- 后端代码集中在 `server/`，框架为 Flask。
- 前端代码集中在 `client/`，由 Vue 3、Vite、Composition API 和 `<script setup>` 组织。
- 前端演示数据保存在 `client/public/data/*.json`；Vue、HTML、JS 中不嵌入业务数据集。
- 页面已拆成多个组件；除根组件承担全局样式外，组件内样式按 Vue 组件边界维护。
- Vue template 保持短小，超出页面职责的内容放进组件。
- 前端源码不使用 `var`。
- 自定义样式入口为 `client/src/tailwind.css`，`assets` 不承载自定义 CSS。

## 启动

### 1. 启动 Flask 后端

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

后端默认地址：

```text
http://localhost:3001
```

健康检查：

```text
http://localhost:3001/api/health
```

### 2. 启动 Vue 前端

另开终端：

```powershell
cd client
npm install
npm run dev
```

前端默认地址：

```text
http://127.0.0.1:5173
```

Vite 已将 `/api` 代理到 `http://localhost:3001`。

## AI 配置

DeepSeek 密钥只放在 `server/.env.local` 或运行环境变量中，不能写入前端：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-v4-pro
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
```

配置方式二选一：

- 在前端进入 `桃酥 / AI 分析` 页面，在“DeepSeek 密钥配置”中输入 API 密钥，后端会自动生成 `server/.env.local`。
- 或在 `server/` 下执行：

```powershell
.\setup-env.ps1
```

接口地址按 DeepSeek 官方 OpenAI 兼容接口配置，文档见 `https://api-docs.deepseek.com/zh-cn/`。

未配置 `DEEPSEEK_API_KEY` 时，AI 接口会返回明确错误，其他本地 JSON 驱动的页面仍可使用。

测试配置接口时可设置 `ZOOK_ENV_FILE` 指向临时文件，避免把测试密钥写入真实的 `server/.env.local`。

## 检查

前端构建：

```powershell
cd client
npm run build
```

后端语法检查：

```powershell
cd server
python -m py_compile app.py auth_service.py schedule_service.py ai_service.py config.py json_store.py
```
