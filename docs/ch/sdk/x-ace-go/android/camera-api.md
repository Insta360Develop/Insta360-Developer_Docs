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

相机设备的核心接口，是各功能入口的统一访问点。

```kotlin
interface CameraDevice
```

**工厂方法**

```kotlin
CameraDevice.get(connectType: ConnectType): CameraDevice
```

**功能入口**

| 属性 | 类型 | 说明 |
|------|------|------|
| `system` | `CameraSystem` | 系统级功能 |
| `capture` | `CameraCapture` | 拍摄控制 |
| `preview` | `CameraPreview` | 实时预览流 |
| `file` | `CameraFile` | 相机内文件管理 |
| `firmware` | `CameraFirmware` | 固件版本与升级 |

**连接方法**

除特别标注外，连接类方法均提供「回调」与「协程挂起」两种形式。`isBleOnly` 为 true 时仅建立 BLE 连接，为 false 时连接后继续拉取 Wi-Fi 数据。

| 方法 | 形式 | 说明 |
|------|------|------|
| `isConnected()` | 同步 | 是否已连接 |
| `scan(timeoutMs, bleScanCallback)` | 同步 | 扫描附近相机设备（主要用于蓝牙连接），`timeoutMs` 为扫描超时毫秒数 |
| `stopScan()` | 同步 | 停止扫描 |
| `bleWakeUp(cameraType, deviceName, listener)` | 同步 | 蓝牙唤醒相机 |
| `connect(connectHint, callback)` | 回调 | 通用连接，`connectHint` 如 Wi-Fi SSID、蓝牙 MAC 或连接配置对象 |
| `connect(connectHint, isBleOnly)` | 协程 | 通用连接 |
| `connectBle(bleDeviceCore, isBleOnly, callback)` | 回调 | 蓝牙连接（SDK 的 `BleDeviceCore`） |
| `connectBle(bleDeviceCore, isBleOnly)` | 协程 | 蓝牙连接（SDK 的 `BleDeviceCore`） |
| `connectBle(kmpBleDevice, isBleOnly, callback)` | 回调 | 蓝牙连接（系统蓝牙对象，Android 侧为 `BluetoothDevice`） |
| `connectBle(kmpBleDevice, isBleOnly)` | 协程 | 蓝牙连接（系统蓝牙对象） |
| `connectWiFi(networkId, callback)` | 回调 | Wi-Fi 连接，`networkId` 为 Wi-Fi 网络 ID |
| `connectWiFi(networkId)` | 协程 | Wi-Fi 连接 |
| `connectWiFiAware(networkHandle, peerIpv6, callback)` | 回调 | Wi-Fi Aware（NAN）连接，需先在 App 侧完成 NAN 握手 |
| `connectWiFiAware(networkHandle, peerIpv6)` | 协程 | Wi-Fi Aware（NAN）连接，需先在 App 侧完成 NAN 握手 |
| `connectUsb(callback)` | 回调 | USB 连接 |
| `connectUsb()` | 协程 | USB 连接 |
| `disconnect(callback)` / `disconnect()` | 回调 / 协程 | 断开与当前相机的连接 |
| `getSupportCameraType()` | 同步 | 获取当前连接类型下支持的相机型号列表（`List<CameraType>`） |
| `release()` | 同步 | 释放设备对象所有资源，之后该对象不可再使用 |

> `connectWiFiAware` 的两个参数分别来自 App 侧 NAN 握手结果：`networkHandle` 取自
> `android.net.Network.getNetworkHandle`，`peerIpv6` 取自
> `android.net.wifi.aware.WifiAwareNetworkInfo.getPeerIpv6Addr`。

**断连监听**

| 方法 | 说明 |
|------|------|
| `registerDisconnectListener(listener)` | 注册断连监听器（`DisconnectListener`） |
| `unregisterDisconnectListener(listener)` | 注销断连监听器 |

**相机授权**

