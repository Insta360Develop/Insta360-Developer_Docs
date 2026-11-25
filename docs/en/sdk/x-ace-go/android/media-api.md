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

The singleton entry point for asset management; implements `WorkOperations`.

```kotlin
object WorkManager : WorkOperations
```

### WorkOperations

```kotlin
interface WorkOperations
```

| Method | Style | Description |
|--------|-------|-------------|
| `getAllCameraWorks(): Result<List<WorkWrapper>>` | Coroutine | List all assets on the camera |
| `getAllLocalWorks(): List<WorkWrapper>` | Synchronous | List all local assets |

---

### IWorkWrapper

The asset wrapper object. It wraps a single capture result (which may contain several files, such as the front and rear lens files of a panoramic video), exposing its metadata, type checks, thumbnail loading, and file operations.

```kotlin
interface IWorkWrapper
```

**URL properties**

| Property | Description |
|----------|-------------|
| `allUrls: Array<String>` | URLs of every related file (including the main files, LRV, etc.) |
| `mainUrls: Array<String>` | URLs of the main (full-resolution original) files |
| `rawUrls: Array<String>` | URLs of the RAW-format files |
| `lrvUrls: Array<String>` | URLs of the low-resolution preview (LRV) files |

**Metadata**

| Method | Parameters | Description |
|--------|------------|-------------|
| `loadExtraData(index)` | index defaults to 0 | Load extra metadata (gyroscope, exposure data, etc.); returns true on success |
| `getCount()` | — | Number of file segments (greater than 1 for multi-segment video) |
| `isExtraDataLoaded(index)` | index defaults to 0 | Whether the extra metadata of the given segment has been loaded |
| `loadThumbnail(index)` | index defaults to 0 | Load the thumbnail; returns null on failure |
| `getIdenticalKey(index)` | index defaults to 0 | Unique file identifier key |
| `getWidth(index)` / `getHeight(index)` | index defaults to 0 | Width / height (pixels) |
| `getBitrate(index)` | index defaults to 0 | Bitrate (bps) |
| `getFps(index)` | index defaults to 0 | Frame rate |
| `getCreationTime(index)` | index defaults to 0 | Creation time (millisecond timestamp) |
| `getFirstFrameTimeOffset(index)` | index defaults to 0 | Time offset of the first frame (milliseconds) |
| `getRollingShutterTime(index)` | index defaults to 0 | Rolling shutter time (seconds) |
| `getDurationInMs(index)` | index defaults to 0 | Duration of one segment (milliseconds) |
| `getTotalDurationInMs()` | — | Total duration of all file segments (milliseconds) |
| `getFileSize()` | — | Total file size (bytes) |
| `getCameraType()` | — | Model name of the camera that captured this file |
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
| `supportPureShotGenerate()` | Whether PureShot compositing is supported |
| `supportHdrGenerate()` | Whether HDR compositing is supported |

**File operations**

| Method | Style | Description |
|--------|-------|-------------|
| `download(progressCallback?)` | Coroutine | Download to local storage; returns the list of local file paths. `progressCallback` receives `(total size, downloaded size)` (bytes) |
| `delete()` | Coroutine | Delete this file from the camera |

---

### WorkWrapper

The abstract base class of `IWorkWrapper`; implements `Comparable<WorkWrapper>`. Subclasses provide concrete implementations depending on the file's source (camera or local).

```kotlin
abstract class WorkWrapper(
    val httpPrefix: String = "",
    val downloadHttpPrefix: String = httpPrefix
) : IWorkWrapper, Comparable<WorkWrapper>
```

