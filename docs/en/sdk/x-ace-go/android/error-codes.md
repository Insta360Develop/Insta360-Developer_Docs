# Error Code Reference

This page lists the error codes integrators can actually receive on **Android**, organized by where you get them.

## Before You Read

The current SDK reports errors through `Result<T>` and `InstaException` subclasses. Most failures carry only an exception type and message, with no number; **integer error codes appear only in the channels below**:

| Where you get it | Where the value comes from |
|---|---|
| `NativeException.nativeErrorCode` in `Result.onFailure` / `Callback.onThrowable` | Connection, export, stitching, and player internals |
| `NativeException.nativeErrorCode` in `DisconnectListener.onDisconnect(throwable)` | Connection internals |
| `BleWakeUpListener.onWakeUpError(errCode)` | Bluetooth advertising |
| `CameraLiveListener.onFailed(errorCode, message)` | Streaming internals |
| `CameraActivateException.code` | Activation backend |
| `AiVoiceAssistantStatus.errorCode` | Raw enum value reported by the camera |
| `HttpStatusException.code` / `FirmwareUpgradeHttpException.code` | HTTP status code — **not** a business error code |

`TemplateOtherException`, `StitchSeparatedFisheyeException`, `GenerateHDRException`, and `GeneratePureShotFailedException` all extend `NativeException`, so the table above applies to their `nativeErrorCode` as well.

> **The same number means completely different things in different channels — never look it up across channels.**
> For example, `1002` means "socket received corrupted data" in the connection channel but "audio filter recording failed" in the streaming channel; `-1` means "Bluetooth is off" in the scan channel but "streaming module not initialized" in the streaming channel. When troubleshooting, first confirm which callback the code came from, then check the matching section.

---

## 1. Camera Connection

Connection failures are returned through `Result.onFailure` / `Callback.onThrowable` of `CameraDevice.connect*()`; forced disconnections after the connection is established are returned through `DisconnectListener.onDisconnect(throwable)`. Both are `NativeException` — read `nativeErrorCode`.

### 1.1 Bluetooth Connection Failures (`100` – `140`)

