# Media SDK 接口文档

Media SDK（`sdk-media`）提供 Insta360 相机媒体文件的播放、导出、图像拼接和实时预览渲染能力。本文档列出所有公开 API 的接口定义与参数说明。

---

## 目录

1. [媒体文件管理](#1-媒体文件管理)
2. [图像拼接](#2-图像拼接)
3. [媒体导出](#3-媒体导出)
4. [播放器](#4-播放器)
5. [播放器参数](#5-播放器参数)
6. [播放器监听器](#6-播放器监听器)
7. [渲染配置与枚举](#7-渲染配置与枚举)
8. [公共数据类型](#8-公共数据类型)

---

## 1. 媒体文件管理

### WorkManager

媒体文件列表的入口单例，实现 `WorkOperations` 接口。

```kotlin
object WorkManager : WorkOperations
```

### WorkOperations

```kotlin
interface WorkOperations
```

| 方法 | 形式 | 说明 |
|------|------|------|
| `getAllCameraWorks(): Result<List<WorkWrapper>>` | 协程 | 从相机获取所有媒体文件列表 |
| `getAllLocalWorks(): List<WorkWrapper>` | 同步 | 获取本地所有媒体文件列表 |

---

### IWorkWrapper

封装单次拍摄结果的元数据访问、类型判断和文件操作能力。

```kotlin
interface IWorkWrapper
```

**URL 属性**

| 属性 | 说明 |
|------|------|
| `allUrls: Array<String>` | 所有相关文件 URL（含 LRV 等） |
| `mainUrls: Array<String>` | 主文件（高分辨率）URL |
| `rawUrls: Array<String>` | RAW 文件 URL |
| `lrvUrls: Array<String>` | 低分辨率预览（LRV）URL |

**元数据**

| 方法 | 参数 | 说明 |
|------|------|------|
| `getCount()` | — | 文件段数量（多段视频时 > 1） |
| `getIdenticalKey(index)` | index 默认 0 | 文件唯一标识键 |
| `getWidth(index)` / `getHeight(index)` | index 默认 0 | 分辨率（像素） |
| `getBitrate(index)` | index 默认 0 | 码率（bps） |
| `getFps(index)` | index 默认 0 | 帧率 |
| `getCreationTime(index)` | index 默认 0 | 创建时间（毫秒时间戳） |
| `getFirstFrameTimeOffset(index)` | index 默认 0 | 第一帧时间偏移（毫秒） |
| `getRollingShutterTime(index)` | index 默认 0 | 滚动快门时间（秒） |
| `getDurationInMs(index)` | index 默认 0 | 单段时长（毫秒） |
| `getTotalDurationInMs()` | — | 所有段总时长（毫秒） |
| `getFileSize()` | — | 文件总大小（字节） |
| `getCameraType()` | — | 拍摄相机型号字符串 |
| `loadThumbnail(index)` | index 默认 0 | 加载缩略图，失败返回 null |
| `loadExtraData(index)` | index 默认 0 | 加载陀螺仪/曝光等额外元数据 |
| `isExtraDataLoaded(index)` | index 默认 0 | 额外元数据是否已加载 |
| `getGyroData()` | — | 陀螺仪数据数组，见 [GyroData](#gyrodata) |
| `getExposureData()` | — | 曝光数据数组，见 [ExposureData](#exposuredata) |

**文件类型判断**

| 方法 | 说明 |
|------|------|
| `isCameraFile()` | 来自相机（未下载到本地） |
| `isLocalFile()` | 本地文件 |
| `isPanoramaFile()` | 全景文件 |
| `isVideo()` / `isPhoto()` | 视频 / 照片 |
| `isHDRVideo()` / `isHDRPhoto()` | HDR 视频 / 照片 |
| `isBulletTime()` | 子弹时间 |
| `isBurst()` | 连拍 |
| `isTimeLapse()` | 延时摄影 |
| `isTimeShift()` | 时移（TimeShift） |
| `isNormalPhoto()` / `isNormalVideo()` | 普通照片 / 视频 |
| `isSuperNight()` | 超级夜景 |
| `isStarLapse()` | 星空延时 |
| `isLooperVideo()` | 循环录像 |
| `isSuperVideo()` | 超级视频 |
| `isIntervalShooting()` | 间隔拍摄 |
| `isSelfieVideo()` | 自拍视频 |
| `isSlowMotion()` | 慢动作 |
| `isPureVideo()` | 纯净视频（PureVideo） |
| `supportHdrGenerate()` | 是否支持 HDR 合成 |
| `supportPureShotGenerate()` | 是否支持 PureShot 合成 |

**文件操作**

| 方法 | 形式 | 说明 |
|------|------|------|
| `download(progressCallback?)` | 协程 | 下载到本地，返回本地路径列表；progressCallback 参数为 (总大小, 已下载大小) |
| `delete()` | 协程 | 从相机删除此文件 |

---

### WorkWrapper

`IWorkWrapper` 的抽象基类，子类根据文件来源（相机/本地）提供具体实现。

```kotlin
abstract class WorkWrapper(
    val httpPrefix: String = "",
    val downloadHttpPrefix: String = httpPrefix
) : IWorkWrapper, Comparable<WorkWrapper>
```

| 属性 | 说明 |
|------|------|
| `httpPrefix` | 文件服务器 HTTP 前缀（相机文件使用）。Wi-Fi Aware 连接下为裸 IPv6 地址 |
| `downloadHttpPrefix` | SDK 内部下载素材时应使用的前缀。Wi-Fi Aware 连接下为占位 hostname（配合动态 DNS 解析），避免裸 IPv6 地址的 zone id 语法被 OkHttp 拒绝解析；其余连接类型下与 `httpPrefix` 相同 |

---

### GyroData

单帧陀螺仪数据。

```kotlin
data class GyroData(
    val accelerateX: Double, val accelerateY: Double, val accelerateZ: Double,
    val rotationX: Double, val rotationY: Double, val rotationZ: Double,
    val timestamp: Long
)
```

| 属性 | 说明 |
|------|------|
| `accelerateX/Y/Z` | 三轴加速度（m/s²） |
| `rotationX/Y/Z` | 三轴角速度（rad/s） |
| `timestamp` | 时间戳（毫秒） |

---

### ExposureData

单帧曝光数据。

```kotlin
data class ExposureData(val shutterSpeeds: Double, val timestamp: Long)
```

| 属性 | 说明 |
|------|------|
| `shutterSpeeds` | 快门速度（秒） |
| `timestamp` | 时间戳（毫秒） |

---

## 2. 图像拼接

### StitchManager

拼接功能的入口单例，实现 `Stitcher` 接口。

```kotlin
object StitchManager : Stitcher
```

### Stitcher

```kotlin
interface Stitcher
```

| 方法 | 说明 |
|------|------|
| `stitchSeparatedFisheye(workWrapper, outputFilePath): Result<Unit>` | 自动识别 WorkWrapper 中的内容并执行鱼眼拼接 |
| `stitchSeparatedFisheye(templateBlenderParams): Result<Unit>` | 将两张鱼眼图片拼接为全景图 |
| `generateHDR(workWrapper, outputFilePath): Result<Unit>` | HDR 合成 |
| `generatePureShot(workWrapper, outputFilePath, algoFolderPath): Result<Unit>` | PureShot 合成 |

---

### TemplateBlenderParams

鱼眼图片拼接参数配置。

```kotlin
class TemplateBlenderParams(
    val inputFilePath1: String,   // 第一张鱼眼图路径
    val inputFilePath2: String,   // 第二张鱼眼图路径
    val outputFilePath: String,   // 输出文件路径
)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isColorAdjustment` | Boolean | false | 启用色彩校正 |
| `blendAngle` | Float | 8f | 混合区域角度（度） |
| `mapSizeWidth` | Int | 200 | 映射贴图宽度 |
| `mapSizeHeight` | Int | 100 | 映射贴图高度 |
| `fisheyeArrangement` | `FisheyeArrangement` | SEPERATED | 鱼眼图排列方式 |

### FisheyeArrangement

| 枚举值 | 说明 |
|--------|------|
| `CONNECTED` | 水平相连（左右拼接） |
| `VCONNECTED` | 垂直相连（上下拼接） |
| `SEPERATED` | 分离（两张独立图片） |

---

## 3. 媒体导出

### ExporterManager

导出功能的入口单例，实现 `Exporter` 接口。

```kotlin
object ExporterManager : Exporter
```

### Exporter

```kotlin
interface Exporter
```

| 方法 | 说明 |
|------|------|
| `exportImage(imageExportParams, callback)` | 导出图片 |
| `exportVideo(videoExportParams, callback)` | 导出视频 |
| `exportVideoToImage(imageExportParams, callback)` | 从视频中提取帧并导出为图片 |
| `stopExport(exportId: Int)` | 取消指定导出任务（exportId 由 `IExportCallback.onStart` 提供） |

---

### IExportCallback

导出任务回调接口。

```kotlin
interface IExportCallback
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onStart(id: Int)` | id：任务 ID | 导出开始，可用于取消任务 |
| `onSuccess()` | — | 导出成功 |
| `onFail(throwable: Throwable)` | throwable：失败原因 | 导出失败 |
| `onCancel()` | — | 导出被取消 |
| `onProgress(progress: Float)` | progress：0.0–1.0 | 导出进度（默认空实现） |

---

### ExportParams

导出参数基类，所有导出参数类均继承此类。

```kotlin
open class ExportParams(workWrapper: WorkWrapper) : MediaParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `exportMode` | `ExportMode` | PANORAMA | 导出投影模式 |
| `targetPath` | String? | null | 导出目标路径，null 使用默认路径 |
| `isUseSoftwareDecoder` | Boolean | false | 使用软件解码器 |
| `width` / `height` | Int | -1 | 导出分辨率（-1 表示默认） |
| `isDenoise` | Boolean | false | 降噪开关 |
| `distance` | Float | 0f | 观看距离 |
| `fov` | Float | 0f | 视场角（度） |
| `yaw` / `pitch` | Float | 0f | 偏航角 / 俯仰角（度） |

> 继承自 `MediaParams` 的公共属性见 [§5 MediaParams](#mediaparams)。

---

### VideoExportParams

视频导出参数。

```kotlin
class VideoExportParams(workWrapper: WorkWrapper) : ExportParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isUseSoftwareEncoder` | Boolean | false | 使用软件编码器（默认硬件） |
| `bitrate` | Int | -1 | 目标码率（bps，-1 使用默认） |
| `fps` | Int | -1 | 目标帧率（-1 使用默认） |
| `roll` | Float | 0f | 画面翻滚角（度） |

---

### ImageExportParams

图片导出参数。

```kotlin
class ImageExportParams(workWrapper: WorkWrapper) : ExportParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `index` | Int | 0 | 导出帧索引 |
| `timestampList` | `List<Double>` | empty | 指定导出帧时间戳列表（秒），非空时优先于 `index` |

---

## 4. 播放器

### 播放器继承关系

```
BasePlayer
├── VideoPlayer  (: StreamPlayer, BasePlayer, LocalPlayer)
├── ImagePlayer  (: BasePlayer, LocalPlayer)
└── PreviewPlayer (: StreamPlayer, BasePlayer)

StreamPlayer   — pause / resume / isPlaying
LocalPlayer    — 标记接口，标识支持本地文件播放
```

---

### BasePlayer

所有播放器的基础接口。

```kotlin
interface BasePlayer
```

**播放控制**

| 方法 | 说明 |
|------|------|
| `play()` | 开始播放 |
| `isLoading(): Boolean` | 是否正在加载 |
| `isPrepared(): Boolean` | 是否已准备完成 |
| `destroy()` | 销毁播放器，释放所有资源 |

**手势控制**

| 方法 | 说明 |
|------|------|
| `setGestureEnabled(enabled)` | 手势交互总开关 |
| `isGestureEnabled(): Boolean` | 获取手势总开关状态 |
| `setGestureHorizontalEnabled(enabled)` | 水平手势（左右旋转视角） |
| `setGestureVerticalEnabled(enabled)` | 垂直手势（上下旋转视角） |
| `setGestureZoomEnabled(enabled)` | 缩放手势（双指捏合） |
| `setGestureListener(listener: PlayerGestureListener?)` | 设置手势事件监听器 |

**镜头模式**

| 方法 | 说明 |
|------|------|
| `switchNormalMode()` | 普通（平面）模式 |
| `switchFisheyeMode()` | 鱼眼模式 |
| `switchPerspectiveMode()` | 透视模式 |

**视野控制**

| 方法 | 说明 |
|------|------|
| `setConstraint(widthRatio, heightRatio, minFov, maxFov, defaultFov, minDistance, maxDistance, defaultDistance)` | 设置视野约束参数 |
| `getFov(): Float` | 当前视场角（度） |
| `getDistance(): Float` | 当前观看距离 |
| `getYaw(): Float` | 偏航角（弧度制） |
| `getPitch(): Float` | 俯仰角（弧度制） |
| `getRoll(): Float` | 翻滚角（弧度制） |

**渲染设置**

| 方法 | 说明 |
|------|------|
| `setScreenRatio(ratioX, ratioY)` | 设置渲染视图宽高比 |
| `getScreenRatio(): Pair<Int, Int>` | 获取当前宽高比 |
| `setStabType(type: StabType)` | 设置防抖类型 |
| `getStabType(): StabType` | 获取当前防抖类型 |
| `setOffsetType(type: OffsetType)` | 设置镜头偏移类型（保护镜/潜水壳等配件） |
| `getOffsetType(): OffsetType` | 获取当前偏移类型 |
| `setColorFusionEnabled(enabled)` | 色彩融合（消色差）开关 |
| `isColorFusionEnabled(): Boolean` | 色彩融合是否启用 |
| `setDynamicStitchEnabled(enabled)` | 动态拼接开关 |
| `isDynamicStitchEnabled(): Boolean` | 动态拼接是否启用 |
| `setColorPlusEnabled(enabled)` | 色彩增强开关 |
| `isColorPlusEnabled(): Boolean` | 色彩增强是否启用 |
| `setColorPlusFilterIntensity(intensity)` | 色彩增强强度（0.0–1.0） |
| `getColorPlusFilterIntensity(): Float` | 获取色彩增强强度 |
| `setDePurpleFilterEnable(enabled)` | 去紫边滤镜开关 |
| `getDePurpleFilterEnable(): Boolean` | 去紫边滤镜是否启用 |
| `setListener(listener: PlayerViewListener?)` | 设置播放器视图事件监听器 |

---

### StreamPlayer

流式播放器通用接口（视频播放器和预览播放器均实现此接口）。

```kotlin
interface StreamPlayer
```

| 方法 | 说明 |
|------|------|
| `pause()` | 暂停播放 |
| `resume()` | 恢复播放 |
| `isPlaying(): Boolean` | 是否正在播放 |

---

### VideoPlayer

视频播放器，在 `StreamPlayer` + `BasePlayer` 基础上扩展了进度控制、循环播放等能力。

```kotlin
interface VideoPlayer : StreamPlayer, BasePlayer, LocalPlayer
```

| 方法 | 说明 |
|------|------|
| `prepare(params: VideoPlayerParams)` | 初始化并准备视频播放器 |
| `setVideoStatusListener(listener: VideoStatusListener?)` | 设置播放状态监听器 |
| `seekTo(position: Long)` | 跳转到指定位置（毫秒） |
| `isSeeking(): Boolean` | 是否正在 seek |
| `getCurrentPosition(): Long` | 当前播放位置（毫秒） |
| `getDuration(): Long` | 视频总时长（毫秒） |
| `isLooping(): Boolean` | 是否循环播放 |
| `setLooping(isLooping: Boolean)` | 设置循环播放 |
| `setVolume(volume: Float)` | 设置音量（0.0–1.0） |
| `setLrvEnable(enabled: Boolean)` | 启用低分辨率预览（LRV） |
| `isLrvEnable(): Boolean` | LRV 是否启用 |

---

### ImagePlayer

全景图片播放器。

```kotlin
interface ImagePlayer : BasePlayer, LocalPlayer
```

| 方法 | 说明 |
|------|------|
| `prepare(params: ImagePlayerParams)` | 初始化并准备图片播放器 |

---

### PreviewPlayer

相机实时预览播放器，在 `StreamPlayer` + `BasePlayer` 基础上扩展了预览流接入、分辨率设置等能力。

```kotlin
interface PreviewPlayer : StreamPlayer, BasePlayer
```

| 方法 | 说明 |
|------|------|
| `prepare(params: PreviewParams)` | 初始化并准备预览播放器 |
| `destroyRender()` | 销毁渲染器（重启播放器前必须先调用） |
| `setPreviewResolution(width, height)` | 设置预览分辨率 |
| `setFps(fps: Int)` | 设置预览帧率 |
| `getPreviewWidth(): Int` / `getPreviewHeight(): Int` | 当前预览分辨率 |
| `getFps(): Int` | 当前预览帧率 |
| `setOffset(offsetData, stabOffset)` | 更新镜头偏移量和防抖偏移量 |
| `setWindowCropInfo(cropInfo: WindowCropInfo)` | 设置窗口裁剪信息 |
| `getWindowCropInfo(): WindowCropInfo?` | 获取当前窗口裁剪信息 |
| `showPlayView()` / `hidePlayView()` | 显示/隐藏播放视图 |
| `getPipeline(): KMPCameraPreviewPipeline?` | 获取当前渲染管线 |
| `updateRotate(rotateDegreeContent, rotateDegree, cameraPosture, cameraPostureCorrected)` | 更新画面旋转角度 |
| `redetectCameraRotation()` | 重新检测相机旋转方向 |

---

## 5. 播放器参数

### MediaParams

所有媒体参数类的公共基类。

```kotlin
open class MediaParams(val workWrapper: WorkWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isDePurpleFilterOn` | Boolean | false | 去紫边 |
| `isColorFusion` | Boolean | false | 消色差 |
| `isDynamicStitch` | Boolean | true | 动态拼接 |
| `stabType` | `StabType` | AUTO | 防抖类型 |
| `offsetType` | `OffsetType` | ORIGINAL | 镜头偏移类型 |
| `screenRatio` | IntArray | [-1, -1] | 宽高比（-1 表示不限制） |
| `colorPlusEnable` | Boolean | false | 色彩增强 |
| `colorPlusFilterIntensity` | Float | 1.0f | 色彩增强强度 |
| `urlForAction` | String | "" | 指定播放/导出的 URL |

---

### PlayerParams

播放器通用参数，继承 `MediaParams`。

```kotlin
open class PlayerParams(workWrapper: WorkWrapper) : MediaParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `renderModel` | `RenderModel` | AUTO | 渲染模式 |
| `isGestureEnabled` | Boolean | true | 手势交互总开关 |
| `isGestureHorizontalEnabled` | Boolean | true | 水平手势 |
| `isGestureVerticalEnabled` | Boolean | true | 垂直手势 |
| `isGestureZoomEnabled` | Boolean | true | 缩放手势 |
| `isWithSwitchingAnimation` | Boolean | false | 切换镜头模式时带动画 |

---

### VideoPlayerParams

视频播放器参数，继承 `PlayerParams`。

```kotlin
class VideoPlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loadingImageResId` | Int | -1 | 加载中占位图资源 ID（-1 表示不使用） |
| `loadingBackgroundColor` | Int | 黑色 | 加载中背景色（ARGB） |
| `isAutoPlayAfterPrepared` | Boolean | true | 准备完成后自动播放 |
| `isLooping` | Boolean | true | 循环播放 |
| `isLrvEnable` | Boolean | false | 启用低分辨率预览（LRV） |
| `isVideoHwaccelEnabled` | Boolean | true | 启用视频硬件解码加速 |

---

### ImagePlayerParams

图片播放器参数，继承 `PlayerParams`。

```kotlin
class ImagePlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `index` | Int | 0 | 显示的图片帧索引 |

---

### PreviewParams

相机预览播放器参数。

```kotlin
data class PreviewParams(...)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` / `height` | Int | -1 | 预览分辨率（-1 使用默认） |
| `fps` | Int | -1 | 预览帧率 |
| `screenRatio` | `Pair<Int, Int>` | -1 to -1 | 渲染视图宽高比 |
| `stabType` | `StabType?` | null | 防抖类型 |
| `isGestureEnabled` | Boolean | true | 手势交互开关 |
| `isCopyVideoHwaccel` | Boolean | true | 硬件加速帧复制 |
| `isVideoHwaccelEnabled` | Boolean | true | 启用视频硬件解码加速 |
| `isColorFusion` | Boolean | true | 色彩融合（消色差） |
| `stabCacheFrameNum` | Int | -1 | 防抖缓存帧数 |
| `isOnlyStitchSurfaceRender` | Boolean | false | 仅渲染到指定 Surface |
| `renderModel` | `RenderModel?` | null | 渲染模式 |
| `isRenderAtOnce` | Boolean | false | 立即开始渲染（不等待首帧） |
| `cameraRenderSurface` | `KMPSurface?` | null | 指定渲染目标 Surface |
| `cameraRenderSurfaceWidth` / `Height` | Int | -1 | 指定 Surface 尺寸 |

---

## 6. 播放器监听器

### VideoStatusListener

视频播放状态回调，通过 `VideoPlayer.setVideoStatusListener()` 设置。

```kotlin
interface VideoStatusListener
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onProgressChanged(position, length)` | 毫秒 | 播放进度变化 |
| `onPlayStateChanged(isPlaying)` | — | 播放/暂停状态变化 |
| `onSeekComplete()` | — | seek 操作完成 |
| `onComplete()` | — | 播放完成 |
| `onPlayingFluencyResult(fluentFactor, srcTime, detectTime)` | fluentFactor: Double, srcTime: Double, detectTime: Double | 播放流畅度检测结果，每隔 1 秒检测一次；`fluentFactor` 为 [0,1] 的流畅系数，[0.65,1] 表示流畅，-1 表示检测失败；默认空实现 |

---

### PlayerViewListener

播放器视图事件回调，通过 `BasePlayer.setListener()` 设置。

```kotlin
interface PlayerViewListener
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onLoadingStatusChanged(isLoading)` | isLoading：是否加载中 | 加载状态变化 |
| `onLoadingFinish()` | — | 加载完成 |
| `onFail(exception: InstaException)` | exception：错误详情 | 发生错误 |
| `onFirstFrameRendered()` | — | 第一帧渲染完成 |
| `onReleaseCameraPipeline()` | — | 相机预览管线释放 |

---

### PlayerGestureListener

播放器手势事件监听，通过 `BasePlayer.setGestureListener()` 设置。所有方法均提供默认空实现，按需覆写。

```kotlin
interface PlayerGestureListener
```

| 回调 | 说明 |
|------|------|
| `onDown(event): Boolean` | 手指按下，返回 true 消费事件 |
| `onTap(event): Boolean` | 单击，返回 true 消费事件 |
| `onUp()` | 手指抬起 |
| `onLongPress(event)` | 长按 |
| `onZoom()` | 缩放手势开始 |
| `onZoomAnimation()` | 缩放动画进行中 |
| `onZoomAnimationEnd()` | 缩放动画结束 |
| `onScroll()` | 滑动手势 |
| `onFlingAnimation()` | 快速滑动动画进行中 |
| `onFlingAnimationEnd()` | 快速滑动动画结束 |

---

## 7. 渲染配置与枚举

### ExportMode

| 枚举值 | 说明 |
|--------|------|
| `PANORAMA` | 全景平面投影（等距柱状投影） |
| `SPHERE` | 球形投影 |

---

### OffsetType

用于指定相机佩戴的配件类型，以应用对应的镜头畸变校正参数。

| 枚举值 | 说明 |
|--------|------|
| `ORIGINAL` | 无配件，使用原始偏移 |
| `PROTECTOR_FASTEN` | 卡扣式保护镜 |
| `DIVING_WATER` | 潜水壳水下（旧版） |
| `DIVING_AIR` | 潜水壳水上（旧版） |
| `WATERPROOF` | 防水壳 |
| `PROTECTOR_ADHERE` | 黏贴式保护镜 |
| `DIVING_INVISIBLE_WATER` | 隐形潜水壳水下 |
| `DIVING_INVISIBLE_AIR` | 隐形潜水壳水上 |
| `PROTECTOR_A` | 保护镜 A 级（塑料，X3/X4） |
| `PROTECTOR_S` | 保护镜 S 级（玻璃，X3/X4） |
| `PROTECTOR_AS_AVERAGE` | A/S 平均保护镜（虚拟综合参数） |

---

### StabType

| 枚举值 | 说明 |
|--------|------|
| `AUTO` | 自动选择最优防抖算法 |
| `PANORAMA` | 全景防抖 |
| `CALIBRATE_HORIZON` | 水平校准防抖 |
| `FOOTAGE_MOTION_SMOOTH` | 运动平滑防抖 |

---

### StabilizerStabMode

| 枚举值 | rawValue | 说明 |
|--------|----------|------|
| `Off` | -1 | 关闭防抖 |
| `Still` | 0 | 固定防抖 |
| `ZDirectional` | 1 | Z 轴方向防抖 |
| `FullDirectional` | 2 | 全方向防抖 |
| `FreeFootage` | 4 | 自由运镜防抖 |
| `FlipEffect` | 22 | 翻转效果 |
| `RelativeRefine` | 8 | 相对精细防抖 |
| `AbsoluteRefine` | 9 | 绝对精细防抖 |
| `BulletTime` | 5 | 子弹时间 |
| `PanoFPV` | 23 | 全景 FPV |
| `Immersion` | 24 | 沉浸模式 |

---

### RenderModel

| 枚举值 | nativeValue | 说明 |
|--------|-------------|------|
| `AUTO` | 0 | 自动融合两路视频流 |
| `PLANE_STITCH` | 11 | 平面拼接（双摄融合平铺） |
| `PLANE` | 20 | 分割平面（鱼眼分屏显示） |

---

### DisplayType

| 枚举值 | rawValue | 说明 |
|--------|----------|------|
| `Auto` | 0 | 自动 |
| `SphereStitch` | 2 | 球形拼接 |
| `SphereEquirectangular` | 3 | 球形等距柱状 |
| `SphereFisheyeDewarp` | 4 | 球形鱼眼去畸变 |
| `PlaneStitch` | 11 | 平面拼接 |
| `PlaneEquirectangular` | 12 | 平面等距柱状 |
| `PlaneFisheyeDewarp` | 13 | 平面鱼眼去畸变 |
| `Plane` | 20 | 纯平面 |
| *(及其他)* | — | 详见源码 `DisplayType.kt` |

---

### OpticalFlowType

| 枚举值 | rawValue | 说明 |
|--------|----------|------|
| `DynamicStitch` | 0 | 动态拼接 |
| `Disflow` | 1 | Disflow 光流算法 |
| `AiFlow` | 2 | AI 光流算法 |

---

### ImageLayout

| 枚举值 | rawValue | 说明 |
|--------|----------|------|
| `HorizontalMerged` | 0 | 水平合并 |
| `OneBulletTime` | 1 | 子弹时间单帧 |
| `Respective2Images` | 2 | 两张独立图像（默认） |
| `LeftHalf` / `RightHalf` | 3 / 4 | 左半 / 右半 |
| `TopHalf` / `BottomHalf` | 5 / 6 | 上半 / 下半 |
| `LeftRight` | 7 | 左右分屏 |
| `TopBottom` | 8 | 上下分屏 |

---

### ProtectOffsetConvertOption

位标志枚举，用于指定保护镜/配件类型，可按位或组合。

| 枚举值 | 说明 |
|--------|------|
| `None` | 无配件 |
| `EnableWaterProof` | 防水壳 |
| `EnableDivingAir` / `EnableDivingWater` | 潜水壳（旧版水上/水下） |
| `EnableDivingAirV2` / `EnableDivingWaterV2` | 潜水壳（新版水上/水下） |
| `EnableBuckleShell` | 卡扣式保护壳 |
| `EnableAdhesiveShell` | 黏贴式保护壳 |
| `EnableGlassShell` | 玻璃保护壳 |
| `EnablePlasticCement` | 塑料保护壳 |
| `EnableAverageShell` | 平均保护壳 |
| `EnableNDFilter` | ND 滤镜 |
| `EnableDivingWaterPro` / `EnableDivingAirPro` | 潜水壳 Pro |

---

### StabilizerParam

```kotlin
data class StabilizerParam(
    val offset: String,
    val preferredStabMode: StabilizerStabMode
)
```

| 属性 | 说明 |
|------|------|
| `offset` | 镜头偏移量字符串，用于防抖计算 |
| `preferredStabMode` | 首选防抖模式 |

---

### RenderModelParam

渲染行为综合配置参数。

```kotlin
data class RenderModelParam(
    val imageLayout: ImageLayout = ImageLayout.Respective2Images,
    val renderType: DisplayType = DisplayType.PlaneStitch,
    val stabMode: StabilizerStabMode = StabilizerStabMode.Still,
    val offset: String,
    val colorFusion: Boolean
)
```

---

### RenderView

```kotlin
data class RenderView(val width: Int, val height: Int)
```

渲染视图尺寸（像素）。

---

### VideoClipInfo

指定一段视频的来源与播放区间。`inputUrl` 与 `wrapper` 二选一，同时设置时 `wrapper` 优先。

```kotlin
data class VideoClipInfo(
    val inputUrl: String?,     // 文件路径（file:/// 或绝对路径），与 wrapper 二选一
    val wrapper: WorkWrapper?, // 优先于 inputUrl
    val startTimeMs: Int,      // 起始位置（毫秒）
    val endTimeMs: Int         // 结束位置（毫秒）
)
```

---

## 8. 公共数据类型

以下类型在 Media 和 Camera 模块之间存在关联，此处一并列出。

### KMPCameraPreviewPipeline

来自 `verticalCommon`，在 Camera 和 Media 侧均有使用：

- Camera 侧：`CameraPreview.setPipeline(pipeline)` — 将管线注入相机预览
- Media 侧：`PreviewPlayer.getPipeline()` — 获取当前渲染管线

管线对象由媒体侧创建后传入相机侧，作为预览数据的传输通道。

---

### PreviewStreamParamsUpdate（Camera → Media）

相机预览流参数变化时，通过 `CameraStreamListener.onParamsChanged()` 回调此对象。  
媒体侧通常基于此对象中的数据调用 `PreviewPlayer.setOffset()` 和 `setWindowCropInfo()` 进行同步更新。

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

详见 Camera API 文档 [§4 实时预览](../camera-api/#_4-实时预览)。
