# 开源上线准备核对

日期：2026-05-14

最后验证日期：2026-05-14

## 当前结论

项目已经具备开源发布的主体条件：README、LICENSE、CONTRIBUTING、CI、Docker 部署文档、Windows EXE 打包线均已存在。

项目进度、当前风险和后续路线图详见 `docs/project-progress.zh-CN.md`。

本轮补齐了 Phase C1 的基础流程文件：

- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.editorconfig`
- `package.json` / `server/package.json` / `desktop/package.json` 的版本与 license 元数据

## 本轮（2026-05-14）验证结果

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| `.env` / `server/.env` Git 跟踪 | ✅ 通过 | 均被 `.gitignore` 排除，未被跟踪 |
| `server/.env.production` 密钥审查 | ✅ 通过 | 仅含占位值（`your-password`、`change-this-to-a-random-secret`），无真实密钥 |
| 源代码 API Key 扫描 | ✅ 通过 | 未发现 `sk-` 前缀密钥硬编码 |
| Git 历史敏感信息泄露 | ✅ 通过 | 历史中仅提交过 `.env.example` 和 `.env.production`（模板），无真实密钥 |
| `.gitignore` 覆盖范围 | ✅ 通过 | `dist/`、`node_modules/`、`.env`、`server/uploads/*`、`desktop/dist-electron*/` 等均已覆盖 |
| `desktop/data/demo.db` 数据审查 | ✅ 通过 | 仅含 2 个演示用户、3 条模拟日记、6 条模拟聊天、7 篇示例文章，无真实用户数据 |
| 桌面端 API Key 处理机制 | ✅ 通过 | `main.js:164` 从运行时配置文件读取 Key，不硬编码 |
| 前端构建 | ✅ 通过 | `npm run build` 成功（2.11s），仅有 `useAuthStore` 动态导入警告（不影响功能） |
| 后端构建 | ✅ 通过 | `cd server && npm run build` 成功（nest build） |

## 已符合项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| README | 已有 | 已覆盖开发、Docker、Windows EXE 三种运行方式 |
| LICENSE | 已有 | MIT |
| CONTRIBUTING | 已有 | 已有贡献流程说明 |
| CHANGELOG | 已有 | 已有版本变更记录 |
| CI | 已有 | 前端构建/测试，后端构建/单测/Prisma validate |
| Docker 部署文档 | 已有 | `docs/deployment.md` |
| 部署计划 | 已有 | `docs/deployment-plan.md` 已扩展到开源流程 C1~C3 |
| 安全报告流程 | 已补齐 | `SECURITY.md` |
| 行为准则 | 已补齐 | `CODE_OF_CONDUCT.md` |
| Issue/PR 模板 | 已补齐 | `.github` 模板已新增 |
| 编辑器规范 | 已补齐 | `.editorconfig` |

## 发布前必须复查

- 确认 `.env`、`server/.env` 没有被 Git 跟踪。
- 确认 `server/.env.production` 不包含真实生产密码或真实 API Key；它只能作为模板或默认示例。
- 确认打包产物、`dist/`、`node_modules/`、`server/uploads/`、`desktop/dist-electron*` 不进入仓库。
- 确认 `desktop/data/demo.db` 只包含演示数据，不包含真实用户数据。
- 确认 Windows EXE 包内无真实 API Key，用户 Key 只保存到 `%APPDATA%/ai-mental-health/config.json`。
- 重新执行前端构建后再打包 Electron，避免打进旧 `dist`。

## 建议的开源发布顺序

1. 敏感信息审查：
   - `git ls-files .env server/.env`
   - 搜索真实 API Key、数据库密码、JWT secret。
2. 质量门禁：
   - `npm run build`（✅ 已验证通过）
   - `npm run test`
   - `npm run build --prefix server`（✅ 已验证通过）
   - `npm run test:unit --prefix server`
3. Docker 验收：
   - `docker compose config`
   - `docker compose up --build -d`
   - `docker compose ps`
4. Windows EXE 验收：
   - 先 `npm run build`
   - 再 `npm run build --prefix server`
   - 最后 `cd desktop && npm run dist`
5. GitHub 仓库设置：
   - 启用 Issues。
   - 启用 Security advisories。
   - 添加 topics：`vue`、`nestjs`、`electron`、`mental-health`、`docker`。
   - 配置 branch protection，要求 CI 通过后才能合并。

## 后续建议

| 优先级 | 建议 | 价值 |
| --- | --- | --- |
| 高 | 增加 Release workflow | tag 后自动生成 release notes 和上传 EXE |
| 高 | CI 加入 Playwright E2E | 防止登录、聊天、日记、文章流程回归 |
| 中 | 增加 Dependabot | 及时发现依赖安全更新 |
| 中 | 明确 Docker 镜像发布策略 | 后续可发布到 GHCR |
| 中 | 补充 `docs/desktop-release.md` | 独立记录 EXE 打包、签名、分发、人工验收 |
| 中 | 清理本地旧打包产物 | `desktop/` 下残留多个 `dist-electron-*` 目录，虽未被 Git 跟踪但占用磁盘 |
| 低 | Commitlint + Husky | 规范提交历史，但会增加贡献门槛 |

## 当前风险

- `server/.env.production` 已被 Git 跟踪，发布前必须确认其中没有真实密钥。
- 根目录存在本地 `.env`，当前未被 Git 跟踪，但发布前仍建议执行敏感信息扫描。
- 目前 CI 的 lint 命令使用 `--if-present`，如果未配置 lint，不会真正拦截风格或静态问题。
- 干净 Windows 10/11 的 EXE 人工验收仍应作为发布 checklist 的一项。
