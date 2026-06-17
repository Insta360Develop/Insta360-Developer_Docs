<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const isZh = computed(() => lang.value.startsWith('zh'))

const data = computed(() =>
  isZh.value
    ? {
        title: '开发者资源',
        items: [
          {
            icon: '🏢',
            title: 'Insta360 Enterprise',
            desc: '企业解决方案官网',
            href: 'https://www.insta360.com/cn/enterprise'
          },
          {
            icon: '🔑',
            title: 'SDK 申请与下载',
            desc: '前往开发者主页申请',
            href: 'https://www.insta360.com/cn/developer/home'
          },
          {
            icon: '💬',
            title: '问题反馈',
            desc: '开发者问题反馈表单',
            href: 'https://insta.jinshuju.com/f/hZ4aMW'
          }
        ]
      }
    : {
        title: 'Resources',
        items: [
          {
            icon: '🏢',
            title: 'Insta360 Enterprise',
            desc: 'Enterprise solutions',
            href: 'https://www.insta360.com/enterprise'
          },
          {
            icon: '🔑',
            title: 'Apply for the SDK',
            desc: 'Developer home',
            href: 'https://www.insta360.com/developer/home'
          },
          {
            icon: '💬',
            title: 'Feedback',
            desc: 'Developer feedback form',
            href: 'https://insta.jinshuju.com/f/hZ4aMW'
          }
        ]
      }
)
</script>

<template>
  <div class="hero-links">
    <div class="hero-links-title">{{ data.title }}</div>
    <a
      v-for="it in data.items"
      :key="it.href"
      class="hero-link"
      :href="it.href"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="hero-link-icon">{{ it.icon }}</span>
      <span class="hero-link-text">
        <span class="hero-link-title">{{ it.title }}</span>
        <span class="hero-link-desc">{{ it.desc }}</span>
      </span>
      <span class="hero-link-arrow">→</span>
    </a>
  </div>
</template>
