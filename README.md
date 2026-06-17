# Insta360 开发者文档


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