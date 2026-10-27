# 错误码速查表

本文档列出接入方在 **Android** 上实际可能收到的错误码，按「从哪里拿到」组织。

## 阅读须知

当前 SDK 通过 `Result<T>` 与 `InstaException` 子类传递错误。多数失败只给出异常类型与文案、不带数字；**整数错误码只出现在下列通道**：

| 你在哪里拿到 | 数字的取值来自 |
|---|---|
| `Result.onFailure` / `Callback.onThrowable` 里的 `NativeException.nativeErrorCode` | 连接、导出、拼接、播放器底层 |
| `DisconnectListener.onDisconnect(throwable)` 里的 `NativeException.nativeErrorCode` | 连接底层 |
| `BleWakeUpListener.onWakeUpError(errCode)` | 蓝牙广播 |
| `CameraLiveListener.onFailed(errorCode, message)` | 推流底层 |
| `CameraActivateException.code` | 激活后台 |
| `AiVoiceAssistantStatus.errorCode` | 相机上报的原始枚举值 |
| `HttpStatusException.code` / `FirmwareUpgradeHttpException.code` | HTTP 状态码，**不是**业务错误码 |

`TemplateOtherException`、`StitchSeparatedFisheyeException`、`GenerateHDRException`、`GeneratePureShotFailedException` 都继承 `NativeException`，其 `nativeErrorCode` 同样适用上表。

> **同一个数字在不同通道含义完全不同，不可跨通道对照。**
> 例如 `1002`：连接通道是「socket 收到脏数据」，推流通道是「音频滤镜录制失败」；`-1` 在扫描通道是「蓝牙未开启」，在推流通道是「推流模块未初始化」。排查时先确认码是从哪个回调出来的，再查对应章节。

---

## 一、相机连接

连接失败经 `CameraDevice.connect*()` 的 `Result.onFailure` / `Callback.onThrowable` 返回；连接建立后的强制断连经 `DisconnectListener.onDisconnect(throwable)` 返回。两者都是 `NativeException`，取 `nativeErrorCode`。

### 1.1 蓝牙连接失败（`100` ~ `140`）

| 错误码 | 解释 |
|---|---|
| 100 | 操作超时 |
| 101 | GATT 通用错误 |
| 102 | 其他错误 |
| 103 | 打开链路失败 |
| 104 | 同步包超时 |
| 105 | notify 订阅失败 |
| 106 | 设置 MTU 失败 |
| 107 | 写特征值失败 |
| 108 | 握手失败 |
| 109 | 唤醒授权失败 |
| 110 | 相机繁忙 |
| 133 | GATT 状态 133（系统层异常） |
| 134 | 找不到特征值 |
| 135 | 未分类异常 |
| 136 | 特权崩溃 |
| 137 | 经典蓝牙连接超时 |
| 138 | 经典蓝牙连接被取消 |
| 139 | 经典蓝牙配对失败 |
| 140 | 缺少 `BLUETOOTH_CONNECT` 运行时权限（重试无效，需引导用户授权） |

### 1.2 蓝牙扫描失败

| 错误码 | 解释 |
|---|---|
| -1 | 蓝牙未开启 |
| -2 | BLE Scanner 不可用 |
| -3 | App 内已在扫描中 |
| -4 | 缺少扫描权限 |
| -100 | 当前平台不支持 BLE 扫描 |
| 1 | 系统层已在扫描中 |
| 2 | 应用注册失败 |
| 3 | 内部错误 |
| 4 | 不支持 BLE 扫描特性 |
| 5 | 硬件资源不足 |
| 6 | 扫描过于频繁 |

### 1.3 USB / socket 连接失败与运行期断连

| 错误码 | 解释 |
|---|---|
| -19 | socket 操作超时 |
| -120 | USB 传输错误 |
| -121 | 未找到设备 / 设备已拔出 |
| -210 | socket 已关闭 |
| -211 | socket 读失败 |
| -212 | socket 写失败 |
| -213 | socket `fd_set` 失败 |
| -214 | socket 连接失败 |
| -503 | 相机繁忙 |
| -504 | 云上传占用中 |
| -505 | Wi-Fi 切换占用中 |
| 501 | 蓝牙链路断开 |
| 1001 | socket 设备忙 |
| 1002 | socket 收到脏数据，主动断开 |

