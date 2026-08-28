# Media SDK 接口文档

## 概述

InsMediaSDK 提供 Insta360 全景相机素材的拼接和处理能力，支持图片拼接、视频拼接及实时拼接。目前支持的机型有 ONE X、ONE R/RS（普通鱼眼和一英寸鱼眼）、ONE X2、X3、X4、X4 Air、X5、X6等相机的全景素材，支持视频导出和图片导出。支持平台主要是 Windows 和 Ubuntu 22.04。

SDK 以动态库（.dll / .so）形式提供，配套两个示例程序：

- **MediaSDKTest** — 离线拼接测试（支持视频/图片/批量）
- **RealTimeStitcherSDKTest** — 实时拼接测试

具体接口的使用可以参考 SDK 中 `example/main.cc`。

### 注意事项

> SDK 中要求所有文件路径字符编码都是 UTF-8 编码。

> 使用 NVIDIA 显卡时驱动版本需 ≥ 470。

> 不支持在 Windows 下的 WSL 的 Ubuntu 系统测试。

---

## 平台支持

| 平台 | 架构 | 构建工具 | 依赖 |
|------|------|----------|------|
| Windows 10+ | x64 | Visual Studio 2019 | CUDA 10.2、Conan 2 |
| Ubuntu 22.04 | x64 | GCC 11+ | CUDA 11.7、Conan 2 |

---

## 快速开始

### Windows

```
SDKRelease/MediaSDK/MediaSDK-<version>-<date>-win64/
├── bin/
│   ├── MediaSDK.dll              # SDK 动态库
│   ├── MediaSDKTest.exe          # 离线拼接测试程序
│   ├── RealTimeStitcherSDKTest.exe
│   ├── CameraSDK.dll             # 相机连接库（实时拼接需要）
│   ├── models/                   # 算法模型文件（必须）
│   └── *.dll                     # 运行时依赖库（opencv/cuda/VC++运行库等）
├── lib/
│   └── MediaSDK.lib              # 开发链接库
├── include/stitcher/
│   ├── ins_common.h
│   ├── ins_stitcher.h
│   └── ins_realtime_stitcher.h
└── example/
    ├── main.cc                   # MediaSDKTest 源码
    └── realtime_stitcher_demo.cc # RealTimeStitcherSDKTest 源码
```

### Linux

交付压缩包 `MediaSDK-<version>-<date>-linux64.tar.gz`：
```
MediaSDK-<version>-<date>-linux64/
├── MediaSDK-<version>-linux-amd64.deb   # 单个自包含安装包
├── include/
│   ├── ins_common.h
│   ├── ins_stitcher.h
│   └── ins_realtime_stitcher.h
├── example/
│   ├── main.cc
│   └── realtime_stitcher_demo.cc
└── README.txt
```

`sudo dpkg -i` 后全部装进一个目录（结构同 Windows 分发包）：
```
/opt/MediaSDK-<version>-linux/
├── bin/     MediaSDKTest、RealTimeStitcherSDKTest、models/
├── lib/     libMediaSDK.so + 运行时依赖（cuda/cudnn/opencv/...）
├── include/ ins_common.h、ins_stitcher.h、ins_realtime_stitcher.h
└── example/ main.cc、realtime_stitcher_demo.cc
```

> 集成文档（本指南）改为线上提供，不再随包分发，请以线上最新版本为准。

---

## API 参考

SDK 提供三个公开头文件，位于 `include/`（Windows 包内为 `include/stitcher/`）：

### 核心 API 一览

| 类 / 函数 | 头文件 | 说明 |
|-----------|--------|------|
| `VideoStitcher` | `ins_stitcher.h` | 视频离线拼接（导出） |
| `ImageStitcher` | `ins_stitcher.h` | 图片离线拼接（DNG/JPEG/INSP 等格式） |
| `RealTimeStitcher` | `ins_realtime_stitcher.h` | 实时拼接（预览/直播场景） |
| `ins::InitEnv()` | `ins_common.h` | SDK 初始化（使用前必须调用，无论是否使用 CUDA） |
| `GetMediaFileInfo()` | `ins_common.h` | 拼接前查询素材信息（分辨率/帧率/码率/时长等） |
| `GetVersion()` / `GetVersionMajor()` | `ins_common.h` | 查询当前 SDK 版本 |

### 初始化

SDK 使用前必须先调用 `InitEnv()`，再设置模型目录：

```cpp
#include <ins_stitcher.h>

int main() {
    ins::SetLogLevel(ins::InsLogLevel::ERR);   // 可选：日志打印等级
    ins::InitEnv();                            // 必须：初始化运行时（GPU 上下文/线程池等）
    ins::SetModelFileRootDir("./models/");     // 模型目录（末尾需带分隔符），AI 拼接/ColorPlus/降噪等需要
    // ... 创建 VideoStitcher / ImageStitcher / RealTimeStitcher
}
```

