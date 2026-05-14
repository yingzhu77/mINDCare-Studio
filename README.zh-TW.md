# AI 心理健康管理平台

[简体中文](README.md) · [English](README.en.md) · **繁體中文**

基於 Vue3 + NestJS + DeepSeek AI 的全端心理健康管理平台。支援管理後台和使用者端雙角色，提供 AI 聊天、情緒日記、知識科普、資料看板等功能，已打包為 Windows 桌面應用。

## 專案狀態

**目前版本：v2.6.0 — Docker 部署線 + Electron Windows 桌面示範版 + 開源上線準備**

| 層級   | 狀態          | 說明                                                                                |
| ------ | ------------- | ----------------------------------------------------------------------------------- |
| 前端   | ✅ 管理端完成 | 暖薰衣草紫統一主題 + 首頁 + 登入/Dashboard(ECharts 趨勢圖)/知識文章 CRUD+審核/諮詢記錄/情緒日誌/使用者管理/分析頁 |
| 前端   | ✅ 用戶端完整 | ClientLayout(頂部導航) + AI 聊天(SSE+會話側邊欄+刪除/匯出) + 情緒日記 + 情緒洞察(趨勢/分佈/圖表) + 文章投稿+修訂+知識閱讀 + 通知鈴鐺 |
| 後端   | ✅ 全部完成   | NestJS + Prisma + 9 實體(含通知+修訂) + 認證 + 管理端/用戶端介面 + AI 模組 + 審核通知 |
| 資料庫 | ✅ 主線完成   | Prisma migration 管理，SQLite 開發，可切換 MySQL，含 KnowledgeArticleRevision 表     |
| AI     | ✅ 骨架就緒   | DeepSeek 用戶端 + mock AI 模式 + SSE 流式 + 分析結果落庫+緩存                       |
| 基礎設施 | ✅ 就緒   | Docker Compose 三容器編排、GitHub Actions CI、Playwright E2E 14 用例                |

## 技術棧

**前端：**

- Vue3
- Vite
- Element Plus
- Axios + Pinia + Vue Router
- wangEditor

**後端主線（server/）：**

- TypeScript
- NestJS
- Prisma
- MySQL（開發期可用 SQLite）
- JWT
- Swagger / OpenAPI

**AI 接入：**

- DeepSeek API（相容 OpenAI 介面格式）
- 後端代理呼叫 + SSE 流式回應
- 分析結果落庫 + mock AI 演示模式

## 目錄結構

