# Insta360 SDK/API Developer Docs

Developer documentation for the Insta360 X / Go / ACE / Wave / Link series SDKs / APIs (built with VitePress, deployed on GitHub Pages).

## Online docs (recommended)

🌐 **<https://insta360develop.github.io/Insta360-Developer_Docs/>**

> ⚠️ If the Pages site above is unreachable (some networks have unstable access to `github.io`), you can browse the **in-repo Markdown docs** below as a fallback — readable as long as you can access this repository.

---

## 📚 Documentation (in-repo Markdown · fallback)

**X Series** — [Overview](docs/en/x/index.md)

| Doc set | Overview | Release Notes | API Reference |
| --- | --- | --- | --- |
| Android SDK | [Overview](docs/en/x/android/guide/index.md) | [Release Notes](docs/en/x/android/changelog.md) | [API](docs/en/x/android/api/index.md) |
| iOS SDK | [Overview](docs/en/x/ios/guide/index.md) | [Release Notes](docs/en/x/ios/changelog.md) | [API](docs/en/x/ios/api/index.md) |
| Desktop SDK | [Overview](docs/en/x/desktop/guide/index.md) | [Release Notes](docs/en/x/desktop/changelog.md) | [Camera SDK](docs/en/x/desktop/camera/index.md) · [Media SDK](docs/en/x/desktop/media/index.md) |
| OSC Protocol | [Overview](docs/en/x/osc/guide/index.md) | — | [API](docs/en/x/osc/api/index.md) |

**Other series (not yet available)**: [Go](docs/en/go/index.md) · [ACE](docs/en/ace/index.md) · [Wave](docs/en/wave/index.md) · [Link](docs/en/link/index.md)

---

## Developer resources

- **Insta360 Enterprise**: <https://www.insta360.com/enterprise>
- **Apply for the SDK**: <https://www.insta360.com/developer/home>
- **Feedback form**: <https://insta.jinshuju.com/f/hZ4aMW>

## Local development

```bash
npm install
npm run dev     # local preview
npm run build   # build the static site into docs/.vitepress/dist
```
