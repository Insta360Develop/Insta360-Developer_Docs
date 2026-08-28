# X Series SDK

The X series is the most complete product line, offering SDKs for three platforms — **Android, iOS and Desktop (Windows / Linux)** — plus the cross-platform **OSC protocol**. See the corresponding API reference for the exact features supported.

## Doc sets

| Doc set | Status | Entry |
| --- | --- | --- |
| Android SDK | ✅ Available | [Overview](./android/guide/) · [Release Notes](./android/changelog) · [Camera SDK API](./android/camera-api/) · [Media SDK API](./android/media-api/) · [API Reference (Legacy 1.x.x)](./android/legacy-api/) |
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

::: warning Two Android SDK versions
The current version is **V2.x.x**, shared by the X, ACE and GO series — use it for new projects.
**API Reference (Legacy 1.x.x)** at the bottom of the sidebar covers the **X series only** and receives no new features.
See [Android SDK Overview · Versions](./android/guide/#versions) for details.
:::

## Supported cameras

Across the X series the SDKs cover **X6, X5, X4 Air, X4, X3, X2, ONE X, ONE R, ONE RS, ONE RS 1-Inch** (exact support varies per SDK — see each doc set's Overview / API Reference).

::: info Relationship with the ACE / GO series
The X, ACE and GO series share **the same SDK** — identical APIs and usage, differing only in which camera models are supported. All three series therefore share one set of docs.
:::
