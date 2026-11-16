<script setup lang="ts">
import { computed } from 'vue';
import { NotebookPen, Route, Star } from 'lucide-vue-next';
import LearningCover from './LearningCover.vue';
import type { FavoriteNodeItem } from '../services/favorite';
import type { LearningCard as LearningCardModel } from '../services/learningCard';

const props = defineProps<{
  item: FavoriteNodeItem;
  relationCount: number;
  learningCard?: LearningCardModel | null;
  storageMode?: 'synced' | 'local';
  busy?: boolean;
}>();

const emit = defineEmits<{ (event: 'open', item: FavoriteNodeItem): void }>();

const status = computed(() => {
  if (!props.learningCard) return 'empty';
  if (props.learningCard.reviewState === 'mastered') return 'mastered';
  if (props.learningCard.reviewState === 'fuzzy') return 'fuzzy';
  return 'todo';
});

const statusLabel = computed(() => ({ empty: '待建立', todo: '待复习', fuzzy: '模糊', mastered: '已掌握' }[status.value]));
const statusHint = computed(() => ({ empty: '先建立学习卡片', todo: '开始第一次复习', fuzzy: '复习后再巩固', mastered: '已完成一次掌握' }[status.value]));
const understandingPreview = computed(() => {
  const understanding = props.learningCard?.coreUnderstanding?.trim();
  return understanding || '还没有写下核心理解，点击卡片开始记录…';
});
const hasUnderstanding = computed(() => Boolean(props.learningCard?.coreUnderstanding?.trim()));
const hasQuestion = computed(() => Boolean(props.learningCard?.selfTestQuestion?.trim()));
const sourceLabel = computed(() => props.storageMode === 'local' ? '仅本机保存' : '已同步');

function touchedAt() {
  const raw = props.learningCard?.updatedAt || props.item.updatedAt || props.item.createdAt;
  return raw ? `最近整理 ${String(raw).slice(0, 10)}` : '暂无学习记录';
}
</script>

<template>
  <article class="learning-card" :class="`is-${status}`">
    <button class="learning-card-main" type="button" :disabled="busy" @click="emit('open', item)">
      <LearningCover
        :node-id="item.nodeId"
        :alt="item.nodeName"
        :color="item.nodeTypeColor"
        :icon-char="item.nodeTypeName.slice(0, 1)"
      />
      <span class="learning-card-body">
        <span class="learning-card-chips">
          <em class="learn-state" :class="`is-${status}`">{{ statusLabel }}</em>
          <em class="learn-storage-label">{{ sourceLabel }}</em>
        </span>
        <strong>{{ item.nodeName }}</strong>
        <small>{{ item.nodeCode }} · {{ item.province || '未知地区' }}</small>
        <span class="learning-card-note-preview" :class="{ 'is-empty': !hasUnderstanding }">
          {{ understandingPreview }}
        </span>
        <span class="learning-card-learning-meta">
          <span :class="hasQuestion ? 'has-content' : ''">自测题 {{ hasQuestion ? '已设置' : '待设置' }}</span>
          <span>关联 {{ (learningCard?.relatedNodeIds.length ?? 0) + (learningCard?.relatedKeywords.length ?? 0) }}</span>
        </span>
        <small class="learning-card-status-hint">{{ statusHint }}</small>
      </span>
    </button>
    <footer class="learning-card-foot">
      <span class="learning-card-meta"><NotebookPen :size="13" />{{ touchedAt() }}</span>
      <span class="learning-card-relations"><Route :size="13" />图谱关联 {{ relationCount }}</span>
      <button class="primary-action compact" type="button" :disabled="busy" @click="emit('open', item)">
        <Star :size="14" />
        继续学习
      </button>
    </footer>
  </article>
</template>
