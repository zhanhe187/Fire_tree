<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import { loadNodeCover, readCachedCover } from '../services/learningCovers';

/** 与 IntersectionObserver 的 rootMargin 保持一致：提前 200px 预载。 */
const PRELOAD_MARGIN = 200;

const props = defineProps<{
  nodeId: number;
  alt: string;
  color?: string;
  iconChar?: string;
}>();

const host = ref<HTMLElement | null>(null);
const coverUrl = ref<string | null>(readCachedCover(props.nodeId) ?? null);
const loading = ref(false);
let observer: IntersectionObserver | null = null;

async function resolveCover() {
  if (coverUrl.value || loading.value) return;
  loading.value = true;
  // 切勿预写 coverCache：loadNodeCover 以 coverCache.has() 表示「已解析（可能无封面）」，提前 prime 会把未缓存节点误判为已解析。
  coverUrl.value = await loadNodeCover(props.nodeId);
  loading.value = false;
}

/** 无 IntersectionObserver 时的兜底：仍然只在距视口 200px 内才发起请求。 */
function isWithinPreloadZone(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= viewportHeight + PRELOAD_MARGIN && rect.bottom >= -PRELOAD_MARGIN;
}

onMounted(() => {
  if (coverUrl.value) return;
  const element = host.value;
  if (!element || typeof IntersectionObserver === 'undefined') {
    if (element && !isWithinPreloadZone(element)) return;
    void resolveCover();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer?.disconnect();
          observer = null;
          void resolveCover();
        }
      }
    },
    { rootMargin: '200px 0px' },
  );
  observer.observe(element);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div
    ref="host"
    class="learning-cover"
    :class="{ 'has-image': Boolean(coverUrl) }"
    :style="coverUrl ? undefined : { background: color || 'var(--learn-amber)' }"
  >
    <img v-if="coverUrl" :src="coverUrl" :alt="alt" loading="lazy" />
    <span v-else-if="loading" class="learning-cover-loading"><Loader2 :size="18" class="spin" /></span>
    <span v-else class="learning-cover-fallback">{{ iconChar || '非' }}</span>
  </div>
</template>