> `-121` 同时覆盖「未找到设备」与「设备已拔出」两种情形，无法从码值区分。
> `501` 是连接建立后最常见的断连码，通常意味着相机侧蓝牙链路已断开，需要重新发起连接。

### 1.4 连接相关的类型化异常（不带数字）

以下失败只给异常类型与文案，`nativeErrorCode` 取不到，排查时按异常类型判断：

| 异常 | 含义 |
|---|---|
| `BleScanRejectException` | 蓝牙扫描被拒绝（蓝牙未开或扫描过于频繁） |
| `BleDeviceNotFoundException` | 附近没有可用的相机蓝牙设备 |
| `BleConnectRejectException` | 蓝牙连接被拒绝 |
| `BleScanningException` | 蓝牙正在扫描中 |
| `CameraConnectingException` | 相机正在连接，请勿重复发起 |
| `CameraTypeGetFailedException` | 无法获取相机类型 |
| `CameraTypeNotSupportException` | 不支持的相机类型 |
| `CameraOptionFetchException` | 无法获取相机参数 |

---

## 二、相机激活

激活失败经 `CameraActivateException.code` 返回，取值来自激活后台响应体中的 `code` 字段。

| 错误码 | 解释 |
|---|---|
| -1 | 响应体中未携带 `code` 字段 |
| 400 | 参数错误（相机类型或序列号未获取到） |
| 401 | 接口签名验证失败 |
| 402 | 数据加密验证失败 |
| 403 | nonce 凭证已被使用过 |
| 406 | timestamp 已过期 |
| 429 | 接口请求频繁 / 激活 IP 被限流（45 次/IP/天） |
| 500 | 系统内部异常 |
| 3001 | 设备序列号与设备类型不匹配 |
| 3002 | 相机已被激活 |
| 3003 | 拒绝激活：激活 IP 不在合法区域内 |
| 3004 | 无法生成可用序列号 |
| 3005 | 系统不支持激活该型号设备 |
| 3006 | 序列号被后台锁定，不允许激活 |

**注意以下三条不经过 `CameraActivateException` 的失败路径：**

- **HTTP 状态非 2xx** → `HttpStatusException`，其 `code` 是 HTTP 状态码，与上表不是一套取值，不要混查。
- **网络异常 / 请求超时** → 直接透传网络库异常，无 `code`。
- **序列号读取失败** → `OptionValueNullException("SERIAL_NUMBER")`，无 `code`。

---

## 三、蓝牙唤醒

唤醒失败经 `BleWakeUpListener.onWakeUpError(errCode)` 返回。

| 错误码 | 解释 |
|---|---|
| -99 | 当前机型不支持蓝牙广播唤醒（SDK 内部预判，未下发到系统） |
| -1 | 发起蓝牙广播时抛出异常 |
| 1 | 广播数据过大 |
| 2 | 广播数量超出系统上限 |
| 3 | 广播已在进行中 |
| 4 | 系统内部错误 |
| 5 | 当前设备不支持 BLE 广播 |

> **已知限制**：当系统蓝牙未开启或设备不支持 BLE 广播时，底层不会触发任何回调 —— 接入方既收不到成功也收不到失败。依赖该回调做超时兜底，不要只等回调。

---

## 四、拍摄失败

拍摄被相机自行终止时（超时长、存储满、卡速低、高温、低电量等），SDK 抛出 `CameraCaptureException`。

**该异常只带文案、不带任何数值字段**，接入方无法按错误码分支处理，只能按文案展示。文案是 SDK 根据相机上报的枚举翻译的英文串，例如：

| 相机上报的原因 | 异常文案 |
|---|---|
| 超过录制时长上限 | `Exceeding the maximum recording duration limit` |
| 存储满 | `Exceeding the maximum storage space limit` |
| 超过文件数上限 | `Exceeding the maximum file limit` |
| 存储卡写入速度过低 | `Storage card write speed is too low` |
| 编码异常 | `Muxer stream error and recording has been stopped` |
| 丢帧 | `Frame loss error occurred and recording has been stopped` |
| 电量低（录制中） | `The camera battery is too low and has stopped recording` |
| 温度过高（录制中） | `The camera temperature is too high and has been stopped` |
| 电量低无法开始录制 | `The camera battery is too low to start recording` |
| 存储不足无法开始录制 | `Insufficient storage space to start recording` |
| 温度过高无法开始录制 | `The camera temperature is too high to start recording` |
| 任务冲突 | `Task conflict, recording has been stopped` |
| 固件升级中禁止录制 | `Recording is prohibited during firmware upgrades` |
| P2P 中禁止录制 | `Recording is prohibited during P2P` |
| 其他 / 未覆盖的原因 | `Recording stopped due to an error` |

