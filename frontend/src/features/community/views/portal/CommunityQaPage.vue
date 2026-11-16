<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Bookmark,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  UserRound,
  UserRoundCheck,
  X,
} from 'lucide-vue-next';
import { CommunityQuestionItem, CommunityQuestionPayload, createCommunityAnswer, createCommunityAnswerComment, createCommunityQuestion, createCommunityQuestionComment, fetchCommunityQuestion, fetchCommunityQuestions, fetchCommunityRepliesSince, likeCommunityQuestion } from '../../services/community';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { authSession, currentUser } from '../../../auth/services/authState';
import StarBorder from '../../../../shared/components/StarBorder.vue';

const router = useRouter();
const route = useRoute();
const QUESTION_IMAGE_STORAGE_PREFIX = 'heritage-community-images-';

const questions = ref<CommunityQuestionItem[]>([]);
const selectedQuestion = ref<CommunityQuestionItem | null>(null);
const savedQuestionIds = ref<Set<number>>(new Set());
const nodeOptions = ref<GraphNodeItem[]>([]);
const loading = ref(false);
const detailLoading = ref(false);
const savingQuestion = ref(false);
const savingAnswer = ref(false);
const savingComment = ref('');
const liking = ref('');
const savingFavorite = ref<number | null>(null);
const modalOpen = ref(false);
const error = ref('');
const successMessage = ref('');
const nodeSearchKeyword = ref('');
const questionImagePreview = ref('');
const questionImageName = ref('');
const uploadedQuestionImages = ref<Record<number, string>>({});

const filters = reactive({
  keyword: '',
  nodeId: '' as number | '',
  page: 1,
  size: 10,
  total: 0,
});

const questionForm = reactive<CommunityQuestionPayload>({
  nodeId: null,
  title: '',
  content: '',
});

const answerForm = reactive({
  content: '',
});

const questionCommentForm = reactive({
  content: '',
});

const answerCommentForms = reactive<Record<number, { content: string }>>({});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const totalAnswers = computed(() => questions.value.reduce((sum, item) => sum + Number(item.answerCount ?? 0), 0));
const totalLikes = computed(() => questions.value.reduce((sum, item) => sum + Number(item.likeCount ?? 0), 0));
const relatedInheritors = computed(() => selectedQuestion.value?.relatedInheritors ?? []);
const questionComments = computed(() => (selectedQuestion.value?.comments ?? []).filter((item) => item.targetType === 'QUESTION'));
const currentUserName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '未登录用户');
const selectedSaved = computed(() => Boolean(selectedQuestion.value && savedQuestionIds.value.has(selectedQuestion.value.id)));
const isDetailMode = computed(() => Boolean(route.params.questionId || selectedQuestion.value));
const selectedQuestionImage = computed(() => (selectedQuestion.value ? questionImage(selectedQuestion.value) : ''));
const answerComments = computed(() => {
  const grouped = new Map<number, typeof questionComments.value>();
  for (const comment of selectedQuestion.value?.comments ?? []) {
    if (comment.targetType !== 'ANSWER') continue;
    grouped.set(comment.targetId, [...(grouped.get(comment.targetId) ?? []), comment]);
  }
  return grouped;
});

function savedStorageKey() {
  return `heritage-community-saved-${currentUser.value?.id ?? 'guest'}`;
}

function syncSavedQuestions() {
  try {
    const raw = window.localStorage.getItem(savedStorageKey());
    const ids = raw ? JSON.parse(raw) : [];
    savedQuestionIds.value = new Set(Array.isArray(ids) ? ids.map(Number).filter(Boolean) : []);
  } catch {
    savedQuestionIds.value = new Set();
  }
}

function persistSavedQuestions(next: Set<number>) {
  window.localStorage.setItem(savedStorageKey(), JSON.stringify([...next]));
  savedQuestionIds.value = next;
}

function isQuestionSaved(questionId: number) {
  return savedQuestionIds.value.has(questionId);
}

function questionImage(question: CommunityQuestionItem | number) {
  if (typeof question !== 'number' && question.imageUrl) {
    return question.imageUrl;
  }
  const questionId = typeof question === 'number' ? question : question.id;
  return uploadedQuestionImages.value[questionId] || '';
}

function imageStorageKey() {
  return `${QUESTION_IMAGE_STORAGE_PREFIX}${currentUser.value?.id ?? 'guest'}`;
}

function readQuestionImageStore(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([questionId, value]) => Number(questionId) > 0 && typeof value === 'string' && value.length > 0),
    ) as Record<number, string>;
  } catch {
    return {};
  }
}

function syncQuestionImages() {
  const currentKey = imageStorageKey();
  const imageKeys = Object.keys(window.localStorage)
    .filter((key) => key.startsWith(QUESTION_IMAGE_STORAGE_PREFIX) && key !== currentKey);
  uploadedQuestionImages.value = {
    ...imageKeys.reduce<Record<number, string>>((merged, key) => ({
      ...merged,
      ...readQuestionImageStore(key),
    }), {}),
    ...readQuestionImageStore(currentKey),
  };
}

function persistQuestionImages() {
  window.localStorage.setItem(imageStorageKey(), JSON.stringify(uploadedQuestionImages.value));
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchCommunityQuestions({
      keyword: filters.keyword,
      nodeId: filters.nodeId,
      page: filters.page,
      size: filters.size,
      authorId: isMyPostsMode.value ? (currentUser.value?.id ?? '') : '',
    });
    questions.value = response.items;
    filters.total = response.total;
    if (questions.value.length > 0 && !isMyPostsMode.value) {
      const routeQuestionId = Number(route.params.questionId);
      const currentId = routeQuestionId || selectedQuestion.value?.id;
      const next = currentId ? questions.value.find((item) => item.id === currentId) : null;
      if (next) {
        await selectQuestion(next);
      } else if (routeQuestionId) {
        await selectQuestion(routeQuestionId);
      } else {
        selectedQuestion.value = null;
      }
    } else {
      selectedQuestion.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '社区问答列表加载失败';
  } finally {
    loading.value = false;
  }
}

