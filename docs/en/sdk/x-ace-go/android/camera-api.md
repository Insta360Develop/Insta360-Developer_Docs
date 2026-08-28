# Camera SDK API Reference

The Camera SDK (`sdk-camera`) provides connection management, capture control, live preview, file management, and firmware upgrade capabilities for Insta360 cameras. This document lists the interface definitions and parameters of all public APIs.

---

## Contents

1. [Device Connection and Management](#1-device-connection-and-management)
2. [System and Hardware Information](#2-system-and-hardware-information)
3. [Capture Control and Parameters](#3-capture-control-and-parameters)
4. [Live Preview](#4-live-preview)
5. [File Management](#5-file-management)
6. [Firmware Upgrade](#6-firmware-upgrade)
7. [GPS Data Injection](#7-gps-data-injection)
8. [Event Listeners](#8-event-listeners)
9. [Shared Data Types](#9-shared-data-types)

---

## 1. Device Connection and Management

### CameraDevice

The core interface for a camera device and the entry point to every functional module.

```kotlin
interface CameraDevice
```

**Factory method**

```kotlin
CameraDevice.get(connectType: ConnectType): CameraDevice
```

**Sub-modules**

| Property | Type | Description |
|----------|------|-------------|
| `system` | `CameraSystem` | System-level features |
| `capture` | `CameraCapture` | Capture control |
| `preview` | `CameraPreview` | Live preview stream |
| `file` | `CameraFile` | On-camera file management |
| `firmware` | `CameraFirmware` | Firmware version and upgrade |

**Connection methods**

| Method | Style | Description |
|--------|-------|-------------|
| `isConnected()` | Synchronous | Whether the camera is connected |
| `scan(timeoutMs, bleScanCallback)` | Synchronous | Scan for nearby Bluetooth devices |
| `stopScan()` | Synchronous | Stop the Bluetooth scan |
| `bleWakeUp(cameraType, deviceName, listener)` | Synchronous | Wake the camera over Bluetooth |
| `connect(connectHint, callback)` | Callback | Generic connect |
| `connect(connectHint)` | Coroutine | Generic connect |
| `connectBle(bleDeviceCore, callback)` | Callback | Bluetooth connect (SDK `BleDeviceCore`) |
| `connectBle(bleDeviceCore)` | Coroutine | Bluetooth connect (SDK `BleDeviceCore`) |
| `connectBle(kmpBleDevice, callback)` | Callback | Bluetooth connect (system `BluetoothDevice` / `CBPeripheral`) |
| `connectBle(kmpBleDevice)` | Coroutine | Bluetooth connect (system `BluetoothDevice` / `CBPeripheral`) |
| `connectWiFi(networkId, callback)` | Callback | Wi-Fi connect |
| `connectWiFi(networkId)` | Coroutine | Wi-Fi connect |
| `connectUsb(callback)` | Callback | USB connect |
| `connectUsb()` | Coroutine | USB connect |
| `disconnect(callback)` / `suspend disconnect()` | Callback / Coroutine | Disconnect; returns `Result<Unit>` |
| `getSupportCameraType()` | Synchronous | List the camera models supported by the current connection type |
| `release()` | Synchronous | Release all resources held by the device object |

**Disconnection monitoring**

| Method | Description |
|--------|-------------|
| `registerDisconnectListener(listener)` | Register a disconnection listener |
| `unregisterDisconnectListener(listener)` | Unregister a disconnection listener |

**Camera authorization**

After connecting, use the methods below to verify whether the current device has been authorized by the camera. The camera displays a confirmation dialog, and the user's approval or rejection is delivered through `AuthorizationListener`.

| Method | Style | Description |
|--------|-------|-------------|
| `checkAuthorization(callback)` / `checkAuthorization()` | Callback / Coroutine | Check authorization; returns `AuthorizationStatus` |
| `cancelAuthorization(callback)` / `cancelAuthorization()` | Callback / Coroutine | Cancel the ongoing authorization check |
| `registerAuthorizationListener(listener)` | Synchronous | Register an authorization result listener |
| `unregisterAuthorizationListener(listener)` | Synchronous | Unregister an authorization result listener |

`AuthorizationStatus` values:

| Value | Description |
|-------|-------------|
| `AUTHORIZED` | Authorized |
| `UNAUTHORIZED` | Not authorized (the camera shows a confirmation dialog; the result arrives via `AuthorizationListener`) |
| `SYSTEM_BUSY` | Camera is busy |

---

## 2. System and Hardware Information

### CameraSystem

Provides system-level features such as battery, storage, temperature, Wi-Fi, device information, and power off.

```kotlin
interface CameraSystem
```

Every data item is available in three call styles:

- `getXxx()` — read the local cache (synchronous)
- `fetchXxx(callback)` — fetch from the camera (callback)
- `suspend fetchXxx()` — fetch from the camera (coroutine)

Writable items additionally provide a `setXxx(...)` method.

**Data items**

| Data item | Type | Writable | Description |
|-----------|------|----------|-------------|
| BatteryData | `BatteryData` | ✗ | Battery level and charging state |
| ChargeBoxData | `ChargeBoxData` | ✗ | Charge case state |
| Mute | `Boolean` | ✓ | Mute state |
| SerialNumber | `String` | ✗ | Serial number |
| Uuid | `String` | ✗ | UUID |
| OriginOffset / V2 / V3 | `String` | ✗ | Original lens offset (multiple versions) |
| ActivateTime | `Long` | ✓ | Activation time |
| ~~StorageData~~ | ~~`StorageData`~~ | ✗ | Deprecated; use `StorageDataList` |
| StorageDataList | `List<StorageData>` | ✗ | State of each storage medium (supports multiple storage locations) |
| MediaOffset / V2 / V3 | `String` | ✗ | Media offset (multiple versions) |
| MediaOffsetV6 | `String` | ✗ | Media offset V6 |
| FirmwareRevision | `String` | ✗ | Firmware version |
| WifiData | `WiFiData` | ✗ | Wi-Fi information |
| WifiChannelList | `WiFiChannel` | ✗ | Wi-Fi channel list |
| CameraType | `CameraType` | ✗ | Camera model |
| VideoEncodeType | `VideoEncode` | ✓ | Video encoding type |
| IsSelfie | `Boolean` | ✗ | Whether selfie mode is active |
| CameraLanguage | `LanguageType` | ✓ | Camera language |
| AssistiveGridEnable | `Boolean` | ✓ | Assistive grid |
| FreeFrameGridEnable | `Boolean` | ✓ | Free-aspect grid |
| Sharpness | `Sharpness` | ✓ | Global sharpness |
| MediaTime | `Long` | ✗ | Media time |
| WindowCropInfo | `WindowCropInfo` | ✗ | Window crop information (cached) |
| HalfWindowCropInfo | `WindowCropInfo` | ✗ | Half-window crop information (cached) |
| OffsetState | `Int` | ✗ | Offset state (cached) |
| OffsetDetectedType | `Int` | ✗ | Offset detection type (cached) |
| RollingShutterTime | `Double` | ✗ | Rolling shutter time (seconds) |

**Operations**

| Method | Style | Description |
|--------|-------|-------------|
| `setLocalTime(localTime, callback)` / `setLocalTime(localTime)` | Callback / Coroutine | Set the local time |
| `openCameraWiFi(channel, callback)` / `openCameraWiFi(channel)` | Callback / Coroutine | Turn Wi-Fi on |
| `closeCameraWiFi(callback)` / `closeCameraWiFi()` | Callback / Coroutine | Turn Wi-Fi off |
| `resetCameraWiFi(channel, callback)` / `resetCameraWiFi(channel)` | Callback / Coroutine | Restart Wi-Fi |
| `setWiFiCountry(countryCode, callback)` / `setWiFiCountry(countryCode)` | Callback / Coroutine | Set the Wi-Fi country code |
| `activeCamera(appId, secretKey, callback)` / `activeCamera(appId, secretKey)` | Callback / Coroutine | Activate the camera |
| `calibrateGyro(callback)` / `calibrateGyro()` | Callback / Coroutine | Calibrate the gyroscope |
| `setLockScreenState(state, callback)` / `setLockScreenState(state)` | Callback / Coroutine | Set the screen lock state |
| ~~`formatSdCard(callback)`~~ / ~~`formatSdCard()`~~ | Callback / Coroutine | Deprecated; use `formatStorage` (equivalent to `formatStorage(FileLocation.CAMERA)`) |
| `formatStorage(fileLocation, callback)` / `formatStorage(fileLocation)` | Callback / Coroutine | Format the given storage location; defaults to `FileLocation.CAMERA` |
| `setMainStorage(fileLocation, callback)` / `setMainStorage(fileLocation)` | Callback / Coroutine | Set the primary storage location (X6 only) |
| `shutdown()` | Synchronous | Power off the camera |

**State monitoring**

| Method | Description |
|--------|-------------|
| `registerBatteryListener(listener)` / `unregisterBatteryListener(listener)` | Battery state |
| `registerChargeBoxStatusListener(listener)` / `unregisterChargeBoxStatusListener(listener)` | Charge case state |
| `registerTemperatureListener(listener)` / `unregisterTemperatureListener(listener)` | Temperature state |
| `registerStorageStatusListener(listener)` / `unregisterStorageStatusListener(listener)` | Storage card state |

---

## 3. Capture Control and Parameters

### CameraCapture

Provides start/stop control for photo and video capture, plus read/write access to every capture parameter.

```kotlin
interface CameraCapture
```

### CameraParam\<T\>

A uniform wrapper for reading, writing, querying supported values, and observing changes of a single capture parameter.

```kotlin
interface CameraParam<T>
```

| Method | Description |
|--------|-------------|
| `suspend getValue(): Result<T>` | Read the currently cached value |
| `suspend fetchValue(): Result<T>` | Read the latest value from the camera |
| `suspend setValue(value: T): Result<Unit>` | Write a new value (notifies listeners automatically) |
| `suspend getSupported(): Result<List<T>>` | Get the values available in the current mode |
| `getName(): String` | Get the parameter's name identifier |
| `addListener(listener: (T) -> Unit)` | Subscribe to value-change callbacks |
| `removeListener(listener: (T) -> Unit)` | Unsubscribe from value-change callbacks |

**Capture parameters**

All parameters are exposed as `CameraParam<T>` properties on `CameraCapture`:

| Property | Type T | Description |
|----------|--------|-------------|
| `lensType` | `SensorMode` | Lens type (single lens, dual lens, and so on) |
| `functionMode` | `FunctionMode` | Capture function mode (video, photo, timelapse, and so on) |
| `photoResolution` | `PhotoResolution` | Photo resolution |
| `videoResolution` | `RecordResolution` | Video resolution |
| `hdrPhotoMode` | `PhotoHdrType` | Photo HDR mode |
| `hdrSwitch` | `Boolean` | Video HDR toggle |
| `aeb` | `Int` | Auto exposure bracketing (AEB) |
| `rawType` | `RawType` | RAW format type |
| `exposureProgram` | `ExposureProgram` | Exposure program |
| `exposureISO` | `Int` | ISO |
| `exposureShutterSpeed` | `Pair<Double, Double>` | Shutter speed |
| `videoISOTopLimit` | `Int` | Video ISO upper limit |
| `exposureBias` | `Double` | Exposure compensation (EV) |
| `whiteBalance` | `Int` | White balance |
| `fovType` | `FovType` | Field-of-view type |
| `flowStateLevel` | `FlowStateLevel` | Stabilization level |
| `photographySelfTimer` | `Int` | Photo self-timer |
| `splicingBaseEnable` | `Boolean` | Base stitching toggle |
| `videoSelfieMode` | `VideoSelfieMode` | Video selfie mode |
| `exportType` | `ExportType` | Export type |
| `photoSizeId` | `PhotoSize` | Photo size / aspect ratio |
| `colorMode` | `VideoGammaMode` | Color mode |
| `filterMode` | `VideoGammaMode` | Filter mode |
| `accelerateFrequency` | `Int` | Speed-up factor (timelapse) |
| `recordDuration` | `Int` | Recording duration |
| `exposureIndividual` | `PanoExposureMode` | Independent exposure mode |
| `livingBitrate` | `Int` | Live streaming bitrate |
| `burstCaptureParams` | `Pair<Int, Int>` | Burst parameters (shot count, interval) |
| `p3Switch` | `Boolean` | Display P3 color gamut toggle |
| `iLogSwitch` | `Boolean` | i-Log color mode toggle |
| `pureVideoEnhanceSwitch` | `Boolean` | PureVideo night enhancement toggle |
| `doubleZoomEnable` | `Boolean` | 2x zoom toggle |
| `lapseTime` | `Double` | Interval shooting interval |
| `livePhotoMode` | `Boolean` | Live Photo |
| `lensAccessory` | `LensAccessoryType` | Lens accessory type |
| `iq3AMode` | `Iq3AMode` | 3A pro mode (`NORMAL` ↔ `PRO`). Which values remain available for `exposureISO`, `exposureShutterSpeed`, `whiteBalance`, `videoISOTopLimit`, and similar parameters in each mode is driven by the camera's own declaration; the SDK does not switch modes automatically |

**Parameter management**

| Method | Description |
|--------|-------------|
| `getSupportParam(): List<CameraParam<*>>` | List the parameters supported by the connected camera |
| `suspend syncAllParams()` | Force a full parameter sync from the camera |
| `suspend loadJson(): Result<Unit>` | Load the camera's parameter configuration JSON (call after connecting) |

> `getSupportParamNames()` and `getAllParams()` are deprecated; use `getSupportParam()` instead.

**Capture control**

| Method | Description |
|--------|-------------|
| `suspend startCapture(gpsInfo: GpsInfo? = null)` | Start capturing, optionally writing GPS data into the media file |
| `suspend stopCapture(gpsInfo: GpsInfo? = null)` | Stop capturing, optionally writing GPS data into the media file |
| `suspend setGpsInfo(gpsInfo: GpsInfo)` | Update GPS data while capturing |
| `suspend isWorking(): Boolean` | Whether a capture is in progress |
| `isPreRecording(): Boolean` | Whether pre-recording is active |
| `cancelPreRecord()` | Cancel pre-recording |
| `suspend getBurstTime(): Result<Unit>` | Get the burst time |
| `suspend getRemaining(): Result<Int>` | Remaining recording time (seconds) or shot count for the current mode |
| `getRemaining(functionMode): Result<Int>` | Remaining capacity for a given mode (cached) |
| `suspend fetchRemaining(functionMode): Result<Int>` | Fetch the remaining capacity for a given mode from the camera |
| `registerCaptureStatusListener(listener)` | Register a capture status listener |
| `unregisterCaptureStatusListener(listener)` | Unregister a capture status listener |

---

## 4. Live Preview

### CameraPreview

Controls starting and stopping the camera's live preview stream, retrieves stream parameters, and monitors camera posture.

```kotlin
interface CameraPreview
```

| Method | Description |
|--------|-------------|
| `startStream()` | Start the preview stream (decoder configuration is synced automatically) |
| `stopStream()` | Stop the preview stream |
| `requestStreamIframe()` | Request an immediate key frame to recover from a corrupted image |
| `getPreviewParams(): Result<PreviewParams>` | Get a snapshot of the current preview stream parameters (for use by the media side) |
| `getCurrentFunctionMode(): Result<FunctionMode>` | Get the function mode of the current preview session |
| `getVideoBitrate(): Result<Int>` | Get the cached video bitrate (bps) |
| `suspend fetchVideoBitrate(): Result<Int>` | Fetch the latest video bitrate from the camera |
| `suspend setVideoBitrate(bitrate: Int): Result<Unit>` | Set the video bitrate |
| `setStreamEncode(isH265: Boolean)` | Manually override the preview stream decoder configuration (rarely needed) |
| `setPipeline(pipeline: KMPCameraPreviewPipeline?)` | Set the preview rendering pipeline |
| `registerPostureListener(listener)` | Register a camera posture update listener |
| `unregisterPostureListener(listener)` | Unregister a camera posture update listener |
| `registerCameraStreamListener(listener)` | Register a preview stream state listener |
| `unregisterCameraStreamListener(listener)` | Unregister a preview stream state listener |
| `suspend startLive(params: CameraLiveParams): Result<Unit>` | Start an RTMP live stream (switch to live mode and start the preview stream first) |
| `startLive(params: CameraLiveParams, callback: Callback<Unit>)` | Start a live stream (callback flavor) |
| `suspend stopLive(): Result<Unit>` | Stop the live stream |
| `stopLive(callback: Callback<Unit>)` | Stop the live stream (callback flavor) |
| `registerCameraLiveListener(listener)` | Register a live streaming state listener |
| `unregisterCameraLiveListener(listener)` | Unregister a live streaming state listener |

> A successful return from `startLive` only means the streaming request was accepted. The actual streaming state is delivered asynchronously through `CameraLiveListener`.

### CameraStreamListener

```kotlin
interface CameraStreamListener
```

| Callback | Description |
|----------|-------------|
| `onOpening()` | The preview stream is opening |
| `onOpened()` | The preview stream opened successfully |
| `onIdle()` | The preview stream is closed |
| `onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate)` | Preview stream parameters changed (resolution, frame rate, crop information, and so on) |
| `onStreamDataNotify(streamData: PreviewStreamFrame)` | A preview stream data frame was received (empty default implementation) |

### CameraLiveParams

Live streaming parameters passed to `CameraPreview.startLive()`.

```kotlin
data class CameraLiveParams(
    val rtmpUrl: String,
    val width: Int,
    val height: Int,
    val fps: Int,
    val bitrate: Int,
    val netId: Long = -1L
)
```

| Property | Description |
|----------|-------------|
| `rtmpUrl` | RTMP streaming URL |
| `width` / `height` | Stream resolution (pixels) |
| `fps` | Stream frame rate |
| `bitrate` | Stream bitrate (in Mbps; converted to bps internally) |
| `netId` | Network ID used for streaming; defaults to -1 (the underlying default network). The SDK does not manage networks — to bind a specific network such as cellular, pass the corresponding network ID |

### CameraLiveListener

Live streaming state callbacks, registered via `CameraPreview.registerCameraLiveListener()`. All callbacks are dispatched off the main thread; switch to the main thread yourself before updating the UI.

```kotlin
interface CameraLiveListener
```

| Callback | Description |
|----------|-------------|
| `onStarted()` | Streaming started successfully |
| `onFps(fps: Int)` | Frame rate update; `fps` is the current real-time frame rate |
| `onStopped()` | Streaming stopped normally |
| `onFailed(errorCode: Int, message: String?)` | A streaming error occurred; `errorCode` is the underlying error code |

### PreviewStreamFrame

```kotlin
data class PreviewStreamFrame(
    val data: ByteArray,
    val timestamp: Long,
    val type: PreviewStreamType = PreviewStreamType.UNKNOWN
)
```

| Property | Description |
|----------|-------------|
| `data` | Raw frame bytes |
| `timestamp` | Frame timestamp (usually needs converting to microseconds before feeding MediaCodec) |
| `type` | Frame type; see the table below |

### PreviewStreamType

| Value | Description |
|-------|-------------|
| `VIDEO` | Regular video frame |
| `VIDEO_L` | Left-eye / left-side video frame |
| `VIDEO_R` | Right-eye / right-side video frame |
| `AUDIO` | Audio frame |
| `GYRO` | Gyroscope / posture data frame |
| `OTHER` | Other type |
| `UNKNOWN` | Unknown type |

> `val isVideo: Boolean` — whether this is a video frame (VIDEO / VIDEO_L / VIDEO_R).

### PreviewStreamParamsUpdate

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

| Property | Description |
|----------|-------------|
| `windowCropInfo` | Window crop information, used for panoramic stitching |
| `offsetData` | Lens offset / calibration parameters |
| `stabOffset` | Stabilization offset string |
| `previewWidth` / `previewHeight` | Current preview resolution (pixels) |
| `previewFps` | Current preview frame rate |

---

## 5. File Management

### CameraFile

Provides listing, downloading, and deletion of media files stored on the camera.

```kotlin
interface CameraFile
```

**Server information**

| Method | Description |
|--------|-------------|
| `getEndpoint(): String` | Full file server URL (for example `http://192.168.42.1:80/`) |
| `getHost(): String` | Host address |
| `getProt(): Int` | Port number |

**File listing**

| Method | Style | Description |
|--------|-------|-------------|
| `listMediaFiles(mediaFileType, includeRecording, callback)` | Callback | Get the complete file list as a list of URIs |
| `listMediaFiles(mediaFileType, includeRecording)` | Coroutine | Same as above |
| `listMediaFiles(mediaFileType, start, limit, includeRecording, callback)` | Callback | Paged listing; returns `Pair<List<String>, Int>` (page items, total count) |
| `listMediaFiles(mediaFileType, start, limit, includeRecording)` | Coroutine | Same as above |
| `getFileInfoList(callback)` | Callback | Get the detailed file information list |
| `getFileInfoList()` | Coroutine | Same as above |

**File operations**

| Method | Style | Description |
|--------|-------|-------------|
| `deleteMediaFiles(vararg uris, callback)` | Callback | Delete the given files |
| `deleteMediaFiles(vararg uris)` | Coroutine | Delete the given files |
| `downloadMediaFile(url, targetDir, progressCallback?)` | Coroutine | Download a media file; returns the local path |
| `downloadMediaFile(url, targetDir, progressCallback)` | Progress callback | Download a media file |
| `downloadCameraLogFile(targetDir, progressCallback?)` | Coroutine | Download the camera log file; returns the local path |
| `downloadCameraLogFile(targetDir, progressCallback)` | Progress callback | Download the camera log file |

---

## 6. Firmware Upgrade

### CameraFirmware

```kotlin
interface CameraFirmware
```

| Method | Style | Description |
|--------|-------|-------------|
| `getVersion(): Result<String>` | Synchronous | Get the current firmware version |
| `upgradeFirmware(filePath, callback)` | Progress callback | Upgrade the firmware; progress ranges from 0.0 to 1.0 |
| `upgradeFirmware(filePath, progress?)` | Coroutine | Upgrade the firmware with an optional progress callback |

---

## 7. GPS Data Injection

To embed GPS data in media files during capture, hold and manage your own location data source and pass the GPS data for the start and stop moments to `CameraCapture.startCapture(gpsInfo)` / `stopCapture(gpsInfo)`. To update it while recording, call `CameraCapture.setGpsInfo(gpsInfo)`.

### GpsInfo

```kotlin
data class GpsInfo(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double,
    val timestampMs: Long
)
```

| Property | Description |
|----------|-------------|
| `latitude` | Latitude (degrees) |
| `longitude` | Longitude (degrees) |
| `altitude` | Altitude (meters) |
| `timestampMs` | Timestamp (milliseconds) |
| `toByteArray()` | Serialize to a little-endian byte array |

---

## 8. Event Listeners

### DisconnectListener

Fires when the device loses its connection to the camera. Registered via `CameraDevice.registerDisconnectListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onDisconnect(throwable: Throwable?)` | throwable: the disconnection cause (null for a normal disconnect) | The connection was closed |

---

### BleWakeUpListener

Bluetooth wake-up result callback, passed to `CameraDevice.bleWakeUp()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onWakeUpSuccess()` | — | Bluetooth wake-up succeeded |
| `onWakeUpError(errCode: Int)` | errCode: error code | Bluetooth wake-up failed |

---

### BatteryListener

Registered via `CameraSystem.registerBatteryListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onBatteryLevelChange(batteryData: BatteryData)` | batteryData: battery level and charging state | Battery level changed |
| `onLowBatteryWarning()` | — | Low battery warning |

---

### ChargeBoxStatusListener

Registered via `CameraSystem.registerChargeBoxStatusListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onChargeBoxStatusChange(chargeBoxData: ChargeBoxData)` | chargeBoxData: charge case state | Charge case state changed |

---

### TemperatureListener

Registered via `CameraSystem.registerTemperatureListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onTemperatureUpdate(tempState: TempState)` | tempState: temperature level | Camera temperature state changed |

---

### StorageStateListener

Registered via `CameraSystem.registerStorageStatusListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onStorageStateListChanged(storageDataList: List<StorageData>)` | storageDataList: state of every storage medium | Storage state changed |

---

### CaptureStatusListener

Registered via `CameraCapture.registerCaptureStatusListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onCaptureStarting(functionMode)` | Current capture mode | Capture is about to start |
| `onCaptureWorking(functionMode)` | Current capture mode | Capture has entered the working state |
| `onCaptureStopping(functionMode)` | Current capture mode | Capture is about to stop |
| `onCaptureFinish(functionMode, filePaths)` | filePaths: paths of the generated files | Capture finished and files were generated |
| `onCaptureError(functionMode, throwable)` | throwable: error cause | A capture error occurred |
| `onCaptureTimeChanged(functionMode, captureTime)` | captureTime: elapsed recording time | Recording duration changed (video modes) |
| `onCaptureCountChanged(functionMode, captureCount)` | captureCount: shots taken so far | Shot count changed (burst / interval) |
| `onCaptureSubStatusChanged(functionMode, subStatus)` | subStatus: sub-status | Capture sub-status changed (for example HDR processing) |

---

### CameraPostureUpdate

Registered via `CameraPreview.registerPostureListener()` to receive the camera's spatial posture data in real time.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `updatePosture(cameraPosture: CameraPosture)` | cameraPosture: posture data | Posture data updated (gyroscope / accelerometer) |

---

### AuthorizationListener

Registered via `CameraDevice.registerAuthorizationListener()` to receive the result of authorization actions taken on the camera.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onAuthorizationResult(operationType, result)` | operationType: the operation that triggered this authorization; result: the authorization result | Fires after the user approves or rejects authorization on the camera |

---

## 9. Shared Data Types

The types below are shared between the Camera and Media modules and are listed here for reference.

### KMPCameraPreviewPipeline

Defined in `verticalCommon` and used on both the Camera and Media sides:

- Camera side: `CameraPreview.setPipeline(pipeline)` — inject the pipeline into the camera preview
- Media side: `PreviewPlayer.getPipeline()` — get the current rendering pipeline

The pipeline object is created on the media side and passed to the camera side, where it serves as the transport channel for preview data.

---

### PreviewStreamParamsUpdate (Camera → Media)

When the camera's preview stream parameters change, this object is delivered through `CameraStreamListener.onParamsChanged()`. On the media side, `PreviewPlayer.setOffset()` and `setWindowCropInfo()` are typically updated from the data it carries.

See [§4 Live Preview – PreviewStreamParamsUpdate](#previewstreamparamsupdate).
