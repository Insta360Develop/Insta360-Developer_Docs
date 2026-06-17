---
layout: home

hero:
  name: Insta360 SDK/API Developer Docs
  tagline: X · Go · ACE · Wave · Link — pick your series, get integrated fast, and master every API.
---

## Choose a product series

<script setup>
import { withBase } from 'vitepress'
</script>

<div class="platform-cards">
  <a class="platform-card" :href="withBase('/en/x/')">
    <span class="icon">🎥</span>
    <h3>X Series</h3>
    <div class="tags">
      <span class="tag">Android</span>
      <span class="tag">iOS</span>
      <span class="tag">Windows</span>
      <span class="tag">Linux</span>
      <span class="tag">OSC</span>
    </div>
  </a>
  <a class="platform-card" :href="withBase('/en/go/')">
    <span class="icon">🎬</span>
    <h3>Go Series</h3>
    <div class="tags">
      <span class="tag is-planned">Android planned</span>
      <span class="tag is-planned">iOS planned</span>
    </div>
  </a>
  <a class="platform-card" :href="withBase('/en/ace/')">
    <span class="icon">📸</span>
    <h3>ACE Series</h3>
    <div class="tags">
      <span class="tag is-planned">Android planned</span>
      <span class="tag is-planned">iOS planned</span>
    </div>
  </a>
  <a class="platform-card" :href="withBase('/en/wave/')">
    <span class="icon">🎙️</span>
    <h3>Wave Series</h3>
    <div class="tags">
      <span class="tag is-planned">Coming soon</span>
    </div>
  </a>
  <a class="platform-card" :href="withBase('/en/link/')">
    <span class="icon">🔗</span>
    <h3>Link Series</h3>
    <div class="tags">
      <span class="tag is-planned">Coming soon</span>
    </div>
  </a>
</div>
