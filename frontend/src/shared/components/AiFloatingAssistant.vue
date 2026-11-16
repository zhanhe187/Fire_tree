<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Compass, Loader2, MessageCircle, Send, X } from 'lucide-vue-next';
import { AiChatMessage, AiNavigationSuggestion, sendAiChat } from '../../features/ai/services/ai';

const props = defineProps<{
  audience: 'portal' | 'admin';
  roleCodes?: string[];
}>();

const route = useRoute();
const router = useRouter();
const open = ref(false);
const draft = ref('');
const loading = ref(false);
const error = ref('');
const messages = ref<AiChatMessage[]>([
  {
    role: 'assistant',
    content: '你好，我可以介绍非遗文化，也可以帮你找到当前项目里的功能入口。',
  },
]);
const suggestions = ref<AiNavigationSuggestion[]>([]);
const messageListRef = ref<HTMLElement | null>(null);
const AI_ENTRY_ANIMATION_WEBP = '/ikun/assistant-entry.webp';
const AI_ENTRY_FRAME_COUNT = 78;
const AI_ENTRY_FRAME_INTERVAL = 66;
const aiEntryFrames = Array.from(
  { length: AI_ENTRY_FRAME_COUNT },
  (_, index) => `/ikun/matte_${String(index + 1).padStart(5, '0')}.png`,
);
const aiEntryFrameIndex = ref(0);
const aiEntryWebpFailed = ref(false);
const aiEntryOffset = ref({ x: 0, y: 0 });
const aiEntryDragging = ref(false);
const aiEntrySuppressClick = ref(false);
let aiEntryAnimationId = 0;
let aiEntryLastFrameAt = 0;
let aiEntryPointerStart = { x: 0, y: 0 };
let aiEntryOffsetStart = { x: 0, y: 0 };

const assistantTone = computed(() => (props.audience === 'admin' ? '管理助手' : '非遗助手'));
const currentAiEntryFrame = computed(() => aiEntryFrames[aiEntryFrameIndex.value]);
const aiEntryImageSource = computed(() => (aiEntryWebpFailed.value ? currentAiEntryFrame.value : AI_ENTRY_ANIMATION_WEBP));
const draggableAiEntryStyle = computed(() => ({
  transform: `translate(${aiEntryOffset.value.x}px, ${aiEntryOffset.value.y}px)`,
}));
const sourceLabel = computed(() => {
  const latest = suggestions.value.length > 0 ? '已找到相关页面' : '可继续提问';
  return loading.value ? '正在思考' : latest;
});

function advanceAiEntryFrame(timestamp: number) {
  if (aiEntryWebpFailed.value) {
    if (!aiEntryLastFrameAt) {
      aiEntryLastFrameAt = timestamp;
    }
    if (timestamp - aiEntryLastFrameAt >= AI_ENTRY_FRAME_INTERVAL) {
      aiEntryFrameIndex.value = (aiEntryFrameIndex.value + 1) % AI_ENTRY_FRAME_COUNT;
      aiEntryLastFrameAt = timestamp;
    }
  }
  aiEntryAnimationId = requestAnimationFrame(advanceAiEntryFrame);
}

function clampAiEntryOffset(x: number, y: number) {
  if (typeof window === 'undefined') {
    return { x, y };
  }
  const entryWidth = window.innerWidth <= 680 ? 96 : 124;
  const entryHeight = window.innerWidth <= 680 ? 130 : 168;
  const margin = 8;
  return {
    x: Math.min(Math.max(x, -(window.innerWidth - entryWidth - margin)), margin),
    y: Math.min(Math.max(y, -(window.innerHeight - entryHeight - margin)), margin),
  };
}

function handleAiEntryPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  aiEntryDragging.value = false;
  aiEntrySuppressClick.value = false;
  aiEntryPointerStart = { x: event.clientX, y: event.clientY };
  aiEntryOffsetStart = { ...aiEntryOffset.value };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function handleAiEntryPointerMove(event: PointerEvent) {
  if (!(event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) return;
  const deltaX = event.clientX - aiEntryPointerStart.x;
  const deltaY = event.clientY - aiEntryPointerStart.y;
  if (!aiEntryDragging.value && Math.hypot(deltaX, deltaY) < 4) return;
  aiEntryDragging.value = true;
  aiEntrySuppressClick.value = true;
  aiEntryOffset.value = clampAiEntryOffset(
    aiEntryOffsetStart.x + deltaX,
    aiEntryOffsetStart.y + deltaY,
  );
}

function handleAiEntryPointerUp(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
  aiEntryDragging.value = false;
}

function toggleAiAssistant() {
  if (aiEntrySuppressClick.value) {
    aiEntrySuppressClick.value = false;
    return;
  }
  open.value = !open.value;
}

async function submit() {
  const message = draft.value.trim();
  if (!message || loading.value) return;
  draft.value = '';
  error.value = '';
  suggestions.value = [];
  messages.value.push({ role: 'user', content: message });
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await sendAiChat({
      message,
      history: messages.value.slice(-8),
      audience: props.audience,
      currentRoute: route.path,
      roleCodes: props.roleCodes ?? [],
    });
    messages.value.push({
      role: 'assistant',
      content: response.answer || '我暂时没有组织出可靠回答，可以换一种问法试试。',
    });
    suggestions.value = response.suggestions ?? [];
  } catch (err) {
    const messageText = err instanceof Error ? err.message : 'AI 助手请求失败';
    error.value = messageText;
    messages.value.push({
      role: 'assistant',
      content: `AI 助手暂时没有连上：${messageText}`,
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}

async function openSuggestion(suggestion: AiNavigationSuggestion) {
  if (suggestion.route && suggestion.route !== route.path) {
    await router.push(suggestion.route);
  }
  open.value = false;
}

async function scrollToBottom() {
  await nextTick();
  const element = messageListRef.value;
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

onMounted(() => {
  aiEntryAnimationId = requestAnimationFrame(advanceAiEntryFrame);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(aiEntryAnimationId);
});
</script>

<template>
  <section class="ai-assistant" :class="[`ai-assistant--${audience}`, { open, dragging: aiEntryDragging }]" :style="draggableAiEntryStyle">
    <button
      class="ai-assistant-button"
      type="button"
      :aria-label="open ? '关闭 AI 助手' : '打开 AI 助手'"
      @click="toggleAiAssistant"
      @pointerdown="handleAiEntryPointerDown"
      @pointermove="handleAiEntryPointerMove"
      @pointerup="handleAiEntryPointerUp"
      @pointercancel="handleAiEntryPointerUp"
    >
      <img class="ai-assistant-frame" :src="aiEntryImageSource" alt="" aria-hidden="true" @error="aiEntryWebpFailed = true" />
      <span class="ai-assistant-button-state" aria-hidden="true">
        <X v-if="open" :size="16" />
        <MessageCircle v-else :size="16" />
      </span>
    </button>

    <aside v-if="open" class="ai-assistant-panel" aria-label="AI 非遗助手">
      <header class="ai-assistant-header">
        <span class="ai-assistant-mark">
          <MessageCircle :size="18" />
        </span>
        <div>
          <strong>{{ assistantTone }}</strong>
          <small>{{ sourceLabel }}</small>
        </div>
      </header>

      <div ref="messageListRef" class="ai-assistant-body">
        <div class="ai-assistant-messages">
          <article
            v-for="(message, index) in messages"
            :key="`${message.role}-${index}`"
            class="ai-message"
            :class="`ai-message--${message.role}`"
          >
            {{ message.content }}
          </article>
          <article v-if="loading" class="ai-message ai-message--assistant loading">
            <Loader2 :size="16" class="spin" />
            正在整理非遗知识与功能入口
          </article>
        </div>

        <div v-if="suggestions.length" class="ai-suggestions" aria-label="推荐功能页面">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.route"
            type="button"
            @click="openSuggestion(suggestion)"
          >
            <Compass :size="14" />
            <span>
              <strong>{{ suggestion.title }}</strong>
              <small>{{ suggestion.reason }}</small>
            </span>
          </button>
        </div>

        <p v-if="error" class="ai-error">{{ error }}</p>
      </div>

      <form class="ai-compose" @submit.prevent="submit">
        <textarea
          v-model="draft"
          rows="2"
          placeholder="问问非遗文化，或说出你想找的功能..."
          @keydown.enter.exact.prevent="submit"
        ></textarea>
        <button type="submit" :disabled="loading || !draft.trim()" aria-label="发送">
          <Send :size="18" />
        </button>
      </form>
    </aside>
  </section>
</template>

<style scoped>
.ai-assistant {
  --ai-entry-width: 124px;
  --ai-entry-height: 168px;
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(28px, env(safe-area-inset-bottom));
  z-index: 120;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  will-change: transform;
}

.ai-assistant-button {
  display: grid;
  place-items: center;
  position: relative;
  width: var(--ai-entry-width);
  height: var(--ai-entry-height);
  border: 0;
  border-radius: 0;
  color: #fff;
  background: transparent;
  filter: drop-shadow(0 18px 26px rgba(36, 48, 74, 0.18));
  cursor: grab;
  overflow: visible;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.ai-assistant.dragging .ai-assistant-button {
  cursor: grabbing;
}

.ai-assistant-button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.42);
  outline-offset: 2px;
}

.ai-assistant-button:hover .ai-assistant-frame,
.ai-assistant.open .ai-assistant-frame {
  transform: translateY(-4px) scale(1.03);
}

.ai-assistant-frame {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  transform-origin: 50% 88%;
  transition: transform 180ms ease, filter 180ms ease;
}

.ai-assistant-button-state {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.88), rgba(8, 145, 178, 0.88));
  box-shadow: 0 8px 18px rgba(14, 116, 144, 0.28);
  color: #fff;
  pointer-events: none;
}

.ai-assistant--admin .ai-assistant-button {
  filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.28));
}

