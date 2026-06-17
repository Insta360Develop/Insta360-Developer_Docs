import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { productNav, buildSidebar } from './shared.mts'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> & {
  label: string
  link?: string
} = {
  label: '简体中文',
  lang: 'zh-Hans',
  title: 'Insta360 SDK/API 开发者文档',
  description: 'X / GO / ACE / Wave / Link 系列 SDK 的集成指南与接口文档',
  themeConfig: {
    siteTitle: 'SDK/API 开发者文档',
    nav: [
      { text: '首页', link: '/ch/' },
      { text: '产品', items: productNav('ch') },
      {
        text: '开发者资源',
        items: [
          { text: 'Insta360 Enterprise', link: 'https://www.insta360.com/cn/enterprise' },
          { text: 'SDK 申请与下载', link: 'https://www.insta360.com/cn/developer/home' },
          { text: '问题反馈表单', link: 'https://insta.jinshuju.com/f/hZ4aMW' }
        ]
      }
    ],
    sidebar: buildSidebar('ch'),
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    langMenuLabel: '切换语言'
  }
}

export const zhSearch: DefaultTheme.LocalSearchOptions['locales'] = {
  ch: {
    translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: {
        noResultsText: '无法找到相关结果',
        resetButtonTitle: '清除查询条件',
        footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
      }
    }
  }
}
