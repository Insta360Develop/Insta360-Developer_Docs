import type { DefaultTheme } from 'vitepress'

type Lang = 'ch' | 'en'

/** 两种语言都是子目录：中文 /ch，英文 /en */
const prefix: Record<Lang, string> = { ch: '/ch', en: '/en' }

/**
 * ============================================================
 * 文档结构说明
 * ============================================================
 *
 * 目录分两层职责：
 *
 * 1. docs/{ch,en}/sdk/<分组>/<平台>/*.md
 *    —— 真正的文档内容，**唯一维护源**，不直接生成页面（config.mts 里 srcExclude 掉）。
 *    分组的含义就是「共用边界」：x-ace-go 一份文档服务三个系列。
 *    （Wave 暂无 SDK，因此 sdk/ 下没有 wave 目录，等有内容时再建。）
 *
 * 2. docs/{ch,en}/<系列>/<平台>/{guide,api,...}/index.md
 *    —— 一行 `<!--@include: -->` 的壳页，负责 URL 与侧边栏上下文。
 *    ACE 的 Android 与 X 的 Android 引同一个源文件，改一处即全部生效。
 *
 * 新增系列 / 平台：改下面的 sdkGroups 与 seriesList，再补对应壳页即可，
 * nav 与 sidebar 全部自动生成。
 */

/** 文档集里的一个页面 */
interface DocPage {
  key: string
  ch: string
  en: string
  /**
   * true  —— 壳页是 <平台>/<key>.md，URL 为 …/<key>（如版本记录）
   * 缺省 —— 壳页是 <平台>/<key>/index.md，URL 为 …/<key>/
   */
  flat?: boolean
  /** 仅这些系列展示该页；缺省则所有支持该平台的系列都展示 */
  series?: string[]
}

/** 一份平台 SDK 文档（Android / iOS / 桌面端 / OSC …） */
interface DocSet {
  key: string
  ch: string
  en: string
  /**
   * 显式指定页面清单（Android 这类不走「概述 + 接口文档」范式的文档集用它）。
   * 给出 pages 时，下面的 notice / changelog / apiDocs 全部忽略。
   */
  pages?: DocPage[]
  /** 是否展示「重要提示」页，默认 false */
  notice?: boolean
  /** 是否展示「版本记录」页（排在概述与接口文档之间），默认 false */
  changelog?: boolean
  /** 自定义接口文档子页（如桌面端拆分 Camera / Media）；缺省则用单一「接口文档」页 */
  apiDocs?: { key: string; ch: string; en: string }[]
}

/** 一个 SDK 分组，对应 docs/{ch,en}/sdk/ 下的一个目录 */
interface SdkGroup {
  key: string
  ch: string
  en: string
  docSets: DocSet[]
}

/**
 * SDK 分组总表 —— 共享文档的唯一数据源。
 * x-ace-go：X / ACE / GO 三个系列共用同一套 SDK，文档只维护一份。
 * link / wave：暂无 SDK，只在系列概述里标注待开放，因此 docSets 为空，
 *              sdk/ 下也不建目录，等有内容时再补。
 */
export const sdkGroups: SdkGroup[] = [
  {
    key: 'x-ace-go',
    ch: 'X/ACE/GO API & SDK',
    en: 'X/ACE/GO API & SDK',
    docSets: [
      {
        // Android 的「概述」与「版本记录」是整个平台的全局页（排最上），
        // 其后是新版 SDK（V2.x）的环境 / 集成指南 / 接口文档，三个系列共用。
        // 最下方的旧版接口文档只服务 X 系列（用 series 限定）。
        key: 'android',
        ch: 'Android SDK',
        en: 'Android SDK',
        pages: [
          { key: 'guide', ch: '概述', en: 'Overview' },
          { key: 'changelog', ch: '版本记录', en: 'Release Notes', flat: true },
          { key: 'environment', ch: '推荐开发环境', en: 'Development Environment' },
          { key: 'camera-integration', ch: 'Camera SDK 集成指南', en: 'Camera SDK Integration' },
          { key: 'media-integration', ch: 'Media SDK 集成指南', en: 'Media SDK Integration' },
          { key: 'camera-api', ch: 'Camera SDK 接口文档', en: 'Camera SDK API' },
          { key: 'media-api', ch: 'Media SDK 接口文档', en: 'Media SDK API' },
          {
            key: 'legacy-api',
            ch: '接口文档（旧版 1.x.x）',
            en: 'API Reference (Legacy 1.x.x)',
            series: ['x']
          }
        ]
      },
      { key: 'ios', ch: 'iOS SDK', en: 'iOS SDK', changelog: true },
      {
        key: 'desktop',
        ch: '桌面端 SDK',
        en: 'Desktop SDK',
        changelog: true,
        apiDocs: [
          { key: 'camera', ch: 'Camera SDK 接口文档', en: 'Camera SDK API' },
          { key: 'media', ch: 'Media SDK 接口文档', en: 'Media SDK API' }
        ]
      },
      { key: 'osc', ch: 'OSC 协议', en: 'OSC Protocol' }
    ]
  },
  {
    key: 'link',
    ch: 'Link SDK',
    en: 'Link SDK',
    docSets: []
  },
  {
    key: 'wave',
    ch: 'Wave SDK',
    en: 'Wave SDK',
    docSets: []
  }
]