**两点需要注意：**

- 「超过录制时长上限」在部分机型配置下**不会产生任何回调**，拍摄静默结束。
- 相机上报 SDK 未收录的原因时（通常是相机固件比 SDK 新），会落到 `Recording stopped due to an error`，看不出具体原因。

另有若干拍摄失败路径把原生整数拼进了文案（形如 `Record video failed, code=xxx`），该整数来自原生事件、不是上表的枚举值，仅作参考。

---

## 五、固件升级

固件升级失败**不暴露整数错误码**，按异常类型区分：

| 异常 | 含义 |
|---|---|
| `FirmwareUpgradeLowBatteryException` | 相机电量低于升级所需阈值（异常携带所需电量百分比） |
| `FirmwareUpgradeChargeBoxLowBatteryException` | 充电盒电量低于升级所需阈值（异常携带所需电量百分比） |
| `FirmwareFileNotFoundException` | 固件文件不存在 |
| `FirmwareUpgradeHttpException` | 上传过程中 HTTP 状态异常（异常携带的 `code` 是 HTTP 状态码） |
| `FirmwareUpgradeIOException` | 上传过程中的 IO 异常 |
| `FirmwareUpgradeCancelException` | 升级被取消 |
| `FirmwareUpgradeUnknownException` | 其他未分类异常 |
| `CameraNotConnectedException` | 相机未连接 |

---

## 六、媒体 · 导出

导出失败经 `IExportCallback.onFail(throwable)` 返回。

### 6.1 模板相关具名异常（不带数字）

模板处理失败时抛出具名异常，`nativeErrorCode` 取不到，按异常类型判断：

| 异常 | 含义 |
|---|---|
| `TemplateInvalidFileTypeException` | 模板文件类型无效 |
| `TemplateInvalidOffsetException` | 模板 offset 无效 |
| `TemplateDownloadFailedException` | 模板下载失败 |
| `TemplateParseFailedException` | 模板 imageAsset 解析失败 |
| `TemplateInitFailedException` | 模板初始化失败 |
| `TemplateBlenderFailedException` | 模板混合图片失败 |

### 6.2 其他导出失败（`TemplateOtherException.nativeErrorCode`）

| 错误码 | 解释 |
|---|---|
| -31000 | 正在导出中 |
| -31011 | 加载防抖数据失败 |
| -31012 | 导出被 Work 引用释放终止 |
| -31016 | 导出后处理失败 |
| -31017 | 原始缩略图 LRV 缺失 |
| -31018 | 原始缩略图 LRV 加载失败 |
| -13016 | 导出超时 |
| -13021 | 打开硬件编码失败 |
| -13031 | 帧导出器准备失败 |
| -13033 | 反向解析视频失败 |
| -13034 | 双流帧格式不同 |
| -13036 | 视频帧率为 0 |
| -13037 | 视频码率为 0 |
| -13038 | 视频宽度为 0 |
| -13039 | 视频高度为 0 |
| -13041 | 视频源帧率为 0 |
| -13042 | 视频源时长为 0 |
| -13044 | 加载 AAA 参数失败 |
| -13045 | 创建降噪数据失败 |
| -13046 | 图片宽度为 0 |
| -13047 | 图片高度为 0 |
| -13048 | 导出 URL 为空 |

> 上表是导出链路会主动构造的码。**底层写入失败时导出回调会原样透传底层库的错误码**，因此也可能收到形如 `-5701110x`（编码器）、`-5701220x`（附加数据）以及底层音视频库的负值码（如 `-5`、`-22`），这类码的说明见「九、直播推流」一节 —— 两条链路共用同一套底层写入与编码组件。

### 6.3 转码 / 代理（播放器与导出共用）

