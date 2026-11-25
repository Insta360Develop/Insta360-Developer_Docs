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

素材管理入口单例，实现 `WorkOperations` 接口。

```kotlin
object WorkManager : WorkOperations
```

### WorkOperations

```kotlin
interface WorkOperations
```

| 方法 | 形式 | 说明 |
|------|------|------|
| `getAllCameraWorks(): Result<List<WorkWrapper>>` | 协程 | 从相机获取所有素材列表 |
| `getAllLocalWorks(): List<WorkWrapper>` | 同步 | 获取本地所有素材列表 |

---

### IWorkWrapper

素材包装对象，封装单次拍摄结果（可能包含多个文件，如全景视频的前后镜头）的元数据访问、类型判断、缩略图加载及文件操作能力。

```kotlin
interface IWorkWrapper
```

**URL 属性**

| 属性 | 说明 |
|------|------|
| `allUrls: Array<String>` | 所有相关文件的 URL（含主文件、LRV 等） |
| `mainUrls: Array<String>` | 主文件（高分辨率原始文件）URL |
| `rawUrls: Array<String>` | RAW 格式文件 URL |
| `lrvUrls: Array<String>` | 低分辨率预览文件（LRV）URL |

**元数据**

| 方法 | 参数 | 说明 |
|------|------|------|
| `loadExtraData(index)` | index 默认 0 | 加载额外元数据（陀螺仪、曝光数据等），加载成功返回 true |
| `getCount()` | — | 文件段数量（多段视频时大于 1） |
| `isExtraDataLoaded(index)` | index 默认 0 | 指定片段的额外元数据是否已加载 |
| `loadThumbnail(index)` | index 默认 0 | 加载缩略图，失败返回 null |
| `getIdenticalKey(index)` | index 默认 0 | 文件唯一标识键 |
| `getWidth(index)` / `getHeight(index)` | index 默认 0 | 宽 / 高（像素） |
| `getBitrate(index)` | index 默认 0 | 码率（bps） |
| `getFps(index)` | index 默认 0 | 帧率 |
| `getCreationTime(index)` | index 默认 0 | 创建时间（毫秒时间戳） |
| `getFirstFrameTimeOffset(index)` | index 默认 0 | 第一帧的时间偏移（毫秒） |
| `getRollingShutterTime(index)` | index 默认 0 | 滚动快门时间（秒） |
| `getDurationInMs(index)` | index 默认 0 | 单段时长（毫秒） |
| `getTotalDurationInMs()` | — | 所有文件段的总时长（毫秒） |
| `getFileSize()` | — | 文件总大小（字节） |
| `getCameraType()` | — | 拍摄此文件的相机型号字符串 |
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
| `isBulletTime()` | 子弹时间（Bullet Time） |
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
| `supportPureShotGenerate()` | 是否支持 PureShot 合成 |
| `supportHdrGenerate()` | 是否支持 HDR 合成 |

**文件操作**

| 方法 | 形式 | 说明 |
|------|------|------|
| `download(progressCallback?)` | 协程 | 下载到本地，返回本地文件路径列表；`progressCallback` 参数为 `(总大小, 已下载大小)`（字节） |
| `delete()` | 协程 | 从相机删除此文件 |

---

### WorkWrapper

`IWorkWrapper` 的抽象基类，实现 `Comparable<WorkWrapper>`。子类根据文件来源（相机/本地）提供具体实现。

```kotlin
abstract class WorkWrapper(
    val httpPrefix: String = "",
    val downloadHttpPrefix: String = httpPrefix
) : IWorkWrapper, Comparable<WorkWrapper>
```

| 属性 | 说明 |
|------|------|
| `httpPrefix` | 文件服务器的 HTTP 前缀地址（相机文件使用）。供需要直接访问相机的消费方使用，Wi-Fi Aware 连接下为裸 IPv6 地址 |
| `downloadHttpPrefix` | 下载素材时应使用的前缀（SDK 内部下载使用）。Wi-Fi Aware 连接下为占位 hostname（配合动态 DNS 解析），避免裸 IPv6 地址的 zone id 语法被 OkHttp 拒绝解析；其余连接类型下与 `httpPrefix` 相同 |

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
| `timestamp` | 数据时间戳（毫秒） |

---

### ExposureData

单帧曝光数据。

```kotlin
data class ExposureData(val shutterSpeeds: Double, val timestamp: Long)
```

