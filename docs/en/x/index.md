# X Series SDK

The X series is the most complete product line, offering SDKs for three platforms — **Android, iOS and Desktop (Windows / Linux)** — plus the cross-platform **OSC protocol**. See the corresponding API reference for the exact features supported.

## Doc sets

| Doc set | Status | Entry |
| --- | --- | --- |
| Android SDK | ✅ Available | [Overview](./android/guide/) · [API Reference](./android/api/) |
| iOS SDK | ✅ Available | [Overview](./ios/guide/) · [API Reference](./ios/api/) |
| Desktop SDK | ✅ Available | [Overview](./desktop/guide/) · [Camera SDK API](./desktop/camera/) · [Media SDK API](./desktop/media/) |
| OSC Protocol | ✅ Available | [Overview](./osc/guide/) · [API Reference](./osc/api/) |

::: tip Which one should I use?
- Native **Android** app → Android SDK
- Native **iOS** app → iOS SDK
- **Windows / Linux** desktop app that controls the camera (capture / record / download) → Desktop **Camera SDK**
- **Windows / Linux** desktop app that **stitches / exports** panoramic media → Desktop **Media SDK**
- Cross-language / control the camera directly over HTTP → **OSC Protocol**

> The desktop Windows and Linux interfaces are identical — one doc set covers both.
:::

## Supported cameras

Across the X series the SDKs cover **X5, X4 Air, X4, X3, ONE X2, ONE X, ONE RS, ONE RS 1-Inch** (exact support varies per SDK — see each doc set's Overview / API Reference).
