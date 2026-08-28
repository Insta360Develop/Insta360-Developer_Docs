# Camera SDK API Reference

## Overview

CameraSDK is used to connect to a camera, get/set camera parameters, control photo capture and recording, download files, and upgrade firmware (X4 and later only). The desktop SDK connects to cameras over USB only and targets B2B users.

- **Supported models**: ONE X, ONE R/RS, ONE X2, X3, X4, X4 Air, X5, X6.
- **Supported platforms**: Windows, Ubuntu 22.04 (x86-64 and aarch64).
- **Namespace**: all APIs live in `ins_camera`.

> This guide is organized around the "connect → operate → disconnect" flow: a quick start first, then each feature by category with its API and sample code. Most APIs are unchanged from the previous version; newly added capabilities (X6, capability table, 3A image quality, storage location, etc.) are labeled with the applicable models.

## Package layout

```
include/        Public headers (the API you compile against)
  camera/       camera.h, device_discovery.h, ins_types.h, photography_settings.h
  stream/       stream_delegate.h, stream_types.h
lib/            The CameraSDK shared library (.dll / .so)
bin/            Prebuilt example executable CameraSDKDemo
  jsons/        Camera capability table JSON files (offline fallback for X2/X3)
example/        Source code of the example program (see "Example program")
docs/           This document
```

Add `include/` to your compiler include path and link against the library in `lib/`.

## Quick start

```cpp
#include <camera/camera.h>
#include <camera/device_discovery.h>

int main() {
    // 1. Discover connected cameras
    ins_camera::DeviceDiscovery discovery;
    auto list = discovery.GetAvailableDevices();
    if (list.empty()) return -1;

    // 2. Open the first camera
    auto cam = std::make_shared<ins_camera::Camera>(list[0].info);
    if (!cam->Open()) return -1;
    discovery.FreeDeviceDescriptors(list);

    // 3. Take a photo
    auto url = cam->TakePhoto();
    if (!url.Empty()) {
        // url.GetSingleOrigin() is the file path on the camera
    }

    // 4. Close when done
    cam->Close();
    return 0;
}
```

## Usage

### Environment setup

#### Switch the camera to Android mode

By default, connecting an Insta360 camera to a computer puts it into mass-storage (USB drive) mode. You must switch it to the correct mode before you can connect and control it.