连接后可通过以下方法校验当前设备是否已获得相机端授权。相机端会弹出确认弹窗，用户确认/拒绝后结果通过 `AuthorizationListener` 回调。

| 方法 | 形式 | 说明 |
|------|------|------|
| `checkAuthorization(callback)` / `checkAuthorization()` | 回调 / 协程 | 校验授权，返回 `AuthorizationStatus` |
| `cancelAuthorization(callback)` / `cancelAuthorization()` | 回调 / 协程 | 取消当前正在进行的授权校验 |
| `registerAuthorizationListener(listener)` | 同步 | 注册授权结果监听器（`AuthorizationListener`） |
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

可读写的数据项额外提供 `setXxx(...)` 方法。少数数据项只有 `getXxx()` 一种形式，见下表「形式」列。

**数据项一览**

| 数据项 | 类型 | 形式 | 可写 | 说明 |
|--------|------|------|------|------|
| BatteryData | `BatteryData` | 三种 | ✗ | 电池电量与充电状态 |
| ChargeBoxData | `ChargeBoxData` | 三种 | ✗ | 充电盒状态 |
| Mute | `Boolean` | 三种 | ✓ | 静音状态 |
| AiVoiceAssistantStatus | `AiVoiceAssistantStatus` | 三种 | ✗ | AI 语音助手状态，见下方说明 |
| SerialNumber | `String` | 三种 | ✗ | 序列号 |
| Uuid | `String` | 三种 | ✗ | UUID |
| OriginOffset / V2 / V3 | `String` | 三种 | ✗ | 原始偏移量（多版本） |
| ActivateTime | `Long` | 三种 | ✓ | 激活时间 |
| ~~StorageData~~ | ~~`StorageData`~~ | 三种 | ✗ | 已废弃，请使用 `StorageDataList` |
| StorageDataList | `List<StorageData>` | 三种 | ✗ | 存储介质状态列表（支持多存储位置） |
| MainStorage | `StorageData.FileLocation` | 三种 | ✓ | 当前主存储位置，即相机后续写入文件的位置；仅支持机内存储的机型（X6 及之后）可用，相机未上报该位置时返回失败 |
| MediaOffset / V2 / V3 / V6 | `String` | 三种 | ✗ | 媒体偏移量（多版本） |
| SupportConfig | `ICameraConfig` | 仅 get | ✗ | 当前连接相机对应的配置对象 |
| FirmwareRevision | `String` | 三种 | ✗ | 固件版本号 |
| WifiData | `WiFiData` | 三种 | ✗ | Wi-Fi 数据；`getWifiInfo` / `fetchWifiInfo` 为兼容旧命名的别名 |
| WifiChannelList | `WiFiChannel` | 三种 | ✗ | Wi-Fi 信道列表 |
| CameraType | `CameraType` | 三种 | ✗ | 相机型号 |
| VideoEncodeType | `VideoEncode` | 三种 | ✓ | 视频编码类型 |
| IsSelfie | `Boolean` | 三种 | ✗ | 是否自拍模式 |
| WindowCropInfo | `WindowCropInfo` | 仅 get | ✗ | 窗口裁剪信息 |
| HalfWindowCropInfo | `WindowCropInfo` | 仅 get | ✗ | 半窗口裁剪信息，供离线防抖使用 |
| SensorInfo | `Sensor` | 仅 get | ✗ | 传感器信息（协议层传感器对象） |
| OffsetState | `Int` | 仅 get | ✗ | offset 状态 |
| OffsetDetectedType | `Int` | 仅 get | ✗ | offset 检测类型 |
| CameraLanguage | `LanguageType` | 三种 | ✓ | 相机语言设置 |
| AssistiveGridEnable | `Boolean` | 三种 | ✓ | 辅助网格开关 |
| FreeFrameGridEnable | `Boolean` | 三种 | ✓ | 自由比例网格开关 |
| Sharpness | `Sharpness` | 三种 | ✓ | 全局锐度 |
| MediaTime | `Long` | 三种 | ✗ | 媒体时间 |
| RollingShutterTime | `Double` | 三种 | ✗ | 卷帘快门时间 |

