# Media SDK Integration Guide

The Media SDK (`sdk-media`) provides playback, export, image stitching, and live preview rendering for media captured by Insta360 cameras. It supports local playback of panoramic videos and photos, frame export, HDR compositing, and camera live preview.

---

## Contents

1. [SDK Initialization](#1-sdk-initialization)
2. [Media File Management](#2-media-file-management)
3. [Video Playback](#3-video-playback)
4. [Photo Playback](#4-photo-playback)
5. [Camera Preview Integration](#5-camera-preview-integration)
6. [Media Export](#6-media-export)
7. [Image Stitching](#7-image-stitching)

---

## 1. SDK Initialization

Initialize the SDK in `Application.onCreate()`. All other media features depend on this step.

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        InstaMediaSDK.init(this)
    }
}
```

---

## 2. Media File Management

`WorkManager` is the single entry point for retrieving media files, and `WorkWrapper` encapsulates everything about one capture result.

### 2.1 Listing Media Files

```kotlin
// Local media files (synchronous, safe to call from any thread)
val localWorks: List<WorkWrapper> = WorkManager.getAllLocalWorks()

// Media files on the camera (coroutine, requires an active camera connection)
// Note: the Camera SDK must have completed the device connection
viewModelScope.launch(Dispatchers.IO) {
    val result = WorkManager.getAllCameraWorks()
    result.onSuccess { works ->
        // Each WorkWrapper corresponds to one capture result on the camera
    }.onFailure { e ->
        // Handle errors such as a disconnected camera or network failure
    }
}
```

---

### 2.2 Reading Basic File Information

```kotlin
val work: WorkWrapper = ...  // From WorkManager

// File type checks (they determine how you play or process the file)
val isVideo   = work.isVideo()
val isPhoto   = work.isPhoto()
val isPanorama = work.isPanoramaFile()

// Capture mode checks
val isHDR      = work.isHDRVideo() || work.isHDRPhoto()
val isBullet   = work.isBulletTime()
val isTimeLapse = work.isTimeLapse()
val isNormalVideo = work.isNormalVideo()

// Basic properties
val width     = work.getWidth()               // Width in pixels
val height    = work.getHeight()              // Height in pixels
val duration  = work.getTotalDurationInMs()   // Total duration (milliseconds)
val fileSize  = work.getFileSize()            // File size (bytes)
val createAt  = work.getCreationTime()        // Creation time (millisecond timestamp)
val cameraModel = work.getCameraType()        // Model of the capturing camera
```

---

### 2.3 Loading Extra Metadata

Gyroscope and exposure data must be loaded separately; do it on an IO thread:

```kotlin
// Must be called on an IO thread
withContext(Dispatchers.IO) {
    work.loadExtraData()
}

// The data below is only available once loading has completed
if (work.isExtraDataLoaded()) {
    val gyroData     = work.getGyroData()      // Gyroscope data array
    val exposureData = work.getExposureData()  // Exposure data array
}
```

---

### 2.4 Loading a Thumbnail

```kotlin
// Load on an IO thread; returns a KMPImage (a Bitmap on Android)
val thumbnail: KMPImage? = withContext(Dispatchers.IO) {
    work.loadThumbnail()
}
```

---

### 2.5 Downloading Camera Files Locally

Applies to `WorkWrapper` instances obtained from the camera (`isCameraFile() == true`).

```kotlin
viewModelScope.launch {
    work.download(
        progressCallback = { totalSize, downloadedSize ->
            val percent = (downloadedSize * 100f / totalSize).toInt()
            // Update the progress UI
        }
    ).onSuccess { localPaths ->
        // localPaths are the local paths of the downloaded files
    }.onFailure { e ->
        // Handle the download failure
    }
}
```

---

### 2.6 Deleting Camera Files

```kotlin
viewModelScope.launch {
    work.delete()
        .onSuccess { /* Deleted — refresh the list */ }
        .onFailure { /* Handle the failure */ }
}
```

---

## 3. Video Playback

`InstaVideoPlayerView` is the UI component for video playback. Load the media metadata before playing.

### 3.1 Basic Usage

```kotlin
// 1. Create the player view (declare it in a layout or create it in code)
val playerView = InstaVideoPlayerView(context)
playerView.setLifecycle(lifecycle)  // Bind the lifecycle to handle pause/resume automatically

// 2. Load the metadata (must run on an IO thread)
viewModelScope.launch {
    withContext(Dispatchers.IO) { work.loadExtraData() }

    if (!work.isExtraDataLoaded()) {
        // Loading failed — playback cannot continue
        return@launch
    }

    // 3. Configure the playback parameters
    val params = VideoPlayerParams(work).apply {
        isLooping = true                    // Loop playback
        isAutoPlayAfterPrepared = true      // Play automatically once prepared
        isLrvEnable = false                 // Prefer the low-resolution preview file (LRV)
        renderModel = RenderModel.AUTO      // Rendering mode
    }

    // 4. Initialize the player
    playerView.prepare(params)
    playerView.play()
}

// 5. Release resources when destroyed (call this in onDestroy)
playerView.destroy()
```

---

### 3.2 Monitoring Player State

```kotlin
playerView.setListener(object : PlayerViewListener {
    override fun onLoadingStatusChanged(isLoading: Boolean) {
        // Use this to show or hide a loading animation
    }
    override fun onLoadingFinish() {
        // The player finished loading and is about to render
    }
    override fun onFirstFrameRendered() {
        // The first frame is rendered — you can hide the cover image
    }
    override fun onFail(exception: InstaException) {
        // Playback error; exception.message contains the description
    }
    override fun onReleaseCameraPipeline() {
        // Only meaningful for camera live preview; ignore it for local playback
    }
})
```

---

### 3.3 Monitoring Playback Progress

```kotlin
playerView.setVideoStatusListener(object : VideoStatusListener {
    override fun onProgressChanged(position: Long, length: Long) {
        // position and length are both in milliseconds; use them to update the progress bar
    }
    override fun onPlayStateChanged(isPlaying: Boolean) {
        // Update the play/pause button
    }
    override fun onSeekComplete() {
        // The seek finished
    }
    override fun onComplete() {
        // Playback finished (non-looping mode)
    }
})
```

---

### 3.4 Playback Control

```kotlin
playerView.pause()
playerView.resume()
playerView.seekTo(positionMs = 5_000L)   // Jump to the 5-second mark
playerView.setVolume(0.8f)               // 0.0 (muted) to 1.0 (maximum)
playerView.setLooping(true)

// Query state
val position  = playerView.getCurrentPosition()   // Current position (milliseconds)
val duration  = playerView.getDuration()          // Total duration (milliseconds)
val isPlaying = playerView.isPlaying()
val isSeeking = playerView.isSeeking()
```

---

### 3.5 View and Rendering Control

These APIs come from `BasePlayer` and are supported by the video player, the image player, and the preview player alike.

```kotlin
// Switch the lens display mode
playerView.switchNormalMode()       // Normal (flat stitching)
playerView.switchFisheyeMode()      // Original fisheye
playerView.switchPerspectiveMode()  // Perspective (Tiny Planet / Crystal Ball)

// Gesture control
playerView.setGestureEnabled(true)
playerView.setGestureZoomEnabled(true)
playerView.setGestureHorizontalEnabled(true)
playerView.setGestureVerticalEnabled(true)

// Constrain the view (limit how far the user can rotate or zoom)
playerView.setConstraint(
    widthRatio = -1, heightRatio = -1,  // -1 means the ratio is unconstrained
    minFov = 10f, maxFov = 120f, defaultFov = 90f,
    minDistance = 1f, maxDistance = 10f, defaultDistance = 5f
)

// Specify the accessory type to apply the matching lens correction parameters
playerView.setOffsetType(OffsetType.PROTECTOR_FASTEN)  // Snap-on lens guard

// Stabilization type
playerView.setStabType(StabType.PANORAMA)

// Rendering effects
playerView.setColorFusionEnabled(true)    // Chromatic aberration removal
playerView.setDynamicStitchEnabled(true)  // Dynamic stitching
playerView.setDePurpleFilterEnable(true)  // Purple-fringe removal

// Aspect ratio
playerView.setScreenRatio(16, 9)
```

---

## 4. Photo Playback

`InstaImagePlayerView` displays panoramic photos and works much like the video player.

```kotlin
// 1. Create the image player view
val playerView = InstaImagePlayerView(context)
playerView.setLifecycle(lifecycle)

// 2. Load the metadata (IO thread)
viewModelScope.launch {
    withContext(Dispatchers.IO) { work.loadExtraData() }

    if (!work.isExtraDataLoaded()) return@launch

    // 3. Configure the parameters
    val params = ImagePlayerParams(work).apply {
        index = 0           // Which image to show when there are several
        renderModel = RenderModel.AUTO
    }

    // 4. Initialize the player
    playerView.prepare(params)
    playerView.play()
}

// 5. Destroy
playerView.destroy()
```

> The view and gesture control APIs are identical to the video player's; see [section 3.5](#35-view-and-rendering-control).

---

## 5. Camera Preview Integration

`PreviewPlayer` (`InstaPreviewPlayerView`) renders the camera's live preview stream.

> Prerequisite: the Camera SDK has connected to a camera and started the preview stream. The preview player establishes its data path with the camera preview through a `KMPCameraPreviewPipeline`, which must be configured on both the camera side and the media side to take effect. For the Camera SDK side, see [Camera SDK Integration Guide §5 Live Preview](../camera-integration/#_5-live-preview).

### 5.1 Basic Usage

```kotlin
// 1. Create the preview player view
val previewView = InstaPreviewPlayerView(context)  // or InstaCapturePlayerView
previewView.setLifecycle(lifecycle)

// 2. Configure the preview parameters
val params = PreviewParams(
    stabType         = StabType.PANORAMA,
    isColorFusion    = true,
    isGestureEnabled = true,
    renderModel      = RenderModel.AUTO
)

// 3. Initialize the player (call this after the camera stream is open)
previewView.prepare(params)
previewView.play()

// 4. Wire up the pipeline in PlayerViewListener.onLoadingFinish
// The pipeline is created on the media side; preview data only reaches the player
// for rendering once it has been injected into the camera side
previewView.setListener(object : PlayerViewListener {
    override fun onLoadingFinish() {
        val pipeline = previewView.getPipeline() ?: return
        // Pass the pipeline to CameraDevice.preview.setPipeline(pipeline)
        // This call belongs on the Camera SDK side (wherever you hold the CameraDevice)
    }
    override fun onReleaseCameraPipeline() {
        // When the pipeline is released, clear it on the camera side too:
        // CameraDevice.preview.setPipeline(null)
    }
    override fun onFail(exception: InstaException) {}
    override fun onLoadingStatusChanged(isLoading: Boolean) {}
    override fun onFirstFrameRendered() {}
})
```

---

### 5.2 Syncing Camera Stream Parameters

When the camera stream's resolution, offsets, or crop information change (observed through `CameraStreamListener.onParamsChanged`), sync them to the preview player:

```kotlin
// The calls below usually run inside the CameraStreamListener.onParamsChanged callback.
// offsetData and stabOffset come from PreviewStreamParamsUpdate.

previewView.setOffset(
    OffsetData(offsetV1 = "...", offsetV2 = "...", offsetV3 = "..."),
    stabOffset = "..."
)

previewView.setPreviewResolution(width = 1280, height = 960)
previewView.setFps(fps = 30)

previewView.setWindowCropInfo(
    MediaWindowCropInfo(srcWidth, srcHeight, dstWidth, dstHeight, offsetX, offsetY)
)
```

---

### 5.3 Stopping the Preview

```kotlin
previewView.pause()   // Pause
previewView.resume()  // Resume

// Destroy it when leaving the screen
previewView.destroy()
```

---

## 6. Media Export

`ExporterManager` is the singleton entry point for export and supports three modes: image export, video export, and frame extraction from video.

> Prerequisites: you hold a `WorkWrapper` instance and its metadata has been loaded (`work.loadExtraData()`).

### 6.1 Exporting a Video

```kotlin
val params = VideoExportParams(work).apply {
    targetPath = "/sdcard/output/video.mp4"  // Output path
    width      = 3840                         // Output resolution (-1 uses the default)
    height     = 1920
    fps        = 30                           // Output frame rate (-1 uses the default)
    bitrate    = 40_000_000                   // Output bitrate in bps (-1 uses the default)
    exportMode = ExportMode.PANORAMA          // Projection mode
    stabType   = StabType.PANORAMA            // Stabilization mode
    isDynamicStitch = true                    // Dynamic stitching
    isColorFusion   = true                    // Chromatic aberration removal
    offsetType = OffsetType.ORIGINAL          // Lens guard type (ORIGINAL when no accessory)
}

ExporterManager.exportVideo(params, object : IExportCallback {
    override fun onStart(id: Int) {
        // Use this id later with stopExport(id) to cancel the export
    }
    override fun onProgress(progress: Float) {
        // progress ranges from 0.0 to 1.0
        updateProgress((progress * 100).toInt())
    }
    override fun onSuccess() {
        // Export finished
    }
    override fun onFail(throwable: Throwable) {
        // Export failed
    }
    override fun onCancel() {
        // Export was cancelled
    }
})
```

---

### 6.2 Exporting an Image

```kotlin
val params = ImageExportParams(work).apply {
    targetPath = "/sdcard/output/photo.jpg"
    width      = 7680
    height     = 3840
    exportMode = ExportMode.PANORAMA
    offsetType = OffsetType.ORIGINAL
    // When grabbing frames from a video, specify their timestamps (seconds) via timestampList
    // timestampList = listOf(1.0, 3.5, 5.0)
}

ExporterManager.exportImage(params, object : IExportCallback {
    override fun onStart(id: Int) { /* Record the export id */ }
    override fun onSuccess() { /* Finished */ }
    override fun onFail(throwable: Throwable) { /* Failed */ }
    override fun onProgress(progress: Float) { /* Update progress */ }
    override fun onCancel() {}
})
```

---

### 6.3 Extracting Video Frames as Images

```kotlin
val params = ImageExportParams(work).apply {
    targetPath     = "/sdcard/output/"
    timestampList  = listOf(0.0, 2.5, 5.0)   // Timestamps to extract (seconds)
    exportMode     = ExportMode.PANORAMA
}

ExporterManager.exportVideoToImage(params, object : IExportCallback {
    override fun onStart(id: Int) {}
    override fun onSuccess() {}
    override fun onFail(throwable: Throwable) {}
    override fun onProgress(progress: Float) {}
    override fun onCancel() {}
})
```

---

### 6.4 Cancelling an Export

```kotlin
// exportId comes from the IExportCallback.onStart(id) callback
ExporterManager.stopExport(exportId)
```

---

## 7. Image Stitching

`StitchManager` provides fisheye stitching, HDR compositing, and PureShot compositing.

> Prerequisite: you hold a `WorkWrapper` instance. Before HDR or PureShot compositing, confirm support via `work.supportHdrGenerate()` / `work.supportPureShotGenerate()`.

### 7.1 Panorama Stitching (WorkWrapper)

For separated fisheye photos captured by the camera; the SDK identifies the files to stitch automatically:

```kotlin
viewModelScope.launch {
    StitchManager.stitchSeparatedFisheye(
        workWrapper    = work,
        outputFilePath = "/sdcard/output/stitched.jpg"
    ).onSuccess { /* Stitching finished */ }
     .onFailure { /* Stitching failed */ }
}
```

---

### 7.2 Panorama Stitching (explicit file paths)

For working directly with two fisheye image files:

```kotlin
val stitchParams = TemplateBlenderParams(
    inputFilePath1 = "/sdcard/fisheye_front.jpg",
    inputFilePath2 = "/sdcard/fisheye_back.jpg",
    outputFilePath = "/sdcard/output/stitched.jpg"
).apply {
    fisheyeArrangement = FisheyeArrangement.SEPERATED  // Two independent image files
    blendAngle         = 8f                             // Blend region angle (degrees)
    isColorAdjustment  = false                          // Whether to apply color correction
}

viewModelScope.launch {
    StitchManager.stitchSeparatedFisheye(stitchParams)
        .onSuccess { /* Stitching finished */ }
        .onFailure { /* Stitching failed */ }
}
```

---

### 7.3 HDR Compositing

Combines several AEB-bracketed photos into a single HDR image:

```kotlin
// Check whether this work supports HDR compositing first
if (!work.supportHdrGenerate()) return

viewModelScope.launch {
    StitchManager.generateHDR(
        workWrapper    = work,
        outputFilePath = "/sdcard/output/hdr.jpg"
    ).onSuccess { /* Compositing finished */ }
     .onFailure { /* Compositing failed */ }
}
```

---

### 7.4 PureShot Compositing

Combines several regular photos into one high-quality, denoised image:

```kotlin
if (!work.supportPureShotGenerate()) return

viewModelScope.launch {
    StitchManager.generatePureShot(
        workWrapper    = work,
        outputFilePath = "/sdcard/output/pureshot.jpg",
        algoFolderPath = "/sdcard/algo/"  // Directory holding the algorithm model files
    ).onSuccess { /* Compositing finished */ }
     .onFailure { /* Compositing failed */ }
}
```
