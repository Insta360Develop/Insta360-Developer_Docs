# Media SDK API Reference

## Overview

InsMediaSDK provides stitching and processing capabilities for Insta360 panoramic camera footage, supporting image stitching, video stitching, and real-time stitching. Currently supported camera models include ONE X, ONE R/RS (standard fisheye and 1-inch fisheye), ONE X2, X3, X4, X4 Air, X5, X6, and other panoramic camera footage, with support for video export and image export. Supported platforms are primarily Windows and Ubuntu 22.04.

The SDK is distributed as a dynamic library (.dll / .so), together with two sample programs:

- **MediaSDKTest** — Offline stitching test (supports video/image/batch)
- **RealTimeStitcherSDKTest** — Real-time stitching test

For usage of specific interfaces, refer to `example/main.cc` in the SDK.

### Notes

> The SDK requires all file path character encoding to be UTF-8.

> When using an NVIDIA graphics card, the driver version must be ≥ 470.

> Testing on Ubuntu under WSL on Windows is not supported.

---

## Platform Support

| Platform | Architecture | Build Tool | Dependencies |
|------|------|----------|------|
| Windows 10+ | x64 | Visual Studio 2019 | CUDA 10.2, Conan 2 |
| Ubuntu 22.04 | x64 | GCC 11+ | CUDA 11.7, Conan 2 |

---

## Quick Start

### Windows

```
SDKRelease/MediaSDK/MediaSDK-<version>-<date>-win64/
├── bin/
│   ├── MediaSDK.dll              # SDK dynamic library
│   ├── MediaSDKTest.exe          # Offline stitching test program
│   ├── RealTimeStitcherSDKTest.exe
│   ├── CameraSDK.dll             # Camera connection library (needed for real-time stitching)
│   ├── models/                   # Algorithm model files (required)
│   └── *.dll                     # Runtime dependencies (opencv/cuda/VC++ runtime, etc.)
├── lib/
│   └── MediaSDK.lib              # Development link library
├── include/stitcher/
│   ├── ins_common.h
│   ├── ins_stitcher.h
│   └── ins_realtime_stitcher.h
└── example/
    ├── main.cc                   # MediaSDKTest source
    └── realtime_stitcher_demo.cc # RealTimeStitcherSDKTest source
```

### Linux

Delivered tarball `MediaSDK-<version>-<date>-linux64.tar.gz`:
```
MediaSDK-<version>-<date>-linux64/
├── MediaSDK-<version>-linux-amd64.deb   # Single self-contained install package
├── include/
│   ├── ins_common.h
│   ├── ins_stitcher.h
│   └── ins_realtime_stitcher.h
├── example/
│   ├── main.cc
│   └── realtime_stitcher_demo.cc
└── README.txt
```

After `sudo dpkg -i`, everything is installed into a single directory (same structure as the Windows distribution):
```
/opt/MediaSDK-<version>-linux/
├── bin/     MediaSDKTest, RealTimeStitcherSDKTest, models/
├── lib/     libMediaSDK.so + runtime dependencies (cuda/cudnn/opencv/...)
├── include/ ins_common.h, ins_stitcher.h, ins_realtime_stitcher.h
└── example/ main.cc, realtime_stitcher_demo.cc
```

> The integration documentation (this guide) is now provided online instead of being bundled in the package. Please refer to the latest online version.

---

## API Reference

The SDK provides three public header files, located under `include/` (under `include/stitcher/` in the Windows package):

### Core API Overview

| Class / Function | Header | Description |
|-----------|--------|------|
| `VideoStitcher` | `ins_stitcher.h` | Offline video stitching (export) |
| `ImageStitcher` | `ins_stitcher.h` | Offline image stitching (DNG/JPEG/INSP, etc.) |
| `RealTimeStitcher` | `ins_realtime_stitcher.h` | Real-time stitching (preview/live streaming scenarios) |
| `ins::InitEnv()` | `ins_common.h` | SDK initialization (must be called before use, regardless of whether CUDA is used) |
| `GetMediaFileInfo()` | `ins_common.h` | Query source-file properties (resolution/fps/bitrate/duration) before stitching |
| `GetVersion()` / `GetVersionMajor()` | `ins_common.h` | Query the current SDK version |

### Initialization

Before using the SDK, you must call `InitEnv()` and then set the model directory:

```cpp
#include <ins_stitcher.h>

int main() {
    ins::SetLogLevel(ins::InsLogLevel::ERR);   // Optional: log print level
    ins::InitEnv();                            // Required: initialize the runtime (GPU context/thread pool, etc.)
    ins::SetModelFileRootDir("./models/");     // Model directory (must end with a separator); needed for AI stitching/ColorPlus/denoise, etc.
    // ... create VideoStitcher / ImageStitcher / RealTimeStitcher
}
```