> `SetModelFileRootDir` 自 3.1.0.0 起支持，将 `SDK_DIR/models` 作为参数传入即可，解决了此前需要针对不同相机单独设置各功能 AI 模型路径的繁琐问题（各 `Enable*` 接口自 3.1.0.0 起也不再需要单独传模型路径参数）。

> 可用 `std::string ins::GetVersion()` 获取完整版本号（如 `"3.1.4.1"`），`int ins::GetVersionMajor()` 获取主版本号，均声明于 `ins_common.h`。

---

## 视频拼接（VideoStitcher）与图片拼接（ImageStitcher）

`VideoStitcher`（视频）和 `ImageStitcher`（图片）共用大部分参数设置接口（输入输出路径、分辨率、拼接类型、防抖、调色、保护镜等，见下方「公共参数」），差异主要在拼接流程本身：

- **视频拼接是异步的**：`StartStitch()` 立即返回，进度/完成/错误通过回调上报。
- **图片拼接是同步的**：`Stitch()` 阻塞直到完成，无回调、无码率/编码格式等视频专属参数。

完整可运行示例见 `example/main.cc`。

```cpp
#include <ins_stitcher.h>
#include <mutex>
#include <condition_variable>

// 视频拼接：异步
auto video_stitcher = std::make_shared<ins::VideoStitcher>();
video_stitcher->SetInputPath({"/path/to/video.insv"});
video_stitcher->SetOutputPath("/path/to/output.mp4");
video_stitcher->SetOutputSize(3840, 1920);               // 宽:高必须是 2:1
video_stitcher->SetStitchType(ins::STITCH_TYPE::AIFLOW); // 可选：AI 拼接
video_stitcher->EnableFlowState(true);                   // 可选：防抖

std::mutex m; std::condition_variable cv; bool done = false, err = false;
video_stitcher->SetStitchProgressCallback([&](int progress, int) {
    if (progress == 100) { std::lock_guard<std::mutex> lk(m); done = true; cv.notify_one(); }
});
video_stitcher->SetStitchStateCallback([&](int code, const char* info) {
    { std::lock_guard<std::mutex> lk(m); err = true; } cv.notify_one();
});

video_stitcher->StartStitch();                           // 异步启动，立即返回；启动后不允许再改参数（不生效）

std::unique_lock<std::mutex> lk(m);
cv.wait(lk, [&]{ return done || err; });                 // 等待完成或出错

// 图片拼接：同步
auto image_stitcher = std::make_shared<ins::ImageStitcher>();
image_stitcher->SetInputPath({"/path/to/input.insp"});
image_stitcher->SetOutputPath("/path/to/output.jpg");
image_stitcher->SetOutputSize(3840, 1920);
image_stitcher->Stitch();                                // 同步，返回即完成
```

### 公共参数（VideoStitcher / ImageStitcher 均适用）

#### `void SetInputPath(const std::vector<std::string>& input_paths)`

设置素材输入路径（数组），对视频和照片均生效。

- **视频**：数组最多两个素材文件。**≥5.7K 分辨率的素材需要输入两个素材文件**（X4 / X5 / X4 Air / X6 相机除外——这些机型的双镜头素材保存在同一文件的两个视频轨道里，不管分辨率都只有一个素材文件）。

  ```cpp
  // 双路的 5.7K 素材
  std::vector<std::string> input_path = {"/path/VID_XXX_..._00_XXX.insv",
                                          "/path/VID_XXX_..._10_XXX.insv"};
  // 单路文件素材（含 X4/X5/X4 Air/X6）
  std::vector<std::string> input_path = {"/path/VID_XXX_..._00_XXX.insv"};
  ```

- **图片**：数组可以输入多个（**不能输入 2 个**）。输入 ≥3 个素材时默认视为 HDR 照片并进行 HDR 融合（不要求奇数，也无数量上限）。X4 相机默认拍摄的 HDR 素材已是机内融合好的单文件，不适用此规则。

> 提示：在设置输入路径前，可先用 `bool GetMediaFileInfo(const std::vector<std::string>& file_paths, MediaFileInfo& info)`（`ins_common.h`）查询素材信息（`media_type`、`width`、`height`、`fps`、`bitrate`、`duration_ms`），用于提前校验素材或展示给用户，无需先构造 Stitcher 对象。解析失败返回 `false`。

#### `void SetOutputPath(const std::string& output_path)`

设置导出路径（全路径）。视频以 `.mp4` 结尾，图片以 `.jpg` 结尾。视频设置了 `SetImageSequenceInfo` 时此接口无效（见下方「视频专属参数」）。

#### `void SetOutputSize(int width, int height)`

设置导出分辨率，**width:height 必须是 2:1**。SDK 不会校验此比例，传入非 2:1 分辨率不会报错，但会导致画面变形，请自行保证。

#### 防抖开启：`void EnableFlowState(bool enable)`

设置是否开启普通防抖（FlowState）。