async function selectQuestion(question: CommunityQuestionItem | number) {
  const questionId = typeof question === 'number' ? question : question.id;
  detailLoading.value = true;
  error.value = '';
  // 不在这里清 successMessage：发帖/回答/评论都是「先写提示再刷新详情」，
  // 在此清空会让成功提示同帧消失。用户主动切换帖子时由 openQuestionDetail 清。
  try {
    selectedQuestion.value = await fetchCommunityQuestion(questionId);
    for (const answer of selectedQuestion.value.answers ?? []) {
      answerCommentForms[answer.id] ??= { content: '' };
    }
    await checkNewReplies(questionId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '社区问答详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

async function checkNewReplies(questionId: number) {
  const lastViewed = lastViewedTimestamps.value[questionId];
  if (!lastViewed || !currentUser.value) return;
  try {
    const result = await fetchCommunityRepliesSince(questionId, lastViewed);
    const total = result.totalNewReplyCount || 0;
    if (total > 0) {
      successMessage.value = `自你上次查看以来，该帖有 ${total} 条新回复`;
    }
  } catch {
    // ignore notification errors
  }
}

function recordQuestionView(questionId: number) {
  lastViewedTimestamps.value = {
    ...lastViewedTimestamps.value,
    [questionId]: new Date().toISOString(),
  };
}

async function openQuestionDetail(question: CommunityQuestionItem) {
  // 用户主动切换帖子时清掉上一条操作提示
  successMessage.value = '';
  if (route.path !== `/qa/${question.id}`) {
    await router.push(`/qa/${question.id}`);
  }
  await selectQuestion(question);
  recordQuestionView(question.id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function backToFeed() {
  selectedQuestion.value = null;
  if (route.path !== '/qa') {
    await router.push('/qa');
  }
}

async function searchNodes() {
  const response = await fetchGraphNodes({
    keyword: nodeSearchKeyword.value,
    auditStatus: 'APPROVED',
    page: 1,
    size: 500,
  });
  nodeOptions.value = response.items;
}

async function openCreate() {
  if (!(await ensureSignedIn('发布问题'))) return;
  Object.assign(questionForm, {
    nodeId: null,
    title: '',
    content: '',
  });
  questionImagePreview.value = '';
  questionImageName.value = '';
  modalOpen.value = true;
}

function handleQuestionImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件';
    input.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    error.value = '图片请控制在 2MB 以内';
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    questionImagePreview.value = String(reader.result || '');
    questionImageName.value = file.name;
  };
  reader.readAsDataURL(file);
}

function removeQuestionImage() {
  questionImagePreview.value = '';
  questionImageName.value = '';
}

async function ensureSignedIn(action: string) {
  if (authSession.token) return true;
  error.value = `请先登录后再${action}`;
  await router.push({ path: '/login', query: { redirect: '/qa' } });
  return false;
}

async function saveQuestion() {
  if (!(await ensureSignedIn('发布问题'))) return;
  savingQuestion.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const created = await createCommunityQuestion({
      nodeId: questionForm.nodeId || null,
      title: questionForm.title,
      content: questionForm.content,
      imageUrl: questionImagePreview.value || undefined,
    });
    modalOpen.value = false;
    if (created.imageUrl || questionImagePreview.value) {
      uploadedQuestionImages.value = {
        ...uploadedQuestionImages.value,
        [created.id]: created.imageUrl || questionImagePreview.value,
      };
      persistQuestionImages();
    }
    questionImagePreview.value = '';
    questionImageName.value = '';
    successMessage.value = '问题已发布';
    filters.page = 1;
    await load();
    await router.push(`/qa/${created.id}`);
    await selectQuestion(created);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '问题发布失败，可能命中了敏感词拦截';
  } finally {
    savingQuestion.value = false;
  }
}

async function saveAnswer() {
  if (!selectedQuestion.value) return;
  if (!(await ensureSignedIn('回答问题'))) return;
  savingAnswer.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createCommunityAnswer(selectedQuestion.value.id, { content: answerForm.content });
    answerForm.content = '';
    successMessage.value = '回答已发布';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '回答发布失败';
  } finally {
    savingAnswer.value = false;
  }
}

async function saveQuestionComment() {
  if (!selectedQuestion.value) return;
  if (!(await ensureSignedIn('发表评论'))) return;
  savingComment.value = `question-${selectedQuestion.value.id}`;
  error.value = '';
  successMessage.value = '';
  try {
    await createCommunityQuestionComment(selectedQuestion.value.id, { content: questionCommentForm.content });
    questionCommentForm.content = '';
    await selectQuestion(selectedQuestion.value);
    successMessage.value = '评论已发布';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '评论发布失败';
  } finally {
    savingComment.value = '';
  }
}

async function saveAnswerComment(answerId: number) {
  if (!selectedQuestion.value) return;
  if (!(await ensureSignedIn('发表评论'))) return;
  const form = answerCommentForms[answerId];
  if (!form) return;
  savingComment.value = `answer-${answerId}`;
  error.value = '';
  successMessage.value = '';
  try {
    await createCommunityAnswerComment(answerId, { content: form.content });
    form.content = '';
    await selectQuestion(selectedQuestion.value);
    successMessage.value = '评论已发布';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '回答评论发布失败';
  } finally {
    savingComment.value = '';
  }
}

function isLiked(question: CommunityQuestionItem | null | undefined) {
  return Boolean(question && Number(question.liked ?? 0) > 0);
}

async function likeQuestion(question: CommunityQuestionItem) {
  if (!(await ensureSignedIn('点赞'))) return;
  liking.value = `question-${question.id}`;
  error.value = '';
  successMessage.value = '';
  try {
    const result = await likeCommunityQuestion(question.id, {});
    // 局部更新点赞状态与数量，不重新拉取整个列表，避免页面闪烁
    const nextLiked = result ? Boolean(Number(result.liked ?? 1)) : true;
    const nextCount = Number(result?.likeCount ?? (Number(question.likeCount || 0) + (nextLiked ? 1 : -1)));
    question.liked = nextLiked;
    question.likeCount = Math.max(0, nextCount);
    const listItem = questions.value.find((item) => item.id === question.id);
    if (listItem) {
      listItem.liked = nextLiked;
      listItem.likeCount = Math.max(0, nextCount);
    }
    if (selectedQuestion.value?.id === question.id) {
      selectedQuestion.value.liked = nextLiked;
      selectedQuestion.value.likeCount = Math.max(0, nextCount);
    }
    successMessage.value = nextLiked ? '已点赞该帖子' : '已取消点赞';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '点赞失败，请稍后重试';
  } finally {
    liking.value = '';
  }
}

async function likeSelectedQuestion() {
  if (!selectedQuestion.value) return;
  await likeQuestion(selectedQuestion.value);
}

async function toggleFavoriteQuestion(question: CommunityQuestionItem) {
  if (!(await ensureSignedIn('收藏帖子'))) return;
  savingFavorite.value = question.id;
  error.value = '';
  successMessage.value = '';
  try {
    const next = new Set(savedQuestionIds.value);
    if (next.has(question.id)) {
      next.delete(question.id);
      successMessage.value = '已取消收藏该帖子';
    } else {
      next.add(question.id);
      successMessage.value = '已收藏该帖子';
    }
    persistSavedQuestions(next);
  } finally {
    savingFavorite.value = null;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.nodeId = '';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function formatTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

function relativeTime(value?: string) {
  if (!value) return '刚刚';
  const time = new Date(value.replace(' ', 'T')).getTime();
  if (Number.isNaN(time)) return formatTime(value);
  const diff = Date.now() - time;
  if (diff < 0) return '刚刚';
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return formatTime(value);
}

function authorInitial(name?: string) {
  return (name || '匿').trim().slice(0, 1) || '匿';
}

function avatarStyle(avatar: string | undefined, seed?: string | number) {
  if (avatar) return {};
  return { background: avatarTone(seed) };
}

function avatarTone(seed?: string | number) {
  const tones = [
    'linear-gradient(135deg, #dc2626, #f97316)',
    'linear-gradient(135deg, #0f766e, #2dd4bf)',
    'linear-gradient(135deg, #2563eb, #38bdf8)',
    'linear-gradient(135deg, #7c3aed, #c084fc)',
    'linear-gradient(135deg, #b45309, #fbbf24)',
  ];
  const key = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i)) % tones.length;
  return tones[hash];
}

function questionTags(question: CommunityQuestionItem) {
  const tags: string[] = [];
  if (question.nodeName) tags.push(question.nodeName);
  if (question.nodeCode) tags.push(question.nodeCode);
  if (Number(question.answerCount || 0) === 0) tags.push('待回答');
  return tags.slice(0, 3);
}

const sortMode = ref<'latest' | 'unanswered' | 'hot' | 'saved' | 'mine'>('latest');
const lastViewedTimestamps = ref<Record<number, string>>({});

const displayedQuestions = computed(() => {
  const list = [...questions.value];
  if (sortMode.value === 'saved') {
    return list.filter((item) => savedQuestionIds.value.has(item.id));
  }
  if (sortMode.value === 'unanswered') {
    return list.filter((item) => Number(item.answerCount || 0) === 0);
  }
  if (sortMode.value === 'hot') {
    return list.sort((a, b) => Number(b.likeCount || 0) + Number(b.answerCount || 0) * 2 - (Number(a.likeCount || 0) + Number(a.answerCount || 0) * 2));
  }
  return list;
});

const isMyPostsMode = computed(() => sortMode.value === 'mine');

const answeredCount = computed(() => questions.value.filter((item) => Number(item.answerCount || 0) > 0).length);
const hotQuestions = computed(() => [...questions.value]
  .sort((a, b) => Number(b.likeCount || 0) + Number(b.answerCount || 0) * 2 - (Number(a.likeCount || 0) + Number(a.answerCount || 0) * 2))
  .slice(0, 5));
const nodeCloud = computed(() => {
  const map = new Map<string, number>();
  for (const question of questions.value) {
    const key = question.nodeName || question.nodeCode || '';
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
});
const selectedOwnerAnswerCount = computed(() => {
  if (!selectedQuestion.value) return 0;
  return (selectedQuestion.value.answers ?? []).filter((answer) => answer.authorName === selectedQuestion.value?.authorName).length;
});
const barLevel = computed(() => Math.max(1, Math.min(18, Math.floor(filters.total / 3) + 1)));

onMounted(async () => {
  syncSavedQuestions();
  syncQuestionImages();
  await Promise.all([load(), searchNodes()]);
  const routeQuestionId = Number(route.params.questionId);
  if (routeQuestionId) {
    await selectQuestion(routeQuestionId);
  }
});

watch(() => route.params.questionId, async (value) => {
  const questionId = Number(value);
  if (questionId) {
    await selectQuestion(questionId);
  } else {
    selectedQuestion.value = null;
  }
});

watch(
  () => sortMode.value,
  () => {
    filters.page = 1;
    void load();
  },
);
</script>

<template>
  <section class="community-page tieba-page">
    <StarBorder
      as="header"
      custom-class="forum-banner tieba-bar-head"
      color="#fff7ed"
      speed="5s"
      :thickness="2"
    >
      <div class="forum-banner-glass">
        <div class="tieba-cover" aria-hidden="true">
          <span>非遗</span>
        </div>
        <div class="forum-identity">
          <span class="forum-emblem" aria-hidden="true">遗</span>
          <div class="forum-identity-text">
            <div class="bar-title-row">
              <h2>非遗问答</h2>
            </div>
            <p>围绕非遗节点提问、回答、评论，与传承人和爱好者互动</p>
            <div class="forum-stat-chips tieba-stat-chips">
              <span>关注 <strong>{{ savedQuestionIds.size }}</strong></span>
              <span>主题 <strong>{{ filters.total }}</strong></span>
              <span>回答 <strong>{{ totalAnswers }}</strong></span>
              <span>等级 <strong>Lv.{{ barLevel }}</strong></span>
            </div>
          </div>
        </div>
        <div class="forum-banner-actions">
          <button class="secondary-action" type="button" @click="load">
            <RefreshCcw :size="16" />
            刷新
          </button>
          <button class="primary-action" type="button" @click="openCreate">
            <Plus :size="17" />
            发布帖子
          </button>
        </div>
      </div>
    </StarBorder>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <section class="community-workbench" :class="{ 'detail-open': isDetailMode }">
      <section v-if="!isDetailMode" class="tieba-list-layout" aria-label="非遗问答帖子列表">
          <main class="forum-main tieba-main-panel">
            <div class="forum-toolbar tieba-thread-toolbar">
              <nav class="forum-tabs" aria-label="帖子排序">
                <button class="forum-tab" :class="{ active: sortMode === 'latest' }" type="button" @click="sortMode = 'latest'">看帖</button>
                <button class="forum-tab" :class="{ active: sortMode === 'hot' }" type="button" @click="sortMode = 'hot'">精品</button>
                <button class="forum-tab" :class="{ active: sortMode === 'unanswered' }" type="button" @click="sortMode = 'unanswered'">待回答</button>
                <button class="forum-tab" :class="{ active: sortMode === 'saved' }" type="button" @click="sortMode = 'saved'">收藏</button>
                <button v-if="currentUser" class="forum-tab" :class="{ active: sortMode === 'mine' }" type="button" @click="sortMode = 'mine'">我的帖子</button>
              </nav>
              <div class="forum-search tieba-bar-search">
                <Search :size="15" />
                <input v-model="filters.keyword" type="search" placeholder="在本站搜索帖子" @keyup.enter="filters.page = 1; load()" />
                <button class="primary-action compact" type="button" @click="filters.page = 1; load()">搜索</button>
              </div>
            </div>

            <div class="tieba-thread-countbar">
              <strong>共有 {{ filters.total }} 个主题帖</strong>
              <span>{{ answeredCount }} 个帖子已有答复 · {{ totalLikes }} 次点赞互动</span>
              <button class="primary-action compact" type="button" @click="openCreate">
                <Plus :size="15" />
                发帖
              </button>
            </div>

            <div class="forum-feed-scroll tieba-thread-feed">
              <div v-if="loading" class="state-panel">
                <Loader2 :size="24" class="spin" />
                <span>正在加载社区问答</span>
              </div>

              <div v-else-if="displayedQuestions.length === 0" class="state-panel empty">
                <MessageCircleQuestion :size="28" />
                <strong>暂无问答记录</strong>
                <span>可以先围绕一个非遗节点发起提问，系统会匹配相关传承人。</span>
                <button class="primary-action compact" type="button" @click="openCreate">发布帖子</button>
              </div>

              <ul v-else class="thread-list tieba-thread-list">
                <li
                  v-for="question in displayedQuestions"
                  :key="question.id"
                  class="thread-row tieba-thread-row"
                  :class="{ saved: isQuestionSaved(question.id), answered: Number(question.answerCount || 0) > 0 }"
                  role="link"
                  tabindex="0"
                  @click="openQuestionDetail(question)"
                  @keydown.enter.prevent="openQuestionDetail(question)"
                  @keydown.space.prevent="openQuestionDetail(question)"
                >
                  <div class="thread-count tieba-reply-count">
                    <strong>{{ question.answerCount || 0 }}</strong>
                    <small>回复</small>
                  </div>

                  <div class="thread-main">
                    <div class="thread-title-line">
                      <span v-if="Number(question.answerCount || 0) === 0" class="thread-flag">待答</span>
                      <span v-if="Number(question.likeCount || 0) >= 5" class="thread-flag hot">精品</span>
                      <button class="thread-title" type="button" @click.stop="openQuestionDetail(question)">
                        {{ question.title }}
                      </button>
                    </div>
                    <p class="thread-excerpt">{{ question.content }}</p>
                    <div v-if="questionTags(question).length" class="thread-tags">
                      <span v-for="tag in questionTags(question)" :key="tag" class="thread-tag">{{ tag }}</span>
                    </div>
                    <div class="thread-foot">
                      <span class="thread-author">
                        <span class="qa-avatar small" :style="avatarStyle(question.authorAvatar, question.authorId || question.authorName)">
                          <img v-if="question.authorAvatar" :src="question.authorAvatar" :alt="question.authorName" class="qa-avatar-img" />
                          <template v-else>{{ authorInitial(question.authorName) }}</template>
                        </span>
                        <span class="thread-author-name">{{ question.authorName }}</span>
                      </span>
                      <span class="thread-dot">·</span>
                      <span class="thread-time">最后回复 {{ relativeTime(question.updatedAt || question.createdAt) }}</span>
                      <span class="thread-foot-spacer"></span>
                      <span class="thread-metric">{{ question.viewCount || 0 }} 浏览</span>
                      <button class="thread-mini" :class="{ liked: isLiked(question) }" type="button" :disabled="liking === `question-${question.id}`" @click.stop="likeQuestion(question)">
                        <Loader2 v-if="liking === `question-${question.id}`" :size="14" class="spin" />
                        <Heart v-else :size="14" :fill="isLiked(question) ? 'currentColor' : 'none'" />
                        {{ question.likeCount || 0 }}
                      </button>
                      <button class="thread-mini" :class="{ active: isQuestionSaved(question.id) }" type="button" :disabled="savingFavorite === question.id" @click.stop="toggleFavoriteQuestion(question)">
                        <Loader2 v-if="savingFavorite === question.id" :size="14" class="spin" />
                        <Bookmark v-else :size="14" />
                        {{ isQuestionSaved(question.id) ? '已收藏' : '收藏' }}
                      </button>
                    </div>
                  </div>

                  <button v-if="questionImage(question)" class="thread-thumb" type="button" @click.stop="openQuestionDetail(question)">
                    <img :src="questionImage(question)" alt="帖子图片" />
                  </button>
                </li>
              </ul>
            </div>

            <footer class="pagination feed-pagination tieba-pagination">
              <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
              <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
              <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
            </footer>
          </main>

          <aside class="tieba-sidebar" aria-label="吧信息与筛选">
            <section class="side-section forum-info-card tieba-profile-card">
              <div class="forum-info-head">
                <span class="forum-emblem small" aria-hidden="true">遗</span>
                <div>
                  <strong>非遗问答吧</strong>
                  <small>当前身份：{{ currentUserName }}</small>
                </div>
              </div>
              <div class="tieba-level-card">
                <span>本吧等级</span>
                <strong>Lv.{{ barLevel }}</strong>
                <em>经验 {{ totalLikes + totalAnswers * 2 + filters.total * 3 }}</em>
              </div>
              <button class="primary-action compact" type="button" @click="openCreate">
                <Plus :size="16" />
                我要发帖
              </button>
              <p class="forum-info-tip">帖子是本吧主体；点击标题进入帖子详情后才能回答和评论，点赞与收藏在列表和详情都可操作。</p>
            </section>

            <section class="side-section forum-nav-card tieba-side-nav">
              <button :class="{ active: sortMode === 'latest' }" type="button" @click="sortMode = 'latest'">
                <MessageCircleQuestion :size="16" />
                全部主题
                <small>{{ filters.total }}</small>
              </button>
              <button :class="{ active: sortMode === 'unanswered' }" type="button" @click="sortMode = 'unanswered'">
                <MessageSquare :size="16" />
                等待回答
                <small>{{ questions.filter((item) => Number(item.answerCount || 0) === 0).length }}</small>
              </button>
              <button :class="{ active: sortMode === 'saved' }" type="button" @click="sortMode = 'saved'">
                <Bookmark :size="16" />
                我的收藏
                <small>{{ savedQuestionIds.size }}</small>
              </button>
              <button v-if="currentUser" :class="{ active: sortMode === 'mine' }" type="button" @click="sortMode = 'mine'">
                <UserRound :size="16" />
                我的帖子
                <small>{{ questions.filter((item) => item.authorId === currentUser?.id).length }}</small>
              </button>
            </section>

            <section class="side-section forum-filter-card tieba-filter-card">
              <h3>本吧筛选</h3>
              <label>
                <span>关键词</span>
                <input v-model="filters.keyword" type="search" placeholder="问题 / 内容 / 提问人 / 节点" @keyup.enter="filters.page = 1; load()" />
              </label>
              <label>
                <span>关联节点</span>
                <select v-model.number="filters.nodeId">
                  <option value="">全部节点</option>
                  <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
                    {{ node.name }} / {{ node.nodeCode }}
                  </option>
                </select>
              </label>
              <label>
                <span>节点搜索</span>
                <div class="inline-search">
                  <input v-model="nodeSearchKeyword" type="search" placeholder="节点名称或编码" @keyup.enter="searchNodes" />
                  <button class="secondary-action compact" type="button" @click="searchNodes">
                    <Search :size="15" />
                  </button>
                </div>
              </label>
              <div class="side-filter-actions">
                <button class="primary-action compact" type="button" @click="filters.page = 1; load()">
                  <Search :size="16" />
                  筛选
                </button>
                <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
              </div>
            </section>

            <section class="side-section forum-mini-stats tieba-side-stats">
              <article>
                <strong>{{ answeredCount }}</strong>
                <small>已有答复</small>
              </article>
              <article>
                <strong>{{ totalLikes }}</strong>
                <small>累计点赞</small>
              </article>
            </section>

            <section class="side-section hot-thread-card">
              <h3>本吧热议</h3>
              <ol v-if="hotQuestions.length" class="hot-thread-list">
                <li v-for="(question, index) in hotQuestions" :key="question.id">
                  <button type="button" @click="openQuestionDetail(question)">
                    <em>{{ index + 1 }}</em>
                    <span>{{ question.title }}</span>
                    <small>{{ Number(question.answerCount || 0) + Number(question.likeCount || 0) }} 热度</small>
                  </button>
                </li>
              </ol>
              <p v-else class="aside-empty">暂无热议帖子。</p>
            </section>

            <section class="side-section node-cloud-card">
              <h3>关联节点</h3>
              <div v-if="nodeCloud.length" class="node-cloud">
                <button
                  v-for="node in nodeCloud"
                  :key="node.name"
                  type="button"
                  @click="filters.keyword = node.name; filters.page = 1; load()"
                >
                  {{ node.name }} <small>{{ node.count }}</small>
                </button>
              </div>
              <p v-else class="aside-empty">帖子关联节点后会显示在这里。</p>
            </section>
          </aside>
      </section>

      <article v-else class="community-detail-view tieba-detail-view">
        <div v-if="detailLoading" class="state-panel compact-state">
          <Loader2 :size="22" class="spin" />
          <span>正在加载问答详情</span>
        </div>

        <template v-else-if="selectedQuestion">
          <section class="tieba-detail-layout">
            <main class="tieba-floor-main">
              <section class="tieba-post-card tieba-floor floor-host">
                <aside class="floor-author-card">
                  <span class="qa-avatar floor-avatar" :style="avatarStyle(selectedQuestion.authorAvatar, selectedQuestion.authorId || selectedQuestion.authorName)">
                    <img v-if="selectedQuestion.authorAvatar" :src="selectedQuestion.authorAvatar" :alt="selectedQuestion.authorName" class="qa-avatar-img" />
                    <template v-else>{{ authorInitial(selectedQuestion.authorName) }}</template>
                  </span>
                  <strong>{{ selectedQuestion.authorName }}</strong>
                  <small>楼主 · Lv.{{ Math.max(1, Math.min(12, Number(selectedQuestion.likeCount || 0) + 1)) }}</small>
                  <em>{{ selectedQuestion.nodeName || '非遗爱好者' }}</em>
                </aside>
                <article class="floor-content">
                  <button class="secondary-action compact back-to-feed" type="button" @click="backToFeed">
                    ← 返回帖子列表
                  </button>
                  <div class="detail-title-row">
                    <h3>{{ selectedQuestion.title }}</h3>
                    <span class="status-chip" :class="selectedQuestion.status.toLowerCase()">{{ selectedQuestion.status }}</span>
                  </div>
                  <div class="floor-meta-line">
                    <span>1楼</span>
                    <span>发布于 {{ relativeTime(selectedQuestion.createdAt) }}</span>
                    <span>{{ selectedQuestion.viewCount || 0 }} 浏览</span>
                  </div>
                  <p>{{ selectedQuestion.content }}</p>
                  <img v-if="selectedQuestionImage" class="detail-question-image" :src="selectedQuestionImage" alt="帖子上传图片" />
                  <div class="qa-tag-row">
                    <span v-for="tag in questionTags(selectedQuestion)" :key="tag" class="qa-tag">{{ tag }}</span>
                  </div>
                  <div class="detail-action-row">
                    <button class="thread-action primary-thread-action" :class="{ liked: isLiked(selectedQuestion) }" type="button" :disabled="liking === `question-${selectedQuestion.id}`" @click="likeSelectedQuestion">
                      <Loader2 v-if="liking === `question-${selectedQuestion.id}`" :size="16" class="spin" />
                      <Heart v-else :size="16" :fill="isLiked(selectedQuestion) ? 'currentColor' : 'none'" />
                      {{ selectedQuestion.likeCount }} 点赞
                    </button>
                    <button class="thread-action" :class="{ active: selectedSaved }" type="button" :disabled="savingFavorite === selectedQuestion.id" @click="toggleFavoriteQuestion(selectedQuestion)">
                      <Loader2 v-if="savingFavorite === selectedQuestion.id" :size="16" class="spin" />
                      <Bookmark v-else :size="16" />
                      {{ selectedSaved ? '已收藏' : '收藏帖子' }}
                    </button>
                    <span class="detail-answer-count">{{ selectedQuestion.answerCount }} 条回复</span>
                  </div>
                </article>
              </section>

              <section class="tieba-reply-header">
                <h3>全部回复</h3>
                <span>共 {{ selectedQuestion.answers?.length || 0 }} 层，按时间排序</span>
              </section>

              <div v-if="!selectedQuestion.answers?.length" class="chain-empty tieba-empty-floor">
                <MessageSquare :size="16" />
                <span>还没有回答，成为第一个参与讨论的人。</span>
              </div>

              <div v-else class="tieba-floor-list">
                <section v-for="(answer, index) in selectedQuestion.answers" :key="answer.id" class="tieba-post-card tieba-floor">
                  <aside class="floor-author-card">
                    <span class="qa-avatar floor-avatar" :style="avatarStyle(answer.authorAvatar, answer.authorId || answer.authorName)">
                      <img v-if="answer.authorAvatar" :src="answer.authorAvatar" :alt="answer.authorName" class="qa-avatar-img" />
                      <template v-else>{{ authorInitial(answer.authorName) }}</template>
                    </span>
                    <strong>{{ answer.authorName }}</strong>
                    <small>吧友 · Lv.{{ Math.max(1, Math.min(12, Number(answer.likeCount || 0) + 1)) }}</small>
                    <em v-if="answer.accepted">优质回答</em>
                  </aside>
                  <article class="floor-content">
                    <div class="floor-meta-line">
                      <span>{{ index + 2 }}楼</span>
                      <span>{{ relativeTime(answer.createdAt) }}</span>
                      <span>{{ answer.likeCount }} 点赞</span>
                    </div>
                    <p>{{ answer.content }}</p>
                    <div v-if="answerComments.get(answer.id)?.length" class="community-comment-list floor-comment-list">
                      <span v-for="comment in answerComments.get(answer.id)" :key="comment.id">
                        <em>{{ comment.authorName }}</em>{{ comment.content }}
                      </span>
                    </div>
                    <div class="community-inline-form floor-inline-form">
                      <input v-model="answerCommentForms[answer.id].content" type="text" placeholder="回复本楼" @keyup.enter="saveAnswerComment(answer.id)" />
                      <button class="secondary-action compact" type="button" :disabled="savingComment === `answer-${answer.id}`" @click="saveAnswerComment(answer.id)">
                        <Loader2 v-if="savingComment === `answer-${answer.id}`" :size="15" class="spin" />
                        <Send v-else :size="15" />
                      </button>
                    </div>
                  </article>
                </section>
              </div>

              <section class="tieba-post-card tieba-reply-editor">
                <h3>发表回复</h3>
                <label>
                  <span>回答内容</span>
                  <textarea v-model="answerForm.content" rows="5" placeholder="分享你了解的工艺、传承脉络或一手经验" ></textarea>
                </label>
                <button class="primary-action" type="button" :disabled="savingAnswer" @click="saveAnswer">
                  <Loader2 v-if="savingAnswer" :size="16" class="spin" />
                  <Send v-else :size="16" />
                  发布回复
                </button>
              </section>
            </main>

            <aside class="tieba-detail-sidebar">
              <section class="side-section community-compose tieba-side-comments">
                <h3>帖子评论</h3>
                <div v-if="questionComments.length" class="community-comment-list standalone">
                  <span v-for="comment in questionComments" :key="comment.id">
                    <em>{{ comment.authorName }}</em>{{ comment.content }}
                  </span>
                </div>
                <p v-else class="aside-empty">还没有评论，欢迎补充提问背景或线索。</p>
                <label>
                  <span>评论内容</span>
                  <textarea v-model="questionCommentForm.content" rows="3" placeholder="补充提问、分享线索或说明观点" ></textarea>
                </label>
                <button class="secondary-action" type="button" :disabled="savingComment === `question-${selectedQuestion.id}`" @click="saveQuestionComment">
                  <Loader2 v-if="savingComment === `question-${selectedQuestion.id}`" :size="16" class="spin" />
                  <MessageSquare v-else :size="16" />
                  发布评论
                </button>
              </section>

              <section class="side-section inheritor-card tieba-lz-card">
                <h3>楼主档案</h3>
                <div class="forum-info-head">
                  <span class="qa-avatar small" :style="avatarStyle(selectedQuestion.authorAvatar, selectedQuestion.authorId || selectedQuestion.authorName)">
                    <img v-if="selectedQuestion.authorAvatar" :src="selectedQuestion.authorAvatar" :alt="selectedQuestion.authorName" class="qa-avatar-img" />
                    <template v-else>{{ authorInitial(selectedQuestion.authorName) }}</template>
                  </span>
                  <div>
                    <strong>{{ selectedQuestion.authorName }}</strong>
                    <small>本帖中回复 {{ selectedOwnerAnswerCount }} 次</small>
                  </div>
                </div>
              </section>

              <section class="side-section inheritor-card">
                <h3>相关传承人</h3>
                <div v-if="relatedInheritors.length === 0" class="chain-empty">
                  <UserRoundCheck :size="16" />
                  <span>当前节点暂无匹配传承人</span>
                </div>
                <div v-else class="community-inheritor-list">
                  <article v-for="inheritor in relatedInheritors" :key="inheritor.id">
                    <span class="qa-avatar small" :style="{ background: avatarTone(inheritor.name) }">{{ authorInitial(inheritor.name) }}</span>
                    <span class="qa-author-text">
                      <strong>{{ inheritor.name }}</strong>
                      <small>{{ inheritor.nodeCode }}</small>
                    </span>
                  </article>
                </div>
              </section>
            </aside>
          </section>
        </template>
      </article>
    </section>

    <div v-if="modalOpen" class="modal-backdrop">
      <section class="node-modal">
        <header>
          <h3>新增社区问题</h3>
          <button class="icon-only" type="button" @click="modalOpen = false">
            <X :size="16" />
          </button>
        </header>

        <div class="form-grid">
          <label>
            <span>关联节点</span>
            <select v-model.number="questionForm.nodeId">
              <option :value="null">不关联节点</option>
              <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
                {{ node.name }} / {{ node.nodeCode }}
              </option>
            </select>
          </label>
          <label class="wide">
            <span>问题标题</span>
            <input v-model="questionForm.title" type="text" placeholder="例如：这项技艺的关键传承步骤是什么？" />
          </label>
          <label class="wide">
            <span>问题内容</span>
            <textarea v-model="questionForm.content" rows="5" placeholder="描述背景、疑问和希望传承人补充的信息" ></textarea>
          </label>
          <label class="wide image-upload-field">
            <span>帖子图片</span>
            <input type="file" accept="image/*" @change="handleQuestionImageChange" />
            <small>支持 JPG / PNG / WebP，建议 2MB 以内。当前版本会在前端展示预览。</small>
          </label>
          <div v-if="questionImagePreview" class="wide question-image-preview">
            <img :src="questionImagePreview" alt="帖子图片预览" />
            <button class="secondary-action compact" type="button" @click="removeQuestionImage">移除图片</button>
            <span>{{ questionImageName }}</span>
          </div>
          <div class="wide community-moderation-note">
            <ShieldAlert :size="17" />
            <span>发布时会检查敏感词，命中内容会被阻断并写入内容审核记录。</span>
          </div>
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="savingQuestion" @click="saveQuestion">
            <Loader2 v-if="savingQuestion" :size="16" class="spin" />
            发布问题
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<style scoped>
:global(.portal-function-section:has(.community-page)) {
  position: relative;
  isolation: isolate;
  padding-top: clamp(42px, 5vw, 72px);
  background:
    radial-gradient(circle at 10% 4%, rgba(216, 58, 46, 0.14), transparent 26%),
    radial-gradient(circle at 86% 10%, rgba(30, 156, 255, 0.15), transparent 30%),
    radial-gradient(circle at 50% 90%, rgba(244, 180, 63, 0.18), transparent 34%),
    linear-gradient(180deg, #fff8ee 0%, #eef8ff 44%, #fff4e0 100%);
}

:global(.portal-function-section:has(.community-page)::before) {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent);
  pointer-events: none;
}

.community-page {
  --qa-ink: #111827;
  --qa-muted: #667085;
  --qa-line: rgba(15, 23, 42, 0.1);
  --qa-card: rgba(255, 255, 255, 0.86);
  --qa-orange: #ea580c;
  --qa-red: #dc2626;
  --qa-amber: #f59e0b;
  --qa-blue: #2563eb;
  --qa-teal: #0f766e;
  --qa-shadow: 0 18px 46px rgba(91, 55, 22, 0.1);
  width: min(1320px, 100%) !important;
  gap: 20px !important;
  color: var(--qa-ink);
}

.community-page .page-heading,
.community-page > .filter-bar,
.community-session-strip,
.community-side .side-section,
.community-stats article,
.community-feed-panel,
.community-detail-view > .state-panel,
.community-detail-view .side-section,
.node-modal {
  border: 1px solid rgba(124, 45, 18, 0.09) !important;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 250, 242, 0.7)),
    rgba(255, 255, 255, 0.84) !important;
  box-shadow: var(--qa-shadow) !important;
  backdrop-filter: blur(22px) saturate(1.12) !important;
}