> **AI 语音助手**：`enabled` 为 true 即表示语音助手处于占用中（相机会长期占用经典蓝牙链路）。
> 失败时通过 `Result.exceptionOrNull()` 区分原因：`AlreadyReleasedException`（对象已释放）、
> `CameraNotConnectedException`（未连接或未就绪）、`OptionValueNullException`（已连接但从未拉取过状态）、
> `CameraNotSupportException`（相机不支持该能力）。`enabled == false` 在相机未上报开关字段时也会出现，
> 因此不能作为「确认未占用」的可靠结论。SDK 只提供查询，不提供 App 侧开关；`fetchAiVoiceAssistantStatus()`
> 在相机无响应时会在 10 秒内返回失败。

**操作方法**

| 方法 | 形式 | 说明 |
|------|------|------|
| `setLocalTime(localTime, callback)` / `setLocalTime(localTime)` | 回调 / 协程 | 设置相机本地时间；同时按手机系统时区下发 GEOGRAPHIC_TIME_ZONE，X6 等机型只按它决定本地时间 |
| `setMute(enable, callback)` / `setMute(enable)` | 回调 / 协程 | 设置静音状态 |
| `setActivateTime(activeTime, callback)` / `setActivateTime(activeTime)` | 回调 / 协程 | 设置相机激活时间 |
| `setVideoEncodeType(videoEncode, callback)` / `setVideoEncodeType(videoEncode)` | 回调 / 协程 | 设置视频编码类型 |
| `setCameraLanguage(languageType, callback)` / `setCameraLanguage(languageType)` | 回调 / 协程 | 设置相机语言 |
| `setAssistiveGridEnable(enable, callback)` / `setAssistiveGridEnable(enable)` | 回调 / 协程 | 设置辅助网格开关 |
| `setFreeFrameGridEnable(enable, callback)` / `setFreeFrameGridEnable(enable)` | 回调 / 协程 | 设置自由比例网格开关 |
| `setSharpness(sharpness, callback)` / `setSharpness(sharpness)` | 回调 / 协程 | 设置全局锐度 |
| `openCameraWiFi(channel, callback)` / `openCameraWiFi(channel)` | 回调 / 协程 | 开启相机 Wi-Fi，`channel` 默认 0 |
| `closeCameraWiFi(callback)` / `closeCameraWiFi()` | 回调 / 协程 | 关闭相机 Wi-Fi |
| `setWifiMode(mode, countryCode, callback)` / `setWifiMode(mode, countryCode)` | 回调 / 协程 | 设置相机 Wi-Fi 模式，例如切到 `WiFiData.Mode.Android_Aware` 以启用 Wi-Fi Aware 连接；`countryCode` 为空字符串表示不变更 |
| `resetCameraWiFi(channel, callback)` / `resetCameraWiFi(channel)` | 回调 / 协程 | 重置相机 Wi-Fi，`channel` 默认 0 |
| `setWiFiCountry(countryCode, callback)` / `setWiFiCountry(countryCode)` | 回调 / 协程 | 设置 Wi-Fi 国家代码 |
| `activeCamera(appId, secretKey, callback)` / `activeCamera(appId, secretKey)` | 回调 / 协程 | 激活相机；`secretKey` 用于加密和签名 |
| `calibrateGyro(callback)` / `calibrateGyro()` | 回调 / 协程 | 校准相机陀螺仪 |
| `setLockScreenState(state, callback)` / `setLockScreenState(state)` | 回调 / 协程 | 设置相机屏幕锁定状态 |
| ~~`formatSdCard(callback)`~~ / ~~`formatSdCard()`~~ | 回调 / 协程 | 已废弃，请使用 `formatStorage`（默认作用位置为 `FileLocation.CAMERA`） |
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
| `suspend setValue(value: T): Result<Unit>` | 写入新值；写入成功后会触发已注册的本地监听器 |
| `suspend getSupported(): Result<List<T>>` | 获取当前相机模式下该参数的可选值列表 |
| `getName(): String` | 获取参数名称标识 |
| `addListener(listener: (T) -> Unit)` | 订阅参数变化回调 |
| `removeListener(listener: (T) -> Unit)` | 取消订阅参数变化回调 |

