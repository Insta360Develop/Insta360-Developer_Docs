import type { DefaultTheme } from 'vitepress'

type Lang = 'ch' | 'en'

/** 两种语言都是子目录：中文 /ch，英文 /en */
const prefix: Record<Lang, string> = { ch: '/ch', en: '/en' }

/**
 * 一个文档集（系列下的某个平台 SDK，或单一 SDK / 协议）。
 */
interface DocSet {
  key: string
  ch: string
  en: string
}

/** 一个产品系列 */
interface Series {
  key: string
  ch: string
  en: string
  /** 该系列当前对外展示的文档集；为空数组表示单一 SDK / 协议 */
  docSets: DocSet[]
}

/**
 * 产品矩阵 —— 全站结构的唯一数据源。
 * 新增系列 / 平台 / 协议，只需在此增改，nav 与 sidebar 会自动生成。
 * 注意：当前不展示「计划中尚未支持」的平台（如 Go / ACE 的 iOS）。
 */
export const seriesList: Series[] = [
  {
    key: 'x',
    ch: 'X 系列',
    en: 'X Series',
    docSets: [
      { key: 'android', ch: 'Android SDK', en: 'Android SDK' },
      { key: 'ios', ch: 'iOS SDK', en: 'iOS SDK' },
      { key: 'desktop', ch: '桌面端 SDK', en: 'Desktop SDK' },
      { key: 'osc', ch: 'OSC 协议', en: 'OSC Protocol' }
    ]
  },
  {
    key: 'go',
    ch: 'Go 系列',
    en: 'Go Series',
    docSets: [{ key: 'android', ch: 'Android SDK', en: 'Android SDK' }]
  },
  {
    key: 'ace',
    ch: 'ACE 系列',
    en: 'ACE Series',
    docSets: [{ key: 'android', ch: 'Android SDK', en: 'Android SDK' }]
  },
  {
    key: 'wave',
    ch: 'Wave 系列',
    en: 'Wave Series',
    docSets: [] // 单一 SDK，不分平台
  },
  {
    key: 'link',
    ch: 'Link 系列',
    en: 'Link Series',
    docSets: [] // 单一 SDK / 协议
  }
]

const L = {
  ch: {
    seriesOverview: '系列概述',
    guide: '集成指南',
    quickstart: '快速入门',
    install: '安装与初始化',
    overview: '概述',
    api: '接口文档',
    apiOverview: '接口总览',
    changelog: '版本更新记录',
    notice: '重要提示',
    products: '产品',
    home: '首页',
    download: '下载'
  },
  en: {
    seriesOverview: 'Overview',
    guide: 'Integration Guide',
    quickstart: 'Quick Start',
    install: 'Installation & Setup',
    overview: 'Overview',
    api: 'API Reference',
    apiOverview: 'API Overview',
    changelog: 'Changelog',
    notice: 'Important Notes',
    products: 'Products',
    home: 'Home',
    download: 'Downloads'
  }
} as const

/** 一个文档集内部固定的四块：集成指南 / 接口文档 / 版本记录 / 重要提示 */
function docSections(lang: Lang, base: string): DefaultTheme.SidebarItem[] {
  const t = L[lang]
  return [
    {
      text: t.guide,
      collapsed: false,
      items: [
        { text: t.overview, link: `${base}/guide/` },
        { text: t.quickstart, link: `${base}/guide/quickstart` },
        { text: t.install, link: `${base}/guide/installation` }
      ]
    },
    {
      text: t.api,
      collapsed: false,
      items: [
        { text: t.apiOverview, link: `${base}/api/` }
        // 各接口条目在此扩展，例如：
        // { text: 'CaptureManager', link: `${base}/api/capture-manager` }
      ]
    },
    { text: t.changelog, link: `${base}/changelog` },
    { text: t.notice, link: `${base}/notice` }
  ]
}

/** 为某个系列生成左侧边栏 */
function seriesSidebar(lang: Lang, s: Series): DefaultTheme.SidebarItem[] {
  const t = L[lang]
  const sbase = `${prefix[lang]}/${s.key}`
  const items: DefaultTheme.SidebarItem[] = [
    { text: t.seriesOverview, link: `${sbase}/` }
  ]

  if (s.docSets.length === 0) {
    // 单一 SDK / 协议：四块直接挂在系列根下
    items.push(...docSections(lang, sbase))
  } else {
    // 多平台：每个平台一个可折叠分组，组内是四块
    for (const d of s.docSets) {
      items.push({
        text: lang === 'ch' ? d.ch : d.en,
        collapsed: false,
        items: docSections(lang, `${sbase}/${d.key}`)
      })
    }
  }
  return items
}

/** 顶部导航的「产品」下拉项 */
export function productNav(lang: Lang): DefaultTheme.NavItemWithLink[] {
  return seriesList.map((s) => ({
    text: lang === 'ch' ? s.ch : s.en,
    link: `${prefix[lang]}/${s.key}/`,
    activeMatch: `${prefix[lang]}/${s.key}/`
  }))
}

/** 生成整套 sidebar 映射：每个系列路径前缀对应一份侧边栏 */
export function buildSidebar(lang: Lang): DefaultTheme.SidebarMulti {
  const map: DefaultTheme.SidebarMulti = {}
  for (const s of seriesList) {
    map[`${prefix[lang]}/${s.key}/`] = seriesSidebar(lang, s)
  }
  return map
}

export { L, prefix }
export type { Series, DocSet }
