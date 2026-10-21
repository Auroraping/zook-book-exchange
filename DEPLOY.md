# 浙里淘书 (zook) 线上部署指南

本指南提供三种线上部署方案，涵盖**免服务器一键上线**、**独立云服务器 Docker 部署**以及**传统主机部署**。

---

## 方案一：免服务器一键上线（推荐，最省心）

适用于学生课程作业展示、无个人云服务器的场景。使用 **Zeabur**、**Render** 或 **Railway** 等支持 Docker 的 PaaS 托管平台，自带免费公网 HTTPS 域名。

### 以 Zeabur 部署为例（推荐，国内访问快）
1. 将本地修改后的代码提交并推送到 GitHub 仓库（例如分支 `3stone` 或 `main`）。
2. 打开 [Zeabur 控制台](https://zeabur.com/)，使用 GitHub 登录。
3. 点击 **Create Project**（创建项目）。
4. 点击 **Deploy New Service** -> 选择 **Git** -> 选中你的 `zook-book-exchange` 仓库。
5. Zeabur 会自动识别根目录下的 `Dockerfile`，自动执行多阶段构建（前端打包 + 后端打包）。
6. 构建完成后，在服务的 **Networking**（网络）页面点击 **Generate Domain** 生成免费的公网二级域名（如 `zook.zeabur.app`）。
7. 如需启用 AI 助手，在服务的 **Variables**（环境变量）中添加：
  - `DEEPSEEK_API_KEY`: 你的 DeepSeek 密钥
  - `DEEPSEEK_MODEL`: `deepseek-chat`
  - `AI_CONFIG_WRITABLE`: 保持 `0`（默认）。设为 `1` 会让任何访客都能通过网页改写你的密钥
  - `AI_DAILY_QUOTA`: 每个用户（匿名按 IP）每天可调用 AI 的次数，默认 `40`，`0` 表示不限制
  - `AI_REQUIRE_LOGIN`: 设为 `1` 时，未登录用户不能使用 AI 助手
8. 访问生成的公网域名，即可正常使用完整功能（包括 WebSocket 聊天与 AI 分析）。

---

## 方案二：独立云服务器 Docker Compose 一键部署（企业级标准）

适用于拥有腾讯云、阿里云、华为云、AWS 等 Linux 云服务器（Ubuntu / Debian / CentOS）。

### 1. 安装 Docker 与 Docker Compose
如果服务器尚未安装 Docker，可执行官方一键安装脚本：
```bash
curl -fsSL https://get.docker.com | bash -s docker
systemctl enable --now docker
```

### 2. 拉取代码并启动
```bash
# 1. 克隆代码仓库
git clone https://github.com/Auroraping/zook-book-exchange.git
cd zook-book-exchange

# 2. （可选）配置环境变量
# 可以创建 server/.env.local 写入 DEEPSEEK_API_KEY=xxx

# 3. 使用 Docker Compose 一键构建并后台启动
docker compose up -d --build
```

### 4. 开放防火墙端口
确保云服务器控制台的安全组规则中，已放行 **3001** 端口（或通过 Nginx 反向代理放行 80/443 端口）。

访问 `http://<你的服务器公网IP>:3001` 即可直接体验！

---

## 方案三：云服务器 Nginx 反向代理与 SSL 证书配置

为了使用标准 80/443 端口和自定义域名，建议通过 Nginx 进行反向代理并开启 HTTPS。

### 1. 配置 Nginx
将仓库根目录下的 `nginx.conf.example` 复制到 Nginx 配置目录：
```bash
sudo cp nginx.conf.example /etc/nginx/conf.d/zook.conf
```
修改 `server_name` 为你的实际域名。

### 2. 申请免费 SSL 证书（Let's Encrypt）
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 重启 Nginx
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 常见问题与排查 (FAQ)

1. **WebSocket 长连接断开或无法聊天？**
   - 如果使用 Nginx 反向代理，请确保配置中包含 `proxy_set_header Upgrade $http_upgrade;` 与 `proxy_set_header Connection "upgrade";`。
2. **AI 功能提示服务不可用？**
   - 检查环境变量 `DEEPSEEK_API_KEY` 是否正确配置并有可用余额。
3. **数据如何持久化？**
   - Docker Compose 中已经将 `./server/uploads`（图片附件）、`./server/db_snapshot`（数据快照）和 `./server/chroma_db`（向量库）映射为宿主机数据卷，容器重启数据不丢失。
