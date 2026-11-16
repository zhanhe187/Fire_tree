<script setup lang="ts">
import CommunityQaPage from './CommunityQaPage.vue';
</script>

<template>
  <main class="portal-embedded-page">
    <section class="portal-embedded-head">
      <p>社区问答</p>
      <h1>围绕节点向传承人和社区提问</h1>
    </section>
    <CommunityQaPage />
  </main>
</template>

<style scoped>
.portal-embedded-page {
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 64px;
}

.portal-embedded-head {
  margin-bottom: 18px;
}

.portal-embedded-head p {
  margin: 0 0 8px;
  color: #9a3328;
  font-size: 13px;
  font-weight: 900;
}

.portal-embedded-head h1 {
  margin: 0;
  color: #241811;
  font-size: clamp(28px, 4vw, 48px);
}
</style>