> 参数变化回调仅在通过本 SDK 成功写入参数后触发。被其他参数联动改写的字段不会回调各自监听器，
> 需要主动 `getValue()` 重新读取（见 `exposureISO` 等参数的说明）。

**拍摄参数列表**

所有参数均以 `CameraParam<T>` 属性形式挂载在 `CameraCapture` 上：

| 属性 | 类型 T | 说明 |
|------|--------|------|
| `lensType` | `SensorMode` | 镜头类型（单/双镜头等） |
| `functionMode` | `FunctionMode` | 拍摄功能模式（普通录像/普通拍照/延时摄影等） |
| `photoResolution` | `PhotoResolution` | 照片分辨率 |
| `videoResolution` | `RecordResolution` | 视频分辨率 |
| `hdrPhotoMode` | `PhotoHdrType` | 照片 HDR 模式 |
| `hdrSwitch` | `Boolean` | 视频 HDR 开关 |
| `aeb` | `Int` | 自动包围曝光（AEB） |
| `rawType` | `RawType` | RAW 格式类型 |
| `exposureProgram` | `ExposureMode` | 曝光模式（自动/手动两态），详见下方说明 |
| `exposureISO` | `Int` | ISO，部分机型设置时联动改写曝光档位 |
| `exposureShutterSpeed` | `Pair<Double, Double>` | 快门速度，联动规则同 `exposureISO` |
| `videoISOTopLimit` | `Int` | 视频 ISO 上限 |
| `exposureBias` | `Double` | 曝光补偿（EV） |
| `whiteBalance` | `Int` | 白平衡 |
| `fovType` | `FovType` | 视场角类型（广角/线性/窄角等） |
| `flowStateLevel` | `FlowStateLevel` | 防抖等级 |
| `photographySelfTimer` | `Int` | 拍照倒计时 |
| `splicingBaseEnable` | `Boolean` | 拼接基础开关 |
| `videoSelfieMode` | `VideoSelfieMode` | 视频自拍模式 |
| `exportType` | `ExportType` | 导出类型 |
| `photoSizeId` | `PhotoSize` | 照片尺寸/比例 |
| `colorMode` | `VideoGammaMode` | 色彩模式 |
| `filterMode` | `VideoGammaMode` | 滤镜模式 |
| `accelerateFrequency` | `Int` | 加速频率（通常用于延时摄影） |
| `recordDuration` | `Int` | 录制时长（如循环录制的单段时长） |
| `exposureIndividual` | `PanoExposureMode` | 全景独立曝光开关；曝光档位支持全景独立曝光但机型未声明原生能力的，该参数为虚拟开关，只读写档位、不写原生字段 |
| `livingBitrate` | `Int` | 直播码率 |
| `burstCaptureParams` | `Pair<Int, Int>` | 连拍参数（张数, 时间间隔） |
| `p3Switch` | `Boolean` | P3 色域开关 |
| `iLogSwitch` | `Boolean` | i-Log 色彩模式开关 |
| `pureVideoEnhanceSwitch` | `Boolean` | 纯净夜拍增强开关 |
| `doubleZoomEnable` | `Boolean` | 双倍变焦开关 |
| `lapseTime` | `Double` | 间隔拍摄的时间间隔 |
| `livePhotoMode` | `Boolean` | 实况照片（Live Photo）模式 |
| `lensAccessory` | `LensAccessoryType` | 镜头配件类型（如保护镜等） |

**曝光相关参数的联动行为**

