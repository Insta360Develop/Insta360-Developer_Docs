# 版本记录

桌面端每次发布会同时提供 Windows 与 Linux 版本。若某一平台本次未更新,则会连同其上一次的更新记录一并列出。

## Camera SDK

### Windows V2.1.1 / Linux V2.1.1(最新)

**Windows V2.1.1**
1. 支持 X4 Air

**Linux V2.1.1**
1. 支持 X4 Air

### V2.0.2-build1(Windows & Linux)

1. 支持 Insta360 X5
2. 仅支持 GPU 拼接
3. 新增预览流拼接功能
4. 新增去紫边功能
5. 新增固件版本检测 API
6. 新增日志功能
7. 新增去频闪功能
8. 更新 AI 拼接模型,画质更佳
9. 完善错误码体系,提示更详细

## Media SDK

### Windows V3.1.3 / Linux V3.1.1(最新)

**Windows V3.1.0**(沿用)
1. 支持 X4 Air
2. 优化模型路径设置接口

**Linux V3.1.1**
1. 修复使用最新 NVIDIA 显卡驱动时硬件编码失败的问题

### Windows V3.1.0 / Linux V3.1.1

**Windows V3.1.0**
1. 支持 X4 Air
2. 优化模型路径设置接口

**Linux V3.1.1**
1. 支持 X4 Air
2. 优化模型路径设置接口

### V3.0.5-build1

**Windows V3.0.5-build1**
1. 修复短 Timelapse 片段导致的崩溃
2. 修复设置了 disable_cuda 参数后仍执行 CUDA 检测的问题

**Linux V3.0.5-build1**
1. Media SDK 现支持无头(headless)模式
2. 新增 SetImageProcessingAccelType 接口,解决缺少 GPU 支持导致的崩溃
3. 修复短 Timelapse 片段导致的崩溃
4. 修复导出图片序列时的崩溃
5. 修复在 AWS 云主机上应用消色差导致的崩溃
6. 修复设置了 disable_cuda 参数后仍执行 CUDA 检测的问题

### V3.0.1-build1(Windows & Linux)

1. 支持 Insta360 X5
2. 仅支持 GPU 拼接
3. 新增预览流拼接功能
4. 新增去紫边功能
5. 新增固件版本检测 API
6. 新增日志功能
7. 新增去频闪功能
8. 更新 AI 拼接模型,画质更佳
9. 完善错误码体系,提示更详细