#### 拼接类型：`void SetStitchType(STITCH_TYPE type)`

```cpp
enum class STITCH_TYPE {
    TEMPLATE,       // 模板拼接
    OPTFLOW,        // 光流拼接
    DYNAMICSTITCH,  // 动态光流拼接
    AIFLOW          // AI 拼接
};
```

使用场景：

- **模板拼接**：较老的拼接算法，对近景拼接效果不好，但速度快、性能消耗低。
- **动态拼接**：适合包含近景、有运动和快速变化的场景。
- **光流拼接**：使用场景和动态拼接相同。
- **AI 拼接**：基于影石现有光流拼接技术的优化算法，提供更优的拼接效果。

> 性能消耗及拼接效果：AI 拼接 > 光流拼接 > 动态拼接 > 模板拼接
>
> 拼接速度：模板拼接 > 动态拼接 > 光流拼接 > AI 拼接

> 注意：使用 AI 拼接时必须通过 `SetModelFileRootDir` 指向包含模型的根目录，否则拼接效果不生效。

> 模型文件：`<model_root_dir>/ai_stitcher.ins`（`SetModelFileRootDir` 设置的根目录下，固定文件名，不区分相机型号）。

#### 消色差：`void EnableStitchFusion(bool enable)`

开启消色差功能。产生色差的原因：两个镜头分开曝光，拼接时可能出现明显的亮度差；镜头两侧光照不一致、相机曝光不同时也会造成前后镜头画面亮度差，这种现象在光差比大的场景尤其明显，消色差即用于解决此类问题。（注意：此功能与去紫边是两个不同功能，去紫边见下文 `EnableDefringe`。）

#### 色彩增强：`void EnableColorPlus(bool enable, float strength = 1.0f)`

开启色彩增强功能（AI 功能，依赖模型根目录，3.1.0.0 之后无需单独传模型路径）。`strength` 为增强强度（0~1），VideoStitcher 默认 `1.0f`，ImageStitcher 默认 `0.3f`。

#### 降噪：`void EnableDenoise(bool enable)`

是否开启降噪功能。视频降噪为多帧降噪，通过前后多帧的冗余信息去除视频噪点，效果优于单帧降噪，但比较消耗性能、会减慢导出速度。图片素材的降噪同样依赖模型根目录。

#### 调色功能

| 接口 | 范围 |
|------|------|
| `SetExposure`（曝光） | [-100, 100] |
| `SetHighlights`（高光） | [-100, 100] |
| `SetShadows`（阴影） | [-100, 100] |
| `SetContrast`（对比度） | [-100, 100] |
| `SetBrightness`（亮度） | [-100, 100] |
| `SetBlackpoint`（黑点） | [-100, 100] |
| `SetSaturation`（饱和度） | [-100, 100] |
| `SetVibrance`（自然饱和度） | [-100, 100] |
| `SetWarmth`（色温） | [-100, 100] |
| `SetTint`（色调） | [-100, 100] |
| `SetDefinition`（清晰度） | [0, 100] |

#### 保护镜：`void SetCameraAccessoryType(CameraAccessoryType type)`

如果拍摄时相机佩戴了保护镜，拼接时需同步设置对应类型，否则拼接效果可能不正确。

```cpp
enum class CameraAccessoryType {
    kAutoDetect = -1,         // 根据文件元数据自动检测
    kNormal = 0,
    kWaterproof,              // (one/onex/onex2/oner/oners/onex3) 潜水壳
    kOnerLensGuard,           // (oner/oners) 黏贴式保护镜
    kOnerLensGuardPro,        // (oner/oners) 卡扣式保护镜
    kOnex2LensGuard,          // (oner/oners/onex2/onex3) 黏贴式保护镜
    kOnex2LensGuardPro,       // (onex2) 卡扣式保护镜
    k283PanoLensGuardPro,     // (oner/oners) 283 全景镜头的卡扣式保护镜
    kDiveCaseAir,             // (onex/onex2/oner/oners/onex3) 潜水壳（水上）
    kDiveCaseWater,           // (onex/onex2/oner/oners/onex3) 潜水壳（水下）
    kInvisibleDiveCaseAir,    // X3/X4/X5 全隐形潜水壳（水上）
    kInvisibleDiveCaseWater,  // X3/X4/X5 全隐形潜水壳（水下）
    kLensGuardA,              // X3/X4/X5 A 级塑胶保护镜
    kLensGuardS,              // X3/X4/X5 S 级玻璃保护镜
    kLensGuardAS,             // X3/X4 A/S 级自动检测
    kOnex5ND16,               // X5 ND16 滤镜
    kOnex5ND32,               // X5 ND32 滤镜
    kOnex5ND64,               // X5 ND64 滤镜
    kOner283LensGuardPro,     // (oner/oners) 283 镜头保护镜 Pro
    kOnerLensGuardFpv,        // (oner/oners) 非 283 FPV 镜头黏贴式保护镜
    kOnex4AirDiveCaseAir,     // X4 Air 潜水壳（水上）
    kOnex4AirDiveCaseWater,   // X4 Air 潜水壳（水下）
    kUndetermined = 100,      // 无法确定
};
```