- `exposureProgram` 只暴露自动 / 手动两态，不暴露相机内部的六档真实曝光档位（自动、ISO 优先、快门优先、手动、全自动、全景独立曝光），由 ISO / 快门联动推导。
  跨越自动/手动边界时按机型代次决定写入相机的曝光组合——部分代次会把 ISO / 快门 / ISO 上限复位为自动，其余代次原样透传；未跨边界不产生写入。
- 全景独立曝光不经 `exposureProgram` 进出，需通过 `exposureIndividual` 开关；当前处于全景独立曝光时设置为 `ExposureMode.MANUAL` 会返回失败，需先关闭 `exposureIndividual`。
- 当前拍摄模式声明了 3A 专业模式（如 X6 的部分模式）时，两态直接对应相机的普通 / 专业模式：读取只看该状态，切换只下发该状态、不改动 ISO / 快门 / 真实曝光档位；部分模式只支持手动，可选值只有 `ExposureMode.MANUAL`，此时全景独立曝光不阻止切到手动。
- `exposureISO` / `videoISOTopLimit` 在启用联动的机型上会改写相机的真实曝光档位（保证写入相机的组合自洽），`exposureProgram` 的两态值可能随之变化；3A 专业模式下不联动；处于自动（普通模式）时设置手动值可能不生效，需先把 `exposureProgram` 切到 `MANUAL`。

**参数管理方法**

| 方法 | 说明 |
|------|------|
| `getSupportParam(): List<CameraParam<*>>` | 获取当前相机支持的参数列表 |
| `suspend syncAllParams()` | 强制从相机同步所有参数状态并更新本地缓存 |
| `suspend loadJson(): Result<Unit>` | 加载相机的参数配置 JSON（通常在连接相机后调用，用于初始化支持的参数列表） |

> `getSupportParamNames()` 和 `getAllParams()` 已废弃，请统一使用 `getSupportParam()`。

**拍摄控制方法**

| 方法 | 说明 |
|------|------|
| `suspend startCapture(gpsInfo: GpsInfo? = null)` | 开始拍摄（录像或拍照取决于当前 `functionMode`），可选携带 GPS 信息写入媒体文件 |
| `suspend stopCapture(gpsInfo: GpsInfo? = null)` | 停止拍摄，可选携带 GPS 信息写入媒体文件 |
| `suspend setGpsInfo(gpsInfo: GpsInfo)` | 拍摄过程中更新 GPS 信息 |
| `suspend isWorking(): Boolean` | 相机当前是否正在拍摄 |
| `isPreRecording(): Boolean` | 是否处于预录制状态 |
| `cancelPreRecord()` | 取消预录制 |
| `suspend getBurstTime(): Result<Unit>` | 获取连拍时间 |
| `suspend getRemaining(): Result<Int>` | 当前模式下的剩余录制时间（秒）或剩余拍摄张数 |
| `getRemaining(functionMode): Result<Int>` | 指定拍摄模式的剩余量（从本地缓存获取） |
| `suspend fetchRemaining(functionMode): Result<Int>` | 从相机拉取指定拍摄模式的最新剩余量 |
| `registerCaptureStatusListener(listener)` | 注册拍摄状态监听器 |
| `unregisterCaptureStatusListener(listener)` | 注销拍摄状态监听器 |

---

## 4. 实时预览

### CameraPreview

控制相机实时预览流的开启/关闭、参数获取、姿态监听及直播推流。

```kotlin
interface CameraPreview
```

