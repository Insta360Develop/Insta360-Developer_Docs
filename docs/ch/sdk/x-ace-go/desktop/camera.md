# Camera SDK 接口文档

## 文档概述

CameraSDK 主要用于连接相机、设置与获取相机参数、控制相机拍照与录制、下载文件以及固件升级（仅支持 X4 及之后的机型）等。桌面端 SDK 仅支持通过 USB 连接相机，面向 toB 用户。

- **支持机型**：ONE X、ONE R/RS、ONE X2、X3、X4、X4 Air、X5、X6。
- **支持平台**：Windows、Ubuntu 22.04（x86-64 与 aarch64）。
- **命名空间**：所有 API 位于 `ins_camera`。

> 本文以“连接 → 操作 → 断连”的使用流程组织，先给出快速上手，再按功能类别逐一说明接口与示例代码。大部分接口在旧版本基础上保持不变；新增能力（X6、能力表查询、3A 画质、存储位置等）在对应章节标注了适用机型。

## 包目录结构

```
include/        公开头文件（编译时依赖的 API）
  camera/       camera.h、device_discovery.h、ins_types.h、photography_settings.h
  stream/       stream_delegate.h、stream_types.h
lib/            CameraSDK 动态库（.dll / .so）
bin/            预编译的示例可执行程序 CameraSDKDemo
  jsons/        相机能力表 JSON 文件（X2/X3 离线回退用）
example/        示例程序源码（见“示例程序”一节）
docs/           本文档
```

把 `include/` 加入编译器头文件搜索路径，并链接 `lib/` 下的库即可。

## 快速上手

```cpp
#include <camera/camera.h>
#include <camera/device_discovery.h>

int main() {
    // 1. 发现已连接的相机
    ins_camera::DeviceDiscovery discovery;
    auto list = discovery.GetAvailableDevices();
    if (list.empty()) return -1;

    // 2. 打开第一台相机
    auto cam = std::make_shared<ins_camera::Camera>(list[0].info);
    if (!cam->Open()) return -1;
    discovery.FreeDeviceDescriptors(list);

    // 3. 拍一张照片
    auto url = cam->TakePhoto();
    if (!url.Empty()) {
        // url.GetSingleOrigin() 是相机上的文件路径
    }

    // 4. 用完关闭
    cam->Close();
    return 0;
}
```

## 功能使用说明

### 环境准备

#### 相机切换到安卓模式下

默认情况下，当你将 Insta360 相机连接到计算机时，相机会自动切换到 U 盘模式，使相机成为一个 USB 存储设备。我们需要将相机切换到正确模式，才能连接并控制它。

