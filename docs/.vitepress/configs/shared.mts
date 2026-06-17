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
  /** 是否展示「重要提示」页，默认 true；置 false 则该文档集不含 notice */
  notice?: boolean
  /** 是否展示「版本记录」页（排在概述与接口文档之间），默认 false */
  changelog?: boolean
  /** 自定义接口文档子页（如桌面端拆分 Camera/Media）；缺省则用单一「接口文档」页 */
  apiDocs?: { key: string; ch: string; en: string }[]
}

/** 一个产品系列 */
interface Series {
  key: string
  ch: string
  en: string
  /** 该系列当前对外展示的文档集；为空数组表示单一 SDK / 协议 */
  docSets: DocSet[]
  /** 暂不支持的系列：只展示一个「敬请期待」单页，不进侧边栏 */
  comingSoon?: boolean
}

/**
 * 产品矩阵 —— 全站结构的唯一数据源。
 * 新增系列 / 平台 / 协议，只需在此增改，nav 与 sidebar 会自动生成。
 * 注意：当前不展示「计划中尚未支持」的平台（如 GO / ACE 的 iOS）。
 */
export const seriesList: Series[] = [
  {
    key: 'x',
    ch: 'X 系列',
    en: 'X Series',
    docSets: [
      { key: 'android', ch: 'Android SDK', en: 'Android SDK', notice: false, changelog: true },
      { key: 'ios', ch: 'iOS SDK', en: 'iOS SDK', notice: false, changelog: true },
      {
        key: 'desktop',
        ch: '桌面端 SDK',
        en: 'Desktop SDK',
        notice: false,
        changelog: true,
        apiDocs: [
          { key: 'camera', ch: 'Camera SDK 接口文档', en: 'Camera SDK API' },
          { key: 'media', ch: 'Media SDK 接口文档', en: 'Media SDK API' }
        ]
      },
      { key: 'osc', ch: 'OSC 协议', en: 'OSC Protocol', notice: false }
    ]
  },
  {
    key: 'go',
    ch: 'GO 系列',
    en: 'GO Series',
    docSets: [],
    comingSoon: true
  },
  {
    key: 'ace',
    ch: 'ACE 系列',
    en: 'ACE Series',
    docSets: [],
    comingSoon: true
  },
  {
    key: 'wave',
    ch: 'Wave 系列',
    en: 'Wave Series',
    docSets: [],
    comingSoon: true
  },
  {
    key: 'link',
    ch: 'Link 系列',
    en: 'Link Series',
    docSets: [],
    comingSoon: true
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
    changelog: '版本记录',
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
    changelog: 'Release Notes',
    notice: 'Important Notes',
    products: 'Products',
    home: 'Home',
    download: 'Downloads'
  }
} as const

/** 一个文档集内部的页面：概述 / 接口文档（可拆多页）/（可选）重要提示 */
function docSections(
  lang: Lang,
  base: string,
  opts: { notice?: boolean; changelog?: boolean; apiDocs?: DocSet['apiDocs'] } = {}
): DefaultTheme.SidebarItem[] {
  const t = L[lang]
  const items: DefaultTheme.SidebarItem[] = [
    { text: t.overview, link: `${base}/guide/` }
  ]
  // 版本记录排在概述之后、接口文档之前
  if (opts.changelog) {
    items.push({ text: t.changelog, link: `${base}/changelog` })
  }
  if (opts.apiDocs && opts.apiDocs.length) {
    // 拆分的接口文档：每个子页一个条目（如桌面端 Camera / Media）
    for (const a of opts.apiDocs) {
      items.push({ text: lang === 'ch' ? a.ch : a.en, link: `${base}/${a.key}/` })
    }
  } else {
    items.push({ text: t.api, link: `${base}/api/` })
  }
  if (opts.notice !== false) {
    items.push({ text: t.notice, link: `${base}/notice` })
  }
  return items
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
    // 多平台：每个平台一个可折叠分组，组内是各页面
    for (const d of s.docSets) {
      items.push({
        text: lang === 'ch' ? d.ch : d.en,
        collapsed: false,
        items: docSections(lang, `${sbase}/${d.key}`, {
          notice: d.notice,
          changelog: d.changelog,
          apiDocs: d.apiDocs
        })
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
    // 暂不支持的系列只有一个「敬请期待」单页，不配侧边栏（全宽展示）
    if (s.comingSoon) continue
    map[`${prefix[lang]}/${s.key}/`] = seriesSidebar(lang, s)
  }
  return map
}

export { L, prefix }
export type { Series, DocSet }
