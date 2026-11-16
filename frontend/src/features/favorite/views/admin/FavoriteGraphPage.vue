<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  BookOpen,
  Loader2,
  NotebookPen,
  Plus,
  RefreshCcw,
  Route,
  Search,
  Star,
  Trash2,
} from 'lucide-vue-next';
import { FavoriteGraphNode, FavoriteGraphResponse, FavoriteNodeItem, createFavoriteNode, deleteFavoriteNode, deleteFavoriteNodeByUsername, fetchFavoriteGraph, fetchFavoriteNodes, updateFavoriteNote } from '../../services/favorite';
import { GraphNodeItem, GraphVisualizationEdge, fetchGraphNodes } from '../../../graph/services/graph';
import {
  createEmptyLearningCard,
  learningCardStatus,
  parseLearningNote,
  serializeLearningNote,
} from '../../services/learningCard';
import type { LearningCard } from '../../services/learningCard';
import { AdminUserItem, fetchAdminUsers } from '../../../admin/services/admin';

const props = defineProps<{
  currentUserId?: number | null;
}>();

const router = useRouter();
const composerOpen = ref(false);

const favorites = ref<FavoriteNodeItem[]>([]);
const archiveSummary = ref<{ items: FavoriteNodeItem[]; total: number }>({ items: [], total: 0 });
const graph = ref<FavoriteGraphResponse | null>(null);
const nodeOptions = ref<GraphNodeItem[]>([]);
const selectedFavorite = ref<FavoriteNodeItem | null>(null);
const selectedGraphNode = ref<FavoriteGraphNode | null>(null);
const loading = ref(false);
const saving = ref(false);
const graphLoading = ref(false);
const error = ref('');
const successMessage = ref('');
const nodeSearchKeyword = ref('');

const filters = reactive({
  userId: props.currentUserId ?? ('' as number | ''),
  username: '',
  keyword: '',
  page: 1,
  size: 3,
  total: 0,
});

const favoriteForm = reactive({
  nodeId: '' as number | '',
  note: '',
});

const noteForm = reactive({
  note: '',
});
const learningCard = ref<LearningCard | null>(null);
const cardEditorOpen = ref(true);
const selectedNoteSource = ref<'structured' | 'legacy' | 'empty' | 'invalid'>('empty');
const customKeyword = ref('');
const revealedCardNodeId = ref<number | null>(null);
const requestGeneration = ref(0);

type LearnerIdentity = { userId?: number; username?: string };

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const activeUserId = computed(() => Number(filters.userId) || 0);
const activeUsername = computed(() => filters.username.trim());
const activeIdentity = computed<LearnerIdentity>(() => activeUsername.value
  ? { username: activeUsername.value }
  : activeUserId.value
    ? { userId: activeUserId.value }
    : {});
const graphNodes = computed(() => graph.value?.nodes ?? []);
const graphEdges = computed(() => graph.value?.edges ?? []);
// 去重要用「该用户全部收藏」而不是当前分页的 3 条，否则跨页的已收藏节点仍会出现在候选里
const favoriteNodeIds = computed(() => {
  const ids = new Set(favorites.value.map((item) => item.nodeId));
  for (const item of archiveSummary.value.items) {
    ids.add(item.nodeId);
  }
  return ids;
});
// 私有节点收藏会被后端拒绝（nodeId is invalid），这里提前过滤掉
const visibleOptions = computed(() => nodeOptions.value.filter((node) => (
  !favoriteNodeIds.value.has(node.id) && node.visibility === 'PUBLIC'
)));

const positionedNodes = computed(() => {
  const total = graphNodes.value.length;
  return graphNodes.value.map((node, index) => {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
    const favorited = Boolean(node.favorited);
    const radiusX = favorited ? 190 : 250;
    const radiusY = favorited ? 94 : 138;
    return {
      ...node,
      x: 410 + Math.cos(angle) * radiusX,
      y: 220 + Math.sin(angle) * radiusY,
      favorited,
    };
  });
});

const positionById = computed(() => new Map(positionedNodes.value.map((node) => [node.id, node])));
const displayedEdges = computed(() => graphEdges.value.filter((edge) => positionById.value.has(edge.sourceNodeId) && positionById.value.has(edge.targetNodeId)));