| 属性 | 说明 |
|------|------|
| `shutterSpeeds` | 快门速度（秒） |
| `timestamp` | 数据时间戳（毫秒） |

**解析原生数据**

```kotlin
ExposureData.byteArray2ExposureData(bytes: ByteArray?, stride: Int): List<ExposureData>
```

将原生曝光数据字节流按固定步长解析为 `ExposureData` 列表。`bytes` 为 null 或长度不足一个 `stride` 时返回空列表，`stride` 为单帧数据占用的字节数。

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
| `stitchSeparatedFisheye(workWrapper, outputFilePath): Result<Unit>` | 自动识别素材中需要拼接的部分并执行鱼眼拼接 |
| `stitchSeparatedFisheye(templateBlenderParams): Result<Unit>` | 将两张鱼眼图片拼接为全景图 |
| `generateHDR(workWrapper, outputFilePath): Result<Unit>` | HDR 合成 |
| `generatePureShot(workWrapper, outputFilePath, algoFolderPath): Result<Unit>` | PureShot 合成，`algoFolderPath` 为算法模型所在目录路径 |

> 以上四个方法均为协程挂起函数。

---

### TemplateBlenderParams

两张鱼眼图的拼接参数。

```kotlin
class TemplateBlenderParams(
    val inputFilePath1: String,   // 第一张鱼眼图的本地文件路径
    val inputFilePath2: String,   // 第二张鱼眼图的本地文件路径
    val outputFilePath: String,   // 拼接结果的输出路径
)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isColorAdjustment` | Boolean | false | 是否启用色彩校正 |
| `blendAngle` | Float | 8f | 混合区域角度（度） |
| `mapSizeWidth` | Int | 200 | 映射贴图宽度 |
| `mapSizeHeight` | Int | 100 | 映射贴图高度 |
| `fisheyeArrangement` | `FisheyeArrangement` | SEPERATED | 两张鱼眼图的排列方式 |

### FisheyeArrangement

| 枚举值 | nativeValue | 说明 |
|--------|-------------|------|
| `CONNECTED` | 0 | 水平相连（左右拼接） |
| `VCONNECTED` | 1 | 垂直相连（上下拼接） |
| `SEPERATED` | 2 | 分离（两张独立图片） |

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
| `exportVideoToImage(imageExportParams, callback)` | 将视频中的指定帧导出为图片（通过 `ImageExportParams.timestampList` 指定帧时间戳） |
| `stopExport(exportId: Int)` | 取消指定导出任务（`exportId` 由 `IExportCallback.onStart` 提供） |

---

### IExportCallback

导出任务回调接口。

```kotlin
interface IExportCallback
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onStart(id: Int)` | id：任务 ID | 导出任务开始，可用于取消任务 |
| `onSuccess()` | — | 导出成功 |
| `onFail(throwable: Throwable)` | throwable：失败原因 | 导出失败 |
| `onCancel()` | — | 导出被取消 |
| `onProgress(progress: Float)` | progress：0.0–1.0 | 导出进度（默认空实现） |

---

### ExportParams

导出通用参数配置类，所有导出参数类均继承此类。

```kotlin
open class ExportParams(workWrapper: WorkWrapper) : MediaParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `exportMode` | `ExportMode` | PANORAMA | 导出模式（全景/球形） |
| `targetPath` | String? | null | 导出目标文件路径，null 表示使用默认路径 |
| `isUseSoftwareDecoder` | Boolean | false | 是否使用软件解码器 |
| `width` / `height` | Int | -1 | 导出分辨率（-1 表示使用默认值） |
| `isDenoise` | Boolean | false | 是否启用降噪 |
| `distance` | Float | 0f | 观看距离（0 表示使用默认值） |
| `fov` | Float | 0f | 视场角（度，0 表示使用默认值） |
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
| `isUseSoftwareEncoder` | Boolean | false | 是否使用软件编码器（默认使用硬件编码器） |
| `bitrate` | Int | -1 | 目标码率（bps，-1 使用默认值） |
| `fps` | Int | -1 | 目标帧率（-1 使用默认值） |
| `roll` | Float | 0f | 视频画面翻滚角（度） |

---

### ImageExportParams

图片导出参数。

```kotlin
class ImageExportParams(workWrapper: WorkWrapper) : ExportParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `index` | Int | 0 | 要导出的帧索引 |
| `timestampList` | `List<Double>` | emptyList | 指定导出帧的时间戳列表（秒）；为空时使用 `index` |

