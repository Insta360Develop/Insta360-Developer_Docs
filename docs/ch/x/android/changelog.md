---
outline: [2, 2]
---

# 版本更新记录

本页记录 Android SDK 各版本的变更。遵循[语义化版本](https://semver.org/lang/zh-CN/)。

::: warning 升级提示
带有 **破坏性变更** 标记的版本包含不兼容改动，升级前请阅读对应说明。
:::

## 1.4.0 · 2026-05-20

**新增**
- `MediaManager.batchDownload` 支持批量下载媒体文件。
- 连接配置新增 `timeout` 参数。

**优化**
- 降低初始化耗时约 30%。

**修复**
- 修复弱网下连接回调可能不触发的问题。

## 1.3.1 · 2026-03-11

**修复**
- 修复 `takePhoto` 在部分机型上返回空 `url` 的问题。

## 1.3.0 · 2026-02-02 · 破坏性变更

**破坏性变更**
- `SdkManager.init` 的参数由独立形参改为 `SdkConfig`。迁移示例：

  ```kotlin
  // 旧
  SdkManager.init(this, "APP_KEY", true)
  // 新
  SdkManager.init(this, SdkConfig.Builder().setAppKey("APP_KEY").enableLog(true).build())
  ```

**新增**
- 新增 `CaptureManager` 模块。
