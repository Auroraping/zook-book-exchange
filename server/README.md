# Flask backend

`server/` 是浙里淘书的后端目录。当前后端使用 Flask，不依赖数据库；可变业务状态通过 `json_store.py` 写入 `client/public/data/*.json`。

- `GET /api/health`
- `POST /api/login`
- `POST /api/register`
- `POST /api/schedule`
- `POST /api/textbooks`
- `POST /api/ai/chat`
- `GET /api/ai/config`
- `POST /api/ai/config`
- `GET|POST|PATCH /api/books...`
- `GET|POST|DELETE /api/cart...`
- `GET|PATCH|POST /api/orders...`
- `GET|POST /api/wishes`
- `GET|POST /api/favorites...`
- `GET|PATCH /api/notifications...`
- `GET|PATCH /api/notes...`
- `GET|POST /api/chats...`

`app.py` 同时保留原有的 Socket.IO 内存消息事件：`register_user`、`search_user`、`join_room`、`send_message` 和 `ping_test`。

## Files

- `app.py`：Flask 路由和 Socket.IO 入口。
- `json_store.py`：JSON 文件读写、原子替换、ID 和时间戳工具。
- `auth_service.py`：浙江大学 CAS 登录认证。
- `schedule_service.py`：教务课表和官方教材抓取、清洗。
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

## Local env

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
```

前端 `桃酥 / AI 分析` 页面提供 DeepSeek 密钥配置入口，提交后会调用 `POST /api/ai/config` 并写入 `server/.env.local`。`GET /api/ai/config` 只返回是否已配置、脱敏后的密钥、模型和接口地址，不返回明文密钥。

`ZOOK_DATA_DIR` 可在测试时指向临时 JSON 目录；不配置时默认使用 `client/public/data`。`ZOOK_ENV_FILE` 可在测试时指向临时 `.env.local`，避免把测试密钥写入真实配置。`DEBUG_CRAWLER=1` 时会在 `server/` 下写出抓取调试文件；这些文件已被仓库忽略。

## Main workflows

- 本地注册和 CAS 登录统一返回前端用户对象。
- 发布书籍默认进入 `pending`，管理员审核通过后变成 `approved`，审核时会触发心愿匹配和通知。
- 购物清单只允许加入 `approved` 书籍；结算创建 `unpaid` 订单，支付后进入 `pending`，确认后进入 `completed`，取消后进入 `cancelled`。
- 已完成订单可以评价；收藏、笔记点赞下载、聊天消息和通知已读都会落盘到 JSON。