---

## 4. 播放器

### 播放器继承关系

```
BasePlayer
├── VideoPlayer   (: StreamPlayer, BasePlayer, LocalPlayer)
├── ImagePlayer   (: BasePlayer, LocalPlayer)
└── PreviewPlayer (: StreamPlayer, BasePlayer)

StreamPlayer   — pause / resume / isPlaying
LocalPlayer    — 标记接口，标识支持本地文件播放
```

---

### BasePlayer

所有播放器（视频、图片、预览）的基础接口。

```kotlin
interface BasePlayer
```

**播放控制**

| 方法 | 说明 |
|------|------|
| `play()` | 开始播放 |
| `isLoading(): Boolean` | 是否正在加载 |
| `isPrepared(): Boolean` | 是否已完成准备（可以播放） |
| `destroy()` | 销毁播放器，释放所有相关资源 |

**手势控制**

| 方法 | 说明 |
|------|------|
| `setGestureEnabled(enabled)` / `isGestureEnabled(): Boolean` | 手势交互总开关 |
| `setGestureHorizontalEnabled(enabled)` / `isGestureHorizontalEnabled(): Boolean` | 水平方向手势（左右滑动旋转视角） |
| `setGestureVerticalEnabled(enabled)` / `isGestureVerticalEnabled(): Boolean` | 垂直方向手势（上下滑动旋转视角） |
| `setGestureZoomEnabled(enabled)` / `isGestureZoomEnabled(): Boolean` | 缩放手势（双指捏合缩放 FOV） |
| `setGestureListener(listener: PlayerGestureListener?)` | 设置手势事件监听器，传 null 表示移除 |

**镜头模式**

| 方法 | 说明 |
|------|------|
| `switchNormalMode()` | 切换到普通（平面）模式 |
| `switchFisheyeMode()` | 切换到鱼眼模式 |
| `switchPerspectiveMode()` | 切换到透视模式 |

**视野控制**

| 方法 | 说明 |
|------|------|
| `setConstraint(widthRatio, heightRatio, minFov, maxFov, defaultFov, minDistance, maxDistance, defaultDistance)` | 设置视野约束参数：`widthRatio` / `heightRatio` 为宽高比分量，-1 表示不限制；其余为 FOV 与观看距离的最小/最大/默认值 |
| `getFov(): Float` | 当前视场角（度） |
| `getDistance(): Float` | 当前观看距离 |
| `getYaw(): Float` | 当前偏航角（Yaw，弧度制） |
| `getPitch(): Float` | 当前俯仰角（Pitch，弧度制） |
| `getRoll(): Float` | 当前翻滚角（Roll，弧度制） |

**渲染设置**

| 方法 | 说明 |
|------|------|
| `setScreenRatio(ratioX, ratioY)` | 设置渲染视图宽高比 |
| `getScreenRatio(): Pair<Int, Int>` | 获取当前宽高比（宽, 高） |
| `setStabType(type: StabType)` / `getStabType(): StabType` | 防抖类型 |
| `setOffsetType(type: OffsetType)` / `getOffsetType(): OffsetType` | 镜头偏移类型（保护镜/潜水壳等配件） |
| `setColorFusionEnabled(enabled)` / `isColorFusionEnabled(): Boolean` | 色彩融合（消色差） |
| `setDynamicStitchEnabled(enabled)` / `isDynamicStitchEnabled(): Boolean` | 动态拼接 |
| `setColorPlusEnabled(enabled)` / `isColorPlusEnabled(): Boolean` | 色彩增强（ColorPlus） |
| `setColorPlusFilterIntensity(intensity)` / `getColorPlusFilterIntensity(): Float` | 色彩增强滤镜强度（通常 0.0–1.0） |
| `setDePurpleFilterEnable(enabled)` / `getDePurpleFilterEnable(): Boolean` | 去紫边滤镜 |
| `setListener(listener: PlayerViewListener?)` | 设置播放器视图事件监听器，传 null 表示移除 |

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

视频播放器，在 `StreamPlayer`、`BasePlayer` 与 `LocalPlayer` 基础上扩展了视频播放控制、进度跳转、循环设置、音量控制及 LRV 低分辨率预览能力。

```kotlin
interface VideoPlayer : StreamPlayer, BasePlayer, LocalPlayer
```

