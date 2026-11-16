<script setup lang="ts">
import { gsap } from 'gsap';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface ImageTrailProps {
  items?: string[];
  variant?: number;
}

const props = withDefaults(defineProps<ImageTrailProps>(), {
  items: () => [],
  variant: 1,
});

const containerRef = ref<HTMLDivElement | null>(null);
let frameId = 0;
let imageIndex = 0;
let zIndex = 1;
let cleanupFns: Array<() => void> = [];
const mouse = { x: 0, y: 0 };
const lastMouse = { x: 0, y: 0 };
const cachedMouse = { x: 0, y: 0 };

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(event: MouseEvent | TouchEvent, rect: DOMRect) {
  let clientX = 0;
  let clientY = 0;
  if ('touches' in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ('clientX' in event) {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function getMouseDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function resetTrail() {
  if (frameId) cancelAnimationFrame(frameId);
  cleanupFns.forEach((cleanup) => cleanup());
  cleanupFns = [];
  imageIndex = 0;
  zIndex = 1;
}

function showNextImage(images: HTMLDivElement[]) {
  if (!images.length) return;
  imageIndex = imageIndex < images.length - 1 ? imageIndex + 1 : 0;
  zIndex += 1;

  const image = images[imageIndex];
  const inner = image.querySelector<HTMLElement>('.content__img-inner');
  const rect = image.getBoundingClientRect();
  const startX = cachedMouse.x - rect.width / 2;
  const startY = cachedMouse.y - rect.height / 2;
  const endX = mouse.x - rect.width / 2;
  const endY = mouse.y - rect.height / 2;
  const dx = mouse.x - cachedMouse.x;
  const dy = mouse.y - cachedMouse.y;
  const speed = Math.hypot(dx, dy);
  const variant = Math.max(1, Math.min(8, props.variant));

  gsap.killTweensOf(inner ? [image, inner] : image);

  const fromVars: gsap.TweenVars = {
    opacity: 1,
    zIndex,
    x: startX,
    y: startY,
    scale: variant === 1 ? 1 : 0.18,
    rotation: variant === 5 || variant === 7 ? gsap.utils.random(-12, 12) : 0,
    filter: variant === 6 ? 'grayscale(100%) blur(12px) brightness(80%)' : 'brightness(100%)',
  };

  const enterVars: gsap.TweenVars = {
    duration: variant === 5 || variant === 8 ? 0.75 : 0.42,
    ease: variant === 8 ? 'expo.out' : 'power2.out',
    x: endX + (variant === 4 || variant === 5 ? dx * 0.42 : 0),
    y: endY + (variant === 4 || variant === 5 ? dy * 0.42 : 0),
    scale: variant === 6 ? Math.min(1.85, 0.7 + speed / 130) : variant === 7 ? gsap.utils.random(0.8, 1.28) : 1,
    rotation: variant === 5 || variant === 7 ? gsap.utils.random(-5, 5) : 0,
    filter: 'brightness(100%) contrast(100%) blur(0px)',
  };

  const exitVars: gsap.TweenVars = {
    duration: variant === 7 ? 0.55 : 0.42,
    ease: 'power3.inOut',
    opacity: 0,
    scale: variant === 7 ? 1.25 : 0.24,
  };

  if (variant === 3) {
    exitVars.yPercent = -160;
    exitVars.xPercent = gsap.utils.random(-24, 24);
  }
  if (variant === 4 || variant === 5) {
    exitVars.x = `+=${dx * 1.1}`;
    exitVars.y = `+=${dy * 1.1}`;
  }
  if (variant === 8) {
    fromVars.rotationX = gsap.utils.random(-18, 18);
    fromVars.rotationY = gsap.utils.random(-18, 18);
    exitVars.z = -650;
  }

  const timeline = gsap.timeline();
  timeline.fromTo(image, fromVars, enterVars, 0);
  if (inner && (variant === 2 || variant === 3 || variant === 6)) {
    timeline.fromTo(inner, { scale: variant === 2 ? 2.4 : 1.35 }, { duration: 0.42, scale: 1, ease: 'power2.out' }, 0);
  }
  timeline.to(image, exitVars, variant === 7 ? 0.72 : 0.46);
}

function mountTrail() {
  resetTrail();
  const container = containerRef.value;
  if (!container || props.items.length === 0) return;

  const images = Array.from(container.querySelectorAll<HTMLDivElement>('.content__img'));
  gsap.set(images, { opacity: 0, x: 0, y: 0, scale: 1, z: 0 });

  const updatePointer = (event: MouseEvent | TouchEvent) => {
    const next = getLocalPointerPos(event, container.getBoundingClientRect());
    mouse.x = next.x;
    mouse.y = next.y;
  };

  const startRender = (event: MouseEvent | TouchEvent) => {
    updatePointer(event);
    cachedMouse.x = mouse.x;
    cachedMouse.y = mouse.y;
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    frameId = requestAnimationFrame(render);
    container.removeEventListener('mousemove', startRender as EventListener);
    container.removeEventListener('touchmove', startRender as EventListener);
  };

  const render = () => {
    const distance = getMouseDistance(mouse, lastMouse);
    cachedMouse.x = lerp(cachedMouse.x, mouse.x, props.variant === 6 || props.variant === 7 ? 0.28 : 0.1);
    cachedMouse.y = lerp(cachedMouse.y, mouse.y, props.variant === 6 || props.variant === 7 ? 0.28 : 0.1);
    if (distance > 70) {
      showNextImage(images);
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
    }
    frameId = requestAnimationFrame(render);
  };

  container.addEventListener('mousemove', updatePointer);
  container.addEventListener('touchmove', updatePointer, { passive: true });
  container.addEventListener('mousemove', startRender as EventListener);
  container.addEventListener('touchmove', startRender as EventListener, { passive: true });

  cleanupFns.push(() => {
    container.removeEventListener('mousemove', updatePointer);
    container.removeEventListener('touchmove', updatePointer);
    container.removeEventListener('mousemove', startRender as EventListener);
    container.removeEventListener('touchmove', startRender as EventListener);
    gsap.killTweensOf(images);
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });
}

onMounted(async () => {
  await nextTick();
  mountTrail();
});

watch(() => [props.items, props.variant] as const, async () => {
  await nextTick();
  mountTrail();
});

onUnmounted(resetTrail);
</script>

<template>
  <div ref="containerRef" class="image-trail" aria-hidden="true">
    <div v-for="(url, index) in items" :key="`${url}-${index}`" class="content__img">
      <div class="content__img-inner" :style="{ backgroundImage: `url(${url})` }" />
    </div>
  </div>
</template>

<style scoped>
.image-trail {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  background: transparent;
  border-radius: inherit;
  perspective: 1000px;
}

.content__img {
  position: absolute;
  top: 0;
  left: 0;
  width: clamp(190px, 16vw, 280px);
  aspect-ratio: 1.12;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 22px;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 24px 54px rgba(72, 38, 12, 0.28);
  will-change: transform, filter, opacity;
}

.content__img-inner {
  position: absolute;
  inset: -12px;
  background-position: center;
  background-size: cover;
  will-change: transform, filter;
}
</style>