.community-page .page-heading {
  min-height: 128px;
  padding: clamp(24px, 3vw, 36px) !important;
  border-radius: 30px !important;
}

.community-page .page-heading::before {
  background:
    radial-gradient(circle at 8% 8%, rgba(220, 38, 38, 0.12), transparent 28%),
    radial-gradient(circle at 84% 20%, rgba(245, 158, 11, 0.16), transparent 30%) !important;
}

.community-page .page-heading h2 {
  max-width: 760px;
  margin: 8px 0 8px !important;
  color: #101828 !important;
  font-size: clamp(34px, 4.2vw, 58px) !important;
  line-height: 1.04 !important;
  letter-spacing: 0.07em !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.88), 10px 13px 0 rgba(245, 158, 11, 0.08);
}

.community-page .page-heading span {
  max-width: 720px;
  color: rgba(17, 24, 39, 0.62) !important;
  font-size: 15px;
  line-height: 1.7;
}

.community-page .eyebrow {
  border-color: rgba(220, 38, 38, 0.18) !important;
  background: rgba(254, 242, 242, 0.8) !important;
  color: #b91c1c !important;
}

.community-page .primary-action,
.community-page .secondary-action,
.thread-action {
  min-height: 42px !important;
  border-radius: 999px !important;
  font-weight: 900;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.community-page .primary-action {
  border: 0 !important;
  background: linear-gradient(135deg, #dc2626, #f97316 50%, #fbbf24) !important;
  color: #fff !important;
  box-shadow: 0 16px 34px rgba(234, 88, 12, 0.26) !important;
}

.community-page .secondary-action,
.thread-action {
  border: 1px solid rgba(15, 23, 42, 0.1) !important;
  background: rgba(255, 255, 255, 0.76) !important;
  color: #1f2937 !important;
}

.community-page .primary-action:hover,
.community-page .secondary-action:hover,
.thread-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(91, 55, 22, 0.14) !important;
}

.community-session-strip {
  width: max-content;
  max-width: 100%;
  margin-top: -8px !important;
  padding: 12px 16px !important;
  border-radius: 999px !important;
}

.community-session-strip strong {
  color: #b91c1c !important;
}

.community-stats {
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px !important;
}

.community-stats article {
  min-height: 132px;
  padding: 24px !important;
  border-radius: 30px !important;
}

.community-stats article svg {
  color: #d97706;
}

.community-stats article strong {
  color: #111827 !important;
  font-size: clamp(30px, 3vw, 48px) !important;
  line-height: 1;
}

.community-page > .filter-bar {
  grid-template-columns: minmax(240px, 1fr) minmax(230px, 0.82fr) minmax(240px, 0.9fr) auto !important;
  gap: 16px !important;
  padding: 18px !important;
  border-radius: 30px !important;
}

.community-page label > span,
.community-page .filter-bar label > span {
  color: rgba(17, 24, 39, 0.66) !important;
  font-size: 13px;
  font-weight: 900;
}

.community-page input,
.community-page select,
.community-page textarea {
  border: 1px solid rgba(15, 23, 42, 0.1) !important;
  border-radius: 18px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--qa-ink) !important;
}