| 方法 | 说明 |
|------|------|
| `prepare(params: VideoPlayerParams)` | 初始化并准备视频播放器 |
| `setVideoStatusListener(listener: VideoStatusListener?)` | 设置视频播放状态监听器，传 null 表示移除 |
| `seekTo(position: Long)` | 跳转到指定播放位置（毫秒） |
| `isSeeking(): Boolean` | 是否正在执行 seek 操作 |
| `getCurrentPosition(): Long` | 当前播放位置（毫秒） |
| `getDuration(): Long` | 视频总时长（毫秒） |
| `isLooping(): Boolean` / `setLooping(isLooping: Boolean)` | 是否循环播放 |
| `setVolume(volume: Float)` | 设置播放音量（0.0 静音 – 1.0 最大） |
| `setLrvEnable(enabled: Boolean)` / `isLrvEnable(): Boolean` | 是否启用低分辨率预览（LRV） |

---

### ImagePlayer

图片播放器，提供全景图片的加载与显示能力。

```kotlin
interface ImagePlayer : BasePlayer, LocalPlayer
```

| 方法 | 说明 |
|------|------|
| `prepare(params: ImagePlayerParams)` | 初始化并准备图片播放器 |

---

### LocalPlayer

本地文件播放器标记接口，用于标识支持本地文件播放的播放器（`VideoPlayer`、`ImagePlayer`），与流式播放器（`StreamPlayer`）区分。

```kotlin
interface LocalPlayer
```

---

### PreviewPlayer

相机预览播放器，在 `StreamPlayer` 与 `BasePlayer` 基础上扩展了预览流初始化、分辨率/帧率设置、裁剪信息更新及旋转检测能力。

```kotlin
interface PreviewPlayer : StreamPlayer, BasePlayer
```

| 方法 | 说明 |
|------|------|
| `prepare(params: PreviewParams)` | 初始化并准备预览播放器 |
| `destroyRender()` | 销毁渲染器；重启播放器之前必须先调用 |
| `setPreviewResolution(width, height)` | 设置预览分辨率（像素） |
| `setFps(fps: Int)` | 设置预览帧率 |
| `getPreviewWidth(): Int` / `getPreviewHeight(): Int` | 当前预览宽高（像素） |
| `getFps(): Int` | 当前预览帧率 |
| ~~`setOffset(offsetData, stabOffset)`~~ | 已废弃：空实现，调用只打印警告、不产生效果；播放器自 `prepare()` 起已持有权威标定 |
| `setWindowCropInfo(cropInfo: WindowCropInfo)` | 设置窗口裁剪信息（用于全景拼接）；裁剪窗变化时播放器按实时标定自行重算偏移 |
| `getWindowCropInfo(): WindowCropInfo?` | 获取当前窗口裁剪信息，未设置时返回 null |
| `showPlayView()` / `hidePlayView()` | 显示 / 隐藏播放视图 |
| `getPipeline(): KMPCameraPreviewPipeline?` | 获取当前预览渲染管线，未初始化时返回 null |
| `updateRotate(rotateDegreeContent, rotateDegree, cameraPosture, cameraPostureCorrected)` | 更新预览画面旋转角度（内容旋转角度、整体旋转角度、相机姿态值、校正后的相机姿态值） |
| `redetectCameraRotation()` | 重新检测相机旋转方向 |

---

## 5. 播放器参数

### MediaParams

所有媒体参数类的公共基类，持有素材包装对象供各子类派生播放、导出参数。

```kotlin
open class MediaParams(val workWrapper: WorkWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `workWrapper` | `WorkWrapper` | — | 关联的素材包装对象（构造参数） |
| `isDePurpleFilterOn` | Boolean | false | 去紫边 |
| `isColorFusion` | Boolean | false | 消色差 |
| `isDynamicStitch` | Boolean | true | 动态拼接 |
| `stabType` | `StabType` | AUTO | 防抖类型 |
| `offsetType` | `OffsetType` | ORIGINAL | 保护镜拼接（镜头偏移类型） |
| `screenRatio` | IntArray | [-1, -1] | 宽高比例（-1 表示不限制） |
| `colorPlusEnable` | Boolean | false | 色彩增强开关 |
| `colorPlusFilterIntensity` | Float | 1.0f | 色彩增强强度 |
| `urlForAction` | String | "" | 用于播放或导出的 URL |

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
| `isWithSwitchingAnimation` | Boolean | false | 切换镜头模式时是否带动画 |

---

### VideoPlayerParams

视频播放器参数，继承 `PlayerParams`。

```kotlin
class VideoPlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loadingImageResId` | Int | -1 | 加载中占位图资源 ID（-1 表示不使用） |
| `loadingBackgroundColor` | Int | 黑色 | 加载中背景色（ARGB 整数） |
| `isAutoPlayAfterPrepared` | Boolean | true | 准备完成后是否自动播放 |
| `isLooping` | Boolean | true | 是否循环播放 |
| `isLrvEnable` | Boolean | false | 是否启用低分辨率预览（LRV） |
| `isVideoHwaccelEnabled` | Boolean | true | 是否启用视频硬件解码加速 |

---

### ImagePlayerParams

图片播放器参数，继承 `PlayerParams`。

```kotlin
class ImagePlayerParams(workWrapper: WorkWrapper) : PlayerParams(workWrapper)
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `index` | Int | 0 | 要显示的图片帧索引 |