/** 一个产品系列 */
interface Series {
  key: string
  ch: string
  en: string
  /** 该系列的文档来自哪个 SDK 分组 */
  group: string
  /** 该系列已支持的平台 —— 填所属分组 docSets 里的 key */
  platforms: string[]
  /** 计划中但尚未支持的平台（仅在系列概述里标注，不进侧边栏） */
  planned?: string[]
  /** 暂无 SDK 的系列：只展示一个「敬请期待」单页，不配侧边栏 */
  comingSoon?: boolean
}

/**
 * 产品系列矩阵 —— 全站导航的唯一数据源。
 * 首页的产品系列卡片顺序与此保持一致。
 */
export const seriesList: Series[] = [
  {
    key: 'x',
    ch: 'X 系列',
    en: 'X Series',
    group: 'x-ace-go',
    platforms: ['android', 'ios', 'desktop', 'osc']
  },
  {
    key: 'go',
    ch: 'GO 系列',
    en: 'GO Series',
    group: 'x-ace-go',
    platforms: ['android'],
    planned: ['ios', 'desktop']
  },
  {
    key: 'ace',
    ch: 'ACE 系列',
    en: 'ACE Series',
    group: 'x-ace-go',
    platforms: ['android'],
    planned: ['ios', 'desktop']
  },
  {
    key: 'wave',
    ch: 'Wave 系列',
    en: 'Wave Series',
    group: 'wave',
    platforms: [],
    comingSoon: true
  },
  {
    key: 'link',
    ch: 'Link 系列',
    en: 'Link Series',
    group: 'link',
    platforms: [],
    comingSoon: true
  }
]

const groupMap = new Map(sdkGroups.map((g) => [g.key, g]))

/** 取某个系列某个平台的文档集定义 */
function docSetOf(s: Series, platform: string): DocSet | undefined {
  return groupMap.get(s.group)?.docSets.find((d) => d.key === platform)
}

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

/** 单个页面的链接：flat 页是 …/key，其余是 …/key/ */
function pageLink(base: string, p: DocPage): string {
  return p.flat ? `${base}/${p.key}` : `${base}/${p.key}/`
}

/**
 * 一个文档集内部的页面清单。
 * 给了 pages 就按 pages 走（Android 新版 SDK）；
 * 否则用默认范式：概述 /（可选）版本记录 / 接口文档（可拆多页）/（可选）重要提示。
 * seriesKey 用于过滤只在特定系列展示的页面（如旧版接口文档只给 X 系列）。
 */
function docSections(
  lang: Lang,
  base: string,
  d: DocSet,
  seriesKey?: string
): DefaultTheme.SidebarItem[] {
  const t = L[lang]
  const items: DefaultTheme.SidebarItem[] = []

  if (d.pages && d.pages.length) {
    for (const p of d.pages) {
      if (p.series && seriesKey && !p.series.includes(seriesKey)) continue
      items.push({ text: lang === 'ch' ? p.ch : p.en, link: pageLink(base, p) })
    }
    return items
  }

  items.push({ text: t.overview, link: `${base}/guide/` })
  // 版本记录排在概述之后、接口文档之前
  if (d.changelog) {
    items.push({ text: t.changelog, link: `${base}/changelog` })
  }
  if (d.apiDocs && d.apiDocs.length) {
    // 拆分的接口文档：每个子页一个条目（如桌面端 Camera / Media）
    for (const a of d.apiDocs) {
      items.push({ text: lang === 'ch' ? a.ch : a.en, link: `${base}/${a.key}/` })
    }
  } else {
    items.push({ text: t.api, link: `${base}/api/` })
  }
  if (d.notice) {
    items.push({ text: t.notice, link: `${base}/notice` })
  }
  return items
}

/**
 * 为某个系列生成左侧边栏：系列概述 + 该系列支持的各平台分组。
 * 链接全部落在本系列路径下（如 /ch/ace/android/api/），
 * 因此用户在共享文档里浏览时，侧边栏始终保持在自己的系列上下文。
 */
function seriesSidebar(lang: Lang, s: Series): DefaultTheme.SidebarItem[] {
  const t = L[lang]
  const sbase = `${prefix[lang]}/${s.key}`
  const items: DefaultTheme.SidebarItem[] = [{ text: t.seriesOverview, link: `${sbase}/` }]

  for (const platform of s.platforms) {
    const d = docSetOf(s, platform)
    if (!d) continue
    items.push({
      text: lang === 'ch' ? d.ch : d.en,
      collapsed: false,
      items: docSections(lang, `${sbase}/${d.key}`, d, s.key)
    })
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
    // 暂无 SDK 的系列只有一个「敬请期待」单页，不配侧边栏（全宽展示）
    if (s.comingSoon) continue
    map[`${prefix[lang]}/${s.key}/`] = seriesSidebar(lang, s)
  }
  return map
}

export { L, prefix, groupMap, docSetOf }
export type { Series, DocSet, SdkGroup, DocPage }
