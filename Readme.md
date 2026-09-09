# TokenFactory

TokenFactory 是一个使用 Go 和 React 开发的 AI API 网关，统一接入多个模型供应商，提供渠道管理、模型映射、用户与令牌管理、额度计费、限流和管理后台。

本项目基于 **[QuantumNous/new-api（New API）](https://github.com/QuantumNous/new-api)** 开发，保留其来源、署名与许可声明。原 README 全文保存在 [Readme-upstream.md](./Readme-upstream.md)，该文件是重命名前的仓库说明存档，并非与原始上游实时同步的文档。

## 目录

- [项目结构与环境要求](#项目结构与环境要求)
- [本地开发](#本地开发)
- [Git 提交规范](#git-提交规范)
- [前后端打包](#前后端打包)
- [服务器部署](#服务器部署)
- [部署常见问题](#部署常见问题)
- [来源与许可](#来源与许可)

## 项目结构与环境要求

| 项目 | 说明 |
| --- | --- |
| 后端 | Go，版本以 `go.mod` 为准，当前最低为 **1.26.2**；Gin、GORM |
| 前端 | React 18、Vite、Semi Design；使用 **Bun** 安装依赖和执行脚本 |
| 数据库 | SQLite、MySQL、PostgreSQL；现有生产编排使用 PostgreSQL 15 |
| 缓存 | Redis 与进程内缓存；现有生产编排包含 Redis |
| 构建产物 | 前端静态资源嵌入 Go 二进制，也可以构建为一个 Docker 镜像 |

```text
router/       HTTP 路由
controller/   请求处理
service/      业务逻辑
model/        数据模型与数据库访问
relay/        模型请求转发及供应商适配
middleware/   认证、限流、分发等中间件
setting/      系统配置
common/       通用工具
web/          React 前端
```

代码约定见 [AGENTS.md](./AGENTS.md)，包括 JSON 包封装、三种数据库兼容、国际化和上游请求参·数零值保留等规则。

## 本地开发

首次获取公司仓库，需要能访问公司内网：

```bash
git clone http://192.168.2.144/platform/token-factory.git
cd token-factory
```

先安装前端依赖并生成静态资源。后端使用 `go:embed web/dist`，首次编译前必须有 `web/dist/index.html`：

```bash
cd web
bun install --frozen-lockfile
bun run build
cd ..
```

在项目根目录参考 [.env.example](./.env.example) 准备 `.env`。已有文件时直接编辑，不要用示例覆盖实际配置。后端从**运行工作目录**读取 `.env`；未设置 `SQL_DSN` 时默认使用 SQLite。开发环境也应设置固定的随机 `SESSION_SECRET`。

```bash
# 终端一：项目根目录运行后端，默认端口 3000
go run .

# 终端二：运行前端开发服务器，访问终端打印的地址
cd web
bun run dev
```

前端开发代理默认指向 `http://127.0.0.1:3000`。需要连接其他开发后端时，在 `web/.env.development.local` 中设置 `VITE_DEV_PROXY_TARGET`。开发代理只对 Vite 开发服务器生效。

## Git 提交规范

### 远程仓库与分支

首次开发前执行 `git remote -v` 和 `git branch -vv`，核对仓库地址及跟踪关系。

| 名称 | 仓库地址或跟踪关系 | 用途 |
| --- | --- | --- |
| `origin` | `http://192.168.2.144/platform/token-factory.git` | 公司仓库，日常提交与合并目标 |
| `upstream` | `https://github.com/fyinfor/token-factory.git` | GitHub 同步来源 |
| `origin/main` | 公司仓库的远程 main | 公司主分支 |
| `upstream/main` | GitHub 仓库的远程 main | GitHub 主分支 |
| `main` | 本地分支，跟踪 `origin/main` | 查看、同步公司主分支 |

这里的 `upstream` 是 Git remote 别名；项目原始来源仍是 **QuantumNous/new-api**。若尚未配置此 remote，可执行：

```bash
git remote add upstream https://github.com/fyinfor/token-factory.git
```

已有同名 remote 时先检查地址，不要重复添加。日常开发推送到 `origin`，GitHub 更新通过单独的集成分支同步并评审。

### 切换与创建开发分支

切换前先执行 `git status`，将修改提交到所属分支，或使用 `git stash push -u` 暂存。暂存内容应回到原分支后再恢复。

本地 `main` 已存在时：

```bash
git fetch origin
git switch main
git branch --set-upstream-to=origin/main main
git pull --ff-only origin main
```

如果本地尚无 `main`，在 `git fetch origin` 后执行 `git switch -c main --track origin/main`。

从最新公司主分支创建功能分支，命名使用 `feature/<姓名缩写>-<日期>-<功能>`。以下统一以 `feature/lyj-0909-docs` 为例，实际使用时替换成自己的分支名：

```bash
git switch -c feature/lyj-0909-docs
```

### 提交与推送

每次提交只包含同一目的的修改。提交前检查差异并执行相关验证；前端代码修改通常执行 `cd web && bun run build`，后端执行与修改相关的 Go 测试和构建。纯文档修改检查内容、命令和链接即可。

提交信息使用 `<类型>: <具体说明>`：

| 类型 | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复问题 |
| `docs` | 文档修改 |
| `refactor` | 代码重构 |
| `chore` | 构建、依赖等维护 |

在项目根目录执行，按实际修改选择暂存文件：

```bash
git branch --show-current
git status
git diff
git add Readme.md
git diff --cached
git commit -m "docs: 完善 Git 规范与部署说明"
git push -u origin feature/lyj-0909-docs
```

推送前确认当前分支与命令中的分支一致。建立同名跟踪关系后，后续可直接 `git push`。不要提交 `.env`、访问令牌、数据库文件、日志、上传文件、依赖目录或无关构建产物。

### 合并到公司 main

优先在公司仓库创建合并请求：源分支为自己的功能分支，目标为 `main`，说明修改目的和验证结果，经评审后合并。

公司仓库允许直接推送且修改已完成评审时，也可以在本地合并。先提交工作区修改，再执行：

```bash
git switch main
git pull --ff-only origin main
git merge feature/lyj-0909-docs
git push origin main
```

发生冲突时，解决冲突并完成合并提交后再推送；不要向共享主分支强制推送。

- 分支前缀是 `feature/`
- `Already up to date.` 表示当前分支已包含待合并提交，不代表已推送远程。
- `git push` 只推送提交，未提交的文件修改不会上传。
- 提示跟踪分支名称不一致时，用 `git branch -vv` 检查；公司主分支应为 `main ... [origin/main]`。

### 删除已合并分支

确认分支已经合并、不再需要，并切换到其他分支后执行：

```bash
git switch main
git branch -d feature/lyj-0909-docs
git push origin --delete feature/lyj-0909-docs
git fetch origin --prune
```

本地和远程删除是两个独立操作。本地不存在该分支时跳过 `git branch -d`；若提示未合并，先检查提交，不要直接强制删除。

## 前后端打包

### 构建关系

```text
web/src → bun run build → web/dist
                              ↓ go:embed
Go 源码 ───────────────────→ Go 二进制 → 服务器 / Docker
```

默认是一个服务同时提供页面和 API，生产服务器不需要 Node 或 Bun。**必须先构建前端，再编译后端**；前端改动后也要重新编译 Go 程序并替换部署产物。

### 手动构建 Linux 二进制

以下命令在项目根目录开始执行，需要 Go 和 Bun：

```bash
cd web
bun install --frozen-lockfile
VITE_REACT_APP_VERSION="$(cat ../VERSION)" bun run build
cd ..

mkdir -p dist
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
go build -trimpath \
  -ldflags "-s -w -X github.com/QuantumNous/new-api/common.Version=$(cat VERSION)" \
  -o dist/token-factory .
```

- `amd64` 对应 x86_64 服务器；ARM64 服务器改用 `GOARCH=arm64`，可以在服务器运行 `uname -m` 确认。
- `web/dist` 是前端静态产物，`dist/token-factory` 是包含前端的 Linux 可执行文件。
- 在 macOS 上生成的 Linux 二进制应放到 Linux 服务器执行；不指定 `GOOS` 时默认生成本机平台程序。
- 依赖中包含 `github.com/fyinfor/router-engine`。新环境若遇到仓库认证失败，需要配置有读取权限的 Git 凭据及 `GOPRIVATE=github.com/fyinfor/*`；仅设置 `GOPRIVATE` 不会授予访问权限。

### Docker 镜像构建

[Dockerfile](./Dockerfile) 已包含 Bun 前端构建、Go 编译和运行镜像三个阶段。执行前先处理下方“部署常见问题”中 Dockerfile 的凭据日志、版本注入和构建上下文问题。

```bash
# 项目根目录；版本标签按发布版本替换
docker build --platform linux/amd64 -t token-factory:release-001 .
```

私有依赖需要认证时，先通过安全方式将令牌放入当前终端的 `GITHUB_TOKEN` 环境变量，再使用 BuildKit secret。不要将令牌写入 Dockerfile、构建参数或仓库：

```bash
docker build --platform linux/amd64 \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t token-factory:release-001 .
```

本地构建后，可以推送至服务器可访问的镜像仓库，或导出传输：

```bash
# 构建机器
docker save -o token-factory-release-001.tar token-factory:release-001

# 将 tar 文件传到服务器后，在服务器执行
docker load -i token-factory-release-001.tar
```

## 服务器部署

### 方式一：Docker Compose

生产编排为 [docker-compose.prod.yml](./docker-compose.prod.yml)，包含应用、PostgreSQL 和 Redis。默认应用端口映射是宿主机 `3020` 到容器 `3000`。

1. 将生产 Compose 文件和镜像准备到服务器，在独立部署目录内操作。
2. 参考 [.env.prod.example](./.env.prod.example) 创建该目录的 `.env`，填写真实数据库密码和随机会话密钥；已有 `.env` 时不要覆盖。
3. 将应用的 `image` 改为本次构建的固定标签，例如 `token-factory:release-001`。现有文件指向远程 `latest`，直接启动不会构建当前源码。
4. 将应用 `environment` 中写死的会话密钥替换为下面的变量引用。若同机用 Nginx 反向代理，将应用端口改为 `127.0.0.1:3020:3000`。
5. 移除 Redis 和 PostgreSQL 的宿主机 `ports`，容器间通过内部网络通信即可。需要本机连接数据库时，仅绑定 `127.0.0.1`。

会话密钥配置替换为：

```yaml
- SESSION_SECRET=${SESSION_SECRET:?请在 .env 中设置 SESSION_SECRET}
```

可用 `openssl rand -hex 32` 生成随机密钥并固定保存。`.env` 主要用于 Compose 变量替换；新增运行变量还需要在 `environment` 中引用，或通过合适的 `env_file` 传入容器。

完成配置后执行：

```bash
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 token-factory
curl -fsS http://127.0.0.1:3020/api/status
```

检查接口返回 `success: true`，再通过页面完成初始化，并验证登录、一次模型调用及流式响应。仅容器处于运行状态不代表业务可用。

独立部署保持 `TOKENFACTORY_ROUTE_ENABLED=false`。只有需要接入额外 TokenFactory 路由服务时，才配置相关密钥，并使用 [docker-compose.prod.tokenfactory.yml](./docker-compose.prod.tokenfactory.yml) 叠加网络；该文件依赖预先存在的外部 Docker 网络。

### 方式二：直接运行二进制

将 `dist/token-factory` 上传到服务器，例如 `/opt/token-factory/token-factory`。准备数据库后，在 `/opt/token-factory/.env` 写入实际配置：

```dotenv
PORT=3000
SQL_DSN=postgresql://数据库用户:URL编码后的密码@127.0.0.1:5432/token_factory
REDIS_CONN_STRING=redis://127.0.0.1:6379
SESSION_SECRET=替换为生成后固定保存的随机密钥
TOKENFACTORY_ROUTE_ENABLED=false
```

以上数据库与 Redis 地址是示例，须按实际服务修改。若连接现有生产 Compose 暴露的端口，分别对应 `5434` 和 `6381`，而不是上述默认端口。

```bash
cd /opt/token-factory
chmod +x token-factory
./token-factory --log-dir ./logs
```

正式运行使用 systemd 等进程管理工具，设置 `WorkingDirectory=/opt/token-factory`，并以拥有数据和日志目录写权限的专用用户运行。运行系统需要 CA 证书；使用区域时区时也需提供时区数据。

### 数据保存、升级与回滚

现有生产 Compose 使用以下宿主机目录：

| 目录 | 内容 |
| --- | --- |
| `postgres_data/` | PostgreSQL 数据 |
| `redis_data/` | Redis 持久化数据 |
| `data/` | 应用数据，默认包括上传文件及本地算力页面内容 |
| `logs/` | 应用日志 |

默认容器工作目录为 `/data`，本地上传存入 `/data/uploads`，已由 `./data:/data` 持久化。若在后台更改本地存储路径，确保新路径也有持久化挂载和写权限。

升级前记录旧镜像标签，对 PostgreSQL 使用 `pg_dump` 等一致性备份方式，同时备份应用文件和配置。不要直接复制运行中的数据库目录作为唯一备份。应用启动会执行数据库迁移；回滚前确认旧版本是否兼容升级后的数据库，必要时恢复配套备份。不要删除数据目录来解决一般启动问题。

## 部署常见问题

| 问题 | 原因与处理 |
| --- | --- |
| 构建报 `web/dist` 或 `index.html` 不存在 | 先在 `web/` 执行 `bun run build`，再编译 Go |
| 前端改了但线上未变化 | 前端已嵌入二进制；重新构建前后端，并确认启动的是新镜像或新程序 |
| 构建提示 Go 版本不足 | 以 `go.mod` 为准，当前要求 Go 1.26.2，旧版项目说明中的 1.22 不适用 |
| 私有 Go 依赖下载失败 | 确认网络、Git 读取权限及 `GOPRIVATE`；Docker 使用 BuildKit secret |
| Docker 构建日志泄露令牌 | 当前 Dockerfile 认证步骤包含 `set -eux`，`-x` 会跟踪含 token 的命令；传入真实令牌前，先移除该步骤的命令追踪，例如改为 `set -eu` |
| Docker 构建上下文夹带本地数据 | 当前 `.dockerignore` 未充分排除环境文件、数据及日志；构建前排除 `.env`、`.env.*`、`**/.env*`、`data/`、`logs/`、`postgres_data/`、`redis_data/`、`uploads/`、根目录 `dist/` 等本地产物。确需的前端公开构建配置应单独管理，不能包含密钥 |
| 后端版本号未正确注入 | 当前 Dockerfile 的 `-X` 包路径与 Go module 不一致，应使用 `github.com/QuantumNous/new-api/common.Version`，可参考本文手动构建命令 |
| 修改 `.env` 的密钥或路由开关没有生效 | Compose 中写死的值不会自动读取 `.env`；使用 `${变量名}` 引用。`SMART_ROUTER_ENABLED` 当前也未由生产 Compose 显式传入 |
| 改会话密钥后登录或加密数据异常 | 密钥需要固定保存；未设置 `CRYPTO_SECRET` 时它使用 `SESSION_SECRET`，已有部署更换密钥前须评估数据影响 |
| 数据库密码含特殊字符导致连接失败 | PostgreSQL URI 中的密码需要 URL 编码，例如 `@` 写为 `%40`；在 `.env` 显式设置完整 `SQL_DSN` |
| Redis 暴露到外部网络 | 当前 Redis 无密码且映射宿主机端口，生产应移除映射或限制为本机访问 |
| 首次启动连接数据库失败 | 当前 `depends_on` 只约束启动顺序，不保证数据库就绪；检查数据库日志与健康状态，必要时增加健康检查和就绪依赖 |
| 页面请求开发机地址 | 检查构建时的 `VITE_REACT_APP_SERVER_URL`；默认同域部署保持为空。运行容器时再改变量不会重写已构建的 JS |
| 流式回答最后才一起显示或中途断开 | 反向代理关闭 `proxy_buffering`，设置适合长请求的读取超时，使用 WebSocket 时配置升级转发 |
| 上传失败或上游无法读取上传地址 | 检查代理与应用的上传大小限制、目录权限、后台对外 URL 和 HTTPS 配置；上游模型服务必须能访问提供给它的文件地址 |
| 视频时长解析不完整 | 默认镜像未安装或嵌入 `ffprobe`，会使用备用解析逻辑；相关功能按需安装并验证，见 [ffprobe 说明](./service/ffprobe-bin/README.md) |
| 前端构建通过但有警告 | 当前验证出现 CSS 压缩语法警告及较大 JS chunk；上线前检查页面样式和加载速度，构建成功不等同于页面验证通过 |

反向代理相关参数见 [Nginx 官方文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)，环境变量行为见 [Docker Compose 官方文档](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/)。对外部署使用 HTTPS，并在后台配置正确的站点地址及相关回调地址。

这些条目描述当前仓库配置及需要进行的部署调整，**不表示 Dockerfile 或 Compose 已按本文自动修复**。本次文档整理前已验证前端生产构建和 Linux/amd64 Go 编译；尚未完成 Docker 构建与服务器业务验收。

## 来源与许可

TokenFactory 基于 **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)**（New API）开发，New API 由 **QuantumNous** 和贡献者维护；项目历史包含 [One API](https://github.com/songquanpeng/one-api)（MIT License）。原有完整说明、署名、免责声明和生态链接保存在 [Readme-upstream.md](./Readme-upstream.md)。

本项目使用 **GNU AGPL v3.0**，请保留并遵守 [LICENSE](./LICENSE)、[NOTICE](./NOTICE) 和原项目许可声明。通过网络向他人提供修改后的版本时，相关源码提供义务见 AGPL-3.0 第 13 条及原说明。商业许可联系：[support@quantumnous.com](mailto:support@quantumnous.com)。

上游功能与接口文档：[New API 文档](https://docs.newapi.pro)。当前分支的实际行为以源码、配置和部署验证为准。