| 错误码 | 解释 |
|---|---|
| -15062 | 转码未知错误 |
| -15063 | 转码重封装全景信息失败 |
| -15064 | 转码重封装全景信息重命名失败 |
| -15065 | 转码原始导出长度不为 1 |

### 6.4 取消不走 onFail

取消导出**不会**进入 `onFail`，而是回调 `IExportCallback.onCancel()`，因此下列码不会作为 `nativeErrorCode` 出现，看到 `onCancel` 即代表用户或业务主动取消：

`-13017`（取消导出）、`-31010`（加载额外信息取消）、`-31019`（视频转图片序列导出取消）

---

## 七、媒体 · 拼接

拼接与 PureShot 失败经 `Stitcher` 各方法的 `Result.onFailure` 返回。

| 异常 | 携带的码 | 含义 |
|---|---|---|
| `StitchSeparatedFisheyeException` | -35001 | 模板 offset 无效 |
| `StitchSeparatedFisheyeException` | -35004 | 模板初始化失败 |
| `StitchSeparatedFisheyeException` | -35005 | 模板混合图片失败 |
| `StitchSeparatedFisheyeException` | -35006 | 模板子 offset 合并失败 |
| `StitchSeparatedFisheyeException` | 其他 | 分离式鱼眼拼接失败，码由底层返回 |
| `GenerateHDRException` | 其他 | HDR 合成失败，码由底层返回 |
| `GeneratePureShotFailedException` | 其他 | PureShot 生成失败，码由算法层返回 |

以下失败**不带码**，按异常类型判断：

| 异常 | 含义 |
|---|---|
| `GeneratePureShotNotSupportException` | 当前素材不支持 PureShot |
| `GeneratePureShotModelFileMissingException` | 缺少 LUT 或模型文件（异常携带缺失的文件类型） |
| `StitchSeparatedFisheyeParamsException` | 素材中少于 2 个 URL，无法拼接 |

---

## 八、媒体 · 播放器

播放失败经 `PlayerViewListener.onFail(exception)` 返回，取 `NativeException.nativeErrorCode`。

### 8.1 SDK 播放器错误码

| 错误码 | 解释 |
|---|---|
| -10000 | 加载防抖数据失败 |
| -10001 | 播放器被 Work 引用释放终止 |
| -10003 | GPU 纹理尺寸不支持 |
| -10004 | 播放器初始化 flash 失败 |
| -10005 | 渲染环境无效 |
| -10006 | 录制回调状态点提供者为空 |
| -10008 | 播放器加载取消 |
| -10009 | 项目参数为空 |
| -10010 | 播放参数为空 |
| -10011 | 生命周期为空 |
| -20000 | 资源许可注册失败：线程被中断 |
| -20001 | 资源许可注册失败：等待超时 |
| -20002 | 资源许可注册被取消 |
| -23000 | Work GPS 数据加载失败 |
| -23002 | Work 额外数据加载失败 |
| -23003 | Work LRV 额外数据加载失败 |
| -23007 | 播放器加载提案失败 |
| -23008 | 导出用防抖数据加载失败 |
| -23009 | 预计算防抖数据无效 |
| -33004 | AI 分析被取消 |
| -33005 | AI 防抖数据加载失败 |
| -35000 | 模板文件类型无效 |
| -35001 | 模板 offset 无效 |
| -35002 | 模板下载失败 |
| -35003 | 模板 imageAsset 解析失败 |
| -35004 | 模板初始化失败 |
| -35005 | 模板混合图片失败 |

### 8.2 播放引擎底层错误码

以下为播放引擎原样上抛的错误码，是最常见的一类播放失败。表中是引擎已定义的取值，**引擎还可能上抛表外的码**。

