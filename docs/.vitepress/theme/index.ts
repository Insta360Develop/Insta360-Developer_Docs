import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

// 扩展默认主题：仅做样式覆盖。
// 如需注入全局组件（如平台版本徽章），可在此 enhanceApp 中注册。
export default {
  extends: DefaultTheme
} satisfies Theme