> 商城中的标准保护镜为 A 级，高级保护镜为 S 级。

#### 散热壳检测：`void EnableCoolingShellDetection(bool enable)`

用于检测是否使用了散热壳配件——如果实际使用了散热壳但未在相机界面选择，开启此检测可避免影响拼接效果。这是一个 AI 功能，依赖 `SetModelFileRootDir` 设置的模型根目录（3.1.0.0 之后不再需要单独传模型路径）。

> ⚠️ 仅 X4 Air / X5 / X6 机型支持散热壳检测，其余机型 SDK 会自动跳过该功能（可通过 `GetFeatureStatusMap()` 查询 `"cooling_shell"` 的实际状态）。

---

## 视频专属参数（仅 VideoStitcher）

以下接口仅 `VideoStitcher` 提供，`ImageStitcher` 不适用。

#### `void SetOutputBitRate(int64_t bitRate)`

设置导出码率，单位 bps。不设置则采用原视频码率导出。

> 例如输出 60 Mbps：`bitRate = 60 * 1000 * 1000`（即 `60000000`）。

#### 编码格式：`void EnableH265Encoder(bool enable)`

设置编码格式为 H.265（`enable = true`）或 H.264（`enable = false`，默认）。**输出分辨率大于 4K（宽或高 > 4096）时，H.264 编码器无法使用硬件编码（NVENC 硬编上限 4096），会被 SDK 自动强制降级为软件编码**；此时改用 H.265 才能继续走硬件编码，能显著加快导出速度。详见下方「软硬件编解码」一节。

#### 10bit 导出：`void Enable10BitExport(bool enable)`

设置是否导出 10bit 视频，默认 `false`（8bit）。实际输出位深取决于源素材：仅当源素材本身是 10bit（如 X6 的 10bit 素材）时才会真正输出 10bit；若源素材是 8bit，10bit 导出请求会被静默降级为 8bit（打印 WARNING 日志）。10bit 导出建议配合 `EnableH265Encoder(true)`，因为 H.264 不支持 10bit——若源为 10bit 且此时编码格式仍是 H.264，SDK 会自动将编码格式切换为 H.265。

#### 防抖数据导出：`void SetStabDataOutputPath(const std::string& file_path)`

设置防抖（Stab）数据的导出文件路径。

#### 方向锁定：`void EnableDirectionLock(bool enable)`

开启方向锁定。依赖 `EnableFlowState(true)`：需先开启防抖（FlowState）才能生效，未开启防抖或素材无陀螺仪数据时该功能会被自动跳过。

#### 去紫边：`void EnableDefringe(bool enable)`

消除录制过程中因强光照（室外强光、室内灯光等场景）产生的紫边现象。

> ⚠️ 仅 X4 Air / X5 / X6 机型支持去紫边（X5 与 X6 共用同一模型，X4 Air 使用专属模型），其余机型 SDK 会自动跳过该功能。

#### 去频闪：`void EnableDeflicker(bool enable)`

消除录制过程中因光照产生的屏闪（频闪）问题。

#### 图片序列导出：`void SetImageSequenceInfo(const std::string& output_dir, IMAGE_TYPE image_type)`

将视频原片导出为图像序列，设置导出路径和图片格式。

- `output_dir`：目录级路径（不含文件名），**使用前需确保目标目录已创建**。
- `image_type`：目前支持 `png` 和 `jpg`。
- 输出文件命名为视频帧时间戳（ms），如 `/path/to/dir/100.jpg` 表示 100ms 处的帧。
- 设置了此接口后，`SetOutputPath` 的设置无效。

#### 指定帧导出：`void SetExportFrameSequence(const std::vector<uint64_t>& vec)`

配合 `SetImageSequenceInfo` 使用，只导出指定的视频帧序号（从 0 开始）为图片，文件名即为帧序号，如 `/path/to/dir/10.jpg` 表示序号为 10 的帧。

```cpp
// 从视频中抽取第 0/10/20/30 帧拼接导出成图片
std::vector<uint64_t> seq_nos = {0, 10, 20, 30};
videoStitcher->SetExportFrameSequence(seq_nos);
videoStitcher->SetImageSequenceInfo("/path/to/image_seq_dir", IMAGE_TYPE::JPEG);
videoStitcher->StartStitch();
```

#### 拼接进度回调：`void SetStitchProgressCallback(stitch_process_callback callback)`

```cpp
video_stitcher->SetStitchProgressCallback([&](int process, int error) {
    if (stitch_progress != process) {
        std::cout << "\r" << "process = " << process << "%" << std::flush;
        stitch_progress = process;
    }
    if (stitch_progress == 100) {
        std::cout << std::endl;
        std::unique_lock<std::mutex> lck(mutex_);
        cond_.notify_one();
        is_finished = true;
    }
});
```