> `SetModelFileRootDir` has been supported since 3.1.0.0. Simply pass `SDK_DIR/models` as the argument. This resolves the previous cumbersome requirement of separately setting the AI model path for each feature per camera model (each `Enable*` interface has also no longer required a separate model path parameter since 3.1.0.0).

> Use `std::string ins::GetVersion()` to get the full version string (e.g. `"3.1.4"`), and `int ins::GetVersionMajor()` to get the major version number; both are declared in `ins_common.h`.

---

## Video Stitching (VideoStitcher) and Image Stitching (ImageStitcher)

`VideoStitcher` (video) and `ImageStitcher` (image) share most parameter-setting interfaces (input/output paths, resolution, stitching type, stabilization, color grading, lens guard, etc. — see "Common Parameters" below). The main difference is the stitching flow itself:

- **Video stitching is asynchronous**: `StartStitch()` returns immediately, and progress/completion/errors are reported via callbacks.
- **Image stitching is synchronous**: `Stitch()` blocks until completion, with no callbacks and none of the video-only parameters such as bitrate or encoding format.

See `example/main.cc` for a complete runnable example.

```cpp
#include <ins_stitcher.h>
#include <mutex>
#include <condition_variable>

// Video stitching: asynchronous
auto video_stitcher = std::make_shared<ins::VideoStitcher>();
video_stitcher->SetInputPath({"/path/to/video.insv"});
video_stitcher->SetOutputPath("/path/to/output.mp4");
video_stitcher->SetOutputSize(3840, 1920);               // width:height must be 2:1
video_stitcher->SetStitchType(ins::STITCH_TYPE::AIFLOW); // Optional: AI stitching
video_stitcher->EnableFlowState(true);                   // Optional: stabilization

std::mutex m; std::condition_variable cv; bool done = false, err = false;
video_stitcher->SetStitchProgressCallback([&](int progress, int) {
    if (progress == 100) { std::lock_guard<std::mutex> lk(m); done = true; cv.notify_one(); }
});
video_stitcher->SetStitchStateCallback([&](int code, const char* info) {
    { std::lock_guard<std::mutex> lk(m); err = true; } cv.notify_one();
});

video_stitcher->StartStitch();                           // Starts asynchronously and returns immediately; parameters cannot be changed after this (changes have no effect)

std::unique_lock<std::mutex> lk(m);
cv.wait(lk, [&]{ return done || err; });                 // Wait for completion or error

// Image stitching: synchronous
auto image_stitcher = std::make_shared<ins::ImageStitcher>();
image_stitcher->SetInputPath({"/path/to/input.insp"});
image_stitcher->SetOutputPath("/path/to/output.jpg");
image_stitcher->SetOutputSize(3840, 1920);
image_stitcher->Stitch();                                // Synchronous; completes when it returns
```

### Common Parameters (apply to both VideoStitcher and ImageStitcher)

#### `void SetInputPath(const std::vector<std::string>& input_paths)`

Sets the input paths for source material (as an array); applies to both video and photos.

