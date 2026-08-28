# Android SDK Overview

The X series **Android SDK** connects to the camera, gets/sets camera parameters, controls photo and video capture, downloads files, upgrades firmware, and supports video and image export. It is split into a **Camera SDK** (live camera control) and a **Media SDK** (media stitching / export).

## Supported cameras

ONE R, ONE RS, ONE RS 1-Inch, ONE X, X2, X3, X4, X4 Air, X5.

## Getting started

The Camera SDK and Media SDK share the same Maven repository; add only the dependencies you need.

1. Add the Maven repository to the `repositories` block of the project-level `build.gradle` (URL and credentials are in the SDK Demo):

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

2. Import the dependencies you need in the module `build.gradle`:

```Groovy
dependencies {
    implementation 'com.arashivision.sdk:sdkcamera:x.x.x' // Camera SDK
    implementation 'com.arashivision.sdk:sdkmedia:x.x.x'  // Media SDK
}
```

> SDK initialization: see [API Reference · Initialization](../api/).

::: warning Note
The 32-bit library (`armeabi-v7a`) is no longer maintained — build with the 64-bit library (`arm64-v8a`).
:::

➡️ Parameters, return values, examples and error codes for every interface are in the **[API Reference](../api/)**.
