<script setup lang="ts">
import { motion } from 'motion-v';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch, type Ref } from 'vue';

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  index?: Array<number>;
  syncGroup?: string;
}

interface SyncGroupState {
  index: Ref<number>;
  count: number;
}

const syncGroupMap = new Map<string, SyncGroupState>();

function getSyncGroupIndex(group: string): Ref<number> {
  if (!syncGroupMap.has(group)) {
    syncGroupMap.set(group, { index: ref(-1), count: 0 });
  }
  return syncGroupMap.get(group)!.index;
}

function registerSyncGroup(group: string): boolean {
  const state = syncGroupMap.get(group)!;
  state.count += 1;
  return state.count === 1;
}

function unregisterSyncGroup(group: string): void {
  if (!syncGroupMap.has(group)) return;
  const state = syncGroupMap.get(group)!;
  state.count -= 1;
  if (state.count <= 0) {
    syncGroupMap.delete(group);
  }
}

const props = withDefaults(defineProps<TrueFocusProps>(), {
  sentence: 'True Focus',
  separator: ' ',
  manualMode: false,
  blurAmount: 5,
  borderColor: 'green',
  glowColor: 'rgba(0, 255, 0, 0.6)',
  animationDuration: 0.5,
  pauseBetweenAnimations: 1,
});

const words = computed(() => props.sentence.split(props.separator).filter(Boolean));
const currentIndex = props.syncGroup ? getSyncGroupIndex(props.syncGroup) : ref(0);
const lastActiveIndex = ref<number | null>(null);
const containerRef = useTemplateRef<HTMLDivElement>('containerRef');
const wordRefs = ref<HTMLSpanElement[]>([]);
const focusRect = ref({ x: 0, y: 0, width: 0, height: 0 });
let interval: ReturnType<typeof setInterval> | null = null;

watch(
  [currentIndex, () => words.value.length],
  async () => {
    if (currentIndex.value === null || currentIndex.value === -1) return;

    let actualWordIndex = currentIndex.value;
    if (props.index) {
      actualWordIndex = props.index.findIndex((val) => val === currentIndex.value);
      if (actualWordIndex === -1) return;
    }

    if (!wordRefs.value[actualWordIndex] || !containerRef.value) return;
    await nextTick();

    const parentRect = containerRef.value.getBoundingClientRect();
    const activeRect = wordRefs.value[actualWordIndex].getBoundingClientRect();
    focusRect.value = {
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    };
  },
  { immediate: true }
);

const handleMouseEnter = (index: number) => {
  if (props.manualMode) {
    const mappedIndex = props.index ? props.index[index] : index;
    lastActiveIndex.value = mappedIndex;
    currentIndex.value = mappedIndex;
  }
};

const handleMouseLeave = () => {
  if (props.manualMode && lastActiveIndex.value !== null) {
    currentIndex.value = lastActiveIndex.value;
  }
};

const setWordRef = (el: HTMLSpanElement | null, index: number) => {
  if (el) wordRefs.value[index] = el;
};

const startInterval = () => {
  if (interval) clearInterval(interval);
  if (!props.manualMode && words.value.length > 0) {
    interval = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % words.value.length;
    }, (props.animationDuration + props.pauseBetweenAnimations) * 1000);
  }
};

onMounted(async () => {
  await nextTick();
  const isOwner = props.syncGroup ? registerSyncGroup(props.syncGroup) : true;
  let initialWordIndex = 0;

  if (props.index && currentIndex.value !== null && currentIndex.value !== undefined) {
    const foundIndex = props.index.findIndex((val) => val === currentIndex.value);
    if (foundIndex !== -1) initialWordIndex = foundIndex;
  }

  if (wordRefs.value[initialWordIndex] && containerRef.value) {
    const parentRect = containerRef.value.getBoundingClientRect();
    const activeRect = wordRefs.value[initialWordIndex].getBoundingClientRect();
    focusRect.value = {
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    };
  }

  if (isOwner) {
    watch(
      [() => props.manualMode, () => props.animationDuration, () => props.pauseBetweenAnimations, () => words.value],
      () => startInterval(),
      { immediate: true }
    );
  }
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
  if (props.syncGroup) unregisterSyncGroup(props.syncGroup);
});
</script>

<template>
  <div ref="containerRef" class="true-focus">
    <span
      v-for="(word, wordIndex) in words"
      :key="props.index ? props.index[wordIndex] : wordIndex"
      :ref="(el) => setWordRef(el as HTMLSpanElement, wordIndex)"
      class="true-focus__word"
      :style="{
        filter: (props.index ? props.index[wordIndex] : wordIndex) === currentIndex ? 'blur(0px)' : `blur(${blurAmount}px)`,
        transition: `filter ${animationDuration}s ease`,
      }"
      @mouseenter="handleMouseEnter(wordIndex)"
      @mouseleave="handleMouseLeave"
    >
      {{ word }}
    </span>

    <motion.div
      class="true-focus__frame"
      :animate="{
        x: focusRect.x,
        y: focusRect.y,
        width: focusRect.width,
        height: focusRect.height,
        opacity: currentIndex >= 0 ? 1 : 0,
      }"
      :transition="{ duration: animationDuration }"
      :style="{
        '--border-color': borderColor,
        '--glow-color': glowColor,
      }"
    >
      <span class="true-focus__corner true-focus__corner--tl"></span>
      <span class="true-focus__corner true-focus__corner--tr"></span>
      <span class="true-focus__corner true-focus__corner--bl"></span>
      <span class="true-focus__corner true-focus__corner--br"></span>
    </motion.div>
  </div>
</template>

<style scoped>
.true-focus {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: .28em;
}

.true-focus__word {
  position: relative;
  cursor: pointer;
  font-family: var(--display-cn, var(--font-display, 'Microsoft YaHei', sans-serif));
  font-size: clamp(54px, 6.4vw, 112px);
  font-weight: 1000;
  line-height: 1.12;
  letter-spacing: .08em;
  color: #fff0b8;
  -webkit-text-stroke: 1px rgba(92, 39, 8, 0.52);
  text-shadow:
    0 3px 0 rgba(91, 40, 9, 0.62),
    0 10px 28px rgba(0, 0, 0, .88),
    0 0 24px rgba(255, 210, 125, .72),
    0 0 58px rgba(177, 45, 35, .42);
}

.true-focus__frame {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: content-box;
  border: 0;
  pointer-events: none;
}

.true-focus__corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 3px solid var(--border-color, #fff);
  border-radius: 3px;
  filter: drop-shadow(0 0 5px var(--border-color)) drop-shadow(0 0 13px var(--glow-color));
}

.true-focus__corner--tl {
  top: -11px;
  left: -11px;
  border-right: 0;
  border-bottom: 0;
}

.true-focus__corner--tr {
  top: -11px;
  right: -11px;
  border-bottom: 0;
  border-left: 0;
}

.true-focus__corner--bl {
  bottom: -11px;
  left: -11px;
  border-top: 0;
  border-right: 0;
}

.true-focus__corner--br {
  right: -11px;
  bottom: -11px;
  border-top: 0;
  border-left: 0;
}

@media (max-width: 720px) {
  .true-focus__word {
    font-size: clamp(42px, 15vw, 66px);
  }
}
</style>
