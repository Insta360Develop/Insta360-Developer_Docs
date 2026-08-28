# Release Notes

## V2.x.x (current)

### V2.1.5

**Released**: 2026-08-28

1. Support X6
2. Fully reworked APIs — not compatible with 1.x.x; upgrading requires re-integration
3. Added notification for entering the saving state after a photo is taken (X5 and X6 only)
4. Support Wi-Fi Aware connection (X6 only)
5. Improved SDK stability and fixed several known issues

## V1.x.x (legacy)

::: warning Legacy release history
Release history for **Android SDK V1.x.x**. That version supports the **X series only** and receives no new features; its API reference is at [API Reference (Legacy 1.x.x)](/en/x/android/legacy-api/).
:::

### V1.10.1

1. Support 16 KB page sizes
2. Improved SDK stability

### V1.9.11

1. Supports configuring log output levels and cache levels
2. Fixed incorrect exposure in HDR mode on the X3 camera
3. Fixed an issue where video resolution settings on the X3 camera did not take effect
4. Fixed an issue causing black frames when stitching two single-fisheye files

### V1.9.4

1. Support X4 Air
2. This version doesn't support 16K (V1.8.2 supports it)
3. Fixed a crash issue in the live streaming feature that occurred in version V1.9.3

### V1.9.3

1. Support X4 Air
2. This version doesn't support 16K (V1.8.2 supports it)

### V1.8.2-build4

1. Support 16 KB page sizes
2. Added Color Plus interface
3. Added method to set Wi-Fi country code and channel
4. Added photo countdown function (X5 only)
5. Preview supports panoramic tiled rendering mode
6. Fixed issue where camera battery status was not reported over Bluetooth connection
7. Fixed mismatch between live streaming resolution parameters and actual output

### V1.8.1-build6

1. Added video denoising export interface
2. Added log data export interface
3. Added camera lock screen control interface (X4 and X5 only)
4. Added purple fringing removal interface (X5 only)
5. Added callback interface for camera shooting exceptions
6. Fixed an issue where some parameters could not be set after Bluetooth connection
7. Fixed a crash issue during live streaming on X2/X3 devices
8. Fixed an issue where live streaming bitrate settings were not applied

### V1.8.0-build11

1. Supports Insta360 X5
2. Added the ability to retrieve supported camera configuration parameters
3. Updated image stabilization algorithm for smoother footage
4. Improved error code system with more detailed information