.community-page input:focus,
.community-page select:focus,
.community-page textarea:focus {
  border-color: rgba(234, 88, 12, 0.5) !important;
  box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.14) !important;
}

.forum-banner {
  position: relative;
  display: block;
  width: 100%;
  border-radius: 24px !important;
  overflow: hidden;
  background: transparent !important;
  box-shadow: 0 22px 50px rgba(185, 28, 28, 0.22) !important;
}

.forum-banner-glass {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  min-height: inherit;
  padding: clamp(22px, 3vw, 34px) clamp(22px, 3vw, 38px);
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 247, 237, 0.12)),
    radial-gradient(circle at 88% 0%, rgba(245, 158, 11, 0.26), transparent 42%),
    linear-gradient(120deg, rgba(143, 29, 29, 0.58) 0%, rgba(220, 91, 45, 0.42) 56%, rgba(246, 185, 79, 0.38) 100%);
  backdrop-filter: blur(24px) saturate(1.35);
  -webkit-backdrop-filter: blur(24px) saturate(1.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(255, 255, 255, 0.16);
}

.forum-banner-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.24), transparent 34%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 34px);
  opacity: 0.72;
  pointer-events: none;
}

.forum-identity {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.forum-emblem {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  flex: 0 0 auto;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-family: var(--display-cn, "Microsoft YaHei", sans-serif);
  font-size: 34px;
  font-weight: 1000;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.forum-emblem.small {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  font-size: 22px;
}

.forum-identity-text h2 {
  margin: 0 !important;
  color: #fff !important;
  font-family: var(--display-cn, "Microsoft YaHei", sans-serif);
  font-size: clamp(28px, 3.4vw, 44px) !important;
  line-height: 1.05 !important;
  letter-spacing: 0.06em !important;
  text-shadow: 0 2px 10px rgba(120, 20, 10, 0.4);
}

.forum-identity-text p {
  margin: 6px 0 12px !important;
  color: rgba(255, 255, 255, 0.88) !important;
  font-size: 14px;
}

.forum-stat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.forum-stat-chips span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 800;
}

.forum-stat-chips strong {
  color: #fff;
  font-size: 14px;
}

.forum-banner-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.forum-banner-actions .secondary-action {
  border-color: rgba(255, 255, 255, 0.55) !important;
  background: rgba(255, 255, 255, 0.16) !important;
  color: #fff !important;
}

.forum-banner-actions .primary-action {
  background: #fff !important;
  color: #b91c1c !important;
  box-shadow: 0 14px 30px rgba(120, 20, 10, 0.28) !important;
}

.community-workbench {
  display: grid !important;
  grid-template-columns: 240px minmax(0, 1fr) 280px;
  gap: 18px;
  align-items: start;
}

.community-workbench.detail-open {
  display: block !important;
}

.forum-mini-stats {
  grid-template-columns: 1fr 1fr;
  display: grid;
}

.forum-mini-stats article {
  display: grid;
  gap: 2px;
  justify-items: center;
  padding: 12px 6px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.8);
}