/* ---- 学习档案展示层：只读派生，不新增请求、不改数据流 ---- */
const archiveOwnerLabel = computed(() => {
  if (activeUsername.value) return activeUsername.value;
  if (activeUserId.value) return '当前登录用户';
  return '未指定';
});

const parsedFavorite = (item: FavoriteNodeItem) => parseLearningNote(item.note, item.nodeId);
const cardCount = computed(() => archiveSummary.value.items.filter((item) => parsedFavorite(item).card !== null).length);
const reviewCount = computed(() => archiveSummary.value.items.filter((item) => ['review', 'todo'].includes(learningCardStatus(parsedFavorite(item).card))).length);
const todoCount = computed(() => archiveSummary.value.items.filter((item) => {
  const card = parsedFavorite(item).card;
  return !card || !card.coreUnderstanding.trim() || !card.selfTestQuestion.trim();
}).length);
const notedFavoriteCount = computed(() => archiveSummary.value.items.filter((item) => parsedFavorite(item).privateNote.trim()).length);

function archiveStatus(item: FavoriteNodeItem) {
  const status = learningCardStatus(parsedFavorite(item).card);
  if (status === 'mastered') return '已掌握';
  if (status === 'review') return '待复习';
  return parsedFavorite(item).card ? '待整理' : '待建立';
}

function archiveTouchedAt(item: FavoriteNodeItem) {
  const raw = item.updatedAt || item.createdAt;
  if (!raw) return '暂无记录';
  return `最近整理 ${String(raw).slice(0, 10)}`;
}

function openNodeDetail(node: FavoriteGraphNode | null) {
  if (!node) return;
  void router.push(`/admin/graph/nodes/${node.id}`);
}

function isCurrent(generation: number) {
  if (generation !== requestGeneration.value) return false;
  return true;
}

async function loadFavorites(generation = requestGeneration.value) {
  const identity = activeIdentity.value;
  if (!identity.userId && !identity.username) {
    if (isCurrent(generation)) {
      favorites.value = [];
      filters.total = 0;
      selectFavorite(null);
    }
    return;
  }
  const response = await fetchFavoriteNodes({ ...identity, keyword: filters.keyword, page: filters.page, size: filters.size });
  if (!isCurrent(generation)) return;
  favorites.value = response.items;
  filters.total = response.total;
  if (!favorites.value.some((item) => item.nodeId === selectedFavorite.value?.nodeId)) {
    selectFavorite(favorites.value[0] ?? null);
  }
}

async function loadArchiveSummary(generation = requestGeneration.value) {
  const identity = activeIdentity.value;
  if (!identity.userId && !identity.username) {
    if (isCurrent(generation)) archiveSummary.value = { items: [], total: 0 };
    return;
  }
  const firstPage = await fetchFavoriteNodes({ ...identity, page: 1, size: 100 });
  const items = [...firstPage.items];
  const totalPages = Math.ceil(firstPage.total / 100);
  if (totalPages > 1) {
    const remaining = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => fetchFavoriteNodes({
      ...identity,
      page: index + 2,
      size: 100,
    })));
    if (!isCurrent(generation)) return;
    remaining.forEach((response) => items.push(...response.items));
  }
  if (isCurrent(generation)) archiveSummary.value = { items, total: firstPage.total };
}

async function loadGraph(generation = requestGeneration.value) {
  const identity = activeIdentity.value;
  if (!identity.userId && !identity.username) {
    if (isCurrent(generation)) {
      graph.value = { nodeCount: 0, edgeCount: 0, nodes: [], edges: [] };
      selectedGraphNode.value = null;
    }
    return;
  }
  graphLoading.value = true;
  try {
    const graphIdentity = identity.username ?? identity.userId!;
    const response = await fetchFavoriteGraph(graphIdentity);
    if (!isCurrent(generation)) return;
    graph.value = response;
    if (!graphNodes.value.some((node) => node.id === selectedGraphNode.value?.id)) {
      selectedGraphNode.value = graphNodes.value[0] ?? null;
    }
  } finally {
    if (isCurrent(generation)) graphLoading.value = false;
  }
}