**For ONE X**
你需要升级到一个特殊版本的固件，[在此处下载](https://insta360-dev.oss-cn-hangzhou.aliyuncs.com/developer/releases/a33b3362-4767-47c3-ba9d-6ed07febb210.zip)。升级后，在相机上进入设置，找到 USB 选项，将其设置为 **Android** 模式。

**For ONE R/RS、ONE X2、X3**
在相机界面向下滑动进入主菜单，进入“设置” → “常规”，将 USB 模式设置为“Android”，将 U 盘模式设置为“Android”。

**For X4 / X4 Air / X5 / X6**
先连接 USB 线，然后在弹出的模式选择界面选择 **Android** 模式，等待切换成功。

#### 驱动安装

**On Linux**，请确保你的发行版已安装 libusb。可以通过 yum 或 apt-get 安装：

```bash
sudo apt-get install libusb-dev
sudo apt-get install libudev-dev
```

或者从源代码构建：

```bash
wget http://sourceforge.net/projects/libusb/files/libusb-1.0/libusb-1.0.9/libusb-1.0.9.tar.bz2
tar xjf libusb-1.0.9.tar.bz2
cd libusb-1.0.9
./configure
make
sudo make install
```

安装驱动后，通过 `lsusb` 命令检查是否检测到相机。如果找到供应商 ID 为 `0x2e1a` 的 USB 设备，说明驱动已成功安装。

**注意：在 Linux 系统上，演示程序必须使用 `sudo` 运行**，例如：

```bash
sudo ./CameraSDKDemo   # for ubuntu
```

**On Windows**，请确保已安装 libusbK 驱动。你可以直接安装 [libusbK](https://sourceforge.net/projects/libusbk/files/libusbK-release/3.0.7.0/)，也可以使用 [zadig](https://zadig.akeo.ie/) 来协助安装 libusbK 驱动。

### 相机发现

相机发现主要通过 **ins_camera::DeviceDiscovery** 接口实现。

```cpp
// DeviceDescriptor 结构体保存相机的基本信息，主要用于连接
struct DeviceDescriptor {
    CameraType camera_type;    // 相机类型，比如 X3 或 X4
    std::string serial_number; // 当前相机的序列号
    std::string camera_name;   // 相机名称
    std::string fw_version;    // 当前相机固件的版本号
    DeviceConnectionInfo info; // 连接信息（PC 端 SDK 仅支持 USB 连接）
};

ins_camera::DeviceDiscovery discovery;
// 遍历到的相机信息保存在这个 list 中
std::vector<DeviceDescriptor> list = discovery.GetAvailableDevices();
```

### 相机连接与断连

#### 创建相机实例

获取到相机信息后，通过 **ins_camera::Camera** 和 **DeviceDescriptor** 创建控制相机的实例。

```cpp
// 从相机列表中获取创建实例所需的信息
auto camera_info = list[0].info;
auto camera = std::make_shared<ins_camera::Camera>(camera_info);
// 到此已经创建好一个相机实例
```

#### 打开相机

通过 **Open** 接口打开相机。

```cpp
bool success = camera->Open();
if (!success) {
    std::cout << "failed to open camera" << std::endl;
    return -1;
}
```

> **端口占用**：SDK 内部启动了 HttpServer 用于文件传输，可能存在端口占用导致服务启动失败的情况。SDK 提供了 **SetServicePort** 接口来规避这个问题，默认端口号为 `9099`。若存在占用，需在 **Open** 调用**之前**设置端口：
>
> ```cpp
> camera->SetServicePort(9199);
> camera->Open();
> ```

#### 相机断连与重连

通过 **Close** 接口断开相机。USB 意外拔出后也需要调用 Close 释放资源，否则无法重新 Open。

重连时不需要手动重新检测设备——关闭后再重新走一遍设备发现 + Open 即可：

```cpp
camera->Close();
// 重新检测设备并打开（DeviceDiscovery → Camera(info) → Open）
camera = std::make_shared<Camera>(new_device_info);
camera->Open();
```

Demo 中菜单 8"重连相机"即封装了此流程：Close → 重新检测设备 → 重新 Open。

> 注意：使用升级固件的接口完成后，需要调用关闭相机的接口；等待升级成功后，再重新创建相机实例。

```cpp
camera->Close();
```

#### 判断相机是否连接

判断相机目前是否还处于连接状态，请使用 **IsConnected** 接口。

> 注意：在相机切换状态过程中，避免调用此接口。

### 拍照

#### 基本参数设置

##### 设置相机照片模式

通过 **SetPhotoSubMode** 接口切换各个照片模式。下面是相机支持的模式，具体以相机界面为准。

```cpp
enum SubPhotoMode {
    PHOTO_SINGLE    = 0,  // 普通拍照
    PHOTO_HDR       = 1,  // HDR 拍照
    PHOTO_INTERVAL  = 2,  // Interval 拍照
    PHOTO_BURST     = 3,  // Burst 连拍
    PHOTO_STARLAPSE = 7,  // 星空模式拍照
};

// 建议通过能力表查询当前模式支持的子模式：
// GetSupportedAttrValues(mode, "photo_sub_mode")

camera->SetPhotoSubMode(SubPhotoMode::PHOTO_SINGLE);
```

##### 设置分辨率大小

通过 **SetPhotoSize** 设置照片分辨率。建议先用能力表查询接口 **GetSupportedPhotoSizes** 获取当前机型实际支持的分辨率列表，避免按机型硬编码。

```cpp
// 推荐的查询方式（能力表驱动）
auto sizes = cam->GetSupportedPhotoSizes(function_mode);
if (!sizes.empty()) {
    cam->SetPhotoSize(function_mode, sizes[0]);  // 使用第一个支持的尺寸
}
```

`SetPhotoSize` 只能使用下列 **CameraFunctionMode** 枚举中照片相关的模式，视频模式不支持此接口。

```cpp
// 照片大小
enum PhotoSize {
    Size_6912_3456  = 0,   // X3 18MP
    Size_5952_2976  = 12,  // X4 18MP
    Size_11968_5984 = 11,  // 72MP
    // ... 其余取值见 photography_settings.h
};

// 照片模式（CameraFunctionMode 节选）
enum CameraFunctionMode {
    FUNCTION_MODE_NORMAL            = 0,   // 默认模式
    FUNCTION_MODE_INTERVAL_SHOOTING = 3,   // Interval 拍照模式
    FUNCTION_MODE_BURST             = 5,   // Burst 连拍模式
    FUNCTION_MODE_NORMAL_IMAGE      = 6,   // 普通拍照模式
    FUNCTION_MODE_HDR_IMAGE         = 8,   // HDR 拍照模式
    FUNCTION_MODE_AEB_NIGHT_IMAGE   = 13,
    FUNCTION_MODE_STARLAPSE_IMAGE   = 18,  // 星空模式
    // ...
};

// 设置普通拍照的照片大小为 72MP
camera->SetPhotoSize(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE, PhotoSize::Size_11968_5984);
```

##### 曝光参数

曝光参数通过 **ExposureSettings** 对象保存，包含 ISO、快门、曝光模式与曝光补偿。

```cpp
class CAMERASDK_API ExposureSettings {
public:
    void SetIso(int32_t value);
    void SetShutterSpeed(double speed);
    void SetExposureMode(PhotographyOptions_ExposureMode mode);
    void SetEVBias(int32_t value);

    int32_t Iso() const;
    double ShutterSpeed() const;
    PhotographyOptions_ExposureMode ExposureMode() const;
    int32_t EVBias() const;
};
```

通过 **GetExposureSettings** 获取某模式下的曝光参数，通过 **SetExposureSettings** 下发。典型流程为“获取 → 修改 → 下发”：

```cpp
const auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE;

// 1. 获取当前曝光参数
auto exposure_settings = camera->GetExposureSettings(function_mode);

// 2. 修改参数
exposure_settings->SetExposureMode(ins_camera::PhotographyOptions_ExposureMode::MANUAL);
exposure_settings->SetEVBias(0);            // EV×20，范围 -80 ~ 80，默认 0
exposure_settings->SetIso(800);             // 需 MANUAL / ISO_PRIORITY 模式
exposure_settings->SetShutterSpeed(1.0 / 120.0);  // 秒，需 MANUAL / SHUTTER_PRIORITY 模式

// 3. 下发到相机
camera->SetExposureSettings(function_mode, exposure_settings);
```

> **编码说明**：`SetEVBias` 的入参为 EV×20（例如 -4EV → -80，+3EV → 60）；`SetShutterSpeed` 单位为秒（例如 1/60 → 0.01666…）。

##### 白平衡参数

白平衡等画质参数通过 **CaptureSettings** 对象保存，通过 **GetCaptureSettings** 获取、**SetCaptureSettings** 下发。

```cpp
const auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE;

// 1. 获取当前参数
auto capture_setting = camera->GetCaptureSettings(function_mode);

// 2. 读取白平衡
auto value = capture_setting->GetIntValue(
    ins_camera::CaptureSettings::SettingsType::CaptureSettings_WhiteBalance);

// 3. 设置白平衡预设
capture_setting->SetWhiteBalance(ins_camera::PhotographyOptions_WhiteBalance::WB_6500K);

// 4. 下发到相机
camera->SetCaptureSettings(function_mode, capture_setting);
```

`CaptureSettings::SetValue(type, v)` 可设置的取值范围：亮度 Brightness(-256~256)、对比度 Contrast(0~256)、饱和度 Saturation(0~256)、锐度 Sharpness(0~6)、白平衡 WhiteBalance(开尔文)。

##### 3A 画质模式（仅 X6 录像模式，SDK 内部自动处理）

> 非 X6 机型可跳过本节。

X6 在录像模式下有普通(NORMAL) / 专业(PRO)两种 3A 画质模式。PRO 模式解锁 ISO、快门、白平衡、锐度等参数，NORMAL 模式下这些参数不可调。

**SDK 内部自动处理，无需用户手动调用**：当你设置锐度、白平衡、ISO、快门等参数时，SDK 会自动切换到 PRO 模式。如需手动切回普通模式，可通过 `SetCaptureSettings` 设置 `CaptureSettings_Iq3AMode` 为 NORMAL。

```cpp
// SDK 内部自动处理，以下仅展示原理：
// 设锐度 → SDK 自动切 PRO → 设值 → 完成，用户无需干预

// 如需手动切回普通模式（仅 X6）：
auto cs = cam->GetCaptureSettings(mode);
cs->SetValue(CaptureSettings::SettingsType::CaptureSettings_Iq3AMode, 1); // 1 = NORMAL
cam->SetCaptureSettings(mode, cs);

// 强制从相机刷新参数缓存
cam->SyncPhotographyOptions(mode);
```

#### 普通拍照

```cpp
// 1. 设置为普通拍照模式
camera->SetPhotoSubMode(SubPhotoMode::PHOTO_SINGLE);

// 2. 使用能力表查询照片尺寸，而非硬编码
auto sizes = cam->GetSupportedPhotoSizes(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE);
if (!sizes.empty()) {
    cam->SetPhotoSize(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE, sizes[0]);
}

// 3. X5/X6：预设照片格式（见下一节）
cam->SetRawCaptureType(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE, RawCaptureType::PureShotRaw);

// 4. 拍照。可传 raw_type 指定格式；X5/X6 建议用 SetRawCaptureType 预设
auto url = camera->TakePhoto(RawCaptureType::PureShotRaw);
```

##### 照片格式（X5/X6）

X5/X6 需在 `TakePhoto` 之前通过 **SetRawCaptureType** 预设照片格式，否则相机可能忽略 `TakePhoto` 传入的 `raw_type` 参数。建议通过能力表查询当前机型支持的格式。

```cpp
enum RawCaptureType {
    PureShot    = 3,  // PureShot 格式
    PureShotRaw = 4,  // PureShot + RAW（同时保存 JPG 和 DNG）
};

// 查询可选格式
auto vals = cam->GetSupportedAttrValues(mode, "raw_capture_type");
// 预设照片格式
cam->SetRawCaptureType(mode, RawCaptureType::PureShotRaw);
```

##### 拍照倒计时

```cpp
// 设置普通拍照 5 秒倒计时
cam->SetPhotoSubModeTimer(SubPhotoMode::PHOTO_SINGLE, 5);
// 读取当前倒计时（秒，0 = 关）
int sec = cam->GetSelfTimer(mode);
// 可通过能力表查询可选值：GetSupportedAttrValues(mode, "photography_self_timer")
```

#### HDR 拍照

HDR 拍照通过 **StartHDRCapture** 接口实现，也可以先用以下接口精细控制 HDR 参数：

```cpp
// 设置 HDR 模式：OFF / AUTO / AEB
cam->SetPhotoHdrMode(mode, PhotoHdrType::PHOTO_HDR_AUTO);
// AEB 包围曝光：连拍张数(3/5/7) 与曝光步长(EV)
cam->SetAebCaptureNum(mode, 3);
cam->SetAebExposureBias(mode, 1.0);
```

- 对于 X3 之前的相机，拍照完成后一般得到 3、5、7 或 9 张素材。
- 对于 X4 及之后的相机，默认得到 1 张已完成 HDR 融合的素材，可直接拼接。

```cpp
auto sizes = cam->GetSupportedPhotoSizes(CameraFunctionMode::FUNCTION_MODE_HDR_IMAGE);
ins_camera::PhotoSize photo_size = sizes.empty() ? ins_camera::PhotoSize::Size_6912_3456 : sizes[0];

// StartHDRCapture(size, is_raw, aeb_num, ev_step_tenths, raw_type)
// raw_type 设置照片格式（PureShot / PureShot+RAW），X5/X6 需先 SetRawCaptureType 预设
camera->StartHDRCapture(photo_size, false, 0, 0, RawCaptureType::PureShot);
```

### 录制

#### 基本参数设置

##### 设置相机视频模式

通过 **SetVideoSubMode** 接口切换各个视频模式。

```cpp
enum SubVideoMode {
    VIDEO_NORMAL        = 0,   // 普通录制
    VIDEO_BULLETTIME    = 1,   // 子弹时间
    VIDEO_TIMELAPSE     = 2,   // Timelapse 录制
    VIDEO_HDR           = 3,   // HDR 录制
    VIDEO_TIMESHIFT     = 4,   // Timeshift 录制
    VIDEO_LOOPRECORDING = 6,   // 循环录影
    VIDEO_PURE          = 11,  // 纯净录像（X6）
    VIDEO_DASH_CAM      = 14,  // 行车记录仪（X6）
};

camera->SetVideoSubMode(SubVideoMode::VIDEO_NORMAL);
```

##### 设置分辨率大小

通过 **SetVideoCaptureParams** 设置录制参数。该接口只能使用下列 **CameraFunctionMode** 枚举中视频相关的模式，不支持照片模式。

```cpp
// 视频模式（CameraFunctionMode 节选）
enum CameraFunctionMode {
    FUNCTION_MODE_MOBILE_TIMELAPSE     = 2,   // 移动延时视频模式
    FUNCTION_MODE_NORMAL_VIDEO         = 7,   // 普通视频模式
    FUNCTION_MODE_HDR_VIDEO            = 9,   // HDR 视频模式
    FUNCTION_MODE_INTERVAL_VIDEO       = 10,  // Interval 视频模式
    FUNCTION_MODE_STATIC_TIMELAPSE     = 11,  // 延时视频模式
    FUNCTION_MODE_TIMESHIFT            = 12,  // Timeshift 模式
    FUNCTION_MODE_LOOP_RECORDING_VIDEO = 17,  // 循环录影模式
    FUNCTION_MODE_PURE_VIDEO           = 27,  // 纯净录像模式（X6）
    FUNCTION_MODE_DASH_CAM             = 63,  // 行车记录仪模式（X6）
};

// 录制参数：分辨率（含帧率）+ 码率
struct RecordParams {
    VideoResolution resolution;
    int32_t bitrate{ 0 };
};

auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_VIDEO;
ins_camera::RecordParams record_params;
// 使用能力表查询支持的分辨率，而非硬编码
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) {
    record_params.resolution = resolutions[0];
}
// 码率仅供参考，部分挡位/机型会写死码率，可不设置
record_params.bitrate = 1024 * 1024 * 10;
if (!cam->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
}
```

##### 曝光 / 白平衡参数

与拍照一致，参考 [曝光参数](#曝光参数) 与 [白平衡参数](#白平衡参数)，将 `function_mode` 换成对应的视频模式即可。

#### 普通录制

##### 开始录制

```cpp
// 1. 切换为视频普通模式
bool ret = camera->SetVideoSubMode(ins_camera::SubVideoMode::VIDEO_NORMAL);
if (!ret) {
    std::cout << "change sub mode failed!" << std::endl;
    return;
}

// 2. 设置分辨率/帧率/码率（使用能力表查询）
auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_VIDEO;
ins_camera::RecordParams record_params;
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) record_params.resolution = resolutions[0];
record_params.bitrate = 1024 * 1024 * 10;  // 码率仅供参考，可不设置

if (!camera->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
} else {
    // 3. 开始录制
    if (camera->StartRecording()) {
        std::cerr << "success!" << std::endl;
    } else {
        std::cerr << "failed to start recording" << std::endl;
    }
}
```

##### 停止录制

```cpp
auto url = cam->StopRecording();
if (url.Empty()) {
    std::cerr << "stop recording failed" << std::endl;
    return;
}
// 获取录制素材在相机中的地址
auto& origins = url.OriginUrls();
std::cout << "stop recording success" << std::endl;
for (auto& origin_url : origins) {
    std::cout << "url:" << origin_url << std::endl;
}
```

#### Timelapse 录制

下表为 Timelapse 下常见的分辨率-机型对应关系（建议用 **GetSupportedVideoResolutions** 查询，而非按此表硬编码）：

|       | X6                | X5                | X4 Air            | X4                | X3                |
|-------|-------------------|-------------------|-------------------|-------------------|-------------------|
| 11K30 | RES_5632_5632P30  | RES_5632_5632P30  | -                 | RES_5632_5632P30  | -                 |
| 8K30  | RES_3840_3840P30  | RES_3840_3840P30  | RES_3840_3840P30  | RES_3840_3840P30  | RES_3840_3840P30  |

##### 开始录制

```cpp
// 1. 切换到 timelapse 模式
bool ret = cam->SetVideoSubMode(ins_camera::SubVideoMode::VIDEO_TIMELAPSE);
if (!ret) {
    std::cout << "change sub mode failed!" << std::endl;
    return;
}

// 2. 设置分辨率/帧率（使用能力表查询）
auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_MOBILE_TIMELAPSE;
ins_camera::RecordParams record_params;
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) record_params.resolution = resolutions[0];
if (!cam->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
    return;
}

// 3. 设置延时摄影参数
auto timelapse_mode = ins_camera::CameraTimelapseMode::MOBILE_TIMELAPSE_VIDEO;
// TimelapseParam{ mode, duration(秒), lapseTime(毫秒), accelerate_fequency }
ins_camera::TimelapseParam param = { timelapse_mode, 10, 1000, 0 };
if (!cam->SetTimeLapseOption(param)) {
    std::cerr << "failed to set timelapse option." << std::endl;
} else {
    // 4. 开始录制
    if (cam->StartTimeLapse(param.mode)) {
        std::cerr << "success!" << std::endl;
    } else {
        std::cerr << "failed to start timelapse" << std::endl;
    }
}
```

##### 停止录制

```cpp
auto timelapse_mode = ins_camera::CameraTimelapseMode::MOBILE_TIMELAPSE_VIDEO;
auto url = cam->StopTimeLapse(timelapse_mode);
if (url.Empty()) {
    std::cerr << "stop timelapse failed" << std::endl;
    return;
}
auto& origins = url.OriginUrls();
std::cout << "stop timelapse success" << std::endl;
for (auto& origin_url : origins) {
    std::cout << "url:" << origin_url << std::endl;
}
```

> **编码说明**：`TimelapseParam` 中 `lapseTime` 单位为毫秒（5 秒 → 5000），`duration` 单位为秒（1 小时 → 3600）。

#### Timeshift 录制（移动延时，推荐 X6 使用）

Timeshift（移动延时）与 Timelapse 复用同一套接口（`SetTimeLapseOption` / `StartTimeLapse` / `StopTimeLapse`），区别在于子模式为 **VIDEO_TIMESHIFT**、功能模式为 **FUNCTION_MODE_TIMESHIFT**，并通过 `accelerate_fequency`（加速倍数）控制画面加速效果。**在 X6 上推荐使用 Timeshift。**

```cpp
// 1. 切换到 timeshift 模式
if (!cam->SetVideoSubMode(ins_camera::SubVideoMode::VIDEO_TIMESHIFT)) {
    std::cout << "change sub mode failed!" << std::endl;
    return;
}

// 2. 设置分辨率/帧率（使用能力表查询）
auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_TIMESHIFT;
ins_camera::RecordParams record_params;
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) record_params.resolution = resolutions[0];
if (!cam->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
    return;
}

// 3. 设置移动延时参数（复用 TimelapseParam，通过 accelerate_fequency 设置加速倍数）
ins_camera::TimelapseParam param;
param.mode = ins_camera::CameraTimelapseMode::MOBILE_TIMELAPSE_VIDEO;
param.duration = 0;   // 0 = 不限时长
param.lapseTime = 0;  // Timeshift 由加速倍数控制，通常无需设置间隔
// 加速倍数建议用能力表查询：GetSupportedAccelerateFrequencies(function_mode)
auto freqs = cam->GetSupportedAccelerateFrequencies(function_mode);
if (!freqs.empty()) param.accelerate_fequency = freqs[0];
if (!cam->SetTimeLapseOption(param)) {
    std::cerr << "failed to set timeshift option." << std::endl;
    return;
}

// 4. 开始 / 停止（与 Timelapse 相同）
cam->StartTimeLapse(param.mode);
// ...
auto url = cam->StopTimeLapse(param.mode);
```

### 能力表查询

SDK 通过相机 `/CONF` JSON 能力表获取当前机型 + 模式下实际支持的参数与取值范围，避免按机型硬编码。所有查询接口在 `Open()` 后可用。

#### 查询当前模式支持的属性

```cpp
auto attrs = cam->GetSupportedAttrNames(mode);
// 返回如：["exposure_bias", "exposure_iso", "white_balance", "iq_3a_mode", ...]
```

#### 查询属性的依赖项

```cpp
auto deps = cam->GetAttrDependOn(mode, "exposure_iso");
// X6 录像模式返回：["iq_3a_mode"] → ISO 依赖 3A 模式（需切到 PRO）
```

#### 查询属性可选值

```cpp
// 默认值（不传上下文）
auto vals = cam->GetSupportedAttrValues(mode, "exposure_iso");
// → ["100", "125", "160", ...]

// 带上下文（X6 查 PRO 模式下的可选值）
auto proVals = cam->GetSupportedAttrValues(mode, "exposure_iso", "PRO");
// PRO 模式：["100", "125", ...]，NORMAL 模式：["0"]
```

#### 查询支持的照片尺寸 / 视频分辨率

```cpp
auto sizes = cam->GetSupportedPhotoSizes(mode);
auto resolutions = cam->GetSupportedVideoResolutions(mode);
```

#### 能力表字符串 → 枚举值

```cpp
int val = cam->GetAttrValueByName("raw_capture_type", "PURESHOT_RAW");
// 返回 4（RawCaptureType::PureShotRaw），查不到返回 -1
```

### 获取文件信息

#### 获取文件个数

通过 **GetCameraFilesCount** 获取当前相机 SD 卡中录制的文件个数。

#### 获取文件列表

通过 **GetCameraFilesList** 获取相机 SD 卡中的素材列表。

```cpp
auto file_list = camera->GetCameraFilesList();
for (const auto& file : file_list) {
    std::cout << file << std::endl;
}

// 输出示例：
// /DCIM/Camera01/VID_20250122_071405_00_001.insv
// /DCIM/Camera01/LRV_20250122_071405_01_001.lrv
// /DCIM/Camera01/VID_20250214_063916_00_002.insv
```

### 获取录制中的文件列表

通过 **GetRecordingFiles** 获取相机中正在录制的文件名称。

### 文件下载

#### 下载文件

通过 **DownloadCameraFile** 将相机 SD 卡中已存在的素材下载到本地。通过回调获取下载进度。该接口为**同步调用**，下载完成或失败后才返回。

> 注意：
> 1. 下载之前，确保本地保存路径的目录已创建。
> 2. SDK 内部启动了 HttpServer，可能存在端口占用；如需修改端口，请在 **Open** 之前调用 **SetServicePort**（默认端口 9099）。

```cpp
std::string camera_file = "/DCIM/Camera01/VID_20250122_071405_00_001.insv";
std::string local_save_file = "/path/to/local/VID_20250122_071405_00_001.insv";

bool ret = camera->DownloadCameraFile(camera_file, local_save_file,
    [](int64_t current, int64_t total_size) {
        std::cout << "current: " << current << "; total_size: " << total_size << std::endl;
    });

if (ret) {
    std::cout << "successfully downloaded file" << std::endl;
}
```

#### 取消下载

通过 **CancelDownload** 取消正在下载的文件。

### 删除文件

通过 **DeleteCameraFile** 删除 SD 卡中不需要的文件。

```cpp
const std::string camera_file = "/DCIM/Camera01/VID_20250122_071405_00_001.insv";
camera->DeleteCameraFile(camera_file);
```

### 固件升级（仅适用于 X4 及后续机型）

通过 **UploadFile** 进行固件升级，目前仅适用于 X4 及后续机型。固件的远端名称是约定好的，例如 `Insta360X4FW.bin`。

```cpp
// 固件远端名称（按机型选择）
std::string firmware_name = "Insta360X4FW.bin";
if (camera_type == ins_camera::CameraType::Insta360X5) {
    firmware_name = "Insta360X5FW.bin";
}

// 固件的本地路径
const std::string local_file = "/path/to/firmware/Insta360X4FW.bin";

// 开始上传
bool ret = cam->UploadFile(local_file, firmware_name,
    [](int64_t current, int64_t total_size) {
        std::cout << "current: " << current << "; total_size: " << total_size << std::endl;
    });

if (ret) {
    std::cout << "succeed to upload file!" << std::endl;
}

// 上传成功后，必须关闭相机；等待相机升级并重启成功后，再重新创建相机实例
camera->Close();
```

### 状态查询

#### 电池状态信息

通过 **GetBatteryStatus** 获取当前相机的电池信息（如电量）。

```cpp
enum PowerType {
    BATTERY = 0,
    ADAPTER = 1,
};

struct BatteryStatus {
    PowerType power_type;   // 电源类型
    uint32_t battery_level; // 当前电量 (0~100)
    uint32_t battery_scale; // 无用
};

BatteryStatus status;
bool ok = camera->GetBatteryStatus(status);
```

#### SD 卡存储信息

通过 **GetStorageState** 获取 SD 卡状态与空间大小。

```cpp
enum CardState {
    STOR_CS_PASS           = 0,  // SD 卡可正常使用
    STOR_CS_NOCARD         = 1,  // 相机中没有 SD 卡
    STOR_CS_NOSPACE        = 2,  // SD 卡无剩余空间
    STOR_CS_INVALID_FORMAT = 3,  // SD 卡格式不对
    STOR_CS_WPCARD         = 4,
    STOR_CS_OTHER_ERROR    = 5,  // 其他错误
};

struct StorageStatus {
    CardState state;
    uint64_t free_space;  // 剩余空间
    uint64_t total_space; // 总空间
};

StorageStatus status;
bool ok = camera->GetStorageState(status);
```

#### 当前拍照 / 录制状态

通过 **CaptureCurrentStatus** 查询相机是否处于拍照或录制状态。

```cpp
if (camera->CaptureCurrentStatus()) {
    std::cout << "current status: capturing" << std::endl;
} else {
    std::cout << "current status: idle" << std::endl;
}
```

#### 相机信息通知

以下接口用于接收相机主动推送的事件，涉及低电量、SD 卡满、高温以及录制异常中断。

```cpp
// 低电量通知
void SetBatteryLowNotification(BatteryLowCallBack callback);
// SD 卡已满通知
void SetStorageFullNotification(StorageFullCallBack callback);
// 录制异常中断通知（含 err_code 与 url）
void SetCaptureStoppedNotification(CaptureStoppedCallBack callback);
// 相机温度过高通知
void SetTemperatureHighNotification(TemperatureHighCallBack callback);
// 拍摄状态变化通知
void SetCaptureStateNotification(CaptureStateCallBack callback);
```

### 预览流功能

#### 设置预览流数据的委托接口

继承 **ins_camera::StreamDelegate** 实现获取原始视频流、音频流、防抖数据以及曝光数据。

```cpp
class TestStreamDelegate : public ins_camera::StreamDelegate {
public:
    // 音频数据回调
    void OnAudioData(const uint8_t* data, size_t size, int64_t timestamp) override {}

    // 视频数据回调
    void OnVideoData(const uint8_t* data, size_t size, int64_t timestamp,
                     uint8_t streamType, int stream_index) override {
        if (stream_index == 0) { /* 第一路视频 */ }
        if (stream_index == 1) { /* 第二路视频 */ }
    }

    // 防抖数据回调
    void OnGyroData(const std::vector<ins_camera::GyroData>& data) override {}

    // 曝光数据回调
    void OnExposureData(const ins_camera::ExposureData& data) override {}
};
```

1. 视频数据：小于 5.7K(5760×2280) 的预览流只有一路视频，大于等于 5.7K 才有两路。数据为 H.265 或 H.264 编码，可通过 **GetVideoEncodeType** 获取当前相机的实际编码格式。解码后的数据未拼接，是两个鱼眼图像。一般情况下预览流分辨率为 1920×960。
2. 委托实例创建后，通过 **SetStreamDelegate** 设置给相机实例。

```cpp
auto delegate = std::make_shared<TestStreamDelegate>();
camera->SetStreamDelegate(delegate);
```

#### 开启预览流

通过设置预览流参数并调用 **StartLiveStreaming** 开启预览。预览流分辨率建议使用 1920×960。

```cpp
ins_camera::LiveStreamParam param;
param.video_resolution = ins_camera::VideoResolution::RES_1920_960P30;
param.lrv_video_resulution = ins_camera::VideoResolution::RES_1920_960P30;
param.video_bitrate = 1024 * 1024 / 2;
param.enable_audio = false;
param.using_lrv = false;
if (cam->StartLiveStreaming(param)) {
    std::cout << "successfully started live stream" << std::endl;
}
```

#### 关闭预览流

通过 **StopLiveStreaming** 关闭预览流。

### 日志功能

#### 设置日志路径

设置 SDK 的日志文件路径，将日志信息保存到文件。

```cpp
void SetLogPath(const std::string& log_path);
```

#### 设置日志打印等级

设置 SDK 日志的打印等级。

```cpp
void SetLogLevel(LogLevel level);

// 公开日志等级枚举（ins_types.h）
enum LogLevel {
    VERBOSE = 0,  // 最详细，含每帧收发明细，刷屏量大，仅深度排查用
    INFO,         // 常规信息，含下载采样点等
    WARNING,      // 警告
    ERR,          // 错误（注意：是 ERR，不是 ERROR）
    FATAL,
};
```

> `SetLogLevel` / `SetLogPath` 应在 `Open()` 之前调用。

#### 获取相机日志路径

获取相机内部的日志路径，之后可通过下载接口把相机日志下载到本地。

```cpp
std::string GetCameraLogFileUrl() const;
```

### 其他

#### 获取相机 mediaTime

获取相机当前的 media 时间，可与录制文件尾部信息做时间同步。

```cpp
int64_t GetCameraMediaTime();
```

#### 同步本地时间到相机

```cpp
bool SyncLocalTimeToCamera(uint64_t utc_time, int32_t time_zone_offset_sec);
```

#### 机内拼接（X4 / X4 Air / X5 / X6）

控制机内拼接开关，开启后相机直出已拼接的素材。

```cpp
bool EnableInCameraStitching(bool enable);
```

#### 切换相机镜头 SetActiveSensor

```cpp
// SENSOR_DEVICE_FRONT (1)  切换到屏幕这边的镜头
// SENSOR_DEVICE_REAR  (2)  切换到屏幕后面的镜头
// SENSOR_DEVICE_ALL   (3)  切换到全景模式
camera->SetActiveSensor(ins_camera::SensorDevice::SENSOR_DEVICE_ALL);
```

#### 关闭相机（支持 X5 及之后机型）

```cpp
bool ShutdownCamera() const;
```

#### USB 断开后是否自动停止录制（目前限于 X4/X5 部分固件版本）

控制录制过程中 USB 断开后是否自动停止录制。默认关闭；开启后，若录制中 USB 断开则自动停止录制。

```cpp
void EnableAutoStopRecordAfterDisconnet(bool enable);
```

#### 存储位置（X6+）

获取和设置存储位置（内置存储 / SD 卡）。

```cpp
CardLocation GetStorageLocation() const;
bool SetStorageLocation(CardLocation location);
```

#### 格式化存储

发送格式化命令。X6+ 可指定存储位置；较老机型回退为格式化 SD 卡。X5 设备有格式化完成通知。

```cpp
bool FormatStorage(CardLocation location = CardLocation::STOR_CL_AUTO) const;
```

---

## 示例程序

SDK 附带 1 个统一示例程序 `CameraSDKDemo`，覆盖所有功能模块。源码位于 `example/CameraSDKDemo/`（公共辅助代码在 `example/common/`）。顶层菜单输入编号进入子模块，在子模块中输入 `0` 返回主菜单。

| 菜单           | 模块文件               | 演示的 SDK API                                                                 |
|----------------|------------------------|--------------------------------------------------------------------------------|
| 1: 拍照        | `photo.h`              | TakePhoto、StartHDRCapture、SetPhotoHdrMode、SetAebCaptureNum、SetAebExposureBias、SetPhotoSize、SetRawCaptureType、SetPhotoSubMode、SetPhotoSubModeTimer、GetSupportedPhotoSizes、GetSupportedAttrValues |
| 2: 录像        | `video.h`              | StartRecording、StopRecording、SetVideoCaptureParams、SetVideoSubMode、SetTimeLapseOption、StartTimeLapse、StopTimeLapse、GetSupportedVideoResolutions、GetSupportedAttrValues |
| 3: 曝光与设置  | `capture_settings.h`   | SetExposureSettings、GetExposureSettings、SetCaptureSettings、GetCaptureSettings、GetSupportedAttrNames、GetSupportedAttrValues、GetAttrDependOn、SetActiveSensor、EnableInCameraStitching |
| 4: 运行状态    | `status.h`             | GetBatteryStatus、CaptureCurrentStatus、IsConnected、GetCameraMediaTime         |
| 5: 文件与存储  | `file.h`               | GetCameraFilesList、DownloadCameraFile、DeleteCameraFile、GetStorageState、FormatStorage、GetStorageLocation、SetStorageLocation |
| 6: 实时预览    | `preview.h`            | StartLiveStreaming、StopLiveStreaming、SetStreamDelegate                        |
| 7: 系统        | `system.h`             | UploadFile、GetCameraLogFileUrl、ShutdownCamera、SyncLocalTimeToCamera、EnableAutoStopRecordAfterDisconnet |
| 8: 重连相机    | —                      | Close → DeviceDiscovery 重新检测 → Open（完整断连重联）                                                   |

### 代码结构

Demo 源码中，SDK API 调用与 Demo 交互逻辑（菜单/输入/输出）通过注释区分，客户只需关注 `=== SDK API ===` 标记的代码块：

```cpp
// === SDK API ===
auto es = cam->GetExposureSettings(fmode);    // 获取曝光设置
es->SetEVBias(-80);                            // 设 EV：-4 EV × 20 = -80
cam->SetExposureSettings(fmode, es);           // 下发到相机
// === /SDK API ===

// --- 以下为 demo 交互逻辑 ---
std::cout << "OK EV=-4" << std::endl;
```

### 运行

```bash
# Windows
.\bin\windows\RelWithDebInfo\CameraSDKDemo.exe

# Linux（需 sudo 获取 USB 权限）
sudo ./bin/linux/RelWithDebInfo/CameraSDKDemo
```

#### 命令行选项

| 选项                | 说明                                                                       |
|---------------------|----------------------------------------------------------------------------|
| `--en` / `--cn`     | 界面语言（默认中文）                                                       |
| `--debug`           | 开启调试日志。不带级别时等价于 `INFO`                                       |
| `--debug <级别>`    | 指定日志级别，`<级别>` ∈ `verbose` / `info` / `warning` / `error`（`debug` 等价 `verbose`） |
| `--log_file`        | 落日志到文件；不带路径时自动在 exe 目录下 `logs/<时间戳>.log` 生成          |
| `--log_file <路径>` | 落日志到指定文件                                                           |

> **日志级别默认值**：不加 `--debug` 时，SDK 日志级别为 `ERROR`（仅错误）；`--debug` 单独使用为 `INFO`（含下载采样点、write_some 卡顿告警等）；`--debug verbose` 会额外打印每帧收发明细，刷屏量大，仅深度排查时使用。

```bash
# 示例
CameraSDKDemo --cn                        # 中文界面，仅错误日志
CameraSDKDemo --debug --cn                # INFO 级别日志
CameraSDKDemo --debug verbose --log_file  # VERBOSE 级别，落时间戳日志文件
CameraSDKDemo --log_file my_test.log      # 仅错误日志，落到 my_test.log
```

## 运行发布包（拿到 tar.gz / zip 后）

解压后的目录结构见开头“包目录结构”。**先确认包的架构与你的机器匹配**：

```bash
file lib/libCameraSDK.so
# x86-64      -> 普通 64 位 Linux 主机
# ARM aarch64 -> ARM64 设备（树莓派/嵌入式板等），不能在 x86 机器上运行
```

### 直接运行预编译 demo

`bin/` 下的 demo 已设置 rpath(`$ORIGIN/../lib`)，在包根目录直接运行即可自动找到 `lib/` 下的库：

```bash
sudo ./bin/CameraSDKDemo --cn
```

如果把可执行文件单独拷到别处、或运行时报 `error while loading shared libraries: libCameraSDK.so`，用 `LD_LIBRARY_PATH` 指定库目录兜底：

```bash
sudo LD_LIBRARY_PATH=./lib ./bin/CameraSDKDemo --cn
```

### 集成到你自己的程序

```bash
g++ -std=c++11 your_app.cpp -Iinclude -Llib -lCameraSDK -pthread -o your_app
LD_LIBRARY_PATH=./lib ./your_app     # 或把 lib/ 装到系统库路径 / 用 -Wl,-rpath,'$ORIGIN/lib'
```

> 提示：Linux 下访问相机需要 USB 权限，且运行环境要有 USB 子系统。WSL2 默认无 USB（需 usbipd 直通），否则只能编译测试、连不到真机。

## API 速查表

### 拍照

| API | 说明 | 关键参数 |
|-----|------|---------|
| `TakePhoto(raw_type)` | 单拍 | raw_type: PureShot(3) / PureShot+RAW(4) |
| `StartHDRCapture(size, is_raw, aeb_num, ev_step, raw_type)` | HDR/AEB 拍摄 | is_raw=true→AEB；ev_step=EV×10 |
| `SetPhotoHdrMode(mode, type)` | HDR 档位 | OFF(0) / AUTO(1) / AEB(2) |
| `SetAebCaptureNum(mode, n)` | AEB 张数 | 3/5/7（查能力表） |
| `SetAebExposureBias(mode, ev)` | AEB 步长(EV) | 0.3~4.0（查能力表） |
| `SetPhotoSize(mode, size)` | 照片尺寸 | 查 GetSupportedPhotoSizes |
| `SetRawCaptureType(mode, type)` | 照片格式 | X5/X6 需在 TakePhoto 前预设 |
| `SetPhotoSubMode(mode)` | 切换子模式 | PHOTO_SINGLE/HDR/INTERVAL/BURST/STARLAPSE |
| `SetPhotoSubModeTimer(mode, sec)` | 倒计时 | 秒，0=关 |

### 录像

| API | 说明 | 关键参数 |
|-----|------|---------|
| `StartRecording()` / `StopRecording()` | 开始/停止录像 | StopRecording 返回 URL |
| `SetVideoCaptureParams(params, mode)` | 分辨率/码率 | 查 GetSupportedVideoResolutions |
| `SetVideoSubMode(mode)` | 切换子模式 | VIDEO_NORMAL/HDR/TIMELAPSE/TIMESHIFT/... |
| `SetTimeLapseOption(params)` | 延时参数 | mode + lapseTime(ms) + duration(s) |
| `StartTimeLapse(mode)` / `StopTimeLapse(mode)` | 开始/停止延时 | 需先 SetTimeLapseOption |

### 曝光

| API | 说明 | 编码 |
|-----|------|------|
| `GetExposureSettings(mode)` | 获取曝光设置 | 返回 ExposureSettings 对象 |
| `SetExposureSettings(mode, s)` | 应用曝光设置 | 先 Get → 修改 → Set |
| `ExposureSettings::SetExposureMode(m)` | 曝光模式 | AUTO(0)/ISO_PRIORITY(1)/SHUTTER_PRIORITY(2)/MANUAL(3)/ADAPTIVE(4)/FULL_AUTO(5) |
| `ExposureSettings::SetEVBias(v)` | EV 补偿 | **EV×20**（例：-4EV→-80，+3EV→60） |
| `ExposureSettings::SetIso(v)` | ISO | 需 MANUAL/ISO_PRIORITY 模式 |
| `ExposureSettings::SetShutterSpeed(v)` | 快门(秒) | 需 MANUAL/SHUTTER_PRIORITY 模式 |

### 画质（白平衡 / 亮度 / 对比度 / 饱和度 / 锐度）

这一组是影响画面**观感**的图像参数（区别于「曝光」里的 ISO / 快门 / EV）。所有参数都装在同一个 `CaptureSettings` 对象里，流程统一为「Get → 修改 → Set」。

| API | 说明 | 关键参数 |
|-----|------|---------|
| `GetCaptureSettings(mode)` | 获取当前画质设置 | 返回 CaptureSettings 对象 |
| `SetCaptureSettings(mode, s)` | 应用画质设置 | 先 Get → 修改 → Set |
| `CaptureSettings::SetWhiteBalance(wb)` | 白平衡预设 | WB_AUTO / WB_2700K / … / WB_10000K |
| `CaptureSettings::SetValue(type, v)` | 设置单项画质参数（下表） | 见下方取值范围 |

`SetValue(type, v)` 可设置的画质项与取值范围：

| type | 含义 | 取值范围 |
|------|------|---------|
| `CaptureSettings_Brightness` | 亮度 | -256 ~ 256 |
| `CaptureSettings_Contrast` | 对比度 | 0 ~ 256 |
| `CaptureSettings_Saturation` | 饱和度 | 0 ~ 256 |
| `CaptureSettings_Sharpness` | 锐度 | 0 ~ 6 |
| `CaptureSettings_WhiteBalance` | 白平衡（开尔文色温） | 如 5500（也可用 `SetWhiteBalance` 预设） |

### 能力表

| API | 说明 |
|-----|------|
| `GetSupportedPhotoModes()` | 相机支持的拍照模式列表 |
| `GetSupportedVideoModes()` | 相机支持的录像模式列表 |
| `GetSupportedPhotoSizes(mode)` | 某模式支持的照片尺寸 |
| `GetSupportedVideoResolutions(mode)` | 某模式支持的录像分辨率 |
| `GetSupportedAttrNames(mode)` | 某模式支持的全部属性名 |
| `GetSupportedAttrValues(mode, attr)` | 某属性的可选值 |
| `GetAttrDependOn(mode, attr)` | 某属性的依赖项 |
| `GetAttrValueByName(attr, name)` | 字符串→枚举值 |
| `GetSupportedAccelerateFrequencies(mode)` | 移动延时/延时加速倍数 |

### 状态

| API | 说明 |
|-----|------|
| `GetBatteryStatus(s)` | 电池电量/类型 |
| `GetStorageState(s)` | SD 卡状态/空间 |
| `CaptureCurrentStatus()` | 是否正在拍摄 |
| `IsConnected()` | 是否连接 |
| `GetCurrentFunctionMode()` | 当前功能模式 |
| `SyncPhotographyOptions(mode)` | 从相机强制刷新参数缓存 |

### 文件与存储

| API | 说明 |
|-----|------|
| `GetCameraFilesList()` / `GetCameraFilesCount(n)` | 列出/统计文件 |
| `DownloadCameraFile(remote, local, cb)` / `CancelDownload()` | 下载/取消 |
| `DeleteCameraFile(path)` | 删除文件 |
| `GetRecordingFiles(list)` | 正在录制的文件 |
| `FormatStorage(loc)` | 格式化存储 |
| `GetStorageLocation()` / `SetStorageLocation(loc)` | 存储位置（X6+） |

### 系统与生命周期

| API | 说明 |
|-----|------|
| `Camera(info)` / `Open()` / `Close()` | 构造/连接/断开 |
| `SetServicePort(port)` | 设置内部服务端口（Open 前，默认 9099） |
| `GetSDKVersion()` | SDK 版本号 |
| `SetLogPath()` / `SetLogLevel()` | 日志配置（Open 前） |
| `UploadFile(local, remote, cb)` | 上传固件 |
| `GetCameraLogFileUrl()` | 相机日志 URL |
| `ShutdownCamera()` | 关机（X5+） |
| `SyncLocalTimeToCamera(utc, offset)` | 同步时间 |
| `EnableAutoStopRecordAfterDisconnet(enable)` | 断连自动停录 |

### 通知回调

| API | 说明 |
|-----|------|
| `SetCaptureStateNotification(cb)` | 拍摄状态变化 |
| `SetCaptureStoppedNotification(cb)` | 拍摄异常停止(err_code+url) |
| `SetBatteryLowNotification(cb)` | 低电量警告 |
| `SetStorageFullNotification(cb)` | SD 卡满警告 |
| `SetTemperatureHighNotification(cb)` | 高温警告 |

### 编码速查

| 参数 | 编码方式 | 示例 |
|------|---------|------|
| EV 补偿 | EV × 20 | -4 EV → -80，+3 EV → 60 |
| AEB ev_step_tenths | EV × 10 | 1.0 EV → 10 |
| 延时 lapseTime | 毫秒 | 5 秒 → 5000 |
| 延时 duration | 秒 | 1 小时 → 3600 |
| 快门 | 秒(小数) | 1/60 → 0.01666… |
| 白平衡 | 开尔文 | 5500 |






