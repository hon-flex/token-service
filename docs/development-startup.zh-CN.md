# 前后端本地启动指南

本文说明如何在本地分别启动 TokenFactory 前端和后端，适用于 macOS Terminal（zsh）下的日常开发与联调。本文使用当前项目路径 `/Users/yajie/Project/token-factory`。

## 环境要求

- Go 1.26.2 或与 `go.mod` 声明兼容的版本
- Bun（前端首选包管理器）
- Git

确认工具可用：

```sh
go version
bun --version
```

工具需要安装并加入 PATH；Windows 临时目录中的工具不能直接在 Mac 使用。安装后重新打开终端，确保上述版本命令成功。Go 版本以项目的 `go.mod` 为准。

## 安装和管理依赖

已有项目依赖安装：

```sh
cd /Users/yajie/Project/token-factory
go mod download 
GOPROXY=https://goproxy.cn,direct go mod download -x # 国内代理
cd web
bun install --frozen-lockfile
```

首次检出、依赖清单变化或依赖目录被清理时执行，不必每天重新安装。若锁文件与清单不匹配，先确认是否完整拉取了两者。

前端添加和删除包，在 `web` 目录执行（将“包名”和“版本号”替换为实际值）：

```sh
bun add 包名
bun add -d 包名
bun add 包名@版本号
bun remove 包名
```

`bun add` 添加运行时依赖；`-d` 用于构建、检查等开发工具。指定版本可以用于有针对性的更新。一起提交变更的 `web/package.json` 和 `web/bun.lock`；使用 Bun 维护依赖，避免混用 npm 产生另一套锁文件。

后端添加或更新依赖，在根目录执行：

```sh
cd /Users/yajie/Project/token-factory
go get 模块路径@版本号
go mod tidy
```

删除依赖时先删除相关导入和使用，再运行 `go mod tidy`。一起提交变化的 `go.mod` 和 `go.sum`。仅安装已有依赖使用 `go mod download`。

## 固定数据库路径

SQLite 不需要单独启动，也不需要 Docker。后端直接读写数据库文件。

在根目录 `.env` 中配置实际数据库路径；已有其他配置时保留它们：

```dotenv
SQLITE_PATH=/Users/yajie/Project/token-factory/data/one-api.db?_busy_timeout=30000
```

此前 Windows 的账号位于 `D:/Project/token-factory/data/one-api.db`。要在 Mac 延续原账号，需要将原数据库正确迁移到上述位置；仅修改路径不会自动搬运数据。复制 SQLite 数据库前应停止使用它的服务，或采用 SQLite 备份工具，避免漏掉未合并的 WAL 数据。

项目已忽略 `.env` 和数据库文件，它们不会随 Git 拉取而自动同步。不要提交这些文件。缺少配置时会默认使用工作目录中的 `one-api.db`，可能造成重新初始化的假象。

后端从当前工作目录加载 `.env`，请在根目录启动。终端已有的环境变量优先；如果之前设置了错误的路径，可先执行 `unset SQLITE_PATH`，再重启后端。

## 第一次启动

Go 后端通过 `embed` 打包 `web/dist`。全新检出项目后，需要先安装前端依赖并生成一次静态资源：

```sh
cd /Users/yajie/Project/token-factory/web
bun install --frozen-lockfile
bun run build
```

然后回到项目根目录启动后端：

```sh
cd /Users/yajie/Project/token-factory
go run .
```

默认使用 SQLite，数据库文件为项目根目录下的 `one-api.db`。后端默认地址：

- 页面：<http://127.0.0.1:3000>
- 健康检查：<http://127.0.0.1:3000/api/status>

## 日常前后端联调

使用两个终端分别运行后端和前端。

### 终端 1：启动后端

```sh
cd /Users/yajie/Project/token-factory

go version
go run .
```

后端默认监听 `3000` 端口。需要修改端口时：

```sh
PORT=3001 go run .
```

