# Camera SDK Integration Guide

The Camera SDK (`sdk-camera`) provides connection management, capture control, live preview, file management, and firmware upgrade capabilities for Insta360 cameras, so you can integrate an Insta360 camera into your own Android app quickly.

---

## Contents

1. [SDK Initialization](#1-sdk-initialization)
2. [Device Connection](#2-device-connection)
   - [2.1 Creating a CameraDevice](#21-creating-a-cameradevice)
   - [2.2 Wi-Fi Connection](#22-wi-fi-connection)
   - [2.3 USB Connection](#23-usb-connection)
   - [2.4 BLE Connection](#24-ble-connection)
   - [2.5 Bootstrapping a Wi-Fi Connection over Bluetooth](#25-bootstrapping-a-wi-fi-connection-over-bluetooth)
   - [2.6 Bluetooth Wake-Up](#26-bluetooth-wake-up)
   - [2.7 Disconnecting and Releasing Resources](#27-disconnecting-and-releasing-resources)
   - [2.8 Detecting Unexpected Disconnections](#28-detecting-unexpected-disconnections)
3. [System State Monitoring](#3-system-state-monitoring)
4. [Capture Control and Parameters](#4-capture-control-and-parameters)
5. [Live Preview](#5-live-preview)
6. [File Management](#6-file-management)
7. [Firmware Upgrade](#7-firmware-upgrade)
8. [Wi-Fi Settings](#8-wi-fi-settings)
9. [Device Management](#9-device-management)

---

## 1. SDK Initialization

Initialize the SDK in `Application.onCreate()`. Every other module depends on this step, so it must run first.

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        InstaCameraSDK.init(this) {
            fileDir  = filesDir.absolutePath
            cacheDir = cacheDir.absolutePath
            logLevel = LogLevel.DEBUG
        }
    }
}
```

---

## 2. Device Connection

### 2.1 Creating a CameraDevice

Create one instance per connection type. We recommend creating it in the ViewModel that owns the connection lifecycle and calling `release()` in `onCleared()`.

```kotlin
// Choose the connection type you need
val device = CameraDevice.get(ConnectType.WIFI)
val device = CameraDevice.get(ConnectType.BLE)
val device = CameraDevice.get(ConnectType.USB)
```

---

### 2.2 Wi-Fi Connection

The camera and the phone must already be on the same Wi-Fi network, or the phone must be connected to the camera's hotspot.

```kotlin
// Coroutine style
viewModelScope.launch {
    device.connect()
        .onSuccess { /* Connected — keep the device instance for later use */ }
        .onFailure { e ->
            // NativeException carries the underlying error code, useful for diagnosis
            val msg = if (e is NativeException) "[${e.nativeErrorCode}] ${e.message}" else e.message
        }
}

// You can also specify a networkId
device.connect(connectHint = networkId)
```

---

### 2.3 USB Connection

Use this when the camera is connected to the phone over USB.

```kotlin
viewModelScope.launch {
    device.connect()
        .onSuccess { /* Connected */ }
        .onFailure { /* Handle the error */ }
}
```

---

### 2.4 BLE Connection

A BLE connection involves two steps: scanning and connecting.

**Scanning**

```kotlin
// Built-in SDK scan: the BleDeviceCore from the callback can be used directly to connect
device.scan(
    timeoutMs = 10_000L,
    bleScanCallback = bleScanCallback {
        started  { /* Scan started — a good place to clear the device list */ }
        scanning { bleDeviceCore ->
            // We recommend filtering by device name so only cameras are shown
        }
        finished { devices -> /* Scan finished */ }
        error    { e -> /* Scan failed */ }
    }
)

// Stop the scan explicitly once you no longer need results
device.stopScan()
```

**Connecting (with the SDK's BleDeviceCore)**

```kotlin
// bleDeviceCore comes from the bleScanCallback.scanning callback
viewModelScope.launch {
    device.connect(bleDeviceCore)
        .onSuccess { /* Connected */ }
        .onFailure { /* Handle the error */ }
}
```

**Connecting (with the system BluetoothDevice)**

If you already obtained a `BluetoothDevice` through the system BLE APIs, pass it in directly:

```kotlin
// bluetoothDevice comes from the system BluetoothLeScanner callback
viewModelScope.launch {
    device.connectBle(bluetoothDevice)
        .onSuccess { /* Connected */ }
        .onFailure { /* Handle the error */ }
}
```

---

### 2.5 Bootstrapping a Wi-Fi Connection over Bluetooth

Use this when the camera's Wi-Fi is off, or when the SSID and password are unknown. Once the BLE connection is established, read the Wi-Fi credentials from the camera, join the camera's hotspot through the system Wi-Fi APIs, and finally switch over to a Wi-Fi connection.

> Wi-Fi has low latency and supports live preview; a BLE-only connection does not support the preview stream.

**Flow**

```
1. BLE scan → select a device → BLE connect (see section 2.4)
2. Read the camera's Wi-Fi credentials (SSID / password) over BLE
3. Call the system Wi-Fi APIs to join the camera's hotspot and obtain a Network object
4. Bind the process to that Network (otherwise HTTP requests still go through the phone's default network)
5. Disconnect BLE and start the SDK Wi-Fi connection using the Wi-Fi networkHandle
6. Unbind the process network when disconnecting
```

**Key APIs**

```kotlin
// Step 2: read the camera's Wi-Fi credentials over BLE
val wifiData = bleDevice.system.getWifiData().getOrNull()
// wifiData.ssid — the camera hotspot's SSID
// wifiData.pwd  — the camera hotspot's password

// Step 3: system Wi-Fi connection (use WifiNetworkSpecifier on Android 10+)
// The Network object arrives in ConnectivityManager.NetworkCallback.onAvailable
val network: Network? = connectSystemWifi(ssid = wifiData.ssid, password = wifiData.pwd)

// Step 4: bind the process network so subsequent HTTP/SDK traffic uses the camera's Wi-Fi
connectivityManager.bindProcessToNetwork(network)

// Step 5: disconnect BLE and switch to a Wi-Fi connection
bleDevice.disconnect()  // suspend fun, returns Result<Unit>
bleDevice.release()
val wifiDevice = CameraDevice.get(ConnectType.WIFI)
wifiDevice.connect(network.networkHandle)  // pass networkHandle to select the network

// Step 6: unbind when disconnecting
connectivityManager.bindProcessToNetwork(null)
```

> **Note**: `bindProcessToNetwork` affects network routing for the entire process. After disconnecting, always call `bindProcessToNetwork(null)` promptly to restore it, or the rest of your app's network requests will also be routed to the camera hotspot.

---

### 2.6 Bluetooth Wake-Up

When the camera is powered off, it can be woken up over a BLE broadcast; start the connection once wake-up succeeds.

```kotlin
// You need the target camera's model and device name
device.bleWakeUp(
    cameraType = CameraType.X4,
    deviceName = "Insta360 X4 XXXX",
    listener = object : BleWakeUpListener {
        override fun onWakeUpSuccess() {
            // Woken up — you can now start a BLE connection
        }
        override fun onWakeUpError(errCode: Int) {
            // Wake-up failed
        }
    }
)
```

---

### 2.7 Disconnecting and Releasing Resources

```kotlin
// Disconnect explicitly (coroutine style, returns Result<Unit>)
device.disconnect()

// Disconnect explicitly (callback style)
device.disconnect(callback)

// Release resources when the screen / ViewModel is destroyed
override fun onCleared() {
    device.release()
}
```

---

### 2.8 Detecting Unexpected Disconnections

We recommend registering the disconnection listener immediately after connecting:

```kotlin
val disconnectListener = object : DisconnectListener {
    override fun onDisconnect(throwable: Throwable?) {
        // A null throwable means an intentional disconnect; non-null means unexpected
        // Clear your local device reference and prompt the user to reconnect
    }
}

device.registerDisconnectListener(disconnectListener)

// Unregister when no longer needed to avoid leaks
device.unregisterDisconnectListener(disconnectListener)
```

---

## 3. System State Monitoring

> Prerequisite: the device is connected and you hold a valid `CameraDevice` instance.

### 3.1 When to Register and Unregister

We recommend registering when the user enters the relevant screen and unregistering when they leave, so you receive real-time state pushes only while they are needed.

```kotlin
// Register
device.registerDisconnectListener(disconnectListener)
device.system.registerBatteryListener(batteryListener)
device.system.registerStorageStatusListener(storageListener)
device.system.registerTemperatureListener(temperatureListener)
device.system.registerChargeBoxStatusListener(chargeBoxListener)

// Unregister (mirroring where you registered)
device.unregisterDisconnectListener(disconnectListener)
device.system.unregisterBatteryListener(batteryListener)
device.system.unregisterStorageStatusListener(storageListener)
device.system.unregisterTemperatureListener(temperatureListener)
device.system.unregisterChargeBoxStatusListener(chargeBoxListener)
```

---

### 3.2 Battery Monitoring

```kotlin
val batteryListener = object : BatteryListener {
    override fun onBatteryLevelChange(batteryData: BatteryData) {
        val percent = if (batteryData.scale > 0)
            (batteryData.level * 100f / batteryData.scale).roundToInt()
        else batteryData.level
        // Update the battery indicator
    }

    override fun onLowBatteryWarning() {
        // Show a prompt asking the user to charge the camera soon
    }
}
```

---

### 3.3 Storage State Monitoring

```kotlin
val storageListener = object : StorageStateListener {
    override fun onStorageStateChanged(storageData: StorageData) {
        when (storageData.state) {
            StorageData.State.PASS     -> { /* Normal: show used / total capacity */ }
            StorageData.State.NO_CARD  -> { /* No SD card inserted */ }
            StorageData.State.NO_SPACE -> { /* Storage is full */ }
            StorageData.State.INVALID_FORMAT -> { /* Invalid format — suggest formatting */ }
            StorageData.State.WP_CARD  -> { /* Write-protected */ }
            StorageData.State.OTHER_ERROR -> { /* Other error */ }
        }
        // Capacity in bytes; total/free may be 0 when no card is inserted
        val usedBytes = storageData.total - storageData.free
    }
}
```

---

### 3.4 Temperature Monitoring

```kotlin
val temperatureListener = object : TemperatureListener {
    override fun onTemperatureUpdate(tempState: TempState) {
        when (tempState) {
            TempState.HIGH -> {
                // Suggest pausing capture and letting the device cool down
            }
            TempState.HIGH_SHUTDOWN -> {
                // The camera may shut down automatically — stop operations immediately
            }
            else -> { /* Temperature is normal */ }
        }
    }
}
```

---

### 3.5 Fetching Data On Demand

Besides listening for pushes, you can fetch the latest values whenever you need them:

```kotlin
viewModelScope.launch {
    // fetch* methods pull the latest data from the camera; get* methods read the local cache
    val battery     = device.system.fetchBatteryData().getOrNull()
    val storage     = device.system.fetchStorageData().getOrNull()
    val firmware    = device.system.fetchFirmwareRevision().getOrNull()
    val serialNum   = device.system.fetchSerialNumber().getOrNull()
    val cameraType  = device.system.fetchCameraType().getOrNull()
}
```

---

## 4. Capture Control and Parameters

> Prerequisite: the camera is connected and you hold `CameraDevice.capture`.

### 4.1 Loading the Parameter Configuration

After connecting, you must call `loadJson()` first so the SDK knows which parameters the connected camera supports.

```kotlin
// Call this from your connection-success handler; parameter operations depend on it
viewModelScope.launch {
    device.capture.loadJson()
}
```

---

### 4.2 Querying Supported Parameters

Camera models support different sets of parameters, so query before you write:

```kotlin
viewModelScope.launch {
    // All parameters supported by the connected camera
    val supportedParams: List<CameraParam<*>> = device.capture.getSupportParam()

    // Supported capture modes
    val modes: List<FunctionMode> = device.capture.functionMode.getSupported().getOrNull() ?: emptyList()

    // Supported video resolutions
    val resolutions = device.capture.videoResolution.getSupported().getOrNull() ?: emptyList()
}
```

---

### 4.3 Reading and Writing Capture Parameters

Every parameter is accessed uniformly through `CameraParam<T>`:

```kotlin
viewModelScope.launch {
    val capture = device.capture

    // Read the current value (from the local cache)
    val currentMode  = capture.functionMode.getValue().getOrNull()
    val currentRes   = capture.videoResolution.getValue().getOrNull()

    // Fetch the latest value from the camera
    val latestMode   = capture.functionMode.fetchValue().getOrNull()

    // Write a new value (synchronized to the camera)
    capture.functionMode.setValue(FunctionMode.NORMAL_VIDEO)
    capture.videoResolution.setValue(RecordResolution.RES_5_7K_30FPS)
    capture.hdrSwitch.setValue(true)
    capture.exposureISO.setValue(400)
    capture.whiteBalance.setValue(6500)
}
```

Observing parameter changes (useful when several clients stay in sync):

```kotlin
// Register
val listener: (RecordResolution) -> Unit = { newValue ->
    updateResolutionLabel(newValue)
}
device.capture.videoResolution.addListener(listener)

// Unregister
device.capture.videoResolution.removeListener(listener)
```

---

### 4.4 Starting and Stopping Capture

```kotlin
viewModelScope.launch {
    // What is captured depends on the current functionMode (video / photo / timelapse, and so on)
    device.capture.startCapture()

    // Stop capturing (video mode)
    device.capture.stopCapture()

    // Check whether a capture is in progress
    val working = device.capture.isWorking()

    // Remaining capacity in the current mode (seconds left for video, shots left for photo)
    val remaining = device.capture.getRemaining().getOrNull()
}
```

---

### 4.5 Monitoring Capture Status

```kotlin
val captureListener = object : CaptureStatusListener {
    override fun onCaptureStarting(functionMode: FunctionMode) {
        // Capture is about to start — disable parameter-editing UI
    }
    override fun onCaptureWorking(functionMode: FunctionMode) {
        // Capture has entered the working state
    }
    override fun onCaptureStopping(functionMode: FunctionMode) {
        // Capture is stopping
    }
    override fun onCaptureFinish(functionMode: FunctionMode, filePaths: List<String>) {
        // Capture finished; filePaths are the file paths generated on the camera
    }
    override fun onCaptureError(functionMode: FunctionMode, throwable: Throwable) {
        // A capture error occurred
    }
    override fun onCaptureTimeChanged(functionMode: FunctionMode, captureTime: Long) {
        // Recording duration updated (video mode); captureTime is in seconds
    }
    override fun onCaptureCountChanged(functionMode: FunctionMode, captureCount: Int) {
        // Shot count updated (burst / interval shooting modes)
    }
    override fun onCaptureSubStatusChanged(functionMode: FunctionMode, subStatus: CameraCaptureStatus.SubStatus) {
        // Capture sub-status changed (for example HDR processing or pre-recording)
    }
}

device.capture.registerCaptureStatusListener(captureListener)
// Unregister when no longer needed
device.capture.unregisterCaptureStatusListener(captureListener)
```

---

### 4.6 GPS Data Injection

You can embed GPS coordinates in media files while recording. Manage the location data source yourself, pass it in when starting and stopping capture, and call `setGpsInfo` to update it during recording.

```kotlin
val gpsInfo = GpsInfo(
    latitude    = currentLatitude,
    longitude   = currentLongitude,
    altitude    = currentAltitude,
    timestampMs = System.currentTimeMillis()
)

// Pass GPS data when starting capture
device.capture.startCapture(gpsInfo)

// Update GPS data during recording (for example once per second)
device.capture.setGpsInfo(gpsInfo)

// Pass the latest GPS data when stopping capture
device.capture.stopCapture(gpsInfo)
```

---

## 5. Live Preview

### Option 1: Use InstaCapturePlayerView (recommended)

The SDK's `InstaCapturePlayerView` encapsulates decoding and rendering for a fast integration.

**Integration flow**

```
Register a CameraStreamListener
    → call previewView.prepare() + play() in onOpened()
    → inject the pipeline into the camera in PlayerViewListener.onLoadingFinish()
    → sync resolution / offsets / crop information to the player in onParamsChanged()
```

**Implementation**

```kotlin
// 1. Create the player view (usually in onCreate())
val previewView = InstaCapturePlayerView(context)

// 2. Register the stream state listener
val streamListener = object : CameraStreamListener {
    override fun onOpened() {
        // The stream is ready — initialize the player
        previewView.prepare(PreviewParams())
        previewView.play()
    }

    override fun onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate) {
        // Sync the offsets (used for panoramic stitching)
        paramsUpdate.offsetData?.let { offset ->
            previewView.setOffset(
                OffsetData(offset.offsetV1, offset.offsetV2, offset.offsetV3),
                paramsUpdate.stabOffset.orEmpty()
            )
        }
        // Sync resolution and frame rate
        if (paramsUpdate.previewWidth > 0 && paramsUpdate.previewHeight > 0) {
            previewView.setPreviewResolution(paramsUpdate.previewWidth, paramsUpdate.previewHeight)
            previewView.setFps(paramsUpdate.previewFps)
        }
        // Sync the window crop information (used for panoramic stitching)
        paramsUpdate.windowCropInfo?.let { crop ->
            previewView.setWindowCropInfo(
                MediaWindowCropInfo(crop.src_width, crop.src_height, crop.dst_width, crop.dst_height, crop.crop_offset_x, crop.crop_offset_y)
            )
        }
    }

    override fun onOpening() {}
    override fun onIdle() {}
}

// 3. Register the player view listener and wire up the pipeline in onLoadingFinish
// The pipeline is the channel that carries camera preview data to the media side for rendering
val playerViewListener = object : PlayerViewListener {
    override fun onLoadingFinish() {
        // Inject the player's rendering pipeline into the camera preview to complete the data path
        val pipeline = previewView.getPipeline() ?: return
        device.preview.setPipeline(pipeline)
    }
    override fun onReleaseCameraPipeline() {
        // When the player releases the pipeline, clear it on the camera side too
        device.preview.setPipeline(null)
    }
    override fun onFail(exception: InstaException) { /* Handle the error */ }
    override fun onLoadingStatusChanged(isLoading: Boolean) {}
    override fun onFirstFrameRendered() {}
}
previewView.setListener(playerViewListener)

// 4. Register the posture listener to rotate the preview according to camera orientation
val postureListener = object : CameraPostureUpdate {
    override fun updatePosture(cameraPosture: CameraPosture) {
        val deg = when (cameraPosture) {
            CameraPosture.CAMERA_POSTURE_ROTATE_90  -> 90
            CameraPosture.CAMERA_POSTURE_ROTATE_180 -> 180
            CameraPosture.CAMERA_POSTURE_ROTATE_270 -> 270
            else -> 0
        }
        previewView.updateRotate(deg, 0, cameraPosture.nativeValue, cameraPosture.nativeValue)
        previewView.redetectCameraRotation()
    }
}

// 5. Start the preview stream
fun startPreview() {
    device.preview.init(application)
    device.preview.registerCameraStreamListener(streamListener)
    device.preview.registerPostureListener(postureListener)
    device.preview.startStream()
}

// 6. Stop the preview stream (call this in onStop / onDestroy)
fun stopPreview() {
    device.preview.unregisterCameraStreamListener(streamListener)
    device.preview.unregisterPostureListener(postureListener)
    device.preview.stopStream()
    previewView.destroy()
}
```

---

### Option 2: Consume the Raw Stream (custom rendering)

Suitable when you need custom decoding, frame grabbing, or additional processing.

**Integration flow**

```
Register CameraStreamListener.onStreamDataNotify
    → buffer each PreviewStreamFrame in a Channel
    → consume on a background coroutine: merge slices sharing a timestamp → feed complete frames to the decoder
    → MediaCodec decodes → render to a SurfaceView
```

**Important: merging frame slices**

While the camera is streaming, a single frame may be delivered across several `onStreamDataNotify` callbacks; these slices share the same `timestamp`. You must concatenate all slices with the same `timestamp` into a complete frame before feeding the decoder — feeding individual slices produces a green or corrupted image.

```kotlin
// 1. Buffer raw frames in a Channel (avoid heavy work on the callback thread)
val frameChannel = Channel<PreviewStreamFrame>(Channel.UNLIMITED)

val streamListener = object : CameraStreamListener {
    override fun onStreamDataNotify(streamData: PreviewStreamFrame) {
        frameChannel.trySend(streamData)
    }
    override fun onOpening() {}
    override fun onOpened() {}
    override fun onIdle() {}
    override fun onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate) {}
}

// 2. Consume on a background coroutine: merge slices and feed complete frames to the decoder
lifecycleScope.launch(Dispatchers.IO) {
    val buffer = ByteArrayOutputStream(64 * 1024)
    var currentTs: Long? = null

    for (frame in frameChannel) {
        if (!frame.type.isVideo) continue  // Only handle video frames

        val ts = frame.timestamp
        if (currentTs != null && ts != currentTs) {
            // The timestamp changed → the previous frame is complete, feed it to the decoder
            // Convert the timestamp from milliseconds to microseconds (required by MediaCodec)
            decoder.offer(buffer.toByteArray(), currentTs!! * 1000L)
            buffer.reset()
        }
        currentTs = ts
        buffer.write(frame.data)
    }
}

// 3. Start / stop the preview
fun startPreview() {
    device.preview.registerCameraStreamListener(streamListener)
    device.preview.startStream()
    // Request a key frame right away so the first image appears sooner
    device.preview.requestStreamIframe()
}

fun stopPreview() {
    device.preview.unregisterCameraStreamListener(streamListener)
    device.preview.stopStream()
}
```

**Detecting H.264 vs H.265**

The preview stream's codec (H.264 or H.265) can vary by camera model and firmware version, so query it at runtime:

```kotlin
// Query the current codec
viewModelScope.launch {
    val encode = device.system.fetchVideoEncodeType().getOrNull()
    val isH265 = encode == VideoEncode.ENCODE_H265
    // Initialize the matching MediaCodec (video/avc or video/hevc) accordingly,
    // or tell the SDK's decoder which one to use
    device.preview.setStreamEncode(isH265)
}
```

You can also detect it by parsing the NAL parameter sets in the bitstream: H.264 contains SPS (nalType=7) and PPS (nalType=8), while H.265 contains VPS (nalType=32), SPS (nalType=33), and PPS (nalType=34).

**Adjusting the preview bitrate at runtime**

```kotlin
viewModelScope.launch {
    device.preview.setVideoBitrate(4 * 1024 * 1024)  // 4 Mbps, in bps
}
```

### Live Streaming

> Prerequisites: the camera is connected and you hold `CameraDevice.preview`. You must switch the capture mode to `FunctionMode.VIDEO_LIVE`, then start the preview stream and wait for it to open (`CameraStreamListener.onOpened`); otherwise `startLive` fails.

**1. Register the live streaming state listener**

```kotlin
val liveListener = object : CameraLiveListener {
    override fun onStarted() { /* Streaming established */ }
    override fun onFps(fps: Int) { /* Real-time streaming frame rate */ }
    override fun onStopped() { /* Streaming stopped */ }
    override fun onFailed(errorCode: Int, message: String?) { /* Streaming failed */ }
}
device.preview.registerCameraLiveListener(liveListener)
```

**2. Switch to live mode and start the preview stream**

```kotlin
// Switch the capture mode (see section 4.3 for parameter access)
device.capture.functionMode.setValue(FunctionMode.VIDEO_LIVE)
// Start the preview stream (see "Option 1" / "Option 2" under section 5, Live Preview)
device.preview.startStream()
```

**3. Start streaming**

```kotlin
viewModelScope.launch {
    device.preview.startLive(
        CameraLiveParams(
            rtmpUrl = "rtmp://your-server/live/stream-key",
            width   = 1920,
            height  = 960,
            fps     = 30,
            bitrate = 4,          // in Mbps
            // netId defaults to -1; pass a network id to bind a specific network such as cellular
        )
    ).onSuccess {
        // The request was accepted; the real streaming state comes from liveListener.onStarted
    }.onFailure { /* Handle the failed streaming request */ }
}
```

**4. Stop streaming**

```kotlin
viewModelScope.launch {
    device.preview.stopLive()
}
// Unregister the listener when leaving the screen
device.preview.unregisterCameraLiveListener(liveListener)
```

---

## 6. File Management

> Prerequisites: the camera is connected and you hold `CameraDevice.file`. Over Wi-Fi, files are accessed over HTTP; file downloads are not supported over BLE or USB.

### 6.1 Listing Files

```kotlin
viewModelScope.launch {
    val file = device.file

    // Full listing, returned as a list of file URIs
    val uris: List<String> = file.listMediaFiles().getOrNull() ?: return@launch

    // Filter by type
    val videoUris = file.listMediaFiles(MediaFileType.VIDEO).getOrNull() ?: emptyList()

    // Paged listing (recommended when there are many files)
    // Returns Pair<URIs on this page, total file count>
    val (pageUris, total) = file.listMediaFiles(
        start = 0, limit = 20
    ).getOrNull() ?: return@launch
}
```

---

### 6.2 Downloading Files

Build the full URL before downloading: `getEndpoint()` returns a prefix such as `http://192.168.42.1:80/`.

```kotlin
viewModelScope.launch {
    val fullUrl = device.file.getEndpoint() + relativeUri

    device.file.downloadMediaFile(
        url       = fullUrl,
        targetDir = targetDirPath,
        progressCallback = { downloaded, total ->
            val percent = (downloaded * 100f / total).toInt()
            // Update the progress UI
        }
    ).onSuccess { localPath ->
        // localPath is the absolute local path of the downloaded file
    }.onFailure { e ->
        // Handle the download failure
    }
}
```

> **Tip**: process multiple downloads serially through a `Channel` or a queue; concurrent downloads can cause memory pressure and network congestion.

---

### 6.3 Deleting Files

```kotlin
viewModelScope.launch {
    // Batch deletion is supported
    device.file.deleteMediaFiles(uri1, uri2, uri3)
        .onSuccess { /* Deleted — refresh the file list */ }
        .onFailure { /* Handle the failure */ }
}
```

---

### 6.4 Downloading Camera Logs

Useful for troubleshooting; the log file is downloaded as an archive.

```kotlin
viewModelScope.launch {
    device.file.downloadCameraLogFile(
        targetDir = cacheDir.absolutePath,
        progressCallback = { downloaded, total -> /* Update progress */ }
    ).onSuccess { logPath ->
        // You can share it through the system share sheet or upload it to your server
    }.onFailure { /* Handle the failure */ }
}
```

---

## 7. Firmware Upgrade

> Prerequisites: the camera is connected and you hold `CameraDevice.firmware`. Do not disconnect during the upgrade.

### 7.1 Querying the Current Version

```kotlin
val version = device.firmware.getVersion().getOrNull()
```

### 7.2 Performing the Upgrade

The firmware file is usually downloaded from your own server and saved locally, with a `.bin` or `.pkg` extension.

```kotlin
// Callback style
device.firmware.upgradeFirmware(
    filePath = localFirmwarePath,
    callback = progressCallback {
        success {
            // Upgrade succeeded; the camera may restart automatically
        }
        progress { p ->
            // p ranges from 0.0 to 1.0
            updateProgress((p * 100).toInt())
        }
        throwable { e ->
            // Upgrade failed — prompt the user to retry
        }
    }
)

// Coroutine style
viewModelScope.launch {
    device.firmware.upgradeFirmware(
        filePath = localFirmwarePath,
        progress = { p -> updateProgress((p * 100).toInt()) }
    ).onSuccess { /* Upgrade succeeded */ }
     .onFailure { /* Upgrade failed */ }
}
```

---

## 8. Wi-Fi Settings

> Prerequisites: the camera is connected (Wi-Fi is usually configured over a BLE connection) and you hold `CameraDevice.system`.

### 8.1 Querying Wi-Fi Information

```kotlin
viewModelScope.launch {
    val wifiData    = device.system.fetchWifiData().getOrNull()
    val channelList = device.system.fetchWifiChannelList().getOrNull()

    // wifiData contains the SSID, password, current channel, and more
    // channelList contains the channels available in the current region
}
```

### 8.2 Turning Wi-Fi On and Off

```kotlin
viewModelScope.launch {
    // Turn Wi-Fi on, optionally specifying a channel (0 selects one automatically)
    device.system.openCameraWiFi(channel = 6)
        .onSuccess {
            // Restarting Wi-Fi takes a moment; wait about 10 seconds before querying the new state
        }

    // Turn Wi-Fi off
    device.system.closeCameraWiFi()
}
```

### 8.3 Changing the Channel / Restarting Wi-Fi

```kotlin
viewModelScope.launch {
    device.system.resetCameraWiFi(channel = 11)
        .onSuccess {
            // Again, wait about 10 seconds before fetching the new channel data
            // delay(10_000)
            val updated = device.system.fetchWifiData().getOrNull()
        }
}
```

### 8.4 Setting the Wi-Fi Country Code

The country code determines the available channel range. Restart Wi-Fi for the change to take effect.

```kotlin
viewModelScope.launch {
    device.system.setWiFiCountry("US")
        .onSuccess {
            // Restart Wi-Fi right away
            device.system.resetCameraWiFi()
        }
}
```

---

## 9. Device Management

> Prerequisites: the camera is connected and you hold `CameraDevice.system`.

### 9.1 Activating the Camera

Some features are restricted while the camera is not activated; activate it during your first integration.

```kotlin
viewModelScope.launch {
    device.system.activeCamera(
        appId     = "your_app_id",
        secretKey = "your_secret_key"
    ).onSuccess { /* Activated */ }
     .onFailure { /* Activation failed — verify the appId and secretKey */ }
}
```

### 9.2 Screen Lock

```kotlin
viewModelScope.launch {
    device.system.setLockScreenState(LockScreenState.LOCK)
        .onSuccess { /* Screen lock applied */ }
        .onFailure { /* Handle the failure */ }
}
```

### 9.3 Power Off

```kotlin
// Power off is a one-way command with no return value.
// The camera powers off on its own and the connection drops with it.
device.system.shutdown()
```

### 9.4 Formatting Storage

> This operation cannot be undone; ask the user to confirm before calling it. `formatSdCard` is deprecated — use `formatStorage`.

```kotlin
viewModelScope.launch {
    device.system.formatStorage(FileLocation.CAMERA)
        .onSuccess { /* Formatting finished */ }
        .onFailure { /* Formatting failed */ }
}
```
