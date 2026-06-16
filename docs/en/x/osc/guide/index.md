# OSC Protocol Overview

The **OSC protocol** is based on the [Google OSC (Open Spherical Camera) specification](https://developers.google.com/streetview/open-spherical-camera). It controls the camera directly over HTTP — cross-language and cross-platform, with no native SDK to integrate.

## Supported cameras

ONE X, ONE X2, ONE R, ONE RS, X3, X4, X4 Air, X5.

## Connecting

After the device joins the camera's Wi-Fi hotspot, the camera IP is `192.168.42.1`.

Include these request headers:

```
Content-Type: application/json;charset=utf-8
Accept: application/json
Content-Length: {CONTENT_LENGTH}
X-XSRF-Protected: 1
```

::: tip Recommended
Send the next `osc/commands` request only **after the previous reply is received**; call `/osc/info` no more than once per second.
:::

➡️ Full request / response examples are in the **[API Reference](../api/)**.
