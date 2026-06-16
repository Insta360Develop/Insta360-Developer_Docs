---
layout: home

hero:
  name: Insta360 SDK/API 开发者文档
  tagline: X · Go · ACE · Wave · Link —— 选择你的产品系列，快速接入并掌握每一个接口。
---

## 选择产品系列

<script setup>
import { withBase } from 'vitepress'
</script>

<div class="platform-cards">
  <a class="platform-card" :href="withBase('/ch/x/')">
    <span class="icon">🎥</span>
    <h3>X 系列</h3>
    <div class="tags">
      <span class="tag">Android</span>
      <span class="tag">iOS</span>
      <span class="tag">Windows</span>
      <span class="tag">Linux</span>
      <span class="tag">OSC</span>
    </div>
  </a>
  <a class="platform-card" :href="withBase('/ch/go/')">
    <span class="icon">🎬</span>
    <h3>Go 系列</h3>
    <div class="tags">
      <span class="tag is-planned">Android 计划中</span>
      <span class="tag is-planned">iOS 计划中</span>
    </div>
    <p class="note">SDK 和接口与 X 系列通用</p>
  </a>
  <a class="platform-card" :href="withBase('/ch/ace/')">
    <span class="icon">📸</span>
    <h3>ACE 系列</h3>
    <div class="tags">
      <span class="tag is-planned">Android 计划中</span>
      <span class="tag is-planned">iOS 计划中</span>
    </div>
    <p class="note">SDK 和接口与 X 系列通用</p>
  </a>
  <a class="platform-card" :href="withBase('/ch/wave/')">
    <span class="icon">🎙️</span>
    <h3>Wave 系列</h3>
    <div class="tags">
      <span class="tag is-planned">计划中</span>
    </div>
  </a>
  <a class="platform-card" :href="withBase('/ch/link/')">
    <span class="icon">🔗</span>
    <h3>Link 系列</h3>
    <div class="tags">
      <span class="tag is-planned">计划中</span>
    </div>
  </a>
</div>