.forum-mini-stats strong {
  color: #b91c1c;
  font-size: 22px;
  line-height: 1;
}

.forum-mini-stats small {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12px;
}

.forum-feed-scroll {
  display: grid;
  gap: 0;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  margin: 0 -6px;
  padding: 0 6px;
  scrollbar-width: thin;
}

.forum-feed-scroll::-webkit-scrollbar {
  width: 8px;
}

.forum-feed-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(234, 88, 12, 0.28);
}

.forum-main {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px !important;
  border: 1px solid rgba(124, 45, 18, 0.09) !important;
  border-radius: 20px !important;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 250, 242, 0.72)),
    rgba(255, 255, 255, 0.86) !important;
  box-shadow: var(--qa-shadow) !important;
}

.forum-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(234, 88, 12, 0.16);
}

.forum-tabs {
  display: inline-flex;
  gap: 4px;
}

.forum-tab {
  position: relative;
  min-height: 38px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: rgba(17, 24, 39, 0.6);
  cursor: pointer;
  font-size: 15px;
  font-weight: 900;
}

.forum-tab.active {
  color: #b91c1c;
}

.forum-tab.active::after {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -14px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #dc2626, #f59e0b);
}

.forum-tab:hover {
  color: #b91c1c;
}

.forum-search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 14px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
}

