#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$ROOT_DIR/server"

echo "========================================"
echo "  AI 心理健康管理平台 — 开发启动"
echo "========================================"
echo ""

# ============================================================
# 1. 检测 node / npm
# ============================================================
if ! command -v node &>/dev/null; then
  echo "[错误] 未检测到 Node.js，请先安装 Node.js >= 18"
  exit 1
fi
echo "[Node] $(node -v)"

if ! command -v npm &>/dev/null; then
  echo "[错误] 未检测到 npm"
  exit 1
fi

# ============================================================
# 2. 安装前端依赖
# ============================================================
echo "[前端] 安装依赖中..."
cd "$ROOT_DIR"
npm install

# ============================================================
# 3. 安装后端依赖
# ============================================================
echo "[后端] 安装依赖中..."
cd "$SERVER_DIR"
npm install

# ============================================================
# 4. 数据库迁移
# ============================================================
echo "[数据库] 执行迁移..."
npx prisma migrate dev

# ============================================================
# 5. 种子数据
# ============================================================
echo "[数据库] 写入种子数据..."
npx prisma db seed

# ============================================================
# AI Key 检查
# ============================================================
if [ -f "$SERVER_DIR/.env" ]; then
  # 检查 DEEPSEEK_API_KEY 是否存在且不为空
  if grep -Eq '^DEEPSEEK_API_KEY=.+' "$SERVER_DIR/.env" 2>/dev/null; then
    echo "  [AI] 已配置 API Key，使用真实 AI 模型"
  else
    echo "  [AI] 未检测到 API Key，使用 Mock AI 模式（无需配置即可演示）"
    echo "  [AI] 如需接入真实 AI，编辑 server/.env 设置 DEEPSEEK_API_KEY"
  fi
else
  echo "  [AI] 未检测到 .env 文件，使用 Mock AI 模式"
fi

echo ""
echo "正在启动服务（按 Ctrl+C 停止所有服务）..."
echo ""

# ============================================================
# 6. 并行启动前端和后端，输出加前缀
# ============================================================
run_with_prefix() {
  local prefix="$1"
  shift
  # 用子 shell 运行命令，每行输出添加 [prefix] 标签
  ("$@" 2>&1 | while IFS= read -r line; do
    echo "[${prefix}] ${line}"
  done) &
}

cd "$ROOT_DIR"
run_with_prefix "frontend" npm run dev
frontend_pid=$!

cd "$SERVER_DIR"
run_with_prefix "backend" npm run start:dev
backend_pid=$!

# 捕获 SIGINT/SIGTERM 做清理
cleanup() {
  echo ""
  echo "正在停止所有服务..."
  kill "$frontend_pid" 2>/dev/null || true
  kill "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
  echo "服务已停止。"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo "  Swagger: http://localhost:8000/api/docs"
echo ""

# 等待任意一个后台进程退出
wait
