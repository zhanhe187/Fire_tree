<script setup lang="ts">
import { gsap } from 'gsap';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

interface GridMotionProps {
  items?: string[];
  gradientColor?: string;
}

const props = withDefaults(defineProps<GridMotionProps>(), {
  items: () => [],
  gradientColor: '#150f0a',
});

const gridRef = useTemplateRef<HTMLElement>('gridRef');
const rowRefs = ref<HTMLElement[]>([]);
const mouseX = ref(typeof window === 'undefined' ? 0 : window.innerWidth / 2);

const totalItems = 150;
const combinedItems = computed(() => {
  if (props.items.length === 0) return [];

  return Array.from({ length: totalItems }, (_, index) => props.items[index % props.items.length]);
});

function isImage(item: string) {
  return typeof item === 'string' && (item.startsWith('http') || item.startsWith('/'));
}

function isTag(item: string) {
  return typeof item === 'string' && item.startsWith('<') && item.endsWith('>');
}

onMounted(() => {
  gsap.ticker.lagSmoothing(0);

  const handleMouseMove = (event: MouseEvent) => {
    mouseX.value = event.clientX;
  };

  const updateMotion = () => {
    const maxMoveAmount = 300;
    const baseDuration = 0.8;
    const inertiaFactors = [0.6, 0.4, 0.3, 0.2];
    const viewportWidth = Math.max(window.innerWidth, 1);

    rowRefs.value.forEach((row, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const moveAmount = ((mouseX.value / viewportWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;

      gsap.to(row, {
        x: moveAmount,
        duration: baseDuration + inertiaFactors[index % inertiaFactors.length],
        ease: 'power3.out',
        overwrite: 'auto',
      });
    });
  };

  gsap.ticker.add(updateMotion);
  window.addEventListener('mousemove', handleMouseMove);

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    gsap.ticker.remove(updateMotion);
    rowRefs.value.forEach((row) => gsap.killTweensOf(row));
  });
});
</script>

<template>
  <div ref="gridRef" class="grid-motion">
    <section
      class="grid-motion-stage"
      :style="{
        background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        backgroundPosition: 'center',
      }"
    >
      <div class="grid-motion-scrim" aria-hidden="true"></div>

      <div class="grid-motion-rows" aria-label="非遗影像流动墙">
        <div
          v-for="rowIndex in 10"
          :key="rowIndex"
          ref="rowRefs"
          class="grid-motion-row"
          :style="{ willChange: 'transform, filter' }"
        >
          <div
            v-for="itemIndex in 15"
            v-show="combinedItems[(rowIndex - 1) * 15 + (itemIndex - 1)]"
            :key="itemIndex"
            class="grid-motion-item"
          >
            <div class="grid-motion-card">
              <div
                v-if="isImage(combinedItems[(rowIndex - 1) * 15 + (itemIndex - 1)])"
                class="grid-motion-image"
                :style="{
                  backgroundImage: `url(${combinedItems[(rowIndex - 1) * 15 + (itemIndex - 1)]})`,
                }"
              ></div>

              <div
                v-else-if="isTag(combinedItems[(rowIndex - 1) * 15 + (itemIndex - 1)])"
                class="grid-motion-text"
                v-html="combinedItems[(rowIndex - 1) * 15 + (itemIndex - 1)]"
              ></div>

              <div v-else class="grid-motion-text">
                {{ combinedItems[(rowIndex - 1) * 15 + (itemIndex - 1)] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid-motion {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.grid-motion-stage {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
  isolation: isolate;
}

.grid-motion-scrim {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    radial-gradient(circle at 50% 42%, transparent 0 32%, rgba(0, 0, 0, 0.08) 58%, rgba(0, 0, 0, 0.7) 100%),
    linear-gradient(180deg, rgba(12, 9, 6, 0.94), transparent 20%, transparent 74%, rgba(0, 0, 0, 0.96));
  pointer-events: none;
}

.grid-motion-rows {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr;
  flex: none;
  gap: 16px;
  width: 150vw;
  height: 150vh;
  transform: rotate(-15deg);
  transform-origin: center;
}

.grid-motion-row {
  display: flex;
  gap: 16px;
}

.grid-motion-item {
  position: relative;
  flex: 0 0 auto;
  width: clamp(220px, 18vw, 300px);
  height: clamp(165px, 15vw, 250px);
}

.grid-motion-card {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 232, 170, 0.18);
  border-radius: 10px;
  background: #111;
  color: #fff;
  font-size: 1.5rem;
  box-shadow: 0 20px 42px rgba(0, 0, 0, 0.26);
}

.grid-motion-image {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  filter: saturate(1.08) contrast(1.03);
}

.grid-motion-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.12));
  pointer-events: none;
}

.grid-motion-text {
  position: relative;
  z-index: 1;
  padding: 16px;
  text-align: center;
}

@media (max-width: 720px) {
  .grid-motion-rows {
    gap: 12px;
    width: 190vw;
  }

  .grid-motion-row {
    gap: 12px;
  }

  .grid-motion-item {
    width: 190px;
    height: 142px;
  }
}
</style>
