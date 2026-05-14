# mINDCare Studio

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · **English**

Repository: https://github.com/yingzhu77/mINDCare-Studio

mINDCare Studio is an open-source AI-assisted mental wellness management platform built with Vue 3, NestJS, Prisma, Docker, and Electron. It supports both admin and client roles, including AI chat, emotion diaries, wellness knowledge articles, analytics dashboards, and a Windows local demo app.

> Disclaimer: This project does not provide medical diagnosis, prescriptions, or psychotherapy. DeepSeek API keys are configured by users and are not built into the project. The Windows EXE is a local demo version, not a replacement for production deployment.

## AI-Assisted Development Practice

This project used Codex, Claude Code, and local Skills to support planning, code review, UI/UX design suggestions, documentation, and release readiness checks. AI is treated as an engineering collaborator; final code, builds, tests, packaging, and releases require human review.

- **Project constraints and context management** — Project constraint documents such as `.claude/CLAUDE.md` record engineering rules, handoff context, and key decisions to reduce information loss across development sessions.
- **UI/UX Pro Max Skill** — The project has integrated `ui-ux-pro-max`, located at `.codex/skills/ui-ux-pro-max/` and `.claude/skills/ui-ux-pro-max/`. This skill supports layout review, visual consistency, usability checks, design system suggestions, and Vue page design references.
- **Code review assistance** — Review-oriented skills and AI checks are used for critical changes, focusing on security, edge cases, test gaps, and deployment impact.
- **Testing and acceptance strategy** — Before release, frontend build, backend build, frontend unit tests, backend unit tests, and Windows EXE manual acceptance are required.
- **Development boundaries** — Real API keys, production `.env` files, and real user data must not be committed. AI-generated output must pass builds, tests, and human review before entering the release process.

## Project Status

**Current Version: v2.6.0 — Docker Deployment + Electron Windows Desktop Demo + Open Source Preparation**

| Layer       | Status         | Description                                                                                                 |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| Frontend    | ✅ Admin done   | Warm lavender theme + Home + Login/Dashboard (ECharts) + Knowledge CRUD+Review + Consultations + Diaries + User Management + Analysis Page |
| Frontend    | ✅ Client done  | ClientLayout + AI Chat (SSE+sidebar+delete/export) + Emotion Diary + Emotion Insights + Article Submission+Revision + Knowledge Reading + Notification Bell |
| Backend     | ✅ Complete     | NestJS + Prisma + 9 entities (w/ notification + revision) + Auth + Admin/Client APIs + AI Module + Review Notifications |
| Database    | ✅ Complete     | Prisma migration, SQLite for dev (MySQL-compatible), includes KnowledgeArticleRevision |
| AI          | ✅ Ready        | DeepSeek client + mock AI mode + SSE streaming + Analysis result persistence + cache |
| Infra       | ✅ Ready        | Docker Compose (3 containers), GitHub Actions CI, Playwright E2E (14 test cases) |

## Tech Stack

**Frontend:**

- Vue3
- Vite
- Element Plus
- Axios + Pinia + Vue Router
- wangEditor

**Backend (server/):**

- TypeScript
- NestJS
- Prisma
- MySQL (SQLite for development)
- JWT
- Swagger / OpenAPI

**AI Integration:**

- DeepSeek API (OpenAI-compatible interface)
- Backend proxy + SSE streaming
- Analysis result persistence + mock AI mode

## Directory Structure

```text
src/                       # Vue3 frontend
  api/
    admin.ts               # Admin API wrapper (TypeScript)
    client.ts              # Client API wrapper (chat, diary)
    types.ts               # Type definitions
  components/              # Reusable components
  router/                  # Routes & auth guards (admin/user roles)
  store/                   # Pinia state management
  utils/                   # Utility functions
  views/                   # Page components

server/                    # NestJS + Prisma backend
  prisma/
    schema.prisma          # 9 core entities
    seed.ts                # Admin + test user + demo data
    migrations/
  src/
    main.ts
    app.module.ts
    common/                # Unified response, exception filters, guards, decorators
    auth/                  # Auth module
    users/                 # User management
    knowledge/             # Knowledge articles + review
    chat/                  # Chat sessions + AI SSE
    emotion-diary/         # Emotion diary
    analysis/              # AI analysis (emotion, session summary)
    analytics/             # Dashboard overview + trends
    upload/                # File upload
    ai/                    # DeepSeek client + mock mode
    notification/          # Review notifications
    client-article/        # Client article submission

docs/                      # Project documentation
scripts/                   # One-click start scripts
e2e/                       # Playwright E2E tests
public/                    # Static assets
desktop/                   # Electron desktop app (NSIS + portable ready)
```

## How to Run

Three ways to run the project:

| Method          | Use Case            | Database               | AI                    |
| --------------- | ------------------- | ---------------------- | --------------------- |
| Dev Run         | Coding / Debugging  | SQLite (or MySQL)      | Mock AI (or real Key) |
| Docker Deploy   | Production          | MySQL 8.0              | Real Key optional     |
| Windows EXE     | Local Demo / Reproduce | SQLite               | Mock AI (or real Key) |

### Method 1: Development Run

**Frontend**

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

**Backend (NestJS)**

```powershell
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Access: `http://127.0.0.1:5173`

- Admin: `/auth/login` (admin role → auto redirect to `/back/dashboard`)
- Client: `/auth/login` (user role → auto redirect to `/client/chat`)