#### 拼接错误回调：`void SetStitchStateCallback(stitch_error_callback callback)`

```cpp
video_stitcher->SetStitchStateCallback([&](int error, const char* errinfo) {
    std::cout << "error: " << errinfo << std::endl;
    has_error = true;
    cond_.notify_one();
});
```

用于接收拼接过程中的状态/错误信息。同时建议不要在两个回调中执行耗时操作，会影响拼接速度。图片序列导出（`SetImageSequenceInfo`）走的也是 `VideoStitcher::StartStitch()`，同样使用这两个回调。

#### 开启拼接：`void StartStitch()`

开启拼接流程。**注意：参数必须在调用此接口之前设置完毕；调用之后再设置参数不会生效。**

#### 取消拼接：`bool CancelStitch()`

中断拼接流程。

#### 获取拼接进度：`int GetStitchProgress() const`

获取当前拼接进度。

#### 获取功能运行状态：`std::map<std::string, int> GetFeatureStatusMap() const`

拼接结束后调用，返回本次拼接中各功能的实际运行状态（key 为功能名，如 `"defringe"`、`"cooling_shell"`、`"direction_lock"` 等；value 含义：`-1`=未知，`0`=关闭，`1`=开启，`2`=自动跳过，`3`=失败）。用于确认某个仅特定机型/条件支持的功能（如去紫边、散热壳检测、方向锁定）在本次拼接中是否被 SDK 自动跳过。

---

## 图片专属接口（仅 ImageStitcher）

#### 开启拼接：`bool Stitch()`

同步执行图片拼接，阻塞直到完成。返回值 `true`/`false` 真实反映本次拼接是否成功（内部会解析素材、校验参数、执行拼接，任一步失败即返回 `false`），可直接据此判断结果。

与视频拼接的区别：

- **无回调**：图片拼接不提供、也无需注册 `SetStitchProgressCallback` / `SetStitchStateCallback`——这两个回调接口仅 `VideoStitcher` 提供（见「视频专属参数」一节），`ImageStitcher` 没有进度上报机制，也没有独立的错误回调；调用结束后直接看 `Stitch()` 的返回值即可知道成功与否。
- **无异步等待**：`Stitch()` 返回即代表处理已完成，不需要像视频拼接那样用条件变量等待回调。

---

## 日志功能

### C++ API

| 接口 | 说明 |
|------|------|
| `ins::SetLogLevel(InsLogLevel level)` | 设置 SDK 日志打印等级 |

> `SetLogPath` 接口仍然可用，用于设置日志落盘路径；命令行 demo（`MediaSDKTest`）改用了 `--log_file` 参数控制日志落盘（见下），行为更完善（自动建目录、路径编码兼容中文等）。集成方可直接调用 `SetLogPath`，或参照 `example/main.cc` 中的用法自行实现等价逻辑。

### 命令行（`--debug` / `--log_level` / `--log_file`）

| 参数 | 说明 |
|------|------|
| `--debug` | 打开详细日志（等价 `--log_level verbose`；不加时默认只打 ERROR 级，即 `InsLogLevel::ERR`） |
| `--log_level <级别>` | 精确指定日志打印等级：`verbose` / `info` / `warning` / `error` / `fatal`（大小写不敏感）。写在 `--debug` 之后会覆盖 `--debug` 的设置 |
| `--log_file [路径]` | 把 SDK 日志额外写入文件（值可选，见下方说明） |

**`--log_file` 取值规则**（值可选、目录/文件自适应）：

1. 不写该参数 → 日志不落盘（仍会打印到控制台）。
2. 只写 `--log_file` 不跟值 → 写到 `<exe 所在目录>/logs/` 下，文件名带时间戳。
3. 跟一个目录路径 → 在该目录下生成带时间戳的日志文件。
4. 跟一个文件路径 → 直接写入该文件。

目录不存在时会自动创建。**想在日志文件里看到详细信息，需要同时加 `--debug` 或 `--log_level verbose/info`**（否则文件里也只有 ERROR 级）。

> 路径编码：日志路径按 UTF-8 处理，支持中文路径（Windows 下已修复 `GetModuleFileNameA` 在中文系统路径下的 GBK/UTF-8 编码不一致问题，避免早期版本中文路径下静默崩溃或日志目录乱码的问题）。

---

## 软硬件编解码

| 参数 | 说明 |
|------|------|
| `-enable_soft_encode` / `-enable_soft_decode` | 对应 `SetSoftwareCodecUsage(enable_encoder, enable_decoder)`，分别强制软件编码 / 软件解码 |
| （不设置） | 默认硬件编解码（NVENC/NVDEC） |

导出开始时会打印一行：
```
[Codec] encode=<software|hardware>, decode=<software|hardware>, format=<H264|H265> [(requested by user) | (forced by SDK: ...)]
```
可据此确认实际生效的是软件还是硬件路径，以及是用户主动要求的还是 SDK 自动强制切换的。

