import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import './custom.css'
import HeroLinks from './components/HeroLinks.vue'

// 扩展默认主题：样式覆盖 + 首页 Hero 右侧注入「开发者资源」卡片组。
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroLinks)
    })
  }
} satisfies Theme
