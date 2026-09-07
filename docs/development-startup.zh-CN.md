# 前后端本地启动指南

本文说明如何在本地分别启动 TokenFactory 前端和后端，适用于日常开发与联调。

## 环境要求

- Go 1.26.2 或与 `go.mod` 声明兼容的版本
- Bun（前端首选包管理器）
- Git

确认工具可用：

```powershell
go version
bun --version
```

## 第一次启动

Go 后端通过 `embed` 打包 `web/dist`。全新检出项目后，需要先安装前端依赖并生成一次静态资源：

```powershell
cd D:\Project\token-factory\web
bun install
bun run build
```

然后回到项目根目录启动后端：

```powershell
cd D:\Project\token-factory
go run .
```

默认使用 SQLite，数据库文件为项目根目录下的 `one-api.db`。后端默认地址：

- 页面：<http://127.0.0.1:3000>
- 健康检查：<http://127.0.0.1:3000/api/status>

## 日常前后端联调

使用两个终端分别运行后端和前端。

### 终端 1：启动后端

```powershell
$toolRoot = "$env:TEMP\token-factory-toolchain"

$env:Path = "$toolRoot\go-sdk\go\bin;$env:Path"
$env:GOPATH = "$toolRoot\gopath"
$env:GOMODCACHE = "$toolRoot\gomodcache"
$env:GOCACHE = "$toolRoot\gocache"
$env:GOPROXY = "https://goproxy.cn,direct"

go version
go run .
```

后端默认监听 `3000` 端口。需要修改端口时：

```powershell
$env:PORT = '3001'
go run .
```

如需把 SQLite 数据库放到指定位置：

```powershell
$env:SQLITE_PATH = 'D:\Project\token-factory\data\one-api.db?_busy_timeout=30000'
go run .
```

### 终端 2：启动前端

```powershell
cd D:\Project\token-factory\web
$env:Path = "$env:TEMP\token-factory-toolchain\bun-sdk\bun-windows-x64;$env:Path"
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

```powershell
cd D:\Project\token-factory\web
bun run build

cd D:\Project\token-factory
go run .
```


访问 <http://127.0.0.1:3000>。此时页面静态资源和 API 都由 Go 服务提供，不需要运行 Vite。

每当前端代码发生变化，都需要重新执行 `bun run build`，然后重启后端，新的页面资源才会生效。

## 停止服务

在对应终端按 `Ctrl+C`，即可停止前端或后端进程。

## 常见问题

### 后端提示找不到 `web/dist`

先构建前端：

```powershell
cd D:\Project\token-factory\web
bun install
bun run build
```

### 前端页面能打开，但 API 请求失败

确认后端正在监听 `3000` 端口，并访问健康检查地址：

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/status
```

如果后端端口不是 `3000`，同步修改 `web/.env.development.local` 中的 `VITE_DEV_PROXY_TARGET`。

### 端口已被占用

查看占用进程：

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
Get-NetTCPConnection -LocalPort 5173 -State Listen
```

可以停止占用端口的旧进程，或者为后端设置其他 `PORT`。Vite 端口可通过下面的命令临时修改：

```powershell
bun run dev -- --port 5174
```
