# Camera SDK 接口文档

Camera SDK（`sdk-camera`）提供 Insta360 相机的连接管理、拍摄控制、实时预览、文件管理和固件升级能力。本文档列出所有公开 API 的接口定义与参数说明。

---

## 目录

1. [设备连接与管理](#1-设备连接与管理)
2. [系统与硬件信息](#2-系统与硬件信息)
3. [拍摄控制与参数](#3-拍摄控制与参数)
4. [实时预览](#4-实时预览)
5. [文件管理](#5-文件管理)
6. [固件升级](#6-固件升级)
7. [GPS 数据注入](#7-gps-数据注入)
8. [事件监听器](#8-事件监听器)
9. [公共数据类型](#9-公共数据类型)

---

## 1. 设备连接与管理

### CameraDevice

相机设备的核心接口，是所有功能模块的访问入口。

```kotlin
interface CameraDevice
```

**工厂方法**

```kotlin
CameraDevice.get(connectType: ConnectType): CameraDevice
```

**子模块**

| 属性 | 类型 | 说明 |
|------|------|------|
| `system` | `CameraSystem` | 系统级功能 |
| `capture` | `CameraCapture` | 拍摄控制 |
| `preview` | `CameraPreview` | 实时预览流 |
| `file` | `CameraFile` | 相机内文件管理 |
| `firmware` | `CameraFirmware` | 固件版本与升级 |

**连接方法**

| 方法 | 形式 | 说明 |
|------|------|------|
| `isConnected()` | 同步 | 是否已连接 |
| `scan(timeoutMs, bleScanCallback)` | 同步 | 扫描附近蓝牙设备 |
| `stopScan()` | 同步 | 停止蓝牙扫描 |
| `bleWakeUp(cameraType, deviceName, listener)` | 同步 | 蓝牙唤醒相机 |
| `connect(connectHint, callback)` | 回调 | 通用连接 |
| `connect(connectHint)` | 协程 | 通用连接 |
| `connectBle(bleDeviceCore, callback)` | 回调 | 蓝牙连接（SDK BleDeviceCore） |
| `connectBle(bleDeviceCore)` | 协程 | 蓝牙连接（SDK BleDeviceCore） |
| `connectBle(kmpBleDevice, callback)` | 回调 | 蓝牙连接（系统 BluetoothDevice / CBPeripheral） |
| `connectBle(kmpBleDevice)` | 协程 | 蓝牙连接（系统 BluetoothDevice / CBPeripheral） |
| `connectWiFi(networkId, callback)` | 回调 | Wi-Fi 连接 |
| `connectWiFi(networkId)` | 协程 | Wi-Fi 连接 |
| `connectUsb(callback)` | 回调 | USB 连接 |
| `connectUsb()` | 协程 | USB 连接 |
| `disconnect(callback)` / `suspend disconnect()` | 回调 / 协程 | 断开连接，返回 `Result<Unit>` |
| `getSupportCameraType()` | 同步 | 获取当前连接类型支持的相机型号列表 |
| `release()` | 同步 | 释放设备对象所有资源 |

**断连监听**

| 方法 | 说明 |
|------|------|
| `registerDisconnectListener(listener)` | 注册断连监听器 |
| `unregisterDisconnectListener(listener)` | 注销断连监听器 |

**相机授权**

连接后可通过以下方法校验当前设备是否已获得相机端授权。相机端会弹出确认弹窗，用户确认/拒绝后结果通过 `AuthorizationListener` 回调。

| 方法 | 形式 | 说明 |
|------|------|------|
| `checkAuthorization(callback)` / `checkAuthorization()` | 回调 / 协程 | 校验授权，返回 `AuthorizationStatus` |
| `cancelAuthorization(callback)` / `cancelAuthorization()` | 回调 / 协程 | 取消当前授权校验 |
| `registerAuthorizationListener(listener)` | 同步 | 注册授权结果监听器 |
| `unregisterAuthorizationListener(listener)` | 同步 | 注销授权结果监听器 |

`AuthorizationStatus` 枚举值：

| 值 | 说明 |
|----|------|
| `AUTHORIZED` | 已授权 |
| `UNAUTHORIZED` | 未授权（相机将显示确认弹窗，结果通过 `AuthorizationListener` 回调） |
| `SYSTEM_BUSY` | 相机繁忙 |

---

## 2. 系统与硬件信息

### CameraSystem

提供电量、存储、温度、Wi-Fi、设备信息、关机等系统级功能。

```kotlin
interface CameraSystem
```

每项数据均提供三种调用形式：

- `getXxx()` — 读取本地缓存（同步）
- `fetchXxx(callback)` — 从相机拉取（回调）
- `suspend fetchXxx()` — 从相机拉取（协程）

可读写的数据项额外提供 `setXxx(...)` 方法。

**数据项一览**

| 数据项 | 类型 | 可写 | 说明 |
|--------|------|------|------|
| BatteryData | `BatteryData` | ✗ | 电池电量与充电状态 |
| ChargeBoxData | `ChargeBoxData` | ✗ | 充电盒状态 |
| Mute | `Boolean` | ✓ | 静音状态 |
| SerialNumber | `String` | ✗ | 序列号 |
| Uuid | `String` | ✗ | UUID |
| OriginOffset / V2 / V3 | `String` | ✗ | 原始偏移量（多版本） |
| ActivateTime | `Long` | ✓ | 激活时间 |
| ~~StorageData~~ | ~~`StorageData`~~ | ✗ | 已废弃，请使用 `StorageDataList` |
| StorageDataList | `List<StorageData>` | ✗ | 存储介质状态列表（支持多存储位置） |
| MediaOffset / V2 / V3 | `String` | ✗ | 媒体偏移量（多版本） |
| MediaOffsetV6 | `String` | ✗ | 媒体偏移量 V6 |
| FirmwareRevision | `String` | ✗ | 固件版本号 |
| WifiData | `WiFiData` | ✗ | Wi-Fi 信息 |
| WifiChannelList | `WiFiChannel` | ✗ | Wi-Fi 信道列表 |
| CameraType | `CameraType` | ✗ | 相机型号 |
| VideoEncodeType | `VideoEncode` | ✓ | 视频编码类型 |
| IsSelfie | `Boolean` | ✗ | 是否自拍模式 |
| CameraLanguage | `LanguageType` | ✓ | 相机语言 |
| AssistiveGridEnable | `Boolean` | ✓ | 辅助网格 |
| FreeFrameGridEnable | `Boolean` | ✓ | 自由比例网格 |
| Sharpness | `Sharpness` | ✓ | 全局锐度 |
| MediaTime | `Long` | ✗ | 媒体时间 |
| WindowCropInfo | `WindowCropInfo` | ✗ | 窗口裁剪信息（缓存） |
| HalfWindowCropInfo | `WindowCropInfo` | ✗ | 半窗口裁剪信息（缓存） |
| OffsetState | `Int` | ✗ | offset 状态（缓存） |
| OffsetDetectedType | `Int` | ✗ | offset 检测类型（缓存） |
| RollingShutterTime | `Double` | ✗ | 滚动快门时间（秒） |

**操作方法**

| 方法 | 形式 | 说明 |
|------|------|------|
| `setLocalTime(localTime, callback)` / `setLocalTime(localTime)` | 回调 / 协程 | 设置本地时间 |
| `openCameraWiFi(channel, callback)` / `openCameraWiFi(channel)` | 回调 / 协程 | 开启 Wi-Fi |
| `closeCameraWiFi(callback)` / `closeCameraWiFi()` | 回调 / 协程 | 关闭 Wi-Fi |
| `resetCameraWiFi(channel, callback)` / `resetCameraWiFi(channel)` | 回调 / 协程 | 重置 Wi-Fi |
| `setWiFiCountry(countryCode, callback)` / `setWiFiCountry(countryCode)` | 回调 / 协程 | 设置 Wi-Fi 国家代码 |
| `activeCamera(appId, secretKey, callback)` / `activeCamera(appId, secretKey)` | 回调 / 协程 | 激活相机 |
| `calibrateGyro(callback)` / `calibrateGyro()` | 回调 / 协程 | 校准陀螺仪 |
| `setLockScreenState(state, callback)` / `setLockScreenState(state)` | 回调 / 协程 | 设置屏幕锁定状态 |
| ~~`formatSdCard(callback)`~~ / ~~`formatSdCard()`~~ | 回调 / 协程 | 已废弃，请使用 `formatStorage`（等价于 `formatStorage(FileLocation.CAMERA)`） |
| `formatStorage(fileLocation, callback)` / `formatStorage(fileLocation)` | 回调 / 协程 | 格式化指定存储位置，默认 `FileLocation.CAMERA` |
| `setMainStorage(fileLocation, callback)` / `setMainStorage(fileLocation)` | 回调 / 协程 | 设置主存储位置（仅 X6 支持） |
| `shutdown()` | 同步 | 关闭相机电源 |

**状态监听**

| 方法 | 说明 |
|------|------|
| `registerBatteryListener(listener)` / `unregisterBatteryListener(listener)` | 电池状态 |
| `registerChargeBoxStatusListener(listener)` / `unregisterChargeBoxStatusListener(listener)` | 充电盒状态 |
| `registerTemperatureListener(listener)` / `unregisterTemperatureListener(listener)` | 温度状态 |
| `registerStorageStatusListener(listener)` / `unregisterStorageStatusListener(listener)` | 存储卡状态 |

---

## 3. 拍摄控制与参数

### CameraCapture

提供拍照、录像的启停控制以及所有拍摄参数的读写。

```kotlin
interface CameraCapture
```

### CameraParam\<T\>

统一封装单个拍摄参数的读取、写入、支持列表查询和变化监听。

```kotlin
interface CameraParam<T>
```

| 方法 | 说明 |
|------|------|
| `suspend getValue(): Result<T>` | 读取当前缓存值 |
| `suspend fetchValue(): Result<T>` | 从相机读取最新值 |
| `suspend setValue(value: T): Result<Unit>` | 写入新值（自动触发监听器） |
| `suspend getSupported(): Result<List<T>>` | 获取当前模式下的可选值列表 |
| `getName(): String` | 获取参数名称标识 |
| `addListener(listener: (T) -> Unit)` | 订阅参数变化回调 |
| `removeListener(listener: (T) -> Unit)` | 取消订阅参数变化回调 |

**拍摄参数列表**

所有参数均以 `CameraParam<T>` 属性形式挂载在 `CameraCapture` 上：

| 属性 | 类型 T | 说明 |
|------|--------|------|
| `lensType` | `SensorMode` | 镜头类型（单/双镜头等） |
| `functionMode` | `FunctionMode` | 拍摄功能模式（录像/拍照/延时等） |
| `photoResolution` | `PhotoResolution` | 照片分辨率 |
| `videoResolution` | `RecordResolution` | 视频分辨率 |
| `hdrPhotoMode` | `PhotoHdrType` | 照片 HDR 模式 |
| `hdrSwitch` | `Boolean` | 视频 HDR 开关 |
| `aeb` | `Int` | 自动包围曝光（AEB） |
| `rawType` | `RawType` | RAW 格式类型 |
| `exposureProgram` | `ExposureProgram` | 曝光程序 |
| `exposureISO` | `Int` | ISO |
| `exposureShutterSpeed` | `Pair<Double, Double>` | 快门速度 |
| `videoISOTopLimit` | `Int` | 视频 ISO 上限 |
| `exposureBias` | `Double` | 曝光补偿（EV） |
| `whiteBalance` | `Int` | 白平衡 |
| `fovType` | `FovType` | 视场角类型 |
| `flowStateLevel` | `FlowStateLevel` | 防抖等级 |
| `photographySelfTimer` | `Int` | 拍照倒计时 |
| `splicingBaseEnable` | `Boolean` | 拼接基础开关 |
| `videoSelfieMode` | `VideoSelfieMode` | 视频自拍模式 |
| `exportType` | `ExportType` | 导出类型 |
| `photoSizeId` | `PhotoSize` | 照片尺寸/比例 |
| `colorMode` | `VideoGammaMode` | 色彩模式 |
| `filterMode` | `VideoGammaMode` | 滤镜模式 |
| `accelerateFrequency` | `Int` | 加速频率（延时摄影） |
| `recordDuration` | `Int` | 录制时长 |
| `exposureIndividual` | `PanoExposureMode` | 独立曝光模式 |
| `livingBitrate` | `Int` | 直播码率 |
| `burstCaptureParams` | `Pair<Int, Int>` | 连拍参数（张数, 间隔） |
| `p3Switch` | `Boolean` | P3 色域开关 |
| `iLogSwitch` | `Boolean` | i-Log 色彩模式开关 |
| `pureVideoEnhanceSwitch` | `Boolean` | 纯净夜拍增强开关 |
| `doubleZoomEnable` | `Boolean` | 双倍变焦开关 |
| `lapseTime` | `Double` | 间隔拍摄时间间隔 |
| `livePhotoMode` | `Boolean` | 实况照片（Live Photo） |
| `lensAccessory` | `LensAccessoryType` | 镜头配件类型 |
| `iq3AMode` | `Iq3AMode` | 3A 专业模式（`NORMAL` ↔ `PRO`）；`exposureISO`/`exposureShutterSpeed`/`whiteBalance`/`videoISOTopLimit` 等参数在各模式下的可选值收窄由相机端声明驱动，SDK 不做自动模式切换 |

**参数管理方法**

| 方法 | 说明 |
|------|------|
| `getSupportParam(): List<CameraParam<*>>` | 获取当前相机支持的参数列表 |
| `suspend syncAllParams()` | 强制从相机同步所有参数 |
| `suspend loadJson(): Result<Unit>` | 加载相机参数配置 JSON（连接后调用） |

> `getSupportParamNames()` 和 `getAllParams()` 已废弃，请统一使用 `getSupportParam()`。

**拍摄控制方法**

| 方法 | 说明 |
|------|------|
| `suspend startCapture(gpsInfo: GpsInfo? = null)` | 开始拍摄，可选携带 GPS 信息写入媒体文件 |
| `suspend stopCapture(gpsInfo: GpsInfo? = null)` | 停止拍摄，可选携带 GPS 信息写入媒体文件 |
| `suspend setGpsInfo(gpsInfo: GpsInfo)` | 拍摄过程中更新 GPS 信息 |
| `suspend isWorking(): Boolean` | 是否正在拍摄 |
| `isPreRecording(): Boolean` | 是否处于预录制状态 |
| `cancelPreRecord()` | 取消预录制 |
| `suspend getBurstTime(): Result<Unit>` | 获取连拍时间 |
| `suspend getRemaining(): Result<Int>` | 当前模式剩余录制时间（秒）或拍摄张数 |
| `getRemaining(functionMode): Result<Int>` | 指定模式剩余量（缓存） |
| `suspend fetchRemaining(functionMode): Result<Int>` | 从相机拉取指定模式剩余量 |
| `registerCaptureStatusListener(listener)` | 注册拍摄状态监听器 |
| `unregisterCaptureStatusListener(listener)` | 注销拍摄状态监听器 |

---

## 4. 实时预览

### CameraPreview

控制相机实时预览流的开启/关闭、参数获取及姿态监听。

```kotlin
interface CameraPreview
```

| 方法 | 说明 |
|------|------|
| `startStream()` | 开启预览流（自动同步解码配置） |
| `stopStream()` | 停止预览流 |
| `requestStreamIframe()` | 请求立即发送关键帧，用于恢复花屏 |
| `getPreviewParams(): Result<PreviewParams>` | 获取当前预览流参数快照（供媒体侧使用） |
| `getCurrentFunctionMode(): Result<FunctionMode>` | 获取当前预览会话的功能模式 |
| `getVideoBitrate(): Result<Int>` | 获取缓存的视频码率（bps） |
| `suspend fetchVideoBitrate(): Result<Int>` | 从相机拉取最新视频码率 |
| `suspend setVideoBitrate(bitrate: Int): Result<Unit>` | 设置视频码率 |
| `setStreamEncode(isH265: Boolean)` | 手动覆盖预览流解码配置（通常无需调用） |
| `setPipeline(pipeline: KMPCameraPreviewPipeline?)` | 设置预览渲染管线 |
| `registerPostureListener(listener)` | 注册相机姿态更新监听器 |
| `unregisterPostureListener(listener)` | 注销相机姿态更新监听器 |
| `registerCameraStreamListener(listener)` | 注册预览流状态监听器 |
| `unregisterCameraStreamListener(listener)` | 注销预览流状态监听器 |
| `suspend startLive(params: CameraLiveParams): Result<Unit>` | 发起 RTMP 直播推流（需先切到直播模式并开启预览流） |
| `startLive(params: CameraLiveParams, callback: Callback<Unit>)` | 发起直播推流（callback 风味） |
| `suspend stopLive(): Result<Unit>` | 停止直播推流 |
| `stopLive(callback: Callback<Unit>)` | 停止直播推流（callback 风味） |
| `registerCameraLiveListener(listener)` | 注册直播推流状态监听器 |
| `unregisterCameraLiveListener(listener)` | 注销直播推流状态监听器 |

> `startLive` 返回成功仅表示推流请求已受理，实际推流状态通过 `CameraLiveListener` 异步回调。

### CameraStreamListener

```kotlin
interface CameraStreamListener
```

| 回调 | 说明 |
|------|------|
| `onOpening()` | 预览流开始打开 |
| `onOpened()` | 预览流成功打开 |
| `onIdle()` | 预览流已关闭 |
| `onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate)` | 预览流参数变化（分辨率/帧率/裁剪信息等） |
| `onStreamDataNotify(streamData: PreviewStreamFrame)` | 收到预览流数据帧（默认空实现） |

### CameraLiveParams

直播推流参数，传入 `CameraPreview.startLive()`。

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

| 属性 | 说明 |
|------|------|
| `rtmpUrl` | RTMP 推流地址 |
| `width` / `height` | 推流画面分辨率（像素） |
| `fps` | 推流帧率 |
| `bitrate` | 推流码率（单位 Mbps，底层内部转换为 bps） |
| `netId` | 推流使用的网络 id，默认 -1（底层默认网络）。SDK 不管理网络，绑定指定网络（如蜂窝）时由调用方传入对应 network id |

### CameraLiveListener

直播推流状态回调，通过 `CameraPreview.registerCameraLiveListener()` 注册。所有回调在非主线程分发，更新 UI 需自行切换到主线程。

```kotlin
interface CameraLiveListener
```

| 回调 | 说明 |
|------|------|
| `onStarted()` | 推流成功启动 |
| `onFps(fps: Int)` | 推流帧率更新，`fps` 为当前实时帧率 |
| `onStopped()` | 推流正常停止 |
| `onFailed(errorCode: Int, message: String?)` | 推流发生错误，`errorCode` 为底层错误码 |

### PreviewStreamFrame

```kotlin
data class PreviewStreamFrame(
    val data: ByteArray,
    val timestamp: Long,
    val type: PreviewStreamType = PreviewStreamType.UNKNOWN
)
```

| 属性 | 说明 |
|------|------|
| `data` | 帧原始字节数据 |
| `timestamp` | 帧时间戳（送入 MediaCodec 前通常需转换为微秒） |
| `type` | 帧类型，见下表 |

### PreviewStreamType

| 枚举值 | 说明 |
|--------|------|
| `VIDEO` | 普通视频帧 |
| `VIDEO_L` | 左眼/左侧视频帧 |
| `VIDEO_R` | 右眼/右侧视频帧 |
| `AUDIO` | 音频帧 |
| `GYRO` | 陀螺仪/姿态数据帧 |
| `OTHER` | 其他类型 |
| `UNKNOWN` | 未知类型 |

> `val isVideo: Boolean` — 判断是否为视频帧（VIDEO / VIDEO_L / VIDEO_R）。

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

| 属性 | 说明 |
|------|------|
| `windowCropInfo` | 窗口裁剪信息，用于全景拼接 |
| `offsetData` | 镜头偏移/校正参数 |
| `stabOffset` | 防抖偏移量字符串 |
| `previewWidth` / `previewHeight` | 当前预览分辨率（像素） |
| `previewFps` | 当前预览帧率 |

---

## 5. 文件管理

### CameraFile

提供相机内部媒体文件的列表查询、下载和删除功能。

```kotlin
interface CameraFile
```

**服务器信息**

| 方法 | 说明 |
|------|------|
| `getEndpoint(): String` | 文件服务器完整 URL（如 `http://192.168.42.1:80/`） |
| `getHost(): String` | 主机地址 |
| `getProt(): Int` | 端口号 |

**文件列表**

| 方法 | 形式 | 说明 |
|------|------|------|
| `listMediaFiles(mediaFileType, includeRecording, callback)` | 回调 | 获取全量文件列表，返回 URI 列表 |
| `listMediaFiles(mediaFileType, includeRecording)` | 协程 | 同上 |
| `listMediaFiles(mediaFileType, start, limit, includeRecording, callback)` | 回调 | 分页获取，返回 `Pair<List<String>, Int>`（列表, 总数） |
| `listMediaFiles(mediaFileType, start, limit, includeRecording)` | 协程 | 同上 |
| `getFileInfoList(callback)` | 回调 | 获取详细文件信息列表 |
| `getFileInfoList()` | 协程 | 同上 |

**文件操作**

| 方法 | 形式 | 说明 |
|------|------|------|
| `deleteMediaFiles(vararg uris, callback)` | 回调 | 删除指定文件 |
| `deleteMediaFiles(vararg uris)` | 协程 | 删除指定文件 |
| `downloadMediaFile(url, targetDir, progressCallback?)` | 协程 | 下载媒体文件，返回本地路径 |
| `downloadMediaFile(url, targetDir, progressCallback)` | 进度回调 | 下载媒体文件 |
| `downloadCameraLogFile(targetDir, progressCallback?)` | 协程 | 下载相机日志文件，返回本地路径 |
| `downloadCameraLogFile(targetDir, progressCallback)` | 进度回调 | 下载相机日志文件 |

---

## 6. 固件升级

### CameraFirmware

```kotlin
interface CameraFirmware
```

| 方法 | 形式 | 说明 |
|------|------|------|
| `getVersion(): Result<String>` | 同步 | 获取当前固件版本号 |
| `upgradeFirmware(filePath, callback)` | 进度回调 | 固件升级，进度值 0.0–1.0 |
| `upgradeFirmware(filePath, progress?)` | 协程 | 固件升级，可选进度回调 |

---

## 7. GPS 数据注入

拍摄时如需将 GPS 信息写入媒体文件，调用方直接持有并管理自己的定位数据源，通过 `CameraCapture.startCapture(gpsInfo)` / `stopCapture(gpsInfo)` 传入起止时刻的 GPS 信息，录制过程中如需更新，调用 `CameraCapture.setGpsInfo(gpsInfo)`。

### GpsInfo

```kotlin
data class GpsInfo(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double,
    val timestampMs: Long
)
```

| 属性 | 说明 |
|------|------|
| `latitude` | 纬度（度） |
| `longitude` | 经度（度） |
| `altitude` | 海拔高度（米） |
| `timestampMs` | 时间戳（毫秒） |
| `toByteArray()` | 序列化为小端序字节数组 |

---

## 8. 事件监听器

### DisconnectListener

设备与相机断开连接时触发。通过 `CameraDevice.registerDisconnectListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onDisconnect(throwable: Throwable?)` | throwable：断连原因（正常断开时为 null） | 连接断开 |

---

### BleWakeUpListener

蓝牙唤醒结果回调。通过 `CameraDevice.bleWakeUp()` 传入。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onWakeUpSuccess()` | — | 蓝牙唤醒成功 |
| `onWakeUpError(errCode: Int)` | errCode：错误码 | 蓝牙唤醒失败 |

---

### BatteryListener

通过 `CameraSystem.registerBatteryListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onBatteryLevelChange(batteryData: BatteryData)` | batteryData：电量与充电状态 | 电量变化 |
| `onLowBatteryWarning()` | — | 低电量警告 |

---

### ChargeBoxStatusListener

通过 `CameraSystem.registerChargeBoxStatusListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onChargeBoxStatusChange(chargeBoxData: ChargeBoxData)` | chargeBoxData：充电盒状态 | 充电盒状态变化 |

---

### TemperatureListener

通过 `CameraSystem.registerTemperatureListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onTemperatureUpdate(tempState: TempState)` | tempState：温度等级 | 相机温度状态变化 |

---

### StorageStateListener

通过 `CameraSystem.registerStorageStatusListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onStorageStateListChanged(storageDataList: List<StorageData>)` | storageDataList：所有存储介质的状态列表 | 存储状态变化 |

---

### CaptureStatusListener

通过 `CameraCapture.registerCaptureStatusListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onCaptureStarting(functionMode)` | 当前拍摄模式 | 拍摄即将开始 |
| `onCaptureWorking(functionMode)` | 当前拍摄模式 | 拍摄进入工作状态 |
| `onCaptureStopping(functionMode)` | 当前拍摄模式 | 拍摄即将停止 |
| `onCaptureFinish(functionMode, filePaths)` | filePaths：生成的文件路径列表 | 拍摄完成并生成文件 |
| `onCaptureError(functionMode, throwable)` | throwable：错误原因 | 拍摄发生错误 |
| `onCaptureTimeChanged(functionMode, captureTime)` | captureTime：已录制时长 | 录制时长变化（录像模式） |
| `onCaptureCountChanged(functionMode, captureCount)` | captureCount：已拍张数 | 拍摄张数变化（连拍/间隔） |
| `onCaptureSubStatusChanged(functionMode, subStatus)` | subStatus：子状态 | 拍摄子状态变化（如 HDR 处理） |

---

### CameraPostureUpdate

通过 `CameraPreview.registerPostureListener()` 注册，实时接收相机空间姿态数据。

| 回调 | 参数 | 说明 |
|------|------|------|
| `updatePosture(cameraPosture: CameraPosture)` | cameraPosture：姿态数据 | 姿态数据更新（陀螺仪/加速度计） |

---

### AuthorizationListener

通过 `CameraDevice.registerAuthorizationListener()` 注册，接收相机端授权操作结果。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onAuthorizationResult(operationType, result)` | operationType：触发此授权的操作类型；result：授权结果 | 用户在相机端确认或拒绝授权后回调 |

---

## 9. 公共数据类型

以下类型在 Camera 和 Media 模块之间存在关联，此处一并列出。

### KMPCameraPreviewPipeline

来自 `verticalCommon`，在 Camera 和 Media 侧均有使用：

- Camera 侧：`CameraPreview.setPipeline(pipeline)` — 将管线注入相机预览
- Media 侧：`PreviewPlayer.getPipeline()` — 获取当前渲染管线

管线对象由媒体侧创建后传入相机侧，作为预览数据的传输通道。

---

### PreviewStreamParamsUpdate（Camera → Media）

相机预览流参数变化时，通过 `CameraStreamListener.onParamsChanged()` 回调此对象。媒体侧的 `PreviewPlayer.setOffset()` 和 `setWindowCropInfo()` 通常基于此对象中的数据进行更新。

详见 [§4 实时预览 - PreviewStreamParamsUpdate](#previewstreamparamsupdate)。
