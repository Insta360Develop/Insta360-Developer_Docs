# Android SDK 概述

X 系列 **Android SDK** 用于连接相机、设置与获取相机参数、控制相机拍照和录制、文件下载、固件升级,并支持视频导出与图片导出。SDK 分为 **Camera SDK**(连机控制)与 **Media SDK**(素材拼接 / 导出)两部分。

## 支持机型

ONE R、ONE RS、ONE RS 1-Inch、ONE X、X2、X3、X4、X4 Air、X5。

## 环境准备

Camera SDK 与 Media SDK 共用同一 Maven 仓库,按需引入对应依赖即可。

1. 将 Maven 地址添加到项目根目录 `build.gradle` 的 `repositories`(地址与凭据见 SDK Demo):

```Groovy
allprojects {
    repositories {
        ...
        maven {
            url 'XXXXXX'
            credentials {
                username = '***'
                password = '***'
            }
        }
    }
}
```

2. 在模块 `build.gradle` 中按需导入依赖:

```Groovy
dependencies {
    implementation 'com.arashivision.sdk:sdkcamera:x.x.x' // Camera SDK
    implementation 'com.arashivision.sdk:sdkmedia:x.x.x'  // Media SDK
}
```

> SDK 初始化方法见 [接口文档 · 初始化](../api/)。

::: warning 注意
32 位库(`armeabi-v7a`)已不再维护,请使用 64 位库(`arm64-v8a`)进行构建!
:::

➡️ 全部接口的参数、返回值、示例与错误码见 **[接口文档](../api/)**。
