<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: 'left' | 'right';
  interactive?: boolean;
}

const props = withDefaults(defineProps<CurvedLoopProps>(), {
  marqueeText: '',
  speed: 2,
  className: '',
  curveAmount: 400,
  direction: 'left',
  interactive: true,
});

const text = computed(() => {
  const hasTrailing = /\s| $/.test(props.marqueeText);
  return (hasTrailing ? props.marqueeText.replace(/\s+$/, '') : props.marqueeText) + ' ';
});

const measureRef = ref<SVGTextElement | null>(null);
const textPathRef = ref<SVGTextPathElement | null>(null);
const spacing = ref(0);
const offset = ref(0);
const uid = Math.random().toString(36).slice(2, 11);
const pathId = `curve-${uid}`;
const pathD = computed(() => `M-100,40 Q500,${40 + props.curveAmount} 1540,40`);
const dragRef = ref(false);
const lastXRef = ref(0);
const dirRef = ref<'left' | 'right'>(props.direction);
const velRef = ref(0);
let animationFrame: number | null = null;

const textLength = computed(() => spacing.value);
const totalText = computed(() => (
  textLength.value
    ? Array(Math.ceil(1800 / textLength.value) + 2).fill(text.value).join('')
    : text.value
));
const ready = computed(() => spacing.value > 0);
const cursorStyle = computed(() => (props.interactive ? (dragRef.value ? 'grabbing' : 'grab') : 'auto'));

function updateSpacing() {
  if (measureRef.value) {
    spacing.value = measureRef.value.getComputedTextLength();
  }
}

function stopAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

function animate() {
  if (!spacing.value || !ready.value) return;

  const step = () => {
    if (!dragRef.value && textPathRef.value) {
      const delta = dirRef.value === 'right' ? props.speed : -props.speed;
      const currentOffset = parseFloat(textPathRef.value.getAttribute('startOffset') || '0');
      let newOffset = currentOffset + delta;
      const wrapPoint = spacing.value;
      if (newOffset <= -wrapPoint) newOffset += wrapPoint;
      if (newOffset >= wrapPoint) newOffset -= wrapPoint;
      textPathRef.value.setAttribute('startOffset', `${newOffset}px`);
      offset.value = newOffset;
    }
    animationFrame = requestAnimationFrame(step);
  };

  step();
}

function onPointerDown(e: PointerEvent) {
  if (!props.interactive) return;
  dragRef.value = true;
  lastXRef.value = e.clientX;
  velRef.value = 0;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!props.interactive || !dragRef.value || !textPathRef.value) return;
  const dx = e.clientX - lastXRef.value;
  lastXRef.value = e.clientX;
  velRef.value = dx;
  const currentOffset = parseFloat(textPathRef.value.getAttribute('startOffset') || '0');
  let newOffset = currentOffset + dx;
  const wrapPoint = spacing.value;
  if (newOffset <= -wrapPoint) newOffset += wrapPoint;
  if (newOffset >= wrapPoint) newOffset -= wrapPoint;
  textPathRef.value.setAttribute('startOffset', `${newOffset}px`);
  offset.value = newOffset;
}

function endDrag() {
  if (!props.interactive) return;
  dragRef.value = false;
  dirRef.value = velRef.value > 0 ? 'right' : 'left';
}

onMounted(() => {
  nextTick(() => {
    updateSpacing();
    animate();
  });
});

onUnmounted(() => {
  stopAnimation();
});

watch([text, () => props.className], () => {
  nextTick(() => {
    updateSpacing();
  });
});

watch([spacing, () => props.speed], () => {
  stopAnimation();
  if (spacing.value) animate();
});

watch(() => props.direction, (value) => {
  dirRef.value = value;
});
</script>

<template>
  <div
    class="curved-loop"
    :style="{
      visibility: ready ? 'visible' : 'hidden',
      cursor: cursorStyle,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointerleave="endDrag"
  >
    <svg class="curved-loop-svg" viewBox="0 0 1440 120" aria-hidden="true">
      <text ref="measureRef" xml:space="preserve" class="curved-loop-measure">
        {{ text }}
      </text>
      <defs>
        <path :id="pathId" :d="pathD" fill="none" stroke="transparent" />
      </defs>
      <text v-if="ready" xml:space="preserve" :class="['curved-loop-text', props.className]">
        <textPath ref="textPathRef" :href="`#${pathId}`" :startOffset="`${offset}px`" xml:space="preserve">
          {{ totalText }}
        </textPath>
      </text>
    </svg>
  </div>
</template>