```text
src/                       # Vue3 前端
  api/
    admin.ts               # 管理端 API 封裝（TypeScript）
    client.ts              # 用戶端 API 封裝（聊天、情緒日記）
    types.ts               # 型別定義
  components/              # 複用元件（側邊欄、彈窗、通知鈴鐺等）
  router/                  # 路由與鑑權守衛（角色區分 admin/user）
  store/                   # Pinia 狀態管理（auth、menu、review）
  utils/                   # 工具函式（請求封裝、訊息解析、日期格式化、日誌）
  views/                   # 頁面級元件
    AuthLayout.vue         # 登入/註冊佈局
    Login.vue              # 登入頁
    Register.vue           # 註冊頁
    Home.vue               # 首頁（功能卡片 + 關於區域）
    Dashboard.vue          # 管理端儀表板（ECharts 趨勢圖）
    knowledge.vue          # 知識文章管理
    emotional.vue          # 情緒日誌管理
    logs.vue               # 諮詢記錄
    ArticleReview.vue      # 文章審核（含修訂）
    Analytics.vue          # 資料洞察分析頁
    ClientLayout.vue       # 用戶端佈局（頂部導航 + 通知鈴鐺）
    ClientChat.vue         # AI 聊天（SSE 流式 + 會話側邊欄）
    ClientDiary.vue        # 用戶端情緒日記
    ClientEmotionInsights.vue        # 用戶端情緒洞察（圖表）
    ClientArticles.vue     # 用戶端文章投稿列表
    ClientArticleCreate.vue# 用戶端投稿編輯
    ClientArticleBrowse.vue # 用戶端知識閱讀
    ClientArticleDetail.vue # 用戶端文章詳情

server/                    # NestJS + Prisma 後端
  prisma/
    schema.prisma          # 9 個核心實體（含 notification + revision）
    seed.ts                # 管理員 + 測試使用者 + 演示資料
    migrations/
  src/
    main.ts
    app.module.ts
    common/                # 統一回應、異常過濾、Guard、裝飾器
    auth/                  # 認證模組
    users/                 # 使用者管理
    knowledge/             # 知識文章 + 審核
    chat/                  # 諮詢會話 + AI 聊天 SSE
    emotion-diary/         # 情緒日記
    analysis/              # AI 分析（情緒分析、會話摘要）
    analytics/             # Dashboard 資料概覽 + 趨勢
    upload/                # 檔案上傳
    ai/                    # DeepSeek 用戶端 + mock 模式
    notification/          # 審核通知
    client-article/        # 用戶端文章投稿
  package.json
  tsconfig.json
  .env.example

docs/                      # 專案文件和計畫書
scripts/                   # 一鍵啟動腳本
e2e/                       # Playwright E2E 測試
public/                    # 靜態資源（favicon、icons）
desktop/                   # Electron 桌面版（已完成 — NSIS + portable 打包就緒）

## 執行方式

專案支援三種執行方式，按需選擇：

| 方式 | 適用場景 | 資料庫 | AI |
|------|----------|--------|----|
| 開發執行 | 改程式碼 / 除錯 | SQLite（可切換 MySQL） | Mock AI（可配 Key） |
| Docker 部署 | 生產 / 自部署 | MySQL 8.0 | 可配真實 Key |
| Windows EXE | 本機演示 / 重現 | SQLite | Mock AI（可配 Key） |

### 方式一：開發執行

**前端**

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

**後端（NestJS 主線）**

```powershell
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

訪問：`http://127.0.0.1:5173`

- 管理端：`/auth/login`（admin 角色登入後自動跳轉 `/back/dashboard`）
- 用戶端：`/auth/login`（user 角色登入後自動跳轉 `/client/chat`）

或使用一鍵啟動腳本：

```powershell
# Windows
.\scripts\start-dev.ps1

# macOS / Linux
bash scripts/setup.sh
```

### 方式二：Docker Compose

```bash
docker compose up -d
```

訪問 `http://localhost:8080`。詳見 [docs/deployment.md](docs/deployment.md)。

### 方式三：Windows 演示 EXE

專案已打包為 Windows 桌面應用，雙擊執行，內建前後端 + SQLite + Mock AI：

```powershell
cd desktop
npm run dist
```

產物位於 `desktop/dist-electron/`：
- `AI心理健康助手 Setup 1.0.0.exe` — NSIS 安裝包
- `AI心理健康助手-portable-1.0.0.exe` — 攜帶版（免安裝）

詳見 [docs/deployment-plan.md](docs/deployment-plan.md) 路線 B。

## 執行說明

> ⚠️ 本專案目前**僅進行過本機開發環境測試和 Windows EXE 桌面應用測試**，尚未在生產伺服器上部署執行。如果你計畫部署到公網伺服器，請自行評估安全強化（HTTPS、反向代理、資料庫存取控制等），詳見 `docs/deployment.md`。

## 已實現介面

### 公共頁面

| 路徑 | 說明 |
| ---- | ---- |
| `/` | 首頁（功能卡片 + 關於區域） |
| `/auth/login` | 登入頁（左側 logo + 暖金色文案） |
| `/auth/register` | 註冊 |

### 認證

| 方法 | 路徑                 | 說明                 |
| ---- | -------------------- | -------------------- |
| POST | `/api/user/login`    | 登入，返回 JWT token |
| POST | `/api/user/register` | 註冊                 |
| GET  | `/api/user/me`       | 目前使用者資訊       |

### 管理端