### 自动降级 / 自动切换规则

以下几种情况，SDK 会**不需要用户指定任何软/硬编解码参数**、自动做出切换，并在 `[Codec]` 行标注 `(forced by SDK: ...)`：

1. **分辨率 > 4096（宽或高）且编码格式为 H.264 → 强制切换为软件编码。**
   NVENC 对 H.264 的硬件编码分辨率上限是 4096。**H.265（HEVC）硬件编码不受此限制**，8K（7680×3840）等超高分辨率想要保留硬件编码，需要显式加 `-enable_h265_encoder` / `EnableH265Encoder(true)`。
2. **Windows 平台：分辨率 ≤ 360（宽或高）→ 强制切换为软件编码。**
3. **10bit 导出 + 源素材位深 ≥ 10bit + 编码格式为 H.264 → 自动将编码格式切换为 H.265。**
4. 降噪 / 去紫边 / 去频闪 + 10bit 源素材 → 即使未显式加 `-enable_10bit`，也会自动启用 10bit 导出。

---

## 硬件加速相关接口

#### 强制软件编解码：`SetSoftwareCodecUsage`

设置是否强制使用软件编解码。

#### 禁用 CUDA：`EnableCuda(bool enable)`

设置是否开启 CUDA 加速检测。

#### 渲染加速类型：`SetImageProcessingAccelType`

设置图像处理渲染的加速方式：`Auto` 自动检测（默认）/ `CPU`。

---

## 实时拼接（RealTimeStitcher）

实时拼接基于 CameraSDK 和 MediaSDK 协同实现：CameraSDK 提供拼接参数、视频数据、防抖数据及曝光数据；MediaSDK 使用这些数据进行拼接，生成 2:1 全景画面。头文件位于 `include/ins_realtime_stitcher.h`，完整示例见 `example/realtime_stitcher_demo.cc`。

### 预览参数获取和设置

```cpp
#include <ins_realtime_stitcher.h>

// cam 为当前相机实例对象
auto preview_param = cam->GetPreviewParam();

auto stitcher = std::make_shared<ins::RealTimeStitcher>();

ins::CameraInfo camera_info;
camera_info.cameraName = preview_param.camera_name;
camera_info.decode_type = static_cast<ins::VideoDecodeType>(preview_param.encode_type);
camera_info.gyro_timestamp = preview_param.gyro_timestamp;

auto window_crop_info = preview_param.crop_info;
camera_info.SetCalibration(calibration_offsets,
                            window_crop_info.src_width, window_crop_info.src_height,
                            window_crop_info.dst_width, window_crop_info.dst_height,
                            window_crop_info.crop_offset_x, window_crop_info.crop_offset_y);

stitcher->SetCameraInfo(camera_info);
```

### 预览流原始数据的处理

在 CameraSDK 中，需继承 `ins_camera::StreamDelegate` 接口才能获取相机实时数据，并转发给 MediaSDK：

```cpp
class StitchStreamDelegate : public ins_camera::StreamDelegate {
public:
    StitchStreamDelegate(const std::shared_ptr<ins::RealTimeStitcher>& stitcher) : stitcher_(stitcher) {}
    ~StitchStreamDelegate() override {}

    void OnAudioData(const uint8_t* data, size_t size, int64_t timestamp) override {}

    // 视频数据
    void OnVideoData(const uint8_t* data, size_t size, int64_t timestamp, uint8_t streamType, int stream_index) override {
        stitcher_->HandleVideoData(data, size, timestamp, streamType, stream_index);
    }

    // 防抖数据
    void OnGyroData(const std::vector<ins_camera::GyroData>& data) override {
        std::vector<ins::GyroData> data_vec(data.size());
        memcpy(data_vec.data(), data.data(), data.size() * sizeof(ins_camera::GyroData));
        stitcher_->HandleGyroData(data_vec);
    }

    // 曝光数据
    void OnExposureData(const ins_camera::ExposureData& data) override {
        ins::ExposureData exposure_data{};
        exposure_data.exposure_time = data.exposure_time;
        exposure_data.timestamp = data.timestamp;
        stitcher_->HandleExposureData(exposure_data);
    }

private:
    std::shared_ptr<ins::RealTimeStitcher> stitcher_;
};
```

### 设置预览参数

- **拼接类型**：参考上文「公共参数 - 拼接类型」。
- **防抖参数**：参考上文「公共参数 - 防抖开启」。
- **保护镜**：参考上文「公共参数 - 保护镜」。
- **输出画面大小**：不设置时输出大小为当前预览分辨率；若需提升输出帧率，可降低分辨率。
- **视频流延迟**：`void SetVideoDelayMs(int video_delay_ms)`，对输入视频流引入人为延迟（毫秒），用于和陀螺仪数据对齐。

