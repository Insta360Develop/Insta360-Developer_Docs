# Media SDK API Reference

The Media SDK (`sdk-media`) provides playback, export, image stitching, and live preview rendering for media captured by Insta360 cameras. This document lists the interface definitions and parameters of all public APIs.

---

## Contents

1. [Media File Management](#1-media-file-management)
2. [Image Stitching](#2-image-stitching)
3. [Media Export](#3-media-export)
4. [Players](#4-players)
5. [Player Parameters](#5-player-parameters)
6. [Player Listeners](#6-player-listeners)
7. [Rendering Configuration and Enums](#7-rendering-configuration-and-enums)
8. [Shared Data Types](#8-shared-data-types)

---

## 1. Media File Management

### WorkManager

The singleton entry point for media file listings; implements `WorkOperations`.

```kotlin
object WorkManager : WorkOperations
```

### WorkOperations

```kotlin
interface WorkOperations
```

| Method | Style | Description |
|--------|-------|-------------|
| `getAllCameraWorks(): Result<List<WorkWrapper>>` | Coroutine | List all media files on the camera |
| `getAllLocalWorks(): List<WorkWrapper>` | Synchronous | List all local media files |

---

### IWorkWrapper

Wraps a single capture result, exposing its metadata, type checks, and file operations.

```kotlin
interface IWorkWrapper
```

**URL properties**

| Property | Description |
|----------|-------------|
| `allUrls: Array<String>` | URLs of every related file (including LRV) |
| `mainUrls: Array<String>` | URLs of the main (full-resolution) files |
| `rawUrls: Array<String>` | URLs of the RAW files |
| `lrvUrls: Array<String>` | URLs of the low-resolution preview (LRV) files |

**Metadata**

| Method | Parameters | Description |
|--------|------------|-------------|
| `getCount()` | — | Number of file segments (greater than 1 for multi-segment video) |
| `getIdenticalKey(index)` | index defaults to 0 | Unique file identifier key |
| `getWidth(index)` / `getHeight(index)` | index defaults to 0 | Resolution (pixels) |
| `getBitrate(index)` | index defaults to 0 | Bitrate (bps) |
| `getFps(index)` | index defaults to 0 | Frame rate |
| `getCreationTime(index)` | index defaults to 0 | Creation time (millisecond timestamp) |
| `getFirstFrameTimeOffset(index)` | index defaults to 0 | First-frame time offset (milliseconds) |
| `getRollingShutterTime(index)` | index defaults to 0 | Rolling shutter time (seconds) |
| `getDurationInMs(index)` | index defaults to 0 | Duration of one segment (milliseconds) |
| `getTotalDurationInMs()` | — | Total duration of all segments (milliseconds) |
| `getFileSize()` | — | Total file size (bytes) |
| `getCameraType()` | — | Model name of the capturing camera |
| `loadThumbnail(index)` | index defaults to 0 | Load the thumbnail; returns null on failure |
| `loadExtraData(index)` | index defaults to 0 | Load extra metadata such as gyroscope and exposure data |
| `isExtraDataLoaded(index)` | index defaults to 0 | Whether the extra metadata has been loaded |
| `getGyroData()` | — | Gyroscope data array; see [GyroData](#gyrodata) |
| `getExposureData()` | — | Exposure data array; see [ExposureData](#exposuredata) |

**File type checks**

| Method | Description |
|--------|-------------|
| `isCameraFile()` | Stored on the camera (not yet downloaded) |
| `isLocalFile()` | Local file |
| `isPanoramaFile()` | Panoramic file |
| `isVideo()` / `isPhoto()` | Video / photo |
| `isHDRVideo()` / `isHDRPhoto()` | HDR video / photo |
| `isBulletTime()` | Bullet Time |
| `isBurst()` | Burst |
| `isTimeLapse()` | TimeLapse |
| `isTimeShift()` | TimeShift |
| `isNormalPhoto()` / `isNormalVideo()` | Regular photo / video |
| `isSuperNight()` | Super Night |
| `isStarLapse()` | Starlapse |
| `isLooperVideo()` | Loop recording |
| `isSuperVideo()` | Super Video |
| `isIntervalShooting()` | Interval shooting |
| `isSelfieVideo()` | Selfie video |
| `isSlowMotion()` | Slow motion |
| `isPureVideo()` | PureVideo |
| `supportHdrGenerate()` | Whether HDR compositing is supported |
| `supportPureShotGenerate()` | Whether PureShot compositing is supported |

**File operations**

| Method | Style | Description |
|--------|-------|-------------|
| `download(progressCallback?)` | Coroutine | Download to local storage; returns the local paths. `progressCallback` receives (total size, downloaded size) |
| `delete()` | Coroutine | Delete this file from the camera |

---

### WorkWrapper

The abstract base class of `IWorkWrapper`; subclasses provide concrete implementations depending on the file's source (camera or local).

```kotlin
abstract class WorkWrapper(
    val httpPrefix: String = "",
    val downloadHttpPrefix: String = httpPrefix
) : IWorkWrapper, Comparable<WorkWrapper>
```

| Property | Description |
|----------|-------------|
| `httpPrefix` | The file server's HTTP prefix (used for camera files). Over Wi-Fi Aware this is a bare IPv6 address |
| `downloadHttpPrefix` | The prefix the SDK should use when downloading assets. Over Wi-Fi Aware this is a placeholder hostname (resolved through dynamic DNS) so that OkHttp does not reject the zone-id syntax of a bare IPv6 address; for all other connection types it matches `httpPrefix` |

---

### GyroData

Gyroscope data for a single frame.

```kotlin
data class GyroData(
    val accelerateX: Double, val accelerateY: Double, val accelerateZ: Double,
    val rotationX: Double, val rotationY: Double, val rotationZ: Double,
    val timestamp: Long
)
```

| Property | Description |
|----------|-------------|
| `accelerateX/Y/Z` | Three-axis acceleration (m/s²) |
| `rotationX/Y/Z` | Three-axis angular velocity (rad/s) |
| `timestamp` | Timestamp (milliseconds) |

---

### ExposureData

Exposure data for a single frame.

```kotlin
data class ExposureData(val shutterSpeeds: Double, val timestamp: Long)
```

| Property | Description |
|----------|-------------|
| `shutterSpeeds` | Shutter speed (seconds) |
| `timestamp` | Timestamp (milliseconds) |

---

## 2. Image Stitching

### StitchManager

The singleton entry point for stitching; implements `Stitcher`.

```kotlin
object StitchManager : Stitcher
```

### Stitcher

```kotlin
interface Stitcher
```

| Method | Description |
|--------|-------------|
| `stitchSeparatedFisheye(workWrapper, outputFilePath): Result<Unit>` | Detect the contents of the `WorkWrapper` automatically and stitch the fisheye images |
| `stitchSeparatedFisheye(templateBlenderParams): Result<Unit>` | Stitch two fisheye images into a panorama |
| `generateHDR(workWrapper, outputFilePath): Result<Unit>` | HDR compositing |
| `generatePureShot(workWrapper, outputFilePath, algoFolderPath): Result<Unit>` | PureShot compositing |

---

### TemplateBlenderParams

Configuration for stitching fisheye images.

```kotlin
class TemplateBlenderParams(
    val inputFilePath1: String,   // Path of the first fisheye image
    val inputFilePath2: String,   // Path of the second fisheye image
    val outputFilePath: String,   // Output file path
)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isColorAdjustment` | Boolean | false | Enable color correction |
| `blendAngle` | Float | 8f | Blend region angle (degrees) |
| `mapSizeWidth` | Int | 200 | Mapping texture width |
| `mapSizeHeight` | Int | 100 | Mapping texture height |
| `fisheyeArrangement` | `FisheyeArrangement` | SEPERATED | Fisheye image arrangement |

### FisheyeArrangement

| Value | Description |
|-------|-------------|
| `CONNECTED` | Horizontally joined (side by side) |
| `VCONNECTED` | Vertically joined (stacked) |
| `SEPERATED` | Separated (two independent images) |

---

## 3. Media Export

### ExporterManager

The singleton entry point for export; implements `Exporter`.

```kotlin
object ExporterManager : Exporter
```

### Exporter

```kotlin
interface Exporter
```

| Method | Description |
|--------|-------------|
| `exportImage(imageExportParams, callback)` | Export an image |
| `exportVideo(videoExportParams, callback)` | Export a video |
| `exportVideoToImage(imageExportParams, callback)` | Extract frames from a video and export them as images |
| `stopExport(exportId: Int)` | Cancel the given export task (`exportId` comes from `IExportCallback.onStart`) |

---

### IExportCallback

Callback interface for export tasks.

```kotlin
interface IExportCallback
```

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onStart(id: Int)` | id: task ID | Export started; use the ID to cancel the task |
| `onSuccess()` | — | Export succeeded |
| `onFail(throwable: Throwable)` | throwable: failure cause | Export failed |
| `onCancel()` | — | Export was cancelled |
| `onProgress(progress: Float)` | progress: 0.0–1.0 | Export progress (empty default implementation) |

---

### ExportParams

The base class for export parameters; every export parameter class extends it.

```kotlin
open class ExportParams(workWrapper: WorkWrapper) : MediaParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `exportMode` | `ExportMode` | PANORAMA | Export projection mode |
| `targetPath` | String? | null | Output path; null uses the default path |
| `isUseSoftwareDecoder` | Boolean | false | Use the software decoder |
| `width` / `height` | Int | -1 | Output resolution (-1 means default) |
| `isDenoise` | Boolean | false | Denoising toggle |
| `distance` | Float | 0f | Viewing distance |
| `fov` | Float | 0f | Field of view (degrees) |
| `yaw` / `pitch` | Float | 0f | Yaw / pitch (degrees) |

> For the properties inherited from `MediaParams`, see [§5 MediaParams](#mediaparams).

---

### VideoExportParams

Video export parameters.

```kotlin
class VideoExportParams(workWrapper: WorkWrapper) : ExportParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isUseSoftwareEncoder` | Boolean | false | Use the software encoder (hardware by default) |
| `bitrate` | Int | -1 | Target bitrate (bps; -1 uses the default) |
| `fps` | Int | -1 | Target frame rate (-1 uses the default) |
| `roll` | Float | 0f | Image roll angle (degrees) |

---

### ImageExportParams

Image export parameters.

```kotlin
class ImageExportParams(workWrapper: WorkWrapper) : ExportParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `index` | Int | 0 | Index of the frame to export |
| `timestampList` | `List<Double>` | empty | Timestamps (seconds) of the frames to export; takes precedence over `index` when not empty |

---

## 4. Players

### Player hierarchy

```
BasePlayer
├── VideoPlayer  (: StreamPlayer, BasePlayer, LocalPlayer)
├── ImagePlayer  (: BasePlayer, LocalPlayer)
└── PreviewPlayer (: StreamPlayer, BasePlayer)

StreamPlayer   — pause / resume / isPlaying
LocalPlayer    — marker interface indicating local file playback support
```

---

### BasePlayer

The base interface for every player.

```kotlin
interface BasePlayer
```

**Playback control**

| Method | Description |
|--------|-------------|
| `play()` | Start playback |
| `isLoading(): Boolean` | Whether the player is loading |
| `isPrepared(): Boolean` | Whether preparation has completed |
| `destroy()` | Destroy the player and release all resources |

**Gesture control**

| Method | Description |
|--------|-------------|
| `setGestureEnabled(enabled)` | Master switch for gesture interaction |
| `isGestureEnabled(): Boolean` | Get the master gesture switch state |
| `setGestureHorizontalEnabled(enabled)` | Horizontal gestures (rotate the view left/right) |
| `setGestureVerticalEnabled(enabled)` | Vertical gestures (rotate the view up/down) |
| `setGestureZoomEnabled(enabled)` | Zoom gesture (pinch) |
| `setGestureListener(listener: PlayerGestureListener?)` | Set the gesture event listener |

**Lens modes**

| Method | Description |
|--------|-------------|
| `switchNormalMode()` | Normal (flat) mode |
| `switchFisheyeMode()` | Fisheye mode |
| `switchPerspectiveMode()` | Perspective mode |

**View control**

| Method | Description |
|--------|-------------|
| `setConstraint(widthRatio, heightRatio, minFov, maxFov, defaultFov, minDistance, maxDistance, defaultDistance)` | Set the view constraints |
| `getFov(): Float` | Current field of view (degrees) |
| `getDistance(): Float` | Current viewing distance |
| `getYaw(): Float` | Yaw (radians) |
| `getPitch(): Float` | Pitch (radians) |
| `getRoll(): Float` | Roll (radians) |

**Rendering settings**

| Method | Description |
|--------|-------------|
| `setScreenRatio(ratioX, ratioY)` | Set the render view's aspect ratio |
| `getScreenRatio(): Pair<Int, Int>` | Get the current aspect ratio |
| `setStabType(type: StabType)` | Set the stabilization type |
| `getStabType(): StabType` | Get the current stabilization type |
| `setOffsetType(type: OffsetType)` | Set the lens offset type (lens guard, dive case, and other accessories) |
| `getOffsetType(): OffsetType` | Get the current offset type |
| `setColorFusionEnabled(enabled)` | Color fusion (chromatic aberration removal) toggle |
| `isColorFusionEnabled(): Boolean` | Whether color fusion is enabled |
| `setDynamicStitchEnabled(enabled)` | Dynamic stitching toggle |
| `isDynamicStitchEnabled(): Boolean` | Whether dynamic stitching is enabled |
| `setColorPlusEnabled(enabled)` | Color Plus toggle |
| `isColorPlusEnabled(): Boolean` | Whether Color Plus is enabled |
| `setColorPlusFilterIntensity(intensity)` | Color Plus intensity (0.0–1.0) |
| `getColorPlusFilterIntensity(): Float` | Get the Color Plus intensity |
| `setDePurpleFilterEnable(enabled)` | Purple-fringe removal filter toggle |
| `getDePurpleFilterEnable(): Boolean` | Whether the purple-fringe removal filter is enabled |
| `setListener(listener: PlayerViewListener?)` | Set the player view event listener |

---

### StreamPlayer

The common interface for streaming players (implemented by both the video player and the preview player).

```kotlin
interface StreamPlayer
```

| Method | Description |
|--------|-------------|
| `pause()` | Pause playback |
| `resume()` | Resume playback |
| `isPlaying(): Boolean` | Whether playback is in progress |

---

### VideoPlayer

The video player; extends `StreamPlayer` + `BasePlayer` with seeking, looping, and related capabilities.

```kotlin
interface VideoPlayer : StreamPlayer, BasePlayer, LocalPlayer
```

| Method | Description |
|--------|-------------|
| `prepare(params: VideoPlayerParams)` | Initialize and prepare the video player |
| `setVideoStatusListener(listener: VideoStatusListener?)` | Set the playback status listener |
| `seekTo(position: Long)` | Seek to the given position (milliseconds) |
| `isSeeking(): Boolean` | Whether a seek is in progress |
| `getCurrentPosition(): Long` | Current playback position (milliseconds) |
| `getDuration(): Long` | Total video duration (milliseconds) |
| `isLooping(): Boolean` | Whether looping is enabled |
| `setLooping(isLooping: Boolean)` | Enable or disable looping |
| `setVolume(volume: Float)` | Set the volume (0.0–1.0) |
| `setLrvEnable(enabled: Boolean)` | Enable the low-resolution preview (LRV) |
| `isLrvEnable(): Boolean` | Whether LRV is enabled |

---

### ImagePlayer

The panoramic photo player.

```kotlin
interface ImagePlayer : BasePlayer, LocalPlayer
```

| Method | Description |
|--------|-------------|
| `prepare(params: ImagePlayerParams)` | Initialize and prepare the image player |

---

### PreviewPlayer

The camera live preview player; extends `StreamPlayer` + `BasePlayer` with preview stream integration, resolution settings, and related capabilities.

```kotlin
interface PreviewPlayer : StreamPlayer, BasePlayer
```

| Method | Description |
|--------|-------------|
| `prepare(params: PreviewParams)` | Initialize and prepare the preview player |
| `destroyRender()` | Destroy the renderer (required before restarting the player) |
| `setPreviewResolution(width, height)` | Set the preview resolution |
| `setFps(fps: Int)` | Set the preview frame rate |
| `getPreviewWidth(): Int` / `getPreviewHeight(): Int` | Current preview resolution |
| `getFps(): Int` | Current preview frame rate |
| `setOffset(offsetData, stabOffset)` | Update the lens offset and stabilization offset |
| `setWindowCropInfo(cropInfo: WindowCropInfo)` | Set the window crop information |
| `getWindowCropInfo(): WindowCropInfo?` | Get the current window crop information |
| `showPlayView()` / `hidePlayView()` | Show / hide the playback view |
| `getPipeline(): KMPCameraPreviewPipeline?` | Get the current rendering pipeline |
| `updateRotate(rotateDegreeContent, rotateDegree, cameraPosture, cameraPostureCorrected)` | Update the image rotation |
| `redetectCameraRotation()` | Re-detect the camera's rotation |

---

## 5. Player Parameters

### MediaParams

The common base class for every media parameter class.

```kotlin
open class MediaParams(val workWrapper: WorkWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isDePurpleFilterOn` | Boolean | false | Purple-fringe removal |
| `isColorFusion` | Boolean | false | Chromatic aberration removal |
| `isDynamicStitch` | Boolean | true | Dynamic stitching |
| `stabType` | `StabType` | AUTO | Stabilization type |
| `offsetType` | `OffsetType` | ORIGINAL | Lens offset type |
| `screenRatio` | IntArray | [-1, -1] | Aspect ratio (-1 means unconstrained) |
| `colorPlusEnable` | Boolean | false | Color Plus |
| `colorPlusFilterIntensity` | Float | 1.0f | Color Plus intensity |
| `urlForAction` | String | "" | The URL to play or export |

---

### PlayerParams

Common player parameters; extends `MediaParams`.

```kotlin
open class PlayerParams(workWrapper: WorkWrapper) : MediaParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `renderModel` | `RenderModel` | AUTO | Rendering mode |
| `isGestureEnabled` | Boolean | true | Master switch for gesture interaction |
| `isGestureHorizontalEnabled` | Boolean | true | Horizontal gestures |
| `isGestureVerticalEnabled` | Boolean | true | Vertical gestures |
| `isGestureZoomEnabled` | Boolean | true | Zoom gesture |
| `isWithSwitchingAnimation` | Boolean | false | Animate lens mode switches |

---

### VideoPlayerParams

Video player parameters; extends `PlayerParams`.

```kotlin
class VideoPlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `loadingImageResId` | Int | -1 | Resource ID of the loading placeholder image (-1 means none) |
| `loadingBackgroundColor` | Int | black | Loading background color (ARGB) |
| `isAutoPlayAfterPrepared` | Boolean | true | Play automatically once prepared |
| `isLooping` | Boolean | true | Loop playback |
| `isLrvEnable` | Boolean | false | Enable the low-resolution preview (LRV) |
| `isVideoHwaccelEnabled` | Boolean | true | Enable hardware-accelerated video decoding |

---

### ImagePlayerParams

Image player parameters; extends `PlayerParams`.

```kotlin
class ImagePlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `index` | Int | 0 | Index of the image frame to display |

---

### PreviewParams

Camera preview player parameters.

```kotlin
data class PreviewParams(...)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` / `height` | Int | -1 | Preview resolution (-1 uses the default) |
| `fps` | Int | -1 | Preview frame rate |
| `screenRatio` | `Pair<Int, Int>` | -1 to -1 | Render view aspect ratio |
| `stabType` | `StabType?` | null | Stabilization type |
| `isGestureEnabled` | Boolean | true | Gesture interaction toggle |
| `isCopyVideoHwaccel` | Boolean | true | Hardware-accelerated frame copying |
| `isVideoHwaccelEnabled` | Boolean | true | Enable hardware-accelerated video decoding |
| `isColorFusion` | Boolean | true | Color fusion (chromatic aberration removal) |
| `stabCacheFrameNum` | Int | -1 | Number of frames cached for stabilization |
| `isOnlyStitchSurfaceRender` | Boolean | false | Render only to the specified Surface |
| `renderModel` | `RenderModel?` | null | Rendering mode |
| `isRenderAtOnce` | Boolean | false | Start rendering immediately (do not wait for the first frame) |
| `cameraRenderSurface` | `KMPSurface?` | null | The target render Surface |
| `cameraRenderSurfaceWidth` / `Height` | Int | -1 | Dimensions of that Surface |

---

## 6. Player Listeners

### VideoStatusListener

Video playback status callbacks, set via `VideoPlayer.setVideoStatusListener()`.

```kotlin
interface VideoStatusListener
```

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onProgressChanged(position, length)` | milliseconds | Playback progress changed |
| `onPlayStateChanged(isPlaying)` | — | Play / pause state changed |
| `onSeekComplete()` | — | The seek finished |
| `onComplete()` | — | Playback finished |
| `onPlayingFluencyResult(fluentFactor, srcTime, detectTime)` | fluentFactor: Double, srcTime: Double, detectTime: Double | Playback smoothness measurement, taken once per second. `fluentFactor` is a smoothness coefficient in [0,1] — [0.65,1] counts as smooth, and -1 means the measurement failed. Empty default implementation |

---

### PlayerViewListener

Player view event callbacks, set via `BasePlayer.setListener()`.

```kotlin
interface PlayerViewListener
```

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onLoadingStatusChanged(isLoading)` | isLoading: whether loading is in progress | Loading state changed |
| `onLoadingFinish()` | — | Loading finished |
| `onFail(exception: InstaException)` | exception: error details | An error occurred |
| `onFirstFrameRendered()` | — | The first frame has been rendered |
| `onReleaseCameraPipeline()` | — | The camera preview pipeline was released |

---

### PlayerGestureListener

Player gesture event callbacks, set via `BasePlayer.setGestureListener()`. Every method has an empty default implementation; override only what you need.

```kotlin
interface PlayerGestureListener
```

| Callback | Description |
|----------|-------------|
| `onDown(event): Boolean` | Finger down; return true to consume the event |
| `onTap(event): Boolean` | Tap; return true to consume the event |
| `onUp()` | Finger up |
| `onLongPress(event)` | Long press |
| `onZoom()` | Zoom gesture started |
| `onZoomAnimation()` | Zoom animation in progress |
| `onZoomAnimationEnd()` | Zoom animation finished |
| `onScroll()` | Scroll gesture |
| `onFlingAnimation()` | Fling animation in progress |
| `onFlingAnimationEnd()` | Fling animation finished |

---

## 7. Rendering Configuration and Enums

### ExportMode

| Value | Description |
|-------|-------------|
| `PANORAMA` | Flat panoramic projection (equirectangular) |
| `SPHERE` | Spherical projection |

---

### OffsetType

Specifies which accessory is mounted on the camera so the matching lens distortion correction parameters are applied.

| Value | Description |
|-------|-------------|
| `ORIGINAL` | No accessory; use the original offset |
| `PROTECTOR_FASTEN` | Snap-on lens guard |
| `DIVING_WATER` | Dive case, underwater (legacy) |
| `DIVING_AIR` | Dive case, above water (legacy) |
| `WATERPROOF` | Waterproof case |
| `PROTECTOR_ADHERE` | Adhesive lens guard |
| `DIVING_INVISIBLE_WATER` | Invisible dive case, underwater |
| `DIVING_INVISIBLE_AIR` | Invisible dive case, above water |
| `PROTECTOR_A` | Grade A lens guard (plastic, X3/X4) |
| `PROTECTOR_S` | Grade S lens guard (glass, X3/X4) |
| `PROTECTOR_AS_AVERAGE` | Averaged A/S lens guard (virtual combined parameters) |

---

### StabType

| Value | Description |
|-------|-------------|
| `AUTO` | Automatically choose the best stabilization algorithm |
| `PANORAMA` | Panoramic stabilization |
| `CALIBRATE_HORIZON` | Horizon leveling stabilization |
| `FOOTAGE_MOTION_SMOOTH` | Motion smoothing stabilization |

---

### StabilizerStabMode

| Value | rawValue | Description |
|-------|----------|-------------|
| `Off` | -1 | Stabilization off |
| `Still` | 0 | Fixed stabilization |
| `ZDirectional` | 1 | Z-axis stabilization |
| `FullDirectional` | 2 | Omnidirectional stabilization |
| `FreeFootage` | 4 | Free-motion stabilization |
| `FlipEffect` | 22 | Flip effect |
| `RelativeRefine` | 8 | Relative fine stabilization |
| `AbsoluteRefine` | 9 | Absolute fine stabilization |
| `BulletTime` | 5 | Bullet Time |
| `PanoFPV` | 23 | Panoramic FPV |
| `Immersion` | 24 | Immersive mode |

---

### RenderModel

| Value | nativeValue | Description |
|-------|-------------|-------------|
| `AUTO` | 0 | Automatically fuse the two video streams |
| `PLANE_STITCH` | 11 | Flat stitching (dual-lens fusion, laid flat) |
| `PLANE` | 20 | Split plane (fisheye split-screen display) |

---

### DisplayType

| Value | rawValue | Description |
|-------|----------|-------------|
| `Auto` | 0 | Automatic |
| `SphereStitch` | 2 | Spherical stitching |
| `SphereEquirectangular` | 3 | Spherical equirectangular |
| `SphereFisheyeDewarp` | 4 | Spherical fisheye dewarping |
| `PlaneStitch` | 11 | Flat stitching |
| `PlaneEquirectangular` | 12 | Flat equirectangular |
| `PlaneFisheyeDewarp` | 13 | Flat fisheye dewarping |
| `Plane` | 20 | Plain flat |
| *(and others)* | — | See `DisplayType.kt` in the source for the full list |

---

### OpticalFlowType

| Value | rawValue | Description |
|-------|----------|-------------|
| `DynamicStitch` | 0 | Dynamic stitching |
| `Disflow` | 1 | Disflow optical flow algorithm |
| `AiFlow` | 2 | AI optical flow algorithm |

---

### ImageLayout

| Value | rawValue | Description |
|-------|----------|-------------|
| `HorizontalMerged` | 0 | Horizontally merged |
| `OneBulletTime` | 1 | Single Bullet Time frame |
| `Respective2Images` | 2 | Two independent images (default) |
| `LeftHalf` / `RightHalf` | 3 / 4 | Left half / right half |
| `TopHalf` / `BottomHalf` | 5 / 6 | Top half / bottom half |
| `LeftRight` | 7 | Left-right split |
| `TopBottom` | 8 | Top-bottom split |

---

### ProtectOffsetConvertOption

A bit-flag enum that specifies the lens guard or accessory type; values can be combined with a bitwise OR.

| Value | Description |
|-------|-------------|
| `None` | No accessory |
| `EnableWaterProof` | Waterproof case |
| `EnableDivingAir` / `EnableDivingWater` | Dive case (legacy, above water / underwater) |
| `EnableDivingAirV2` / `EnableDivingWaterV2` | Dive case (new, above water / underwater) |
| `EnableBuckleShell` | Snap-on protective shell |
| `EnableAdhesiveShell` | Adhesive protective shell |
| `EnableGlassShell` | Glass protective shell |
| `EnablePlasticCement` | Plastic protective shell |
| `EnableAverageShell` | Averaged protective shell |
| `EnableNDFilter` | ND filter |
| `EnableDivingWaterPro` / `EnableDivingAirPro` | Dive case Pro |

---

### StabilizerParam

```kotlin
data class StabilizerParam(
    val offset: String,
    val preferredStabMode: StabilizerStabMode
)
```

| Property | Description |
|----------|-------------|
| `offset` | Lens offset string used in stabilization calculations |
| `preferredStabMode` | Preferred stabilization mode |

---

### RenderModelParam

Combined configuration for rendering behavior.

```kotlin
data class RenderModelParam(
    val imageLayout: ImageLayout = ImageLayout.Respective2Images,
    val renderType: DisplayType = DisplayType.PlaneStitch,
    val stabMode: StabilizerStabMode = StabilizerStabMode.Still,
    val offset: String,
    val colorFusion: Boolean
)
```

---

### RenderView

```kotlin
data class RenderView(val width: Int, val height: Int)
```

Render view dimensions (pixels).

---

### VideoClipInfo

Specifies a video's source and playback range. Provide either `inputUrl` or `wrapper`; when both are set, `wrapper` wins.

```kotlin
data class VideoClipInfo(
    val inputUrl: String?,     // File path (file:/// or absolute); alternative to wrapper
    val wrapper: WorkWrapper?, // Takes precedence over inputUrl
    val startTimeMs: Int,      // Start position (milliseconds)
    val endTimeMs: Int         // End position (milliseconds)
)
```

---

## 8. Shared Data Types

The types below are shared between the Media and Camera modules and are listed here for reference.

### KMPCameraPreviewPipeline

Defined in `verticalCommon` and used on both the Camera and Media sides:

- Camera side: `CameraPreview.setPipeline(pipeline)` — inject the pipeline into the camera preview
- Media side: `PreviewPlayer.getPipeline()` — get the current rendering pipeline

The pipeline object is created on the media side and passed to the camera side, where it serves as the transport channel for preview data.

---

### PreviewStreamParamsUpdate (Camera → Media)

When the camera's preview stream parameters change, this object is delivered through `CameraStreamListener.onParamsChanged()`.
On the media side you typically use its data to call `PreviewPlayer.setOffset()` and `setWindowCropInfo()` and keep the player in sync.

```kotlin
data class PreviewStreamParamsUpdate(
    val windowCropInfo: WindowCropInfo?,
    val offsetData: CameraPreviewOffsetData?,
    val stabOffset: String?,
    val previewWidth: Int,
    val previewHeight: Int,
    val previewFps: Int,
)
```

For details, see [§4 Live Preview](../camera-api/#_4-live-preview) in the Camera API reference.