---

### PreviewParams

相机预览参数配置。

```kotlin
data class PreviewParams(
    var width: Int = -1,
    var height: Int = -1,
    var fps: Int = -1,
    var screenRatio: Pair<Int, Int> = -1 to -1,
    var stabType: StabType? = null,
    var isGestureEnabled: Boolean = true,
    var isCopyVideoHwaccel: Boolean = true,
    var isVideoHwaccelEnabled: Boolean = true,
    var isColorFusion: Boolean = true,
    var stabCacheFrameNum: Int = -1,
    var isOnlyStitchSurfaceRender: Boolean = false,
    var renderModel: RenderModel? = null,
    var isRenderAtOnce: Boolean = false,
    var cameraRenderSurface: KMPSurface? = null,
    var cameraRenderSurfaceWidth: Int = -1,
    var cameraRenderSurfaceHeight: Int = -1,
)
```

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `width` / `height` | -1 | 预览分辨率（-1 表示使用默认值） |
| `fps` | -1 | 预览帧率（-1 表示使用默认值） |
| `screenRatio` | -1 to -1 | 渲染视图宽高比（-1 to -1 表示不限制） |
| `stabType` | null | 防抖类型（null 表示使用默认值） |
| `isGestureEnabled` | true | 是否启用手势交互 |
| `isCopyVideoHwaccel` | true | 是否使用硬件加速复制视频帧 |
| `isVideoHwaccelEnabled` | true | 是否启用视频硬件解码加速 |
| `isColorFusion` | true | 是否启用色彩融合（消色差） |
| `stabCacheFrameNum` | -1 | 防抖缓存帧数（-1 表示使用默认值） |
| `isOnlyStitchSurfaceRender` | false | 是否仅渲染到指定 Surface 而不显示在 View 上 |
| `renderModel` | null | 渲染模式（null 表示使用默认值） |
| `isRenderAtOnce` | false | 是否立即开始渲染（不等待第一帧） |
| `cameraRenderSurface` | null | 指定渲染目标 Surface（null 表示渲染到默认 View） |
| `cameraRenderSurfaceWidth` / `cameraRenderSurfaceHeight` | -1 | 指定渲染 Surface 的宽高（像素，-1 表示使用默认值） |

---

## 6. 播放器监听器

### VideoStatusListener

视频播放状态回调，通过 `VideoPlayer.setVideoStatusListener()` 设置。

```kotlin
interface VideoStatusListener
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onProgressChanged(position, length)` | 当前播放位置 / 视频总时长（毫秒） | 播放进度变化 |
| `onPlayStateChanged(isPlaying)` | isPlaying：是否正在播放 | 播放/暂停状态变化 |
| `onSeekComplete()` | — | seek 操作完成 |
| `onComplete()` | — | 播放完成 |
| `onPlayingFluencyResult(fluentFactor, srcTime, detectTime)` | fluentFactor：流畅系数；srcTime：源时间；detectTime：检测时间 | 播放流畅度检测结果，每隔 1 秒检测一次；`fluentFactor` 正常检测返回 [0,1]，[0.65,1] 表示流畅，-1 表示检测失败；默认空实现 |

---

### PlayerViewListener

播放器视图事件回调，通过 `BasePlayer.setListener()` 设置。