**For ONE X**
Upgrade to a special firmware, [download here](https://insta360-dev.oss-cn-hangzhou.aliyuncs.com/developer/releases/a33b3362-4767-47c3-ba9d-6ed07febb210.zip). After upgrading, go to Settings on the camera, find the USB option, and set it to **Android** mode.

**For ONE R/RS, ONE X2, X3**
Swipe down on the camera screen to open the main menu, go to "Settings" → "General", set USB mode to "Android" and USB drive mode to "Android".

**For X4 / X4 Air / X5 / X6**
Plug in the USB cable, then choose **Android** on the mode-selection dialog and wait for the switch to complete.

#### Driver installation

**On Linux**, make sure libusb is installed. Install it via yum or apt-get:

```bash
sudo apt-get install libusb-dev
sudo apt-get install libudev-dev
```

Or build from source:

```bash
wget http://sourceforge.net/projects/libusb/files/libusb-1.0/libusb-1.0.9/libusb-1.0.9.tar.bz2
tar xjf libusb-1.0.9.tar.bz2
cd libusb-1.0.9
./configure
make
sudo make install
```

After installing the driver, run `lsusb` to check the camera is detected. If you find a USB device with vendor ID `0x2e1a`, the driver is installed correctly.

**Note: on Linux the demo must be run with `sudo`**, for example:

```bash
sudo ./CameraSDKDemo   # for ubuntu
```

**On Windows**, make sure the libusbK driver is installed. You can install [libusbK](https://sourceforge.net/projects/libusbk/files/libusbK-release/3.0.7.0/) directly, or use [zadig](https://zadig.akeo.ie/) to help install it.

### Camera discovery

Camera discovery is done through **ins_camera::DeviceDiscovery**.

```cpp
// DeviceDescriptor holds a camera's basic info, used mainly for connecting
struct DeviceDescriptor {
    CameraType camera_type;    // camera type, e.g. X3 or X4
    std::string serial_number; // serial number
    std::string camera_name;   // camera name
    std::string fw_version;    // firmware version
    DeviceConnectionInfo info; // connection info (PC SDK is USB-only)
};

ins_camera::DeviceDiscovery discovery;
// discovered cameras are stored in this list
std::vector<DeviceDescriptor> list = discovery.GetAvailableDevices();
```

### Connect & disconnect

#### Create a camera instance

Once you have the camera info, create a control instance with **ins_camera::Camera** and a **DeviceDescriptor**.

```cpp
auto camera_info = list[0].info;
auto camera = std::make_shared<ins_camera::Camera>(camera_info);
```

#### Open the camera

```cpp
bool success = camera->Open();
if (!success) {
    std::cout << "failed to open camera" << std::endl;
    return -1;
}
```

> **Port conflict**: the SDK starts an internal HttpServer for file transfer, which may fail to start if the port is taken. Use **SetServicePort** to avoid this (default port `9099`). It must be called **before** `Open()`:
>
> ```cpp
> camera->SetServicePort(9199);
> camera->Open();
> ```

#### Disconnect and reconnect

Use **Close** to disconnect. You must also call `Close()` after an unexpected USB unplug before you can `Open()` again.

To reconnect, rerun device discovery and `Open`:

```cpp
camera->Close();
// Rediscover and open (DeviceDiscovery → Camera(info) → Open)
camera = std::make_shared<Camera>(new_device_info);
camera->Open();
```

The Demo menu item 8 "Reconnect Camera" wraps this flow: Close → rediscover → Open.

> Note: after a firmware upgrade, call Close, wait for the upgrade to finish, then recreate the camera instance.

```cpp
camera->Close();
```

#### Check connection state

Use **IsConnected** to check whether the camera is still connected.

> Note: avoid calling this while the camera is switching modes.

### Photo capture

#### Basic parameters

##### Set the photo sub-mode

Use **SetPhotoSubMode** to switch photo modes. The actual supported set depends on the camera UI.

```cpp
enum SubPhotoMode {
    PHOTO_SINGLE    = 0,  // single
    PHOTO_HDR       = 1,  // HDR
    PHOTO_INTERVAL  = 2,  // interval
    PHOTO_BURST     = 3,  // burst
    PHOTO_STARLAPSE = 7,  // starlapse
};

// Prefer querying the capability table for supported sub-modes:
// GetSupportedAttrValues(mode, "photo_sub_mode")

camera->SetPhotoSubMode(SubPhotoMode::PHOTO_SINGLE);
```

##### Set photo resolution

Use **SetPhotoSize** to set the photo resolution. Prefer querying **GetSupportedPhotoSizes** for the sizes the connected model actually supports, instead of hard-coding per model.

```cpp
// Recommended (capability-driven)
auto sizes = cam->GetSupportedPhotoSizes(function_mode);
if (!sizes.empty()) {
    cam->SetPhotoSize(function_mode, sizes[0]);  // use the first supported size
}
```

`SetPhotoSize` only accepts the photo-related modes of **CameraFunctionMode**; video modes are not supported.

```cpp
// Photo sizes
enum PhotoSize {
    Size_6912_3456  = 0,   // X3 18MP
    Size_5952_2976  = 12,  // X4 18MP
    Size_11968_5984 = 11,  // 72MP
    // ... other values in photography_settings.h
};

// Photo modes (CameraFunctionMode excerpt)
enum CameraFunctionMode {
    FUNCTION_MODE_NORMAL            = 0,   // default
    FUNCTION_MODE_INTERVAL_SHOOTING = 3,   // interval
    FUNCTION_MODE_BURST             = 5,   // burst
    FUNCTION_MODE_NORMAL_IMAGE      = 6,   // normal photo
    FUNCTION_MODE_HDR_IMAGE         = 8,   // HDR photo
    FUNCTION_MODE_AEB_NIGHT_IMAGE   = 13,
    FUNCTION_MODE_STARLAPSE_IMAGE   = 18,  // starlapse
    // ...
};

// Set normal-photo size to 72MP
camera->SetPhotoSize(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE, PhotoSize::Size_11968_5984);
```

##### Exposure

Exposure is stored in an **ExposureSettings** object holding ISO, shutter, exposure mode, and EV bias.

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

Use **GetExposureSettings** to read and **SetExposureSettings** to apply. The typical flow is "get → modify → set":

```cpp
const auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE;

// 1. Get current settings
auto exposure_settings = camera->GetExposureSettings(function_mode);

// 2. Modify
exposure_settings->SetExposureMode(ins_camera::PhotographyOptions_ExposureMode::MANUAL);
exposure_settings->SetEVBias(0);            // EV×20, range -80 ~ 80, default 0
exposure_settings->SetIso(800);             // requires MANUAL / ISO_PRIORITY
exposure_settings->SetShutterSpeed(1.0 / 120.0);  // seconds, requires MANUAL / SHUTTER_PRIORITY

// 3. Apply to camera
camera->SetExposureSettings(function_mode, exposure_settings);
```

> **Encoding**: `SetEVBias` takes EV×20 (e.g. -4EV → -80, +3EV → 60); `SetShutterSpeed` is in seconds (e.g. 1/60 → 0.01666…).

##### White balance

White balance and other image settings are stored in a **CaptureSettings** object; read with **GetCaptureSettings**, apply with **SetCaptureSettings**.

```cpp
const auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE;

// 1. Get current settings
auto capture_setting = camera->GetCaptureSettings(function_mode);

// 2. Read white balance
auto value = capture_setting->GetIntValue(
    ins_camera::CaptureSettings::SettingsType::CaptureSettings_WhiteBalance);

// 3. Set a white-balance preset
capture_setting->SetWhiteBalance(ins_camera::PhotographyOptions_WhiteBalance::WB_6500K);

// 4. Apply to camera
camera->SetCaptureSettings(function_mode, capture_setting);
```

Ranges for `CaptureSettings::SetValue(type, v)`: Brightness(-256~256), Contrast(0~256), Saturation(0~256), Sharpness(0~6), WhiteBalance(Kelvin).

##### 3A image-quality mode (X6 video modes only, handled internally)

> Skip this section for non-X6 models.

X6 video modes have NORMAL / PRO 3A image-quality modes. PRO unlocks ISO, shutter, white balance, and sharpness; those are not adjustable in NORMAL.

**The SDK handles this automatically — no manual call needed**: when you set sharpness, white balance, ISO, or shutter, the SDK switches to PRO automatically. To manually switch back to NORMAL, set `CaptureSettings_Iq3AMode` via `SetCaptureSettings`.

```cpp
// The SDK handles this internally; shown here only to illustrate:
// set sharpness → SDK auto-switches to PRO → set value → done

// To manually switch back to NORMAL (X6 only):
auto cs = cam->GetCaptureSettings(mode);
cs->SetValue(CaptureSettings::SettingsType::CaptureSettings_Iq3AMode, 1); // 1 = NORMAL
cam->SetCaptureSettings(mode, cs);

// Force-refresh settings from the camera
cam->SyncPhotographyOptions(mode);
```

#### Normal photo

```cpp
// 1. Set single-photo mode
camera->SetPhotoSubMode(SubPhotoMode::PHOTO_SINGLE);

// 2. Query photo size from the capability table instead of hard-coding
auto sizes = cam->GetSupportedPhotoSizes(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE);
if (!sizes.empty()) {
    cam->SetPhotoSize(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE, sizes[0]);
}

// 3. X5/X6: preset the photo format (see next section)
cam->SetRawCaptureType(CameraFunctionMode::FUNCTION_MODE_NORMAL_IMAGE, RawCaptureType::PureShotRaw);

// 4. Take the photo. raw_type may be passed here; for X5/X6 prefer SetRawCaptureType
auto url = camera->TakePhoto(RawCaptureType::PureShotRaw);
```

##### Photo format (X5/X6)

X5/X6 require presetting the photo format via **SetRawCaptureType** before `TakePhoto`; otherwise the camera may ignore the `raw_type` passed to `TakePhoto`. Query the capability table for supported formats.

```cpp
enum RawCaptureType {
    PureShot    = 3,  // PureShot
    PureShotRaw = 4,  // PureShot + RAW (saves JPG and DNG)
};

auto vals = cam->GetSupportedAttrValues(mode, "raw_capture_type");
cam->SetRawCaptureType(mode, RawCaptureType::PureShotRaw);
```

##### Self-timer (countdown)

```cpp
cam->SetPhotoSubModeTimer(SubPhotoMode::PHOTO_SINGLE, 5);  // 5-second countdown
int sec = cam->GetSelfTimer(mode);  // current countdown (seconds, 0 = off)
// Query supported values: GetSupportedAttrValues(mode, "photography_self_timer")
```

#### HDR photo

HDR capture is done via **StartHDRCapture**; you can also fine-tune HDR parameters first:

```cpp
cam->SetPhotoHdrMode(mode, PhotoHdrType::PHOTO_HDR_AUTO);  // OFF / AUTO / AEB
cam->SetAebCaptureNum(mode, 3);         // AEB frame count (3/5/7)
cam->SetAebExposureBias(mode, 1.0);     // AEB EV step
```

- On cameras before X3, capture yields 3, 5, 7, or 9 frames.
- On X4 and later, capture yields 1 already-HDR-fused frame, ready to stitch.

```cpp
auto sizes = cam->GetSupportedPhotoSizes(CameraFunctionMode::FUNCTION_MODE_HDR_IMAGE);
ins_camera::PhotoSize photo_size = sizes.empty() ? ins_camera::PhotoSize::Size_6912_3456 : sizes[0];

// StartHDRCapture(size, is_raw, aeb_num, ev_step_tenths, raw_type)
camera->StartHDRCapture(photo_size, false, 0, 0, RawCaptureType::PureShot);
```

### Recording

#### Basic parameters

##### Set the video sub-mode

Use **SetVideoSubMode** to switch video modes.

```cpp
enum SubVideoMode {
    VIDEO_NORMAL        = 0,   // normal
    VIDEO_BULLETTIME    = 1,   // bullet-time
    VIDEO_TIMELAPSE     = 2,   // timelapse
    VIDEO_HDR           = 3,   // HDR
    VIDEO_TIMESHIFT     = 4,   // timeshift
    VIDEO_LOOPRECORDING = 6,   // loop recording
    VIDEO_PURE          = 11,  // pure video (X6)
    VIDEO_DASH_CAM      = 14,  // dashcam (X6)
};

camera->SetVideoSubMode(SubVideoMode::VIDEO_NORMAL);
```

##### Set resolution

Use **SetVideoCaptureParams** to set recording parameters. It only accepts the video-related modes of **CameraFunctionMode**; photo modes are not supported.

```cpp
// Video modes (CameraFunctionMode excerpt)
enum CameraFunctionMode {
    FUNCTION_MODE_MOBILE_TIMELAPSE     = 2,   // mobile timelapse
    FUNCTION_MODE_NORMAL_VIDEO         = 7,   // normal video
    FUNCTION_MODE_HDR_VIDEO            = 9,   // HDR video
    FUNCTION_MODE_INTERVAL_VIDEO       = 10,  // interval video
    FUNCTION_MODE_STATIC_TIMELAPSE     = 11,  // static timelapse
    FUNCTION_MODE_TIMESHIFT            = 12,  // timeshift
    FUNCTION_MODE_LOOP_RECORDING_VIDEO = 17,  // loop recording
    FUNCTION_MODE_PURE_VIDEO           = 27,  // pure video (X6)
    FUNCTION_MODE_DASH_CAM             = 63,  // dashcam (X6)
};

// Recording params: resolution (incl. fps) + bitrate
struct RecordParams {
    VideoResolution resolution;
    int32_t bitrate{ 0 };
};

auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_VIDEO;
ins_camera::RecordParams record_params;
// Query supported resolutions instead of hard-coding
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) {
    record_params.resolution = resolutions[0];
}
// Bitrate is advisory; some tiers/models hard-code it, so it can be omitted
record_params.bitrate = 1024 * 1024 * 10;
if (!cam->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
}
```

##### Exposure / white balance

Same as photo capture — see [Exposure](#exposure) and [White balance](#white-balance), just use the corresponding video mode as `function_mode`.

#### Normal recording

##### Start

```cpp
// 1. Switch to normal video mode
bool ret = camera->SetVideoSubMode(ins_camera::SubVideoMode::VIDEO_NORMAL);
if (!ret) {
    std::cout << "change sub mode failed!" << std::endl;
    return;
}

// 2. Set resolution/fps/bitrate (query capability table)
auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_NORMAL_VIDEO;
ins_camera::RecordParams record_params;
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) record_params.resolution = resolutions[0];
record_params.bitrate = 1024 * 1024 * 10;  // advisory, can be omitted

if (!camera->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
} else {
    // 3. Start recording
    if (camera->StartRecording()) {
        std::cerr << "success!" << std::endl;
    } else {
        std::cerr << "failed to start recording" << std::endl;
    }
}
```

##### Stop

```cpp
auto url = cam->StopRecording();
if (url.Empty()) {
    std::cerr << "stop recording failed" << std::endl;
    return;
}
auto& origins = url.OriginUrls();
std::cout << "stop recording success" << std::endl;
for (auto& origin_url : origins) {
    std::cout << "url:" << origin_url << std::endl;
}
```

#### Timelapse recording

Common resolution-per-model mapping for timelapse (prefer **GetSupportedVideoResolutions** over this table):

|       | X6                | X5                | X4 Air            | X4                | X3                |
|-------|-------------------|-------------------|-------------------|-------------------|-------------------|
| 11K30 | RES_5632_5632P30  | RES_5632_5632P30  | -                 | RES_5632_5632P30  | -                 |
| 8K30  | RES_3840_3840P30  | RES_3840_3840P30  | RES_3840_3840P30  | RES_3840_3840P30  | RES_3840_3840P30  |

##### Start

```cpp
// 1. Switch to timelapse mode
bool ret = cam->SetVideoSubMode(ins_camera::SubVideoMode::VIDEO_TIMELAPSE);
if (!ret) {
    std::cout << "change sub mode failed!" << std::endl;
    return;
}

// 2. Set resolution/fps (query capability table)
auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_MOBILE_TIMELAPSE;
ins_camera::RecordParams record_params;
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) record_params.resolution = resolutions[0];
if (!cam->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
    return;
}

// 3. Set timelapse parameters
auto timelapse_mode = ins_camera::CameraTimelapseMode::MOBILE_TIMELAPSE_VIDEO;
// TimelapseParam{ mode, duration(s), lapseTime(ms), accelerate_fequency }
ins_camera::TimelapseParam param = { timelapse_mode, 10, 1000, 0 };
if (!cam->SetTimeLapseOption(param)) {
    std::cerr << "failed to set timelapse option." << std::endl;
} else {
    // 4. Start
    if (cam->StartTimeLapse(param.mode)) {
        std::cerr << "success!" << std::endl;
    } else {
        std::cerr << "failed to start timelapse" << std::endl;
    }
}
```

##### Stop

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

> **Encoding**: in `TimelapseParam`, `lapseTime` is in milliseconds (5 s → 5000), `duration` is in seconds (1 hour → 3600).

#### Timeshift recording (moving timelapse, recommended for X6)

Timeshift (moving timelapse) reuses the same APIs as timelapse (`SetTimeLapseOption` / `StartTimeLapse` / `StopTimeLapse`); the difference is the sub-mode **VIDEO_TIMESHIFT** and function mode **FUNCTION_MODE_TIMESHIFT**, with `accelerate_fequency` controlling the speed-up factor. **Timeshift is recommended on X6.**

```cpp
// 1. Switch to timeshift mode
if (!cam->SetVideoSubMode(ins_camera::SubVideoMode::VIDEO_TIMESHIFT)) {
    std::cout << "change sub mode failed!" << std::endl;
    return;
}

// 2. Set resolution/fps (query capability table)
auto function_mode = ins_camera::CameraFunctionMode::FUNCTION_MODE_TIMESHIFT;
ins_camera::RecordParams record_params;
auto resolutions = cam->GetSupportedVideoResolutions(function_mode);
if (!resolutions.empty()) record_params.resolution = resolutions[0];
if (!cam->SetVideoCaptureParams(record_params, function_mode)) {
    std::cerr << "failed to set capture settings." << std::endl;
    return;
}

// 3. Set moving-timelapse parameters (reuses TimelapseParam; set the speed-up factor)
ins_camera::TimelapseParam param;
param.mode = ins_camera::CameraTimelapseMode::MOBILE_TIMELAPSE_VIDEO;
param.duration = 0;   // 0 = unlimited
param.lapseTime = 0;  // Timeshift is driven by the speed-up factor; interval usually unused
// Prefer querying the capability table: GetSupportedAccelerateFrequencies(function_mode)
auto freqs = cam->GetSupportedAccelerateFrequencies(function_mode);
if (!freqs.empty()) param.accelerate_fequency = freqs[0];
if (!cam->SetTimeLapseOption(param)) {
    std::cerr << "failed to set timeshift option." << std::endl;
    return;
}

// 4. Start / stop (same as timelapse)
cam->StartTimeLapse(param.mode);
// ...
auto url = cam->StopTimeLapse(param.mode);
```

### Capability table query

The SDK reads the camera's `/CONF` JSON capability table to determine what a given model + mode actually supports, so you don't hard-code per model. All query APIs are available after `Open()`.

#### Query supported attributes of a mode

```cpp
auto attrs = cam->GetSupportedAttrNames(mode);
// e.g. ["exposure_bias", "exposure_iso", "white_balance", "iq_3a_mode", ...]
```

#### Query an attribute's dependencies

```cpp
auto deps = cam->GetAttrDependOn(mode, "exposure_iso");
// X6 video mode returns: ["iq_3a_mode"] → ISO depends on 3A mode (needs PRO)
```

#### Query an attribute's valid values

```cpp
// Default (no context)
auto vals = cam->GetSupportedAttrValues(mode, "exposure_iso");
// → ["100", "125", "160", ...]

// With context (X6: query values under PRO)
auto proVals = cam->GetSupportedAttrValues(mode, "exposure_iso", "PRO");
// PRO: ["100", "125", ...], NORMAL: ["0"]
```

#### Query supported photo sizes / video resolutions

```cpp
auto sizes = cam->GetSupportedPhotoSizes(mode);
auto resolutions = cam->GetSupportedVideoResolutions(mode);
```

#### Capability string → enum value

```cpp
int val = cam->GetAttrValueByName("raw_capture_type", "PURESHOT_RAW");
// returns 4 (RawCaptureType::PureShotRaw), or -1 if not found
```

### File info

#### File count

Use **GetCameraFilesCount** to get the number of recorded files on the SD card.

#### File list

Use **GetCameraFilesList** to list media on the SD card.

```cpp
auto file_list = camera->GetCameraFilesList();
for (const auto& file : file_list) {
    std::cout << file << std::endl;
}

// Example output:
// /DCIM/Camera01/VID_20250122_071405_00_001.insv
// /DCIM/Camera01/LRV_20250122_071405_01_001.lrv
// /DCIM/Camera01/VID_20250214_063916_00_002.insv
```

### Files currently being recorded

Use **GetRecordingFiles** to get the names of files currently being recorded.

### File download

#### Download a file

Use **DownloadCameraFile** to download existing media from the SD card to local. Progress is reported via a callback. This call is **synchronous** — it returns only after the download finishes or fails.

> Notes:
> 1. Make sure the local destination directory exists before downloading.
> 2. The SDK's internal HttpServer may hit a port conflict; call **SetServicePort** before **Open** to change the port (default 9099).

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

#### Cancel a download

Use **CancelDownload** to cancel an in-progress download.

### Delete a file

Use **DeleteCameraFile** to delete unwanted files from the SD card.

```cpp
const std::string camera_file = "/DCIM/Camera01/VID_20250122_071405_00_001.insv";
camera->DeleteCameraFile(camera_file);
```

### Firmware upgrade (X4 and later only)

Use **UploadFile** to upgrade firmware (X4 and later only). The remote firmware name is fixed by convention, e.g. `Insta360X4FW.bin`.

```cpp
// Remote firmware name (per model)
std::string firmware_name = "Insta360X4FW.bin";
if (camera_type == ins_camera::CameraType::Insta360X5) {
    firmware_name = "Insta360X5FW.bin";
}

const std::string local_file = "/path/to/firmware/Insta360X4FW.bin";

bool ret = cam->UploadFile(local_file, firmware_name,
    [](int64_t current, int64_t total_size) {
        std::cout << "current: " << current << "; total_size: " << total_size << std::endl;
    });

if (ret) {
    std::cout << "succeed to upload file!" << std::endl;
}

// After a successful upload you MUST close the camera; once it reboots and finishes
// upgrading, recreate the camera instance.
camera->Close();
```

### Status query

#### Battery status

Use **GetBatteryStatus** to get battery info (e.g. level).

```cpp
enum PowerType {
    BATTERY = 0,
    ADAPTER = 1,
};

struct BatteryStatus {
    PowerType power_type;   // power source
    uint32_t battery_level; // current level (0~100)
    uint32_t battery_scale; // unused
};

BatteryStatus status;
bool ok = camera->GetBatteryStatus(status);
```

#### SD card storage

Use **GetStorageState** to get SD card state and space.

```cpp
enum CardState {
    STOR_CS_PASS           = 0,  // usable
    STOR_CS_NOCARD         = 1,  // no card
    STOR_CS_NOSPACE        = 2,  // no free space
    STOR_CS_INVALID_FORMAT = 3,  // wrong format
    STOR_CS_WPCARD         = 4,
    STOR_CS_OTHER_ERROR    = 5,  // other error
};

struct StorageStatus {
    CardState state;
    uint64_t free_space;  // free space
    uint64_t total_space; // total space
};

StorageStatus status;
bool ok = camera->GetStorageState(status);
```

#### Current capture/recording status

Use **CaptureCurrentStatus** to check whether the camera is capturing or recording.

```cpp
if (camera->CaptureCurrentStatus()) {
    std::cout << "current status: capturing" << std::endl;
} else {
    std::cout << "current status: idle" << std::endl;
}
```

#### Camera notifications

These callbacks receive events pushed by the camera: low battery, SD card full, high temperature, and abnormal recording stop.

```cpp
void SetBatteryLowNotification(BatteryLowCallBack callback);          // low battery
void SetStorageFullNotification(StorageFullCallBack callback);        // SD card full
void SetCaptureStoppedNotification(CaptureStoppedCallBack callback);  // abnormal stop (err_code + url)
void SetTemperatureHighNotification(TemperatureHighCallBack callback);// high temperature
void SetCaptureStateNotification(CaptureStateCallBack callback);      // capture state change
```

### Live preview

#### Implement the stream delegate

Subclass **ins_camera::StreamDelegate** to receive raw video, audio, gyro, and exposure data.

```cpp
class TestStreamDelegate : public ins_camera::StreamDelegate {
public:
    // audio callback
    void OnAudioData(const uint8_t* data, size_t size, int64_t timestamp) override {}

    // video callback
    void OnVideoData(const uint8_t* data, size_t size, int64_t timestamp,
                     uint8_t streamType, int stream_index) override {
        if (stream_index == 0) { /* first video stream */ }
        if (stream_index == 1) { /* second video stream */ }
    }

    // gyro callback
    void OnGyroData(const std::vector<ins_camera::GyroData>& data) override {}

    // exposure callback
    void OnExposureData(const ins_camera::ExposureData& data) override {}
};
```

1. Video: a preview below 5.7K (5760×2280) has a single stream; 5.7K and above has two. Data is H.265 or H.264 — use **GetVideoEncodeType** to get the actual encoding. Decoded frames are unstitched dual-fisheye images. Preview resolution is typically 1920×960.
2. After creating a delegate instance, register it with **SetStreamDelegate**.

```cpp
auto delegate = std::make_shared<TestStreamDelegate>();
camera->SetStreamDelegate(delegate);
```

#### Start preview

Set the preview parameters and call **StartLiveStreaming**. A preview resolution of 1920×960 is recommended.

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

#### Stop preview

Use **StopLiveStreaming** to stop the preview.

### Logging

#### Set the log path

Set the SDK's log file path to persist log messages to a file.

```cpp
void SetLogPath(const std::string& log_path);
```

#### Set the log level

```cpp
void SetLogLevel(LogLevel level);

// Public log-level enum (ins_types.h)
enum LogLevel {
    VERBOSE = 0,  // most detailed; per-frame I/O, very noisy, deep debugging only
    INFO,         // general info, incl. download sampling points
    WARNING,      // warnings
    ERR,          // errors (note: ERR, not ERROR)
    FATAL,
};
```

> Call `SetLogLevel` / `SetLogPath` before `Open()`.

#### Get the camera log path

Get the camera's internal log path, then download it locally via the download API.

```cpp
std::string GetCameraLogFileUrl() const;
```

### Miscellaneous

#### Camera media time

Get the camera's current media time, for time-syncing with the trailer info of recorded files.

```cpp
int64_t GetCameraMediaTime();
```

#### Sync local time to the camera

```cpp
bool SyncLocalTimeToCamera(uint64_t utc_time, int32_t time_zone_offset_sec);
```

#### In-camera stitching (X4 / X4 Air / X5 / X6)

Toggle in-camera stitching; when on, the camera outputs already-stitched media.

```cpp
bool EnableInCameraStitching(bool enable);
```

#### Switch the active lens — SetActiveSensor

```cpp
// SENSOR_DEVICE_FRONT (1)  switch to the screen-side lens
// SENSOR_DEVICE_REAR  (2)  switch to the rear lens
// SENSOR_DEVICE_ALL   (3)  panorama mode
camera->SetActiveSensor(ins_camera::SensorDevice::SENSOR_DEVICE_ALL);
```

#### Power off the camera (X5 and later)

```cpp
bool ShutdownCamera() const;
```

#### Auto-stop recording on USB disconnect (limited to some X4/X5 firmware)

Controls whether recording auto-stops when USB disconnects during recording. Off by default; when on, a USB disconnect during recording stops the recording.

```cpp
void EnableAutoStopRecordAfterDisconnet(bool enable);
```

#### Storage location (X6+)

Get and set the storage location (internal storage / SD card).

```cpp
CardLocation GetStorageLocation() const;
bool SetStorageLocation(CardLocation location);
```

#### Format storage

Send a format command. X6+ can specify the location; older models fall back to formatting the SD card. X5 devices emit a format-complete notification.

```cpp
bool FormatStorage(CardLocation location = CardLocation::STOR_CL_AUTO) const;
```

---

## Example program

The SDK ships one unified example program `CameraSDKDemo` covering all feature modules. Source is under `example/CameraSDKDemo/` (shared helpers under `example/common/`). Enter a number at the top menu to enter a sub-module; enter `0` in a sub-module to return.

| Menu               | Source                 | SDK APIs demonstrated                                                          |
|--------------------|------------------------|--------------------------------------------------------------------------------|
| 1: Photo           | `photo.h`              | TakePhoto, StartHDRCapture, SetPhotoHdrMode, SetAebCaptureNum, SetAebExposureBias, SetPhotoSize, SetRawCaptureType, SetPhotoSubMode, SetPhotoSubModeTimer, GetSupportedPhotoSizes, GetSupportedAttrValues |
| 2: Video           | `video.h`              | StartRecording, StopRecording, SetVideoCaptureParams, SetVideoSubMode, SetTimeLapseOption, StartTimeLapse, StopTimeLapse, GetSupportedVideoResolutions, GetSupportedAttrValues |
| 3: Capture settings| `capture_settings.h`   | SetExposureSettings, GetExposureSettings, SetCaptureSettings, GetCaptureSettings, GetSupportedAttrNames, GetSupportedAttrValues, GetAttrDependOn, SetActiveSensor, EnableInCameraStitching |
| 4: Status          | `status.h`             | GetBatteryStatus, CaptureCurrentStatus, IsConnected, GetCameraMediaTime         |
| 5: File & storage  | `file.h`               | GetCameraFilesList, DownloadCameraFile, DeleteCameraFile, GetStorageState, FormatStorage, GetStorageLocation, SetStorageLocation |
| 6: Live preview    | `preview.h`            | StartLiveStreaming, StopLiveStreaming, SetStreamDelegate                        |
| 7: System          | `system.h`             | UploadFile, GetCameraLogFileUrl, ShutdownCamera, SyncLocalTimeToCamera, EnableAutoStopRecordAfterDisconnet |
| 8: Reconnect       | —                      | Close → DeviceDiscovery → Open (full disconnect & reconnect)                                               |

### Code structure

In the demo source, SDK API calls are separated from demo UI logic (menu/input/output) by comment markers. Customers only need to focus on the `=== SDK API ===` blocks:

```cpp
// === SDK API ===
auto es = cam->GetExposureSettings(fmode);    // get exposure settings
es->SetEVBias(-80);                            // set EV: -4 EV × 20 = -80
cam->SetExposureSettings(fmode, es);           // apply to camera
// === /SDK API ===

// --- demo UI logic below ---
std::cout << "OK EV=-4" << std::endl;
```

### Running

```bash
# Windows
.\bin\windows\RelWithDebInfo\CameraSDKDemo.exe

# Linux (needs sudo for USB permissions)
sudo ./bin/linux/RelWithDebInfo/CameraSDKDemo
```

#### Command-line options

| Option              | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `--en` / `--cn`     | UI language (default Chinese)                                               |
| `--debug`           | Enable debug logging. Without a level, equivalent to `INFO`                 |
| `--debug <level>`   | Set the level; `<level>` ∈ `verbose` / `info` / `warning` / `error` (`debug` = `verbose`) |
| `--log_file`        | Log to a file; without a path, auto-generates `logs/<timestamp>.log` next to the exe |
| `--log_file <path>` | Log to the given file                                                       |

> **Default level**: without `--debug`, the SDK log level is `ERROR` (errors only); `--debug` alone is `INFO` (incl. download sampling points and write_some stall warnings); `--debug verbose` additionally prints per-frame I/O — very noisy, for deep debugging only.

```bash
# Examples
CameraSDKDemo --en                        # English UI, errors only
CameraSDKDemo --debug --en                # INFO level
CameraSDKDemo --debug verbose --log_file  # VERBOSE, to a timestamped log file
CameraSDKDemo --log_file my_test.log      # errors only, to my_test.log
```

## Running the release package (after unpacking tar.gz / zip)

The unpacked layout is shown in "Package layout" above. **First confirm the package architecture matches your machine:**

```bash
file lib/libCameraSDK.so
# x86-64      -> a regular 64-bit Linux host
# ARM aarch64 -> an ARM64 device (Raspberry Pi / embedded board); will NOT run on an x86 host
```

### Run the prebuilt demo

The demo in `bin/` has an rpath of `$ORIGIN/../lib`, so from the package root it locates `lib/` automatically:

```bash
sudo ./bin/CameraSDKDemo --en
```

If you copy the executable elsewhere, or you see `error while loading shared libraries: libCameraSDK.so`, set `LD_LIBRARY_PATH`:

```bash
sudo LD_LIBRARY_PATH=./lib ./bin/CameraSDKDemo --en
```

### Integrate into your own program

```bash
g++ -std=c++11 your_app.cpp -Iinclude -Llib -lCameraSDK -pthread -o your_app
LD_LIBRARY_PATH=./lib ./your_app     # or install lib/ system-wide, or link with -Wl,-rpath,'$ORIGIN/lib'
```

> Note: accessing a camera on Linux needs USB permissions and a working USB subsystem. WSL2 has no USB by default (needs usbipd passthrough), so there you can only build/link-test, not connect a real camera.

## API quick reference

### Photo

| API | Description | Key params |
|-----|------------|------------|
| `TakePhoto(raw_type)` | Single shot | raw_type: PureShot(3) / PureShot+RAW(4) |
| `StartHDRCapture(size, is_raw, aeb_num, ev_step, raw_type)` | HDR/AEB capture | is_raw=true→AEB; ev_step=EV×10 |
| `SetPhotoHdrMode(mode, type)` | HDR mode | OFF(0) / AUTO(1) / AEB(2) |
| `SetAebCaptureNum(mode, n)` | AEB shot count | 3/5/7 (check capability table) |
| `SetAebExposureBias(mode, ev)` | AEB EV step | 0.3~4.0 (check capability table) |
| `SetPhotoSize(mode, size)` | Photo resolution | Use GetSupportedPhotoSizes |
| `SetRawCaptureType(mode, type)` | Photo format | X5/X6: preset before TakePhoto |
| `SetPhotoSubMode(mode)` | Switch sub-mode | PHOTO_SINGLE/HDR/INTERVAL/BURST/STARLAPSE |
| `SetPhotoSubModeTimer(mode, sec)` | Self-timer | seconds, 0=off |

### Video

| API | Description | Key params |
|-----|------------|------------|
| `StartRecording()` / `StopRecording()` | Start/stop | StopRecording returns URL |
| `SetVideoCaptureParams(params, mode)` | Resolution/bitrate | Use GetSupportedVideoResolutions |
| `SetVideoSubMode(mode)` | Switch sub-mode | VIDEO_NORMAL/HDR/TIMELAPSE/TIMESHIFT/... |
| `SetTimeLapseOption(params)` | Timelapse params | mode + lapseTime(ms) + duration(s) |
| `StartTimeLapse(mode)` / `StopTimeLapse(mode)` | Start/stop timelapse | Call SetTimeLapseOption first |

### Exposure

| API | Description | Encoding |
|-----|------------|----------|
| `GetExposureSettings(mode)` | Get exposure settings | Returns ExposureSettings |
| `SetExposureSettings(mode, s)` | Apply exposure settings | Get → modify → Set |
| `ExposureSettings::SetExposureMode(m)` | Exposure mode | AUTO(0)/ISO_PRIORITY(1)/SHUTTER_PRIORITY(2)/MANUAL(3)/ADAPTIVE(4)/FULL_AUTO(5) |
| `ExposureSettings::SetEVBias(v)` | EV compensation | **EV×20** (e.g. -4EV→-80, +3EV→60) |
| `ExposureSettings::SetIso(v)` | ISO | Requires MANUAL/ISO_PRIORITY |
| `ExposureSettings::SetShutterSpeed(v)` | Shutter (seconds) | Requires MANUAL/SHUTTER_PRIORITY |

### Image quality (white balance / brightness / contrast / saturation / sharpness)

This is the group of image parameters that affect the **look** of the picture (as opposed to ISO / shutter / EV under "Exposure"). They all live in one `CaptureSettings` object; the flow is always "Get → modify → Set".

| API | Description | Key params |
|-----|------------|------------|
| `GetCaptureSettings(mode)` | Get current image settings | Returns CaptureSettings |
| `SetCaptureSettings(mode, s)` | Apply image settings | Get → modify → Set |
| `CaptureSettings::SetWhiteBalance(wb)` | White-balance preset | WB_AUTO / WB_2700K / … / WB_10000K |
| `CaptureSettings::SetValue(type, v)` | Set a single image param (below) | See ranges below |

Values settable via `SetValue(type, v)`:

| type | Meaning | Range |
|------|---------|-------|
| `CaptureSettings_Brightness` | Brightness | -256 ~ 256 |
| `CaptureSettings_Contrast` | Contrast | 0 ~ 256 |
| `CaptureSettings_Saturation` | Saturation | 0 ~ 256 |
| `CaptureSettings_Sharpness` | Sharpness | 0 ~ 6 |
| `CaptureSettings_WhiteBalance` | White balance (color temperature) | e.g. 5500 (or use `SetWhiteBalance` presets) |

### Capability table

| API | Description |
|-----|------------|
| `GetSupportedPhotoModes()` | Supported photo modes |
| `GetSupportedVideoModes()` | Supported video modes |
| `GetSupportedPhotoSizes(mode)` | Supported photo sizes per mode |
| `GetSupportedVideoResolutions(mode)` | Supported video resolutions per mode |
| `GetSupportedAttrNames(mode)` | All attribute names per mode |
| `GetSupportedAttrValues(mode, attr)` | Valid values for an attribute |
| `GetAttrDependOn(mode, attr)` | Dependency attributes |
| `GetAttrValueByName(attr, name)` | String → enum value lookup |
| `GetSupportedAccelerateFrequencies(mode)` | Timelapse/mobile-timelapse speed multipliers |

### Status

| API | Description |
|-----|------------|
| `GetBatteryStatus(s)` | Battery level/type |
| `GetStorageState(s)` | SD card state/space |
| `CaptureCurrentStatus()` | Is the camera capturing? |
| `IsConnected()` | Is the camera connected? |
| `GetCurrentFunctionMode()` | Current function mode |
| `SyncPhotographyOptions(mode)` | Force-refresh settings cache from camera |

### Files & storage

| API | Description |
|-----|------------|
| `GetCameraFilesList()` / `GetCameraFilesCount(n)` | List / count files |
| `DownloadCameraFile(remote, local, cb)` / `CancelDownload()` | Download / cancel |
| `DeleteCameraFile(path)` | Delete a file |
| `GetRecordingFiles(list)` | Files being recorded |
| `FormatStorage(loc)` | Format storage |
| `GetStorageLocation()` / `SetStorageLocation(loc)` | Storage location (X6+) |

### System & lifecycle

| API | Description |
|-----|------------|
| `Camera(info)` / `Open()` / `Close()` | Construct / connect / disconnect |
| `SetServicePort(port)` | Set internal service port (before Open, default 9099) |
| `GetSDKVersion()` | SDK version string |
| `SetLogPath()` / `SetLogLevel()` | Logging config (before Open) |
| `UploadFile(local, remote, cb)` | Upload firmware |
| `GetCameraLogFileUrl()` | Camera log URL |
| `ShutdownCamera()` | Power off (X5+) |
| `SyncLocalTimeToCamera(utc, offset)` | Sync time |
| `EnableAutoStopRecordAfterDisconnet(enable)` | Auto-stop on disconnect |

### Notifications

| API | Description |
|-----|------------|
| `SetCaptureStateNotification(cb)` | Capture state changed |
| `SetCaptureStoppedNotification(cb)` | Capture stopped abnormally (err_code+url) |
| `SetBatteryLowNotification(cb)` | Low battery warning |
| `SetStorageFullNotification(cb)` | SD card full warning |
| `SetTemperatureHighNotification(cb)` | High temperature warning |

### Encoding quick reference

| Parameter | Encoding | Example |
|-----------|----------|---------|
| EV bias | EV × 20 | -4 EV → -80, +3 EV → 60 |
| AEB ev_step_tenths | EV × 10 | 1.0 EV → 10 |
| Timelapse lapseTime | milliseconds | 5 s → 5000 |
| Timelapse duration | seconds | 1 hour → 3600 |
| Shutter speed | seconds (float) | 1/60 → 0.01666… |
| White balance | Kelvin | 5500 |