### 获取拼接好的数据

拼接结果目前支持 RGBA 格式，通过 `SetStitchRealTimeDataCallback` 回调获取，建议不要在回调里执行耗时操作：

```cpp
stitcher->SetStitchRealTimeDataCallback([&](uint8_t* data[4], int linesize[4], int width, int height, int format, int64_t timestamp) {
    show_image_ = cv::Mat(height, width, CV_8UC4, data[0]).clone();
});
```

### 开启 / 关闭预览

```cpp
// 开启：设置委托接口，启动相机预览，再启动拼接
std::shared_ptr<ins_camera::StreamDelegate> delegate = std::make_shared<StitchStreamDelegate>(stitcher);
cam->SetStreamDelegate(delegate);
ins_camera::LiveStreamParam param;
if (cam->StartLiveStreaming(param)) {
    stitcher->StartStitch();
    std::cout << "successfully started live stream" << std::endl;
}

// 关闭：先停相机预览流，再取消拼接
if (cam->StopLiveStreaming()) {
    stitcher->CancelStitch();
    std::cout << "success!" << std::endl;
}
```

---

## 错误码

| 错误码 | 错误信息 |
|---|---|
| `E_OPEN_FILE`(1) | 打开文件失败 |
| `E_PARSE_METADATA`(2) | 解析文件尾失败 |
| `E_CREATE_OFFSCREEN`(3) | 创建离屏渲染失败 |
| `E_CREATE_RENDER_MODEL`(4) | 创建渲染模型失败 |
| `E_FRAME_PARSE`(5) | 获取数据帧失败 |
| `E_CREATE_RENDER_SOURCE`(6) | 创建渲染数据源失败 |
| `E_UPDATE_RENDER_SOURCE`(7) | 更新数据帧到渲染源失败 |
| `E_RENDER_FRAME`(8) | 渲染数据失败 |
| `E_SAVE_FRAME`(9) | 保存图片失败 |
| `E_VIDEO_FRAME_EXPORTOR`(10) | 创建视频提取器失败 |
| `E_FILE_TYPE_UNSUPPORT`(11) | 不支持的输入文件类型 |
| `E_INTERNAL_ERROR`(998) | SDK 内部错误 |
| `E_UNKNOWN`(999) | 未知错误，需要提供详细信息分析 |

---

## 示例程序使用

### MediaSDKTest（离线拼接）

> 提示：随时运行 `MediaSDKTest -help` 查看全部参数。

```
MediaSDKTest -inputs <输入文件> -output <输出文件> [选项]
```

常用选项（注意是**全拼长参数**，非单字母）：

| 参数 | 说明 | 示例 |
|------|------|------|
| `-inputs` | 输入文件路径（必填，多镜头可跟多个文件） | `-inputs video.insv` |
| `-output` | 输出文件路径（必填，视频/图片） | `-output out.mp4` |
| `-model_root_dir` | 模型文件根目录（默认 `<exe>/models/`，自动查找） | `-model_root_dir ./models/` |
| `-stitch_type` | 拼接算法：`optflow`(默认) / `dynamicstitch` / `aistitch` | `-stitch_type aistitch` |
| `-output_size` | 输出分辨率 `<宽>x<高>`，须满足 2:1 | `-output_size 3840x1920` |
| `-bitrate` | 输出码率（bps），`0` 或不填 = 同源码率。8K 建议 80–142 Mbps | `-bitrate 142000000` |
| `-enable_flowstate` | 开启防抖（FlowState） | — |
| `-enable_directionlock` | 开启方向锁定 | — |
| `-enable_10bit` | 10bit 导出（自动切 H.265；源为 8bit 时回退） | — |
| `-enable_h265_encoder` | 用 H.265 编码；分辨率 > 4096 时需要它才能保留硬件编码 | — |
| `-enable_denoise` / `-enable_defringe` / `-enable_deflicker` | 降噪 / 去紫边（仅 X4 Air/X5/X6 支持，其余机型跳过） / 去频闪 | — |
| `-enable_colorplus` | ColorPlus 色彩增强 | — |
| `-enable_stitchfusion` | 消色差 | — |
| `-enable_coolingshell` | 散热壳检测（仅 X4 Air/X5/X6 支持，其余机型跳过） | — |
| `-camera_accessory_type` | 保护镜类型，取值见 `CameraAccessoryType`（参考 `common.h`） | — |
| `-image_sequence_dir <目录>` | 导出为图片序列（配 `-image_type jpg/png`） | — |
| `-export_frame_index` | 指定帧号导出，如 `20-50-30`；省略则导出全部帧 | — |
| `-exposure` / `-highlights` / `-shadows` / `-contrast` / `-brightness` / `-blackpoint` / `-saturation` / `-vibrance` / `-warmth` / `-tint` | 调色参数，范围 [-100,100] | — |
| `-definition` | 清晰度，范围 [0,100] | — |
| `-disable_cuda` | 关闭 GPU，走 CPU（GPU 环境异常时排查用） | — |
| `-enable_soft_encode` / `-enable_soft_decode` | 强制软编 / 软解（默认硬件编解码，见「软硬件编解码」一节的自动降级规则） | — |
| `-image_processing_accel` | 渲染加速：`auto`(默认) / `cpu`（遇 Vulkan 报错时用） | — |
| `--debug` | 打开详细日志（等价 `--log_level verbose`；默认只打 ERROR 级） | — |
| `--log_level <级别>` | 指定日志等级：`verbose`/`info`/`warning`/`error`/`fatal` | `--log_level info` |
| `--log_file [路径]` | 把 SDK 日志额外写入文件（值可选，见「日志功能」一节） | `--log_file ./logs` |