```kotlin
interface PlayerViewListener
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onLoadingStatusChanged(isLoading)` | isLoading：是否正在加载 | 加载状态变化 |
| `onLoadingFinish()` | — | 加载完成 |
| `onFail(exception: InstaException)` | exception：错误详情 | 发生错误 |
| `onFirstFrameRendered()` | — | 第一帧渲染完成 |
| `onReleaseCameraPipeline()` | — | 相机预览管线释放 |
| `isPanoLive(): Boolean` | — | 查询当前直播画面是否为全景直播；由接入方按直播实际类型覆写，默认返回 false |

---

### PlayerGestureListener

播放器手势事件监听，通过 `BasePlayer.setGestureListener()` 设置。所有方法均提供默认空实现，按需覆写。

```kotlin
interface PlayerGestureListener
```

| 回调 | 说明 |
|------|------|
| `onDown(event): Boolean` | 手指按下，返回 true 表示消费此事件 |
| `onTap(event): Boolean` | 单击，返回 true 表示消费此事件 |
| `onUp()` | 手指抬起 |
| `onLongPress(event)` | 长按 |
| `onZoom()` | 缩放手势开始 |
| `onZoomAnimation()` | 缩放动画进行中 |
| `onZoomAnimationEnd()` | 缩放动画结束 |
| `onScroll()` | 滑动手势 |
| `onFlingAnimation()` | 快速滑动（fling）动画进行中 |
| `onFlingAnimationEnd()` | 快速滑动动画结束 |

---

### PlayerListener

播放器通用事件监听接口。

```kotlin
interface PlayerListener
```

| 回调 | 参数 | 说明 |
|------|------|------|
| `onPlayPaused()` | — | 播放暂停 |
| `onError(code, message)` | code：错误码；message：错误描述 | 播放发生错误 |
| `onProgressUpdate(positionMs, durationMs)` | positionMs：当前播放位置；durationMs：媒体总时长（毫秒） | 播放进度更新 |

---

## 7. 渲染配置与枚举

### ExportMode

导出模式，决定导出时的画面投影方式。

| 枚举值 | 说明 |
|--------|------|
| `PANORAMA` | 全景平面投影（等距柱状投影） |
| `SPHERE` | 球形投影 |

---

### OffsetType

镜头偏移类型（配件拼接偏移）。用于在播放或导出时指定相机所佩戴的配件类型，以应用对应的镜头畸变校正参数。

| 枚举值 | value | 说明 |
|--------|-------|------|
| `ORIGINAL` | 0 | 无配件，使用原始偏移 |
| `PROTECTOR_FASTEN` | 1 | 卡扣式保护镜拼接 |
| `DIVING_WATER` | 2 | 潜水壳水下（旧版） |
| `DIVING_AIR` | 3 | 潜水壳水上（旧版） |
| `WATERPROOF` | 4 | 防水壳 |
| `PROTECTOR_ADHERE` | 5 | 黏贴式保护镜拼接 |
| `DIVING_INVISIBLE_WATER` | 6 | 隐形潜水壳水下（全隐形潜水壳） |
| `DIVING_INVISIBLE_AIR` | 7 | 隐形潜水壳水上（全隐形潜水壳） |
| `PROTECTOR_A` | 8 | 保护镜 A 级（塑料），目前仅 X3、X4 支持 |
| `PROTECTOR_S` | 9 | 保护镜 S 级（玻璃），目前仅 X3、X4 支持 |
| `PROTECTOR_AS_AVERAGE` | 10 | A/S 平均保护镜（使用 A 级和 S 级综合平均畸变曲线，相当于虚拟保护镜） |

---

### StabType

防抖算法类型，用于在播放器或导出时指定使用的防抖策略。

| 枚举值 | nativeValue | 说明 |
|--------|-------------|------|
| `AUTO` | -99 | 自动选择最优防抖算法 |
| `STAB_OFF` | -1 | 关闭防抖 |
| `STAB_STILL` | 0 | 全防模式：视点锁定一个绝对方向，yaw/pitch/roll 均不改变 |
| `STAB_Z_DIRECTIONAL` | 1 | Z 轴防抖：yaw 跟随，pitch、roll 锁定；仅用于全景素材 |
| `STAB_FULL_DIRECTIONAL` | 2 | 水平校准防抖：yaw、pitch 跟随，roll 锁定；仅用于全景素材 |
| `STAB_FREE_FOOTAGE` | 4 | 运动平滑防抖：yaw、pitch、roll 均随视点移动，但经过 FlowState 平滑处理，可用于非全景素材 |

> `StabType.nativeOf(value: Int?): StabType` — 根据底层原始值查找对应的枚举值，未匹配时返回 `AUTO`。

