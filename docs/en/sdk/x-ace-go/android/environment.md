# Recommended Development Environment

---

## Development Tools

| Tool | Recommended Version |
|------|---------------------|
| Android Studio | Ladybug (2024.2.1) or later |
| JDK | 17 or later |
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
| JVM target | 17 |

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
                username = "<account provided by Insta360>"
                password = "<password provided by Insta360>"
            }
        }
    }
}
```

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
        android:networkSecurityConfig="@xml/network_security_config"
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

> **`@xml/device_filter`**: you don't need to create it. This resource ships inside the `sdk-camera` AAR (a whitelist of camera USB vendor/product IDs) — just reference it in the manifest.

> **Runtime permissions**: the following are dangerous permissions and must be requested at runtime in code. Declaring them in the manifest alone does not grant them:
> - Location: `ACCESS_FINE_LOCATION`
> - Bluetooth (Android 12+): `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`
> - Storage: `READ_EXTERNAL_STORAGE` / `READ_MEDIA_*`
> - Notifications (Android 13+): `POST_NOTIFICATIONS`

---

## Network Security Configuration

The camera service always uses plain-text HTTP, and since Android 9 (API 28), apps with targetSdk ≥ 28 block cleartext traffic by default. You therefore need to explicitly allow the camera addresses, while still requiring HTTPS for your app's own traffic.

Cleartext endpoints the SDK uses for each connection type:

| Connection type | Endpoint | Notes |
|-----------------|----------|-------|
| BLE / Wi-Fi | `http://192.168.42.1` | Fixed IP when the camera acts as a hotspot |
| Wi-Fi Aware | `http://aware.insta360.camera` | Placeholder domain. Request URLs use this domain, and the SDK resolves it to the current camera address through a custom DNS when sending requests — so allow the domain itself, not a fixed IP |
| USB | `http://127.0.0.1` | The camera service is mapped to the local loopback address through a USB tunnel |

Create `app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Camera fixed IP: allow cleartext HTTP to this address only; all other domains/IPs require HTTPS -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">192.168.42.1</domain>
        <!-- Wi-Fi Aware -->
        <domain includeSubdomains="false">aware.insta360.camera</domain>
        <!-- USB: the SDK maps the camera service to the local loopback address through a USB tunnel; traffic is still cleartext HTTP -->
        <domain includeSubdomains="false">127.0.0.1</domain>
    </domain-config>

    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

Then reference the configuration on `<application>`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ... >
```

> Do not use `android:usesCleartextTraffic="true"` instead: that allows all cleartext traffic, whereas this configuration allows it only for whitelisted addresses. Also, on API 24 and above, that attribute is ignored whenever `networkSecurityConfig` is set.
>
> All three `<domain>` entries are required — if one is missing, file listing, upload/download and parameter requests over that connection type will fail because the system blocks the cleartext traffic.
