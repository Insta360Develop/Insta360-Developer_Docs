# X 系列 SDK

X 系列是目前覆盖最完整的产品系列,提供 **Android、iOS、桌面端(Windows / Linux)** 三个平台的 SDK,以及跨平台的 **OSC 协议**,所支持的具体功能参考相应接口文档。

## 文档集

| 文档集 | 状态 | 入口 |
| --- | --- | --- |
| Android SDK | ✅ 已支持 | [概述](./android/guide/) · [版本记录](./android/changelog) · [Camera SDK 接口文档](./android/camera-api/) · [Media SDK 接口文档](./android/media-api/) · [接口文档(旧版 1.x.x)](./android/legacy-api/) |
| iOS SDK | ✅ 已支持 | [概述](./ios/guide/) · [接口文档](./ios/api/) |
| 桌面端 SDK | ✅ 已支持 | [概述](./desktop/guide/) · [Camera SDK 接口文档](./desktop/camera/) · [Media SDK 接口文档](./desktop/media/) |
| OSC 协议 | ✅ 已支持 | [概述](./osc/guide/) · [接口文档](./osc/api/) |

::: tip 该选哪一套?
- 原生 **Android** 应用 → Android SDK
- 原生 **iOS** 应用 → iOS SDK
- **Windows / Linux** 桌面应用,需要连机控制相机(拍照/录像/下载)→ 桌面端 **Camera SDK**
- **Windows / Linux** 桌面应用,需要对全景素材**拼接 / 导出** → 桌面端 **Media SDK**
- 跨语言 / 通过 HTTP 直接控制相机 → **OSC 协议**

> 桌面端 Windows 与 Linux 的接口完全一致,同一套文档通用。
:::

::: warning Android SDK 有两个版本
当前版本是 **V2.x.x**,X、ACE、GO 三个系列通用,新项目请直接使用。
侧边栏最下方的「接口文档(旧版 1.x.x)」仅支持 **X 系列**,保留供存量项目查阅,不再新增功能。
详见 [Android SDK 概述 · 版本说明](./android/guide/#版本说明)。
:::

## 支持机型

X 系列各 SDK 总体覆盖:**X6、X5、X4 Air、X4、X3、X2、ONE X、ONE R、ONE RS、ONE RS 一英寸**(各 SDK 略有差异,具体以对应文档集的「概述 / 接口文档」为准)。

::: info 与 ACE / GO 系列的关系
X、ACE、GO 三个系列使用**同一套 SDK**,接口与调用方式完全一致,差异仅在支持的机型。因此三个系列共用同一份文档,无需分别查阅。
:::
