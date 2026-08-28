# Android SDK 概述

**Android SDK** 用于连接相机、设置与获取相机参数、控制相机拍照和录制、文件下载、固件升级,并支持视频导出与图片导出。SDK 分为两个模块,可按需单独引入:

| 模块 | 依赖 | 职责 |
| --- | --- | --- |
| **Camera SDK** | `com.arashivision.sdk:sdk-camera` | 连机控制:连接、拍摄、参数设置、实时预览、文件管理、固件升级 |
| **Media SDK** | `com.arashivision.sdk:sdk-media` | 素材处理:全景播放、图像拼接、媒体导出、预览渲染 |

## 版本说明

Android SDK 目前有两个大版本,接口不兼容:

| 版本 | 支持系列 | 状态 | 文档 |
| --- | --- | --- | --- |
| **V2.x.x**(当前) | X、ACE、GO | ✅ 持续维护 | 见下方「快速上手」 |
| V1.x.x(旧版) | 仅 X | 🔒 仅维护,不再新增功能 | [接口文档(旧版 1.x.x)](/ch/x/android/legacy-api/) |

::: tip 新项目请使用 V2.x.x
V2.x.x 是当前版本,X、ACE、GO 三个系列共用同一套接口,调用方式完全一致。
V1.x.x 保留供存量项目查阅,只提供接口文档。
:::

## 快速上手(V2.x.x)

按顺序阅读即可完成接入:

1. **[推荐开发环境](../environment/)** —— Android Studio / Gradle / SDK 版本要求、Maven 仓库配置、权限声明
2. **[Camera SDK 集成指南](../camera-integration/)** —— 从初始化到连接相机、拍摄、预览的完整流程
3. **[Media SDK 集成指南](../media-integration/)** —— 播放、拼接、导出的完整流程
4. 接口细节查阅 **[Camera SDK 接口文档](../camera-api/)** 与 **[Media SDK 接口文档](../media-api/)**

## 版本记录

各版本的更新内容见 **[版本记录](../changelog)**。
