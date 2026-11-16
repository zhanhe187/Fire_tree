<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import HeritageIntroApp from './App.vue';
import heritageIntroStyles from './styles.css?raw';

let styleElement: HTMLStyleElement | null = null;

onMounted(() => {
  styleElement = document.createElement('style');
  styleElement.setAttribute('data-heritage-intro-theme', 'true');
  styleElement.textContent = heritageIntroStyles;
  document.head.appendChild(styleElement);
});

onUnmounted(() => {
  styleElement?.remove();
  styleElement = null;
});
</script>

<template>
  <HeritageIntroApp />
</template>
