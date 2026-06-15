# 快速入门

本页用一个最小示例带你跑通 SDK：初始化 → 连接 → 拍照。

## 1. 添加依赖

在模块级 `build.gradle` 中添加：

```groovy
dependencies {
    implementation 'com.example.sdk:core:1.4.0'
}
```

## 2. 初始化 SDK

建议在 `Application.onCreate()` 中完成初始化。

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SdkManager.init(
            context = this,
            config = SdkConfig.Builder()
                .setAppKey("YOUR_APP_KEY")
                .enableLog(BuildConfig.DEBUG)
                .build()
        )
    }
}
```

## 3. 连接设备

```kotlin
SdkManager.connect(object : ConnectListener {
    override fun onConnected(device: Device) {
        Log.d("SDK", "已连接：${device.serial}")
    }

    override fun onError(error: SdkError) {
        Log.e("SDK", "连接失败：${error.code} ${error.message}")
    }
})
```

## 4. 完成第一次调用

```kotlin
CaptureManager.takePhoto(object : CaptureCallback {
    override fun onSuccess(result: CaptureResult) {
        // result.url 为生成的文件地址
    }
    override fun onError(error: SdkError) { /* 处理错误 */ }
})
```

::: warning 注意
连接与拍照均为异步回调，回调默认在主线程触发。耗时处理请切换到工作线程。
:::

完成以上四步即可跑通基础流程。接口的完整参数请查阅 [接口文档](../api/)。