| 错误码 | 解释 |
|---|---|
| -2 | 目录或文件不存在 |
| -5 | 传输错误（系统异常或 Wi-Fi 连接异常） |
| -12 | 内存不足 |
| -22 | 参数错误（视频损坏 / 代码逻辑问题 / Wi-Fi 意外中断） |
| -28 | 存储空间不足 |
| -101 | 网络不可用 |
| -104 | 连接被重置 |
| -110 | 连接超时（通常是相机侧问题） |
| -113 | 无法访问主机（未连相机 / DNS 异常 / 相机服务器不可达） |
| -1094995529 | 无效数据（视频损坏 / 编码格式不支持 / Wi-Fi 意外中断） |
| -1397312835 | 缓存校验失败，清除播放器缓存后可能恢复 |
| -542398533 | 底层或系统错误，通常是硬编解码器不支持 |
| -808465656 | 相机服务器返回 400 |
| -823242872 | 相机服务器返回 401 |
| -858797304 | 相机服务器返回 403 |
| -875574520 | 相机服务器返回 404 |
| -1482175736 | 相机服务器返回其他 4xx |
| -1482175992 | 相机服务器返回 5xx |
| -1128613112 | 不支持该文件格式的解码 |
| -1129203192 | 不支持该格式的编码 |
| -1296385272 | 不支持该文件格式的解析 |
| -57011001 | 视频编码格式不支持 |
| -57012103 | 无效 packet，文件可能损坏 |
| -57041001 | URL 协议不支持 |
| -57041002 | 底层库初始化失败（内部错误） |
| -57041003 | URL 格式不正确 |
| -57041004 | 所需功能未编译进底层库 |
| -57041005 | 无法解析代理主机 |
| -57041006 | 无法解析主机（云素材） |
| -57041007 | 无法连接远程主机或代理（云素材） |
| -57041008 | 服务器返回无法解析的响应 |
| -57041009 | 服务器拒绝远程访问（缺少权限） |
| -57041028 | 访问超时 |
| -57041035 | SSL/TLS 握手失败 |
| -57041047 | 重定向次数过多 |
| -57041052 | 服务器未返回任何数据 |
| -57041055 | 发送网络数据失败 |
| -57041056 | 接收网络数据失败 |
| -57041092 | HTTP/2 帧层流错误 |
| -57040000 ~ -57040999 | 该区间内任一值表示「服务器返回了对应的 HTTP 状态码」 |

---

## 九、直播推流

推流失败经 `CameraLiveListener.onFailed(errorCode, message)` 返回。`message` 是底层描述串，可一并展示。

| 错误码 | 解释 |
|---|---|
| -1 | 推流模块未初始化（未调用预览初始化 `preview.init()` 即发起推流） |
| -1001 | 音频滤镜发送失败 |
| -1002 | 音频滤镜录制失败 |
| -1003 | 音频滤镜打开失败 |
| 1000 | 写入器停止异常 |
| 1001 | 写入器未切换 |
| -57011101 | 编码器附加数据缺少起始码 |
| -57011102 | 找不到可用的编码器 |
| -57011103 | 打开编码器失败（硬编打开失败即此值） |
| -57011104 | 像素格式不匹配 |
| -57012201 | 写入器附加数据无效 |
| -57012202 | 写入器附加数据发生变化 |

除上表外，**RTMP 建连与推流阶段失败时会原样透传底层音视频库的错误码**（负值，无固定清单），例如 `-5`（IO / 传输错误）、`-22`（参数错误）这类底层错误码。这类码需要通过 `message` 与推流日志进一步定位。

> 硬编打开失败在支持软编的机型上会被 SDK 自动重试，只有软编仍失败才会回调接入方。

---

## 十、AI 语音助手

`AiVoiceAssistantStatus.errorCode` 是相机上报的原始值，**仅用于诊断**。

| 错误码 | 解释 |
|---|---|
| 0 | 无错误 |
| 1 | 未知错误 |
| 2 | 超时 |
| 3 | 检查失败 |
| 4 | 不支持 |
| 5 | 唤醒链路未就绪（未配对或尚未唤醒） |
| 6 | 用户未开启定位权限 |
| 7 | 用户网络环境差 |
| 8 | App 与大模型服务断联 |
| 9 | 用户未授权隐私协议 |
| 10 | 当前系统版本不满足功能最低要求 |
| 11 | 多次连接失败 |

> **非 0 不代表当前有故障。** 实测在语音助手正常运行（`state` 为运行中）时相机仍会上报 `5`，因为本 SDK 不建立唤醒链路，该值会长期停留在此，属预期而非故障。**只有 `state` 为出错态时才表示功能异常。**
>
> 相机上报本表未收录的新值（通常是固件比 SDK 新）时会读成 `0`，与「无错误」不可区分。
