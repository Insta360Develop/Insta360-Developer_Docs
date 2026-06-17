import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { productNav, buildSidebar } from './shared.mts'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> & {
  label: string
  link?: string
} = {
  label: 'English',
  lang: 'en-US',
  title: 'Insta360 SDK/API Developer Docs',
  description: 'Integration guides and API references for X / Go / ACE / Wave / Link series SDKs',
  themeConfig: {
    siteTitle: 'SDK/API Developer Docs',
    nav: [
      { text: 'Home', link: '/en/' },
      { text: 'Products', items: productNav('en') },
      {
        text: 'Resources',
        items: [
          { text: 'Insta360 Enterprise', link: 'https://www.insta360.com/cn/enterprise' },
          { text: 'Apply for the SDK', link: 'https://www.insta360.com/cn/developer/home' },
          { text: 'Feedback form', link: 'https://insta.jinshuju.com/f/hZ4aMW' }
        ]
      }
    ],
    sidebar: buildSidebar('en'),
    outline: { level: [2, 3], label: 'On this page' },
    docFooter: { prev: 'Previous', next: 'Next' },
    lastUpdatedText: 'Last updated'
  }
}