如需把 SQLite 数据库放到指定位置：

```sh
SQLITE_PATH='/Users/yajie/Project/token-factory/data/one-api.db?_busy_timeout=30000' go run .
```

### 终端 2：启动前端

```sh
cd /Users/yajie/Project/token-factory/web

bun run dev
```

Vite 默认地址为 <http://127.0.0.1:5173>。开发服务器会把以下请求代理到 `http://127.0.0.1:3000`：

- `/api`
- `/mj`
- `/pg`

如果后端使用了其他地址或端口，在 `web/.env.development.local` 中配置：

```dotenv
VITE_DEV_PROXY_TARGET=http://127.0.0.1:3001
```

修改该文件后需要重启前端开发服务器。

## 仅运行一体化版本

不需要前端热更新时，先构建前端，再启动 Go 后端：

```sh
cd /Users/yajie/Project/token-factory/web
bun run build

cd /Users/yajie/Project/token-factory
go run .
```


访问 <http://127.0.0.1:3000>。此时页面静态资源和 API 都由 Go 服务提供，不需要运行 Vite。

每当前端代码发生变化，都需要重新执行 `bun run build`，然后重启后端，新的页面资源才会生效。

## 停止服务

在对应终端按 `Ctrl+C`，即可停止前端或后端进程。

## 常见问题

### 后端提示找不到 `web/dist`

先构建前端：

```sh
cd /Users/yajie/Project/token-factory/web
bun install
bun run build
```

### 前端页面能打开，但 API 请求失败

确认后端正在监听 `3000` 端口，并访问健康检查地址：

```sh
curl -fsS http://127.0.0.1:3000/api/status
```

如果后端端口不是 `3000`，同步修改 `web/.env.development.local` 中的 `VITE_DEV_PROXY_TARGET`。

### 端口已被占用

查看占用进程：

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

可以停止占用端口的旧进程，或者为后端设置其他 `PORT`。Vite 端口可通过下面的命令临时修改：

```sh
bun run dev --port 5174
```

## 检查和提交代码

以下命令在项目根目录执行。提交前先检查分支与工作区：

```sh
cd /Users/yajie/Project/token-factory
git status
git branch --show-current
git remote -v
```

工作区干净且当前分支已关联远程时，可用 `git pull --ff-only` 同步。有未提交修改时先妥善保存；遇到分支分叉时按团队流程处理，不要直接覆盖。

需要新建任务分支时，例如本次文档修改：

```sh
git switch -c codex/update-startup-docs
```

已经在合适的开发分支则无需重复创建。

### 验证改动

```sh
git diff
git diff --check
```

修改前端时执行 `cd web && bun run build`，并在开发页面验证相关功能。修改 Go 时对实际修改的文件运行 `gofmt -w 文件路径`，在根目录运行 `go build ./...` 和受影响包的测试（例如 `go test ./service`）。跨模块变更按需运行 `go test ./...`。Go 构建仍需先准备 `web/dist`。

仅修改本 Markdown 文档时，校对命令、内容与格式即可，无需重建项目。

### 本地提交

只暂存本次任务相关文件。例如提交本指南：

```sh
git add docs/development-startup.zh-CN.md
git diff --cached --stat
git diff --cached
git commit -m "docs: 补充安装、启动和提交指南"
```

依赖变更时另行暂存对应清单和锁文件。检查暂存内容，避免把其他未完成任务一起提交。`.env`、数据库、账号密钥、`node_modules`、`web/dist`、日志和临时工具链不应提交。

```sh
git check-ignore -v .env data/one-api.db
git status --short
```

### 推送到远程

`git commit` 只保存在本地；确认远程仓库和当前分支正确后，首次推送新分支：

```sh
git push -u origin HEAD
```

之后同一分支可使用 `git push`。按团队流程创建 Pull Request 并完成评审。认证失败时配置自己的 Git 凭据；推送被拒绝时先查看原因，不要直接强制推送。