.forum-search svg {
  color: rgba(17, 24, 39, 0.45);
}

.forum-search input {
  width: clamp(160px, 22vw, 240px);
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.forum-search input:focus {
  box-shadow: none !important;
}

.forum-search .primary-action {
  min-height: 34px !important;
}

.thread-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.thread-row {
  position: relative;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  padding: 18px 6px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.thread-row:hover,
.thread-row:focus-visible {
  background: rgba(255, 247, 237, 0.6);
  box-shadow: inset 4px 0 0 rgba(234, 88, 12, 0.66);
  outline: none;
}

.thread-row.saved {
  box-shadow: inset 3px 0 0 #0f766e;
}

.thread-count {
  display: grid;
  gap: 2px;
  justify-items: center;
  align-content: start;
  padding: 8px 4px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.8);
  color: rgba(17, 24, 39, 0.55);
}

.thread-row.answered .thread-count {
  border-color: rgba(15, 118, 110, 0.36);
  background: rgba(240, 253, 250, 0.9);
  color: #0f766e;
}

.thread-count strong {
  font-size: 20px;
  line-height: 1;
}

.thread-count small {
  font-size: 11px;
}

.thread-main {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.thread-title {
  display: inline;
  border: 0;
  padding: 0;
  background: transparent;
  color: #15233b;
  cursor: pointer;
  font-size: clamp(17px, 1.5vw, 20px);
  font-weight: 800;
  line-height: 1.4;
  text-align: left;
}

.thread-title:hover {
  color: #b91c1c;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.thread-flag {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  padding: 1px 8px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-size: 12px;
  font-weight: 900;
  vertical-align: middle;
}

.thread-excerpt {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: rgba(17, 24, 39, 0.6);
  font-size: 14px;
  line-height: 1.7;
}

.thread-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.thread-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 6px;
  background: rgba(239, 246, 255, 0.86);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
}

.thread-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: rgba(17, 24, 39, 0.5);
  font-size: 13px;
}