async function loadAll() {
  const generation = ++requestGeneration.value;
  revealedCardNodeId.value = null;
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  const failures: string[] = [];
  await Promise.all([
    loadFavorites(generation).catch((err) => failures.push(err instanceof Error ? err.message : '收藏列表加载失败')),
    loadArchiveSummary(generation).catch((err) => failures.push(err instanceof Error ? err.message : '学习档案汇总加载失败')),
    loadGraph(generation).catch((err) => failures.push(err instanceof Error ? err.message : '个人子图加载失败')),
    loadNodeOptions(generation).catch((err) => failures.push(err instanceof Error ? err.message : '节点选项加载失败')),
  ]);
  if (!isCurrent(generation)) return;
  if (failures.length > 0) {
    error.value = `请确认用户名有效：${failures[0]}`;
    favorites.value = [];
    archiveSummary.value = { items: [], total: 0 };
    graph.value ??= { nodeCount: 0, edgeCount: 0, nodes: [], edges: [] };
  }
  loading.value = false;
}

async function searchNodes() {
  const generation = requestGeneration.value;
  if (!isCurrent(generation)) return;
  requestGeneration.value += 1;
  const nextGeneration = generation + 1;
  const response = await fetchGraphNodes({ keyword: nodeSearchKeyword.value, auditStatus: 'APPROVED', page: 1, size: 500 });
  if (!isCurrent(nextGeneration)) return;
  nodeOptions.value = response.items;
  if (!favoriteForm.nodeId && visibleOptions.value[0]) favoriteForm.nodeId = visibleOptions.value[0].id;
}

async function loadNodeOptions(generation = requestGeneration.value) {
  const response = await fetchGraphNodes({
    keyword: nodeSearchKeyword.value,
    auditStatus: 'APPROVED',
    page: 1,
    size: 500,
  });
  if (!isCurrent(generation)) return;
  nodeOptions.value = response.items;
  if (!favoriteForm.nodeId && visibleOptions.value[0]) {
    favoriteForm.nodeId = visibleOptions.value[0].id;
  }
}

function resetLearnerContext() {
  requestGeneration.value += 1;
  loading.value = false;
  graphLoading.value = false;
  saving.value = false;
  favorites.value = [];
  archiveSummary.value = { items: [], total: 0 };
  graph.value = { nodeCount: 0, edgeCount: 0, nodes: [], edges: [] };
  filters.total = 0;
  selectedFavorite.value = null;
  selectedGraphNode.value = null;
  noteForm.note = '';
  learningCard.value = null;
  favoriteForm.nodeId = '';
  favoriteForm.note = '';
  customKeyword.value = '';
  revealedCardNodeId.value = null;
}

function setUsername(value: string) {
  const username = value.trim();
  const changed = filters.username.trim() !== username || (Boolean(username) && Boolean(filters.userId));
  if (username) filters.userId = '';
  filters.username = value;
  if (changed) resetLearnerContext();
}

// 用户名只认 sys_users.username（拼音），手输昵称会 400，改成下拉选择
const accountOptions = ref<AdminUserItem[]>([]);

async function loadAccountOptions() {
  try {
    const response = await fetchAdminUsers({ status: 1, page: 1, size: 200 });
    accountOptions.value = response.items.filter((item) => item.status === 1);
  } catch {
    accountOptions.value = [];
  }
}

function setUserId(value: number | '') {
  const changed = filters.userId !== value || (Boolean(value) && Boolean(filters.username.trim()));
  if (value) filters.username = '';
  filters.userId = value;
  if (changed) resetLearnerContext();
}

function selectFavorite(item: FavoriteNodeItem | null) {
  revealedCardNodeId.value = null;
  customKeyword.value = '';
  selectedFavorite.value = item;
  const parsed = item ? parseLearningNote(item.note, item.nodeId) : { privateNote: '', card: null, source: 'empty' as const };
  noteForm.note = parsed.privateNote;
  selectedNoteSource.value = parsed.source;
  learningCard.value = parsed.card ? { ...parsed.card, relatedNodeIds: [...parsed.card.relatedNodeIds], relatedKeywords: [...parsed.card.relatedKeywords] } : (item ? createEmptyLearningCard(item.nodeId) : null);
  selectedGraphNode.value = graphNodes.value.find((node) => node.id === item?.nodeId) ?? selectedGraphNode.value;
}

function updateCardField(field: 'coreUnderstanding' | 'selfTestQuestion', value: string) {
  if (learningCard.value) learningCard.value = { ...learningCard.value, [field]: value, updatedAt: new Date().toISOString() };
}

