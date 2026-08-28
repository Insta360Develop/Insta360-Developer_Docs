# Insta360 SDK/API Developer Docs

Developer documentation for the Insta360 X / Go / ACE / Wave / Link series SDKs / APIs (built with VitePress, deployed on GitHub Pages).

## Online docs (recommended)

🌐 **<https://insta360develop.github.io/Insta360-Developer_Docs/>**

> ⚠️ If the Pages site above is unreachable (some networks have unstable access to `github.io`), you can browse the **in-repo Markdown docs** below as a fallback — readable as long as you can access this repository.

---

## 📚 Documentation (in-repo Markdown · fallback)

Source files live under `docs/en/sdk/` (English) and `docs/ch/sdk/` (Chinese) — see [Repository structure](#repository-structure).

**X / ACE / GO API & SDK** — one shared doc set for all three series

| Doc set | Overview | Release Notes | API Reference | Used by |
| --- | --- | --- | --- | --- |
| Android SDK | [Overview](docs/en/sdk/x-ace-go/android/guide.md) · [Dev Environment](docs/en/sdk/x-ace-go/android/environment.md) · [Camera Integration](docs/en/sdk/x-ace-go/android/camera-integration.md) · [Media Integration](docs/en/sdk/x-ace-go/android/media-integration.md) | [Release Notes](docs/en/sdk/x-ace-go/android/changelog.md) | [Camera SDK](docs/en/sdk/x-ace-go/android/camera-api.md) · [Media SDK](docs/en/sdk/x-ace-go/android/media-api.md) · [Legacy 1.x.x](docs/en/sdk/x-ace-go/android/legacy-api.md) (X only) | X · ACE · GO |
| iOS SDK | [Overview](docs/en/sdk/x-ace-go/ios/guide.md) | [Release Notes](docs/en/sdk/x-ace-go/ios/changelog.md) | [API](docs/en/sdk/x-ace-go/ios/api.md) | X |
| Desktop SDK | [Overview](docs/en/sdk/x-ace-go/desktop/guide.md) | [Release Notes](docs/en/sdk/x-ace-go/desktop/changelog.md) | [Camera SDK](docs/en/sdk/x-ace-go/desktop/camera.md) · [Media SDK](docs/en/sdk/x-ace-go/desktop/media.md) | X |
| OSC Protocol | [Overview](docs/en/sdk/x-ace-go/osc/guide.md) | — | [API](docs/en/sdk/x-ace-go/osc/api.md) | X |

**Link SDK** and **Wave SDK** — not yet available.

**Series overviews**: [X](docs/en/x/index.md) · [ACE](docs/en/ace/index.md) · [GO](docs/en/go/index.md) · [Link](docs/en/link/index.md) · [Wave](docs/en/wave/index.md)

---

## Repository structure

Content and routing are deliberately separated, so an SDK shared by several series is written once.

```
docs/{ch,en}/
├─ index.md              home page — product series cards
├─ x/  ace/  go/         series overview + thin per-series page shells
├─ link/  wave/          series overview only — no SDK published yet
└─ sdk/                  ← the single source of truth for all SDK content
    └─ x-ace-go/         shared by the X, ACE and GO series
        ├─ android/  guide.md · changelog.md          (platform-wide overview / release notes)
        │            environment.md · camera-integration.md · media-integration.md
        │            camera-api.md · media-api.md     (V2.x.x — X · ACE · GO)
        │            legacy-api.md                    (V1.x.x — X series only)
        ├─ ios/      guide.md · changelog.md · api.md
        ├─ desktop/  guide.md · changelog.md · camera.md · media.md
        └─ osc/      guide.md · api.md
```

- **`docs/{ch,en}/sdk/**`** holds the actual content. It is excluded from routing
  (`srcExclude` in [docs/.vitepress/config.mts](docs/.vitepress/config.mts)), so these files
  generate no pages of their own. **Edit documentation here.**
- **`docs/{ch,en}/<series>/<platform>/…/index.md`** are one-line shells:
  `<!--@include: ../../../sdk/x-ace-go/android/camera-api.md-->`. They own the URL and keep the
  sidebar in that series' context. A single edit to a shared source updates every series.
- **Navigation** is generated from `sdkGroups` and `seriesList` in
  [docs/.vitepress/configs/shared.mts](docs/.vitepress/configs/shared.mts) — the single source
  of truth for nav and sidebars. A doc set either lists its pages explicitly via `pages` (what
  Android does) or falls back to the default `overview → changelog → api` pattern. A page may
  carry `series: ['x']` to appear for some series only — that is how the legacy Android API doc
  stays out of the ACE / GO sidebars.

### Common tasks

| Task | What to do |
| --- | --- |
| Fix or extend an SDK doc | Edit the file under `docs/{ch,en}/sdk/…` — all series pick it up |
| A series gains a platform (e.g. ACE adds iOS) | Add the key to that series' `platforms` in `shared.mts`, then add the shell pages under `docs/{ch,en}/ace/ios/` |
| Add a whole new SDK | Add a group to `sdkGroups`, put the content in `docs/{ch,en}/sdk/<group>/`, and reference it from `seriesList` |

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