| 方法 | 说明 |
|------|------|
| `init(context: KMPContext)` | 初始化预览服务，需在调用其他预览接口前执行（Android 侧 `KMPContext` 即 `Application`） |
| `startStream()` | 开启预览流（启动前自动根据当前视频编码配置同步解码配置） |
| `stopStream()` | 停止预览流 |
| `requestStreamIframe()` | 请求立即发送一个关键帧（I 帧），用于解码器初始化或花屏时快速恢复画面 |
| `getPreviewParams(): Result<PreviewParams>` | 获取当前将用于打开预览流的参数快照（结合 function mode、录制状态与相机配置计算） |
| `getCurrentFunctionMode(): Result<FunctionMode>` | 获取当前预览会话对应的 function mode 快照 |
| `getVideoBitrate(): Result<Int>` | 获取缓存的视频码率（bps） |
| `suspend fetchVideoBitrate(): Result<Int>` | 从相机拉取最新视频码率 |
| `suspend setVideoBitrate(bitrate: Int): Result<Unit>` | 设置视频码率（bps） |
| `setStreamEncode(isH265: Boolean)` | 手动覆盖预览流解码配置（一般无需调用，`startStream()` 会自动同步） |
| `setPipeline(pipeline: KMPCameraPreviewPipeline?)` | 设置预览流渲染管线，传 null 表示清除 |
| `registerPostureListener(listener)` | 注册相机姿态更新监听器（`CameraPostureUpdate`） |
| `unregisterPostureListener(listener)` | 注销相机姿态更新监听器 |
| `registerCameraStreamListener(listener)` | 注册预览流状态监听器（`CameraStreamListener`） |
| `unregisterCameraStreamListener(listener)` | 注销预览流状态监听器 |
| `suspend startLive(params): Result<Unit>` | 发起 RTMP 直播推流，详见下方说明 |
| `startLive(params, callback)` | 发起直播推流（callback 形式） |
| `suspend stopLive(): Result<Unit>` | 停止直播推流 |
| `stopLive(callback)` | 停止直播推流（callback 形式） |
| `registerCameraLiveListener(listener)` | 注册直播推流状态监听器（`CameraLiveListener`） |
| `unregisterCameraLiveListener(listener)` | 注销直播推流状态监听器 |

> `registerBatteryListener` / `unregisterBatteryListener` 为姿态监听的旧命名，已废弃，请使用
> `registerPostureListener` / `unregisterPostureListener`。

> `startLive` 的前置条件：必须先将 `functionMode` 设为 `FunctionMode.VIDEO_LIVE`，并调用 `startStream()`
> 使预览流处于已打开状态（OPENED 或打开后的参数变化态 PARAMS_CHANGED），否则返回失败。返回成功仅表示推流请求
> 已受理，实际推流状态通过 `CameraLiveListener` 异步回调。全景拼接 / 全景原始 / 平面的渲染方式由
> `CameraLiveParams.mode` 指定；不传时由 SDK 根据相机上报的媒体偏移量自动判定（双镜头 → 全景拼接，
> 单镜头/广角 → 全景原始）。

### CameraStreamListener

```kotlin
interface CameraStreamListener
```

| 回调 | 说明 |
|------|------|
| `onOpening()` | 预览流开始打开 |
| `onOpened()` | 预览流成功打开 |
| `onIdle()` | 预览流已关闭 |
| `onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate)` | 预览流参数（分辨率、帧率、裁剪信息等）变化 |
| `onStreamDataNotify(streamData: PreviewStreamFrame)` | 收到预览流数据帧（默认空实现） |

### CameraLiveParams

直播推流参数，传入 `CameraPreview.startLive()`。

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

| 属性 | 说明 |
|------|------|
| `rtmpUrl` | RTMP 推流地址 |
| `mode` | 直播渲染模式（`LiveMode`），与 `functionMode` 无关；不传时由 SDK 根据相机上报的媒体偏移量自动判定（双镜头 → 全景拼接，单镜头/广角 → 全景原始） |
| `width` / `height` | 推流画面分辨率（像素） |
| `fps` | 推流帧率 |
| `bitrate` | 推流码率（单位 Mbps，底层内部转换为 bps） |
| `netId` | 推流使用的网络 id，默认 -1（底层默认网络）。SDK 不管理网络，绑定指定网络（如蜂窝）时由调用方传入对应 network id |

### LiveMode

直播渲染模式枚举，由调用方在 `CameraLiveParams` 中显式指定。

