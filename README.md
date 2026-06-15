# Insta360 SDK/API 开发者文档（VitePress） - 测试验证阶段



X / Go / ACE / Wave / Link 五个产品系列 SDK 的统一文档站点。以「产品系列」为主轴（顶部「产品」下拉切换），系列下再分文档集（平台 SDK 或单一 SDK / 协议）。中英文双语（VitePress 内置 i18n，`/ch/` 与 `/en/`）。


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
