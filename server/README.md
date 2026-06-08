# Flask backend

`server/` 是浙里淘书的后端目录。当前后端使用 Flask 和 SQLite；可变业务状态都持久化到 `server/zook.db`，`client/public/data/*.json` 只作为首次初始化种子数据。

- `GET /api/health`
- `POST /api/login`
- `POST /api/register`
- `GET /api/auth/session`
- `POST /api/auth/zju`
- `POST /api/auth/zju/unbind`
- `POST /api/logout`
- `POST /api/schedule`
- `POST /api/textbooks`
- `POST /api/ai/chat`
- `GET /api/ai/config`
- `POST /api/ai/config`
- `GET|POST|PATCH /api/books...`
- `GET|PATCH|POST /api/orders...`
- `GET|POST /api/wishes`
- `GET|POST /api/favorites...`
- `GET|PATCH /api/notifications...`
- `GET|PATCH /api/notes...`
- `GET|POST /api/chats...`

`app.py` 同时保留原有的 Socket.IO 事件：`register_user`、`search_user`、`join_room`、`send_message` 和 `ping_test`；在线连接状态只作为临时会话状态，消息历史和用户搜索数据仍从 SQLite 读写。

## Files

- `app.py`：Flask 路由和 Socket.IO 入口。
- `json_store.py`：兼容旧调用的 SQLite 读写、ID 和时间戳工具。
- `auth_repository.py`：用户和 JWT 会话持久化。
- `jwt_service.py`：JWT 签发和校验。
- `auth_service.py`：浙江大学 CAS 登录认证。
- `schedule_helper.py`：教务课表抓取、清洗。
- `ai_service.py`：DeepSeek 服务端代理。
- `config.py`：本地环境变量读取和请求头配置。

## Run

在 `server/` 下安装依赖并启动：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

默认监听 `http://localhost:3001`，前端 Vite 已将 `/api` 代理到这个地址。

## Local Env

AI 密钥只放在后端本地环境文件中。复制 `.env.example` 或运行：

```powershell
.\setup-env.ps1
```

可用变量：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-v4-pro
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
PORT=3001
DEBUG_CRAWLER=0
ZOOK_DATA_DIR=../client/public/data
ZOOK_ENV_FILE=.env.local
JWT_SECRET=replace_with_a_long_random_secret
```

前端 `桃酥 / AI 分析` 页面提供 DeepSeek 密钥配置入口，提交后会调用 `POST /api/ai/config` 并写入 `server/.env.local`。`GET /api/ai/config` 只返回是否已配置、脱敏后的密钥、模型和接口地址，不返回明文密钥。

`ZOOK_DATA_DIR` 仅用于首次初始化 SQLite 种子数据；不配置时默认使用 `client/public/data`。`ZOOK_ENV_FILE` 可在测试时指向临时 `.env.local`，避免把测试密钥写入真实配置。`JWT_SECRET` 应使用足够长的随机字符串。`DEBUG_CRAWLER=1` 时会在 `server/` 下写出抓取调试文件；这些文件已被仓库忽略。

## Main Workflows

- 邮箱注册和邮箱登录返回前端用户对象、JWT 与过期时间。
- 个人中心的浙大统一身份认证成功后，会同步真实课表并写入 SQLite；未认证用户课表页展示 SQLite 中的模拟课表。
- 发布书籍需登录邮箱主账号并上传至少一张图片；发布后直接变为 `approved` 并上架。
- 购买入口统一进入聊天，买家在聊天中发交易提议，卖家接受后生成订单；平台不保留购物车清单功能。
- 已完成订单可以评价；收藏、笔记点赞下载、聊天消息和通知已读都会落盘到 SQLite。
