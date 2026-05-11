# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 依赖安装（利用 Docker 缓存）
COPY package.json package-lock.json ./
RUN npm ci

# Prisma schema（MySQL 版本）
COPY prisma/mysql/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate

# 源码编译
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine

WORKDIR /app

# 仅复制生产依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Prisma 客户端 + 迁移文件
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# 编译产物
COPY --from=builder /app/dist ./dist

# 启动入口脚本（先迁移再启动）
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

CMD ["/app/docker-entrypoint.sh"]
