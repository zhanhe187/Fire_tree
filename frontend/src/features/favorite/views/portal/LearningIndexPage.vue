<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BookOpen, CalendarCheck, Flame, Loader2, RefreshCcw, Route, Search, Sparkles, Star, Trophy } from 'lucide-vue-next';
import LearningCard from '../../components/LearningCard.vue';
import { FavoriteGraphResponse, FavoriteNodeItem, fetchFavoriteGraph, fetchFavoriteNodes } from '../../services/favorite';
import { relationCountsFromGraph } from '../../services/learningCovers';
import { listLocalLearningRecords, learningScopeForUser, loadLocalLearningRecord, learningCardStatus, parseLearningNote } from '../../services/learningCard';
import { fetchGraphNode } from '../../../graph/services/graph';
import type { LearningCard as LearningCardModel, ParsedLearningNote } from '../../services/learningCard';
import { LearningCheckinResponse, LearningHotItem, fetchLearningCheckins, fetchLearningHot } from '../../../learning/services/learning';
import { authSession, currentUser } from '../../../auth/services/authState';

const router = useRouter();
type LearningListItem = FavoriteNodeItem & { privateNote: string; learningCard: LearningCardModel | null; noteSource: ParsedLearningNote['source']; storageMode: 'synced' | 'local' };
const favorites = ref<FavoriteNodeItem[]>([]);
const graph = ref<FavoriteGraphResponse | null>(null);
const checkins = ref<LearningCheckinResponse | null>(null);
const hotItems = ref<LearningHotItem[]>([]);
const loading = ref(false);
const reloadRequested = ref(false);
const error = ref('');
const localOnlyFallback = ref(false);
const filters = reactive({ keyword: '', page: 1, size: 12, total: 0 });
const today = new Date();
const todayText = today.toISOString().slice(0, 10);
const currentMonth = todayText.slice(0, 7);
const activeUserId = computed(() => currentUser.value?.id ?? 0);
const isSignedIn = computed(() => Boolean(authSession.token && activeUserId.value));
const localScope = computed(() => learningScopeForUser(activeUserId.value));
const storageMode = computed<'synced' | 'local'>(() => isSignedIn.value && !localOnlyFallback.value ? 'synced' : 'local');
function errorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as { status?: unknown; response?: { status?: unknown } };
  const status = candidate.status ?? candidate.response?.status;
  return typeof status === 'number' ? status : undefined;
}
function isTransportOrUnavailableError(err: unknown): boolean {
  const status = errorStatus(err);
  if (status === 401 || status === 403) return false;
  if (status !== undefined) return status === 0 || status >= 500;
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return err instanceof TypeError || /failed to fetch|network|offline|unavailable|timeout|timed out/.test(message);
}
const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const relationCounts = computed(() => relationCountsFromGraph(graph.value));
const checkedToday = computed(() => (checkins.value?.items ?? []).some((item) => item.checkinDate === todayText));
const weekProgress = computed(() => {
  const base = new Date(`${todayText}T00:00:00Z`);
  const offset = (base.getUTCDay() + 6) % 7;
  const checked = new Set((checkins.value?.items ?? []).map((item) => item.checkinDate));
  let done = 0;
  for (let index = 0; index < 7; index += 1) { const day = new Date(base); day.setUTCDate(base.getUTCDate() - offset + index); if (checked.has(day.toISOString().slice(0, 10))) done += 1; }
  return { done, target: 7 };
});
const weekPercent = computed(() => Math.round((weekProgress.value.done / weekProgress.value.target) * 100));
const learningItems = computed<LearningListItem[]>(() => favorites.value.map((item) => { const parsed = isSignedIn.value && !localOnlyFallback.value ? parseLearningNote(item.note, item.nodeId) : loadLocalLearningRecord(localScope.value, item.nodeId); return { ...item, privateNote: parsed.privateNote, learningCard: parsed.card, noteSource: parsed.source, storageMode: storageMode.value }; }));
const cardCount = computed(() => learningItems.value.filter((item) => item.learningCard !== null).length);
const reviewCount = computed(() => learningItems.value.filter((item) => ['todo', 'review'].includes(learningCardStatus(item.learningCard))).length);
const todoCount = computed(() => learningItems.value.filter((item) => { const card = item.learningCard; return !card || !card.coreUnderstanding.trim() || !card.selfTestQuestion.trim(); }).length);
const hasFavoritesWithoutCards = computed(() => favorites.value.length > 0 && cardCount.value === 0);

