# Android SDK Overview

The **Android SDK** connects to the camera, gets/sets camera parameters, controls photo and video capture, downloads files, upgrades firmware, and supports video and image export. It ships as two modules that can be adopted independently:

| Module | Dependency | Scope |
| --- | --- | --- |
| **Camera SDK** | `com.arashivision.sdk:sdk-camera` | Live camera control: connection, capture, parameters, live preview, file management, firmware upgrade |
| **Media SDK** | `com.arashivision.sdk:sdk-media` | Media processing: panoramic playback, image stitching, media export, preview rendering |

## Versions

Two major versions of the Android SDK exist; their APIs are not compatible:

| Version | Series | Status | Docs |
| --- | --- | --- | --- |
| **V2.x.x** (current) | X, ACE, GO | ✅ Actively maintained | See "Getting started" below |
| V1.x.x (legacy) | X only | 🔒 Maintenance only, no new features | [API Reference (Legacy 1.x.x)](/en/x/android/legacy-api/) |

::: tip Use V2.x.x for new projects
V2.x.x is the current version: the X, ACE and GO series share one API with identical usage.
V1.x.x is kept for existing integrations and ships an API reference only.
:::

## Getting started (V2.x.x)

Read these in order to complete an integration:

1. **[Development Environment](../environment/)** — Android Studio / Gradle / SDK version requirements, Maven repository setup, permission declarations
2. **[Camera SDK Integration](../camera-integration/)** — the full path from initialization to connecting, capturing and previewing
3. **[Media SDK Integration](../media-integration/)** — the full path for playback, stitching and export
4. Look up API details in the **[Camera SDK API](../camera-api/)** and **[Media SDK API](../media-api/)**

## Release notes

Per-version changes are listed in the **[Release Notes](../changelog)**.