| 枚举值 | 说明 |
|--------|------|
| `PANO_STITCH` | 全景拼接直播 |
| `PANO_CAPTURE` | 全景原始直播（不做拼接，球面渲染） |
| `PLANE` | 平面直播 |

### CameraLiveListener

直播推流状态回调，通过 `CameraPreview.registerCameraLiveListener()` 注册。所有回调均在非主线程分发，更新 UI 需自行切换到主线程。

```kotlin
interface CameraLiveListener
```

| 回调 | 说明 |
|------|------|
| `onStarted()` | 推流成功启动 |
| `onFps(fps: Int)` | 推流帧率更新，`fps` 为当前实时帧率 |
| `onStopped()` | 推流正常停止 |
| `onFailed(errorCode: Int, message: String?)` | 推流发生错误，`errorCode` 为底层错误码，`message` 可能为 null |

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
| `data` | 帧实际字节数据 |
| `timestamp` | 帧时间戳，单位由底层决定（通常为毫秒，送入 MediaCodec 解码前需转换为微秒） |
| `type` | 帧类型，见下表 |

### PreviewStreamType

| 枚举值 | 说明 |
|--------|------|
| `VIDEO` | 普通视频帧 |
| `VIDEO_L` | 左眼/左侧视频帧（用于全景或 3D 视频） |
| `VIDEO_R` | 右眼/右侧视频帧（用于全景或 3D 视频） |
| `AUDIO` | 音频帧 |
| `GYRO` | 陀螺仪/姿态数据帧 |
| `OTHER` | 其他类型数据 |
| `UNKNOWN` | 未知类型数据 |

> `val isVideo: Boolean` — 判断是否为视频帧（`VIDEO` / `VIDEO_L` / `VIDEO_R`）。

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
| `windowCropInfo` | 相机窗口裁剪信息，用于全景拼接 |
| `offsetData` | 相机预览偏移数据，包含镜头校正参数 |
| `stabOffset` | 防抖偏移量字符串 |
| `previewWidth` / `previewHeight` | 当前预览流的宽高（像素） |
| `previewFps` | 当前预览流的帧率 |

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
| `getEndpoint(): String` | 文件服务器完整基础 URL（如 `http://192.168.42.1:80/`） |
| `getHost(): String` | 主机地址（如 `192.168.42.1`） |
| `getProt(): Int` | 端口号（通常为 80） |

**文件列表**

| 方法 | 形式 | 说明 |
|------|------|------|
| `listMediaFiles(mediaFileType, includeRecording, callback)` | 回调 | 获取全量文件列表，返回 URI 列表 |
| `listMediaFiles(mediaFileType, includeRecording)` | 协程 | 同上 |
| `listMediaFiles(mediaFileType, start, limit, includeRecording, callback)` | 回调 | 分页获取，返回 `Pair<List<String>, Int>`（当前页列表, 总文件数） |
| `listMediaFiles(mediaFileType, start, limit, includeRecording)` | 协程 | 同上 |
| `getFileInfoList(callback)` | 回调 | 获取所有文件信息列表（`List<FileInfo>`） |
| `getFileInfoList()` | 协程 | 同上 |

> `mediaFileType` 默认 `MediaFileType.VIDEO_AND_PHOTO`；`includeRecording` 默认 false，为 true 时包含当前正在录制中的文件。

**文件操作**

| 方法 | 形式 | 说明 |
|------|------|------|
| `deleteMediaFiles(vararg uris, callback)` | 回调 | 删除指定文件 |
| `deleteMediaFiles(vararg uris)` | 协程 | 删除指定文件 |
| `downloadMediaFile(url, targetDir, progressCallback?)` | 协程 | 下载媒体文件，返回下载成功后的本地文件绝对路径 |
| `downloadMediaFile(url, targetDir, progressCallback)` | 进度回调 | 下载媒体文件 |
| `downloadCameraLogFile(targetDir, progressCallback?)` | 协程 | 下载相机日志文件，返回本地日志文件绝对路径 |
| `downloadCameraLogFile(targetDir, progressCallback)` | 进度回调 | 下载相机日志文件 |

