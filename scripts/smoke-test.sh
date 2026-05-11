#!/usr/bin/env bash
# AI 心理健康管理平台 — API 冒烟测试脚本
# 用法: ./scripts/smoke-test.sh [base_url]
# 默认 base_url: http://127.0.0.1:8000

BASE_URL="${1:-http://127.0.0.1:8000}"
PASS=0
FAIL=0

green() { echo -e "\033[32m✓ $1\033[0m"; }
red() { echo -e "\033[31m✗ $1\033[0m"; }

check_status() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    green "$desc"
    PASS=$((PASS + 1))
  else
    red "$desc (期望 $expected, 实际 $actual)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo "  API Smoke Test - $BASE_URL"
echo "=========================================="

# 1. 健康检查
echo ""
echo "--- 健康检查 ---"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
check_status "GET /health → 200" "200" "$HEALTH"

# 2. 登录
echo ""
echo "--- 认证 ---"
LOGIN_RES=$(curl -s -X POST "$BASE_URL/api/user/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}')
TOKEN=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
LOGIN_CODE=$(echo "$LOGIN_RES" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
check_status "POST /user/login (admin) → 200" "200" "$LOGIN_CODE"

if [ -z "$TOKEN" ]; then
  red "未能获取 token，终止测试"
  exit 1
fi
green "Token 已获取: ${TOKEN:0:20}..."

# 3. 用户端 — 会话列表
echo ""
echo "--- P5: 聊天历史管理 ---"
SESSIONS=$(curl -s -X GET "$BASE_URL/api/chat/sessions/my" \
  -H "token: $TOKEN")
SESSIONS_CODE=$(echo "$SESSIONS" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
check_status "GET /chat/sessions/my → 200" "200" "$SESSIONS_CODE"

SESSION_ID=$(echo "$SESSIONS" | grep -o '"sessionId":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$SESSION_ID" ]; then
  green "获得会话 ID: ${SESSION_ID:0:12}..."

  # 导出
  EXPORT=$(curl -s -X GET "$BASE_URL/api/chat/session/$SESSION_ID/export" \
    -H "token: $TOKEN")
  EXPORT_CODE=$(echo "$EXPORT" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
  check_status "GET /chat/session/:id/export → 200" "200" "$EXPORT_CODE"

  # 验证会话数据完整
  HAS_SESSION=$(echo "$EXPORT" | grep -o '"session"' | head -1)
  HAS_MESSAGES=$(echo "$EXPORT" | grep -o '"messages"' | head -1)
  if [ -n "$HAS_SESSION" ] && [ -n "$HAS_MESSAGES" ]; then
    green "导出数据包含 session + messages"
  fi
else
  red "无会话可测试导出"
fi

# 4. 未登录时拒绝
echo ""
echo "--- 鉴权检查 ---"
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/chat/sessions/my")
check_status "GET /chat/sessions/my (无 token) → 401" "401" "$NO_AUTH"

# 5. 管理端 — 咨询记录列表
echo ""
echo "--- 管理端 ---"
ADMIN_SESSIONS=$(curl -s -X GET "$BASE_URL/api/psychological-chat/sessions" \
  -H "token: $TOKEN")
ADMIN_CODE=$(echo "$ADMIN_SESSIONS" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
check_status "GET /psychological-chat/sessions (admin) → 200" "200" "$ADMIN_CODE"

# 6. Dashboard
DASHBOARD=$(curl -s -X GET "$BASE_URL/api/data-analytics/overview" \
  -H "token: $TOKEN")
DASH_CODE=$(echo "$DASHBOARD" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
check_status "GET /data-analytics/overview → 200" "200" "$DASH_CODE"

# 7. 用户端 — 情绪日记
echo ""
echo "--- 用户端 ---"
DIARY=$(curl -s -X GET "$BASE_URL/api/emotion-diary/my/page" \
  -H "token: $TOKEN")
DIARY_CODE=$(echo "$DIARY" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
check_status "GET /emotion-diary/my/page → 200" "200" "$DIARY_CODE"

echo ""
echo "=========================================="
echo "  结果: $PASS 通过, $FAIL 失败"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
