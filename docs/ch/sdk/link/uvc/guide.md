# UVC Camera SDK 开发者指南

UVCCameraSDK 用于发现并控制通过 USB 连接的 Link 系列摄像头。
SDK 提供两类控制接口：一类负责通用 UVC 参数，另一类负责摄像头扩展功能，例如 AI 追踪、构图、
手势、音频、固件升级等。

## SDK 下载

SDK 源码与示例工程托管在 GitHub：**<https://github.com/Insta360Develop/Link-SDK>**

## 支持机型

| 型号 | 产品页 |
| --- | --- |
| Link | [Insta360 Link](https://www.insta360.com/product/insta360-link) |
| Link 2 | [Insta360 Link 2](https://www.insta360.com/product/insta360-link2) |
| Link 2C | [Insta360 Link 2C](https://www.insta360.com/product/insta360-link2) |
| Link 2 Pro | [Insta360 Link 2 Pro](https://www.insta360.com/product/insta360-link2-pro) |
| Link 2C Pro | [Insta360 Link 2C Pro](https://www.insta360.com/product/insta360-link2-pro) |

## 支持平台

Windows、macOS、Linux（Ubuntu 22.04）

## 1. 控制器说明

| 控制器 | 适用能力 |
| --- | --- |
| `UVCCameraController` | 用于设置 UVC 标准协议的参数 |
| `UVCCameraExtendController` | 用于控制 UVC 扩展协议的指令 |

## 2. 设备发现与控制器创建

1. 调用  uvc::GetUVCCameraList  枚举当前可用的 UVC 摄像头。发现结果为空时，优先检查
USB 数据线、供电、设备权限、系统设备列表和视频流占用情况。
2. 选定  UVCCameraInfo  后，用同一份设备信息创建标准控制器和扩展控制器。控制器生命周期应
跟随对象管理，并以同版本头文件和 Demo 的实际定义为准。


```cpp
1 #include <iostream>
2 #include <memory>
3 #include <vector>
4 #include <uvc_camera.h>
5
6 int main() {
7 std::vector<UVCCameraInfo> cameras;
8 uvc::GetUVCCameraList(cameras);
9
10 if (cameras.empty()) {
11 std::cerr << "No UVC camera found." << std::endl;
12 return 1;
13 }
14
15 // 仅用于最小示例。多设备应用应按序列号或其他稳定标识选择设备。
16 const UVCCameraInfo camera_info = cameras.front();
17
18 auto uvc_controller =
19 std::make_shared<uvc::UVCCameraController>(camera_info);
20
21 auto extend_controller =
22 std::make_shared<uvc::UVCCameraExtendController>(camera_info);
23
24 std::cout << "Camera controllers created successfully." << std::endl;
25 return 0;
26 }
```

## 3. UVC 标准控制：UVCCameraController

UVCCameraController  封装可通过 UVC 标准协议访问的摄像头参数。

### 3.1 获取相机支持的 MediaFormat 列表

获取可设置的分辨率、帧率组合。


```cpp
1 bool GetMediaFormatList(std::vector<UVCMediaFormat>& list);
```

### 3.2 Link 云台 Pan / Tilt / roll

以下接口仅用于 Insta360 Link 云台机型，可控制摄像头水平转动、垂直转动以及画面滚转角度。设置
前应先读取设备支持的范围和步长。

#### 3.2.1 绝对位置设置

绝对位置接口可将云台直接移动到指定位置，适用于固定机位或预设视角。目标值应处于设备返回的
有效范围内。


```cpp
1 // 设置前先查询设备返回的控制范围；设置值应位于 [min, max]，并按 step 递进。
2 struct CameraControlInfo {
3 long min;
4 long max;
5 long step;
6 long def;
7 long cur;
8 long flags;
9 };
10
11 CameraControlInfo pan, tilt;
12 uvc_controller->GetPanTiltAbsoluteRange(pan, tilt);// get
13
14 long pan_value = 50;
15 long tilt_value = 50;
16 uvc_controller->SetPanTiltAbsolute(pan_value, tilt_value); // set
```

#### 3.2.2 相对位置移动设置

相对移动接口通过方向和速度控制云台连续转动，适用于方向键或摇杆操作。操作结束、窗口失焦或
控制超时时，应发送  value=Stop ，避免云台持续移动。


```cpp

1 enum class CameraControlRelativeValue {
2 Stop = 0x00, // 停止
3 ClockwiseMove = 0x01, // 顺时针
4 AntiClockwiseMove = 0xFF // 逆时针
5 };
6
7 struct CameraControlRelativeInfo {
8 long speed; // 范围[1,10]
9 CameraControlRelativeValue value;
10 };
11
12 bool GetPanTiltRelative(CameraControlRelativeInfo& pan_info,

CameraControlRelativeInfo& tilt_info); // 获取 Pan/Tilt 当前相对移动方向和速度
13 bool SetPanTiltRelative(CameraControlRelativeInfo pan_info,CameraControlRelativeInfo tilt_info); // 设置 Pan/Tilt 相对移动方向和速度
```

#### 3.2.3 Roll

Roll 用于读取或设置设备支持的滚转位置。只有返回有效范围并成功执行接口的机型才应显示此功
能。


```cpp
1 // 设置前先查询设备返回的控制范围；设置值应位于 [min, max]，并按 step 递进。
2 bool GetRollAbsoluteRange(CameraControlInfo &info); // 获取 Roll 的控制范围、步

长、默认值和当前值
3
4 bool GetRollAbsolute(long &value); // 获取当前 Roll 绝对值
5
6 bool SetRollAbsolute(long value); // 设置 Roll 绝对值
```

### 3.3 对焦 Focus

支持自动对焦的设备可通过  EnableAutoFocus  切换模式。设置手动焦点前，应先关闭自动对焦并
读取焦点范围；重新开启自动对焦后，固件可能覆盖先前的手动值。


```cpp
1 // 设置前先查询设备返回的控制范围；设置值应位于 [min, max]，并按 step 递进。
2 bool GetFocusAbsoluteRange(CameraControlInfo& info); // 获取对焦范围、步长、默认

值和当前值
3
4 bool GetFocusAbsolute(long& value); // 获取当前手动对焦值

5 bool SetFocusAbsolute(long value); // 设置手动对焦值；通常应先关闭自动对焦
6
7 bool GetAutoFocusStatus(bool& enable); // 获取自动对焦是否启用
8 bool EnableAutoFocus(bool enable); // 开启或关闭自动对焦：true开启，false 关闭
```

### 3.4 变焦 Zoom

变焦接口用于读取和调整摄像头的画面缩放比例。设置前应查询设备支持的范围和步长，并确保传入
值处于有效范围内。


```cpp
1 // 设置前先查询设备返回的控制范围；设置值应位于 [min, max]，并按 step 递进。
2 bool GetZoomAbsoluteRange(CameraControlInfo& info); // 获取变焦范围、步长、默认值和

当前值
3
4 bool GetZoomAbsolute(long& value); // 获取当前变焦值
5 bool SetZoomAbsolute(long value); // 设置变焦值；数值应符合设备返回的范围和步长
```

### 3.5 曝光、抗闪烁与画质

#### 3.5.1 曝光/快门

快门速度属于手动曝光控制。建议先读取自动曝光状态；
如需设置快门，先关闭自动曝光，再从  GetShutterSpeedList  返回的列表中选择值。切回自动
曝光后，固件会重新接管快门。


```cpp
1 bool GetShutterSpeedList(std::vector<long>& list); // 获取设备支持的快门速度

值列表
2
3 bool GetShutterSpeed(long& value); // 获取当前快门速度值
4 bool SetShutterSpeed(long value); // 设置快门速度；应先关闭自动曝光并使用支持列表中的值
5
6 bool GetAutoExposureStatus(bool& enable); // 获取自动曝光是否启用

7 bool EnableAutoExposure(bool enable); // 开启或关闭自动曝光：true 开启，false 关闭
```

#### 3.5.2 抗闪烁

抗闪烁频率用于匹配当地电网或灯光频率。Linux 平台下不支持设置自动模式。


```cpp
1 enum class PowerLineFrequency {
2 FREQUENCY_NotUse = 0x00,
3 FREQUENCY_50HZ = 0x01,
4 FREQUENCY_60HZ = 0x02,
5 FREQUENCY_Auto = 0x03,
6 };
7 bool SetPowerLineFrequency(PowerLineFrequency value); // 设置抗闪烁模式
8 bool GetPowerLineFrequency(PowerLineFrequency& value); // 获取当前抗闪烁模式
```

#### 3.5.3 亮度、对比度、饱和度、锐度与白平衡

所有带范围查询的参数都应先读取范围，再把 UI 控件映射到  min~max  并按  step  对齐。
白平衡模式中  1  表示自动、 0  表示手动；设置色温前应切换到手动白平衡。


```cpp
1 // 设置前先查询设备返回的控制范围；设置值应位于 [min, max]，并按 step 递进。
2
3 // 亮度 (int16_t)
4 bool GetBrightnessRange(CameraControlInfo& info);
5 bool SetBrightnessValue(int16_t value);
6 bool GetBrightnessValue(int16_t& value);
7
8 // 对比度 (uint16_t)
9 bool GetContrastRange(CameraControlInfo& info);
10 bool SetContrastValue(uint16_t value);
11 bool GetContrastValue(uint16_t& value);
12
13 // 饱和度 (uint16_t)
14 bool GetSaturationRange(CameraControlInfo& info);
15 bool SetSaturationValue(uint16_t value);
16 bool GetSaturationValue(uint16_t& value);
17
18 // 锐度 (uint16_t)
19 bool GetSharpnessRange(CameraControlInfo& info);
20 bool SetSharpnessValue(uint16_t value);
21 bool GetSharpnessValue(uint16_t& value);

22
23 // 白平衡色温 (uint16_t)
24 bool GetWhitebalanceTemperatureRange(CameraControlInfo& info);
25 bool SetWhitebalanceTemperatureValue(uint16_t value);
26 bool GetWhitebalanceTemperatureValue(uint16_t& value);
27
28 // 白平衡模式（uint8_t）：0 = 手动，1 = 自动
29 bool GetWhitebalanceTemperatureMode(uint8_t& mode);
30 bool SetWhitebalanceTemperatureMode(uint8_t mode);
```

## 4. UVC 扩展控制：UVCCameraExtendController

### 4.1 设备信息

设备信息接口可用于识别机型、记录诊断上下文和展示固件版本。


```cpp
1 bool GetDeviceInfo(DeviceInfo& info); // uuid/sensorId/固件硬件版本等
2
3 bool GetSerialNumber(std::string& serialNo); // 序列号
4
5 bool GetPTZVersionInfo(PTZVerInfo& info); // 云台版本信息
6
7 bool GetCameraType(std::string& camera_type) const; // 相机类型字符串
8
9 uint16_t GetPID() const; // 设备 PID
10
11 bool GetDeviceStatus(DeviceStatus& status); // CPU/sensor 温度、码流/升级状态
12
13 bool GetCameraPlayRes(uint32_t& width, uint32_t& height, uint16_t& framerate);

// 获取当前视频流的宽度、高度和帧率
```

### 4.2 模式、构图与追踪

用于读取和切换相机的视频模式，包括普通模式、自动构图、白板、桌面俯拍和智能白板等。
还可以设置人物的构图范围，如头部、半身或全身，以及调整追踪速度、获取并选择追踪目标、设置
单人或多人追踪模式。不同模式和构图能力会因相机型号及固件版本而有所差异，调用时应检查接口
返回结果。

```cpp
1 enum class VideoMode {
2 Normal = 0x00, // 正常模式
3 AutoComposition = 0x01, // 自动构图模式
4 //Track = 0x02, // 跟踪模式
5 //Zoom = 0x03, // 放大模式
6 Whiteboard = 0x04, // 白板模式
7 Craneshot = 0x05, // 俯拍模式
8 DeskView = 0x06, // 桌面俯拍模式
9 AutoFraming = 0x07, // 多人自动构图
10 SmartWhiteboardMode = 0x08, // 智能白板
11 //RegionalTack = 0x09, // 区域追踪
12 SmartWhiteboardQuery = 0x0a // 智能白板查找中
13 //RegionalTackConfig = 0x0b // 区域追踪配置中
14 };
15
16
17 bool GetVideoMode(VideoMode& mode, VideoModeAuxiliaryData& extenddata); // 获取
当前视频模式及对应的辅助参数
18 bool SetVideoMode(VideoMode mode, const VideoModeAuxiliaryData& extenddata);
// 设置视频模式及该模式所需的辅助参数
19
20 bool SwitchNormalMode(); // 切换回普通 UVC 模式；调用会重启相机并中断当前视频流
21
22 //////////////////////构图
23 enum class CompositionStyle {
24 None = 0x00,
25 OnlyHead = 0x01, // 头部构图
26 HalfBody = 0x02, // 半身构图
27 FullBody = 0x03, // 全身构图
28 };
29 bool GetCompositionStyle(CompositionStyle& style); // 获取当前构图样式
30 bool SetCompositionStyle(CompositionStyle style); // 设置构图样式
31
32 ///////////////////////////跟踪
33 enum class TrackSpeed {
34 Fast = 0x00,
35 Normal = 0x01,
36 Slow = 0x02,
37 };
38 bool SetTrackSpeed(TrackSpeed speed); // 设置追踪速度
39 bool GetTrackSpeed(TrackSpeed& speed); // 获取当前追踪速度
40
41 bool GetTrackObjLists(std::vector<UVCRect>& objs); // 获取可选追踪目标列表（最
多 10 个人脸目标）
42 bool GetNewTrackObjLists(std::vector<UVCRect>& objs); // 新接口
43 bool SetTrackObj(const UVCRect& rect); // 使用归一化矩形选择追踪目标；坐标系见
UVCRect 说明

44
45 bool GetDefaultTrackMode(int& track_mode); // 获取默认追踪模式：0 = 单人，1 = 多
人
46 bool SetDefaultTrackMode(int track_mode); // 设置默认追踪模式：0 = 单人，1 = 多
人
```

### 4.3 手势控制

开启或关闭相机的手势识别功能，也可以单独控制某一种手势并查询当前开关状态。支持的手势可用
于控制 AI 追踪或自动构图、画面缩放和白板模式等功能。具体手势能力及默认状态可能因相机型号和
固件版本而异。
Gesture_Ok  和  Gesture_Rock  已废弃，当前不再支持，但为了保持协议枚举值兼容，仍保留
在枚举定义中，开发者不应调用。


```cpp
1 enum class Gesture {
2 Gesture_Ok = 0, // 已废弃，请勿使用
3 Gesture_Palm = 1, // 张开手掌手势
4 Gesture_L = 2, // L 手势
5 Gesture_V = 3, // V 手势
6 Gesture_Rock = 4, // 已废弃，请勿使用
7 };
8
9 bool EnableAllGesture(bool enable); // 设置手势识别总开关
10 bool EnableGestureWork(Gesture gesture, bool enable); // 设置单个手势开关
11 bool GetGestureStatus(std::map<Gesture, bool>& status); // 获取各手势的开关状态
```

### 4.4 画质增强与扩展调节

用于调整曝光补偿、ISO、滤镜、曝光曲线和补光灯等画面效果，也可开启或关闭 HDR、自动对焦、
镜像、竖屏及 AI 相关扩展功能。不同功能可能存在曝光模式、相机型号或固件版本限制，调用时应检
查接口返回结果。


```cpp
1 // from: -3
2 // to: 3
3 // stepSize: 0.30
4 bool GetExposureCompensation(float& value);

5 bool SetExposureCompensation(float value); // 曝光补偿
6
7 //100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000,

2500, 3200
8 bool GetISOValue(uint16_t& value);
9 bool SetISOValue(uint16_t value); // ISO
10
11 enum class FilterMode {
12 Standard = 0x00,
13 Reserved1 = 0x01,
14 Reserved2 = 0x02,
15 Portrait = 0x03,
16 Bright = 0x04,
17 Vintage1 = 0x05,
18 Vintage2 = 0x06,
19 Neon = 0x07,
20 Clear = 0x08
21 };
22 bool GetFilter(FilterMode& filterId);
23 bool SetFilter(FilterMode filterId); // 滤镜
24
25 typedef struct ExpouseCurve {
26 std::vector<uint16_t> data;
27 bool is_apply;
28 bool enable;
29 } ExpouseCurve;
30 bool GetExpouseCurve(ExpouseCurve& curve);
31 bool SetExpouseCurve(const ExpouseCurve& curve); // 曝光曲线
32
33 bool GetFillLightParam(int &white_blance, int &brigtness); // 补光灯参数
34
35 enum class ExtendFuction {
36 AiZoom, // 智能Zoom开关
37 AF, // 自动对焦开关
38 HDR, // HDR开关
39 Mirror, // 镜像翻转开关
40 Ai, // AI算法开关
41 VScreen, // 横竖屏开关
42 EnableStartupSetting, // 保存使能开关
43 EnableSingleTapTracking, // 掰轴跟踪开关
44 EnableTracking, // 触摸跟踪开关
45 SmartAdjustment, // 智能调整开关
46 ForcedVertical, // 强制竖拍开关
47 ExtremePrivacy, // 极致隐私开关
48 MirrorVertically, // 垂直镜像开关
49 LowResolution, // 低分辨率开关
50 TrackForbiddenArea, // 停追区域开关

51 AudioSystemVolume, // 音频系统音量开关
52 };
53 bool EnableExtendFuncWork(ExtendFuction func, bool enable); // 扩展功能开关
54 bool GetExtendFuncStatus(std::map<ExtendFuction, bool>& status);
```

### 4.5 音频设置

用于控制麦克风降噪，并根据使用场景切换音频采集或拾音方向模式。不同音频模式适用于近距离通
话、远距离会议、直播或人声聚焦等场景，具体支持情况取决于相机型号和固件版本。

#### 4.5.1 音频降噪开关


```cpp
1 bool EnableAudioNoiseReduction(bool enable);
2 bool GetAudioNoiseStatus(bool& enable);
```

#### 4.5.2 Link 2 / Link 2C 音频采集模式


```cpp
1 enum class AudioCaptureMode {
2 Near = 0x00, // 近场
3 Far = 0x01, // 远场
4 LiveBroadcast = 0x02 // 直播
5 };
6 AudioCaptureMode GetAudioCaptureMode();
7 bool SetAudioCaptureMode(AudioCaptureMode mode);
```

#### 4.5.3 Link 2 Pro / Link 2C Pro 音频方向模式


```cpp
1 enum class AudioDirectionMode {
2 Standard = 0x00, // 标准模式
3 Wide = 0x01, // 前向拾音
4 Focus = 0x02, // 人声聚焦
5 Music = 0x03 // 原声模式
6 };
7 AudioDirectionMode GetAudioDirectionMode();
8 bool SetAudioDirectionMode(AudioDirectionMode mode);
```


### 4.6 存储、隐私、画面方向与恢复出厂

用于切换 U 盘模式、控制隐私模式，以及设置横竖屏、低分辨率和水平校正等功能，也可以将相机恢
复至出厂设置。部分操作可能导致视频中断、设备重新连接或用戶设置被清除，调用前应做好状态保
存并提示用戶。


```cpp
1 bool SwitchStorageMode(); // 切换到 U 盘模式
2
3 bool SwitchMscReadOnlyClass(); // 切换到只读 U 盘模式
4
5 bool GetPrivacyMode(int& mode, bool& enable);
6 bool SetPrivacyMode(bool enable); // 隐私模式
7
8 bool EnableVerticalScreen(bool enable); // 竖屏开关（false=横屏 true=竖屏）
9
10 bool EnableLowResolution(bool enable); // 低分辨率开关
11
12 bool GetEnableHorizontalCorrection(bool& enable);
13 bool EnableHorizontalCorrection(bool enable); // 水平校正开关
14
15 bool LoadFactoryDefault(); // 恢复出厂设置
```

### 4.7 PTZ

PTZ 接口用于控制摄像头的水平位置、垂直位置和画面缩放。云台机型通过机械转动调整拍摄方向，
固定镜头机型则通过数字变焦和画面裁切实现类似效果，调用时应根据相机型号选择对应接口。

#### 4.7.1 云台 PTZ（Link / Link 2 / Link 2 Pro）

用于控制云台机型的水平和垂直转动，支持相对移动与绝对位置设置。

##### 相对位置移动

相对移动通过方向和速度控制云台持续转动，适用于方向键或摇杆操作。操作结束、窗口失焦或控制
超时时，应发送  Stop  指令，避免云台持续移动。


```cpp
1 //本节继续使用前文定义的 `CameraControlRelativeValue` 和

`CameraControlRelativeInfo`。
2 // 获取 Pan/Tilt 当前相对移动方向和速度

3 bool GetPanTiltRelative(CameraControlRelativeInfo& pan_info,CameraControlRelativeInfo& tilt_info);
4 // 设置 Pan/Tilt 相对移动方向和速度；停止时将对应轴的 value 设为 Stop
5 bool SetPanTiltRelative(CameraControlRelativeInfo pan_info,CameraControlRelativeInfo tilt_info);
```

##### 绝对位置

绝对位置接口用于读取或设置云台的目标角度，适用于固定机位和预设视角。接口值以角秒表示，
1° = 3600  角秒；设置时将角度乘以 3600，读取时除以 3600。Pan 的角度范围为
-145°~145° ，Tilt 为  -45°~90° 。


```cpp
1 // 系数为3600角秒，参考demo main.cc
2 // 原始值单位为 1/3600°（1 角秒）：原始值 = 角度 × 3600
3 // 角度范围：Pan [-145°, 145°]，Tilt [-45°, 90°]
4 // 原始值范围：Pan [-522000, 522000]，Tilt [-162000, 324000]
5 // 获取 Pan/Tilt 绝对位置原始值
6 bool GetPanTiltAbsoluteValue(int32_t& pan_value, int32_t& tilt_value);
7 // 设置 Pan/Tilt 绝对位置原始值
8 bool SetPanTiltAbsolute(int32_t pan_value, int32_t tilt_value);
```

#### 4.7.2 Host PTZ（Link 2C / Link 2C Pro）

固定镜头机型不具备机械云台，通过数字变焦和裁切实现重新构图。 HostPTZInfo  描述缩放比例、
裁切中心和交互步长。


```cpp
1 // 仅 zoomX/zoomY 使用归一化坐标：0~0xFFFF 对应 0.0~1.0，参考demo main.cc
2
3 struct HostPTZInfo {
4 uint16_t ratio; // Zoom 值；单位和范围以 SDK 定义为准
5 uint16_t zoomX; // 水平裁切中心：normalizedX × 65535
6 uint16_t zoomY; // 垂直裁切中心：normalizedY × 65535
7 uint8_t move_step; // 平移步长
8 uint8_t ratio_step; // 缩放步长
9 };
10 // 获取当前 Host PTZ 参数
11 bool GetHostPTZ(HostPTZInfo& host_ptz_info);
12
13 // 设置 Host PTZ 参数
14 bool SetHostPTZ(HostPTZInfo& host_ptz_info);
```


#### 4.7.3 其他


```cpp
1 bool GetRealZoomValue(uint16_t& zoom); // 实时变焦值
2 bool GetDrawBoxStatus(DrawBoxType& type, std::vector<DrawBoxInfo>& infos); //

框选状态
3
4 bool SetUDiskOpenCount(uint32_t count);
5 bool GetUDiskOpenCount(uint32_t& count); // U 盘打开次数
```

## 5. 固件升级

Linux 不支持固件升级功能，调用时会返回 false；
Windows 平台调用固件升级接口前必须安装  libusbK  驱动，并确认 SDK 能正常枚举和识别目标摄
像头。


```cpp
1 static bool FirmwareUpgrade(const UVCCameraInfo& info,
2 const std::string& file_path,
3 FirmwareUpgradeProgressCallBack callback);

推荐处理方式：
1. 在升级前读取并记录序列号、机型、PID、当前固件版本和供电/连接状态；
2. 校验文件存在、可读且属于目标机型；不要允许同一设备并发执行升级、U 盘切换、恢复出厂或其
他控制写入；
3. 同时检查函数返回值和回调状态。同步返回成功不应被当作“升级已完成”，最终结果以回调契约
为准；
4. 升级期间禁止断开 USB 或操作摄像头；主机侧还应避免退出进程、休眠或触发其他可能中断 USB
的操作；
5. 升级完成后读取固件版本确认结果；若升级导致设备断开或重新枚举，则先重新发现设备并创建控
制器。
```

## 6. macOS 热插拔监听

UVCCameraDeviceWatcher  仅在 macOS 生效，用于监听设备接入和移除。Windows 和 Linux
应使用各自平台的设备通知机制，或在合适的时间间隔重新调用设备枚举。


```cpp
1 uvc::UVCCameraDeviceWatcher watcher;
2
3 bool started = watcher.StartWatch(
4 [](DeviceWatcherEvent event, std::string device_name) {
5 if (event == DeviceWatcherEvent::USB_DEVICE_ADD) {
6 std::cout << "Device connected: " << device_name << std::endl;
7 } else if (event == DeviceWatcherEvent::USB_DEVICE_LEFT) {
8 std::cout << "Device disconnected: " << device_name << std::endl;
9 }
10 }
11 );
12
13 if (!started) {
14 std::cerr << "Failed to start device watcher." << std::endl;
15 }
16
17 // 应在应用退出或不再需要监听时调用。
18 // watcher.StopWatch();

使用时应保证 watcher 的生命周期覆盖监听期，并在应用退出前调用  StopWatch 。收到移除事件
后，应停止后续控制并释放与该设备关联的业务状态。
```

## 7. 推荐调用流程

1. 准备平台运行环境：加载与当前系统和架构匹配的 SDK 库，确认设备权限和 USB 数据连接。
2. 枚举设备：调用  uvc::GetUVCCameraList ；按稳定标识选择目标。
3. 创建控制器：使用同一个  UVCCameraInfo  创建标准控制器和扩展控制器。
4. 识别能力：读取相机类型、PID、序列号、固件版本和媒体格式；按机型隐藏不适用功能。
5. 读取当前状态：初始化 UI 前读取模式、自动曝光/白平衡/对焦、图像参数、音频和扩展开关状态。
6. 应用设置：先处理自动/手动模式，再设置依赖参数；数值先查范围，枚举先确认机型支持。
7. 启动视频采集：在平台采集框架中选择  GetMediaFormatList  返回的格式，处理设备占用和
带宽失败。
8. 串行处理控制命令：PTZ、追踪、模式、曝光和音频写入进入单一队列；为连续 PTZ 操作提供停止
和超时保护。

9. 处理重启与热插拔：模式重启、U 盘切换、升级、恢复出厂或拔插后重新读取状态；若设备发生断
开或重新枚举，则重新发现设备并重建控制器。
10. 退出：停止采集和 watcher，取消待执行命令，再释放控制器。
