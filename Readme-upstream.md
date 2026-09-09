<div align="center">

![token-factory](/web/public/logo.png)

# TokenFactory

**AI gateway you self-host:** route many model providers through one API surface, with users, keys, quotas, and an admin UI.

---

### Upstream (required reading)

**TokenFactory is derived from the [QuantumNous/new-api](https://github.com/QuantumNous/new-api) project (“New API”).** That repository is the authoritative upstream for design, protocol coverage, and community history. This fork may diverge; for behavior and APIs, treat upstream docs as the baseline and verify against your build.

| | |
| --- | --- |
| **Upstream repository** | **[github.com/QuantumNous/new-api](https://github.com/QuantumNous/new-api)** |
| **License** | [GNU AGPL v3.0](./LICENSE) — same for modifications here; see [`NOTICE`](./NOTICE) |
| **Network use** | If you offer a modified version over a network to others, **AGPL-3.0 section 13** requires you to provide the corresponding full source under the same license. |

---

<p align="center">
  <a href="./README.zh_CN.md">简体中文</a> |
  <a href="./README.zh_TW.md">繁體中文</a> |
  <strong>English</strong> |
  <a href="./README.fr.md">Français</a> |
  <a href="./README.ja.md">日本語</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--v3-blue.svg" alt="AGPL-3.0"></a>
  &nbsp;
  <a href="https://github.com/QuantumNous/new-api"><img src="https://img.shields.io/badge/Upstream-QuantumNous%2Fnew--api-555555?logo=github" alt="Upstream: QuantumNous/new-api"></a>
  &nbsp;
  <a href="https://github.com/QuantumNous/token-factory"><img src="https://img.shields.io/badge/This_repo-TokenFactory-2ea043?logo=github" alt="This repository"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#supported-languages">Languages</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#license">License</a> •
  <a href="#help">Help</a>
</p>

</div>

## About this repository

TokenFactory is a **self-hosted control plane** for aggregating upstream AI vendors: one place to configure channels, map models, enforce access, and observe usage. You run the binary (or container), point clients at it, and manage everything from the web console.

This README describes **this fork’s** packaging and pointers. It does not replace the upstream feature list or legal notices—those remain tied to [QuantumNous/new-api](https://github.com/QuantumNous/new-api) and the license files in this tree.

## Compliance & disclaimer

- Use only in line with provider terms (e.g. OpenAI [Terms of Use](https://openai.com/policies/terms-of-use)) and **applicable law**. No illegal or abusive use.
- In China, follow registration and compliance rules for generative AI services (e.g. [《生成式人工智能服务管理暂行办法》](http://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm)); do not offer unregistered public generative AI services where prohibited.
- No warranty: treat this as **self-supported** infrastructure unless you arrange your own support.

---

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the project
git clone https://github.com/QuantumNous/token-factory.git
cd token-factory

# Edit docker-compose.yml configuration
nano docker-compose.yml

# Start the service
docker-compose up -d
```

<details>
<summary><strong>Using Docker Commands</strong></summary>

```bash
# Pull the latest image
docker pull ghcr.io/fyinfor/token-factory:latest

# Using SQLite (default)
docker run --name token-factory -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  ghcr.io/fyinfor/token-factory:latest

# Using MySQL
docker run --name token-factory -d --restart always \
  -p 3000:3000 \
  -e SQL_DSN="root:123456@tcp(localhost:3306)/oneapi" \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  ghcr.io/fyinfor/token-factory:latest
```

> **💡 Tip:** `-v ./data:/data` will save data in the `data` folder of the current directory, you can also change it to an absolute path like `-v /your/custom/path:/data`

</details>

---

When the stack is healthy, open **`http://localhost:3000`**. More install paths (bare metal, panels, etc.): **[installation docs](https://docs.newapi.pro/en/docs/installation)**.

---

## Documentation

The **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)** ecosystem publishes the reference manuals for APIs, models, and operations. TokenFactory tracks that stack; use the docs as the source of truth and validate against your build.

| | |
| --- | --- |
| Manual (EN / ZH) | [docs.newapi.pro — English](https://docs.newapi.pro/en/docs) · [简体中文](https://docs.newapi.pro/zh/docs) |
| Environment variables | [Configuration reference](https://docs.newapi.pro/en/docs/installation/config-maintenance/environment-variables) |
| Relay / REST API | [API documentation](https://docs.newapi.pro/en/docs/api) |
| Feature overview | [Features introduction](https://docs.newapi.pro/en/docs/guide/wiki/basic-concepts/features-introduction) |
| FAQ & community | [FAQ](https://docs.newapi.pro/en/docs/support/faq) · [Channels](https://docs.newapi.pro/en/docs/support/community-interaction) |
| Deep dive (third-party) | [DeepWiki — QuantumNous/new-api](https://deepwiki.com/QuantumNous/new-api) |

**This repository:** report **fork-specific** bugs (packaging, defaults, CI) here. If the behavior matches upstream, reproduce on **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)** and follow their contribution guidelines.

---

## What you get (at a glance)

Capabilities come from the upstream codebase; this is a **summary**, not an exhaustive spec:

- **Relay** — many vendor adapters behind a unified API surface (OpenAI-compatible and other formats per upstream).
- **Console** — channels, model mapping, users, keys, usage and billing configuration.
- **Policies** — quotas, rate limits, retries, and optional cache when Redis is enabled.
- **Storage** — SQLite, MySQL, or PostgreSQL; optional Redis for sessions/cache/crypto as documented upstream.

For model-by-model and endpoint-by-endpoint detail, use the **[API docs](https://docs.newapi.pro/en/docs/api)** and **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)** releases.

---

## Supported languages

| Code | Language |
|------|----------|
| `zh-CN` | Chinese (Simplified) |
| `zh-TW` | Chinese (Traditional) |
| `en` | English |
| `fr` | French |
| `ru` | Russian |
| `ja` | Japanese |
| `vi` | Vietnamese |
| `id` | Indonesian |
| `ms` | Malay |
| `th` | Thai |
| `sw` | Swahili |

---

## Deployment

> [!TIP]
> **Latest Docker image:** `ghcr.io/fyinfor/token-factory:latest`

### 📋 Deployment Requirements

| Component | Requirement |
|------|------|
| **Local database** | SQLite (Docker must mount `/data` directory)|
| **Remote database** | MySQL ≥ 5.7.8 or PostgreSQL ≥ 9.6 |
| **Container engine** | Docker / Docker Compose |

### ⚙️ Environment Variable Configuration

<details>
<summary>Common environment variable configuration</summary>

| Variable Name | Description | Default Value |
|--------|------|--------|
| `SESSION_SECRET` | Session secret (required for multi-machine deployment) | - |
| `CRYPTO_SECRET` | Encryption secret (required for Redis) | - |
| `SQL_DSN` | Database connection string | - |
| `REDIS_CONN_STRING` | Redis connection string | - |
| `STREAMING_TIMEOUT` | Streaming timeout (seconds) | `300` |
| `STREAM_SCANNER_MAX_BUFFER_MB` | Max per-line buffer (MB) for the stream scanner; increase when upstream sends huge image/base64 payloads | `64` |
| `MAX_REQUEST_BODY_MB` | Max request body size (MB, counted **after decompression**; prevents huge requests/zip bombs from exhausting memory). Exceeding it returns `413` | `32` |
| `AZURE_DEFAULT_API_VERSION` | Azure API version | `2025-04-01-preview` |
| `ERROR_LOG_ENABLED` | Error log switch | `false` |
| `PYROSCOPE_URL` | Pyroscope server address | - |
| `PYROSCOPE_APP_NAME` | Pyroscope application name | `token-factory` |
| `PYROSCOPE_BASIC_AUTH_USER` | Pyroscope basic auth user | - |
| `PYROSCOPE_BASIC_AUTH_PASSWORD` | Pyroscope basic auth password | - |
| `PYROSCOPE_MUTEX_RATE` | Pyroscope mutex sampling rate | `5` |
| `PYROSCOPE_BLOCK_RATE` | Pyroscope block sampling rate | `5` |
| `HOSTNAME` | Hostname tag for Pyroscope | `token-factory` |

📖 **Complete configuration:** [Environment Variables Documentation](https://docs.newapi.pro/en/docs/installation/config-maintenance/environment-variables)

</details>

### 🔧 Deployment Methods

**Docker Compose:** use the [Quick Start](#quick-start) commands above (clone → edit `docker-compose.yml` → `docker-compose up -d`).

<details>
<summary><strong>Alternative: plain Docker run</strong></summary>

**Using SQLite:**
```bash
docker run --name token-factory -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  ghcr.io/fyinfor/token-factory:latest
```

**Using MySQL:**
```bash
docker run --name token-factory -d --restart always \
  -p 3000:3000 \
  -e SQL_DSN="root:123456@tcp(localhost:3306)/oneapi" \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  ghcr.io/fyinfor/token-factory:latest
```

> **💡 Path explanation:**
> - `./data:/data` - Relative path, data saved in the data folder of the current directory
> - You can also use absolute path, e.g.: `/your/custom/path:/data`

</details>

<details>
<summary><strong>BaoTa Panel</strong></summary>

1. Install BaoTa Panel (≥ 9.2.0 version)
2. Search for **TokenFactory** in the application store
3. One-click installation

📖 [Tutorial with images](./docs/BT.md)

</details>

### ⚠️ Multi-machine Deployment Considerations

> [!WARNING]
> - **Must set** `SESSION_SECRET` - Otherwise login status inconsistent
> - **Shared Redis must set** `CRYPTO_SECRET` - Otherwise data cannot be decrypted

### 🔄 Channel Retry and Cache

**Retry configuration:** `Settings → Operation Settings → General Settings → Failure Retry Count`

**Cache configuration:**
- `REDIS_CONN_STRING`: Redis cache (recommended)
- `MEMORY_CACHE_ENABLED`: Memory cache

---

## Lineage

| Repository | Role |
| --- | --- |
| **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)** | **Upstream** — New API (AGPL-3.0). **Start here** for history, issues that are not fork-specific, and feature design. |
| [One API](https://github.com/songquanpeng/one-api) | Earlier MIT-licensed codebase in the same family tree. |
| [Midjourney-Proxy](https://github.com/novicezk/midjourney-proxy) | Optional Midjourney integration (see upstream docs). |

Tools maintained around the ecosystem (e.g. [neko-api-key-tool](https://github.com/Calcium-Ion/neko-api-key-tool)) are documented upstream.

---

## Help

### 📖 Documentation Resources

| Resource | Link |
|------|------|
| 📘 FAQ | [FAQ](https://docs.newapi.pro/en/docs/support/faq) |
| 💬 Community Interaction | [Communication Channels](https://docs.newapi.pro/en/docs/support/community-interaction) |
| 🐛 Issue Feedback | [Issue Feedback](https://docs.newapi.pro/en/docs/support/feedback-issues) |
| 📚 Complete Documentation | [Official Documentation](https://docs.newapi.pro/en/docs) |

### 🤝 Contribution Guide

Welcome all forms of contribution!

- 🐛 Report Bugs
- 💡 Propose New Features
- 📝 Improve Documentation
- 🔧 Submit Code

---

## 项目 Git 提交规范

### 远程仓库与分支

本项目开发环境约定使用以下远程名称；首次开发前执行 `git remote -v` 核对地址。

| 名称 | 仓库地址或跟踪关系 | 用途 |
| --- | --- | --- |
| `origin` | `http://192.168.2.144/platform/token-factory.git` | 公司仓库，日常提交与合并目标 |
| `upstream` | `https://github.com/fyinfor/token-factory.git` | GitHub 同步来源 |
| `origin/main` | 公司仓库的远程 main | 公司主分支 |
| `upstream/main` | GitHub 仓库的远程 main | GitHub 主分支 |
| `main` | 本地分支，跟踪 `origin/main` | 在本地查看、同步公司主分支 |

这里的 `upstream` 是 Git remote 别名；项目原始来源及归属仍以本文的 Upstream、Lineage 和 License 说明为准。

本项目约定本地 `main` 跟踪公司 `origin/main`，使用 `git branch -vv` 核对跟踪关系；GitHub 主分支使用 `upstream/main` 区分。日常开发推送到 `origin`；本地与远程分支同名且跟踪关系正确时，可直接使用 `git push`。

### 切换与创建开发分支

切换前先执行 `git status`，将当前修改提交到所属开发分支，或使用 `git stash push -u` 暂存，避免把未完成的修改带到其他分支。暂存的修改应回到原开发分支后再恢复。

首次创建本地公司主分支：

```bash
git fetch origin
git switch -c main --track origin/main
```

如果本地 `main` 已存在，切换、确认跟踪公司仓库并同步：

```bash
git fetch origin
git switch main
git branch --set-upstream-to=origin/main main
git pull --ff-only origin main
```

从最新公司主分支创建功能分支，命名采用 `feature/<姓名缩写>-<日期>-<功能>`，例如：

```bash
git switch -c feature/lyj-0909-route-policy
```

现有开发分支可直接切换，例如 `git switch feature/lyj-0907-init`。日常修改在功能分支完成，通过公司仓库的合并请求进入 `main`。

### 提交与推送

每次提交只包含同一目的的修改。提交前检查差异，运行与修改相关的检查；前端使用 Bun，例如 `cd web && bun run build`。不要提交密钥、本地环境配置或无关生成文件。

提交信息采用 `<类型>: <具体说明>`，常用类型为 `feat`（功能）、`fix`（修复）、`docs`（文档）、`refactor`（重构）、`chore`（维护）。说明应描述实际修改，避免只写 `update` 或 `init`。

以下以提交本 README 到 `feature/lyj-0907-init` 为例，在项目根目录执行，并按实际修改选择暂存文件：

```bash
git branch --show-current
git status
git diff
git add README.md
git diff --cached
git commit -m "docs: 补充公司仓库 Git 提交规范"
git push -u origin feature/lyj-0907-init
```

执行示例前确认当前分支为 `feature/lyj-0907-init`；使用其他功能分支时替换推送命令中的分支名。后续推送可使用 `git push origin feature/lyj-0907-init`。

在公司仓库创建合并请求：源分支选择自己的功能分支，目标选择 `main`。说明修改目的和验证结果，经评审后合并。不要向共享主分支强制推送；需要同步 GitHub 更新时，单独在集成分支处理并评审。

### 本地合并到公司 main

公司仓库允许直接推送且修改已完成评审时，也可在本地合并后推送。先提交工作区修改，再执行：

```bash
git switch main
git pull --ff-only origin main
git merge feature/lyj-0907-init
git push origin main
```

本地 `main` 已跟踪 `origin/main` 时，最后一条也可写为 `git push`。如果合并发生冲突，解决冲突并完成合并提交后再推送。

- 分支名前缀为 `feature/`，不要写成 `featrure/`；可用 `git branch --list` 核对名称。
- `Already up to date.` 表示当前分支已包含待合并分支的所有提交，不代表这些提交已推送。
- `git push` 只推送提交；README 等文件的未提交修改须先 `git add`、`git commit`。
- 如果提示本地与跟踪分支名称不一致，使用 `git branch -vv` 检查。本项目公司主分支应显示为 `main ... [origin/main]`。

## License

This project (**TokenFactory**) is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](./LICENSE). Modifications and further derivatives remain under **AGPL-3.0** unless you obtain a separate commercial license from the copyright holders.

**Attribution:** TokenFactory is derived from [QuantumNous/new-api](https://github.com/QuantumNous/new-api) (New API), which is also under AGPL-3.0. The project chain includes [One API](https://github.com/songquanpeng/one-api) (MIT License) as an earlier base. Please retain upstream notices and this repository’s [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE). Under **AGPL-3.0 section 13**, if you run a modified version as a network service for others, you must offer them the corresponding complete source code under the same license.

If your organization's policies do not permit the use of AGPLv3-licensed software, or if you wish to avoid the open-source obligations of AGPLv3, please contact us at: [support@quantumnous.com](mailto:support@quantumnous.com)

---

<div align="center">

**TokenFactory** — self-hosted AI gateway (this fork).

**Upstream:** **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)** · **Docs:** [docs.newapi.pro](https://docs.newapi.pro/en/docs) · **This repo:** [issues](https://github.com/QuantumNous/token-factory/issues)

<sub>The New API project is developed by **QuantumNous** and contributors. JetBrains supports open-source development through free IDE licenses.</sub>

</div>
