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

The core interface for a camera device and the unified access point for every feature entry.

```kotlin
interface CameraDevice
```

**Factory method**

```kotlin
CameraDevice.get(connectType: ConnectType): CameraDevice
```

**Feature entries**

| Property | Type | Description |
|----------|------|-------------|
| `system` | `CameraSystem` | System-level features |
| `capture` | `CameraCapture` | Capture control |
| `preview` | `CameraPreview` | Live preview stream |
| `file` | `CameraFile` | On-camera file management |
| `firmware` | `CameraFirmware` | Firmware version and upgrade |

**Connection methods**

Unless noted otherwise, connection methods come in both a callback form and a coroutine (suspend) form. When `isBleOnly` is true, only a BLE connection is established; when it is false, the SDK continues to fetch Wi-Fi data after connecting.

| Method | Style | Description |
|--------|-------|-------------|
| `isConnected()` | Synchronous | Whether the camera is connected |
| `scan(timeoutMs, bleScanCallback)` | Synchronous | Scan for nearby camera devices (mainly for Bluetooth connections); `timeoutMs` is the scan timeout in milliseconds |
| `stopScan()` | Synchronous | Stop scanning |
| `bleWakeUp(cameraType, deviceName, listener)` | Synchronous | Wake the camera over Bluetooth |
| `connect(connectHint, callback)` | Callback | Generic connect; `connectHint` is, for example, a Wi-Fi SSID, a Bluetooth MAC address, or a connection configuration object |
| `connect(connectHint, isBleOnly)` | Coroutine | Generic connect |
| `connectBle(bleDeviceCore, isBleOnly, callback)` | Callback | Bluetooth connect (the SDK's `BleDeviceCore`) |
| `connectBle(bleDeviceCore, isBleOnly)` | Coroutine | Bluetooth connect (the SDK's `BleDeviceCore`) |
| `connectBle(kmpBleDevice, isBleOnly, callback)` | Callback | Bluetooth connect (system Bluetooth object; `BluetoothDevice` on Android) |
| `connectBle(kmpBleDevice, isBleOnly)` | Coroutine | Bluetooth connect (system Bluetooth object) |
| `connectWiFi(networkId, callback)` | Callback | Wi-Fi connect; `networkId` is the Wi-Fi network ID |
| `connectWiFi(networkId)` | Coroutine | Wi-Fi connect |
| `connectWiFiAware(networkHandle, peerIpv6, callback)` | Callback | Wi-Fi Aware (NAN) connect; the NAN handshake must first be completed on the app side |
| `connectWiFiAware(networkHandle, peerIpv6)` | Coroutine | Wi-Fi Aware (NAN) connect; the NAN handshake must first be completed on the app side |
| `connectUsb(callback)` | Callback | USB connect |
| `connectUsb()` | Coroutine | USB connect |
| `disconnect(callback)` / `disconnect()` | Callback / Coroutine | Disconnect from the current camera |
| `getSupportCameraType()` | Synchronous | List the camera models supported by the current connection type (`List<CameraType>`) |
| `release()` | Synchronous | Release all resources held by the device object; the object can no longer be used afterwards |

> Both parameters of `connectWiFiAware` come from the result of the app-side NAN handshake: `networkHandle` is taken from
> `android.net.Network.getNetworkHandle`, and `peerIpv6` is taken from
> `android.net.wifi.aware.WifiAwareNetworkInfo.getPeerIpv6Addr`.

**Disconnection monitoring**

| Method | Description |
|--------|-------------|
| `registerDisconnectListener(listener)` | Register a disconnection listener (`DisconnectListener`) |
| `unregisterDisconnectListener(listener)` | Unregister a disconnection listener |

**Camera authorization**

After connecting, use the methods below to verify whether the current device has been authorized by the camera. The camera displays a confirmation dialog, and the user's approval or rejection is delivered through `AuthorizationListener`.

| Method | Style | Description |
|--------|-------|-------------|
| `checkAuthorization(callback)` / `checkAuthorization()` | Callback / Coroutine | Check authorization; returns `AuthorizationStatus` |
| `cancelAuthorization(callback)` / `cancelAuthorization()` | Callback / Coroutine | Cancel the authorization check currently in progress |
| `registerAuthorizationListener(listener)` | Synchronous | Register an authorization result listener (`AuthorizationListener`) |
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

Writable items additionally provide a `setXxx(...)` method. A few items are available only as `getXxx()`; see the "Style" column in the table below.

**Data items**

| Data item | Type | Style | Writable | Description |
|-----------|------|-------|----------|-------------|
| BatteryData | `BatteryData` | All three | ✗ | Battery level and charging state |
| ChargeBoxData | `ChargeBoxData` | All three | ✗ | Charge case state |
| Mute | `Boolean` | All three | ✓ | Mute state |
| AiVoiceAssistantStatus | `AiVoiceAssistantStatus` | All three | ✗ | AI voice assistant status; see the note below |
| SerialNumber | `String` | All three | ✗ | Serial number |
| Uuid | `String` | All three | ✗ | UUID |
| OriginOffset / V2 / V3 | `String` | All three | ✗ | Original lens offset (multiple versions) |
| ActivateTime | `Long` | All three | ✓ | Activation time |
| ~~StorageData~~ | ~~`StorageData`~~ | All three | ✗ | Deprecated; use `StorageDataList` |
| StorageDataList | `List<StorageData>` | All three | ✗ | State of each storage medium (supports multiple storage locations) |
| MainStorage | `StorageData.FileLocation` | All three | ✓ | Current primary storage location, i.e. where the camera writes subsequent files. Only available on models with internal storage (X6 and later); returns a failure if the camera has not reported this location |
| MediaOffset / V2 / V3 / V6 | `String` | All three | ✗ | Media offset (multiple versions) |
| SupportConfig | `ICameraConfig` | get only | ✗ | Configuration object for the connected camera |
| FirmwareRevision | `String` | All three | ✗ | Firmware version |
| WifiData | `WiFiData` | All three | ✗ | Wi-Fi data; `getWifiInfo` / `fetchWifiInfo` are aliases kept for the legacy naming |
| WifiChannelList | `WiFiChannel` | All three | ✗ | Wi-Fi channel list |
| CameraType | `CameraType` | All three | ✗ | Camera model |
| VideoEncodeType | `VideoEncode` | All three | ✓ | Video encoding type |
| IsSelfie | `Boolean` | All three | ✗ | Whether selfie mode is active |
| WindowCropInfo | `WindowCropInfo` | get only | ✗ | Window crop information |
| HalfWindowCropInfo | `WindowCropInfo` | get only | ✗ | Half-window crop information, used for offline stabilization |
| SensorInfo | `Sensor` | get only | ✗ | Sensor information (protocol-layer sensor object) |
| OffsetState | `Int` | get only | ✗ | Offset state |
| OffsetDetectedType | `Int` | get only | ✗ | Offset detection type |
| CameraLanguage | `LanguageType` | All three | ✓ | Camera language setting |
| AssistiveGridEnable | `Boolean` | All three | ✓ | Assistive grid toggle |
| FreeFrameGridEnable | `Boolean` | All three | ✓ | Free-aspect grid toggle |
| Sharpness | `Sharpness` | All three | ✓ | Global sharpness |
| MediaTime | `Long` | All three | ✗ | Media time |
| RollingShutterTime | `Double` | All three | ✗ | Rolling shutter time |

> **AI voice assistant**: `enabled` being true means the voice assistant is in use (the camera holds the Classic Bluetooth link for an extended period).
> On failure, use `Result.exceptionOrNull()` to tell the causes apart: `AlreadyReleasedException` (the object has been released),
> `CameraNotConnectedException` (not connected or not ready), `OptionValueNullException` (connected but the status has never been fetched),
> `CameraNotSupportException` (the camera does not support this capability). `enabled == false` also occurs when the camera has not reported the toggle field,
> so it cannot be taken as reliable confirmation that the assistant is not in use. The SDK only supports querying and provides no app-side toggle; `fetchAiVoiceAssistantStatus()`
> returns a failure within 10 seconds if the camera does not respond.

**Operations**

| Method | Style | Description |
|--------|-------|-------------|
| `setLocalTime(localTime, callback)` / `setLocalTime(localTime)` | Callback / Coroutine | Set the camera's local time; also sends GEOGRAPHIC_TIME_ZONE based on the phone's system time zone, which models such as X6 rely on exclusively to determine local time |
| `setMute(enable, callback)` / `setMute(enable)` | Callback / Coroutine | Set the mute state |
| `setActivateTime(activeTime, callback)` / `setActivateTime(activeTime)` | Callback / Coroutine | Set the camera's activation time |
| `setVideoEncodeType(videoEncode, callback)` / `setVideoEncodeType(videoEncode)` | Callback / Coroutine | Set the video encoding type |
| `setCameraLanguage(languageType, callback)` / `setCameraLanguage(languageType)` | Callback / Coroutine | Set the camera language |
| `setAssistiveGridEnable(enable, callback)` / `setAssistiveGridEnable(enable)` | Callback / Coroutine | Set the assistive grid toggle |
| `setFreeFrameGridEnable(enable, callback)` / `setFreeFrameGridEnable(enable)` | Callback / Coroutine | Set the free-aspect grid toggle |
| `setSharpness(sharpness, callback)` / `setSharpness(sharpness)` | Callback / Coroutine | Set the global sharpness |
| `openCameraWiFi(channel, callback)` / `openCameraWiFi(channel)` | Callback / Coroutine | Turn the camera's Wi-Fi on; `channel` defaults to 0 |
| `closeCameraWiFi(callback)` / `closeCameraWiFi()` | Callback / Coroutine | Turn the camera's Wi-Fi off |
| `setWifiMode(mode, countryCode, callback)` / `setWifiMode(mode, countryCode)` | Callback / Coroutine | Set the camera's Wi-Fi mode, for example switch to `WiFiData.Mode.Android_Aware` to enable Wi-Fi Aware connections; an empty `countryCode` leaves the country code unchanged |
| `resetCameraWiFi(channel, callback)` / `resetCameraWiFi(channel)` | Callback / Coroutine | Restart the camera's Wi-Fi; `channel` defaults to 0 |
| `setWiFiCountry(countryCode, callback)` / `setWiFiCountry(countryCode)` | Callback / Coroutine | Set the Wi-Fi country code |
| `activeCamera(appId, secretKey, callback)` / `activeCamera(appId, secretKey)` | Callback / Coroutine | Activate the camera; `secretKey` is used for encryption and signing |
| `calibrateGyro(callback)` / `calibrateGyro()` | Callback / Coroutine | Calibrate the camera's gyroscope |
| `setLockScreenState(state, callback)` / `setLockScreenState(state)` | Callback / Coroutine | Set the camera's screen lock state |
| ~~`formatSdCard(callback)`~~ / ~~`formatSdCard()`~~ | Callback / Coroutine | Deprecated; use `formatStorage` (its default location is `FileLocation.CAMERA`) |
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
| `suspend setValue(value: T): Result<Unit>` | Write a new value; registered local listeners are notified after a successful write |
| `suspend getSupported(): Result<List<T>>` | Get the values available for this parameter in the current camera mode |
| `getName(): String` | Get the parameter's name identifier |
| `addListener(listener: (T) -> Unit)` | Subscribe to value-change callbacks |
| `removeListener(listener: (T) -> Unit)` | Unsubscribe from value-change callbacks |

> Value-change callbacks fire only after a parameter is written successfully through this SDK. Fields rewritten as a side effect of another parameter do not notify their own listeners;
> call `getValue()` to read them again (see the notes on `exposureISO` and related parameters).

**Capture parameters**

All parameters are exposed as `CameraParam<T>` properties on `CameraCapture`:

| Property | Type T | Description |
|----------|--------|-------------|
| `lensType` | `SensorMode` | Lens type (single lens, dual lens, and so on) |
| `functionMode` | `FunctionMode` | Capture function mode (normal video, normal photo, timelapse, and so on) |
| `photoResolution` | `PhotoResolution` | Photo resolution |
| `videoResolution` | `RecordResolution` | Video resolution |
| `hdrPhotoMode` | `PhotoHdrType` | Photo HDR mode |
| `hdrSwitch` | `Boolean` | Video HDR toggle |
| `aeb` | `Int` | Auto exposure bracketing (AEB) |
| `rawType` | `RawType` | RAW format type |
| `exposureProgram` | `ExposureMode` | Exposure mode (two states: auto / manual); see the notes below |
| `exposureISO` | `Int` | ISO; on some models, setting it also rewrites the exposure program |
| `exposureShutterSpeed` | `Pair<Double, Double>` | Shutter speed; same linkage rules as `exposureISO` |
| `videoISOTopLimit` | `Int` | Video ISO upper limit |
| `exposureBias` | `Double` | Exposure compensation (EV) |
| `whiteBalance` | `Int` | White balance |
| `fovType` | `FovType` | Field-of-view type (wide, linear, narrow, and so on) |
| `flowStateLevel` | `FlowStateLevel` | Stabilization level |
| `photographySelfTimer` | `Int` | Photo self-timer |
| `splicingBaseEnable` | `Boolean` | Base stitching toggle |
| `videoSelfieMode` | `VideoSelfieMode` | Video selfie mode |
| `exportType` | `ExportType` | Export type |
| `photoSizeId` | `PhotoSize` | Photo size / aspect ratio |
| `colorMode` | `VideoGammaMode` | Color mode |
| `filterMode` | `VideoGammaMode` | Filter mode |
| `accelerateFrequency` | `Int` | Speed-up factor (typically for timelapse) |
| `recordDuration` | `Int` | Recording duration (for example the segment length in loop recording) |
| `exposureIndividual` | `PanoExposureMode` | Panoramic independent exposure toggle. On models whose exposure programs support panoramic independent exposure but that do not declare the native capability, this parameter is a virtual toggle: it only reads and writes the exposure program and does not write the native field |
| `livingBitrate` | `Int` | Live streaming bitrate |
| `burstCaptureParams` | `Pair<Int, Int>` | Burst parameters (shot count, time interval) |
| `p3Switch` | `Boolean` | Display P3 color gamut toggle |
| `iLogSwitch` | `Boolean` | i-Log color mode toggle |
| `pureVideoEnhanceSwitch` | `Boolean` | PureVideo night enhancement toggle |
| `doubleZoomEnable` | `Boolean` | 2x zoom toggle |
| `lapseTime` | `Double` | Interval between shots in interval shooting |
| `livePhotoMode` | `Boolean` | Live Photo mode |
| `lensAccessory` | `LensAccessoryType` | Lens accessory type (for example a lens guard) |

**Linked behavior of exposure parameters**

- `exposureProgram` exposes only the two states auto / manual. It does not expose the camera's six internal exposure programs (auto, ISO priority, shutter priority, manual, full auto, panoramic independent exposure); the program is derived from the ISO / shutter linkage.
  When the value crosses the auto/manual boundary, the exposure combination written to the camera depends on the model generation: some generations reset ISO / shutter / ISO upper limit to auto, others pass the values through unchanged. No write happens if the boundary is not crossed.
- Panoramic independent exposure is not entered or exited through `exposureProgram`; use the `exposureIndividual` toggle. While panoramic independent exposure is active, setting `ExposureMode.MANUAL` returns a failure; turn off `exposureIndividual` first.
- When the current shooting mode declares 3A pro mode (for example some X6 modes), the two states map directly to the camera's normal / pro mode: reads look only at that state, and switching sends only that state without touching ISO / shutter / the actual exposure program. Some modes support manual only, so the only available value is `ExposureMode.MANUAL`; in that case panoramic independent exposure does not block switching to manual.
- On models with linkage enabled, `exposureISO` / `videoISOTopLimit` rewrite the camera's actual exposure program (to keep the combination written to the camera consistent), so the two-state value of `exposureProgram` may change as a result. There is no linkage in 3A pro mode. While in auto (normal mode), setting a manual value may have no effect; switch `exposureProgram` to `MANUAL` first.

**Parameter management**

| Method | Description |
|--------|-------------|
| `getSupportParam(): List<CameraParam<*>>` | List the parameters supported by the connected camera |
| `suspend syncAllParams()` | Force a sync of all parameter states from the camera and update the local cache |
| `suspend loadJson(): Result<Unit>` | Load the camera's parameter configuration JSON (usually called after connecting, to initialize the list of supported parameters) |

> `getSupportParamNames()` and `getAllParams()` are deprecated; use `getSupportParam()` instead.

**Capture control**

| Method | Description |
|--------|-------------|
| `suspend startCapture(gpsInfo: GpsInfo? = null)` | Start capturing (video or photo depending on the current `functionMode`), optionally writing GPS data into the media file |
| `suspend stopCapture(gpsInfo: GpsInfo? = null)` | Stop capturing, optionally writing GPS data into the media file |
| `suspend setGpsInfo(gpsInfo: GpsInfo)` | Update GPS data while capturing |
| `suspend isWorking(): Boolean` | Whether the camera is currently capturing |
| `isPreRecording(): Boolean` | Whether pre-recording is active |
| `cancelPreRecord()` | Cancel pre-recording |
| `suspend getBurstTime(): Result<Unit>` | Get the burst time |
| `suspend getRemaining(): Result<Int>` | Remaining recording time (seconds) or remaining shot count for the current mode |
| `getRemaining(functionMode): Result<Int>` | Remaining capacity for a given capture mode (from the local cache) |
| `suspend fetchRemaining(functionMode): Result<Int>` | Fetch the latest remaining capacity for a given capture mode from the camera |
| `registerCaptureStatusListener(listener)` | Register a capture status listener |
| `unregisterCaptureStatusListener(listener)` | Unregister a capture status listener |

---

## 4. Live Preview

### CameraPreview

Controls starting and stopping the camera's live preview stream, retrieves stream parameters, monitors camera posture, and handles live streaming.

```kotlin
interface CameraPreview
```

| Method | Description |
|--------|-------------|
| `init(context: KMPContext)` | Initialize the preview service; call this before any other preview API (on Android, `KMPContext` is the `Application`) |
| `startStream()` | Start the preview stream (the decoder configuration is synced automatically from the current video encoding configuration before starting) |
| `stopStream()` | Stop the preview stream |
| `requestStreamIframe()` | Request an immediate key frame (I-frame), used to initialize the decoder or quickly recover from a corrupted image |
| `getPreviewParams(): Result<PreviewParams>` | Get a snapshot of the parameters that will be used to open the preview stream (computed from the function mode, recording state, and camera configuration) |
| `getCurrentFunctionMode(): Result<FunctionMode>` | Get a snapshot of the function mode of the current preview session |
| `getVideoBitrate(): Result<Int>` | Get the cached video bitrate (bps) |
| `suspend fetchVideoBitrate(): Result<Int>` | Fetch the latest video bitrate from the camera |
| `suspend setVideoBitrate(bitrate: Int): Result<Unit>` | Set the video bitrate (bps) |
| `setStreamEncode(isH265: Boolean)` | Manually override the preview stream decoder configuration (rarely needed; `startStream()` syncs it automatically) |
| `setPipeline(pipeline: KMPCameraPreviewPipeline?)` | Set the preview stream rendering pipeline; pass null to clear it |
| `registerPostureListener(listener)` | Register a camera posture update listener (`CameraPostureUpdate`) |
| `unregisterPostureListener(listener)` | Unregister a camera posture update listener |
| `registerCameraStreamListener(listener)` | Register a preview stream state listener (`CameraStreamListener`) |
| `unregisterCameraStreamListener(listener)` | Unregister a preview stream state listener |
| `suspend startLive(params): Result<Unit>` | Start an RTMP live stream; see the notes below |
| `startLive(params, callback)` | Start a live stream (callback form) |
| `suspend stopLive(): Result<Unit>` | Stop the live stream |
| `stopLive(callback)` | Stop the live stream (callback form) |
| `registerCameraLiveListener(listener)` | Register a live streaming state listener (`CameraLiveListener`) |
| `unregisterCameraLiveListener(listener)` | Unregister a live streaming state listener |

> `registerBatteryListener` / `unregisterBatteryListener` are the legacy names for the posture listener methods and are deprecated; use
> `registerPostureListener` / `unregisterPostureListener` instead.

> Preconditions for `startLive`: you must first set `functionMode` to `FunctionMode.VIDEO_LIVE` and call `startStream()`
> so that the preview stream is open (OPENED, or PARAMS_CHANGED after a parameter change once opened); otherwise it returns a failure. A successful return only means the streaming request
> was accepted; the actual streaming state is delivered asynchronously through `CameraLiveListener`. The panoramic stitched / panoramic raw / flat rendering mode is specified by
> `CameraLiveParams.mode`; if omitted, the SDK decides based on the media offset reported by the camera (dual-lens → panoramic stitched,
> single-lens / wide-angle → panoramic raw).

### CameraStreamListener

```kotlin
interface CameraStreamListener
```

| Callback | Description |
|----------|-------------|
| `onOpening()` | The preview stream is opening |
| `onOpened()` | The preview stream opened successfully |
| `onIdle()` | The preview stream is closed |
| `onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate)` | Preview stream parameters (resolution, frame rate, crop information, and so on) changed |
| `onStreamDataNotify(streamData: PreviewStreamFrame)` | A preview stream data frame was received (empty default implementation) |

### CameraLiveParams

Live streaming parameters passed to `CameraPreview.startLive()`.

```kotlin
data class CameraLiveParams(
    val rtmpUrl: String,
    val mode: LiveMode? = null,
    val width: Int,
    val height: Int,
    val fps: Int,
    val bitrate: Int,
    val netId: Long = -1L,
)
```

| Property | Description |
|----------|-------------|
| `rtmpUrl` | RTMP streaming URL |
| `mode` | Live rendering mode (`LiveMode`), unrelated to `functionMode`. If omitted, the SDK decides based on the media offset reported by the camera (dual-lens → panoramic stitched, single-lens / wide-angle → panoramic raw) |
| `width` / `height` | Stream resolution (pixels) |
| `fps` | Stream frame rate |
| `bitrate` | Stream bitrate (in Mbps; converted to bps internally) |
| `netId` | Network ID used for streaming; defaults to -1 (the underlying default network). The SDK does not manage networks — to bind a specific network such as cellular, pass the corresponding network ID |

### LiveMode

Live rendering mode enum, explicitly specified by the caller in `CameraLiveParams`.

| Value | Description |
|-------|-------------|
| `PANO_STITCH` | Panoramic stitched live stream |
| `PANO_CAPTURE` | Panoramic raw live stream (no stitching; spherical rendering) |
| `PLANE` | Flat live stream |

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
| `onFailed(errorCode: Int, message: String?)` | A streaming error occurred; `errorCode` is the underlying error code, and `message` may be null |

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
| `data` | Actual frame bytes |
| `timestamp` | Frame timestamp; the unit is determined by the underlying layer (usually milliseconds, which must be converted to microseconds before feeding MediaCodec for decoding) |
| `type` | Frame type; see the table below |

### PreviewStreamType

| Value | Description |
|-------|-------------|
| `VIDEO` | Regular video frame |
| `VIDEO_L` | Left-eye / left-side video frame (for panoramic or 3D video) |
| `VIDEO_R` | Right-eye / right-side video frame (for panoramic or 3D video) |
| `AUDIO` | Audio frame |
| `GYRO` | Gyroscope / posture data frame |
| `OTHER` | Other type of data |
| `UNKNOWN` | Unknown type of data |

> `val isVideo: Boolean` — whether this is a video frame (`VIDEO` / `VIDEO_L` / `VIDEO_R`).

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
| `windowCropInfo` | Camera window crop information, used for panoramic stitching |
| `offsetData` | Camera preview offset data, including lens calibration parameters |
| `stabOffset` | Stabilization offset string |
| `previewWidth` / `previewHeight` | Width and height of the current preview stream (pixels) |
| `previewFps` | Frame rate of the current preview stream |

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
| `getEndpoint(): String` | Full base URL of the file server (for example `http://192.168.42.1:80/`) |
| `getHost(): String` | Host address (for example `192.168.42.1`) |
| `getProt(): Int` | Port number (usually 80) |

**File listing**

| Method | Style | Description |
|--------|-------|-------------|
| `listMediaFiles(mediaFileType, includeRecording, callback)` | Callback | Get the complete file list as a list of URIs |
| `listMediaFiles(mediaFileType, includeRecording)` | Coroutine | Same as above |
| `listMediaFiles(mediaFileType, start, limit, includeRecording, callback)` | Callback | Paged listing; returns `Pair<List<String>, Int>` (current page items, total file count) |
| `listMediaFiles(mediaFileType, start, limit, includeRecording)` | Coroutine | Same as above |
| `getFileInfoList(callback)` | Callback | Get the information list of all files (`List<FileInfo>`) |
| `getFileInfoList()` | Coroutine | Same as above |

> `mediaFileType` defaults to `MediaFileType.VIDEO_AND_PHOTO`; `includeRecording` defaults to false, and when true the list includes the file currently being recorded.

**File operations**

| Method | Style | Description |
|--------|-------|-------------|
| `deleteMediaFiles(vararg uris, callback)` | Callback | Delete the given files |
| `deleteMediaFiles(vararg uris)` | Coroutine | Delete the given files |
| `downloadMediaFile(url, targetDir, progressCallback?)` | Coroutine | Download a media file; returns the absolute path of the downloaded local file |
| `downloadMediaFile(url, targetDir, progressCallback)` | Progress callback | Download a media file |
| `downloadCameraLogFile(targetDir, progressCallback?)` | Coroutine | Download the camera log file; returns the absolute path of the local log file |
| `downloadCameraLogFile(targetDir, progressCallback)` | Progress callback | Download the camera log file |

> In the coroutine form, the `progressCallback` parameters are `(bytes downloaded, total bytes)`; the callback form uses the `ProgressCallback` interface.
> The coroutine overload of `downloadMediaFile` requires `targetDir` to be passed explicitly (the callback overload defaults to the SDK working directory); `targetDir` of `downloadCameraLogFile` defaults to the SDK log directory.

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

> The upgrade transfers the local firmware file to the camera and triggers the upgrade.

---

## 7. GPS Data Injection

To embed GPS data in media files during capture, hold and manage your own location data source and pass the GPS data for the start and stop moments to `CameraCapture.startCapture(gpsInfo)` / `stopCapture(gpsInfo)`. To update it while recording, call `CameraCapture.setGpsInfo(gpsInfo)`.

> The GPS data for the capture start is written together with the capture request; calling `setGpsInfo` while recording keeps updating the track record.
> The track is aligned with media frames by `timestampMs`, so this timestamp must share the same time base as the camera clock.

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
| `timestampMs` | Timestamp at which this GPS data was recorded (UTC milliseconds) |

> The track record is aligned with media frames by `timestampMs`, so this timestamp must share the same time base as the camera clock.

---

## 8. Event Listeners

### DisconnectListener

Fires when the device loses its connection to the camera. Registered via `CameraDevice.registerDisconnectListener()`.

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onDisconnect(throwable: Throwable?)` | throwable: the disconnection cause (null for a normal, intentional disconnect) | The connection was closed |

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
| `onCaptureWorking(functionMode)` | Current capture mode | Capture has officially started and is in the working state |
| `onCaptureStopping(functionMode)` | Current capture mode | Capture is about to stop |
| `onCaptureFinish(functionMode, filePaths)` | filePaths: list of file paths / URIs generated on the camera | Capture finished and files were generated successfully |
| `onCaptureError(functionMode, throwable)` | throwable: error cause | An error occurred during capture |
| `onCaptureTimeChanged(functionMode, captureTime)` | captureTime: elapsed recording time (continuous capture modes such as video only) | Recording duration changed |
| `onCaptureCountChanged(functionMode, captureCount)` | captureCount: shots taken so far (burst, interval shooting, and so on) | Shot count changed |
| `onCaptureSubStatusChanged(functionMode, subStatus)` | subStatus: capture sub-status (for example panoramic stitching progress or HDR processing) | Capture sub-status changed |

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
| `onAuthorizationResult(operationType, result)` | operationType: the operation type that triggered this authorization result; result: the result of the authorization operation | Fires after the user approves or rejects authorization on the camera |

---

## 9. Shared Data Types

The types below are shared by the Camera SDK and the Media SDK and are listed here for reference.

### KMPCameraPreviewPipeline

Used in both the Camera SDK and the Media SDK:

- Camera SDK: `CameraPreview.setPipeline(pipeline)` — inject the pipeline into the camera preview
- Media SDK: `PreviewPlayer.getPipeline()` — get the current rendering pipeline

The pipeline object is created on the Media SDK side and passed to the camera side, where it serves as the transport channel for preview data.

---

### PreviewStreamParamsUpdate (Camera → Media)

When the camera's preview stream parameters change, this object is delivered through `CameraStreamListener.onParamsChanged()`. On the media side, `PreviewPlayer.setWindowCropInfo()` is typically updated from the crop window it carries; `offsetData` and `stabOffset` are maintained by the player itself based on the camera configuration, and the corresponding `setOffset()` is deprecated and now an empty implementation.

See [§4 Live Preview – PreviewStreamParamsUpdate](#previewstreamparamsupdate).