.thread-author {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.thread-author-name {
  color: rgba(17, 24, 39, 0.7);
  font-weight: 800;
}

.thread-dot {
  color: rgba(17, 24, 39, 0.3);
}

.thread-foot-spacer {
  flex: 1 1 auto;
}

.thread-metric {
  font-size: 12px;
}

.thread-time {
  font-size: 12px;
}

.thread-mini {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: rgba(17, 24, 39, 0.62);
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}

.thread-mini:hover {
  border-color: rgba(220, 38, 38, 0.3);
  color: #b91c1c;
}

.thread-mini.liked {
  border-color: rgba(220, 38, 38, 0.42);
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
}

.thread-mini.liked svg {
  fill: currentColor;
}

.thread-action.liked {
  border-color: rgba(220, 38, 38, 0.42);
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
}

.thread-action.liked svg {
  fill: currentColor;
}

.thread-mini.active {
  border-color: rgba(15, 118, 110, 0.3);
  background: rgba(240, 253, 250, 0.9);
  color: #0f766e;
}

.thread-thumb {
  width: 116px;
  height: 84px;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
}

.thread-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.forum-side {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 108px;
}

.forum-side .side-section {
  display: grid;
  gap: 12px;
  padding: 18px !important;
  border-radius: 18px !important;
}

.forum-info-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.forum-info-head strong {
  display: block;
  color: #111827;
  font-size: 17px;
}

.forum-info-head small {
  color: rgba(17, 24, 39, 0.56);
  font-size: 12px;
}

.forum-info-tip,
.forum-tip-card span {
  color: rgba(17, 24, 39, 0.58);
  font-size: 13px;
  line-height: 1.65;
}

.forum-info-tip {
  margin: 0;
}

.forum-nav-card {
  gap: 6px !important;
}

.forum-nav-card button {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 42px;
  padding: 0 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: rgba(17, 24, 39, 0.7);
  cursor: pointer;
  font-weight: 800;
  text-align: left;
}

.forum-nav-card button.active,
.forum-nav-card button:hover {
  background: rgba(234, 88, 12, 0.1);
  color: #b91c1c;
}

.forum-nav-card small {
  color: inherit;
  opacity: 0.72;
}

.forum-filter-card h3,
.forum-tip-card strong {
  margin: 0;
  color: #111827;
  font-size: 17px;
}

.forum-filter-card label {
  display: grid;
  gap: 7px;
}

.side-filter-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.forum-tip-card {
  text-align: left;
}

.forum-tip-card svg {
  color: #d97706;
}

.community-feed-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px !important;
}

.qa-avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 50%;
  overflow: hidden;
  color: #fff;
  font-size: 15px;
  font-weight: 1000;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
}

.qa-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.qa-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 13px;
}

.qa-author-text {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.qa-author-text strong {
  color: #1f2937;
  font-size: 14px;
}

.qa-author-text small {
  color: rgba(17, 24, 39, 0.5);
  font-size: 12px;
}

.qa-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.qa-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qa-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 8px;
  background: rgba(239, 246, 255, 0.86);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
}

.thread-action.ghost {
  border-color: rgba(15, 23, 42, 0.08) !important;
  background: transparent !important;
  color: rgba(17, 24, 39, 0.6) !important;
}

.community-meta-row {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.community-meta-row strong,
.community-meta-row small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.community-meta-row strong {
  color: #b45309 !important;
  font-size: 13px;
  font-weight: 1000;
}

.community-meta-row small {
  color: rgba(17, 24, 39, 0.52) !important;
  font-size: 12px;
}

.community-thread-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.community-thread-actions small,
.community-thread-actions span,
.detail-action-row > span,
.section-title-row span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(245, 158, 11, 0.26);
  border-radius: 999px;
  background: rgba(255, 247, 237, 0.74);
  color: #92400e !important;
  font-size: 12px;
  font-weight: 900;
}

.question-card-actions,
.detail-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.thread-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px !important;
  padding: 0 13px;
  cursor: pointer;
}

.thread-action.active {
  border-color: rgba(15, 118, 110, 0.24) !important;
  background: rgba(240, 253, 250, 0.86) !important;
  color: #0f766e !important;
}

.primary-thread-action {
  border-color: rgba(220, 38, 38, 0.24) !important;
  background: rgba(254, 242, 242, 0.86) !important;
  color: #b91c1c !important;
}

.feed-pagination {
  margin-top: 4px;
}

.community-detail-view {
  display: grid;
  gap: 18px;
  max-width: 1040px;
  margin: 0 auto;
}

.detail-hero-card {
  position: relative;
  display: grid;
  gap: 18px;
  padding: clamp(24px, 3vw, 38px) !important;
  border-radius: 34px !important;
  overflow: hidden;
}

.detail-hero-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 4% 0%, rgba(220, 38, 38, 0.12), transparent 28%),
    radial-gradient(circle at 86% 12%, rgba(37, 99, 235, 0.12), transparent 30%);
  pointer-events: none;
}

.detail-hero-card > * {
  position: relative;
  z-index: 1;
}

.back-to-feed {
  width: max-content;
}

.detail-title-row {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start !important;
  gap: 18px;
}

.detail-title-row h3 {
  max-width: 850px;
  color: #111827 !important;
  font-family: var(--body-cn, "Microsoft YaHei", sans-serif) !important;
  font-size: clamp(30px, 3vw, 46px) !important;
  line-height: 1.16;
  letter-spacing: 0 !important;
}

.detail-hero-card > p {
  max-width: 920px;
  margin: 0;
  color: rgba(17, 24, 39, 0.72) !important;
  font-size: 17px;
  line-height: 1.85;
}

.detail-question-image {
  width: min(100%, 920px);
  max-height: 420px;
  object-fit: cover;
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 28px;
  box-shadow: 0 18px 44px rgba(91, 55, 22, 0.12);
}

.detail-author-line {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-answer-count {
  margin-left: auto;
}

.community-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(310px, 0.38fr);
  gap: 22px;
  align-items: start;
}

.community-main-thread,
.community-detail-aside {
  display: grid;
  gap: 18px;
}

.community-detail-view .side-section {
  border-radius: 30px !important;
  padding: 24px !important;
}

.community-detail-view .side-section h3,
.section-title-row h3 {
  margin: 0;
  color: #111827 !important;
  font-size: clamp(22px, 2vw, 30px) !important;
  line-height: 1.14;
}

.answer-composer textarea,
.community-detail-aside textarea {
  min-height: 118px;
  resize: vertical;
}

.answer-composer .primary-action,
.community-detail-aside .secondary-action {
  width: 100%;
  margin-top: 12px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.answer-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.community-answer-list {
  display: grid;
  gap: 16px;
}

.community-answer-list article,
.community-inheritor-list article,
.chain-empty {
  border: 1px solid rgba(15, 23, 42, 0.09) !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.72) !important;
  box-shadow: 0 14px 34px rgba(91, 55, 22, 0.08) !important;
}

.community-answer-list article {
  padding: 20px !important;
}

.answer-head .qa-author-text strong {
  color: #111827 !important;
  font-size: 15px;
}

.answer-head .qa-author-text small,
.community-inheritor-list small {
  color: rgba(17, 24, 39, 0.54) !important;
}

.community-answer-list p {
  margin: 14px 0;
  color: rgba(17, 24, 39, 0.78) !important;
  font-size: 15px;
  line-height: 1.8;
}

.community-comment-list {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
}

.community-comment-list span {
  display: block !important;
  padding: 9px 12px !important;
  border-left: 2px solid rgba(220, 38, 38, 0.4) !important;
  border-radius: 0 12px 12px 0 !important;
  background: rgba(248, 250, 252, 0.86) !important;
  color: rgba(17, 24, 39, 0.7) !important;
  font-size: 13px;
  line-height: 1.6;
}

.community-comment-list span em {
  margin-right: 6px;
  color: #b45309;
  font-style: normal;
  font-weight: 900;
}

.aside-empty {
  margin: 0;
  color: rgba(17, 24, 39, 0.5);
  font-size: 13px;
  line-height: 1.6;
}

.community-inline-form {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 46px !important;
  gap: 10px;
  margin-top: 12px;
}

.community-inline-form button {
  min-width: 46px;
  padding: 0 !important;
}

.community-inheritor-list {
  display: grid;
  gap: 12px;
}

.community-inheritor-list article {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px !important;
}

.community-inheritor-list .qa-author-text strong {
  color: #111827 !important;
  font-size: 15px;
}

.chain-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px !important;
  color: rgba(17, 24, 39, 0.58) !important;
}

.inline-error,
.inline-success {
  border-radius: 18px !important;
  padding: 12px 16px !important;
}

.node-modal {
  border-radius: 30px !important;
}

.image-upload-field input[type="file"] {
  padding: 10px 12px;
  cursor: pointer;
}

.image-upload-field small {
  color: rgba(17, 24, 39, 0.56);
  line-height: 1.55;
}

.question-image-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
}

.question-image-preview img {
  grid-row: span 2;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 18px;
}

.question-image-preview span {
  color: rgba(17, 24, 39, 0.58);
  font-size: 12px;
}

.tieba-bar-head {
  min-height: 174px;
}

.tieba-bar-head .forum-banner-glass {
  align-items: end;
  padding-left: clamp(150px, 16vw, 220px);
}

