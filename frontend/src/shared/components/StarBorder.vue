<template>
  <component
    :is="as"
    :class="['star-border', customClass]"
    v-bind="restAttrs"
    :style="componentStyle"
  >
    <div
      class="star-border-orbit star-border-orbit-bottom animate-star-movement-bottom"
      :style="{
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animationDuration: speed
      }"
    ></div>

    <div
      class="star-border-orbit star-border-orbit-top animate-star-movement-top"
      :style="{
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animationDuration: speed
      }"
    ></div>

    <div class="star-border-content">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

interface StarBorderProps {
  as?: string;
  customClass?: string;
  color?: string;
  speed?: string;
  thickness?: number;
}

const props = withDefaults(defineProps<StarBorderProps>(), {
  as: 'button',
  customClass: '',
  color: 'white',
  speed: '6s',
  thickness: 1,
});

const restAttrs = useAttrs();

const componentStyle = computed(() => {
  const base = {
    padding: `${props.thickness}px 0`,
  };
  const userStyle = (restAttrs.style as Record<string, string>) || {};
  return { ...base, ...userStyle };
});
</script>

<style scoped>
.star-border {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border: 0;
  background: transparent;
}

.star-border-orbit {
  position: absolute;
  z-index: 0;
  width: 300%;
  height: 50%;
  border-radius: 999px;
  opacity: 0.7;
  pointer-events: none;
}

.star-border-orbit-bottom {
  right: -250%;
  bottom: -11px;
}

.star-border-orbit-top {
  top: -10px;
  left: -250%;
}

.star-border-content {
  position: relative;
  z-index: 1;
}

@keyframes star-movement-bottom {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }

  100% {
    transform: translate(-100%, 0%);
    opacity: 0;
  }
}

@keyframes star-movement-top {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }

  100% {
    transform: translate(100%, 0%);
    opacity: 0;
  }
}

.animate-star-movement-bottom {
  animation: star-movement-bottom linear infinite alternate;
}

.animate-star-movement-top {
  animation: star-movement-top linear infinite alternate;
}
</style>
