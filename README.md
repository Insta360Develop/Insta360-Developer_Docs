# Insta360 SDK/API 开发者文档

Insta360 X / Go / ACE / Wave / Link 系列的 SDK / API 开发者文档(基于 VitePress 构建,部署于 GitHub Pages)。

## 在线文档(推荐)

🌐 **<https://insta360develop.github.io/Insta360-Developer_Docs/>**

> ⚠️ 若上面的 Pages 站点打不开(部分网络对 `github.io` 访问不稳定),可直接浏览下方**仓库内的 Markdown 文档**

---

## 📚 文档导航(仓库内 Markdown)

### 中文文档

**X 系列** —— [系列概述](docs/ch/x/index.md)

| 文档集 | 概述 | 版本记录 | 接口文档 |
| --- | --- | --- | --- |
| Android SDK | [概述](docs/ch/x/android/guide/index.md) | [版本记录](docs/ch/x/android/changelog.md) | [接口文档](docs/ch/x/android/api/index.md) |
| iOS SDK | [概述](docs/ch/x/ios/guide/index.md) | [版本记录](docs/ch/x/ios/changelog.md) | [接口文档](docs/ch/x/ios/api/index.md) |
| 桌面端 SDK | [概述](docs/ch/x/desktop/guide/index.md) | [版本记录](docs/ch/x/desktop/changelog.md) | [Camera SDK](docs/ch/x/desktop/camera/index.md) · [Media SDK](docs/ch/x/desktop/media/index.md) |
| OSC 协议 | [概述](docs/ch/x/osc/guide/index.md) | — | [接口文档](docs/ch/x/osc/api/index.md) |

**其他系列(暂不支持)**:[Go 系列](docs/ch/go/index.md) · [ACE 系列](docs/ch/ace/index.md) · [Wave 系列](docs/ch/wave/index.md) · [Link 系列](docs/ch/link/index.md)

### English Docs

**X Series** —— [Overview](docs/en/x/index.md)

| Doc set | Overview | Release Notes | API Reference |
| --- | --- | --- | --- |
| Android SDK | [Overview](docs/en/x/android/guide/index.md) | [Release Notes](docs/en/x/android/changelog.md) | [API](docs/en/x/android/api/index.md) |
| iOS SDK | [Overview](docs/en/x/ios/guide/index.md) | [Release Notes](docs/en/x/ios/changelog.md) | [API](docs/en/x/ios/api/index.md) |
| Desktop SDK | [Overview](docs/en/x/desktop/guide/index.md) | [Release Notes](docs/en/x/desktop/changelog.md) | [Camera SDK](docs/en/x/desktop/camera/index.md) · [Media SDK](docs/en/x/desktop/media/index.md) |
| OSC Protocol | [Overview](docs/en/x/osc/guide/index.md) | — | [API](docs/en/x/osc/api/index.md) |

**Other series (not yet available)**: [Go](docs/en/go/index.md) · [ACE](docs/en/ace/index.md) · [Wave](docs/en/wave/index.md) · [Link](docs/en/link/index.md)

---

## 开发者资源

- **Insta360 Enterprise**:<https://www.insta360.com/cn/enterprise>
- **SDK 申请与下载**:<https://www.insta360.com/cn/developer/home>
- **问题反馈表单**:<https://insta.jinshuju.com/f/hZ4aMW>

## 本地开发

```bash
npm install
npm run dev     # 本地预览
npm run build   # 构建静态站点到 docs/.vitepress/dist
```