示例：

```bash
# Windows
MediaSDKTest.exe -inputs D:\media\video.insv -output D:\output\out.mp4 -stitch_type optflow -output_size 3840x1920 -enable_flowstate

# Linux
./MediaSDKTest -inputs /data/video.insv -output /output/out.mp4 -stitch_type optflow -output_size 3840x1920

# 8K + H.265，保留硬件编码，码率对齐 studio 桌面端 142Mbps
MediaSDKTest.exe -inputs D:\media\video.insv -output D:\output\out_8k.mp4 -output_size 7680x3840 -bitrate 142000000 -enable_h265_encoder
```

### RealTimeStitcherSDKTest（实时拼接）

```bash
RealTimeStitcherSDKTest        # 连接相机进行实时拼接（参数见 -help）
```

---

## 环境要求

### 一、运行时环境（使用 SDK 或运行示例程序）

SDK 的安装包（.deb / Windows 压缩包）已包含主要运行时依赖，无需额外安装 CUDA Toolkit、OpenCV 等。

| 项目 | Windows | Linux |
|------|---------|-------|
| CUDA 运行时（cudart/cublas/cufft/npp/cusolver/cusparse/cudnn） | 已打包 | 已打包进 .deb |
| AI 推理库（MNN） | 已打包 | 已打包进 .deb |
| OpenGL/X11 基础库 | 已打包 | 已打包进 .deb |
| 唯一要求 | NVIDIA 驱动（≥ 470） | NVIDIA 驱动（≥ 470） |

安装后即可直接运行示例程序，无需配置环境变量。

### 二、开发环境（编译集成 SDK 的项目）

如需自己编写 CMake 项目集成 libMediaSDK.so / MediaSDK.lib，需要：

#### CUDA Toolkit

| 平台 | 版本 | 下载地址 |
|------|------|----------|
| Windows | CUDA 10.2 | https://developer.nvidia.com/cuda-10.2-download-archive |
| Linux | CUDA 11.7 | https://developer.nvidia.com/cuda-11-7-0-download-archive |

安装后确保 `CUDA_PATH`（Windows）或 `CUDA_TOOLKIT_ROOT_DIR`（Linux）环境变量指向 CUDA 安装目录。

#### 编译器

| 平台 | 编译器 | 版本 |
|------|--------|------|
| Windows | Visual Studio | 2019 (MSVC v142) |
| Linux | GCC | ≥ 11 |

#### CMake 集成示例

```cmake
cmake_minimum_required(VERSION 3.14)
project(MyApp)

# 指定 SDK 路径
set(INS_MEDIA_SDK_DIR "/usr/local/MediaSDK" CACHE PATH "InsMediaSDK install path")

# 头文件
target_include_directories(myapp PRIVATE ${INS_MEDIA_SDK_DIR}/include/stitcher)

# 链接库
target_link_libraries(myapp
    ${INS_MEDIA_SDK_DIR}/lib/libMediaSDK.so          # Linux
    # ${INS_MEDIA_SDK_DIR}/lib/MediaSDK.lib          # Windows
    ${CUDA_LIBRARIES}                                 # CUDA 运行时
)

# 运行时模型文件需拷贝到可执行文件同级目录的 models/
```

---

## 模型文件

运行时需要 `models/` 目录，包含以下算法模型文件（由 SDK 包提供）：

| 文件 | 用途 |
|------|------|
| `ai_stitcher.ins` | AI 拼接光流模型 |
| `defringe_hr_dynamic_7b56e80f.ins` | 去紫边模型（普通机型） |
| `defringe_air_hr_dynamic_6fbc2886.ins` | 去紫边模型（Air 机型） |
| `jpg_denoise_9d006262.ins` | JPEG 降噪模型（图片降噪直接使用该模型推理；视频降噪仅用其存在性作为功能启用门槛，实际参数来自内置配置，不加载该模型本身） |
| `colorplus_model.ins` | 色彩增强模型 |
| `deflicker_86ccba0d.ins` | 去闪烁模型 |

默认搜索路径：`<可执行文件目录>/models/`，可通过 `SetModelFileRootDir()` / `-model_root_dir` 参数指定。

---
