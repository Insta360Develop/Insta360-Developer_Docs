# Media SDK 集成指南

Media SDK（`sdk-media`）提供 Insta360 相机媒体文件的播放、导出、图像拼接和实时预览渲染能力，支持全景视频/照片的本地播放、帧导出、HDR 合成以及相机实时预览。

---

## 目录

1. [SDK 初始化](#1-sdk-初始化)
2. [媒体文件管理](#2-媒体文件管理)
3. [视频播放](#3-视频播放)
4. [图片播放](#4-图片播放)
5. [相机预览接入](#5-相机预览接入)
6. [媒体导出](#6-媒体导出)
7. [图像拼接](#7-图像拼接)

---

## 1. SDK 初始化

在 `Application.onCreate()` 中完成初始化，其他媒体功能依赖此步骤。

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        InstaMediaSDK.init(this)
    }
}
```

---

## 2. 媒体文件管理

`WorkManager` 是获取媒体文件的统一入口，`WorkWrapper` 封装了单次拍摄结果的所有信息。

### 2.1 获取媒体文件列表

```kotlin
// 获取本地媒体文件（同步，可在任何线程调用）
val localWorks: List<WorkWrapper> = WorkManager.getAllLocalWorks()

// 获取相机中的媒体文件（协程，需要相机处于连接状态）
// 注意：Camera SDK 需已完成设备连接
viewModelScope.launch(Dispatchers.IO) {
    val result = WorkManager.getAllCameraWorks()
    result.onSuccess { works ->
        // works 中每个 WorkWrapper 对应相机中的一次拍摄结果
    }.onFailure { e ->
        // 处理错误，例如相机未连接或网络异常
    }
}
```

---

### 2.2 读取文件基本信息

```kotlin
val work: WorkWrapper = ...  // 来自 WorkManager

// 文件类型判断（根据类型决定后续播放/处理方式）
val isVideo   = work.isVideo()
val isPhoto   = work.isPhoto()
val isPanorama = work.isPanoramaFile()

// 拍摄模式判断
val isHDR      = work.isHDRVideo() || work.isHDRPhoto()
val isBullet   = work.isBulletTime()
val isTimeLapse = work.isTimeLapse()
val isNormalVideo = work.isNormalVideo()

// 基本参数
val width     = work.getWidth()               // 分辨率宽
val height    = work.getHeight()              // 分辨率高
val duration  = work.getTotalDurationInMs()   // 总时长（毫秒）
val fileSize  = work.getFileSize()            // 文件大小（字节）
val createAt  = work.getCreationTime()        // 创建时间（毫秒时间戳）
val cameraModel = work.getCameraType()        // 拍摄相机型号
```

---

### 2.3 加载额外元数据

陀螺仪、曝光等数据需要单独加载，建议在 IO 线程执行：

```kotlin
// 必须在 IO 线程调用
withContext(Dispatchers.IO) {
    work.loadExtraData()
}

// 加载完成后才能访问以下数据
if (work.isExtraDataLoaded()) {
    val gyroData     = work.getGyroData()      // 陀螺仪数据数组
    val exposureData = work.getExposureData()  // 曝光数据数组
}
```

---

### 2.4 加载缩略图

```kotlin
// 在 IO 线程加载，返回 KMPImage（Android 侧为 Bitmap）
val thumbnail: KMPImage? = withContext(Dispatchers.IO) {
    work.loadThumbnail()
}
```

---

### 2.5 下载相机文件到本地

适用于从相机获取的 `WorkWrapper`（`isCameraFile() == true`）。

```kotlin
viewModelScope.launch {
    work.download(
        progressCallback = { totalSize, downloadedSize ->
            val percent = (downloadedSize * 100f / totalSize).toInt()
            // 更新进度
        }
    ).onSuccess { localPaths ->
        // localPaths 为下载后的本地文件路径列表
    }.onFailure { e ->
        // 处理下载失败
    }
}
```

---

### 2.6 删除相机文件

```kotlin
viewModelScope.launch {
    work.delete()
        .onSuccess { /* 删除成功，刷新列表 */ }
        .onFailure { /* 处理失败 */ }
}
```

---

## 3. 视频播放

`InstaVideoPlayerView` 是视频播放的 UI 组件。播放前需先加载媒体元数据。

### 3.1 基本用法

```kotlin
// 1. 创建播放器视图（建议在布局中声明或代码动态创建）
val playerView = InstaVideoPlayerView(context)
playerView.setLifecycle(lifecycle)  // 绑定生命周期，自动处理暂停/恢复

// 2. 加载元数据（必须在 IO 线程）
viewModelScope.launch {
    withContext(Dispatchers.IO) { work.loadExtraData() }

    if (!work.isExtraDataLoaded()) {
        // 加载失败，不能继续播放
        return@launch
    }

    // 3. 配置播放参数
    val params = VideoPlayerParams(work).apply {
        isLooping = true                    // 是否循环播放
        isAutoPlayAfterPrepared = true      // 准备完成后自动播放
        isLrvEnable = false                 // 是否优先使用低分辨率预览文件（LRV）
        renderModel = RenderModel.AUTO      // 渲染模式
    }

    // 4. 初始化播放器
    playerView.prepare(params)
    playerView.play()
}

// 5. 销毁时释放资源（在 onDestroy 中调用）
playerView.destroy()
```

---

### 3.2 监听播放器状态

```kotlin
playerView.setListener(object : PlayerViewListener {
    override fun onLoadingStatusChanged(isLoading: Boolean) {
        // 可用于控制加载动画的显示/隐藏
    }
    override fun onLoadingFinish() {
        // 播放器已完成加载，即将开始渲染
    }
    override fun onFirstFrameRendered() {
        // 首帧已渲染，可隐藏封面图
    }
    override fun onFail(exception: InstaException) {
        // 播放出错，exception.message 包含错误描述
    }
    override fun onReleaseCameraPipeline() {
        // 仅在接入相机实时预览时有意义，本地播放可忽略
    }
})
```

---

### 3.3 监听播放进度

```kotlin
playerView.setVideoStatusListener(object : VideoStatusListener {
    override fun onProgressChanged(position: Long, length: Long) {
        // position/length 单位均为毫秒，可用于更新进度条
    }
    override fun onPlayStateChanged(isPlaying: Boolean) {
        // 更新播放/暂停按钮状态
    }
    override fun onSeekComplete() {
        // seek 操作已完成
    }
    override fun onComplete() {
        // 播放完毕（非循环模式）
    }
})
```

---

### 3.4 播放控制

```kotlin
playerView.pause()
playerView.resume()
playerView.seekTo(positionMs = 5_000L)   // 跳转到第 5 秒
playerView.setVolume(0.8f)               // 0.0（静音）~ 1.0（最大）
playerView.setLooping(true)

// 查询状态
val position  = playerView.getCurrentPosition()   // 当前进度（毫秒）
val duration  = playerView.getDuration()          // 总时长（毫秒）
val isPlaying = playerView.isPlaying()
val isSeeking = playerView.isSeeking()
```

---

### 3.5 视角与渲染控制

这些 API 来自 `BasePlayer`，视频播放器、图片播放器、预览播放器均支持。

```kotlin
// 切换镜头显示模式
playerView.switchNormalMode()       // 普通（平面拼接）
playerView.switchFisheyeMode()      // 鱼眼原图
playerView.switchPerspectiveMode()  // 透视（小行星 / 水晶球）

// 手势控制
playerView.setGestureEnabled(true)
playerView.setGestureZoomEnabled(true)
playerView.setGestureHorizontalEnabled(true)
playerView.setGestureVerticalEnabled(true)

// 设置视野约束（限制用户可旋转/缩放的范围）
playerView.setConstraint(
    widthRatio = -1, heightRatio = -1,  // -1 表示不限制比例
    minFov = 10f, maxFov = 120f, defaultFov = 90f,
    minDistance = 1f, maxDistance = 10f, defaultDistance = 5f
)

// 指定配件类型以应用对应的镜头校正参数
playerView.setOffsetType(OffsetType.PROTECTOR_FASTEN)  // 卡扣式保护镜

// 防抖类型
playerView.setStabType(StabType.PANORAMA)

// 渲染效果
playerView.setColorFusionEnabled(true)    // 消色差
playerView.setDynamicStitchEnabled(true)  // 动态拼接
playerView.setDePurpleFilterEnable(true)  // 去紫边

// 画面比例
playerView.setScreenRatio(16, 9)
```

---

## 4. 图片播放

`InstaImagePlayerView` 用于显示全景照片，用法与视频播放器相似。

```kotlin
// 1. 创建图片播放器视图
val playerView = InstaImagePlayerView(context)
playerView.setLifecycle(lifecycle)

// 2. 加载元数据（IO 线程）
viewModelScope.launch {
    withContext(Dispatchers.IO) { work.loadExtraData() }

    if (!work.isExtraDataLoaded()) return@launch

    // 3. 配置参数
    val params = ImagePlayerParams(work).apply {
        index = 0           // 多张图片时指定显示第几张
        renderModel = RenderModel.AUTO
    }

    // 4. 初始化播放器
    playerView.prepare(params)
    playerView.play()
}

// 5. 销毁
playerView.destroy()
```

> 视角控制、手势控制等 API 与视频播放器完全相同，参见[3.5 节](#35-视角与渲染控制)。

---

## 5. 相机预览接入

`PreviewPlayer`（`InstaPreviewPlayerView`）用于渲染相机实时预览流。

> 前置条件：Camera SDK 已连接相机并开启预览流。预览播放器通过 `KMPCameraPreviewPipeline` 与相机预览建立数据通路，Pipeline 需要在相机侧和媒体侧同时配置才能生效。Camera SDK 侧的接入方式参见 [Camera SDK 集成指南 §5 实时预览](../camera-integration/#_5-实时预览)。

### 5.1 基本用法

```kotlin
// 1. 创建预览播放器视图
val previewView = InstaPreviewPlayerView(context)  // 或 InstaCapturePlayerView
previewView.setLifecycle(lifecycle)

// 2. 配置预览参数
val params = PreviewParams(
    stabType         = StabType.PANORAMA,
    isColorFusion    = true,
    isGestureEnabled = true,
    renderModel      = RenderModel.AUTO
)

// 3. 初始化播放器（应在相机流开启后调用）
previewView.prepare(params)
previewView.play()

// 4. 在 PlayerViewListener.onLoadingFinish 中建立 Pipeline 连接
// Pipeline 由媒体侧创建，注入相机侧后，预览数据才能流向播放器渲染
previewView.setListener(object : PlayerViewListener {
    override fun onLoadingFinish() {
        val pipeline = previewView.getPipeline() ?: return
        // 将 pipeline 传给 CameraDevice.preview.setPipeline(pipeline)
        // 此调用需在 Camera SDK 侧执行（持有 CameraDevice 的地方）
    }
    override fun onReleaseCameraPipeline() {
        // Pipeline 释放时，也需通知相机侧清除：
        // CameraDevice.preview.setPipeline(null)
    }
    override fun onFail(exception: InstaException) {}
    override fun onLoadingStatusChanged(isLoading: Boolean) {}
    override fun onFirstFrameRendered() {}
})
```

---

### 5.2 同步相机流参数

当相机流的分辨率、偏移量或裁剪信息发生变化时（通过 `CameraStreamListener.onParamsChanged` 感知），需同步到预览播放器：

```kotlin
// 以下调用通常在 CameraStreamListener.onParamsChanged 回调中触发
// offsetData 和 stabOffset 来自 PreviewStreamParamsUpdate

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

### 5.3 停止预览

```kotlin
previewView.pause()   // 暂停
previewView.resume()  // 恢复

// 退出页面时销毁
previewView.destroy()
```

---

## 6. 媒体导出

`ExporterManager` 是导出的入口单例，支持图片导出、视频导出、从视频提取帧三种模式。

> 前置条件：已获取 `WorkWrapper` 实例，且元数据已加载（`work.loadExtraData()`）。

### 6.1 导出视频

```kotlin
val params = VideoExportParams(work).apply {
    targetPath = "/sdcard/output/video.mp4"  // 输出路径
    width      = 3840                         // 输出分辨率（-1 表示使用默认）
    height     = 1920
    fps        = 30                           // 输出帧率（-1 表示使用默认）
    bitrate    = 40_000_000                   // 输出码率 bps（-1 表示使用默认）
    exportMode = ExportMode.PANORAMA          // 投影模式
    stabType   = StabType.PANORAMA            // 防抖模式
    isDynamicStitch = true                    // 动态拼接
    isColorFusion   = true                    // 消色差
    offsetType = OffsetType.ORIGINAL          // 保护镜类型（无配件时为 ORIGINAL）
}

ExporterManager.exportVideo(params, object : IExportCallback {
    override fun onStart(id: Int) {
        // id 可用于后续调用 stopExport(id) 取消导出
    }
    override fun onProgress(progress: Float) {
        // progress 为 0.0 ~ 1.0
        updateProgress((progress * 100).toInt())
    }
    override fun onSuccess() {
        // 导出完成
    }
    override fun onFail(throwable: Throwable) {
        // 导出失败
    }
    override fun onCancel() {
        // 已被取消
    }
})
```

---

### 6.2 导出图片

```kotlin
val params = ImageExportParams(work).apply {
    targetPath = "/sdcard/output/photo.jpg"
    width      = 7680
    height     = 3840
    exportMode = ExportMode.PANORAMA
    offsetType = OffsetType.ORIGINAL
    // 对于视频截帧导出，可以通过 timestampList 指定帧时间戳（秒）
    // timestampList = listOf(1.0, 3.5, 5.0)
}

ExporterManager.exportImage(params, object : IExportCallback {
    override fun onStart(id: Int) { /* 记录导出 id */ }
    override fun onSuccess() { /* 完成 */ }
    override fun onFail(throwable: Throwable) { /* 失败 */ }
    override fun onProgress(progress: Float) { /* 更新进度 */ }
    override fun onCancel() {}
})
```

---

### 6.3 从视频提取帧为图片

```kotlin
val params = ImageExportParams(work).apply {
    targetPath     = "/sdcard/output/"
    timestampList  = listOf(0.0, 2.5, 5.0)   // 要提取的时间点（秒）
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

### 6.4 取消导出

```kotlin
// exportId 来自 IExportCallback.onStart(id) 回调
ExporterManager.stopExport(exportId)
```

---

## 7. 图像拼接

`StitchManager` 提供鱼眼图拼接、HDR 合成和 PureShot 合成能力。

> 前置条件：已获取 `WorkWrapper` 实例。HDR/PureShot 合成前建议先通过 `work.supportHdrGenerate()` / `work.supportPureShotGenerate()` 确认支持。

### 7.1 全景图拼接（WorkWrapper 方式）

适用于相机拍摄的分离式鱼眼照片（SDK 自动识别需要拼接的文件）：

```kotlin
viewModelScope.launch {
    StitchManager.stitchSeparatedFisheye(
        workWrapper    = work,
        outputFilePath = "/sdcard/output/stitched.jpg"
    ).onSuccess { /* 拼接完成 */ }
     .onFailure { /* 拼接失败 */ }
}
```

---

### 7.2 全景图拼接（指定文件路径方式）

适用于直接操作两张鱼眼图片文件：

```kotlin
val stitchParams = TemplateBlenderParams(
    inputFilePath1 = "/sdcard/fisheye_front.jpg",
    inputFilePath2 = "/sdcard/fisheye_back.jpg",
    outputFilePath = "/sdcard/output/stitched.jpg"
).apply {
    fisheyeArrangement = FisheyeArrangement.SEPERATED  // 两张图片为独立文件
    blendAngle         = 8f                             // 混合区域角度（度）
    isColorAdjustment  = false                          // 是否色彩校正
}

viewModelScope.launch {
    StitchManager.stitchSeparatedFisheye(stitchParams)
        .onSuccess { /* 拼接完成 */ }
        .onFailure { /* 拼接失败 */ }
}
```

---

### 7.3 HDR 合成

将多张 AEB 曝光照片合成为一张 HDR 图：

```kotlin
// 建议先判断该 work 是否支持 HDR 合成
if (!work.supportHdrGenerate()) return

viewModelScope.launch {
    StitchManager.generateHDR(
        workWrapper    = work,
        outputFilePath = "/sdcard/output/hdr.jpg"
    ).onSuccess { /* 合成完成 */ }
     .onFailure { /* 合成失败 */ }
}
```

---

### 7.4 PureShot 合成

将多张普通照片合成降噪后的高质量图片：

```kotlin
if (!work.supportPureShotGenerate()) return

viewModelScope.launch {
    StitchManager.generatePureShot(
        workWrapper    = work,
        outputFilePath = "/sdcard/output/pureshot.jpg",
        algoFolderPath = "/sdcard/algo/"  // 算法模型文件目录
    ).onSuccess { /* 合成完成 */ }
     .onFailure { /* 合成失败 */ }
}
```