.tieba-cover {
  position: absolute;
  left: clamp(24px, 3vw, 38px);
  bottom: 24px;
  display: grid;
  place-items: center;
  width: clamp(92px, 10vw, 132px);
  aspect-ratio: 1;
  border: 5px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #b91c1c, #f97316 62%, #fbbf24);
  color: #fff;
  font-family: var(--display-cn, "Microsoft YaHei", sans-serif);
  font-size: clamp(24px, 3vw, 42px);
  font-weight: 1000;
  box-shadow: 0 24px 46px rgba(87, 34, 15, 0.26);
}

.bar-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.bar-like-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 13px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #b91c1c;
  font-size: 13px;
  font-weight: 1000;
  box-shadow: 0 10px 20px rgba(120, 20, 10, 0.18);
}

.tieba-stat-chips span {
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.14);
}

.tieba-level-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(234, 88, 12, 0.14);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.92), rgba(254, 242, 242, 0.72));
}

.tieba-level-card span,
.tieba-level-card em {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12px;
  font-style: normal;
}

.tieba-level-card strong {
  grid-row: span 2;
  color: #b91c1c;
  font-size: 24px;
  line-height: 1;
}

.thread-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.thread-flag.hot {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.hot-thread-card h3,
.node-cloud-card h3,
.tieba-side-comments h3,
.tieba-lz-card h3 {
  margin: 0;
  color: #111827;
  font-size: 17px;
}

.hot-thread-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hot-thread-list button {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 6px 8px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.hot-thread-list button:hover {
  background: rgba(255, 247, 237, 0.9);
}

.hot-thread-list em {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
  font-style: normal;
  font-size: 12px;
  font-weight: 1000;
}

.hot-thread-list span {
  overflow: hidden;
  color: rgba(17, 24, 39, 0.78);
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-thread-list small {
  grid-column: 2;
  color: rgba(17, 24, 39, 0.45);
  font-size: 11px;
}

.node-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.node-cloud button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 999px;
  background: rgba(239, 246, 255, 0.8);
  color: #1d4ed8;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
}

.node-cloud small {
  color: inherit;
  opacity: 0.65;
}

.tieba-list-layout {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;
}

.tieba-main-panel {
  padding: 0 !important;
  overflow: hidden;
  border-radius: 18px !important;
  background: rgba(255, 255, 255, 0.92) !important;
}

.tieba-thread-toolbar {
  padding: 0 16px;
  min-height: 74px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 242, 0.76));
}

.tieba-thread-toolbar .forum-tab {
  min-height: 72px;
  font-size: 16px;
}

.tieba-thread-toolbar .forum-tab.active::after {
  bottom: 0;
}

.tieba-thread-countbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  background: rgba(255, 255, 255, 0.66);
}

.tieba-thread-countbar strong {
  color: #111827;
  font-size: 15px;
}

.tieba-thread-countbar span {
  color: rgba(17, 24, 39, 0.5);
  font-size: 13px;
}

.tieba-thread-feed {
  max-height: none;
  margin: 0;
  padding: 0;
  overflow: visible;
}

.tieba-thread-list {
  background: rgba(255, 255, 255, 0.72);
}

.tieba-thread-row {
  grid-template-columns: 74px minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.tieba-thread-row:hover {
  background: #fff7ed;
}

.tieba-reply-count {
  min-height: 54px;
  align-content: center;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fafc, #ffffff);
}

.tieba-sidebar {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 108px;
}

.tieba-sidebar .side-section {
  display: grid;
  gap: 12px;
  padding: 18px !important;
  border: 1px solid rgba(124, 45, 18, 0.09) !important;
  border-radius: 18px !important;
  background: rgba(255, 255, 255, 0.9) !important;
  box-shadow: var(--qa-shadow) !important;
}

.tieba-side-stats {
  grid-template-columns: 1fr 1fr;
}

.tieba-side-stats article {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.84);
}

.tieba-filter-card h3 {
  margin: 0;
  color: #111827;
  font-size: 17px;
}

.tieba-detail-view {
  max-width: 1280px;
  width: min(1280px, 100%);
}

.tieba-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}

.tieba-floor-main,
.tieba-floor-list,
.tieba-detail-sidebar {
  display: grid;
  gap: 14px;
}

.tieba-detail-sidebar {
  position: sticky;
  top: 108px;
}

.tieba-post-card,
.tieba-reply-header {
  border: 1px solid rgba(124, 45, 18, 0.09);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--qa-shadow);
  overflow: hidden;
}

.tieba-floor {
  display: grid;
  grid-template-columns: 164px minmax(0, 1fr);
  min-height: 172px;
}

.floor-author-card {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 7px;
  padding: 24px 16px;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.9), rgba(255, 255, 255, 0.72));
  text-align: center;
}

.floor-avatar {
  width: 58px;
  height: 58px;
  font-size: 22px;
}

.floor-author-card strong {
  max-width: 118px;
  overflow: hidden;
  color: #111827;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floor-author-card small,
.floor-author-card em {
  color: rgba(17, 24, 39, 0.52);
  font-size: 12px;
  font-style: normal;
}

.floor-author-card em {
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-weight: 900;
}

.floor-content {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 24px;
}

.floor-content > p {
  margin: 0;
  color: rgba(17, 24, 39, 0.78);
  font-size: 16px;
  line-height: 1.9;
  white-space: pre-line;
}

.floor-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  color: rgba(17, 24, 39, 0.45);
  font-size: 12px;
}

.tieba-reply-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 16px;
}

.tieba-reply-header h3,
.tieba-reply-editor h3 {
  margin: 0;
  color: #111827;
  font-size: 18px;
}

.tieba-reply-header span {
  color: rgba(17, 24, 39, 0.5);
  font-size: 13px;
}

.tieba-empty-floor {
  border-radius: 18px !important;
}

.floor-comment-list {
  padding: 10px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
}

.tieba-reply-editor {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.tieba-reply-editor label,
.tieba-side-comments label {
  display: grid;
  gap: 7px;
}

.tieba-reply-editor textarea {
  min-height: 150px;
  resize: vertical;
}

.tieba-reply-editor .primary-action {
  width: max-content;
}

.tieba-side-comments,
.tieba-lz-card {
  border-radius: 18px !important;
}

.tieba-side-comments textarea {
  min-height: 92px;
}

.tieba-side-comments .secondary-action {
  width: 100%;
  margin-top: 4px;
}

@media (max-width: 1120px) {
  .community-workbench,
  .community-detail-grid,
  .tieba-detail-layout,
  .tieba-list-layout {
    grid-template-columns: 1fr !important;
  }

  .forum-side,
  .tieba-detail-sidebar,
  .tieba-sidebar {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .forum-side-left {
    order: -1;
  }

  .forum-feed-scroll {
    max-height: none;
    overflow: visible;
  }

  .detail-title-row {
    grid-template-columns: 1fr;
  }

  .tieba-bar-head {
    padding-left: 0 !important;
  }

  .tieba-bar-head .forum-banner-glass {
    padding-left: clamp(22px, 3vw, 38px);
    padding-top: 150px;
  }

  .tieba-cover {
    top: 24px;
    bottom: auto;
  }
}

@media (max-width: 720px) {
  .community-page .page-heading,
  .community-feed-panel,
  .detail-hero-card,
  .community-detail-view .side-section {
    border-radius: 24px !important;
  }

  .community-page .page-heading h2 {
    font-size: clamp(34px, 11vw, 48px) !important;
  }

  .community-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .question-card-main {
    grid-template-columns: 1fr;
  }

  .question-card-main .community-meta-row,
  .question-card-main h3,
  .question-card-main p,
  .question-card-image {
    grid-column: 1;
  }

  .question-card-image {
    grid-row: auto;
  }

  .filter-actions,
  .question-card-actions,
  .detail-action-row {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .thread-action {
    width: 100%;
  }

  .tieba-floor {
    grid-template-columns: 1fr;
  }

  .floor-author-card {
    grid-template-columns: auto minmax(0, 1fr);
    justify-items: start;
    align-items: center;
    text-align: left;
    border-right: 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  .floor-avatar {
    grid-row: span 3;
  }

  .tieba-detail-sidebar,
  .tieba-sidebar,
  .forum-side {
    grid-template-columns: 1fr;
  }

  .tieba-thread-countbar {
    grid-template-columns: 1fr;
  }

  .tieba-thread-row,
  .thread-row {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .thread-thumb {
    grid-column: 2;
  }
}
</style>
