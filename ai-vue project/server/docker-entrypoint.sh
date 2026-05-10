#!/bin/sh
# AI 心理健康管理平台 — 后端 Docker 入口
# 在启动应用前执行数据库迁移

set -e

echo ">>> 执行数据库迁移..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo ">>> 启动应用..."
exec node dist/main