async function loadLocalCards() {
  const scope = learningScopeForUser(activeUserId.value);
  const records = listLocalLearningRecords(scope);
  const localItems = await Promise.all(records.map(async (record) => {
    const nodeResult = await Promise.allSettled([fetchGraphNode(record.nodeId)]);
    const node = nodeResult[0].status === 'fulfilled' ? nodeResult[0].value : null;
    return {
      id: `local-${record.nodeId}`, nodeId: record.nodeId,
      nodeName: node?.name ?? `节点 ${record.nodeId}`, nodeCode: node?.nodeCode ?? String(record.nodeId),
      nodeTypeName: node?.nodeTypeName ?? '非遗节点', nodeTypeColor: node?.nodeTypeColor ?? '#d7a84f',
      province: node?.province ?? '', city: node?.city ?? '', summary: node?.summary ?? '',
      note: JSON.stringify({ version: 1, privateNote: record.privateNote, card: record.card }),
      createdAt: record.card?.createdAt ?? new Date().toISOString(), updatedAt: record.card?.updatedAt ?? new Date().toISOString(),
    } as unknown as FavoriteNodeItem;
  }));
  const keyword = filters.keyword.trim().toLowerCase();
  const filtered = keyword ? localItems.filter((item) => [item.nodeName, item.nodeCode, item.note].some((value) => String(value ?? '').toLowerCase().includes(keyword))) : localItems;
  filters.total = filtered.length;
  const start = (filters.page - 1) * filters.size;
  favorites.value = filtered.slice(start, start + filters.size);
  const lastPage = Math.max(1, Math.ceil(filtered.length / filters.size));
  if (filters.page > lastPage) { filters.page = lastPage; await loadLocalCards(); }
}
async function loadCards() {
  localOnlyFallback.value = false;
  if (!activeUserId.value) return loadLocalCards();
  try {
    const response = await fetchFavoriteNodes({ userId: activeUserId.value, keyword: filters.keyword || undefined, page: filters.page, size: filters.size });
    favorites.value = response.items; filters.total = response.total;
    const lastPage = Math.max(1, Math.ceil(response.total / filters.size));
    if (filters.page > lastPage) { filters.page = lastPage; await loadCards(); }
  } catch (err) {
    if (!isTransportOrUnavailableError(err)) throw err;
    localOnlyFallback.value = true;
    await loadLocalCards();
  }
}
async function loadSummary() {
  const userId = activeUserId.value; if (!userId) return;
  const [graphResult, checkinResult, hotResult] = await Promise.allSettled([fetchFavoriteGraph(userId), fetchLearningCheckins({ userId, month: currentMonth }), fetchLearningHot(4)]);
  graph.value = graphResult.status === 'fulfilled' ? graphResult.value : null;
  checkins.value = checkinResult.status === 'fulfilled' ? checkinResult.value : null;
  hotItems.value = hotResult.status === 'fulfilled' ? hotResult.value.items.slice(0, 4) : [];
}
async function loadAll() {
  if (loading.value) {
    reloadRequested.value = true;
    return;
  }
  loading.value = true;
  reloadRequested.value = false;
  error.value = '';
  try {
    await Promise.all([loadCards(), loadSummary()]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '学习清单加载失败';
    favorites.value = [];
  } finally {
    loading.value = false;
    if (reloadRequested.value) {
      reloadRequested.value = false;
      void loadAll();
    }
  }
}
function search() { filters.page = 1; void loadCards(); }
function changePage(delta: number) { filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta)); void loadCards(); }
function toStudy(nodeId: number) { void router.push(`/favorites/study/${nodeId}`); }
watch(activeUserId, () => { void loadAll(); }, { immediate: true });
</script>

