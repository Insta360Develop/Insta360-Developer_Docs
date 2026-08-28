# Desktop SDK Overview

The desktop SDK (C++) targets Windows / Linux desktop apps and includes two parts: the **Camera SDK** (live camera control) and the **Media SDK** (panoramic media stitching / export).

> The Windows and Linux interfaces are identical — one doc set covers both.

## Camera SDK

CameraSDK connects to the camera, gets/sets camera parameters, controls photo and video capture, downloads files, and upgrades firmware (X4 and later only). It connects to the camera **over USB only**, and is designed for enterprise users.

**Supported cameras**: X6, X5, X4 Air, X4, X3, X2, ONE X, ONE R, ONE RS, ONE RS 1-Inch.

**Platforms**

| Platform / arch | Version |
| --- | --- |
| Windows x86_64 | Windows 7 or later |
| Linux x86_64 | Ubuntu 22.04 |
| Linux AArch64 (ARM64) | Built with the official ARM GNU, Linaro and NVIDIA Jetson toolchains |

➡️ See the **[Camera SDK API Reference](../camera/)**.

## Media SDK

::: warning Note
The 3.x.x SDK **requires a discrete GPU**; all file paths must be UTF-8 encoded; testing under WSL Ubuntu on Windows is not supported.
:::

MediaSDK stitches panoramic media and supports **video export** and **image export**.

**Supported cameras**: X6, X5, X4 Air, X4, X3, X2, ONE X, ONE R, ONE RS, ONE RS 1-Inch.

**Platforms**

| Platform | Version |
| --- | --- |
| Windows | Windows 7 or later, x64 only |
| Linux | Ubuntu 22.04 (x86_64); other distros need testing |

**File formats**

| Type | Import | Export |
| --- | --- | --- |
| Video | insv | mp4 |
| Image | insp / jpeg | jpg |

➡️ See the **[Media SDK API Reference](../media/)**.