Or use the one-click script:

```powershell
# Windows
.\scripts\start-dev.ps1

# macOS / Linux
bash scripts/setup.sh
```

### Method 2: Docker Compose

```bash
docker compose up -d
```

Visit `http://localhost:8080`. See [docs/deployment.md](docs/deployment.md) (English version not available) for details.

### Method 3: Windows Desktop EXE

The project is packaged as a Windows desktop application. Double-click to run, with built-in frontend + backend + SQLite + Mock AI:

```powershell
cd desktop
npm run dist
```

Output in `desktop/dist-electron/`:
- `AI心理健康助手 Setup 2.6.0.exe` — NSIS installer
- `AI心理健康助手-portable-2.6.0.exe` — Portable version (no install needed)

See [docs/deployment-plan.md](docs/deployment-plan.md) (English version not available), Route B.

## Usage Notes

> ⚠️ This project has **only been tested in local development environment and as a Windows EXE desktop application**. It has not been deployed to a production server. If you plan to deploy to a public server, please evaluate security hardening (HTTPS, reverse proxy, database access control, etc.) yourself. See `docs/deployment.md` for details.

## Default Accounts

| Role         | Username  | Password     |
| ------------ | --------- | ------------ |
| Admin        | admin     | admin123456  |
| Test User    | testuser  | admin123456  |

> All environments use the same seed data, including one admin and one test user, along with sample articles, chat sessions, and emotion diary entries.

## Verification Commands

Frontend build:

```powershell
npm run build
```

Backend verification:

```powershell
cd server
npm run build
npx prisma migrate status
```

Login API test:

```powershell
curl -X POST http://127.0.0.1:8000/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

### Playwright E2E Tests

Prerequisite: Backend must be built (`cd server && npm run build`).

```powershell
# Run all E2E tests (auto-starts frontend & backend)
npx playwright test

# Specific file
npx playwright test e2e/smoke.spec.ts

# UI debug mode
npx playwright test --ui
```

> - Local runs reuse existing ports (`5174` / `8001`), CI environments start fresh
> - Tests don't require a real DeepSeek API; backend auto-falls back to Mock AI mode
> - Clear error messages on port conflicts, refer to `docs/current-state.md`

## AI Configuration

### Mock AI Mode (Default)

The project uses **Mock AI mode** by default — no API Key needed to demo all features. AI chat returns preset responses (character-by-character streaming effect), and analysis returns simulated structured results. **This mode is suitable for development, demo, and evaluation.**

### Using Real DeepSeek API

To enable real AI capabilities (recommended before production deployment), configure the API Key:

```powershell
# Edit server/.env, fill in your DeepSeek API Key
DEEPSEEK_API_KEY=<your_deepseek_api_key>
```

After restarting the backend, all AI features automatically switch to real model calls:

- AI chat uses DeepSeek v4-Flash model for real-time responses
- Emotion diary analysis uses the real model
- Session summaries are generated by the real model

> ⚠️ **Note**:
>
> - API Key only exists in the backend `.env` file — never written to frontend or committed to repository
> - System auto-falls back to Mock mode when no Key is configured (no errors)
> - If you cloned this repo, please verify whether you have configured your own API Key before use

## Multi-Language Support

The project supports Simplified Chinese, Traditional Chinese, and English interfaces via vue-i18n.

**Scope of translation:** Navigation menus, buttons, labels, tooltips, and other UI framework text are fully translated. User-generated content (article body, emotion diary entries, AI chat messages, etc.) remains in its original language and is not automatically translated.

**Switching:** Use the language dropdown in the admin header or client navbar to switch at any time. Browsers set to `zh-TW`/`zh-HK`/`zh-MO` will automatically load Traditional Chinese.

## Product Safety Statement

### Platform Positioning

**AI Mental Health Management Platform** is a technical tool providing AI-assisted psychological support, designed to help users record emotions, access mental health knowledge, and gain initial emotional awareness.

### AI Capability Boundaries

- The AI assistant (chat feature) generates responses based on a large language model and **does not provide medical diagnosis, prescriptions, or psychological treatment**.
- AI analysis results (emotion analysis, session summaries) are for user reference only and **cannot replace professional mental health services**.
- All AI features on the platform are designed as辅助 tools and **do not possess clinical decision-making capabilities**.

### Emergency Handling

- When users express intentions of self-harm, suicide, or harming others, the AI will prioritize providing crisis hotline information and strongly recommend seeking professional help.
- The platform has built-in crisis keyword detection to ensure priority delivery of help resources in high-risk conversations.
- **If you or someone around you is in immediate danger, please call emergency services (110 in China) or go to the nearest hospital emergency room immediately.**

### Not a Substitute for Professional Medical Care

This platform and its AI features **must not be used for**:

- Replacing professional psychological counseling or therapy
- Diagnosing mental health disorders
- Prescribing medications or treatment plans
- Monitoring or managing severe mental illness

If you need professional mental health services, please contact:

- **National Crisis Hotline: 400-161-9995**
- **Beijing Crisis Intervention Center: 010-82951332**

### Data Privacy Notice

- AI chat content is stored on the server for conversation continuity
- It is recommended not to disclose personally identifiable information (real name, ID number, address, etc.) during conversations
- Please refer to project documentation for detailed privacy policy
