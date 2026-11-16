<template>
  <component
    :is="props.as"
    ref="containerRef"
    :class="['scroll-reveal-container', 'my-5', props.containerClassName]"
  >
    <p
      v-if="props.splitText"
      :class="['scroll-reveal-text', 'text-[clamp(1.6rem,4vw,3rem)]', 'leading-[1.5]', 'font-semibold', props.textClassName]"
    >
      <template v-for="(segment, index) in splitTextSegments" :key="index">
        <span v-if="segment.isWord" class="inline-block scroll-reveal-word word">{{ segment.text }}</span>
        <template v-else>{{ segment.text }}</template>
      </template>
    </p>
    <div v-else ref="contentRef" :class="['scroll-reveal-content', props.textClassName]">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { computed, nextTick, onMounted, onUnmounted, ref, useSlots, type Ref } from 'vue';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  scrollContainerRef?: Ref<HTMLElement | null> | HTMLElement | null;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  splitText?: boolean;
  as?: string;
  stagger?: number;
}

const props = withDefaults(defineProps<ScrollRevealProps>(), {
  scrollContainerRef: null,
  enableBlur: true,
  baseOpacity: 0.1,
  baseRotation: 3,
  blurStrength: 4,
  containerClassName: '',
  textClassName: '',
  rotationEnd: 'bottom bottom',
  wordAnimationEnd: 'bottom bottom',
  splitText: true,
  as: 'h2',
  stagger: 0.05,
});

const slots = useSlots();
const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const text = computed<string>(() => {
  const vnodes = slots.default?.() ?? [];
  const extract = (nodes: ReturnType<NonNullable<typeof slots.default>>): string => nodes
    .map((vnode) => {
      if (typeof vnode.children === 'string') return vnode.children;
      if (Array.isArray(vnode.children)) {
        return extract(vnode.children as ReturnType<NonNullable<typeof slots.default>>);
      }
      return '';
    })
    .join('');

  return extract(vnodes).trim();
});

const splitTextSegments = computed<{ text: string; isWord: boolean }[]>(() => text.value
  .split(/(\s+)/)
  .filter((segment) => segment.length > 0)
  .map((segment) => ({
    text: segment,
    isWord: !segment.match(/^\s+$/),
  })));

function resolveScroller(scrollContainerRef: ScrollRevealProps['scrollContainerRef']): HTMLElement | Window {
  if (!scrollContainerRef) return window;
  if (scrollContainerRef instanceof HTMLElement) return scrollContainerRef;
  return scrollContainerRef.value ?? window;
}

function resolveRevealTargets(el: HTMLElement) {
  if (props.splitText) {
    return Array.from(el.querySelectorAll<HTMLElement>('.scroll-reveal-word'));
  }

  const content = contentRef.value;
  const children = Array.from((content ?? el).children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

  return children.length > 0 ? children : [el];
}

let tweens: gsap.core.Tween[] = [];

onMounted(async () => {
  await nextTick();

  const el = containerRef.value;
  if (!el) return;

  const scroller = resolveScroller(props.scrollContainerRef);
  const revealTargets = resolveRevealTargets(el);

  tweens.push(
    gsap.fromTo(
      el,
      { transformOrigin: '0% 50%', rotate: props.baseRotation },
      {
        ease: 'none',
        rotate: 0,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom',
          end: props.rotationEnd,
          scrub: true,
        },
      },
    ),
  );

  tweens.push(
    gsap.fromTo(
      revealTargets,
      { opacity: props.baseOpacity, willChange: 'opacity' },
      {
        ease: 'none',
        opacity: 1,
        stagger: props.stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=20%',
          end: props.wordAnimationEnd,
          scrub: true,
        },
      },
    ),
  );

  if (props.enableBlur) {
    tweens.push(
      gsap.fromTo(
        revealTargets,
        { filter: `blur(${props.blurStrength}px)`, willChange: 'filter' },
        {
          ease: 'none',
          filter: 'blur(0px)',
          stagger: props.stagger,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: props.wordAnimationEnd,
            scrub: true,
          },
        },
      ),
    );
  }
});

onUnmounted(() => {
  tweens.forEach((tween) => {
    tween.scrollTrigger?.kill();
    tween.kill();
  });
  tweens = [];
});
</script>

<style scoped>
.scroll-reveal-container {
  display: block;
  margin: 20px 0;
}

.scroll-reveal-text {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.5;
}

.scroll-reveal-content {
  display: block;
}

.scroll-reveal-word {
  display: inline-block;
}
</style>
