# iOS SDK 概述

X 系列 **iOS SDK** 用于连接相机、设置与获取相机参数、控制相机拍照和录制、文件下载、固件升级,并支持视频导出与图片导出。SDK 分为 **Camera SDK**(连机控制)与 **Media SDK**(素材导出)两部分。

## 支持机型

ONE R、ONE RS、ONE RS 1-Inch、ONE X、X2、X3、X4、X4 Air、X5。

## 环境准备

1. 在示例工程中找到以下依赖库,并将它们拖入目标工程:

```
INSCoreMedia.xcframework
INSCameraServiceSDK.xcframework
INSCameraSDK.xcframework
SSZipArchive.xcframework
```

2. 在 Xcode 的 Build Settings 中添加编译选项 `TO_B_SDK=1`,然后编译确认工程能正常构建。

➡️ 全部接口的参数、返回值、示例与错误码见 **[接口文档](../api/)**。
