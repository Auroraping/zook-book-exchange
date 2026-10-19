# ==========================================
# 阶段 1：构建前端静态页面 (Vue 3 + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# 安装前端依赖
COPY client/package*.json ./
RUN npm install

# 复制前端源码并执行打包
COPY client/ ./
RUN npm run build

# ==========================================
# 阶段 2：构建 Python Flask 后端运行环境
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# 设置环境变量，确保 Python 输出实时刷新且编码为 UTF-8
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    LANG=C.UTF-8 \
    PORT=3001 \
    FRONTEND_DIST_DIR=/app/client/dist

# 安装基础系统依赖（用于编译部分 C 扩展库如 Pillow/SQLite）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r ./server/requirements.txt

# 复制后端代码
COPY server/ ./server/

# 将阶段 1 构建的前端静态资源复制到指定目录
COPY --from=frontend-builder /app/client/dist ./client/dist

WORKDIR /app/server

# 暴露服务端口
EXPOSE 3001

# 启动服务
CMD ["python", "app.py"]