function toggleRelatedNode(nodeId: number) {
  if (!learningCard.value) return;
  const relatedNodeIds = learningCard.value.relatedNodeIds.includes(nodeId)
    ? learningCard.value.relatedNodeIds.filter((id) => id !== nodeId)
    : [...learningCard.value.relatedNodeIds, nodeId];
  learningCard.value = { ...learningCard.value, relatedNodeIds, updatedAt: new Date().toISOString() };
}

function removeRelatedNode(nodeId: number) {
  if (!learningCard.value) return;
  learningCard.value = {
    ...learningCard.value,
    relatedNodeIds: learningCard.value.relatedNodeIds.filter((id) => id !== nodeId),
    updatedAt: new Date().toISOString(),
  };
}

function addRelatedKeyword(keyword: string) {
  if (!learningCard.value || !keyword.trim() || learningCard.value.relatedKeywords.includes(keyword.trim())) return;
  learningCard.value = { ...learningCard.value, relatedKeywords: [...learningCard.value.relatedKeywords, keyword.trim()], updatedAt: new Date().toISOString() };
}

function removeRelatedKeyword(keyword: string) {
  if (learningCard.value) learningCard.value = { ...learningCard.value, relatedKeywords: learningCard.value.relatedKeywords.filter((item) => item !== keyword), updatedAt: new Date().toISOString() };
}

function addCustomKeyword() {
  addRelatedKeyword(customKeyword.value);
  customKeyword.value = '';
}

async function reviewCard(state: LearningCard['reviewState']) {
  if (!learningCard.value) return;
  const now = new Date().toISOString();
  learningCard.value = { ...learningCard.value, reviewState: state, reviewCount: learningCard.value.reviewCount + 1, lastReviewedAt: now, updatedAt: now };
  await saveNote();
}

async function addFavorite() {
  const identity = activeIdentity.value;
  const generation = requestGeneration.value;
  if (!identity.userId && !identity.username) {
    error.value = '请先登录或输入有效用户名';
    return;
  }
  if (!favoriteForm.nodeId) {
    error.value = '请选择要收藏的节点';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const created = await createFavoriteNode({
      ...identity,
      nodeId: favoriteForm.nodeId,
      note: favoriteForm.note,
    });
    if (!isCurrent(generation)) return;
    successMessage.value = `已收藏 ${created.nodeName}`;
    favoriteForm.note = '';
    filters.page = 1;
    await Promise.all([loadFavorites(), loadArchiveSummary(), loadGraph()]);
    if (!isCurrent(generation)) return;
  } catch (err) {
    if (isCurrent(generation)) {
      error.value = err instanceof Error ? err.message : '收藏失败，可能已经收藏过该节点';
    }
  } finally {
    if (isCurrent(generation)) saving.value = false;
  }
}

async function saveNote() {
  if (!selectedFavorite.value) return;
  const identity = activeIdentity.value;
  const generation = requestGeneration.value;
  if (!identity.userId && !identity.username) {
    error.value = '请先登录或输入有效用户名';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const updated = await updateFavoriteNote(selectedFavorite.value.nodeId, {
      ...identity,
      note: serializeLearningNote(noteForm.note, learningCard.value),
    });
    if (!isCurrent(generation)) return;
    successMessage.value = '学习卡片已同步';
    await Promise.all([loadFavorites(), loadArchiveSummary(), loadGraph()]);
    if (!isCurrent(generation)) return;
    selectFavorite(updated);
  } catch (err) {
    if (isCurrent(generation)) {
      error.value = err instanceof Error ? err.message : '笔记保存失败';
    }
  } finally {
    if (isCurrent(generation)) saving.value = false;
  }
}

async function removeFavorite(item: FavoriteNodeItem) {
  const identity = activeIdentity.value;
  const generation = requestGeneration.value;
  if (!identity.userId && !identity.username) {
    error.value = '请先登录或输入有效用户名';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    if (identity.username) {
      await deleteFavoriteNodeByUsername(identity.username, item.nodeId);
    } else {
      await deleteFavoriteNode(identity.userId!, item.nodeId);
    }
    if (!isCurrent(generation)) return;
    successMessage.value = `已取消收藏 ${item.nodeName}`;
    await Promise.all([loadFavorites(), loadArchiveSummary(), loadGraph()]);
  } catch (err) {
    if (isCurrent(generation)) {
      error.value = err instanceof Error ? err.message : '取消收藏失败';
    }
  } finally {
    if (isCurrent(generation)) saving.value = false;
  }
}

