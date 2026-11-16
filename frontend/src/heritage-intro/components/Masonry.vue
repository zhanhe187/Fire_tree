<template>
  <div ref="containerRef" class="masonry-container">
    <RouterLink
      v-for="item in grid"
      :key="item.id"
      :data-key="item.id"
      class="masonry-item"
      :to="item.url"
      :style="{ willChange: 'transform, width, height, opacity' }"
      @mouseenter="event => handleMouseEnter(item.id, event.currentTarget as HTMLElement)"
      @mouseleave="event => handleMouseLeave(item.id, event.currentTarget as HTMLElement)"
    >
      <div
        class="masonry-card"
        :class="{
          'has-real-image': item.imageStatus === 'REAL_PROJECT_IMAGE',
          'is-missing-image': item.imageStatus === 'NO_IMAGE',
        }"
        :style="cardStyle(item)"
      >
        <div v-if="colorShiftOnHover" class="color-overlay" />
        <div class="masonry-card-topline">
          <small>{{ item.level }}</small>
        </div>
        <div class="masonry-image-label">{{ item.imageLabel }}</div>
        <div class="masonry-card-copy">
          <p :style="{ color: item.accent }">{{ item.category }}</p>
          <h3>{{ item.project }}</h3>
          <span>{{ item.intro }}</span>
        </div>
        <div class="masonry-tag-row">
          <em v-for="tag in item.tags" :key="tag">{{ tag }}</em>
        </div>
      </div>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { RouterLink } from 'vue-router';
import { gsap } from 'gsap';

export interface MasonryItem {
  id: string;
  img?: string;
  hasCoverImage: boolean;
  imageStatus: 'REAL_PROJECT_IMAGE' | 'CATEGORY_FALLBACK' | 'NO_IMAGE';
  imageLabel: string;
  missingFields: string[];
  url: string;
  height: number;
  region: string;
  code: string;
  project: string;
  category: string;
  level: string;
  intro: string;
  tags: string[];
  accent: string;
}