| Code | Description |
|---|---|
| 100 | Operation timed out |
| 101 | Generic GATT error |
| 102 | Other error |
| 103 | Failed to open the link |
| 104 | Sync packet timed out |
| 105 | Failed to subscribe to notify |
| 106 | Failed to set MTU |
| 107 | Failed to write characteristic |
| 108 | Handshake failed |
| 109 | Wake-up authorization failed |
| 110 | Camera busy |
| 133 | GATT status 133 (system-level exception) |
| 134 | Characteristic not found |
| 135 | Uncategorized exception |
| 136 | Privileged crash |
| 137 | Classic Bluetooth connection timed out |
| 138 | Classic Bluetooth connection canceled |
| 139 | Classic Bluetooth pairing failed |
| 140 | Missing `BLUETOOTH_CONNECT` runtime permission (retrying won't help; prompt the user to grant it) |

### 1.2 Bluetooth Scan Failures

| Code | Description |
|---|---|
| -1 | Bluetooth is off |
| -2 | BLE Scanner unavailable |
| -3 | A scan is already running in the app |
| -4 | Missing scan permission |
| -100 | BLE scanning is not supported on this platform |
| 1 | A scan is already running at the system level |
| 2 | App registration failed |
| 3 | Internal error |
| 4 | BLE scanning feature not supported |
| 5 | Insufficient hardware resources |
| 6 | Scanning too frequently |

### 1.3 USB / Socket Connection Failures and Runtime Disconnections

| Code | Description |
|---|---|
| -19 | Socket operation timed out |
| -120 | USB transfer error |
| -121 | Device not found / device unplugged |
| -210 | Socket closed |
| -211 | Socket read failed |
| -212 | Socket write failed |
| -213 | Socket `fd_set` failed |
| -214 | Socket connection failed |
| -503 | Camera busy |
| -504 | Occupied by cloud upload |
| -505 | Occupied by Wi-Fi switching |
| 501 | Bluetooth link disconnected |
| 1001 | Socket device busy |
| 1002 | Socket received corrupted data and disconnected |

> `-121` covers both "device not found" and "device unplugged"; the two cannot be told apart by the code.
> `501` is the most common disconnection code after a connection is established. It usually means the camera-side Bluetooth link has dropped, and you need to reconnect.

### 1.4 Typed Connection Exceptions (No Number)

The following failures carry only an exception type and message — `nativeErrorCode` is not available. Troubleshoot by exception type:

| Exception | Meaning |
|---|---|
| `BleScanRejectException` | Bluetooth scan rejected (Bluetooth is off or scanning too frequently) |
| `BleDeviceNotFoundException` | No available camera Bluetooth device nearby |
| `BleConnectRejectException` | Bluetooth connection rejected |
| `BleScanningException` | Bluetooth scan in progress |
| `CameraConnectingException` | Camera is connecting; don't start another connection |
| `CameraTypeGetFailedException` | Unable to get the camera type |
| `CameraTypeNotSupportException` | Unsupported camera type |
| `CameraOptionFetchException` | Unable to get camera parameters |

---

## 2. Camera Activation

Activation failures are returned through `CameraActivateException.code`, taken from the `code` field of the activation backend's response body.

| Code | Description |
|---|---|
| -1 | The response body has no `code` field |
| 400 | Invalid parameters (camera type or serial number not obtained) |
| 401 | API signature verification failed |
| 402 | Data encryption verification failed |
| 403 | The nonce has already been used |
| 406 | The timestamp has expired |
| 429 | Too many requests / activation IP rate-limited (45 per IP per day) |
| 500 | Internal system error |
| 3001 | Device serial number does not match the device type |
| 3002 | Camera already activated |
| 3003 | Activation denied: the activation IP is not in an allowed region |
| 3004 | Unable to generate an available serial number |
| 3005 | The system does not support activating this device model |
| 3006 | Serial number locked by the backend; activation not allowed |

**Note the following three failure paths that do not go through `CameraActivateException`:**

- **Non-2xx HTTP status** → `HttpStatusException`. Its `code` is the HTTP status code, a different set of values from the table above — don't mix them up.
- **Network error / request timeout** → the network library's exception is passed through directly, with no `code`.
- **Failed to read the serial number** → `OptionValueNullException("SERIAL_NUMBER")`, with no `code`.

---

## 3. Bluetooth Wake-up

Wake-up failures are returned through `BleWakeUpListener.onWakeUpError(errCode)`.

| Code | Description |
|---|---|
| -99 | This model does not support Bluetooth advertising wake-up (pre-checked inside the SDK; nothing is sent to the system) |
| -1 | An exception was thrown when starting Bluetooth advertising |
| 1 | Advertising data too large |
| 2 | Number of advertisements exceeds the system limit |
| 3 | Advertising already in progress |
| 4 | Internal system error |
| 5 | This device does not support BLE advertising |

> **Known limitation**: when system Bluetooth is off or the device does not support BLE advertising, the underlying layer triggers no callback at all — you receive neither success nor failure. Add your own timeout fallback instead of relying only on this callback.

---

## 4. Capture Failures

When the camera stops capturing on its own (duration limit, storage full, slow card, overheating, low battery, etc.), the SDK throws `CameraCaptureException`.

**This exception carries only a message, with no numeric field**, so you cannot branch on an error code — only display the message. The message is an English string the SDK translates from the enum reported by the camera, for example:

| Reason reported by the camera | Exception message |
|---|---|
| Exceeded the maximum recording duration | `Exceeding the maximum recording duration limit` |
| Storage full | `Exceeding the maximum storage space limit` |
| Exceeded the maximum number of files | `Exceeding the maximum file limit` |
| Storage card write speed too low | `Storage card write speed is too low` |
| Encoding error | `Muxer stream error and recording has been stopped` |
| Frame loss | `Frame loss error occurred and recording has been stopped` |
| Low battery (while recording) | `The camera battery is too low and has stopped recording` |
| Overheating (while recording) | `The camera temperature is too high and has been stopped` |
| Battery too low to start recording | `The camera battery is too low to start recording` |
| Insufficient storage to start recording | `Insufficient storage space to start recording` |
| Too hot to start recording | `The camera temperature is too high to start recording` |
| Task conflict | `Task conflict, recording has been stopped` |
| Recording prohibited during firmware upgrade | `Recording is prohibited during firmware upgrades` |
| Recording prohibited during P2P | `Recording is prohibited during P2P` |
| Other / uncovered reasons | `Recording stopped due to an error` |

**Two things to note:**

- On some model configurations, "exceeded the maximum recording duration" **produces no callback at all** — capture ends silently.
- When the camera reports a reason the SDK doesn't know (usually because the camera firmware is newer than the SDK), it falls back to `Recording stopped due to an error`, and the specific reason is not visible.

A few other capture failure paths embed a native integer in the message (such as `Record video failed, code=xxx`). That integer comes from a native event, not from the enum in the table above, and is for reference only.

---

## 5. Firmware Upgrade

Firmware upgrade failures **expose no integer error code**; distinguish them by exception type:

| Exception | Meaning |
|---|---|
| `FirmwareUpgradeLowBatteryException` | Camera battery is below the level required for the upgrade (the exception carries the required battery percentage) |
| `FirmwareUpgradeChargeBoxLowBatteryException` | Charging case battery is below the level required for the upgrade (the exception carries the required battery percentage) |
| `FirmwareFileNotFoundException` | Firmware file not found |
| `FirmwareUpgradeHttpException` | Abnormal HTTP status during upload (the `code` it carries is the HTTP status code) |
| `FirmwareUpgradeIOException` | IO exception during upload |
| `FirmwareUpgradeCancelException` | Upgrade canceled |
| `FirmwareUpgradeUnknownException` | Other uncategorized exception |
| `CameraNotConnectedException` | Camera not connected |

---

## 6. Media · Export

Export failures are returned through `IExportCallback.onFail(throwable)`.

### 6.1 Named Template Exceptions (No Number)

When template processing fails, a named exception is thrown and `nativeErrorCode` is not available. Troubleshoot by exception type:

| Exception | Meaning |
|---|---|
| `TemplateInvalidFileTypeException` | Invalid template file type |
| `TemplateInvalidOffsetException` | Invalid template offset |
| `TemplateDownloadFailedException` | Template download failed |
| `TemplateParseFailedException` | Failed to parse template imageAsset |
| `TemplateInitFailedException` | Template initialization failed |
| `TemplateBlenderFailedException` | Template image blending failed |

### 6.2 Other Export Failures (`TemplateOtherException.nativeErrorCode`)

| Code | Description |
|---|---|
| -31000 | Export already in progress |
| -31011 | Failed to load stabilization data |
| -31012 | Export terminated because the Work reference was released |
| -31016 | Post-export processing failed |
| -31017 | Original thumbnail LRV missing |
| -31018 | Failed to load original thumbnail LRV |
| -13016 | Export timed out |
| -13021 | Failed to open the hardware encoder |
| -13031 | Frame exporter preparation failed |
| -13033 | Failed to reverse-parse video |
| -13034 | The two streams have different frame formats |
| -13036 | Video frame rate is 0 |
| -13037 | Video bitrate is 0 |
| -13038 | Video width is 0 |
| -13039 | Video height is 0 |
| -13041 | Source video frame rate is 0 |
| -13042 | Source video duration is 0 |
| -13044 | Failed to load AAA parameters |
| -13045 | Failed to create denoising data |
| -13046 | Image width is 0 |
| -13047 | Image height is 0 |
| -13048 | Export URL is empty |

> The table above lists the codes the export pipeline constructs itself. **When an underlying write fails, the export callback passes through the underlying library's error code unchanged**, so you may also receive codes like `-5701110x` (encoder), `-5701220x` (extradata), and negative codes from the underlying audio/video library (such as `-5` or `-22`). These are described in "9. Live Streaming" — both pipelines share the same underlying write and encoding components.

### 6.3 Transcoding / Proxy (Shared by the Player and Export)

| Code | Description |
|---|---|
| -15062 | Unknown transcoding error |
| -15063 | Failed to remux panorama info during transcoding |
| -15064 | Failed to rename after remuxing panorama info during transcoding |
| -15065 | Original export length during transcoding is not 1 |

### 6.4 Cancellation Does Not Go Through onFail

Canceling an export does **not** go to `onFail`; it calls `IExportCallback.onCancel()` instead. The following codes therefore never appear as `nativeErrorCode` — receiving `onCancel` means the user or your business logic canceled on purpose:

`-13017` (export canceled), `-31010` (loading extra info canceled), `-31019` (video-to-image-sequence export canceled)

---

## 7. Media · Stitching

Stitching and PureShot failures are returned through `Result.onFailure` of the `Stitcher` methods.

| Exception | Code carried | Meaning |
|---|---|---|
| `StitchSeparatedFisheyeException` | -35001 | Invalid template offset |
| `StitchSeparatedFisheyeException` | -35004 | Template initialization failed |
| `StitchSeparatedFisheyeException` | -35005 | Template image blending failed |
| `StitchSeparatedFisheyeException` | -35006 | Failed to merge template sub-offsets |
| `StitchSeparatedFisheyeException` | Other | Separated fisheye stitching failed; code returned by the underlying layer |
| `GenerateHDRException` | Other | HDR compositing failed; code returned by the underlying layer |
| `GeneratePureShotFailedException` | Other | PureShot generation failed; code returned by the algorithm layer |

The following failures **carry no code**; troubleshoot by exception type:

| Exception | Meaning |
|---|---|
| `GeneratePureShotNotSupportException` | This footage does not support PureShot |
| `GeneratePureShotModelFileMissingException` | LUT or model file missing (the exception carries the type of the missing file) |
| `StitchSeparatedFisheyeParamsException` | The footage has fewer than 2 URLs and cannot be stitched |

---

## 8. Media · Player

Playback failures are returned through `PlayerViewListener.onFail(exception)` — read `NativeException.nativeErrorCode`.

### 8.1 SDK Player Error Codes

| Code | Description |
|---|---|
| -10000 | Failed to load stabilization data |
| -10001 | Player terminated because the Work reference was released |
| -10003 | GPU texture size not supported |
| -10004 | Player failed to initialize flash |
| -10005 | Invalid rendering environment |
| -10006 | Recording callback status point provider is null |
| -10008 | Player loading canceled |
| -10009 | Project parameters are null |
| -10010 | Playback parameters are null |
| -10011 | Lifecycle is null |
| -20000 | Resource permit registration failed: thread interrupted |
| -20001 | Resource permit registration failed: wait timed out |
| -20002 | Resource permit registration canceled |
| -23000 | Failed to load Work GPS data |
| -23002 | Failed to load Work extra data |
| -23003 | Failed to load Work LRV extra data |
| -23007 | Player failed to load the proposal |
| -23008 | Failed to load stabilization data for export |
| -23009 | Invalid precomputed stabilization data |
| -33004 | AI analysis canceled |
| -33005 | Failed to load AI stabilization data |
| -35000 | Invalid template file type |
| -35001 | Invalid template offset |
| -35002 | Template download failed |
| -35003 | Failed to parse template imageAsset |
| -35004 | Template initialization failed |
| -35005 | Template image blending failed |

### 8.2 Underlying Playback Engine Error Codes

The following error codes are passed up unchanged by the playback engine and are the most common type of playback failure. The table lists the values the engine defines; **the engine may also pass up codes not in this table**.

| Code | Description |
|---|---|
| -2 | Directory or file does not exist |
| -5 | Transfer error (system exception or Wi-Fi connection problem) |
| -12 | Out of memory |
| -22 | Invalid argument (corrupted video / code logic issue / unexpected Wi-Fi interruption) |
| -28 | Insufficient storage space |
| -101 | Network unavailable |
| -104 | Connection reset |
| -110 | Connection timed out (usually a camera-side issue) |
| -113 | Host unreachable (camera not connected / DNS issue / camera server unreachable) |
| -1094995529 | Invalid data (corrupted video / unsupported encoding / unexpected Wi-Fi interruption) |
| -1397312835 | Cache verification failed; clearing the player cache may fix it |
| -542398533 | Low-level or system error, usually an unsupported hardware codec |
| -808465656 | Camera server returned 400 |
| -823242872 | Camera server returned 401 |
| -858797304 | Camera server returned 403 |
| -875574520 | Camera server returned 404 |
| -1482175736 | Camera server returned another 4xx |
| -1482175992 | Camera server returned 5xx |
| -1128613112 | Decoding this file format is not supported |
| -1129203192 | Encoding this format is not supported |
| -1296385272 | Parsing this file format is not supported |
| -57011001 | Video encoding format not supported |
| -57012103 | Invalid packet; the file may be corrupted |
| -57041001 | URL protocol not supported |
| -57041002 | Underlying library initialization failed (internal error) |
| -57041003 | Malformed URL |
| -57041004 | Required feature not compiled into the underlying library |
| -57041005 | Unable to resolve proxy host |
| -57041006 | Unable to resolve host (cloud footage) |
| -57041007 | Unable to connect to remote host or proxy (cloud footage) |
| -57041008 | Server returned an unparseable response |
| -57041009 | Server denied remote access (missing permission) |
| -57041028 | Access timed out |
| -57041035 | SSL/TLS handshake failed |
| -57041047 | Too many redirects |
| -57041052 | Server returned no data |
| -57041055 | Failed to send network data |
| -57041056 | Failed to receive network data |
| -57041092 | HTTP/2 framing layer stream error |
| -57040000 – -57040999 | Any value in this range means "the server returned the corresponding HTTP status code" |

---

## 9. Live Streaming

Streaming failures are returned through `CameraLiveListener.onFailed(errorCode, message)`. `message` is the underlying description string and can be displayed alongside the code.

| Code | Description |
|---|---|
| -1 | Streaming module not initialized (streaming started without calling preview initialization `preview.init()`) |
| -1001 | Audio filter send failed |
| -1002 | Audio filter recording failed |
| -1003 | Audio filter open failed |
| 1000 | Writer stopped abnormally |
| 1001 | Writer not switched |
| -57011101 | Encoder extradata is missing the start code |
| -57011102 | No available encoder found |
| -57011103 | Failed to open the encoder (this value is returned when the hardware encoder fails to open) |
| -57011104 | Pixel format mismatch |
| -57012201 | Invalid writer extradata |
| -57012202 | Writer extradata changed |

Beyond the table above, **when RTMP connection or streaming fails, the underlying audio/video library's error code is passed through unchanged** (negative values, with no fixed list), such as `-5` (IO / transfer error) or `-22` (invalid argument). Use `message` and the streaming logs to investigate these codes further.

> On models that support software encoding, the SDK automatically retries when the hardware encoder fails to open; your app is called back only if software encoding also fails.

---

## 10. AI Voice Assistant

`AiVoiceAssistantStatus.errorCode` is the raw value reported by the camera and is **for diagnostics only**.

| Code | Description |
|---|---|
| 0 | No error |
| 1 | Unknown error |
| 2 | Timed out |
| 3 | Check failed |
| 4 | Not supported |
| 5 | Wake-up link not ready (not paired or not yet woken up) |
| 6 | The user has not enabled location permission |
| 7 | Poor network conditions on the user's side |
| 8 | The app is disconnected from the LLM service |
| 9 | The user has not accepted the privacy agreement |
| 10 | The current system version does not meet the feature's minimum requirement |
| 11 | Multiple connection failures |

> **A non-zero value does not mean there is currently a fault.** In testing, the camera still reports `5` while the voice assistant is running normally (`state` is running), because this SDK does not establish the wake-up link — the value stays there indefinitely, which is expected and not a fault. **Only an error `state` indicates the feature is malfunctioning.**
>
> When the camera reports a new value not listed in this table (usually because the firmware is newer than the SDK), it is read as `0` and cannot be distinguished from "no error".
