# 推荐开发环境

---

## 开发工具

| 工具 | 推荐版本                 |
|------|----------------------|
| Android Studio | Ladybug（2024.2.1）及以上 |
| JDK | 17 及以上               |
| Gradle | 8.11.1 及以上           |

---

## Android 编译要求

| 配置项 | 值 |
|--------|-----|
| Android Gradle Plugin（AGP） | 8.7.3 |
| Kotlin | 2.3.20 |
| compileSdk | 36 |
| minSdk | 28（Android 9） |
| targetSdk | 36 |
| JVM target | 17 |

---

## build.gradle（Project）

```kotlin
// settings.gradle.kts（Project 级）

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        // Insta360 公共 Maven 仓库
        maven {
            url = uri("https://androidsdk.insta360.com/repository/maven-public/")
            credentials {
                username = "<Insta360 提供的账号>"
                password = "<Insta360 提供的密码>"
            }
        }
    }
}
```

```kotlin
// build.gradle.kts（Project 级）

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
```

---

## build.gradle（Module: app）

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.your.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.your.app"
        minSdk = 28
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlin {
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }
}

dependencies {
    // Camera SDK
    implementation("com.arashivision.sdk:sdk-camera:2.x.x")
    // Media SDK
    implementation("com.arashivision.sdk:sdk-media:2.x.x")
}
```

> `sdk-camera` 和 `sdk-media` 通过传递依赖已包含底层原生库，无需单独声明。

---

## AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 网络 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

    <!-- Wi-Fi -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />

    <!-- 蓝牙（Android 11 及以下）-->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <!-- 蓝牙（Android 12+）-->
    <uses-permission
        android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <!-- 位置（BLE 扫描在 Android 11 及以下需要）-->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- 存储（Android 9~12）-->
    <uses-permission
        android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission
        android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <!-- 存储（Android 13+）-->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <!-- 其他 -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:networkSecurityConfig="@xml/network_security_config"
        ... >

        <!-- USB 连接支持：在主 Activity 中声明，相机通过 USB 连接时系统会自动唤起 -->
        <activity android:name=".MainActivity" ...>
            <intent-filter>
                <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
            </intent-filter>
            <meta-data
                android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
                android:resource="@xml/device_filter" />
        </activity>

        <!-- 前台服务：用于保持相机会话连接 -->
        <service
            android:name=".YourCameraSessionForegroundService"
            android:exported="false"
            android:foregroundServiceType="connectedDevice" />

    </application>
</manifest>
```

> **`@xml/device_filter`**：无需自行创建，该资源由 `sdk-camera` 随 AAR 一并提供（相机 USB vendor/product id 白名单），Manifest 中直接引用即可。

> **运行时权限**：以下权限属于危险权限，需在代码中动态申请，仅在 Manifest 中声明不会自动授予：
> - 位置权限：`ACCESS_FINE_LOCATION`
> - 蓝牙权限（Android 12+）：`BLUETOOTH_SCAN`、`BLUETOOTH_CONNECT`
> - 存储权限：`READ_EXTERNAL_STORAGE` / `READ_MEDIA_*`
> - 通知权限（Android 13+）：`POST_NOTIFICATIONS`

---

## 网络安全配置

相机服务固定使用明文 HTTP，而 Android 9（API 28）起，targetSdk ≥ 28 的应用默认禁止明文流量。因此需要显式放行相机相关地址，同时让应用自身的流量仍然要求 HTTPS。

SDK 在各连接方式下使用的明文端点：

| 连接方式 | 端点 | 说明 |
|----------|------|------|
| BLE / Wi-Fi | `http://192.168.42.1` | 相机作为热点时的固定 IP |
| Wi-Fi Aware | `http://aware.insta360.camera` | 占位域名。请求 URL 使用该域名，SDK 在发起请求时经自定义 DNS 将其解析为本次连接的相机地址，因此要放行的是域名本身，而不是某个固定 IP |
| USB | `http://127.0.0.1` | 相机服务经 USB 隧道映射到本机回环地址 |

在 `app/src/main/res/xml/network_security_config.xml` 新建：

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- 相机固定 IP：仅放行该地址的明文 HTTP，其余域名/IP 一律要求 HTTPS -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">192.168.42.1</domain>
        <!-- Wi-Fi Aware 场景下  -->
        <domain includeSubdomains="false">aware.insta360.camera</domain>
        <!-- USB 场景下，SDK 把相机服务经 USB 隧道映射到本机回环地址，业务仍走明文 HTTP -->
        <domain includeSubdomains="false">127.0.0.1</domain>
    </domain-config>

    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

并在 `<application>` 上引用该配置：

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ... >
```

> 不要改用 `android:usesCleartextTraffic="true"`：那是全量放行明文，而这里按地址白名单放行；且在 API 24 及以上，只要设置了 `networkSecurityConfig`，该属性会被忽略。
>
> 三条 `<domain>` 缺一不可 —— 缺少对应条目时，该连接方式下的文件列表、上传下载与参数请求都会因明文流量被系统拦截而失败。
