<script lang="ts">
import { defineComponent, h } from 'vue';

export const Card = defineComponent({
  name: 'Card',
  props: {
    customClass: { type: String, default: '' },
  },
  setup(cardProps, { slots, attrs }) {
    return () => h(
      'div',
      {
        ...attrs,
        class: ['swap-card', cardProps.customClass, attrs.class],
      },
      slots.default?.(),
    );
  },
});

export default {};
</script>

<script setup lang="ts">
import gsap from 'gsap';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
}

const props = withDefaults(defineProps<Props>(), {
  width: 'min(920px, 74vw)',
  height: 'min(590px, 52vw)',
  cardDistance: 60,
  verticalDistance: 70,
  delay: 5000,
  pauseOnHover: false,
  skewAmount: 6,
  easing: 'elastic',
});

const emit = defineEmits<{ cardClick: [idx: number] }>();
const container = ref<HTMLDivElement | null>(null);
const cssDim = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: ReturnType<typeof makeSlot>, skew: number) => {
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  });
};

const getConfig = () => (
  props.easing === 'elastic'
    ? { ease: 'elastic.out(0.6,0.9)', durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 }
    : { ease: 'power1.inOut', durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 }
);

let tlRef: gsap.core.Timeline | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
const order = ref<number[]>([]);
let pauseHandler: (() => void) | null = null;
let resumeHandler: (() => void) | null = null;

function getCards(): HTMLElement[] {
  if (!container.value) return [];
  return Array.from(container.value.children) as HTMLElement[];
}

function init() {
  const cards = getCards();
  const total = cards.length;
  order.value = Array.from({ length: total }, (_, i) => i);
  cards.forEach((card, i) => {
    card.style.width = cssDim(props.width);
    card.style.height = cssDim(props.height);
    placeNow(card, makeSlot(i, props.cardDistance, props.verticalDistance, total), props.skewAmount);
  });
}

function swap() {
  const cards = getCards();
  if (order.value.length < 2) return;
  const config = getConfig();
  const [front, ...rest] = order.value;
  const elFront = cards[front];
  if (!elFront) return;

  const tl = gsap.timeline();
  tlRef = tl;
  tl.to(elFront, { y: '+=500', duration: config.durDrop, ease: config.ease });
  tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);

  rest.forEach((idx, i) => {
    const el = cards[idx];
    if (!el) return;
    const slot = makeSlot(i, props.cardDistance, props.verticalDistance, cards.length);
    tl.set(el, { zIndex: slot.zIndex }, 'promote');
    tl.to(
      el,
      { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease },
      `promote+=${i * 0.15}`,
    );
  });

  const backSlot = makeSlot(cards.length - 1, props.cardDistance, props.verticalDistance, cards.length);
  tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
  tl.call(() => {
    gsap.set(elFront, { zIndex: backSlot.zIndex });
  }, undefined, 'return');
  tl.to(
    elFront,
    { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease },
    'return',
  );
  tl.call(() => {
    order.value = [...rest, front];
  });
}

function startInterval() {
  if (intervalId !== null) clearInterval(intervalId);
  intervalId = setInterval(swap, props.delay);
}

function stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function setupHover() {
  if (!props.pauseOnHover || !container.value) return;
  pauseHandler = () => {
    tlRef?.pause();
    stopInterval();
  };
  resumeHandler = () => {
    tlRef?.play();
    startInterval();
  };
  container.value.addEventListener('mouseenter', pauseHandler);
  container.value.addEventListener('mouseleave', resumeHandler);
}

function teardownHover() {
  if (!container.value) return;
  if (pauseHandler) container.value.removeEventListener('mouseenter', pauseHandler);
  if (resumeHandler) container.value.removeEventListener('mouseleave', resumeHandler);
  pauseHandler = null;
  resumeHandler = null;
}

function handleClick(index: number) {
  emit('cardClick', index);
  swap();
}

onMounted(async () => {
  await nextTick();
  init();
  swap();
  startInterval();
  setupHover();
});

onUnmounted(() => {
  stopInterval();
  teardownHover();
  tlRef?.kill();
});

watch(
  () => [props.cardDistance, props.verticalDistance, props.delay, props.pauseOnHover, props.skewAmount, props.easing, props.width, props.height],
  async () => {
    stopInterval();
    teardownHover();
    tlRef?.kill();
    await nextTick();
    init();
    swap();
    startInterval();
    setupHover();
  },
);
</script>

<template>
  <div
    ref="container"
    class="card-swap-container"
    :style="{ width: cssDim(width), height: cssDim(height) }"
  >
    <slot :on-card-click="handleClick" />
  </div>
</template>
