# Recommended Development Environment

---

## Development Tools

| Tool | Recommended Version |
|------|---------------------|
| Android Studio | Ladybug (2024.2.1) or later |
| JDK | 11 or later |
| Gradle | 8.11.1 or later |

---

## Android Build Requirements

| Setting | Value |
|---------|-------|
| Android Gradle Plugin (AGP) | 8.7.3 |
| Kotlin | 2.3.20 |
| compileSdk | 36 |
| minSdk | 28 (Android 9) |
| targetSdk | 36 |
| JVM target | 11 |

---

## build.gradle (Project)

```kotlin
// settings.gradle.kts (project level)

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
        // Insta360 public Maven repository
        maven {
            url = uri("https://androidsdk.insta360.com/repository/maven-public/")
            credentials {
                username = "***" // see the SDK Demo downloaded from the official site
                password = "***" // see the SDK Demo downloaded from the official site
            }
        }
    }
}
```

> The Maven repository `username` and `password` are in the SDK Demo downloaded from the official site — or request them via the [developer home page](https://www.insta360.com/developer/home).

```kotlin
// build.gradle.kts (project level)

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
```

---

## build.gradle (Module: app)

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

> `sdk-camera` and `sdk-media` already bundle the underlying native libraries through transitive dependencies; no separate declaration is required.

---

## AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

    <!-- Wi-Fi -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />

    <!-- Bluetooth (Android 11 and below) -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <!-- Bluetooth (Android 12+) -->
    <uses-permission
        android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <!-- Location (required for BLE scanning on Android 11 and below) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Storage (Android 9–12) -->
    <uses-permission
        android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission
        android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <!-- Storage (Android 13+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <!-- Miscellaneous -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:usesCleartextTraffic="true"
        ... >

        <!-- USB connection support: declare in your main Activity so the system
             launches it automatically when a camera is connected over USB -->
        <activity android:name=".MainActivity" ...>
            <intent-filter>
                <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
            </intent-filter>
            <meta-data
                android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
                android:resource="@xml/device_filter" />
        </activity>

        <!-- Foreground service: keeps the camera session alive -->
        <service
            android:name=".YourCameraSessionForegroundService"
            android:exported="false"
            android:foregroundServiceType="connectedDevice" />

    </application>
</manifest>
```

> **Runtime permissions**: the following are dangerous permissions and must be requested at runtime in code. Declaring them in the manifest alone does not grant them:
> - Location: `ACCESS_FINE_LOCATION`
> - Bluetooth (Android 12+): `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`
> - Storage: `READ_EXTERNAL_STORAGE` / `READ_MEDIA_*`
> - Notifications (Android 13+): `POST_NOTIFICATIONS`
