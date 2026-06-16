# OSC 协议 概述

**OSC 协议**基于 [Google OSC(Open Spherical Camera)规范](https://developers.google.com/streetview/open-spherical-camera)编写,通过 HTTP 直接控制相机,跨语言、跨平台,无需集成原生 SDK。

## 支持机型

ONE X、ONE X2、ONE R、ONE RS、X3、X4、X4 Air、X5。

## 连接方式

设备连接到相机的 Wi-Fi 热点后,相机 IP 地址为 `192.168.42.1`。

发送请求时需附带请求头:

```
Content-Type: application/json;charset=utf-8
Accept: application/json
Content-Length: {CONTENT_LENGTH}
X-XSRF-Protected: 1
```

::: tip 建议
所有 `osc/commands` 命令应在**收到上一条回复之后**再发送下一条;`/osc/info` 建议不超过 1 次/秒。
:::

➡️ 完整的请求 / 响应示例见 **[接口文档](../api/)**。
