# 安装与初始化

## 添加依赖

::: code-group

```groovy [Gradle (Groovy)]
dependencies {
    implementation 'com.example.sdk:core:1.4.0'
}
```

```kotlin [Gradle (Kotlin DSL)]
dependencies {
    implementation("com.example.sdk:core:1.4.0")
}
```

:::

如使用私有仓库，请在 `settings.gradle` 中添加 Maven 源：

```groovy
dependencyResolutionManagement {
    repositories {
        maven { url 'https://maven.example.com/repository/releases' }
    }
}
```

## 申请权限

在 `AndroidManifest.xml` 中声明：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
```

> Android 6.0+ 的运行时权限（如相机、存储）需在使用前动态申请。

## 混淆配置

```text
-keep class com.example.sdk.** { *; }
-dontwarn com.example.sdk.**
```

## 初始化参数说明

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `appKey` | String | 是 | 应用鉴权 Key，在开发者后台获取 |
| `enableLog` | Boolean | 否 | 是否开启调试日志，默认 `false` |
| `timeout` | Long | 否 | 连接超时（毫秒），默认 `10000` |

初始化完成后即可参考 [快速入门](./quickstart) 进行连接与调用。
