# Insta360 SDK/API 开发者文档（VitePress）

X / Go / ACE / Wave / Link 五个产品系列 SDK 的统一文档站点。以「产品系列」为主轴（顶部「产品」下拉切换），系列下再分文档集（平台 SDK 或单一 SDK / 协议）。中英文双语（VitePress 内置 i18n，`/ch/` 与 `/en/`）。

## 开发

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 构建静态站点到 docs/.vitepress/dist
npm run preview  # 预览构建产物
```

> ⚠️ 本机说明：PATH 中默认的 `node` 是 Codex.app 内置版本，开启了 macOS 库校验，无法加载 VitePress 依赖的 rollup 原生库。因此 `package.json` 的脚本已显式使用 Homebrew 的 node（`/opt/homebrew/bin`，通过 `brew install node` 安装）。如果你换了机器或自行管理 node，可去掉脚本里的 `PATH=...` 前缀。

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mts          # 主配置：i18n locales、搜索、logo
│   ├── configs/
│   │   ├── shared.mts      # ★ 产品矩阵（seriesList）+ nav/sidebar 生成器，全站结构唯一数据源
│   │   ├── zh.mts          # 中文 nav / sidebar / 界面文案
│   │   └── en.mts          # 英文 nav / sidebar
│   └── theme/
│       ├── index.ts        # 扩展默认主题
│       └── custom.css      # 主题样式（主题色、首页系列卡片等）
├── index.md                # 站点根：重定向到 /ch/
├── public/logo.svg
├── ch/                     # 中文内容（/ch/）
│   ├── index.md            # 中文总首页（5 个系列卡片）
│   ├── download.md
│   ├── x/                  # X 系列（多平台）
│   │   ├── index.md        # 系列概述 + 平台支持矩阵
│   │   ├── android/        # 一个「文档集」= guide/ + api/ + changelog.md + notice.md
│   │   ├── ios/
│   │   ├── desktop/
│   │   └── osc/            # OSC 协议（与 SDK 平行的一套文档）
│   ├── go/                 # Go 系列：index.md + android/
│   ├── ace/                # ACE 系列：index.md + android/
│   ├── wave/               # Wave 系列（单一 SDK）：index.md + guide/ + api/ + changelog + notice
│   └── link/               # Link 系列（单一 SDK/协议）：同上
└── en/                     # 英文内容（/en/），结构完全镜像 ch/
```

一个**文档集**固定四块：集成指南（概述/快速入门/安装初始化）、接口文档、版本更新记录、重要提示。

**结构逻辑**：第一级是语言（`ch` / `en`），第二级是「产品系列」，第三级是系列下的「文档集」。
- 多平台系列（X / Go / ACE）：文档集放在 `语言/系列/平台/` 下（如 `ch/x/android/`），侧边栏每个平台一个分组。X 系列含 Android / iOS / 桌面端 / OSC。
- 单一 SDK 系列（Wave / Link）：文档集直接放系列根下（如 `ch/wave/guide/`）。
- 当前不展示「计划中」的平台（Go / ACE 的 iOS）。

中文在 `/ch/`、英文在 `/en/`（如 `/ch/x/android/...` ↔ `/en/x/android/...`）。站点根 `/` 由 `docs/index.md` 重定向到 `/ch/`。语言切换依赖此前缀。

## 填充真实内容

各 SDK 文档目前在独立 GitHub 仓库。当前为「骨架 + 示例」：

- **X 系列 Android（中文）** 为完整示例，可作为写作模板（接口条目结构：签名 → 参数 → 返回值 → 错误码 → 示例）。
- 其余文档集 / 英文为标有 🚧 的占位页，把对应仓库的 Markdown 内容替换进去即可。

### 改结构只动一个文件

全站的 nav 与 sidebar 都由 [docs/.vitepress/configs/shared.mts](docs/.vitepress/configs/shared.mts) 里的 `seriesList` 自动生成：

- **新增系列**：往 `seriesList` 加一项；`docSets: []` 表示单一 SDK，否则列出平台。然后建对应内容目录。
- **某系列新增平台**（如 Go 的 iOS 支持了）：在该系列的 `docSets` 里加 `{ key:'ios', ch:'iOS SDK', en:'iOS SDK' }`，再建 `ch/go/ios/` 与 `en/go/ios/` 目录。
- **新增接口条目**：在文档集的 `api/` 下加页面，并在 `shared.mts` 的 `docSections()` 接口分组里加一条 `{ text, link }`。

## 后续可选增强

- 内容汇入自动化：用 git submodule 或同步脚本从各 SDK 仓库拉取 Markdown。
- 接口版本切换（多版本文档）。
- Algolia DocSearch 替换内置本地搜索（内容量大时）。
- mermaid 流程图（需安装 `vitepress-plugin-mermaid`）。