.ai-assistant-panel {
  position: absolute;
  right: 22px;
  bottom: calc(var(--ai-entry-height) - 2px);
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 32px));
  max-height: min(680px, calc(100vh - 120px));
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 0%, rgba(245, 158, 11, 0.18), transparent 34%),
    rgba(255, 251, 244, 0.92);
  box-shadow: 0 28px 80px rgba(40, 28, 16, 0.22);
  backdrop-filter: blur(24px) saturate(1.18);
}

.ai-assistant--admin .ai-assistant-panel {
  background:
    radial-gradient(circle at 12% 0%, rgba(183, 121, 31, 0.18), transparent 34%),
    rgba(18, 24, 38, 0.92);
  color: #f9fafb;
  border-color: rgba(255, 255, 255, 0.14);
}

.ai-assistant-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 18px 14px;
}

.ai-assistant-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(185, 28, 28, 0.12);
  color: #b91c1c;
}

.ai-assistant-header strong,
.ai-assistant-header small {
  display: block;
}

.ai-assistant-header strong {
  font-size: 16px;
}

.ai-assistant-header small {
  margin-top: 2px;
  color: rgba(75, 85, 99, 0.72);
  font-size: 12px;
}

.ai-assistant--admin .ai-assistant-header small {
  color: rgba(229, 231, 235, 0.68);
}

.ai-assistant-body {
  flex: 1 1 auto;
  min-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
}

.ai-assistant-messages {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 18px 10px;
}

.ai-message {
  width: fit-content;
  max-width: 88%;
  min-width: 0;
  border-radius: 18px;
  padding: 10px 12px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ai-message--assistant {
  justify-self: start;
  background: rgba(255, 255, 255, 0.72);
}

.ai-message--user {
  justify-self: end;
  background: linear-gradient(135deg, #dc2626, #f59e0b);
  color: #fff;
}

.ai-assistant--admin .ai-message--assistant {
  background: rgba(255, 255, 255, 0.1);
  color: #f9fafb;
}

.ai-message.loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spin {
  animation: ai-spin 0.9s linear infinite;
}

.ai-suggestions {
  display: grid;
  gap: 8px;
  margin-top: auto;
  padding: 6px 18px 14px;
}

.ai-suggestions button {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(15, 118, 110, 0.16);
  border-radius: 16px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.64);
  color: #0f766e;
  text-align: left;
  cursor: pointer;
}

.ai-suggestions button > span {
  min-width: 0;
}

.ai-suggestions strong,
.ai-suggestions small {
  display: block;
}

.ai-suggestions strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-suggestions small {
  margin-top: 2px;
  color: rgba(31, 41, 55, 0.58);
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ai-assistant--admin .ai-suggestions button {
  background: rgba(255, 255, 255, 0.08);
  color: #99f6e4;
}

.ai-assistant--admin .ai-suggestions small {
  color: rgba(229, 231, 235, 0.62);
}

.ai-error {
  margin: 0 18px 12px;
  color: #b91c1c;
  font-size: 12px;
}

.ai-compose {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.ai-compose textarea {
  min-width: 0;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  padding: 10px 12px;
  resize: none;
  outline: none;
  background: rgba(255, 255, 255, 0.76);
  color: #111827;
  font: inherit;
}

.ai-compose button {
  display: grid;
  place-items: center;
  align-self: end;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: #b91c1c;
  color: #fff;
  cursor: pointer;
}

.ai-compose button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 680px) {
  .ai-assistant {
    --ai-entry-width: 96px;
    --ai-entry-height: 130px;
    right: 8px;
    bottom: 18px;
  }

  .ai-assistant-panel {
    right: 6px;
    bottom: calc(var(--ai-entry-height) + 8px);
    width: calc(100vw - 28px);
    max-height: calc(100vh - 104px);
  }
}
</style>
