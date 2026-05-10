# 生产部署指南

## 目录

1. [Docker Compose 部署](#1-docker-compose-部署)
2. [手动部署](#2-手动部署)
3. [Nginx SSL 配置](#3-nginx-ssl-配置)
4. [环境变量说明](#4-环境变量说明)
5. [数据库备份与迁移](#5-数据库备份与迁移)
6. [端口与安全组](#6-端口与安全组)
7. [运维检查清单](#7-运维检查清单)

---

## 1. Docker Compose 部署

### 前置条件

- Docker Engine 24+ + Docker Compose v2
- 域名（可选，用于 SSL）

### 部署步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-org/ai-mental-health.git
cd ai-mental-health

# 2. 创建生产环境变量文件
cp server/.env.production server/.env
# 编辑 server/.env，修改 JWT_SECRET 和数据库密码

# 3. 启动全部服务
docker compose up -d

# 4. 查看启动日志
docker compose logs -f

# 5. 执行数据库迁移和种子数据
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# 6. 验证服务
curl http://localhost:8080/api/health
```

### 服务架构

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|---------|---------|------|
| `mysql` | 3306 | 3307 | MySQL 8.0 数据库 |
| `backend` | 8000 | 8000 | NestJS API |
| `frontend` | 80 | 8080 | Nginx + Vue3 SPA |

### 常用命令

```bash
# 停止服务
docker compose down

# 停止并删除数据卷（会丢失数据库）
docker compose down -v

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 重新构建镜像（代码更新后）
docker compose build --no-cache
docker compose up -d

# 进入容器
docker compose exec backend sh
docker compose exec mysql mysql -u ai_vue_user -p ai_vue
```

---

## 2. 手动部署

### 2.1 后端部署

```bash
cd server

# 安装依赖
npm ci --omit=dev

# 配置环境变量
cp .env.production .env
# 编辑 .env 填入生产配置

# 生成 Prisma 客户端
npx prisma generate

# 执行迁移
npx prisma migrate deploy

# 构建
npm run build

# 启动（建议使用 PM2 进程管理）
npm install -g pm2
pm2 start dist/main.js --name ai-vue-backend
pm2 save
pm2 startup
```

### 2.2 前端部署

```bash
# 构建静态文件
npm ci
npm run build

# 将 dist/ 目录复制到 Nginx 或 CDN
# 示例：复制到 Nginx 默认目录
cp -r dist/* /usr/share/nginx/html/
```

### 2.3 进程管理（PM2）

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-vue-backend',
    script: 'dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '500M',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
  }],
};
```

---

## 3. Nginx SSL 配置

### 使用 Certbot 自动获取 SSL 证书

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 获取证书（替换 your-domain.com）
certbot --nginx -d your-domain.com -d api.your-domain.com

# 证书会自动续期，验证
certbot renew --dry-run
```

### Nginx 完整配置示例

```nginx
# /etc/nginx/sites-available/ai-vue
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 前端静态文件
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 支持
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 120s;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### API 子域名配置（可选）

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

---

## 4. 环境变量说明

### 后端 (`server/.env`)

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `APP_ENV` | 否 | `production` | 运行环境 |
| `PORT` | 否 | `8000` | 服务监听端口 |
| `DATABASE_URL` | **是** | — | MySQL 连接串 |
| `JWT_SECRET` | **是** | — | JWT 签名密钥（生产环境必须修改） |
| `JWT_EXPIRES_IN` | 否 | `1440m` | Token 有效期 |
| `DEEPSEEK_API_KEY` | 否 | 空 | DeepSeek API Key（留空使用 mock AI） |
| `DEEPSEEK_BASE_URL` | 否 | `https://api.deepseek.com` | API 端点 |
| `DEEPSEEK_MODEL` | 否 | `deepseek-chat` | 模型名称 |

### Docker Compose 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | `root123456` | MySQL root 密码 |
| `MYSQL_PASSWORD` | `ai_vue_pass` | 应用数据库用户密码 |
| `JWT_SECRET` | `change-me-in-production` | JWT 密钥 |
| `DEEPSEEK_API_KEY` | 空 | DeepSeek API Key |

---

## 5. 数据库备份与迁移

### 5.1 备份

```bash
# Docker Compose 部署
docker compose exec mysql mysqldump -u ai_vue_user -p ai_vue > backup_$(date +%Y%m%d).sql

# 手动部署
mysqldump -u ai_vue_user -p ai_vue > backup_$(date +%Y%m%d).sql
```

### 5.2 恢复

```bash
# Docker Compose 部署
cat backup_20250101.sql | docker compose exec -T mysql mysql -u ai_vue_user -p ai_vue

# 手动部署
mysql -u ai_vue_user -p ai_vue < backup_20250101.sql
```

### 5.3 Prisma 迁移

```bash
# 生产环境执行迁移
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# 重置数据库（警告：会清空数据）
npx prisma migrate reset
```

### 5.4 备份策略建议

- 每日全量备份，保留最近 7 天
- 备份文件远程同步到对象存储（OSS/S3）
- 部署前手动执行一次 `prisma migrate deploy` 确认迁移状态

---

## 6. 端口与安全组

### 端口说明

| 端口 | 服务 | 说明 | 公网访问 |
|------|------|------|---------|
| `80` | Nginx | HTTP 重定向 | 建议仅用于 Let's Encrypt 验证 |
| `443` | Nginx | HTTPS | 必须开放 |
| `8000` | NestJS API | 后端 API | 禁止直接开放，仅内网/反向代理 |
| `3307` | MySQL | 数据库 | 禁止直接开放 |
| `8080` | Nginx（Docker） | 前端 SPA | 开发环境可用 |

### 安全组规则建议

```
入站规则：
  - 443 (HTTPS) — 来源: 0.0.0.0/0
  - 80 (HTTP)   — 来源: 0.0.0.0/0（仅用于 SSL 验证）

出站规则：
  - 允许全部出站

内网规则（同一安全组）：
  - 8000 (API) — 来源: 内网/安全组
  - 3306 (MySQL) — 来源: 内网/安全组
```

### 安全加固

1. **修改默认密码**：部署后立即修改 JWT_SECRET、数据库密码、管理员密码
2. **关闭端口**：生产环境不要暴露 `8000` 和 `3307` 端口到公网
3. **启用限流**：后端已集成 `@nestjs/throttler`（120 req/min 全局，登录 5/min，注册 3/min）
4. **文件上传限制**：仅允许图片类型，最大 10MB
5. **定期更新依赖**：`npm audit` 检查安全漏洞
6. **审核日志**：定期检查 `docker compose logs backend`

---

## 7. 运维检查清单

### 部署前

- [ ] JWT_SECRET 已改为随机字符串（非默认值）
- [ ] 数据库密码已修改
- [ ] 管理员默认密码已修改
- [ ] `.env` 文件已配置正确的 `DATABASE_URL`
- [ ] 域名 DNS 已指向服务器 IP
- [ ] SSL 证书已配置
- [ ] Docker Compose 配置中的密码已修改

### 部署后

- [ ] `GET /api/health` 返回 `{"status": "ok"}`
- [ ] `POST /api/user/login` 管理端登录正常
- [ ] 前端页面可正常访问（HTTPS）
- [ ] SSE 聊天功能正常（流式响应）
- [ ] 文件上传功能正常

### 日常维护

- [ ] 每天检查服务运行状态
- [ ] 每周检查 `docker compose logs` 异常
- [ ] 每月检查 npm 安全更新
- [ ] 每季度更新 SSL 证书（certbot 自动续期）
- [ ] 确保备份脚本正常运行
