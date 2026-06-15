# 接口文档

本节按模块说明每个接口的参数、返回值、错误码与示例。可使用右上角搜索快速定位接口名。

## 接口模块

| 模块 | 说明 |
| --- | --- |
| `SdkManager` | SDK 生命周期：初始化、连接、释放 |
| `CaptureManager` | 拍照、录像等采集相关接口 |
| `MediaManager` | 媒体文件的下载、删除与列表 |

::: info 文档结构约定
每个接口条目固定包含：**签名 → 参数 → 返回值 → 错误码 → 示例**，方便快速查阅。下面以 `CaptureManager.takePhoto` 为例。
:::

---

## CaptureManager.takePhoto

拍摄一张照片，异步返回结果。

### 签名

```kotlin
fun takePhoto(callback: CaptureCallback)
```

### 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `CaptureCallback` | 是 | 结果回调，在主线程触发 |

### 返回值

无（结果通过 `callback` 异步返回）。

`CaptureResult` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `url` | String | 生成文件的本地地址 |
| `width` | Int | 图像宽度（像素） |
| `height` | Int | 图像高度（像素） |
| `timestamp` | Long | 拍摄时间戳（毫秒） |

### 错误码

| Code | 含义 | 处理建议 |
| --- | --- | --- |
| `1001` | 设备未连接 | 先调用 `SdkManager.connect` |
| `1002` | 存储空间不足 | 清理空间后重试 |
| `1003` | 设备忙 | 等待当前任务结束后重试 |

### 示例

```kotlin
CaptureManager.takePhoto(object : CaptureCallback {
    override fun onSuccess(result: CaptureResult) {
        Log.d("SDK", "照片已保存：${result.url}")
    }
    override fun onError(error: SdkError) {
        Log.e("SDK", "拍照失败：${error.code}")
    }
})
```

::: tip 复制此模板
新增接口时复制上面「签名 → 参数 → 返回值 → 错误码 → 示例」结构，并在侧边栏 `shared.mts` 中补充对应的导航条目。
:::
