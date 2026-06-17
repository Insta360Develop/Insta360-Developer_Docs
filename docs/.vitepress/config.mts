import { defineConfig } from 'vitepress'
import { zhConfig, zhSearch } from './configs/zh.mts'
import { enConfig } from './configs/en.mts'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // GitHub Pages 子路径部署：公开仓库名为 Insta360-Developer_Docs
  // 页面地址 https://insta360develop.github.io/Insta360-Developer_Docs/
  // base 必须与仓库名（Pages 子路径）完全一致，否则 CSS/JS 资源 404、页面无样式
  // 若以后改用自定义域名（如 docs.insta360.com），将 base 改为 '/'
  base: '/Insta360-Developer_Docs/',

  // 多个 SDK 文档共用此站点，通过顶部「产品」切换系列
  title: 'Insta360 SDK/API Docs',
  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0a84ff' }]
  ],

  // 国际化：中文在 /ch/，英文在 /en/；站点根 / 由 docs/index.md 重定向到 /ch/
  locales: {
    ch: { ...zhConfig },
    en: { ...enConfig }
  },

  themeConfig: {
    // 导航栏 logo：影石 Insta360 官方标志（黑字黄底）
    logo: '/insta360-logo.png',
    // siteTitle 按语言在 zh.mts / en.mts 中各自覆盖（避免与 logo 里的 Insta360 重复）

    // 本地搜索（多语言）
    search: {
      provider: 'local',
      options: {
        locales: { ...zhSearch }
      }
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/' }]
  }
})