| Property | Description |
|----------|-------------|
| `httpPrefix` | The file server's HTTP prefix address (used for camera files). Intended for consumers that need to access the camera directly; over Wi-Fi Aware this is a bare IPv6 address |
| `downloadHttpPrefix` | The prefix to use when downloading assets (used by the SDK's internal downloads). Over Wi-Fi Aware this is a placeholder hostname (resolved through dynamic DNS) so that OkHttp does not reject the zone-id syntax of a bare IPv6 address; for all other connection types it matches `httpPrefix` |

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
| `timestamp` | Data timestamp (milliseconds) |

---

### ExposureData

Exposure data for a single frame.

```kotlin
data class ExposureData(val shutterSpeeds: Double, val timestamp: Long)
```

| Property | Description |
|----------|-------------|
| `shutterSpeeds` | Shutter speed (seconds) |
| `timestamp` | Data timestamp (milliseconds) |

**Parsing native data**

```kotlin
ExposureData.byteArray2ExposureData(bytes: ByteArray?, stride: Int): List<ExposureData>
```

Parses a native exposure data byte stream into a list of `ExposureData` using a fixed stride. Returns an empty list when `bytes` is null or shorter than one `stride`. `stride` is the number of bytes occupied by one frame of data.

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
| `stitchSeparatedFisheye(workWrapper, outputFilePath): Result<Unit>` | Automatically detect the parts of the asset that need stitching and stitch the fisheye images |
| `stitchSeparatedFisheye(templateBlenderParams): Result<Unit>` | Stitch two fisheye images into a panorama |
| `generateHDR(workWrapper, outputFilePath): Result<Unit>` | HDR compositing |
| `generatePureShot(workWrapper, outputFilePath, algoFolderPath): Result<Unit>` | PureShot compositing; `algoFolderPath` is the path of the directory containing the algorithm models |

> All four methods above are coroutine suspend functions.

---

### TemplateBlenderParams

Stitching parameters for two fisheye images.

```kotlin
class TemplateBlenderParams(
    val inputFilePath1: String,   // Local file path of the first fisheye image
    val inputFilePath2: String,   // Local file path of the second fisheye image
    val outputFilePath: String,   // Output path of the stitched result
)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isColorAdjustment` | Boolean | false | Whether to enable color correction |
| `blendAngle` | Float | 8f | Blend region angle (degrees) |
| `mapSizeWidth` | Int | 200 | Mapping texture width |
| `mapSizeHeight` | Int | 100 | Mapping texture height |
| `fisheyeArrangement` | `FisheyeArrangement` | SEPERATED | Arrangement of the two fisheye images |

### FisheyeArrangement

| Value | nativeValue | Description |
|-------|-------------|-------------|
| `CONNECTED` | 0 | Horizontally joined (side by side) |
| `VCONNECTED` | 1 | Vertically joined (stacked) |
| `SEPERATED` | 2 | Separated (two independent images) |

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
| `exportVideoToImage(imageExportParams, callback)` | Export specific frames of a video as images (frame timestamps are given via `ImageExportParams.timestampList`) |
| `stopExport(exportId: Int)` | Cancel the given export task (`exportId` comes from `IExportCallback.onStart`) |

---

### IExportCallback

Callback interface for export tasks.

```kotlin
interface IExportCallback
```

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onStart(id: Int)` | id: task ID | Export task started; use the ID to cancel the task |
| `onSuccess()` | — | Export succeeded |
| `onFail(throwable: Throwable)` | throwable: failure cause | Export failed |
| `onCancel()` | — | Export was cancelled |
| `onProgress(progress: Float)` | progress: 0.0–1.0 | Export progress (empty default implementation) |

---

### ExportParams

The common export parameter configuration class; every export parameter class extends it.

```kotlin
open class ExportParams(workWrapper: WorkWrapper) : MediaParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `exportMode` | `ExportMode` | PANORAMA | Export mode (panorama / sphere) |
| `targetPath` | String? | null | Output file path; null means the default path is used |
| `isUseSoftwareDecoder` | Boolean | false | Whether to use the software decoder |
| `width` / `height` | Int | -1 | Output resolution (-1 means the default is used) |
| `isDenoise` | Boolean | false | Whether to enable denoising |
| `distance` | Float | 0f | Viewing distance (0 means the default is used) |
| `fov` | Float | 0f | Field of view (degrees; 0 means the default is used) |
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
| `isUseSoftwareEncoder` | Boolean | false | Whether to use the software encoder (the hardware encoder is used by default) |
| `bitrate` | Int | -1 | Target bitrate (bps; -1 uses the default) |
| `fps` | Int | -1 | Target frame rate (-1 uses the default) |
| `roll` | Float | 0f | Video image roll angle (degrees) |

---

### ImageExportParams

Image export parameters.

```kotlin
class ImageExportParams(workWrapper: WorkWrapper) : ExportParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `index` | Int | 0 | Index of the frame to export |
| `timestampList` | `List<Double>` | emptyList | Timestamps (seconds) of the frames to export; when empty, `index` is used |

---

## 4. Players

### Player hierarchy

```
BasePlayer
├── VideoPlayer   (: StreamPlayer, BasePlayer, LocalPlayer)
├── ImagePlayer   (: BasePlayer, LocalPlayer)
└── PreviewPlayer (: StreamPlayer, BasePlayer)

StreamPlayer   — pause / resume / isPlaying
LocalPlayer    — marker interface indicating local file playback support
```

---

### BasePlayer

The base interface for every player (video, image, and preview).

```kotlin
interface BasePlayer
```

**Playback control**

| Method | Description |
|--------|-------------|
| `play()` | Start playback |
| `isLoading(): Boolean` | Whether the player is loading |
| `isPrepared(): Boolean` | Whether preparation has completed (ready to play) |
| `destroy()` | Destroy the player and release all related resources |

**Gesture control**

| Method | Description |
|--------|-------------|
| `setGestureEnabled(enabled)` / `isGestureEnabled(): Boolean` | Master switch for gesture interaction |
| `setGestureHorizontalEnabled(enabled)` / `isGestureHorizontalEnabled(): Boolean` | Horizontal gestures (swipe left/right to rotate the view) |
| `setGestureVerticalEnabled(enabled)` / `isGestureVerticalEnabled(): Boolean` | Vertical gestures (swipe up/down to rotate the view) |
| `setGestureZoomEnabled(enabled)` / `isGestureZoomEnabled(): Boolean` | Zoom gesture (pinch to change the FOV) |
| `setGestureListener(listener: PlayerGestureListener?)` | Set the gesture event listener; pass null to remove it |

**Lens modes**

| Method | Description |
|--------|-------------|
| `switchNormalMode()` | Switch to normal (flat) mode |
| `switchFisheyeMode()` | Switch to fisheye mode |
| `switchPerspectiveMode()` | Switch to perspective mode |

**View control**

| Method | Description |
|--------|-------------|
| `setConstraint(widthRatio, heightRatio, minFov, maxFov, defaultFov, minDistance, maxDistance, defaultDistance)` | Set the view constraints: `widthRatio` / `heightRatio` are the aspect ratio components (-1 means unconstrained); the rest are the minimum / maximum / default FOV and viewing distance |
| `getFov(): Float` | Current field of view (degrees) |
| `getDistance(): Float` | Current viewing distance |
| `getYaw(): Float` | Current yaw (radians) |
| `getPitch(): Float` | Current pitch (radians) |
| `getRoll(): Float` | Current roll (radians) |

**Rendering settings**

| Method | Description |
|--------|-------------|
| `setScreenRatio(ratioX, ratioY)` | Set the render view's aspect ratio |
| `getScreenRatio(): Pair<Int, Int>` | Get the current aspect ratio (width, height) |
| `setStabType(type: StabType)` / `getStabType(): StabType` | Stabilization type |
| `setOffsetType(type: OffsetType)` / `getOffsetType(): OffsetType` | Lens offset type (lens guard, dive case, and other accessories) |
| `setColorFusionEnabled(enabled)` / `isColorFusionEnabled(): Boolean` | Color fusion (chromatic aberration removal) |
| `setDynamicStitchEnabled(enabled)` / `isDynamicStitchEnabled(): Boolean` | Dynamic stitching |
| `setColorPlusEnabled(enabled)` / `isColorPlusEnabled(): Boolean` | Color Plus |
| `setColorPlusFilterIntensity(intensity)` / `getColorPlusFilterIntensity(): Float` | Color Plus filter intensity (typically 0.0–1.0) |
| `setDePurpleFilterEnable(enabled)` / `getDePurpleFilterEnable(): Boolean` | Purple-fringe removal filter |
| `setListener(listener: PlayerViewListener?)` | Set the player view event listener; pass null to remove it |

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

The video player; extends `StreamPlayer`, `BasePlayer`, and `LocalPlayer` with video playback control, seeking, looping, volume control, and the LRV low-resolution preview.

```kotlin
interface VideoPlayer : StreamPlayer, BasePlayer, LocalPlayer
```

| Method | Description |
|--------|-------------|
| `prepare(params: VideoPlayerParams)` | Initialize and prepare the video player |
| `setVideoStatusListener(listener: VideoStatusListener?)` | Set the video playback status listener; pass null to remove it |
| `seekTo(position: Long)` | Seek to the given playback position (milliseconds) |
| `isSeeking(): Boolean` | Whether a seek operation is in progress |
| `getCurrentPosition(): Long` | Current playback position (milliseconds) |
| `getDuration(): Long` | Total video duration (milliseconds) |
| `isLooping(): Boolean` / `setLooping(isLooping: Boolean)` | Whether looping is enabled |
| `setVolume(volume: Float)` | Set the playback volume (0.0 mute – 1.0 maximum) |
| `setLrvEnable(enabled: Boolean)` / `isLrvEnable(): Boolean` | Whether the low-resolution preview (LRV) is enabled |

---

### ImagePlayer

The image player; loads and displays panoramic photos.

```kotlin
interface ImagePlayer : BasePlayer, LocalPlayer
```

| Method | Description |
|--------|-------------|
| `prepare(params: ImagePlayerParams)` | Initialize and prepare the image player |

---

### LocalPlayer

Marker interface for local file players. It identifies the players that support local file playback (`VideoPlayer`, `ImagePlayer`) and distinguishes them from streaming players (`StreamPlayer`).

```kotlin
interface LocalPlayer
```

---

### PreviewPlayer

The camera preview player; extends `StreamPlayer` and `BasePlayer` with preview stream initialization, resolution / frame rate settings, crop information updates, and rotation detection.

```kotlin
interface PreviewPlayer : StreamPlayer, BasePlayer
```

| Method | Description |
|--------|-------------|
| `prepare(params: PreviewParams)` | Initialize and prepare the preview player |
| `destroyRender()` | Destroy the renderer; must be called before restarting the player |
| `setPreviewResolution(width, height)` | Set the preview resolution (pixels) |
| `setFps(fps: Int)` | Set the preview frame rate |
| `getPreviewWidth(): Int` / `getPreviewHeight(): Int` | Current preview width and height (pixels) |
| `getFps(): Int` | Current preview frame rate |
| ~~`setOffset(offsetData, stabOffset)`~~ | Deprecated: empty implementation; calling it only logs a warning and has no effect. The player holds the authoritative calibration from `prepare()` onward |
| `setWindowCropInfo(cropInfo: WindowCropInfo)` | Set the window crop information (used for panoramic stitching); when the crop window changes, the player recomputes the offset from the live calibration itself |
| `getWindowCropInfo(): WindowCropInfo?` | Get the current window crop information; returns null if not set |
| `showPlayView()` / `hidePlayView()` | Show / hide the playback view |
| `getPipeline(): KMPCameraPreviewPipeline?` | Get the current preview rendering pipeline; returns null if not initialized |
| `updateRotate(rotateDegreeContent, rotateDegree, cameraPosture, cameraPostureCorrected)` | Update the preview image rotation (content rotation angle, overall rotation angle, camera posture value, corrected camera posture value) |
| `redetectCameraRotation()` | Re-detect the camera's rotation |

---

## 5. Player Parameters

### MediaParams

The common base class for every media parameter class; holds the asset wrapper object from which subclasses derive their playback and export parameters.

```kotlin
open class MediaParams(val workWrapper: WorkWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `workWrapper` | `WorkWrapper` | — | The associated asset wrapper object (constructor parameter) |
| `isDePurpleFilterOn` | Boolean | false | Purple-fringe removal |
| `isColorFusion` | Boolean | false | Chromatic aberration removal |
| `isDynamicStitch` | Boolean | true | Dynamic stitching |
| `stabType` | `StabType` | AUTO | Stabilization type |
| `offsetType` | `OffsetType` | ORIGINAL | Lens guard stitching (lens offset type) |
| `screenRatio` | IntArray | [-1, -1] | Aspect ratio (-1 means unconstrained) |
| `colorPlusEnable` | Boolean | false | Color Plus toggle |
| `colorPlusFilterIntensity` | Float | 1.0f | Color Plus intensity |
| `urlForAction` | String | "" | The URL used for playback or export |

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
| `isWithSwitchingAnimation` | Boolean | false | Whether to animate lens mode switches |

---

### VideoPlayerParams

Video player parameters; extends `PlayerParams`.

```kotlin
class VideoPlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `loadingImageResId` | Int | -1 | Resource ID of the loading placeholder image (-1 means none) |
| `loadingBackgroundColor` | Int | black | Loading background color (ARGB integer) |
| `isAutoPlayAfterPrepared` | Boolean | true | Whether to play automatically once prepared |
| `isLooping` | Boolean | true | Whether to loop playback |
| `isLrvEnable` | Boolean | false | Whether to enable the low-resolution preview (LRV) |
| `isVideoHwaccelEnabled` | Boolean | true | Whether to enable hardware-accelerated video decoding |

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

Camera preview parameter configuration.

```kotlin
data class PreviewParams(
    var width: Int = -1,
    var height: Int = -1,
    var fps: Int = -1,
    var screenRatio: Pair<Int, Int> = -1 to -1,
    var stabType: StabType? = null,
    var isGestureEnabled: Boolean = true,
    var isCopyVideoHwaccel: Boolean = true,
    var isVideoHwaccelEnabled: Boolean = true,
    var isColorFusion: Boolean = true,
    var stabCacheFrameNum: Int = -1,
    var isOnlyStitchSurfaceRender: Boolean = false,
    var renderModel: RenderModel? = null,
    var isRenderAtOnce: Boolean = false,
    var cameraRenderSurface: KMPSurface? = null,
    var cameraRenderSurfaceWidth: Int = -1,
    var cameraRenderSurfaceHeight: Int = -1,
)
```

| Property | Default | Description |
|----------|---------|-------------|
| `width` / `height` | -1 | Preview resolution (-1 means the default is used) |
| `fps` | -1 | Preview frame rate (-1 means the default is used) |
| `screenRatio` | -1 to -1 | Render view aspect ratio (-1 to -1 means unconstrained) |
| `stabType` | null | Stabilization type (null means the default is used) |
| `isGestureEnabled` | true | Whether to enable gesture interaction |
| `isCopyVideoHwaccel` | true | Whether to use hardware acceleration to copy video frames |
| `isVideoHwaccelEnabled` | true | Whether to enable hardware-accelerated video decoding |
| `isColorFusion` | true | Whether to enable color fusion (chromatic aberration removal) |
| `stabCacheFrameNum` | -1 | Number of frames cached for stabilization (-1 means the default is used) |
| `isOnlyStitchSurfaceRender` | false | Whether to render only to the specified Surface without displaying on the View |
| `renderModel` | null | Rendering mode (null means the default is used) |
| `isRenderAtOnce` | false | Whether to start rendering immediately (without waiting for the first frame) |
| `cameraRenderSurface` | null | The target render Surface (null means render to the default View) |
| `cameraRenderSurfaceWidth` / `cameraRenderSurfaceHeight` | -1 | Width and height of the render Surface (pixels; -1 means the default is used) |

---

## 6. Player Listeners

### VideoStatusListener

Video playback status callbacks, set via `VideoPlayer.setVideoStatusListener()`.

```kotlin
interface VideoStatusListener
```

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onProgressChanged(position, length)` | Current playback position / total video duration (milliseconds) | Playback progress changed |
| `onPlayStateChanged(isPlaying)` | isPlaying: whether playback is in progress | Play / pause state changed |
| `onSeekComplete()` | — | The seek finished |
| `onComplete()` | — | Playback finished |
| `onPlayingFluencyResult(fluentFactor, srcTime, detectTime)` | fluentFactor: smoothness coefficient; srcTime: source time; detectTime: detection time | Playback smoothness measurement, taken once per second. A successful measurement returns `fluentFactor` in [0,1]; [0.65,1] counts as smooth, and -1 means the measurement failed. Empty default implementation |

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
| `isPanoLive(): Boolean` | — | Whether the current live stream is a panoramic live stream; override it according to the actual live stream type. Returns false by default |

---

### PlayerGestureListener

Player gesture event callbacks, set via `BasePlayer.setGestureListener()`. Every method has an empty default implementation; override only what you need.

```kotlin
interface PlayerGestureListener
```

| Callback | Description |
|----------|-------------|
| `onDown(event): Boolean` | Finger down; return true to consume this event |
| `onTap(event): Boolean` | Tap; return true to consume this event |
| `onUp()` | Finger up |
| `onLongPress(event)` | Long press |
| `onZoom()` | Zoom gesture started |
| `onZoomAnimation()` | Zoom animation in progress |
| `onZoomAnimationEnd()` | Zoom animation finished |
| `onScroll()` | Scroll gesture |
| `onFlingAnimation()` | Fling animation in progress |
| `onFlingAnimationEnd()` | Fling animation finished |

---

### PlayerListener

General player event listener interface.

```kotlin
interface PlayerListener
```

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onPlayPaused()` | — | Playback paused |
| `onError(code, message)` | code: error code; message: error description | A playback error occurred |
| `onProgressUpdate(positionMs, durationMs)` | positionMs: current playback position; durationMs: total media duration (milliseconds) | Playback progress updated |

---

## 7. Rendering Configuration and Enums

### ExportMode

Export mode; determines the image projection used for export.

| Value | Description |
|-------|-------------|
| `PANORAMA` | Flat panoramic projection (equirectangular) |
| `SPHERE` | Spherical projection |

---

### OffsetType

Lens offset type (accessory stitching offset). Specifies which accessory is mounted on the camera during playback or export so the matching lens distortion correction parameters are applied.

| Value | value | Description |
|-------|-------|-------------|
| `ORIGINAL` | 0 | No accessory; use the original offset |
| `PROTECTOR_FASTEN` | 1 | Snap-on lens guard stitching |
| `DIVING_WATER` | 2 | Dive case, underwater (legacy) |
| `DIVING_AIR` | 3 | Dive case, above water (legacy) |
| `WATERPROOF` | 4 | Waterproof case |
| `PROTECTOR_ADHERE` | 5 | Adhesive lens guard stitching |
| `DIVING_INVISIBLE_WATER` | 6 | Invisible dive case, underwater (fully invisible dive case) |
| `DIVING_INVISIBLE_AIR` | 7 | Invisible dive case, above water (fully invisible dive case) |
| `PROTECTOR_A` | 8 | Grade A lens guard (plastic); currently supported on X3 and X4 only |
| `PROTECTOR_S` | 9 | Grade S lens guard (glass); currently supported on X3 and X4 only |
| `PROTECTOR_AS_AVERAGE` | 10 | Averaged A/S lens guard (uses the combined average distortion curve of grades A and S; effectively a virtual lens guard) |

---

### StabType

Stabilization algorithm type; specifies the stabilization strategy used by the player or during export.

| Value | nativeValue | Description |
|-------|-------------|-------------|
| `AUTO` | -99 | Automatically choose the best stabilization algorithm |
| `STAB_OFF` | -1 | Stabilization off |
| `STAB_STILL` | 0 | Full lock: the viewpoint is locked to an absolute direction; yaw, pitch and roll do not change |
| `STAB_Z_DIRECTIONAL` | 1 | Z-axis stabilization: yaw follows, pitch and roll are locked; panoramic footage only |
| `STAB_FULL_DIRECTIONAL` | 2 | Horizon leveling: yaw and pitch follow, roll is locked; panoramic footage only |
| `STAB_FREE_FOOTAGE` | 4 | Motion smoothing: yaw, pitch and roll all follow the viewpoint but are smoothed by FlowState; also works for non-panoramic footage |

> `StabType.nativeOf(value: Int?): StabType` — looks up the enum value matching the underlying raw value; returns `AUTO` if there is no match.

---

### RenderModel

Rendering mode; determines how the panoramic image is projected during preview and playback.

| Value | nativeValue | Description |
|-------|-------------|-------------|
| `PLANE_STITCH` | 11 | Split rendering: fuses the two video streams and lays the whole preview image flat on a single plane |
| `PLANE` | 20 | Split rendering: divides the image into two parts and shows the two video streams separately as fisheye images |
| `AUTO` | 0 | Fused rendering: fuses the two video streams into one complete preview image |

---

### DisplayType

Video / image rendering display type.

| Value | rawValue |
|-------|----------|
| `Auto` | 0 |
| `SphereAuto` | 1 |
| `SphereStitch` | 2 |
| `SphereEquirectangular` | 3 |
| `SphereFisheyeDewarp` | 4 |
| `CubeTileProjection` | 5 |
| `SphereCubemap` | 6 |
| `PlaneCubemap2Equi` | 7 |
| `PlaneCubeTile2Equi` | 8 |
| `PlaneAuto` | 10 |
| `PlaneStitch` | 11 |
| `PlaneEquirectangular` | 12 |
| `PlaneFisheyeDewarp` | 13 |
| `Plane` | 20 |

---

### OpticalFlowType

Optical flow algorithm type.

| Value | rawValue | Description |
|-------|----------|-------------|
| `DynamicStitch` | 0 | Dynamic stitching |
| `Disflow` | 1 | Disflow optical flow algorithm |
| `AiFlow` | 2 | AI optical flow algorithm |

---

### ImageLayout

Image layout.

| Value | rawValue | Description |
|-------|----------|-------------|
| `HorizontalMerged` | 0 | Horizontally merged |
| `OneBulletTime` | 1 | Single Bullet Time frame |
| `Respective2Images` | 2 | Two independent images |
| `LeftHalf` | 3 | Left half |
| `RightHalf` | 4 | Right half |
| `TopHalf` | 5 | Top half |
| `BottomHalf` | 6 | Bottom half |
| `LeftRight` | 7 | Left-right split |
| `TopBottom` | 8 | Top-bottom split |

---

### ProtectOffsetConvertOption

Lens guard accessory type; a bit-flag enum whose values can be combined with a bitwise OR.

| Value | rawValue |
|-------|----------|
| `None` | 0 |
| `EnableWaterProof` | 1 shl 0 |
| `EnableDivingAir` | 1 shl 1 |
| `EnableDivingWater` | 1 shl 2 |
| `EnableDivingAirV2` | 1 shl 3 |
| `EnableDivingWaterV2` | 1 shl 4 |
| `EnableBuckleShell` | 1 shl 5 |
| `EnableAdhesiveShell` | 1 shl 6 |
| `EnableGlassShell` | 1 shl 7 |
| `EnablePlasticCement` | 1 shl 8 |
| `EnableAverageShell` | 1 shl 9 |
| `EnableNDFilter` | 1 shl 10 |
| `EnableDivingWaterPro` | 1 shl 11 |
| `EnableDivingAirPro` | 1 shl 12 |

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
    val wrapper: WorkWrapper?, // Media file wrapper; takes higher precedence
    val startTimeMs: Int,      // Clip start position (milliseconds)
    val endTimeMs: Int         // Clip end position (milliseconds)
)
```

---

## 8. Shared Data Types

The types below are shared by the Camera SDK and the Media SDK and are listed here for reference.

### KMPCameraPreviewPipeline

Used in both the Camera SDK and the Media SDK:

- Camera SDK: `CameraPreview.setPipeline(pipeline)` — inject the pipeline into the camera preview
- Media SDK: `PreviewPlayer.getPipeline()` — get the current rendering pipeline

The pipeline object is created on the Media SDK side and passed to the camera side, where it serves as the transport channel for preview data.

---

### PreviewStreamParamsUpdate (Camera → Media)

When the camera's preview stream parameters change, this object is delivered through `CameraStreamListener.onParamsChanged()`. On the media side, `PreviewPlayer.setWindowCropInfo()` is typically updated from the crop window in this object. The player maintains `offsetData` and `stabOffset` itself from the camera configuration, and the corresponding `setOffset()` is deprecated as an empty implementation.

---

### ModelManager

The model management entry point; it has no public members in the current version.

```kotlin
object ModelManager
```