- **Video**: The array holds at most two source files. **Footage at ≥5.7K resolution requires two source files as input** (except for the X4 / X5 / X4 Air / X6 cameras — these models save both lenses' streams as two video tracks in a single file, so there is only ever one source file regardless of resolution).

  ```cpp
  // Dual-file 5.7K footage
  std::vector<std::string> input_path = {"/path/VID_XXX_..._00_XXX.insv",
                                          "/path/VID_XXX_..._10_XXX.insv"};
  // Single-file footage (including X4/X5/X4 Air/X6)
  std::vector<std::string> input_path = {"/path/VID_XXX_..._00_XXX.insv"};
  ```

- **Photos**: The array can take multiple entries (**but not exactly 2**). Providing 3 or more source files is treated as HDR photos by default and HDR-fused (no odd-count requirement, no upper limit). HDR footage captured by default on the X4 camera is already fused in-camera into a single file, so this rule does not apply to it.

> Tip: before setting the input path, you can query source-file properties (`media_type`, `width`, `height`, `fps`, `bitrate`, `duration_ms`) with `bool GetMediaFileInfo(const std::vector<std::string>& file_paths, MediaFileInfo& info)` (`ins_common.h`) — useful for validating footage or showing info to the user, without constructing a Stitcher object first. Returns `false` if parsing fails.

#### `void SetOutputPath(const std::string& output_path)`

Sets the export path (full path). Video paths end in `.mp4`, image paths end in `.jpg`. For video, this interface has no effect when `SetImageSequenceInfo` has been set (see "Video-Only Parameters" below).

#### `void SetOutputSize(int width, int height)`

Sets the export resolution. **width:height must be 2:1**. The SDK does not validate this ratio — passing a non-2:1 resolution will not raise an error, but will distort the output image; ensuring the correct ratio is the caller's responsibility.

#### Enable stabilization: `void EnableFlowState(bool enable)`

Sets whether standard stabilization (FlowState) is enabled.

#### Stitching type: `void SetStitchType(STITCH_TYPE type)`

```cpp
enum class STITCH_TYPE {
    TEMPLATE,       // Template stitching
    OPTFLOW,        // Optical flow stitching
    DYNAMICSTITCH,  // Dynamic optical flow stitching
    AIFLOW          // AI stitching
};
```

Use cases:

- **Template stitching**: An older stitching algorithm; poor results for close-range scenes, but fast and low in resource usage.
- **Dynamic stitching**: Suitable for scenes with close-range subjects, motion, and rapid changes.
- **Optical flow stitching**: Same use cases as dynamic stitching.
- **AI stitching**: An optimized algorithm built on Insta360's existing optical flow stitching technology, providing better stitching quality.

> Resource usage and stitching quality: AI stitching > Optical flow stitching > Dynamic stitching > Template stitching
>
> Stitching speed: Template stitching > Dynamic stitching > Optical flow stitching > AI stitching

> Note: When using AI stitching, you must point `SetModelFileRootDir` to the root directory containing the models; otherwise, the stitching effect will not take effect.

> Model file: `<model_root_dir>/ai_stitcher.ins` (under the directory set via `SetModelFileRootDir`; fixed filename, not camera-model-specific).

#### Chromatic fusion (cross-lens brightness matching): `void EnableStitchFusion(bool enable)`

Enables chromatic/brightness fusion across lenses. Cause of the artifact: the two lenses expose separately, and a noticeable brightness difference can appear at the stitch seam; inconsistent lighting on the two sides of the lenses or differing exposure between the front and rear lenses can also cause a brightness difference between them, which is especially noticeable in scenes with a large lighting ratio. This feature is used to resolve that issue. (Note: this is unrelated to purple-fringing removal — see `EnableDefringe` below.)

#### Color enhancement: `void EnableColorPlus(bool enable, float strength = 1.0f)`

Enables color enhancement (an AI feature, depends on the model root directory; no separate model path needed since 3.1.0.0). `strength` is the enhancement intensity (0–1); the default is `1.0f` on VideoStitcher and `0.3f` on ImageStitcher.

#### Denoise: `void EnableDenoise(bool enable)`

Whether to enable denoising. Video denoising is multi-frame denoising, which removes video noise using redundant information from surrounding frames; it produces better results than single-frame denoising but is more resource-intensive and slows down export. Denoising for photo footage likewise depends on the model root directory.

#### Color Grading Features

| Interface | Range |
|------|------|
| `SetExposure` (Exposure) | [-100, 100] |
| `SetHighlights` (Highlights) | [-100, 100] |
| `SetShadows` (Shadows) | [-100, 100] |
| `SetContrast` (Contrast) | [-100, 100] |
| `SetBrightness` (Brightness) | [-100, 100] |
| `SetBlackpoint` (Black point) | [-100, 100] |
| `SetSaturation` (Saturation) | [-100, 100] |
| `SetVibrance` (Vibrance) | [-100, 100] |
| `SetWarmth` (Warmth/color temperature) | [-100, 100] |
| `SetTint` (Tint) | [-100, 100] |
| `SetDefinition` (Definition/clarity) | [0, 100] |

#### Lens guard: `void SetCameraAccessoryType(CameraAccessoryType type)`

If a lens guard was attached to the camera during capture, the corresponding type must be set for stitching as well; otherwise, the stitching result may be incorrect.

```cpp
enum class CameraAccessoryType {
    kAutoDetect = -1,         // Auto-detect the accessory from file metadata
    kNormal = 0,
    kWaterproof,              // (one/onex/onex2/oner/oners/onex3) dive case
    kOnerLensGuard,           // (oner/oners) adhesive lens guard
    kOnerLensGuardPro,        // (oner/oners) snap-on lens guard
    kOnex2LensGuard,          // (oner/oners/onex2/onex3) adhesive lens guard
    kOnex2LensGuardPro,       // (onex2) snap-on lens guard
    k283PanoLensGuardPro,     // (oner/oners) snap-on lens guard for the 283 panoramic lens
    kDiveCaseAir,             // (onex/onex2/oner/oners/onex3) dive case (above water)
    kDiveCaseWater,           // (onex/onex2/oner/oners/onex3) dive case (underwater)
    kInvisibleDiveCaseAir,    // X3/X4/X5 fully invisible dive case (above water)
    kInvisibleDiveCaseWater,  // X3/X4/X5 fully invisible dive case (underwater)
    kLensGuardA,              // X3/X4/X5 Grade-A plastic lens guard
    kLensGuardS,              // X3/X4/X5 Grade-S glass lens guard
    kLensGuardAS,             // X3/X4 auto-detect between grade A and S
    kOnex5ND16,               // X5 ND16 filter
    kOnex5ND32,               // X5 ND32 filter
    kOnex5ND64,               // X5 ND64 filter
    kOner283LensGuardPro,     // (oner/oners) lens guard pro for the 283 lens
    kOnerLensGuardFpv,        // (oner/oners) adhesive lens guard for the FPV (non-283) lens
    kOnex4AirDiveCaseAir,     // X4 Air dive case (above water)
    kOnex4AirDiveCaseWater,   // X4 Air dive case (underwater)
    kUndetermined = 100,      // Could not be determined
};
```

> In the store, the standard lens guard is Grade A, and the premium lens guard is Grade S.

#### Cooling shell detection: `void EnableCoolingShellDetection(bool enable)`

Used to detect whether a cooling shell accessory is being used — if a cooling shell is actually in use but was not selected on the camera's UI, enabling this detection can prevent it from affecting the stitching result. This is an AI feature that depends on the model root directory set via `SetModelFileRootDir` (no longer requires a separately passed model path since 3.1.0.0).

> ⚠️ Cooling shell detection is only supported on X4 Air / X5 / X6 camera models; on other models the SDK automatically skips this feature (query the actual status via `GetFeatureStatusMap()`, key `"cooling_shell"`).

---

## Video-Only Parameters (VideoStitcher only)

The following interfaces are provided only by `VideoStitcher`; they do not apply to `ImageStitcher`.

#### `void SetOutputBitRate(int64_t bitRate)`

Sets the export bitrate, in bps. If not set, the source video's bitrate is used for export.

> For example, to output at 60 Mbps: `bitRate = 60 * 1000 * 1000` (i.e., `60000000`).

#### Encoding format: `void EnableH265Encoder(bool enable)`

Sets the encoding format to H.265 (`enable = true`) or H.264 (`enable = false`, default). **When the output resolution exceeds 4K (width or height > 4096), the H.264 encoder cannot use hardware encoding (NVENC's hardware encoding cap is 4096), and the SDK will automatically force a downgrade to software encoding**; in this case, switching to H.265 allows hardware encoding to continue, significantly speeding up export. See the "Software/Hardware Encode/Decode" section below for details.

#### 10-bit export: `void Enable10BitExport(bool enable)`

Sets whether to export 10-bit video; default is `false` (8-bit). The actual output bit depth depends on the source material: 10-bit output is only produced when the source itself is 10-bit (e.g. X6 10-bit footage); if the source is 8-bit, a 10-bit export request is silently downgraded to 8-bit (with a WARNING log). 10-bit export is recommended together with `EnableH265Encoder(true)`, since H.264 does not support 10-bit — if the source is 10-bit and the encoding format is still H.264, the SDK will automatically switch the encoding format to H.265.

#### Stabilization data export: `void SetStabDataOutputPath(const std::string& file_path)`

Sets the output file path for exported stabilization (Stab) data.

#### Direction lock: `void EnableDirectionLock(bool enable)`

Enables direction lock. Depends on `EnableFlowState(true)`: FlowState (stabilization) must be enabled first for this feature to take effect; if stabilization is not enabled or the source has no gyro data, this feature is automatically skipped.

#### Defringe (purple fringing removal): `void EnableDefringe(bool enable)`

Removes purple fringing artifacts caused during recording by strong lighting (outdoor strong light, indoor lighting scenarios, etc.).

> ⚠️ Purple fringing removal is only supported on X4 Air / X5 / X6 camera models (X5 and X6 share the same model file; X4 Air uses a dedicated model). On other camera models, the SDK will automatically skip this feature.

#### Deflicker: `void EnableDeflicker(bool enable)`

Removes screen flicker (strobing) issues caused by lighting during recording.

#### Image sequence export: `void SetImageSequenceInfo(const std::string& output_dir, IMAGE_TYPE image_type)`

Exports the source video as an image sequence, setting the export path and image format.

- `output_dir`: A directory-level path (no filename). **Make sure the target directory already exists before use.**
- `image_type`: Currently supports `png` and `jpg`.
- Output files are named by video frame timestamp (ms), e.g., `/path/to/dir/100.jpg` represents the frame at 100ms.
- Once this interface is set, the `SetOutputPath` setting has no effect.

#### Exporting specific frames: `void SetExportFrameSequence(const std::vector<uint64_t>& vec)`

Used together with `SetImageSequenceInfo` to export only the specified video frame indices (starting from 0) as images. The filename is the frame index, e.g., `/path/to/dir/10.jpg` represents frame index 10.

```cpp
// Extract frames 0/10/20/30 from the video, stitch, and export as images
std::vector<uint64_t> seq_nos = {0, 10, 20, 30};
videoStitcher->SetExportFrameSequence(seq_nos);
videoStitcher->SetImageSequenceInfo("/path/to/image_seq_dir", IMAGE_TYPE::JPEG);
videoStitcher->StartStitch();
```

#### Stitch progress callback: `void SetStitchProgressCallback(stitch_process_callback callback)`

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

#### Stitch error callback: `void SetStitchStateCallback(stitch_error_callback callback)`

```cpp
video_stitcher->SetStitchStateCallback([&](int error, const char* errinfo) {
    std::cout << "error: " << errinfo << std::endl;
    has_error = true;
    cond_.notify_one();
});
```

Used to receive status/error information during the stitching process. It's also recommended not to perform time-consuming operations inside either callback, as this will impact stitching speed. Image sequence export (`SetImageSequenceInfo`) also goes through `VideoStitcher::StartStitch()` and uses these same two callbacks.

#### Start stitching: `void StartStitch()`

Starts the stitching process. **Note: all parameters must be set before calling this interface; any parameters set after calling it will have no effect.**

#### Cancel stitching: `bool CancelStitch()`

Interrupts the stitching process.

#### Get stitching progress: `int GetStitchProgress() const`

Gets the current stitching progress.

#### Get feature runtime status: `std::map<std::string, int> GetFeatureStatusMap() const`

Call after stitching completes to get the actual runtime status of each feature in this run (keys are feature names such as `"defringe"`, `"cooling_shell"`, `"direction_lock"`, etc.; value meaning: `-1`=unknown, `0`=off, `1`=on, `2`=auto-skipped, `3`=failed). Use this to confirm whether a feature that's only supported on specific camera models/conditions (e.g. defringe, cooling shell detection, direction lock) was automatically skipped by the SDK in this run.

---

## Image-Only Interface (ImageStitcher only)

#### Start stitching: `bool Stitch()`

Synchronously performs image stitching, blocking until completion. The return value (`true`/`false`) genuinely reflects whether this stitch succeeded (internally it parses the source material, validates parameters, and performs the stitch; any failed step results in `false`), so you can rely on it directly.

Differences from video stitching:

- **No callbacks**: Image stitching does not provide, and does not require registering, `SetStitchProgressCallback` / `SetStitchStateCallback` — those two callback interfaces are provided only by `VideoStitcher` (see "Video-Only Parameters" above). `ImageStitcher` has no progress-reporting mechanism and no separate error callback; simply check the return value of `Stitch()` to know whether it succeeded.
- **No asynchronous wait**: `Stitch()` returning means processing has already completed — there's no need to wait on a condition variable for a callback as with video stitching.

---

## Logging

### C++ API

| Interface | Description |
|------|------|
| `ins::SetLogLevel(InsLogLevel level)` | Sets the SDK's log print level |

> `SetLogPath` is still available for setting the log output-to-disk path. The command-line demo (`MediaSDKTest`) instead uses the `--log_file` parameter to control log output-to-disk (see below), with more complete behavior (auto-creates directories, path encoding compatible with Chinese characters, etc.). Integrators can call `SetLogPath` directly, or implement equivalent logic by referring to the usage in `example/main.cc`.

### Command Line (`--debug` / `--log_level` / `--log_file`)

| Parameter | Description |
|------|------|
| `--debug` | Turns on verbose logging (equivalent to `--log_level verbose`; if not specified, only the ERROR level is printed by default, i.e., `InsLogLevel::ERR`) |
| `--log_level <level>` | Precisely selects the log level: `verbose` / `info` / `warning` / `error` / `fatal` (case-insensitive). If it appears after `--debug` on the command line, it overrides the setting from `--debug` |
| `--log_file [path]` | Additionally writes SDK logs to a file (the value is optional; see below) |

**`--log_file` value-resolution rules** (the value is optional, and directory/file paths are handled adaptively):

1. If the parameter is not specified → logs are not written to disk (they are still printed to the console).
2. If `--log_file` is specified with no following value → logs are written under `<directory containing the exe>/logs/`, with a timestamped filename.
3. If followed by a directory path → a timestamped log file is generated in that directory.
4. If followed by a file path → logs are written directly to that file.

If the directory does not exist, it is created automatically. **To see verbose information in the log file, `--debug` or `--log_level verbose/info` must also be added** (otherwise the file will also contain only the ERROR level).

> Path encoding: log paths are handled as UTF-8 and support Chinese-character paths (on Windows, an encoding mismatch between GBK and UTF-8 in `GetModuleFileNameA` under Chinese-locale system paths has been fixed, avoiding the silent crashes or garbled log directory names seen in earlier versions with Chinese-character paths).

---

## Software/Hardware Encode/Decode

| Parameter | Description |
|------|------|
| `-enable_soft_encode` / `-enable_soft_decode` | Maps to `SetSoftwareCodecUsage(enable_encoder, enable_decoder)`, forcing software encoding / software decoding respectively |
| (not set) | Hardware encode/decode (NVENC/NVDEC) by default |

At the start of export, a line is printed:
```
[Codec] encode=<software|hardware>, decode=<software|hardware>, format=<H264|H265> [(requested by user) | (forced by SDK: ...)]
```
This can be used to confirm which path — software or hardware — is actually in effect, and whether it was explicitly requested by the user or automatically forced by the SDK.

### Automatic Downgrade / Automatic Switching Rules

In the following situations, the SDK will automatically switch encode/decode modes **without the user specifying any software/hardware encode/decode parameters**, and will annotate the `[Codec]` line with `(forced by SDK: ...)`:

1. **Resolution > 4096 (width or height) combined with H.264 encoding format → forced switch to software encoding.**
   NVENC's hardware encoding resolution cap for H.264 is 4096. **H.265 (HEVC) hardware encoding is not subject to this limit** — to keep hardware encoding at ultra-high resolutions such as 8K (7680×3840), you need to explicitly add `-enable_h265_encoder` / `EnableH265Encoder(true)`.
2. **On Windows: resolution ≤ 360 (width or height) → forced switch to software encoding.**
3. **10-bit export + source footage bit depth ≥ 10-bit + H.264 encoding format → the encoding format is automatically switched to H.265.**
4. Denoise / Defringe (purple fringing removal) / Deflicker + 10-bit source footage → 10-bit export is automatically enabled even without explicitly adding `-enable_10bit`.

---

## Hardware Acceleration Interfaces

#### Force software encode/decode: `SetSoftwareCodecUsage`

Sets whether to force the use of software encoding/decoding.

#### Disable CUDA: `EnableCuda(bool enable)`

Sets whether to enable CUDA acceleration detection.

#### Rendering acceleration type: `SetImageProcessingAccelType`

Sets the acceleration method for image processing rendering: `Auto` automatically detects (default) / `CPU`.

---

## Real-Time Stitching (RealTimeStitcher)

Real-time stitching is implemented jointly by CameraSDK and MediaSDK: CameraSDK provides stitching parameters, video data, stabilization data, and exposure data; MediaSDK uses this data to perform stitching, producing a 2:1 panoramic frame. The header file is located at `include/ins_realtime_stitcher.h`; see `example/realtime_stitcher_demo.cc` for a complete example.

### Getting and Setting Preview Parameters

```cpp
#include <ins_realtime_stitcher.h>

// cam is the current camera instance object
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

### Handling Raw Preview Stream Data

In CameraSDK, you need to implement the `ins_camera::StreamDelegate` interface to receive real-time camera data and forward it to MediaSDK:

```cpp
class StitchStreamDelegate : public ins_camera::StreamDelegate {
public:
    StitchStreamDelegate(const std::shared_ptr<ins::RealTimeStitcher>& stitcher) : stitcher_(stitcher) {}
    ~StitchStreamDelegate() override {}

    void OnAudioData(const uint8_t* data, size_t size, int64_t timestamp) override {}

    // Video data
    void OnVideoData(const uint8_t* data, size_t size, int64_t timestamp, uint8_t streamType, int stream_index) override {
        stitcher_->HandleVideoData(data, size, timestamp, streamType, stream_index);
    }

    // Stabilization data
    void OnGyroData(const std::vector<ins_camera::GyroData>& data) override {
        std::vector<ins::GyroData> data_vec(data.size());
        memcpy(data_vec.data(), data.data(), data.size() * sizeof(ins_camera::GyroData));
        stitcher_->HandleGyroData(data_vec);
    }

    // Exposure data
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

### Setting Preview Parameters

- **Stitching type**: See "Common Parameters – Stitching Type" above.
- **Stabilization parameters**: See "Common Parameters – Enable Stabilization" above.
- **Lens guard**: See "Common Parameters – Lens Guard" above.
- **Output frame size**: If not set, the output size defaults to the current preview resolution; if you need a higher output frame rate, lower the resolution.
- **Video stream delay**: `void SetVideoDelayMs(int video_delay_ms)` introduces an artificial delay (in milliseconds) on the incoming video stream, used to align it with gyro data.

### Getting Stitched Data

The stitching result currently supports the RGBA format, obtained via the `SetStitchRealTimeDataCallback` callback. It's recommended not to perform time-consuming operations inside the callback:

```cpp
stitcher->SetStitchRealTimeDataCallback([&](uint8_t* data[4], int linesize[4], int width, int height, int format, int64_t timestamp) {
    show_image_ = cv::Mat(height, width, CV_8UC4, data[0]).clone();
});
```

### Starting / Stopping the Preview

```cpp
// Start: set the delegate interface, start the camera preview, then start stitching
std::shared_ptr<ins_camera::StreamDelegate> delegate = std::make_shared<StitchStreamDelegate>(stitcher);
cam->SetStreamDelegate(delegate);
ins_camera::LiveStreamParam param;
if (cam->StartLiveStreaming(param)) {
    stitcher->StartStitch();
    std::cout << "successfully started live stream" << std::endl;
}

// Stop: stop the camera preview stream first, then cancel stitching
if (cam->StopLiveStreaming()) {
    stitcher->CancelStitch();
    std::cout << "success!" << std::endl;
}
```

---

## Error Codes

| Error Code | Message |
|---|---|
| `E_OPEN_FILE`(1) | Failed to open file |
| `E_PARSE_METADATA`(2) | Failed to parse file trailer |
| `E_CREATE_OFFSCREEN`(3) | Failed to create offscreen rendering |
| `E_CREATE_RENDER_MODEL`(4) | Failed to create render model |
| `E_FRAME_PARSE`(5) | Failed to get data frame |
| `E_CREATE_RENDER_SOURCE`(6) | Failed to create render data source |
| `E_UPDATE_RENDER_SOURCE`(7) | Failed to update data frame to render source |
| `E_RENDER_FRAME`(8) | Failed to render data |
| `E_SAVE_FRAME`(9) | Failed to save image |
| `E_VIDEO_FRAME_EXPORTOR`(10) | Failed to create video frame extractor |
| `E_FILE_TYPE_UNSUPPORT`(11) | Input file type is not supported |
| `E_INTERNAL_ERROR`(998) | Internal SDK error |
| `E_UNKNOWN`(999) | Unknown error; detailed information is needed for analysis |

---

## Using the Sample Programs

### MediaSDKTest (Offline Stitching)

> Tip: run `MediaSDKTest -help` at any time to see all parameters.

```
MediaSDKTest -inputs <input file> -output <output file> [options]
```

Common options (note: these are **full-word long parameters**, not single letters):

| Parameter | Description | Example |
|------|------|------|
| `-inputs` | Input file path (required; multiple lenses can pass multiple files) | `-inputs video.insv` |
| `-output` | Output file path (required; video/image) | `-output out.mp4` |
| `-model_root_dir` | Root directory of model files (default `<exe>/models/`, auto-detected) | `-model_root_dir ./models/` |
| `-stitch_type` | Stitching algorithm: `optflow` (default) / `dynamicstitch` / `aistitch` | `-stitch_type aistitch` |
| `-output_size` | Output resolution `<width>x<height>`, must satisfy 2:1 | `-output_size 3840x1920` |
| `-bitrate` | Output bitrate (bps); `0` or omitted = same bitrate as source. For 8K, 80–142 Mbps is recommended | `-bitrate 142000000` |
| `-enable_flowstate` | Enable stabilization (FlowState) | — |
| `-enable_directionlock` | Enable direction lock | — |
| `-enable_10bit` | 10-bit export (auto-switches to H.265; falls back if the source is 8-bit) | — |
| `-enable_h265_encoder` | Use H.265 encoding; required to retain hardware encoding when resolution > 4096 | — |
| `-enable_denoise` / `-enable_defringe` / `-enable_deflicker` | Denoise / Defringe (only X4 Air/X5/X6 supported, others skipped) / Deflicker | — |
| `-enable_colorplus` | ColorPlus color enhancement | — |
| `-enable_stitchfusion` | Chromatic/brightness fusion across lenses | — |
| `-enable_coolingshell` | Cooling shell detection (only X4 Air/X5/X6 supported, others skipped) | — |
| `-camera_accessory_type` | Lens guard type; see `CameraAccessoryType` for values (refer to `common.h`) | — |
| `-image_sequence_dir <directory>` | Export as an image sequence (combine with `-image_type jpg/png`) | — |
| `-export_frame_index` | Export specific frame indices, e.g. `20-50-30`; omit to export all frames | — |
| `-exposure` / `-highlights` / `-shadows` / `-contrast` / `-brightness` / `-blackpoint` / `-saturation` / `-vibrance` / `-warmth` / `-tint` | Color grading parameters, range [-100,100] | — |
| `-definition` | Definition/clarity, range [0,100] | — |
| `-disable_cuda` | Disable GPU, use CPU path (for troubleshooting when the GPU environment is faulty) | — |
| `-enable_soft_encode` / `-enable_soft_decode` | Force software encoding / software decoding (hardware encode/decode is the default; see the automatic downgrade rules in the "Software/Hardware Encode/Decode" section) | — |
| `-image_processing_accel` | Rendering acceleration: `auto` (default) / `cpu` (use when encountering Vulkan errors) | — |
| `--debug` | Turns on verbose logging (equivalent to `--log_level verbose`; only ERROR level is printed by default) | — |
| `--log_level <level>` | Specifies the log level: `verbose`/`info`/`warning`/`error`/`fatal` | `--log_level info` |
| `--log_file [path]` | Additionally writes SDK logs to a file (value optional; see the "Logging" section) | `--log_file ./logs` |

Examples:

```bash
# Windows
MediaSDKTest.exe -inputs D:\media\video.insv -output D:\output\out.mp4 -stitch_type optflow -output_size 3840x1920 -enable_flowstate

# Linux
./MediaSDKTest -inputs /data/video.insv -output /output/out.mp4 -stitch_type optflow -output_size 3840x1920

# 8K + H.265, keeping hardware encoding, bitrate aligned with the desktop Studio app's 142Mbps
MediaSDKTest.exe -inputs D:\media\video.insv -output D:\output\out_8k.mp4 -output_size 7680x3840 -bitrate 142000000 -enable_h265_encoder
```

### RealTimeStitcherSDKTest (Real-Time Stitching)

```bash
RealTimeStitcherSDKTest        # Connects to the camera for real-time stitching (see -help for parameters)
```

---

## Environment Requirements

### 1. Runtime Environment (using the SDK or running the sample programs)

The SDK's installation package (.deb / Windows archive) already includes the major runtime dependencies, so there's no need to separately install the CUDA Toolkit, OpenCV, etc.

| Item | Windows | Linux |
|------|---------|-------|
| CUDA runtime (cudart/cublas/cufft/npp/cusolver/cusparse/cudnn) | Bundled | Bundled in the .deb |
| AI inference library (MNN) | Bundled | Bundled in the .deb |
| OpenGL/X11 base libraries | Bundled | Bundled in the .deb |
| Only requirement | NVIDIA driver (≥ 470) | NVIDIA driver (≥ 470) |

Once installed, the sample programs can be run directly, with no environment variables to configure.

### 2. Development Environment (compiling a project that integrates the SDK)

If you're writing your own CMake project to integrate libMediaSDK.so / MediaSDK.lib, you'll need:

#### CUDA Toolkit

| Platform | Version | Download |
|------|------|----------|
| Windows | CUDA 10.2 | https://developer.nvidia.com/cuda-10.2-download-archive |
| Linux | CUDA 11.7 | https://developer.nvidia.com/cuda-11-7-0-download-archive |

After installation, make sure the `CUDA_PATH` (Windows) or `CUDA_TOOLKIT_ROOT_DIR` (Linux) environment variable points to the CUDA installation directory.

#### Compiler

| Platform | Compiler | Version |
|------|--------|------|
| Windows | Visual Studio | 2019 (MSVC v142) |
| Linux | GCC | ≥ 11 |

#### CMake Integration Example

```cmake
cmake_minimum_required(VERSION 3.14)
project(MyApp)

# Specify the SDK path
set(INS_MEDIA_SDK_DIR "/usr/local/MediaSDK" CACHE PATH "InsMediaSDK install path")

# Header files
target_include_directories(myapp PRIVATE ${INS_MEDIA_SDK_DIR}/include/stitcher)

# Link library
target_link_libraries(myapp
    ${INS_MEDIA_SDK_DIR}/lib/libMediaSDK.so          # Linux
    # ${INS_MEDIA_SDK_DIR}/lib/MediaSDK.lib          # Windows
    ${CUDA_LIBRARIES}                                 # CUDA runtime
)

# The runtime model files need to be copied into models/ alongside the executable
```

---

## Model Files

At runtime, a `models/` directory is required, containing the following algorithm model files (provided by the SDK package):

| File | Purpose |
|------|------|
| `ai_stitcher.ins` | AI stitching optical flow model |
| `defringe_hr_dynamic_7b56e80f.ins` | Purple fringing removal model (standard camera models) |
| `defringe_air_hr_dynamic_6fbc2886.ins` | Purple fringing removal model (Air camera models) |
| `jpg_denoise_9d006262.ins` | JPEG denoising model (used directly for inference in photo denoising; video denoising only checks its presence as a feature-enablement gate — the actual denoising parameters come from a built-in configuration and do not load this model file itself) |
| `colorplus_model.ins` | Color enhancement model |
| `deflicker_86ccba0d.ins` | Deflicker model |

Default search path: `<executable directory>/models/`, which can be overridden via `SetModelFileRootDir()` / the `-model_root_dir` parameter.

---