interface MasonryProps {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

const props = withDefaults(defineProps<MasonryProps>(), {
  ease: 'power3.out',
  duration: 0.6,
  stagger: 0.05,
  animateFrom: 'bottom',
  scaleOnHover: true,
  hoverScale: 0.95,
  blurToFocus: true,
  colorShiftOnHover: false,
});

const containerRef = ref<HTMLDivElement | null>(null);
const size = ref({ width: 0, height: 0 });
const columns = ref(1);
const hasMounted = ref(false);
let resizeObserver: ResizeObserver | null = null;
let revealObserver: IntersectionObserver | null = null;
const mediaListeners: Array<{ query: MediaQueryList; handler: () => void }> = [];

function computeColumns() {
  if (window.matchMedia('(min-width:1500px)').matches) return 4;
  if (window.matchMedia('(min-width:1100px)').matches) return 3;
  if (window.matchMedia('(min-width:680px)').matches) return 2;
  return 1;
}

function updateColumns() {
  columns.value = computeColumns();
}

function cardStyle(item: MasonryItem) {
  const accent = item.accent || '#f4b43f';
  if (!item.hasCoverImage || !item.img) {
    return {
      '--accent': accent,
      backgroundImage: 'linear-gradient(135deg, #f7f0df 0%, #d9eee8 52%, #b8c8be 100%)',
    };
  }

  return {
    '--accent': accent,
    backgroundImage: `linear-gradient(180deg, rgba(7,7,7,.1), rgba(7,7,7,.72)), url(${item.img})`,
  };
}

const grid = computed(() => {
  if (!size.value.width) return [];
  const colHeights = new Array(columns.value).fill(0);
  const gap = 18;
  const totalGaps = (columns.value - 1) * gap;
  const columnWidth = (size.value.width - totalGaps) / columns.value;

  const laidOut = props.items.map((child) => {
    const col = colHeights.indexOf(Math.min(...colHeights));
    const x = col * (columnWidth + gap);
    const h = child.height;
    const y = colHeights[col];
    colHeights[col] += h + gap;
    return { ...child, x, y, w: columnWidth, h };
  });

  const maxHeight = Math.max(...colHeights, 0);
  if (containerRef.value) {
    containerRef.value.style.height = `${maxHeight}px`;
  }
  return laidOut;
});

interface GridItem extends MasonryItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

const getInitialPosition = (item: GridItem) => {
  const containerRect = containerRef.value?.getBoundingClientRect();
  if (!containerRect) return { x: item.x, y: item.y };
  let direction = props.animateFrom;
  if (props.animateFrom === 'random') {
    const dirs = ['top', 'bottom', 'left', 'right'] as const;
    direction = dirs[Math.floor(Math.random() * dirs.length)];
  }
  switch (direction) {
    case 'top':
      return { x: item.x, y: -240 };
    case 'bottom':
      return { x: item.x, y: window.innerHeight + 160 };
    case 'left':
      return { x: -240, y: item.y };
    case 'right':
      return { x: window.innerWidth + 160, y: item.y };
    case 'center':
      return { x: containerRect.width / 2 - item.w / 2, y: containerRect.height / 2 - item.h / 2 };
    default:
      return { x: item.x, y: item.y + 100 };
  }
};

const handleMouseEnter = (id: string, element: HTMLElement) => {
  if (props.scaleOnHover) {
    gsap.to(`[data-key="${id}"]`, { scale: props.hoverScale, duration: 0.3, ease: 'power2.out' });
  }
  if (props.colorShiftOnHover) {
    const overlay = element.querySelector('.color-overlay') as HTMLElement | null;
    if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
  }
};

const handleMouseLeave = (id: string, element: HTMLElement) => {
  if (props.scaleOnHover) {
    gsap.to(`[data-key="${id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' });
  }
  if (props.colorShiftOnHover) {
    const overlay = element.querySelector('.color-overlay') as HTMLElement | null;
    if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
  }
};

function observeMasonryItems() {
  const container = containerRef.value;
  if (!container) return;
  const cards = Array.from(container.querySelectorAll<HTMLElement>('.masonry-item:not(.is-in-view)'));
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach(card => card.classList.add('is-in-view'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        target.classList.add('is-in-view');
        revealObserver?.unobserve(target);
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    });
  }

  cards.forEach(card => revealObserver?.observe(card));
}

watchEffect(() => {
  const currentGrid = grid.value;
  void props.items.length;
  void columns.value;
  void size.value.width;
  if (!currentGrid.length) return;

  nextTick(() => {
    currentGrid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h };
      if (!hasMounted.value) {
        const start = getInitialPosition(item);
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: start.x,
            y: start.y,
            width: item.w,
            height: item.h,
            ...(props.blurToFocus && { filter: 'blur(10px)' }),
          },
          {
            opacity: 1,
            ...animProps,
            ...(props.blurToFocus && { filter: 'blur(0px)' }),
            duration: hasMounted.value ? props.duration : 0.42,
            ease: 'power3.out',
            delay: Math.min(index, 18) * props.stagger,
          },
        );
      } else {
        gsap.to(selector, { ...animProps, duration: props.duration, ease: props.ease, overwrite: 'auto' });
      }
    });
    observeMasonryItems();
    hasMounted.value = true;
  });
});

onMounted(() => {
  updateColumns();
  ['(min-width:1500px)', '(min-width:1100px)', '(min-width:680px)'].forEach(queryText => {
    const query = window.matchMedia(queryText);
    const handler = () => updateColumns();
    query.addEventListener('change', handler);
    mediaListeners.push({ query, handler });
  });

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      size.value = { width, height };
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  revealObserver?.disconnect();
  mediaListeners.forEach(({ query, handler }) => query.removeEventListener('change', handler));
});
</script>
