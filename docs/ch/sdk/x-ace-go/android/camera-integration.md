# Camera SDK 集成指南

Camera SDK（`sdk-camera`）提供 Insta360 相机的连接管理、拍摄控制、实时预览、文件管理和固件升级能力，帮助开发者快速将 Insta360 相机接入自有 Android 应用。

---

## 目录

1. [SDK 初始化](#1-sdk-初始化)
2. [设备连接](#2-设备连接)
   - [2.1 创建 CameraDevice](#21-创建-cameradevice)
   - [2.2 Wi-Fi 连接](#22-wi-fi-连接)
   - [2.3 USB 连接](#23-usb-连接)
   - [2.4 BLE 连接](#24-ble-连接)
   - [2.5 通过蓝牙引导 Wi-Fi 连接](#25-通过蓝牙引导-wi-fi-连接)
   - [2.6 蓝牙唤醒](#26-蓝牙唤醒)
   - [2.7 断开连接与资源释放](#27-断开连接与资源释放)
   - [2.8 监听意外断连](#28-监听意外断连)
3. [系统状态监听](#3-系统状态监听)
4. [拍摄控制与参数](#4-拍摄控制与参数)
5. [实时预览](#5-实时预览)
6. [文件管理](#6-文件管理)
7. [固件升级](#7-固件升级)
8. [Wi-Fi 设置](#8-wi-fi-设置)
9. [设备管理](#9-设备管理)

---

## 1. SDK 初始化

在 `Application.onCreate()` 中完成初始化，其他模块依赖此步骤，必须最先执行。

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

## 2. 设备连接

### 2.1 创建 CameraDevice

每种连接类型独立创建一个实例。建议在持有连接生命周期的 ViewModel 中创建，并在 `onCleared()` 里调用 `release()`。

```kotlin
// 按需选择连接类型
val device = CameraDevice.get(ConnectType.WIFI)
val device = CameraDevice.get(ConnectType.BLE)
val device = CameraDevice.get(ConnectType.USB)
```

---

### 2.2 Wi-Fi 连接

相机和手机须已处于同一 Wi-Fi 网络，或手机已连接到相机热点。

```kotlin
// 协程方式
viewModelScope.launch {
    device.connect()
        .onSuccess { /* 连接成功，保存 device 实例供后续使用 */ }
        .onFailure { e ->
            // NativeException 包含底层错误码，可用于问题定位
            val msg = if (e is NativeException) "[${e.nativeErrorCode}] ${e.message}" else e.message
        }
}

// 也可以指定 networkId
device.connect(connectHint = networkId)
```

---

### 2.3 USB 连接

设备通过 USB 连接手机时使用。

```kotlin
viewModelScope.launch {
    device.connect()
        .onSuccess { /* 连接成功 */ }
        .onFailure { /* 处理错误 */ }
}
```

---

### 2.4 BLE 连接

BLE 连接分为扫描和连接两步。

**扫描**

```kotlin
// SDK 内置扫描：回调中的 BleDeviceCore 可直接用于后续连接
device.scan(
    timeoutMs = 10_000L,
    bleScanCallback = bleScanCallback {
        started  { /* 扫描开始，可清空设备列表 */ }
        scanning { bleDeviceCore ->
            // 建议按设备名过滤，只展示相机类设备
        }
        finished { devices -> /* 扫描结束 */ }
        error    { e -> /* 扫描失败 */ }
    }
)

// 不再需要扫描结果时主动停止
device.stopScan()
```

**连接（使用 SDK BleDeviceCore）**

```kotlin
// bleDeviceCore 来自 bleScanCallback.scanning 回调
viewModelScope.launch {
    device.connect(bleDeviceCore)
        .onSuccess { /* 连接成功 */ }
        .onFailure { /* 处理错误 */ }
}
```

**连接（使用系统 BluetoothDevice）**

如果已通过系统 BLE API 扫描得到 `BluetoothDevice`，可直接传入：

```kotlin
// bluetoothDevice 来自系统 BluetoothLeScanner 回调
viewModelScope.launch {
    device.connectBle(bluetoothDevice)
        .onSuccess { /* 连接成功 */ }
        .onFailure { /* 处理错误 */ }
}
```

---

### 2.5 通过蓝牙引导 Wi-Fi 连接

适用于相机 Wi-Fi 未开启、或 SSID/密码未知的场景。BLE 连接建立后，从相机读取 Wi-Fi 凭证，再通过系统 Wi-Fi API 连入相机热点，最终切换为 Wi-Fi 连接。

> Wi-Fi 连接延迟低、支持实时预览；纯 BLE 连接不支持预览流。

**业务流程**

```
1. BLE 扫描 → 选择设备 → BLE 连接（参见 2.4 节）
2. 通过 BLE 读取相机 Wi-Fi 凭证（SSID / 密码）
3. 调用系统 Wi-Fi API 连接到相机热点，获取 Network 对象
4. 将进程网络绑定到该 Network（否则 HTTP 请求仍走手机默认网络）
5. 断开 BLE，用 Wi-Fi networkHandle 发起 SDK Wi-Fi 连接
6. 断开时解除进程网络绑定
```

**主要 API**

```kotlin
// Step 2：通过 BLE 读取相机 Wi-Fi 凭证
val wifiData = bleDevice.system.getWifiData().getOrNull()
// wifiData.ssid — 相机热点 SSID
// wifiData.pwd  — 相机热点密码

// Step 3：系统 Wi-Fi 连接（Android 10+ 用 WifiNetworkSpecifier）
// 在 ConnectivityManager.NetworkCallback.onAvailable 中获得 Network 对象
val network: Network? = connectSystemWifi(ssid = wifiData.ssid, password = wifiData.pwd)

// Step 4：绑定进程网络，使后续 HTTP/SDK 通信走相机 Wi-Fi
connectivityManager.bindProcessToNetwork(network)

// Step 5：断开 BLE，切换为 Wi-Fi 连接
bleDevice.disconnect()  // suspend fun，返回 Result<Unit>
bleDevice.release()
val wifiDevice = CameraDevice.get(ConnectType.WIFI)
wifiDevice.connect(network.networkHandle)  // 传入 networkHandle 指定网络

// Step 6：断开时解除绑定
connectivityManager.bindProcessToNetwork(null)
```

> **注意**：`bindProcessToNetwork` 会影响整个进程的网络路由，断开连接后必须及时调用 `bindProcessToNetwork(null)` 恢复，否则应用其他网络请求也会被路由到相机热点。

---

### 2.6 蓝牙唤醒

相机处于关机状态时，可通过 BLE 广播唤醒，唤醒成功后再发起连接。

```kotlin
// 需要知道目标相机型号和设备名
device.bleWakeUp(
    cameraType = CameraType.X4,
    deviceName = "Insta360 X4 XXXX",
    listener = object : BleWakeUpListener {
        override fun onWakeUpSuccess() {
            // 唤醒成功，此时可发起 BLE 连接
        }
        override fun onWakeUpError(errCode: Int) {
            // 唤醒失败
        }
    }
)
```

---

### 2.7 断开连接与资源释放

```kotlin
// 主动断开（协程方式，返回 Result<Unit>）
device.disconnect()

// 主动断开（回调方式）
device.disconnect(callback)

// 页面/ViewModel 销毁时释放资源
override fun onCleared() {
    device.release()
}
```

---

### 2.8 监听意外断连

断连监听建议在连接成功后立即注册：

```kotlin
val disconnectListener = object : DisconnectListener {
    override fun onDisconnect(throwable: Throwable?) {
        // throwable 为 null 表示主动断开，非 null 表示意外断开
        // 建议清除本地持有的 device 引用，并提示用户重新连接
    }
}

device.registerDisconnectListener(disconnectListener)

// 不再需要时注销，防止泄漏
device.unregisterDisconnectListener(disconnectListener)
```

---

## 3. 系统状态监听

> 前置条件：已完成设备连接，持有有效的 `CameraDevice` 实例。

### 3.1 注册与注销时机

建议在进入业务页面时注册、离开时注销，以获取实时状态推送。

```kotlin
// 注册
device.registerDisconnectListener(disconnectListener)
device.system.registerBatteryListener(batteryListener)
device.system.registerStorageStatusListener(storageListener)
device.system.registerTemperatureListener(temperatureListener)
device.system.registerChargeBoxStatusListener(chargeBoxListener)

// 注销（与注册位置对称）
device.unregisterDisconnectListener(disconnectListener)
device.system.unregisterBatteryListener(batteryListener)
device.system.unregisterStorageStatusListener(storageListener)
device.system.unregisterTemperatureListener(temperatureListener)
device.system.unregisterChargeBoxStatusListener(chargeBoxListener)
```

---

### 3.2 电量监听

```kotlin
val batteryListener = object : BatteryListener {
    override fun onBatteryLevelChange(batteryData: BatteryData) {
        val percent = if (batteryData.scale > 0)
            (batteryData.level * 100f / batteryData.scale).roundToInt()
        else batteryData.level
        // 更新电量显示
    }

    override fun onLowBatteryWarning() {
        // 建议弹出提示，告知用户尽快充电
    }
}
```

---

### 3.3 存储状态监听

```kotlin
val storageListener = object : StorageStateListener {
    override fun onStorageStateChanged(storageData: StorageData) {
        when (storageData.state) {
            StorageData.State.PASS     -> { /* 正常：可显示已用/总容量 */ }
            StorageData.State.NO_CARD  -> { /* 未插 SD 卡 */ }
            StorageData.State.NO_SPACE -> { /* 空间已满 */ }
            StorageData.State.INVALID_FORMAT -> { /* 格式异常，建议提示格式化 */ }
            StorageData.State.WP_CARD  -> { /* 写保护 */ }
            StorageData.State.OTHER_ERROR -> { /* 其他错误 */ }
        }
        // 容量信息（字节），total/free 可能为 0（未插卡时）
        val usedBytes = storageData.total - storageData.free
    }
}
```

---

### 3.4 温度监听

```kotlin
val temperatureListener = object : TemperatureListener {
    override fun onTemperatureUpdate(tempState: TempState) {
        when (tempState) {
            TempState.HIGH -> {
                // 建议提示用户暂停拍摄并为设备降温
            }
            TempState.HIGH_SHUTDOWN -> {
                // 相机可能即将自动关机，建议立即停止操作
            }
            else -> { /* 温度正常 */ }
        }
    }
}
```

---

### 3.5 主动拉取数据

除了监听推送，也可以在需要时主动拉取最新值：

```kotlin
viewModelScope.launch {
    // fetch 系列方法从相机拉取最新数据；get 系列方法读取本地缓存
    val battery     = device.system.fetchBatteryData().getOrNull()
    val storage     = device.system.fetchStorageData().getOrNull()
    val firmware    = device.system.fetchFirmwareRevision().getOrNull()
    val serialNum   = device.system.fetchSerialNumber().getOrNull()
    val cameraType  = device.system.fetchCameraType().getOrNull()
}
```

---

## 4. 拍摄控制与参数

> 前置条件：已连接相机，持有 `CameraDevice.capture`。

### 4.1 加载参数配置

连接相机后必须先调用 `loadJson()`，SDK 才能获知当前相机支持哪些参数。

```kotlin
// 建议在连接成功的回调中调用，后续参数操作才能正常工作
viewModelScope.launch {
    device.capture.loadJson()
}
```

---

### 4.2 查询支持的参数

不同型号的相机支持不同的参数组合，建议先查询再操作：

```kotlin
viewModelScope.launch {
    // 获取当前相机支持的所有参数
    val supportedParams: List<CameraParam<*>> = device.capture.getSupportParam()

    // 查询拍摄模式支持列表
    val modes: List<FunctionMode> = device.capture.functionMode.getSupported().getOrNull() ?: emptyList()

    // 查询视频分辨率支持列表
    val resolutions = device.capture.videoResolution.getSupported().getOrNull() ?: emptyList()
}
```

---

### 4.3 读写拍摄参数

所有参数通过 `CameraParam<T>` 统一操作：

```kotlin
viewModelScope.launch {
    val capture = device.capture

    // 读取当前值（从本地缓存）
    val currentMode  = capture.functionMode.getValue().getOrNull()
    val currentRes   = capture.videoResolution.getValue().getOrNull()

    // 从相机拉取最新值
    val latestMode   = capture.functionMode.fetchValue().getOrNull()

    // 写入新值（会同步通知相机）
    capture.functionMode.setValue(FunctionMode.NORMAL_VIDEO)
    capture.videoResolution.setValue(RecordResolution.RES_5_7K_30FPS)
    capture.hdrSwitch.setValue(true)
    capture.exposureISO.setValue(400)
    capture.whiteBalance.setValue(6500)
}
```

参数变化监听（适用于多端同步场景）：

```kotlin
// 注册
val listener: (RecordResolution) -> Unit = { newValue ->
    updateResolutionLabel(newValue)
}
device.capture.videoResolution.addListener(listener)

// 注销
device.capture.videoResolution.removeListener(listener)
```

---

### 4.4 开始与停止拍摄

```kotlin
viewModelScope.launch {
    // 拍摄行为由当前 functionMode 决定（录像/拍照/延时等）
    device.capture.startCapture()

    // 停止拍摄（录像模式）
    device.capture.stopCapture()

    // 查询是否正在拍摄
    val working = device.capture.isWorking()

    // 获取当前模式剩余拍摄量（录像为剩余秒数，拍照为剩余张数）
    val remaining = device.capture.getRemaining().getOrNull()
}
```

---

### 4.5 监听拍摄状态

```kotlin
val captureListener = object : CaptureStatusListener {
    override fun onCaptureStarting(functionMode: FunctionMode) {
        // 拍摄即将开始，建议禁用参数修改 UI
    }
    override fun onCaptureWorking(functionMode: FunctionMode) {
        // 拍摄正式进入工作状态
    }
    override fun onCaptureStopping(functionMode: FunctionMode) {
        // 拍摄正在停止中
    }
    override fun onCaptureFinish(functionMode: FunctionMode, filePaths: List<String>) {
        // 拍摄完成，filePaths 为相机端生成的文件路径
    }
    override fun onCaptureError(functionMode: FunctionMode, throwable: Throwable) {
        // 拍摄发生错误
    }
    override fun onCaptureTimeChanged(functionMode: FunctionMode, captureTime: Long) {
        // 录制时长更新（录像模式），captureTime 单位为秒
    }
    override fun onCaptureCountChanged(functionMode: FunctionMode, captureCount: Int) {
        // 已拍张数更新（连拍/间隔拍摄模式）
    }
    override fun onCaptureSubStatusChanged(functionMode: FunctionMode, subStatus: CameraCaptureStatus.SubStatus) {
        // 拍摄子状态变化（如 HDR 处理、预录制等）
    }
}

device.capture.registerCaptureStatusListener(captureListener)
// 不再使用时注销
device.capture.unregisterCaptureStatusListener(captureListener)
```

---

### 4.6 GPS 数据注入

在录像时可以将 GPS 坐标嵌入媒体文件，由调用方自行管理定位数据源，在开始/停止拍摄时传入，录制过程中如需更新再调用 `setGpsInfo`。

```kotlin
val gpsInfo = GpsInfo(
    latitude    = currentLatitude,
    longitude   = currentLongitude,
    altitude    = currentAltitude,
    timestampMs = System.currentTimeMillis()
)

// 开始拍摄时携带 GPS 信息
device.capture.startCapture(gpsInfo)

// 录制过程中更新 GPS 信息（如每秒一次）
device.capture.setGpsInfo(gpsInfo)

// 停止拍摄时携带最新 GPS 信息
device.capture.stopCapture(gpsInfo)
```

---

## 5. 实时预览

### 方式一：使用 InstaCapturePlayerView（推荐）

SDK 提供的 `InstaCapturePlayerView` 封装了解码和渲染，可快速接入。

**接入流程**

```
注册 CameraStreamListener
    → onOpened() 时调用 previewView.prepare() + play()
    → PlayerViewListener.onLoadingFinish() 时将 pipeline 注入相机
    → onParamsChanged() 时同步分辨率/偏移量/裁剪信息到播放器
```

**实现要点**

```kotlin
// 1. 创建播放器视图（通常在 onCreate() 中）
val previewView = InstaCapturePlayerView(context)

// 2. 注册流状态监听
val streamListener = object : CameraStreamListener {
    override fun onOpened() {
        // 流已就绪，初始化播放器
        previewView.prepare(PreviewParams())
        previewView.play()
    }

    override fun onParamsChanged(paramsUpdate: PreviewStreamParamsUpdate) {
        // 同步偏移量（用于全景拼接）
        paramsUpdate.offsetData?.let { offset ->
            previewView.setOffset(
                OffsetData(offset.offsetV1, offset.offsetV2, offset.offsetV3),
                paramsUpdate.stabOffset.orEmpty()
            )
        }
        // 同步分辨率和帧率
        if (paramsUpdate.previewWidth > 0 && paramsUpdate.previewHeight > 0) {
            previewView.setPreviewResolution(paramsUpdate.previewWidth, paramsUpdate.previewHeight)
            previewView.setFps(paramsUpdate.previewFps)
        }
        // 同步窗口裁剪信息（用于全景拼接）
        paramsUpdate.windowCropInfo?.let { crop ->
            previewView.setWindowCropInfo(
                MediaWindowCropInfo(crop.src_width, crop.src_height, crop.dst_width, crop.dst_height, crop.crop_offset_x, crop.crop_offset_y)
            )
        }
    }

    override fun onOpening() {}
    override fun onIdle() {}
}

// 3. 注册播放器视图监听，在 onLoadingFinish 时建立 Pipeline 连接
// Pipeline 是相机预览流数据传递到媒体侧渲染的通道
val playerViewListener = object : PlayerViewListener {
    override fun onLoadingFinish() {
        // 将播放器的渲染管线注入相机预览，完成数据通路绑定
        val pipeline = previewView.getPipeline() ?: return
        device.preview.setPipeline(pipeline)
    }
    override fun onReleaseCameraPipeline() {
        // 播放器释放管线时，通知相机侧同步清除
        device.preview.setPipeline(null)
    }
    override fun onFail(exception: InstaException) { /* 处理错误 */ }
    override fun onLoadingStatusChanged(isLoading: Boolean) {}
    override fun onFirstFrameRendered() {}
}
previewView.setListener(playerViewListener)

// 4. 注册姿态监听，根据相机朝向自动旋转预览画面
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

// 5. 开启预览流
fun startPreview() {
    device.preview.init(application)
    device.preview.registerCameraStreamListener(streamListener)
    device.preview.registerPostureListener(postureListener)
    device.preview.startStream()
}

// 6. 关闭预览流（建议在 onStop/onDestroy 时调用）
fun stopPreview() {
    device.preview.unregisterCameraStreamListener(streamListener)
    device.preview.unregisterPostureListener(postureListener)
    device.preview.stopStream()
    previewView.destroy()
}
```

---

### 方式二：接收原始流数据（自定义渲染）

适合需要自定义解码、截帧或二次处理的场景。

**接入流程**

```
注册 CameraStreamListener.onStreamDataNotify
    → 将 PreviewStreamFrame 放入 Channel 缓冲
    → 后台协程消费：聚合同一 timestamp 的分片 → 完整帧送入解码器
    → MediaCodec 解码 → 渲染到 SurfaceView
```

**重要：分片聚合**

相机推流时，同一帧数据可能通过多次 `onStreamDataNotify` 回调分批下发，这些分片共享相同的 `timestamp`。必须将同一 `timestamp` 的所有分片拼合成完整帧，再送入解码器；直接喂单个分片会导致绿屏/花屏。

```kotlin
// 1. 用 Channel 缓冲原始帧（避免在回调线程执行耗时操作）
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

// 2. 后台协程消费：聚合分片，完整帧送入解码器
lifecycleScope.launch(Dispatchers.IO) {
    val buffer = ByteArrayOutputStream(64 * 1024)
    var currentTs: Long? = null

    for (frame in frameChannel) {
        if (!frame.type.isVideo) continue  // 只处理视频帧

        val ts = frame.timestamp
        if (currentTs != null && ts != currentTs) {
            // timestamp 变化 → 上一帧已完整，送入解码器
            // 时间戳从毫秒转微秒（MediaCodec 要求）
            decoder.offer(buffer.toByteArray(), currentTs!! * 1000L)
            buffer.reset()
        }
        currentTs = ts
        buffer.write(frame.data)
    }
}

// 3. 开启 / 停止预览
fun startPreview() {
    device.preview.registerCameraStreamListener(streamListener)
    device.preview.startStream()
    // 建议立即请求一帧关键帧，加快首屏出画面速度
    device.preview.requestStreamIframe()
}

fun stopPreview() {
    device.preview.unregisterCameraStreamListener(streamListener)
    device.preview.stopStream()
}
```

**H264/H265 编码识别**

预览流的编码类型（H264/H265）可能因相机型号或固件版本不同而有差异，建议运行时查询：

```kotlin
// 主动查询当前编码类型
viewModelScope.launch {
    val encode = device.system.fetchVideoEncodeType().getOrNull()
    val isH265 = encode == VideoEncode.ENCODE_H265
    // 据此初始化对应的 MediaCodec（video/avc 或 video/hevc）
    // 或通知 SDK 解码侧
    device.preview.setStreamEncode(isH265)
}
```

也可以解析码流中的 NAL 参数集自动判断：H264 含 SPS(nalType=7)/PPS(nalType=8)，H265 含 VPS(nalType=32)/SPS(nalType=33)/PPS(nalType=34)。

**动态调整预览码率**

```kotlin
viewModelScope.launch {
    device.preview.setVideoBitrate(4 * 1024 * 1024)  // 4 Mbps，单位 bps
}
```

### 直播推流

> 前置条件：相机已连接并持有 `CameraDevice.preview`；必须先将拍摄模式切换为 `FunctionMode.VIDEO_LIVE`，再开启预览流并等待其打开（`CameraStreamListener.onOpened`），否则 `startLive` 返回失败。

**1. 注册直播状态监听**

```kotlin
val liveListener = object : CameraLiveListener {
    override fun onStarted() { /* 推流已建立 */ }
    override fun onFps(fps: Int) { /* 实时推流帧率 */ }
    override fun onStopped() { /* 推流已停止 */ }
    override fun onFailed(errorCode: Int, message: String?) { /* 推流失败 */ }
}
device.preview.registerCameraLiveListener(liveListener)
```

**2. 切到直播模式并开启预览流**

```kotlin
// 切换拍摄模式（参数读写参见 4.3 节）
device.capture.functionMode.setValue(FunctionMode.VIDEO_LIVE)
// 开启预览流（参见 5.1 节方式一/方式二）
device.preview.startStream()
```

**3. 发起推流**

```kotlin
viewModelScope.launch {
    device.preview.startLive(
        CameraLiveParams(
            rtmpUrl = "rtmp://your-server/live/stream-key",
            width   = 1920,
            height  = 960,
            fps     = 30,
            bitrate = 4,          // 单位 Mbps
            // netId 默认 -1；绑定指定网络（如蜂窝）时传入对应 network id
        )
    ).onSuccess {
        // 请求已受理，实际推流状态由 liveListener.onStarted 驱动
    }.onFailure { /* 处理推流请求失败 */ }
}
```

**4. 停止推流**

```kotlin
viewModelScope.launch {
    device.preview.stopLive()
}
// 页面退出时注销监听
device.preview.unregisterCameraLiveListener(liveListener)
```

---

## 6. 文件管理

> 前置条件：相机已连接，持有 `CameraDevice.file`。Wi-Fi 连接下文件地址通过 HTTP 访问，BLE/USB 连接下不支持文件下载。

### 6.1 获取文件列表

```kotlin
viewModelScope.launch {
    val file = device.file

    // 获取全量列表，返回文件 URI 列表
    val uris: List<String> = file.listMediaFiles().getOrNull() ?: return@launch

    // 按类型过滤
    val videoUris = file.listMediaFiles(MediaFileType.VIDEO).getOrNull() ?: emptyList()

    // 分页获取（文件多时推荐）
    // 返回值：Pair<当前页 URI 列表, 总文件数>
    val (pageUris, total) = file.listMediaFiles(
        start = 0, limit = 20
    ).getOrNull() ?: return@launch
}
```

---

### 6.2 下载文件

下载时需拼接完整 URL：`getEndpoint()` 返回类似 `http://192.168.42.1:80/` 的前缀。

```kotlin
viewModelScope.launch {
    val fullUrl = device.file.getEndpoint() + relativeUri

    device.file.downloadMediaFile(
        url       = fullUrl,
        targetDir = targetDirPath,
        progressCallback = { downloaded, total ->
            val percent = (downloaded * 100f / total).toInt()
            // 更新进度 UI
        }
    ).onSuccess { localPath ->
        // localPath 为下载后的本地绝对路径
    }.onFailure { e ->
        // 处理下载失败
    }
}
```

> **建议**：使用 `Channel` 或队列串行处理多个下载任务，避免并发下载导致内存压力或网络拥塞。

---

### 6.3 删除文件

```kotlin
viewModelScope.launch {
    // 支持批量删除
    device.file.deleteMediaFiles(uri1, uri2, uri3)
        .onSuccess { /* 删除成功，刷新文件列表 */ }
        .onFailure { /* 处理失败 */ }
}
```

---

### 6.4 下载相机日志

用于故障排查，日志文件以压缩包形式下载。

```kotlin
viewModelScope.launch {
    device.file.downloadCameraLogFile(
        targetDir = cacheDir.absolutePath,
        progressCallback = { downloaded, total -> /* 更新进度 */ }
    ).onSuccess { logPath ->
        // 可通过系统分享或上传到服务器
    }.onFailure { /* 处理失败 */ }
}
```

---

## 7. 固件升级

> 前置条件：相机已连接，持有 `CameraDevice.firmware`。升级过程中请勿断开连接。

### 7.1 查询当前版本

```kotlin
val version = device.firmware.getVersion().getOrNull()
```

### 7.2 执行升级

固件文件通常从应用服务器下载后保存到本地，扩展名为 `.bin` 或 `.pkg`。

```kotlin
// 回调方式
device.firmware.upgradeFirmware(
    filePath = localFirmwarePath,
    callback = progressCallback {
        success {
            // 升级成功，相机可能自动重启
        }
        progress { p ->
            // p 为 0.0 ~ 1.0 的进度值
            updateProgress((p * 100).toInt())
        }
        throwable { e ->
            // 升级失败，建议提示用户重试
        }
    }
)

// 协程方式
viewModelScope.launch {
    device.firmware.upgradeFirmware(
        filePath = localFirmwarePath,
        progress = { p -> updateProgress((p * 100).toInt()) }
    ).onSuccess { /* 升级成功 */ }
     .onFailure { /* 升级失败 */ }
}
```

---

## 8. Wi-Fi 设置

> 前置条件：相机已连接（通常为 BLE 连接后操作 Wi-Fi），持有 `CameraDevice.system`。

### 8.1 查询 Wi-Fi 信息

```kotlin
viewModelScope.launch {
    val wifiData    = device.system.fetchWifiData().getOrNull()
    val channelList = device.system.fetchWifiChannelList().getOrNull()

    // wifiData 包含 ssid、密码、当前信道等信息
    // channelList 包含当前地区可用信道列表
}
```

### 8.2 开启 / 关闭 Wi-Fi

```kotlin
viewModelScope.launch {
    // 开启 Wi-Fi，可指定信道（0 表示自动选择）
    device.system.openCameraWiFi(channel = 6)
        .onSuccess {
            // Wi-Fi 重启需要一定时间，建议等待约 10 秒后再查询最新状态
        }

    // 关闭 Wi-Fi
    device.system.closeCameraWiFi()
}
```

### 8.3 切换信道 / 重启 Wi-Fi

```kotlin
viewModelScope.launch {
    device.system.resetCameraWiFi(channel = 11)
        .onSuccess {
            // 同样需等待约 10 秒后再拉取新的信道数据
            // delay(10_000)
            val updated = device.system.fetchWifiData().getOrNull()
        }
}
```

### 8.4 设置 Wi-Fi 国家码

国家码影响可用信道范围。更改后需重启 Wi-Fi 生效。

```kotlin
viewModelScope.launch {
    device.system.setWiFiCountry("US")
        .onSuccess {
            // 建议紧接着重启 Wi-Fi
            device.system.resetCameraWiFi()
        }
}
```

---

## 9. 设备管理

> 前置条件：相机已连接，持有 `CameraDevice.system`。

### 9.1 激活相机

部分功能在相机未激活状态下受限，首次接入时需激活。

```kotlin
viewModelScope.launch {
    device.system.activeCamera(
        appId     = "your_app_id",
        secretKey = "your_secret_key"
    ).onSuccess { /* 激活成功 */ }
     .onFailure { /* 激活失败，检查 appId/secretKey 是否正确 */ }
}
```

### 9.2 屏幕锁定

```kotlin
viewModelScope.launch {
    device.system.setLockScreenState(LockScreenState.LOCK)
        .onSuccess { /* 锁屏已设置 */ }
        .onFailure { /* 处理失败 */ }
}
```

### 9.3 关机

```kotlin
// 关机为单向指令，无返回值
// 相机收到指令后自行关机，连接会随之断开
device.system.shutdown()
```

### 9.4 格式化存储

> 此操作不可逆，调用前请提示用户确认。`formatSdCard` 已废弃，请使用 `formatStorage`。

```kotlin
viewModelScope.launch {
    device.system.formatStorage(FileLocation.CAMERA)
        .onSuccess { /* 格式化完成 */ }
        .onFailure { /* 格式化失败 */ }
}
```