| 方法                | 路徑                                            | 說明                               |
| ------------------- | ----------------------------------------------- | ---------------------------------- |
| GET                 | `/api/knowledge/category/tree`                  | 知識分類樹                         |
| GET/POST/PUT/DELETE | `/api/knowledge/article/**`                     | 文章 CRUD                          |
| PUT                 | `/api/knowledge/article/:id/status`             | 管理端文章發布/下線/重新發布       |
| GET                 | `/api/knowledge/article/review/page`            | 文章/修訂統一審核列表              |
| GET                 | `/api/knowledge/article/review/pending-count`   | 待審核數量                         |
| GET                 | `/api/knowledge/article/review/:type/:id`       | 審核預覽詳情                       |
| PUT                 | `/api/knowledge/article/review/:type/:id/status`| 審核通過/駁回                      |
| GET                 | `/api/psychological-chat/sessions`              | 諮詢會話列表                       |
| GET                 | `/api/psychological-chat/sessions/:id/messages` | 會話訊息                           |
| GET                 | `/api/emotion-diary/admin/page`                 | 情緒日記管理端分頁                 |
| DELETE              | `/api/emotion-diary/admin/:id`                  | 情緒日記刪除                       |
| GET                 | `/api/data-analytics/overview`                  | Dashboard 統計概覽                 |
| GET                 | `/api/data-analytics/trends`                    | Dashboard 趨勢圖（情緒/諮詢/文章） |
| POST                | `/api/file/upload`                              | 檔案上傳                           |
| POST                | `/api/analysis/emotion-diary/:id`               | 觸發情緒日記 AI 分析               |
| GET                 | `/api/analysis/emotion-diary/:id`               | 取得情緒日記分析結果               |
| POST                | `/api/analysis/chat-session/:id`                | 觸發會話 AI 分析                   |
| GET                 | `/api/analysis/chat-session/:id`                | 取得會話分析結果                   |
| GET                 | `/api/user/page`                                | 使用者管理分頁                     |
| PUT                 | `/api/user/:id/status`                          | 啟用/停用使用者                    |
| GET                 | `/api/notification/list`                        | 通知列表                           |
| GET                 | `/api/notification/unread-count`                | 未讀通知數                         |
| PUT                 | `/api/notification/read/:id`                    | 標記通知已讀                       |
| PUT                 | `/api/notification/read-all`                    | 全部標記已讀                       |

### 用戶端

| 方法   | 路徑                                  | 說明                      |
| ------ | ------------------------------------- | ------------------------- |
| POST   | `/api/chat/send`                      | AI 聊天 SSE 流式          |
| GET    | `/api/chat/sessions/my`               | 我的會話列表帶預覽        |
| DELETE | `/api/chat/session/:sessionId`        | 刪除會話（串聯訊息+分析） |
| GET    | `/api/chat/session/:sessionId/export` | 匯出會話為 JSON           |
| POST   | `/api/emotion-diary`                  | 新增情緒日記              |
| GET    | `/api/emotion-diary/my/page`          | 我的情緒日記分頁          |
| PUT    | `/api/emotion-diary/:id`              | 更新情緒日記              |
| DELETE | `/api/emotion-diary/:id`              | 刪除情緒日記（用戶端）    |
| GET    | `/api/emotion-diary/my/statistics`   | 我的情緒資料統計（趨勢/分佈） |
| GET    | `/api/client/article/page`            | 我的投稿列表              |
| POST   | `/api/client/article`                 | 建立投稿                  |
| PUT    | `/api/client/article/:id`             | 編輯投稿                  |
| PUT    | `/api/client/article/:id/submit`      | 提交審核                  |

### 統一回應結構

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分頁返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 0,
    "currentPage": 1,
    "size": 10
  }
}
```

## 預設帳號

| 角色   | 使用者名稱 | 密碼        |
| ------ | ---------- | ----------- |
| 管理員 | admin      | admin123456 |
| 測試使用者 | testuser | admin123456 |

> 所有環境使用相同種子資料，包含管理員和測試使用者各一，以及範例文章、會話記錄和情緒日記。

## 部署與維運

- [docs/deployment.md](docs/deployment.md) — Docker Compose 三容器編排 + Nginx SSL + 安全強化
- [docs/deployment-plan.md](docs/deployment-plan.md) — 部署上線雙線計畫（開源部署線 + Windows EXE 線）

## 驗證指令

前端建置：

```powershell
npm run build
```

後端驗證：

```powershell
cd server
npm run build
npx prisma migrate status
```

前後端單元測試：

```powershell
npm run test
cd server
npm run test:unit
```

登入介面驗證：

```powershell
curl -X POST http://127.0.0.1:8000/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

