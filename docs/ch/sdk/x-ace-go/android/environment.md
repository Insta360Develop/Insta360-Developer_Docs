# 推荐开发环境

---

## 开发工具

| 工具 | 推荐版本                 |
|------|----------------------|
| Android Studio | Ladybug（2024.2.1）及以上 |
| JDK | 11 及以上               |
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
| JVM target | 11 |

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
                username = "***" // 具体见官网下载的 SDK Demo
                password = "***" // 具体见官网下载的 SDK Demo
            }
        }
    }
}
```

> Maven 仓库的 `username` 与 `password` 请查看从官网下载的 SDK Demo,或通过[开发者主页](https://www.insta360.com/cn/developer/home)申请获取。

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
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlin {
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_11)
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
        android:usesCleartextTraffic="true"
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

> **运行时权限**：以下权限属于危险权限，需在代码中动态申请，仅在 Manifest 中声明不会自动授予：
> - 位置权限：`ACCESS_FINE_LOCATION`
> - 蓝牙权限（Android 12+）：`BLUETOOTH_SCAN`、`BLUETOOTH_CONNECT`
> - 存储权限：`READ_EXTERNAL_STORAGE` / `READ_MEDIA_*`
> - 通知权限（Android 13+）：`POST_NOTIFICATIONS`
