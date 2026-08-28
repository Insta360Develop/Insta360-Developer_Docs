# iOS SDK Overview

The X series **iOS SDK** connects to the camera, gets/sets camera parameters, controls photo and video capture, downloads files, upgrades firmware, and supports video and image export. It is split into a **Camera SDK** (live camera control) and a **Media SDK** (media export).

## Supported cameras

ONE R, ONE RS, ONE RS 1-Inch, ONE X, X2, X3, X4, X4 Air, X5.

## Getting started

1. Locate the following dependency frameworks in the sample project and drag them into your target:

```
INSCoreMedia.xcframework
INSCameraServiceSDK.xcframework
INSCameraSDK.xcframework
SSZipArchive.xcframework
```

2. In Xcode's Build Settings, add the build flag `TO_B_SDK=1`, then build to confirm the project compiles.

➡️ Parameters, return values, examples and error codes for every interface are in the **[API Reference](../api/)**.