### Playwright E2E 測試

前置條件：後端已建置（`cd server && npm run build`）。

```powershell
# 執行全部 E2E 測試（自動啟動前後端服務）
npx playwright test

# 指定檔案
npx playwright test e2e/smoke.spec.ts

# UI 除錯模式
npx playwright test --ui
```

> - 本機執行複用已有埠號（`5174` / `8001`），CI 環境乾淨啟動
> - 測試不依賴真實 DeepSeek API，後端自動降級 Mock AI 模式
> - 埠號衝突時錯誤資訊明確，參考 `docs/current-state.md`

## AI 功能設定

### Mock AI 模式（預設）

專案預設使用 **Mock AI 模式**，無需任何 API Key 即可完整演示所有功能。AI 聊天會返回預設回覆（逐字流式效果），分析功能返回模擬的結構化結果。**此模式適合開發、演示和評估階段。**

### 接入真實 DeepSeek API

如需使用真實 AI 能力（建議在部署到生產環境前接入），請設定 API Key：

```powershell
# 編輯 server/.env，填入你的 DeepSeek API Key
DEEPSEEK_API_KEY=<your_deepseek_api_key>
```

重啟後端後，所有 AI 功能自動切換到真實模型呼叫：

- AI 聊天使用 DeepSeek v4-Flash 模型即時產生回覆
- 情緒日記分析使用真實模型分析
- 會話摘要由模型產生真實摘要

> ⚠️ **注意**：
>
> - API Key 只存在於後端 `.env` 檔案中，不會寫入前端或提交到倉庫
> - 未設定 Key 時系統自動使用 Mock 模式，不會報錯
> - 如果你 clone 了本倉庫，使用前請先確認是否已設定自己的 API Key

## 多語言說明

本專案支援簡體中文、繁體中文和英文介面，透過 vue-i18n 實現。

**翻譯範圍：** 導航選單、按鈕、標籤、提示資訊等 UI 框架文字已完整翻譯。頁面中由使用者產生的內容（文章正文、情緒日記內容、AI 聊天訊息等）保持原語言不變，不會自動翻譯。

**切換方式：** 管理端頂欄或用戶端導航欄右側的語言切換下拉選單，可隨時切換介面語言。瀏覽器預設語言為 `zh-TW`/`zh-HK`/`zh-MO` 時會自動載入繁體中文。

## 產品安全聲明

### 平台定位

**AI 心理健康管理平台**是一個提供 AI 輔助心理支援的技術工具，旨在幫助使用者記錄情緒、獲取心理健康科普知識和初步的情緒覺察支援。

### AI 能力邊界

- AI 助手（聊天功能）基於大語言模型產生回覆，**不提供醫療診斷、處方或心理治療**。
- AI 分析結果（情緒分析、會話摘要）僅供使用者參考，**不能替代專業心理健康服務**。
- 平台所有 AI 功能皆設計為輔助工具，**不具備臨床決策能力**。

### 緊急情況處理

- 當使用者表達自傷、自殺或傷害他人意圖時，AI 會優先提供心理援助專線資訊，並強烈建議尋求專業協助。
- 平台內建危機關鍵字偵測機制，確保在高風險對話中優先推送求助資源。
- **如您或身邊人正處於緊急危險中，請立即撥打 110 或前往最近的醫院急診。**

### 不替代專業醫療

本平台及其 AI 功能**不得用於**：

- 替代專業心理諮詢或心理治療
- 診斷精神健康障礙
- 開立處方或治療方案
- 監測或管理嚴重精神疾病

如果您需要專業心理健康服務，請聯絡：

- **全國心理援助專線：400-161-9995**
- **北京心理危機干預中心：010-82951332**

### 資料隱私提醒

- AI 聊天內容會儲存在伺服器中用於對話連續性
- 建議不要在對話中透露個人身分資訊（真實姓名、身分證號、地址等）
- 詳細的隱私政策請參閱專案相關文件
