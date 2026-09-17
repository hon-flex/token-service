# HonMaaS 首页组件

基于 [new-api](https://github.com/QuantumNous/new-api)（[QuantumNous](https://github.com/QuantumNous)）的独立静态产品首页。已有上游文件保留原版权与许可证声明；本目录本次独立新增源码使用“Copyright (c) 2026 燧弘华创”版权头。参考来源说明及第三方品牌资源保持原有归属。

| 组件                                      | 职责                                       |
| ----------------------------------------- | ------------------------------------------ |
| `HomeLanding`                             | 组合首页，读取站点名称、主题和文档配置     |
| `ReferenceHero`                           | 标题、蓝紫轨道网络与调度介绍面板           |
| `ReferenceStrip`                          | 四项核心能力摘要                           |
| `ReferenceModels`                         | 三张静态模型产品卡，使用本地官方品牌资源   |
| `ReferenceAdvantages`                     | 平台优势、客户端 Logo 和五层玻璃架构       |
| `ReferencePipeline`                       | 聊天模型 SSE 流式链路与独立异步视频链路    |
| `HomeQuickStart`                          | 三步接入、代码页签、键盘切换与复制         |
| `ReferenceCallToAction`                   | 页面末尾 CTA                               |
| `HomeMotionRegion`                        | 进入动画，以及离屏、后台和减少动态效果控制 |
| `LandingDocsLink`（`LandingActions.jsx`） | 共用文档链接，遵循现有文档打开方式         |

## 静态展示与接入地址

模型介绍不请求模型列表接口。首页示例固定使用 `https://token-service-qy.hon-maas.com/v1`，cURL、Python、Node.js 由 `code-examples.js` 统一生成。控制台、令牌和操练场入口使用现有路由；主导航、公告与自定义首页仍由项目原有功能管理。

品牌资源位于 `web/public/brands/`，保留官方颜色与比例。页面在 CTA 后结束，没有独立 Footer。

## 样式与动画

`reference-home.css` 包含首页布局、主题、玻璃架构及轻量 CSS/SVG 动效；`home-landing.css` 负责项目集成、代码区、焦点与移动端适配。

动画默认运行，没有页面动效开关。`HomeMotionRegion` 通过 CSS `animation-play-state` 与 SVG `pauseAnimations / unpauseAnimations` 处理离屏、后台和系统减少动态效果偏好。玻璃架构箭头为 6.5 秒低频动画，层板与光影为静态 SVG/CSS。未引入 Three.js。

## 检查

在 `web/` 目录运行：

```sh
bunx eslint src/components/home/landing/*.{js,jsx}
bun run build
```
