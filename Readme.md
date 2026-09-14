# token-service

**token-service** 是基于 [fyinfor/token-factory（TokenFactory）](https://github.com/fyinfor/token-factory) 二次开发的 AI API 网关，使用 Go 和 React，提供多模型供应商接入、渠道管理、模型映射、用户与令牌管理、额度计费、限流和管理后台。

**直接上游为 TokenFactory；TokenFactory 基于 [QuantumNous/new-api（New API）](https://github.com/QuantumNous/new-api) 开发。New API 由 QuantumNous 和贡献者开发维护。** 本仓库保留上游来源、版权与许可声明，不代表上游官方发行版。

- 本仓库：[hon-flex/token-service](https://github.com/hon-flex/token-service)
- 直接上游：[fyinfor/token-factory](https://github.com/fyinfor/token-factory)（TokenFactory）
- 原始上游：[QuantumNous/new-api](https://github.com/QuantumNous/new-api)
- 许可与署名：[LICENSE](./LICENSE) · [NOTICE](./NOTICE)
- 上游相关说明存档：[Readme-upstream.md](./Readme-upstream.md)（历史文档，并非与上游实时同步）

## 功能

- 多供应商模型接入、统一 API 转发与流式响应。
- 渠道分发、模型映射与路由策略。
- 用户、API 令牌、额度、计费与调用记录管理。
- React 管理后台、多语言界面与系统设置。
- SQLite、MySQL、PostgreSQL 数据库支持，Redis 与进程内缓存。

接口和功能背景参考 [New API 文档](https://docs.newapi.pro)。本修改版本可能与上游存在差异，实际行为以当前源码和配置为准。

## 修改声明

本仓库在 fyinfor/token-factory（TokenFactory）基础上进行 token-service 二次开发，继承其基于 New API 的代码与功能。各层上游已有功能不作为 token-service 的原创成果；本仓库的具体修改以相对直接上游的提交差异为准。修改记录及对应日期见 Git 提交历史；本 GitHub 版 README 整理日期为 **2026-09-14**。这不是上游未经修改的源码副本。

原公司版 README 原样保存在 [readme-company.md](./readme-company.md)，包含公司 Git 工作流和部署环境记录，仅作为历史参考。该文件随仓库发布时，其内容也会公开。

## 环境要求

| 组件 | 要求 |
| --- | --- |
| Go | 以 [go.mod](./go.mod) 为准，当前要求 1.26.2 |
| 前端 | React 18、Vite、Semi Design；使用 Bun |
| 数据库 | 本地可使用 SQLite，也支持 MySQL 和 PostgreSQL |
| Redis | 按部署需求配置 |

**构建依赖说明：** 当前源码直接导入 `github.com/fyinfor/router-engine/pkg/router`，依赖版本为 `v0.1.0`。构建前需能获取该依赖；关闭运行时路由配置不会移除编译依赖。该依赖的公开可获取性、许可兼容性及对应源码提供情况尚待核实，因此此文档不承诺匿名克隆后即可完成构建。

## 本地开发

```bash
git clone https://github.com/hon-flex/token-service.git
cd token-service

cd web
bun install --frozen-lockfile
bun run build
cd ..
```

后端通过 `go:embed` 嵌入 `web/dist`，因此首次运行前需要先构建前端。

参考 [.env.example](./.env.example) 在项目根目录创建本地 `.env`，已有文件时不要覆盖。后端从运行工作目录读取配置；未设置 `SQL_DSN` 时默认使用 SQLite。设置随机且固定保存的 `SESSION_SECRET`，不要提交实际密钥或本地数据。

```bash
# 终端一：项目根目录，默认端口 3000
go run .

# 终端二：前端开发服务器
cd web
bun run dev
```

访问 Vite 输出的地址。开发代理默认连接 `http://127.0.0.1:3000`；如需其他后端，可在 `web/.env.development.local` 设置 `VITE_DEV_PROXY_TARGET`。

## 从源码构建

在项目根目录执行，先构建前端，再编译包含静态资源的 Go 程序：

```bash
cd web
bun install --frozen-lockfile
VITE_REACT_APP_VERSION="$(cat ../VERSION)" bun run build
cd ..

mkdir -p dist
go build -trimpath \
  -ldflags "-s -w -X github.com/QuantumNous/new-api/common.Version=$(cat VERSION)" \
  -o dist/token-factory .
```

上述命令生成当前平台的程序。运行 `./dist/token-factory`，通过 `http://localhost:3000` 完成初始化。Go module 路径保留为 `github.com/QuantumNous/new-api`，与 GitHub 仓库名称不同属于预期情况。

仓库包含 [Dockerfile](./Dockerfile) 和 [生产 Compose 配置](./docker-compose.prod.yml)。使用前应核对镜像、密钥、网络端口和持久化路径；已知配置问题及部署记录见公司版的[部署常见问题](./readme-company.md#部署常见问题)，不能将现有生产编排直接视为通用安全默认值。

## 贡献与问题反馈

本修改版本的问题请提交至 [本仓库 Issues](https://github.com/hon-flex/token-service/issues)。涉及上游共同行为时，先确认能否在直接上游 TokenFactory 复现；进一步涉及 New API 时，再按相应上游流程反馈。

代码约定见 [AGENTS.md](./AGENTS.md)。提交前完成与变更相关的验证，保留版权、许可和来源声明，不提交访问令牌、环境密钥或数据库文件。

## 来源、版权与许可证

token-service 基于 **[fyinfor/token-factory](https://github.com/fyinfor/token-factory)**（TokenFactory）二次开发，保留 TokenFactory 贡献者的版权与许可声明。TokenFactory 基于 **[QuantumNous/new-api](https://github.com/QuantumNous/new-api)**（New API）开发，New API 由 **QuantumNous** 和贡献者维护；项目历史包含 [One API](https://github.com/songquanpeng/one-api)（MIT License）。已有署名、免责声明和生态说明保存在 [Readme-upstream.md](./Readme-upstream.md) 及原有源码中。

本仓库 [LICENSE](./LICENSE) 声明 **GNU Affero General Public License v3.0 or later（AGPL-3.0-or-later）**；请同时阅读 [NOTICE](./NOTICE)。各部分的原始版权及第三方许可声明继续保留，README 不替代许可证全文，也不授予额外的品牌或商标权利。

再分发与提供服务时，应依据许可证履行相应义务，包括：

- 保留适用的版权、许可与无担保声明，并随副本提供许可证；保留本仓库 NOTICE 和第三方声明。
- 对修改版本显著说明已经修改及相关日期，按 AGPL 的要求许可覆盖作品，并遵守适用的交互界面法律声明要求。
- 分发二进制或镜像时，按第 6 条提供对应源码。对应源码范围包括生成、安装、运行及修改所需的源码与相关构建脚本，不能仅用原始上游地址代替本修改版本的源码。
- 通过网络让用户与修改版本交互时，按第 13 条向这些用户显著提供免费获取该运行版本对应源码的机会。部署者应提供实际可用的源码入口，并对应到所部署版本的提交或标签。

条款原文见 [GNU AGPL v3 第 4、5、6、13 条](https://www.gnu.org/licenses/agpl-3.0.html)。发布前还需核实 `router-engine` 等依赖的许可和源码提供情况，并确认运行界面的源码入口指向实际部署版本；仅更新 README 不代表这些义务已经完成。

本软件不提供任何担保，具体以 LICENSE 为准。上游商业许可咨询联系：[support@quantumnous.com](mailto:support@quantumnous.com)。上游授权是否覆盖本仓库新增代码与第三方依赖，需由相应权利人明确授权。
