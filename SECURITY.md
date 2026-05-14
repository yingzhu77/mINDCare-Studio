# Security Policy

## Supported Versions

Security fixes are provided for the current `main` branch and the latest published release.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Older releases | Best effort |

## Reporting a Vulnerability

Please do not disclose security vulnerabilities publicly before maintainers have had a chance to investigate.

Report suspected vulnerabilities by opening a private security advisory on GitHub, or by contacting the maintainer through a private channel if security advisories are unavailable.

Include as much detail as possible:

- Affected version or commit.
- Steps to reproduce.
- Impact and severity.
- Any proof of concept, logs, or screenshots.
- Suggested mitigation, if known.

## Response Expectations

- Initial acknowledgement: best effort within 7 days.
- Triage and severity assessment: best effort within 14 days.
- Fix timeline depends on severity, reproducibility, and project capacity.

## Sensitive Data Rules

- Never commit real API keys, database passwords, JWT secrets, or production `.env` files.
- `DEEPSEEK_API_KEY` is optional. When absent, the backend should fall back to Mock AI mode.
- Windows EXE user API keys must remain local to `%APPDATA%/ai-mental-health/config.json`.
- Demo SQLite data is for local demonstration only and must not be treated as production storage.

## 中文说明

如发现安全问题，请不要先公开披露。请通过 GitHub 私有安全通道或维护者私下渠道报告，并提供复现步骤、影响范围和相关证据。

请勿提交真实 API Key、数据库密码、JWT 密钥或生产环境 `.env` 配置。
