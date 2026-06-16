# 桌面端 SDK 概述

桌面端 SDK(C++)面向 Windows / Linux 桌面应用,包含两套:**Camera SDK**(连机控制相机)与 **Media SDK**(全景素材拼接 / 导出)。

> Windows 与 Linux 的接口完全一致,同一套文档对两个平台通用。

## Camera SDK

CameraSDK 主要用于连接相机、设置与获取相机参数、控制相机拍照和录制、文件下载与固件升级等,且**仅支持通过 USB 连接相机**,面向企业用户。

**支持机型**:ONE R、ONE RS、ONE RS 1-Inch、ONE X、X2、X3、X4、X4 Air、X5。

**支持平台**

| 平台架构 | 版本 |
| --- | --- |
| Windows x86_64 | Windows 7 或更高版本 |
| Linux x86_64 | Ubuntu 22.04 |
| Linux AArch64 (ARM64) | 基于 ARM GNU、Linaro 及 NVIDIA Jetson 官方工具链构建 |

➡️ 接口详情见 **[Camera SDK 接口文档](../camera/)**。

## Media SDK

::: warning 注意
3.x.x 版本的 SDK **必须有独立显卡(GPU)** 才能运行;所有文件路径需 UTF-8 编码;不支持在 Windows 的 WSL Ubuntu 下测试。
:::

MediaSDK 主要用于对全景素材进行**拼接**,支持**视频导出**与**图片导出**。

**支持机型**:ONE R、ONE RS、ONE RS 1-Inch、ONE X、X2、X3、X4、X4 Air、X5。

**支持平台**

| 平台 | 版本 |
| --- | --- |
| Windows | Windows 7 或更高版本,仅支持 x64 |
| Linux | Ubuntu 22.04(x86_64),其他发行版需测试 |

**支持的文件格式**

| 文件类型 | 导入格式 | 导出格式 |
| --- | --- | --- |
| 视频 | insv | mp4 |
| 图片 | insp / jpeg | jpg |

➡️ 接口详情见 **[Media SDK 接口文档](../media/)**。