<template>
  <section class="learning-index-page">
    <header class="learning-index-head"><div><p class="eyebrow">学习驾驶舱</p><h2>把收藏变成自己的学习路径</h2><span>继续学习收藏节点，复习已经建立的理解，并把新发现连接起来。</span></div><div class="heading-actions"><span class="learn-sync-badge" :class="`is-${storageMode}`"><span aria-hidden="true"></span>{{ storageMode === 'synced' ? '已同步' : '仅本机保存' }}</span><button class="secondary-action" type="button" :disabled="loading" @click="loadAll"><Loader2 v-if="loading" :size="16" class="spin" /><RefreshCcw v-else :size="16" />刷新</button></div></header>
    <div v-if="error" class="inline-error compact-message">{{ error }}</div>
    <div class="learn-metrics" aria-label="学习仪表">
      <article class="learn-metric-state" :class="checkedToday ? 'is-done' : 'is-todo'"><CalendarCheck :size="16" /><span>今日学习</span><strong class="learn-metric-text">{{ checkedToday ? '今日已完成' : isSignedIn ? '今日待打卡' : '未开始' }}</strong></article><article><Flame :size="16" /><span>连续天数</span><strong>{{ checkins?.currentStreak ?? 0 }}<em>天</em></strong></article><article><span class="learn-ring" :style="{ '--learn-ring-value': `${weekPercent}%` }" role="img" :aria-label="`本周进度 ${weekProgress.done} / 7`"><BookOpen :size="15" /></span><span>本周进度</span><strong>{{ weekProgress.done }}<em>/7</em></strong></article><article><Star :size="16" /><span>在学节点</span><strong>{{ filters.total }}</strong></article><article class="learn-dashboard-metric"><BookOpen :size="16" /><span>学习卡片</span><strong>{{ cardCount }}<em>/{{ filters.total }}</em></strong></article><article class="learn-dashboard-metric"><Route :size="16" /><span>待复习</span><strong>{{ reviewCount }}</strong></article><article class="learn-dashboard-metric"><Sparkles :size="16" /><span>待整理</span><strong>{{ todoCount }}</strong></article>
    </div>
    <div class="filter-bar compact-filter learning-index-filter"><label><span>搜索收藏</span><input v-model="filters.keyword" type="search" placeholder="名称 / 编码 / 笔记" @keyup.enter="search" /></label><div class="filter-actions"><button class="primary-action compact" type="button" @click="search"><Search :size="15" />搜索</button></div></div>
    <div v-if="loading" class="state-panel compact-state"><Loader2 :size="22" class="spin" /><span>正在加载学习清单</span></div>
    <div v-else-if="favorites.length === 0" class="learn-empty-card"><span class="learn-empty-art" aria-hidden="true"><BookOpen :size="30" /></span><strong>还没有收藏节点</strong><span>从图谱里挑一个非遗节点收藏，它就会出现在这里，成为今天的学习对象。</span><button class="primary-action compact learn-cta" type="button" @click="router.push('/graph/board')"><Route :size="15" />去图谱挑选第一个节点</button></div>
    <template v-else><div v-if="hasFavoritesWithoutCards" class="learn-dashboard-callout"><strong>收藏已就绪，学习卡片还在等你建立</strong><span>先从一张卡片开始，写下核心理解和一个自测问题，之后就能在这里追踪复习状态。</span><button class="secondary-action compact" type="button" @click="toStudy(favorites[0].nodeId)">建立第一张卡片</button></div><div class="learning-card-grid"><LearningCard v-for="item in learningItems" :key="item.id" :item="item" :learning-card="item.learningCard" :storage-mode="item.storageMode" :relation-count="relationCounts.get(item.nodeId) ?? 0" @open="toStudy($event.nodeId)" /></div></template>
    <footer v-if="favorites.length" class="pagination compact-pagination learning-pagination" aria-label="学习清单分页"><button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button><span>第 {{ filters.page }} / {{ pageCount }} 页</span><button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button></footer>
    <section v-if="hotItems.length" class="hot-heritage-card space-hot-card learning-index-hot"><h3>热门节点</h3><div class="learning-hot-list consumer-hot-list"><article v-for="(item, index) in hotItems" :key="item.id"><span><Trophy v-if="index <= 2" :size="16" /><small v-else>{{ index + 1 }}</small></span><div><strong>{{ item.nodeName }}</strong><small>{{ item.nodeTypeName }} / 热度 {{ item.hotScore }}</small></div></article></div></section>
    <p v-if="!isSignedIn" class="learn-task-hint"><Sparkles :size="13" /> 登录后收藏和学习卡片将跨设备同步；当前学习记录仅保存在本机。</p>
  </section>
</template>