> 协程形式的 `progressCallback` 参数为 `(已下载字节数, 总字节数)`；回调形式使用 `ProgressCallback` 接口。
> `downloadMediaFile` 的协程重载要求显式传入 `targetDir`（回调重载默认使用 SDK 工作目录）；`downloadCameraLogFile` 的 `targetDir` 默认使用 SDK 日志目录。

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

> 升级流程会把本地固件文件传输至相机并触发升级。

---

## 7. GPS 数据注入

拍摄时如需将 GPS 信息写入媒体文件，调用方直接持有并管理自己的定位数据源，通过 `CameraCapture.startCapture(gpsInfo)` / `stopCapture(gpsInfo)` 传入起止时刻的 GPS 信息，录制过程中如需更新，调用 `CameraCapture.setGpsInfo(gpsInfo)`。

> 拍摄开始的 GPS 随拍摄请求一并写入；录制过程中调用 `setGpsInfo` 则按轨迹记录持续更新。
> 轨迹以 `timestampMs` 与媒体帧对齐，因此该时间戳必须与相机时钟同基准。

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
| `timestampMs` | 记录此 GPS 数据时的时间戳（UTC 毫秒） |

> 轨迹记录以 `timestampMs` 与媒体帧对齐，因此该时间戳必须与相机时钟同基准。

---

## 8. 事件监听器

### DisconnectListener

设备与相机断开连接时触发。通过 `CameraDevice.registerDisconnectListener()` 注册。

| 回调 | 参数 | 说明 |
|------|------|------|
| `onDisconnect(throwable: Throwable?)` | throwable：断连原因（正常主动断开时为 null） | 连接断开 |

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
| `onCaptureWorking(functionMode)` | 当前拍摄模式 | 拍摄正式开始并处于工作状态 |
| `onCaptureStopping(functionMode)` | 当前拍摄模式 | 拍摄即将停止 |
| `onCaptureFinish(functionMode, filePaths)` | filePaths：相机端生成的文件路径/URI 列表 | 拍摄完成并成功生成文件 |
| `onCaptureError(functionMode, throwable)` | throwable：错误原因 | 拍摄过程中发生错误 |
| `onCaptureTimeChanged(functionMode, captureTime)` | captureTime：已录制时长（仅录像等持续性拍摄模式） | 录制时长变化 |
| `onCaptureCountChanged(functionMode, captureCount)` | captureCount：已拍摄张数（连拍、间隔拍摄等） | 拍摄张数变化 |
| `onCaptureSubStatusChanged(functionMode, subStatus)` | subStatus：拍摄子状态（如全景拼接进度、HDR 处理） | 拍摄子状态变化 |

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
| `onAuthorizationResult(operationType, result)` | operationType：触发此授权结果的操作类型；result：授权操作的结果 | 用户在相机端确认或拒绝授权后回调 |

---

## 9. 公共数据类型

以下类型由 Camera SDK 与 Media SDK 共用，此处一并列出。

### KMPCameraPreviewPipeline

在 Camera SDK 与 Media SDK 中均有使用：

- Camera SDK：`CameraPreview.setPipeline(pipeline)` — 将管线注入相机预览
- Media SDK：`PreviewPlayer.getPipeline()` — 获取当前渲染管线

管线对象由 Media SDK 侧创建后传入相机侧，作为预览数据的传输通道。

---

### PreviewStreamParamsUpdate（Camera → Media）

相机预览流参数变化时，通过 `CameraStreamListener.onParamsChanged()` 回调此对象。媒体侧的 `PreviewPlayer.setWindowCropInfo()` 通常基于此对象中的裁剪窗进行更新；`offsetData` 与 `stabOffset` 由播放器按相机配置自行维护，对应的 `setOffset()` 已废弃为空实现。

详见 [§4 实时预览 - PreviewStreamParamsUpdate](#previewstreamparamsupdate)。