function refreshFavorites() {
  const generation = ++requestGeneration.value;
  void loadFavorites(generation);
}

function refreshNodeSearch() {
  const generation = ++requestGeneration.value;
  void loadNodeOptions(generation);
}

function resetFilters() {
  filters.keyword = '';
  filters.page = 1;
  refreshFavorites();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  refreshFavorites();
}

function nodeRadius(node: FavoriteGraphNode & { favorited: boolean }) {
  if (selectedGraphNode.value?.id === node.id) return 34;
  return node.favorited ? 30 : 24;
}

function edgePath(edge: GraphVisualizationEdge) {
  const source = positionById.value.get(edge.sourceNodeId);
  const target = positionById.value.get(edge.targetNodeId);
  if (!source || !target) return '';
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const curve = Math.min(46, length * 0.14);
  return `M ${source.x} ${source.y} Q ${midX - (dy / length) * curve} ${midY + (dx / length) * curve} ${target.x} ${target.y}`;
}

watch(
  () => props.currentUserId,
  (userId) => {
    if (userId && filters.userId !== userId) {
      setUserId(userId);
      filters.page = 1;
      void loadAll();
    }
  },
);

onMounted(() => {
  void loadAccountOptions();
  void loadAll();
});
</script>

<template>
  <section class="favorite-page compact-page">
    <header class="page-heading compact-heading">
      <div>
        <p class="eyebrow">学习档案</p>
        <h2>学习档案 · 用户学习轨迹</h2>
        <span>查看学习进度、复习状态与知识关联，审阅某个用户收藏的非遗节点、私人笔记与个人收藏关系图。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" :disabled="loading" @click="loadAll">
          <Loader2 v-if="loading" :size="16" class="spin" />
          <RefreshCcw v-else :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error compact-message">{{ error }}</div>
    <div v-if="successMessage" class="inline-success compact-message">{{ successMessage }}</div>

    <section class="favorite-stats compact-stats">
      <article>
        <Star :size="18" />
        <span>在学节点</span>
        <strong>{{ archiveSummary.total }}</strong>
      </article>
      <article>
        <BookOpen :size="18" />
        <span>学习卡片</span>
        <strong>{{ cardCount }}</strong>
      </article>
      <article>
        <Route :size="18" />
        <span>待复习</span>
        <strong>{{ reviewCount }}</strong>
      </article>
      <article class="archive-owner-card">
        <NotebookPen :size="18" />
        <span>学习档案所有者</span>
        <strong>{{ archiveOwnerLabel }}</strong>
        <small>ID {{ filters.userId || '—' }} · 待整理 {{ todoCount }} 条</small>
      </article>
    </section>

    <section class="filter-bar compact-filter">
      <label>
        <span>用户名</span>
        <select
          :value="filters.username"
          @change="setUsername(($event.target as HTMLSelectElement).value); filters.page = 1; loadAll()"
        >
          <option value="">当前登录用户</option>
          <option v-for="account in accountOptions" :key="account.id" :value="account.username">
            {{ account.nickname || account.username }}（{{ account.username }}）
          </option>
        </select>
      </label>
      <label>
        <span>收藏关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="名称 / 编码 / 笔记" @keyup.enter="filters.page = 1; refreshFavorites()" />
      </label>
      <label>
        <span>节点搜索</span>
        <div class="inline-search">
          <input v-model="nodeSearchKeyword" type="search" placeholder="待收藏节点" @keyup.enter="refreshNodeSearch" />
          <button class="secondary-action compact" type="button" @click="refreshNodeSearch">
            <Search :size="15" />
          </button>
        </div>
      </label>
      <div class="filter-actions">
        <button class="primary-action compact" type="button" @click="filters.page = 1; refreshFavorites()">
          <Search :size="16" />
          筛选
        </button>
        <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
      </div>
    </section>

    <section class="side-section favorite-add-box favorite-composer-panel" :class="{ 'is-collapsed': !composerOpen }">
      <div class="favorite-composer-head">
        <h3>收藏节点</h3>
        <button class="secondary-action compact" type="button" @click="composerOpen = !composerOpen">
          <Plus :size="14" />
          {{ composerOpen ? '收起' : '添加收藏' }}
        </button>
      </div>
      <div v-show="composerOpen" class="favorite-composer-body">
        <label>
          <span>公开节点</span>
          <select v-model.number="favoriteForm.nodeId">
            <option value="">选择节点</option>
            <option v-for="node in visibleOptions" :key="node.id" :value="node.id">
              {{ node.name }} / {{ node.nodeCode }}
            </option>
          </select>
        </label>
        <label>
          <span>私人笔记</span>
          <textarea v-model="favoriteForm.note" rows="1" placeholder="记录关注点、学习线索或后续考察方向" />
        </label>
        <button class="primary-action compact" type="button" :disabled="saving" @click="addFavorite">
          <Loader2 v-if="saving" :size="16" class="spin" />
          <Plus v-else :size="16" />
          加入收藏
        </button>
      </div>
    </section>

    <section class="favorite-workbench compact-favorite-workbench">
      <article class="favorite-list-panel">
        <div class="table-panel favorite-table-panel">
          <div class="table-toolbar">
            <span>共 {{ filters.total }} 条收藏</span>
            <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
          </div>

          <div v-if="loading" class="state-panel compact-state">
            <Loader2 :size="22" class="spin" />
            <span>正在加载收藏列表</span>
          </div>

          <div v-else-if="favorites.length === 0" class="state-panel empty compact-state">
            <Star :size="24" />
            <strong>该用户暂无学习收藏</strong>
            <span>可在图谱页引导其收藏公开节点，或在上方切换其他用户查看。</span>
          </div>

          <div v-else class="favorite-list">
            <article
              v-for="item in favorites"
              :key="item.id"
              :class="{ selected: selectedFavorite?.id === item.id }"
            >
              <button type="button" @click="selectFavorite(item)">
                <span class="type-chip" :style="{ borderColor: item.nodeTypeColor || '#d7a84f' }">{{ item.nodeTypeName }}</span>
                <strong>{{ item.nodeName }}</strong>
                <small>{{ item.nodeCode }} / {{ item.province || '未知地区' }}</small>
                <p>{{ parsedFavorite(item).privateNote || item.summary || '暂无私人笔记' }}</p>
                <span class="archive-card-meta">
                  <em class="archive-state" :class="learningCardStatus(parsedFavorite(item).card) === 'mastered' ? 'is-noted' : 'is-todo'">{{ archiveStatus(item) }}</em>
                  <time>{{ archiveTouchedAt(item) }}</time>
                </span>
              </button>
              <button class="danger-icon" type="button" title="取消收藏" :disabled="saving" @click="removeFavorite(item)">
                <Trash2 :size="15" />
              </button>
            </article>
          </div>

          <footer class="pagination compact-pagination" aria-label="收藏列表分页">
            <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
            <span>{{ filters.page }} / {{ pageCount }}</span>
            <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
          </footer>
        </div>
      </article>

      <section class="favorite-visual-stack">
        <article class="favorite-graph-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">收藏关系图</p>
              <h2>用户收藏关系图</h2>
            </div>
            <span>{{ graph?.nodeCount ?? 0 }} 节点 / {{ graph?.edgeCount ?? 0 }} 关系</span>
          </div>

          <div v-if="graphLoading" class="state-panel compact-state">
            <Loader2 :size="22" class="spin" />
            <span>正在生成收藏关系图</span>
          </div>

          <div v-else-if="positionedNodes.length === 0" class="state-panel empty compact-state">
            <BookOpen :size="28" />
            <strong>该用户暂无收藏关系图</strong>
            <span>其收藏公开节点后，这里会展开相连的公开关系。</span>
          </div>

          <div v-else class="favorite-graph-stage">
            <div class="archive-graph-legend">
              <span><i class="legend-dot is-favorited" /> 该用户已收藏</span>
              <span><i class="legend-dot is-neighbor" /> 相邻公开节点</span>
              <span><i class="legend-line" /> 公开关系</span>
            </div>
            <svg viewBox="0 0 820 440" role="img" aria-label="用户收藏关系图">
              <defs>
                <linearGradient id="favorite-edge-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#83513c" stop-opacity="0.24" />
                  <stop offset="48%" stop-color="#d7a84f" stop-opacity="0.92" />
                  <stop offset="100%" stop-color="#63c59a" stop-opacity="0.58" />
                </linearGradient>
                <radialGradient id="favorite-node-fill" cx="30%" cy="24%" r="72%">
                  <stop offset="0%" stop-color="#fff1c9" stop-opacity="0.92" />
                  <stop offset="42%" stop-color="#d7a84f" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#111412" stop-opacity="0.18" />
                </radialGradient>
              </defs>
              <g v-for="edge in displayedEdges" :key="edge.id">
                <path class="board-edge edge-shadow" :d="edgePath(edge)" />
                <path class="board-edge edge-flow" :d="edgePath(edge)" stroke="url(#favorite-edge-flow)" />
              </g>
              <g
                v-for="node in positionedNodes"
                :key="node.id"
                class="favorite-node"
                :class="{ selected: selectedGraphNode?.id === node.id, favorited: node.favorited }"
                :transform="`translate(${node.x}, ${node.y})`"
                @click="selectedGraphNode = node"
              >
                <circle :r="nodeRadius(node) + 12" class="node-halo" />
                <circle :r="nodeRadius(node)" :fill="node.nodeTypeColor || '#3e8f72'" class="node-core" />
                <circle :r="nodeRadius(node)" fill="url(#favorite-node-fill)" class="node-glass" />
                <text y="5">{{ node.name.slice(0, 8) }}</text>
              </g>
            </svg>
          </div>
        </article>
      </section>

      <aside class="favorite-detail-panel">
          <div class="favorite-detail-grid"><section class="side-section learning-card-editor">
            <div class="detail-title-row">
              <div><h3>学习卡片</h3><small>{{ selectedNoteSource === 'structured' ? '已同步' : '历史笔记兼容' }}</small></div>
              <span v-if="learningCard" class="learn-state" :class="`is-${learningCardStatus(learningCard)}`">{{ learningCardStatus(learningCard) === 'mastered' ? '已掌握' : learningCardStatus(learningCard) === 'review' ? '待复习' : '待整理' }}</span>
            </div>
            <template v-if="selectedFavorite && learningCard">
              <strong>{{ selectedFavorite.nodeName }}</strong>
              <small>{{ selectedFavorite.nodeCode }} / {{ selectedFavorite.nodeTypeName }}</small>
              <button class="secondary-action compact" type="button" @click="cardEditorOpen = !cardEditorOpen">{{ cardEditorOpen ? '收起编辑' : '展开编辑' }}</button>
              <div v-show="cardEditorOpen" class="learning-card-form">

                <!-- 步骤 1：写核心理解 -->
                <div class="study-step">
                  <div class="study-step-head">
                    <span class="study-step-num" aria-hidden="true">1</span>
                    <label class="study-step-label"><span>写核心理解</span></label>
                    <span v-if="learningCard.coreUnderstanding" class="study-step-done">✓</span>
                  </div>
                  <p class="study-step-hint">用自己的话总结这个节点最关键的内容。</p>
                  <textarea :value="learningCard.coreUnderstanding" rows="3" placeholder="用自己的话概括" @input="updateCardField('coreUnderstanding', ($event.target as HTMLTextAreaElement).value)" />
                </div>

                <!-- 步骤 2：设自测问题 -->
                <div class="study-step">
                  <div class="study-step-head">
                    <span class="study-step-num" aria-hidden="true">2</span>
                    <label class="study-step-label"><span>设自测问题</span></label>
                    <span v-if="learningCard.selfTestQuestion" class="study-step-done">✓</span>
                  </div>
                  <p class="study-step-hint">写一个能检验自己是否理解的问题。</p>
                  <textarea :value="learningCard.selfTestQuestion" rows="2" placeholder="写一个检验理解的问题" @input="updateCardField('selfTestQuestion', ($event.target as HTMLTextAreaElement).value)" />
                </div>

                <!-- 步骤 3：复习自测 -->
                <div class="study-step">
                  <div class="study-step-head">
                    <span class="study-step-num" aria-hidden="true">3</span>
                    <span class="study-step-label">复习自测</span>
                    <span v-if="learningCard.reviewCount > 0" class="study-step-done">✓</span>
                  </div>
                  <p class="study-step-hint">先看自测问题回想答案，再揭示核心理解对照。</p>
                  <div class="review-reveal" aria-live="polite">
                    <template v-if="revealedCardNodeId === selectedFavorite.nodeId">
                      <div class="learning-review-answer">
                        <strong>核心理解</strong>
                        <p>{{ learningCard.coreUnderstanding || '还没有填写核心理解。' }}</p>
                      </div>
                    </template>
                    <template v-else>
                      <span>完成自测后揭示核心理解</span>
                      <button class="secondary-action compact" type="button" @click="revealedCardNodeId = selectedFavorite.nodeId">揭示核心理解</button>
                    </template>
                  </div>
                  <div v-if="revealedCardNodeId === selectedFavorite.nodeId" class="review-controls" aria-live="polite">
                    <span>复习 {{ learningCard.reviewCount }} 次<span v-if="learningCard.lastReviewedAt"> · {{ learningCard.lastReviewedAt.slice(0, 10) }}</span></span>
                    <button class="secondary-action compact" type="button" @click="reviewCard('mastered')">掌握</button>
                    <button class="secondary-action compact" type="button" @click="reviewCard('fuzzy')">模糊</button>
                    <button class="secondary-action compact" type="button" @click="reviewCard('todo')">不会</button>
                  </div>
                </div>

                <!-- 步骤 4：关联与关键词 -->
                <div class="study-step">
                  <div class="study-step-head">
                    <span class="study-step-num" aria-hidden="true">4</span>
                    <span class="study-step-label">关联与关键词</span>
                  </div>
                  <p class="study-step-hint">把相关节点和关键词串起来，形成知识网络。</p>
                  <fieldset class="study-related-node-list"><legend>关联节点候选</legend><button v-for="node in graphNodes" :key="node.id" class="related-chip" :class="{ 'is-selected': learningCard.relatedNodeIds.includes(node.id) }" type="button" :aria-pressed="learningCard.relatedNodeIds.includes(node.id)" @click="toggleRelatedNode(node.id)">{{ node.name }}</button><span v-for="id in learningCard.relatedNodeIds.filter((id) => !graphNodes.some((node) => node.id === id))" :key="`stale-${id}`" class="related-chip is-stale">节点 #{{ id }} <button type="button" :aria-label="`移除关联节点 #${id}`" @click="removeRelatedNode(id)">×</button></span></fieldset>
                  <div class="related-keyword-chips"><span v-for="keyword in learningCard.relatedKeywords" :key="keyword" class="related-chip">{{ keyword }} <button type="button" aria-label="移除关键词" @click="removeRelatedKeyword(keyword)">×</button></span><label class="custom-keyword-input"><span>自定义关键词</span><input v-model="customKeyword" type="text" placeholder="输入关键词" @keyup.enter="addCustomKeyword" /></label><button type="button" class="related-chip" :disabled="!customKeyword.trim()" @click="addCustomKeyword">添加</button></div>
                </div>

                <button class="primary-action compact" type="button" :disabled="saving" @click="saveNote"><Loader2 v-if="saving" :size="16" class="spin" /><NotebookPen v-else :size="16" />保存并同步</button>
              </div>
            </template>
            <div v-else class="chain-empty"><NotebookPen :size="16" /><span>选择一条在学节点编辑学习卡片</span></div>
          </section>
           <section class="side-section private-note-panel">
             <div class="detail-title-row"><div><h3>私人笔记</h3><small>仅本人可见</small></div></div>
             <template v-if="selectedFavorite">
               <textarea v-model="noteForm.note" rows="5" placeholder="补充学习记录、访谈线索或素材待办" />
               <button class="primary-action compact" type="button" :disabled="saving" @click="saveNote"><Loader2 v-if="saving" :size="16" class="spin" /><NotebookPen v-else :size="16" />保存并同步</button>
             </template>
             <div v-else class="chain-empty"><NotebookPen :size="16" /><span>选择一条在学节点记录私人笔记</span></div>
           </section></div>

           <section class="side-section">
             <h3>图谱焦点</h3>
             <template v-if="selectedGraphNode">
              <span class="type-chip" :style="{ borderColor: selectedGraphNode.nodeTypeColor || '#d7a84f' }">{{ selectedGraphNode.nodeTypeName }}</span>
              <strong>{{ selectedGraphNode.name }}</strong>
              <small>{{ selectedGraphNode.nodeCode }} / {{ selectedGraphNode.province || '未知地区' }}</small>
              <p>{{ selectedGraphNode.note || selectedGraphNode.summary || '暂无简介' }}</p>
              <button class="secondary-action compact" type="button" @click="openNodeDetail(selectedGraphNode)">
                <BookOpen :size="15" />
                查看节点详情
              </button>
            </template>
            <div v-else class="chain-empty">
              <BookOpen :size="16" />
              <span>点击关系图上的节点查看详情</span>
            </div>
          </section>
        </aside>
    </section>
  </section>
</template>