---

### RenderModel

渲染模式，决定全景画面在预览、播放时的投影方式。

| 枚举值 | nativeValue | 说明 |
|--------|-------------|------|
| `PLANE_STITCH` | 11 | 画面分割渲染：将两路视频流融合在一起，把整体预览画面平铺到一个平面上 |
| `PLANE` | 20 | 画面分割渲染：将画面分为两部分，以鱼眼的形式分别显示两路视频流 |
| `AUTO` | 0 | 画面融合渲染：将两路视频流融合在一起，形成一个整体的预览画面 |

---

### DisplayType

视频/图像渲染显示类型。

| 枚举值 | rawValue |
|--------|----------|
| `Auto` | 0 |
| `SphereAuto` | 1 |
| `SphereStitch` | 2 |
| `SphereEquirectangular` | 3 |
| `SphereFisheyeDewarp` | 4 |
| `CubeTileProjection` | 5 |
| `SphereCubemap` | 6 |
| `PlaneCubemap2Equi` | 7 |
| `PlaneCubeTile2Equi` | 8 |
| `PlaneAuto` | 10 |
| `PlaneStitch` | 11 |
| `PlaneEquirectangular` | 12 |
| `PlaneFisheyeDewarp` | 13 |
| `Plane` | 20 |

---

### OpticalFlowType

光流算法类型。

| 枚举值 | rawValue | 说明 |
|--------|----------|------|
| `DynamicStitch` | 0 | 动态拼接 |
| `Disflow` | 1 | Disflow 光流算法 |
| `AiFlow` | 2 | AI 光流算法 |

---

### ImageLayout

图像布局方式。

| 枚举值 | rawValue | 说明 |
|--------|----------|------|
| `HorizontalMerged` | 0 | 水平合并 |
| `OneBulletTime` | 1 | 子弹时间单帧 |
| `Respective2Images` | 2 | 两张独立图像 |
| `LeftHalf` | 3 | 左半 |
| `RightHalf` | 4 | 右半 |
| `TopHalf` | 5 | 上半 |
| `BottomHalf` | 6 | 下半 |
| `LeftRight` | 7 | 左右分屏 |
| `TopBottom` | 8 | 上下分屏 |

---

### ProtectOffsetConvertOption

保护镜配件类型，位标志枚举，可按位或组合。

| 枚举值 | rawValue |
|--------|----------|
| `None` | 0 |
| `EnableWaterProof` | 1 shl 0 |
| `EnableDivingAir` | 1 shl 1 |
| `EnableDivingWater` | 1 shl 2 |
| `EnableDivingAirV2` | 1 shl 3 |
| `EnableDivingWaterV2` | 1 shl 4 |
| `EnableBuckleShell` | 1 shl 5 |
| `EnableAdhesiveShell` | 1 shl 6 |
| `EnableGlassShell` | 1 shl 7 |
| `EnablePlasticCement` | 1 shl 8 |
| `EnableAverageShell` | 1 shl 9 |
| `EnableNDFilter` | 1 shl 10 |
| `EnableDivingWaterPro` | 1 shl 11 |
| `EnableDivingAirPro` | 1 shl 12 |

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
    val wrapper: WorkWrapper?, // 媒体文件包装器，优先级更高
    val startTimeMs: Int,      // 片段起始位置（毫秒）
    val endTimeMs: Int         // 片段结束位置（毫秒）
)
```

---

## 8. 公共数据类型

以下类型由 Camera SDK 与 Media SDK 共用，此处一并列出。

### KMPCameraPreviewPipeline

在 Camera SDK 与 Media SDK 中均有使用：

- Camera SDK：`CameraPreview.setPipeline(pipeline)` — 将管线注入相机预览
- Media SDK：`PreviewPlayer.getPipeline()` — 获取当前渲染管线

管线对象由 Media SDK 侧创建后传入相机侧，作为预览数据的传输通道。

---

### PreviewStreamParamsUpdate（Camera → Media）

相机预览流参数变化时，通过 `CameraStreamListener.onParamsChanged()` 回调此对象。媒体侧的 `PreviewPlayer.setWindowCropInfo()` 通常基于此对象中的裁剪窗进行更新；`offsetData` 与 `stabOffset` 由播放器按相机配置自行维护，对应的 `setOffset()` 已废弃为空实现。

---

### ModelManager

模型管理入口，当前版本无公开成员。

```kotlin
object ModelManager
```
