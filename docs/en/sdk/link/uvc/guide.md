# UVC Camera SDK Developer Guide

UVCCameraSDK discovers and controls Insta360 Link series cameras connected over USB.
The SDK provides two controller classes: one for standard UVC controls and another for Insta360-
specific features such as AI tracking, framing, gesture control, audio settings, and firmware
updates.

## SDK Download

The SDK source and sample projects are hosted on GitHub: **<https://github.com/Insta360Develop/Link-SDK>**

## Supported Cameras

| Model | Product page |
| --- | --- |
| Link | [Insta360 Link](https://www.insta360.com/product/insta360-link) |
| Link 2 | [Insta360 Link 2](https://www.insta360.com/product/insta360-link2) |
| Link 2C | [Insta360 Link 2C](https://www.insta360.com/product/insta360-link2) |
| Link 2 Pro | [Insta360 Link 2 Pro](https://www.insta360.com/product/insta360-link2-pro) |
| Link 2C Pro | [Insta360 Link 2C Pro](https://www.insta360.com/product/insta360-link2-pro) |

## Supported Platforms

Windows, macOS, Linux (Ubuntu 22.04)

## 1. Controller Overview

| Controller | Purpose |
| --- | --- |
| `UVCCameraController` | Control parameters defined by the standard UVC protocol. |
| `UVCCameraExtendController` | Controls Insta360-specific UVC extension features. |

## 2. Discovering a Camera and Creating Controllers

1. Call  uvc::GetUVCCameraList  to enumerate the currently available UVC cameras. If no
camera is found, check the USB data cable, power supply, device permissions, the operating
system's device list, and whether another application is using the video stream.
2. Select a  UVCCameraInfo  entry and use the same device information to create both
controllers. Manage controller lifetime through the controller objects and refer to the
headers and Demo included with the same SDK release for authoritative definitions.


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
15 // Suitable for a minimal example only. In a multi-camera application,
16 // select the device by serial number or another stable identifier.
17 const UVCCameraInfo camera_info = cameras.front();
18
19 auto uvc_controller =
20 std::make_shared<uvc::UVCCameraController>(camera_info);
21
22 auto extend_controller =
23 std::make_shared<uvc::UVCCameraExtendController>(camera_info);
24
25 std::cout << "Camera controllers created successfully." << std::endl;
26 return 0;
27 }
```

## 3. Standard UVC Controls

UVCCameraController  provides access to camera parameters exposed through the
standard UVC protocol.

### 3.1 Media Formats

Use  GetMediaFormatList  to retrieve the supported resolution and frame-rate combinations.


```cpp
1 bool GetMediaFormatList(std::vector<UVCMediaFormat>& list);
```


### 3.2 Gimbal Pan, Tilt, and Roll

The following APIs control horizontal movement, vertical movement, and roll on supported Link
cameras with a gimbal. Query the supported range and step size before setting a value.

#### Absolute Pan and Tilt

Absolute positioning moves the gimbal directly to a target position. It is useful for fixed camera
positions and predefined views. The target values must fall within the range reported by the
device.


```cpp
1 // Query the range before setting a value. Values must be within [min, max]
2 // and aligned to the reported step size.
3 struct CameraControlInfo {
4 long min;
5 long max;
6 long step;
7 long def;
8 long cur;
9 long flags;
10 };
11
12 CameraControlInfo pan, tilt;
13 uvc_controller->GetPanTiltAbsoluteRange(pan, tilt); // Get the supported

Pan/Tilt ranges.
14
15 long pan_value = 50;
16 long tilt_value = 50;
17 uvc_controller->SetPanTiltAbsolute(pan_value, tilt_value); // Set the absolutePan/Tilt position.
```

#### Relative Pan and Tilt

Relative movement controls continuous gimbal motion using a direction and speed. This is
suitable for directional buttons or joystick input. Send  value=Stop  when input ends, the
window loses focus, or a control timeout occurs so that the gimbal does not continue moving.


```cpp
1 enum class CameraControlRelativeValue {
2 Stop = 0x00, // Stop movement on this axis.
3 ClockwiseMove = 0x01, // Move in the positive direction.
4 AntiClockwiseMove = 0xFF // Move in the negative direction.
5 };
6

7 struct CameraControlRelativeInfo {
8 long speed; // Supported range: [1, 10].
9 CameraControlRelativeValue value;
10 };
11
12 bool GetPanTiltRelative(CameraControlRelativeInfo& pan_info,

CameraControlRelativeInfo& tilt_info); // Get the current Pan/Tilt direction
and speed.
13 bool SetPanTiltRelative(CameraControlRelativeInfo pan_info,CameraControlRelativeInfo tilt_info); // Set the Pan/Tilt direction and speed.
```

#### Roll

Use these APIs to read or set the roll position on supported devices. Only expose this control
when the device reports a valid range and the API call succeeds.


```cpp
1 // Query the range before setting a value. Values must be within [min, max]
2 // and aligned to the reported step size.
3 bool GetRollAbsoluteRange(CameraControlInfo &info); // Get the range, step

size, default value, and current value.
4
5 bool GetRollAbsolute(long &value); // Get the current absolute Roll value.
6
7 bool SetRollAbsolute(long value); // Set the absolute Roll value.
```

### 3.3 Focus

Use  EnableAutoFocus  to switch autofocus on or off on supported devices. Before setting a
manual focus value, disable autofocus and query the supported focus range. Re-enabling
autofocus may override the previously selected manual value.


```cpp
1 // Query the range before setting a value. Values must be within [min, max]
2 // and aligned to the reported step size.
3 bool GetFocusAbsoluteRange(CameraControlInfo& info); // Get the focus range,

step size, default value, and current value.
4
5 bool GetFocusAbsolute(long& value); // Get the currentmanual focus value.
6 bool SetFocusAbsolute(long value); // Set the manual focusvalue. Disable autofocus first.

7
8 bool GetAutoFocusStatus(bool& enable); // Check whetherautofocus is enabled.
9 bool EnableAutoFocus(bool enable); // Enable or disableautofocus.
```

### 3.4 Zoom

Use these APIs to read or change the camera's zoom value. Query the supported range and step
size first, and ensure that the value you provide is valid.


```cpp
1 // Query the range before setting a value. Values must be within [min, max]
2 // and aligned to the reported step size.
3 bool GetZoomAbsoluteRange(CameraControlInfo& info); // Get the zoom range,

step size, default value, and current value.
4
5 bool GetZoomAbsolute(long& value); // Get the current zoom value.
6 bool SetZoomAbsolute(long value); // Set a zoom value supported by the device.
```

### 3.5 Exposure, Anti-Flicker, and Image Controls

#### Exposure and Shutter Speed

Shutter speed is a manual exposure control. Check the current auto-exposure state before
changing it. To set the shutter speed, disable auto exposure and select a value returned by
GetShutterSpeedList . When auto exposure is re-enabled, the firmware takes control of
shutter speed again.


```cpp
1 bool GetShutterSpeedList(std::vector<long>& list); // Get the supported

shutter-speed values.
2
3 bool GetShutterSpeed(long& value); // Get the current shutter-speed value.
4 bool SetShutterSpeed(long value); // Set a supported shutter-speed value after disabling auto exposure.
5
6 bool GetAutoExposureStatus(bool& enable); // Check whether autoexposure is enabled.

7 bool EnableAutoExposure(bool enable); // Enable or disable autoexposure.
```

#### Anti-Flicker

Use the anti-flicker setting to match the local mains or lighting frequency. Check the return
value because support for individual modes may vary by platform, camera model, and firmware
version.


```cpp
1 enum class PowerLineFrequency {
2 FREQUENCY_NotUse = 0x00,
3 FREQUENCY_50HZ = 0x01,
4 FREQUENCY_60HZ = 0x02,
5 FREQUENCY_Auto = 0x03,
6 };
7 bool SetPowerLineFrequency(PowerLineFrequency value); // Set the anti-flicker

mode.
8 bool GetPowerLineFrequency(PowerLineFrequency& value); // Get the current anti-flicker mode.
```

#### Brightness, Contrast, Saturation, Sharpness, and White Balance

For every parameter that provides a range query, retrieve the range first, map your UI control to
[min, max] , and align values to  step .
White-balance mode uses  1  for automatic and  0  for manual. Switch to manual white balance
before setting a color-temperature value.


```cpp
1 // Query the range before setting a value. Values must be within [min, max]
2 // and aligned to the reported step size.
3
4 // Brightness (int16_t)
5 bool GetBrightnessRange(CameraControlInfo& info);
6 bool SetBrightnessValue(int16_t value);
7 bool GetBrightnessValue(int16_t& value);
8
9 // Contrast (uint16_t)
10 bool GetContrastRange(CameraControlInfo& info);
11 bool SetContrastValue(uint16_t value);
12 bool GetContrastValue(uint16_t& value);
13
14 // Saturation (uint16_t)

15 bool GetSaturationRange(CameraControlInfo& info);
16 bool SetSaturationValue(uint16_t value);
17 bool GetSaturationValue(uint16_t& value);
18
19 // Sharpness (uint16_t)
20 bool GetSharpnessRange(CameraControlInfo& info);
21 bool SetSharpnessValue(uint16_t value);
22 bool GetSharpnessValue(uint16_t& value);
23
24 // White-balance color temperature (uint16_t)
25 bool GetWhitebalanceTemperatureRange(CameraControlInfo& info);
26 bool SetWhitebalanceTemperatureValue(uint16_t value);
27 bool GetWhitebalanceTemperatureValue(uint16_t& value);
28
29 // White-balance mode (uint8_t): 0 = manual, 1 = automatic
30 bool GetWhitebalanceTemperatureMode(uint8_t& mode);
31 bool SetWhitebalanceTemperatureMode(uint8_t mode);
```

## 4. Insta360 Extension Controls

UVCCameraExtendController  provides access to Insta360-specific camera features.

### 4.1 Device Information

Use the device-information APIs to identify a camera, capture diagnostic context, and display
firmware information.


```cpp
1 bool GetDeviceInfo(DeviceInfo& info); // UUID, sensor ID, firmware

version, hardware version, and other device information.
2
3 bool GetSerialNumber(std::string& serialNo); // Device serial number.
4
5 bool GetPTZVersionInfo(PTZVerInfo& info); // Gimbal version information.
6
7 bool GetCameraType(std::string& camera_type) const; // Camera type identifier.
8
9 uint16_t GetPID() const; // USB product ID (PID).
10
11 bool GetDeviceStatus(DeviceStatus& status); // CPU/sensor temperature,video-stream state, and firmware-update state.
12

13 bool GetCameraPlayRes(uint32_t& width, uint32_t& height, uint16_t& framerate);
// Get the width, height, and frame rate of the current video stream.
```

### 4.2 Modes, Framing, and Tracking

Use these APIs to read or switch camera modes, including Normal, Auto Composition,
Whiteboard, DeskView, and Smart Whiteboard modes.
You can also select head, half-body, or full-body framing; set the tracking speed; retrieve and
select a tracking target; and choose the default single-person or multi-person tracking mode.
Availability varies by camera model and firmware version. Always check the API return value.


```cpp
1 enum class VideoMode {
2 Normal = 0x00, // Normal UVC mode.
3 AutoComposition = 0x01, // Auto Composition mode.
4 //Track = 0x02, // Tracking mode.
5 //Zoom = 0x03, // Zoom mode.
6 Whiteboard = 0x04, // Whiteboard mode.
7 Craneshot = 0x05, // Overhead mode.
8 DeskView = 0x06, // DeskView mode.
9 AutoFraming = 0x07, // Multi-person Auto Framing mode.
10 SmartWhiteboardMode = 0x08, // Smart Whiteboard mode.
11 //RegionalTack = 0x09, // Regional tracking.
12 SmartWhiteboardQuery = 0x0a // Searching for a Smart Whiteboard.
13 //RegionalTackConfig = 0x0b // Configuring regional tracking.
14 };
15
16
17 bool GetVideoMode(VideoMode& mode, VideoModeAuxiliaryData& extenddata); // Get

the current video mode and its auxiliary data.
18 bool SetVideoMode(VideoMode mode, const VideoModeAuxiliaryData& extenddata);
// Set a video mode and the required auxiliary data.
19
20 bool SwitchNormalMode(); // Switch to Normal UVC mode. This restarts thecamera and interrupts the video stream.
21
22 ////////////////////// Framing
23 enum class CompositionStyle {
24 None = 0x00,
25 OnlyHead = 0x01, // Head framing.
26 HalfBody = 0x02, // Half-body framing.
27 FullBody = 0x03, // Full-body framing.
28 };

29 bool GetCompositionStyle(CompositionStyle& style); // Get the current framingstyle.
30 bool SetCompositionStyle(CompositionStyle style); // Set the framing style.
31
32 /////////////////////////// Tracking
33 enum class TrackSpeed {
34 Fast = 0x00,
35 Normal = 0x01,
36 Slow = 0x02,
37 };
38 bool SetTrackSpeed(TrackSpeed speed); // Set the tracking speed.
39 bool GetTrackSpeed(TrackSpeed& speed); // Get the current tracking speed.
40
41 bool GetTrackObjLists(std::vector<UVCRect>& objs); // Get availabletracking targets (up to 10 detected faces).
42 bool GetNewTrackObjLists(std::vector<UVCRect>& objs); // New tracking-targetAPI.
43 bool SetTrackObj(const UVCRect& rect); // Select a target using a normalizedrectangle. See UVCRect for the coordinate definition.
44
45 bool GetDefaultTrackMode(int& track_mode); // Get the default mode: 0 =single-person, 1 = multi-person.
46 bool SetDefaultTrackMode(int track_mode); // Set the default mode: 0 =single-person, 1 = multi-person.
```

### 4.3 Gesture Control

Use these APIs to enable or disable gesture recognition globally, control individual gestures, and
query the current state. Supported gestures can control AI tracking or Auto Framing, zoom, and
Whiteboard mode. Available gestures and their default states may vary by camera model and
firmware version.
Gesture_Ok  and  Gesture_Rock  are deprecated and are no longer supported by current
cameras. They remain in the enum to preserve protocol value compatibility and must not be
used by applications.


```cpp
1 enum class Gesture {
2 Gesture_Ok = 0, // Deprecated. Do not use.
3 Gesture_Palm = 1, // Open-palm gesture.
4 Gesture_L = 2, // L gesture.
5 Gesture_V = 3, // V gesture.
6 Gesture_Rock = 4, // Deprecated. Do not use.

7 };
8
9 bool EnableAllGesture(bool enable); // Enable or disable

gesture recognition globally.
10 bool EnableGestureWork(Gesture gesture, bool enable); // Enable or disable anindividual gesture.
11 bool GetGestureStatus(std::map<Gesture, bool>& status); // Get the enabledstate of each gesture.
```

### 4.4 Image Enhancement and Extension Controls

Use these APIs to configure exposure compensation, ISO, filters, the exposure curve, and fill-
light parameters, and to enable or disable extension features such as HDR, autofocus, mirroring,
vertical output, and AI processing. Availability and valid combinations may depend on the
exposure mode, camera model, and firmware version. Always check the API return value.


```cpp
1 // Minimum: -3
2 // Maximum: 3
3 // Step: 0.30
4 bool GetExposureCompensation(float& value);
5 bool SetExposureCompensation(float value); // Exposure compensation.
6
7 // Supported ISO values: 100, 125, 160, 200, 250, 320, 400, 500, 640,
8 // 800, 1000, 1250, 1600, 2000, 2500, 3200
9 bool GetISOValue(uint16_t& value);
10 bool SetISOValue(uint16_t value); // ISO value.
11
12 enum class FilterMode {
13 Standard = 0x00,
14 Reserved1 = 0x01,
15 Reserved2 = 0x02,
16 Portrait = 0x03,
17 Bright = 0x04,
18 Vintage1 = 0x05,
19 Vintage2 = 0x06,
20 Neon = 0x07,
21 Clear = 0x08
22 };
23 bool GetFilter(FilterMode& filterId);
24 bool SetFilter(FilterMode filterId); // Filter mode.
25
26 typedef struct ExpouseCurve {

27 std::vector<uint16_t> data;
28 bool is_apply;
29 bool enable;
30 } ExpouseCurve;
31 bool GetExpouseCurve(ExpouseCurve& curve);
32 bool SetExpouseCurve(const ExpouseCurve& curve); // Exposure-curve

configuration.
33
34 bool GetFillLightParam(int &white_blance, int &brigtness); // Fill-lightwhite-balance and brightness parameters.
35
36 enum class ExtendFuction {
37 AiZoom, // AI Zoom switch.
38 AF, // Autofocus switch.
39 HDR, // HDR switch.
40 Mirror, // Mirror switch.
41 Ai, // AI processing switch.
42 VScreen, // Landscape/portrait output switch.
43 EnableStartupSetting, // Startup-setting persistence switch.
44 EnableSingleTapTracking, // Single-tap tracking switch.
45 EnableTracking, // Touch tracking switch.
46 SmartAdjustment, // Smart Adjustment switch.
47 ForcedVertical, // Force portrait output.
48 ExtremePrivacy, // Extreme Privacy switch.
49 MirrorVertically, // Vertical mirror switch.
50 LowResolution, // Low-resolution mode switch.
51 TrackForbiddenArea, // Pause-Track Area switch.
52 AudioSystemVolume, // System audio-volume switch.
53 };
54 bool EnableExtendFuncWork(ExtendFuction func, bool enable); // Enable ordisable an extension feature.
55 bool GetExtendFuncStatus(std::map<ExtendFuction, bool>& status);
```

### 4.5 Audio Settings

Use these APIs to control microphone noise reduction and select an audio capture or pickup-
direction mode for the current use case. Availability depends on the camera model and
firmware version.

#### Audio Noise Reduction


```cpp
1 bool EnableAudioNoiseReduction(bool enable);

2 bool GetAudioNoiseStatus(bool& enable);
```

#### Link 2 / Link 2C Audio Capture Modes


```cpp
1 enum class AudioCaptureMode {
2 Near = 0x00, // Near mode (legacy SDK identifier).
3 Far = 0x01, // Far mode (legacy SDK identifier).
4 LiveBroadcast = 0x02 // Live Broadcast mode (legacy SDK identifier).
5 };
6 AudioCaptureMode GetAudioCaptureMode();
7 bool SetAudioCaptureMode(AudioCaptureMode mode);
```

#### Link 2 Pro / Link 2C Pro Pickup Modes


```cpp
1 enum class AudioDirectionMode {
2 Standard = 0x00, // Standard mode.
3 Wide = 0x01, // Wide mode.
4 Focus = 0x02, // Focus mode.
5 Music = 0x03 // Original mode (legacy SDK enum name).
6 };
7 AudioDirectionMode GetAudioDirectionMode();
8 bool SetAudioDirectionMode(AudioDirectionMode mode);
```

### 4.6 Storage, Privacy, Orientation, and Factory Reset

Use these APIs to switch USB storage modes, control privacy mode, configure landscape or
portrait output, enable low-resolution mode or horizontal correction, and restore factory
defaults. Some operations may interrupt video, reconnect the device, or clear user settings.
Save the application state and notify the user before invoking a disruptive operation.


```cpp
1 bool SwitchStorageMode(); // Switch to USB mass-storage

mode.
2
3 bool SwitchMscReadOnlyClass(); // Switch to read-only USB mass-storage mode.
4
5 bool GetPrivacyMode(int& mode, bool& enable);

6 bool SetPrivacyMode(bool enable); // Enable or disable privacymode.
7
8 bool EnableVerticalScreen(bool enable); // false = landscape, true =portrait.
9
10 bool EnableLowResolution(bool enable); // Enable or disable low-resolution mode.
11
12 bool GetEnableHorizontalCorrection(bool& enable);
13 bool EnableHorizontalCorrection(bool enable); // Enable or disable horizontalcorrection.
14
15 bool LoadFactoryDefault(); // Restore factory defaults.
```

### 4.7 PTZ Controls

PTZ controls adjust horizontal position, vertical position, and zoom. Gimbal-equipped models
move the camera mechanically, while fixed-lens models use digital zoom and cropping to
achieve a similar framing result. Select the appropriate API for the camera model.

#### Gimbal PTZ: Link / Link 2 / Link 2 Pro

These APIs control horizontal and vertical movement on gimbal-equipped models and support
both relative movement and absolute positioning.
Relative Movement
Relative movement controls continuous gimbal motion using direction and speed. This is
suitable for directional buttons or joystick input. Send  Stop  when input ends, the window
loses focus, or a control timeout occurs.


```cpp
1 // This section uses CameraControlRelativeValue and CameraControlRelativeInfo
2 // as defined in the SDK headers and introduced earlier in this guide.
3 // Get the current Pan/Tilt direction and speed.
4 bool GetPanTiltRelative(CameraControlRelativeInfo& pan_info,CameraControlRelativeInfo& tilt_info);
5 // Set the Pan/Tilt direction and speed. Set value to Stop to stop an axis.
6 bool SetPanTiltRelative(CameraControlRelativeInfo pan_info,CameraControlRelativeInfo tilt_info);
```

#### Absolute Position

The absolute-position APIs read or set a gimbal target angle and are suitable for fixed camera
positions and predefined views. Values are expressed in arcseconds:  1 degree = 3,600
arcseconds . Multiply degrees by 3,600 when setting a value and divide the returned raw value
by 3,600 when reading it. The Pan range is  -145 degrees to 145 degrees , and the Tilt
range is  -45 degrees to 90 degrees .


```cpp
1 // Conversion factor: 3,600 arcseconds per degree. See the Demo main.cc.
2 // Raw unit: 1/3600 degree (1 arcsecond). raw_value = degrees * 3600.
3 // Angle ranges: Pan [-145, 145] degrees; Tilt [-45, 90] degrees.
4 // Raw ranges: Pan [-522000, 522000]; Tilt [-162000, 324000].
5 // Get the raw absolute Pan/Tilt position.
6 bool GetPanTiltAbsoluteValue(int32_t& pan_value, int32_t& tilt_value);
7 // Set the raw absolute Pan/Tilt position.
8 bool SetPanTiltAbsolute(int32_t pan_value, int32_t tilt_value);
```

#### Host PTZ: Link 2C / Link 2C Pro

Fixed-lens models do not have a mechanical gimbal. They reframe the image using digital zoom
and cropping.  HostPTZInfo  contains the zoom value, crop center, and adjustment step sizes.


```cpp
1 // Only zoomX and zoomY use normalized coordinates:
2 // 0 to 0xFFFF maps to 0.0 to 1.0. See the Demo main.cc.
3
4 struct HostPTZInfo {
5 uint16_t ratio; // Zoom value. Refer to the SDK definition for its unit

and valid range.
6 uint16_t zoomX; // Horizontal crop center: normalizedX * 65535.
7 uint16_t zoomY; // Vertical crop center: normalizedY * 65535.
8 uint8_t move_step; // Pan step size.
9 uint8_t ratio_step; // Zoom step size.
10 };
11 // Get the current Host PTZ parameters.
12 bool GetHostPTZ(HostPTZInfo& host_ptz_info);
13
14 // Set the Host PTZ parameters.
15 bool SetHostPTZ(HostPTZInfo& host_ptz_info);
```

#### Other PTZ-Related State


```cpp
1 bool GetRealZoomValue(uint16_t& zoom); // Get the current real-time

zoom value.
2 bool GetDrawBoxStatus(DrawBoxType& type, std::vector<DrawBoxInfo>& infos); //
Get the current box-overlay state.
3
4 bool SetUDiskOpenCount(uint32_t count);
5 bool GetUDiskOpenCount(uint32_t& count); // Get the USB storage open
count.
```

## 5. Firmware Update

On Windows, you must install the  libusbK  driver before starting a firmware update and
verify that the SDK can enumerate and identify the target camera.
Firmware update is not supported on Linux. The API reports failure through the callback and
returns  false .


```cpp
1 static bool FirmwareUpgrade(const UVCCameraInfo& info,
2 const std::string& file_path,
3 FirmwareUpgradeProgressCallBack callback);
```

Recommended procedure:
1. Before the update, record the serial number, model, PID, current firmware version, and
power/connection state.
2. Verify that the firmware file exists, is readable, and matches the target camera model. Do not
run a firmware update concurrently with USB storage switching, factory reset, or other
control operations on the same device.
3. Check both the synchronous return value and callback status. A successful synchronous
return means that the update task started; it does not mean that the firmware update has
completed. Use the callback contract to determine the final result.
4. Do not disconnect USB or operate the camera during the update. Also prevent the host
application from exiting or the computer from sleeping, and avoid any operation that could
interrupt the USB connection.

5. After the update, read the firmware version again to verify the result. If the device
disconnected or re-enumerated, discover it again and recreate the controllers first.

## 6. macOS Hot-Plug Monitoring

UVCCameraDeviceWatcher  is available only on macOS and monitors Link series camera
connection and removal events. On Windows and Linux, use the platform's device-notification
mechanism or enumerate devices again at an appropriate interval.
The following snippet shows both ends of the watcher lifecycle. In a real application, keep the
watcher alive and call StopWatch only when the application exits or monitoring is no longer
required; do not call it immediately after StartWatch.


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
17 // Call this when the application exits or no longer needs monitoring.
18 watcher.StopWatch();
```

Keep the watcher alive for the entire monitoring period and call  StopWatch  before the
application exits. After receiving a removal event, stop issuing commands and release
application state associated with that device.

## 7. Recommended Integration Flow

1. Prepare the runtime environment: Load the SDK library that matches the operating system
and architecture, then verify device permissions and the USB data connection.

2. Enumerate devices: Call  uvc::GetUVCCameraList  and select the target using a stable
identifier.
3. Create controllers: Use the same  UVCCameraInfo  to create the standard and extension
controllers.
4. Identify capabilities: Read the camera type, PID, serial number, firmware version, and
media formats. Hide controls that are not supported by the selected model.
5. Read current state: Before initializing the UI, read the current mode, auto-exposure, white-
balance, autofocus, image, audio, and extension-feature states.
6. Apply settings: Configure automatic/manual modes before their dependent parameters.
Query numeric ranges before setting values, and verify enum support for the selected model.
7. Start video capture: Use a format returned by  GetMediaFormatList  in the platform's
video-capture framework, and handle device-busy and bandwidth errors.
8. Serialize control commands: Route PTZ, tracking, mode, exposure, and audio writes
through a single command queue. Add stop commands and timeout protection for
continuous PTZ operations.
9. Handle restarts and hot-plug events: Read state again after a mode restart, USB storage
switch, firmware update, factory reset, or reconnection. If the device disconnects or re-
enumerates, discover it again and recreate the controllers.
10. Shut down cleanly: Stop capture and hot-plug monitoring, cancel pending commands, and
then release the controllers.
