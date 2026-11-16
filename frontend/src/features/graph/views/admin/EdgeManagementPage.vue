<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Edit3,
  Eye,
  GitBranchPlus,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next';
import { EdgeTypeItem, GraphEdgeItem, GraphEdgePayload, GraphNodeItem, createGraphEdge, deleteGraphEdge, fetchEdgeTypes, fetchGraphEdge, fetchGraphEdges, fetchGraphNodes, updateGraphEdge } from '../../services/graph';

type FormMode = 'create' | 'edit';

const route = useRoute();
const router = useRouter();

const edgeTypes = ref<EdgeTypeItem[]>([]);
const nodes = ref<GraphNodeItem[]>([]);
const edges = ref<GraphEdgeItem[]>([]);
const selectedIds = ref<number[]>([]);
const activeEdge = ref<GraphEdgeItem | null>(null);
const detailEdge = ref<GraphEdgeItem | null>(null);
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const error = ref('');
const detailError = ref('');
const modalOpen = ref(false);
const formMode = ref<FormMode>('create');
const deleteCandidate = ref<GraphEdgeItem | null>(null);
// 端点节点候选：253 个节点一次拉不完，必须支持关键词搜索
const nodeKeyword = ref('');
const nodeLoading = ref(false);

const filters = reactive({
  keyword: '',
  edgeTypeId: '' as number | '',
  auditStatus: '',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive<GraphEdgePayload>({
  sourceNodeId: undefined,
  targetNodeId: undefined,
  edgeTypeId: undefined,
  directed: true,
  weight: 1,
  relationLabel: '',
  startYear: null,
  endYear: null,
  auditStatus: 'PENDING',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const allSelected = computed(() => edges.value.length > 0 && edges.value.every((edge) => selectedIds.value.includes(edge.id)));
const detailEdgeId = computed(() => {
  const raw = route.params.edgeId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ? Number(value) : 0;
});

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
};

const statusColors: Record<string, string> = {
  DRAFT: '#d8d0c6',
  PENDING: '#ffe088',
  APPROVED: '#78fbb6',
  REJECTED: '#ffdad6',
};

async function loadNodeOptions() {
  nodeLoading.value = true;
  try {
    const response = await fetchGraphNodes({ keyword: nodeKeyword.value, page: 1, size: 500 });
    nodes.value = response.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '节点候选加载失败';
  } finally {
    nodeLoading.value = false;
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [edgeTypesResponse, nodesResponse, edgesResponse] = await Promise.all([
      fetchEdgeTypes(),
      fetchGraphNodes({ keyword: nodeKeyword.value, page: 1, size: 500 }),
      fetchGraphEdges(filters),
    ]);
    edgeTypes.value = edgeTypesResponse.items;
    nodes.value = nodesResponse.items;
    edges.value = edgesResponse.items;
    filters.total = edgesResponse.total;
    selectedIds.value = selectedIds.value.filter((id) => edges.value.some((edge) => edge.id === id));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '关系数据加载失败';
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.edgeTypeId = '';
  filters.auditStatus = '';
  filters.page = 1;
  void load();
}

function openCreate() {
  formMode.value = 'create';
  Object.assign(form, {
    sourceNodeId: nodes.value[0]?.id,
    targetNodeId: nodes.value[1]?.id,
    edgeTypeId: edgeTypes.value[0]?.id,
    directed: true,
    weight: 1,
    relationLabel: '',
    startYear: null,
    endYear: null,
    auditStatus: 'PENDING',
  });
  modalOpen.value = true;
}

function openEdit(edge: GraphEdgeItem) {
  formMode.value = 'edit';
  activeEdge.value = edge;
  Object.assign(form, {
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    edgeTypeId: edge.edgeTypeId,
    directed: Boolean(edge.directed),
    weight: Number(edge.weight),
    relationLabel: edge.relationLabel ?? '',
    startYear: edge.startYear ?? null,
    endYear: edge.endYear ?? null,
    auditStatus: edge.auditStatus,
  });
  modalOpen.value = true;
}

async function openEditFromDetail() {
  if (!detailEdge.value) return;
  openEdit(detailEdge.value);
  await nextTick();
  if (!modalOpen.value) {
    modalOpen.value = true;
  }
  await nextTick();
  if (formMode.value !== 'edit' || activeEdge.value?.id !== detailEdge.value.id) {
    formMode.value = 'edit';
    activeEdge.value = detailEdge.value;
    Object.assign(form, {
      sourceNodeId: detailEdge.value.sourceNodeId,
      targetNodeId: detailEdge.value.targetNodeId,
      edgeTypeId: detailEdge.value.edgeTypeId,
      directed: Boolean(detailEdge.value.directed),
      weight: Number(detailEdge.value.weight),
      relationLabel: detailEdge.value.relationLabel ?? '',
      startYear: detailEdge.value.startYear ?? null,
      endYear: detailEdge.value.endYear ?? null,
      auditStatus: detailEdge.value.auditStatus,
    });
  }
}

async function loadDetail() {
  if (!detailEdgeId.value) {
    detailEdge.value = null;
    detailError.value = '';
    return;
  }
  detailLoading.value = true;
  detailError.value = '';
  try {
    detailEdge.value = await fetchGraphEdge(detailEdgeId.value);
  } catch (err) {
    detailError.value = err instanceof Error ? err.message : '关系详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

function openDetail(edge: GraphEdgeItem) {
  void router.push(`/admin/graph/edges/${edge.id}`);
}

function closeDetail() {
  void router.push('/admin/graph/edges');
}

async function saveEdge() {
  if (!form.sourceNodeId || !form.targetNodeId || !form.edgeTypeId) {
    error.value = '请选择源节点、目标节点和关系类型';
    return;
  }
  if (form.sourceNodeId === form.targetNodeId) {
    error.value = '源节点和目标节点不能相同';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    if (formMode.value === 'create') {
      await createGraphEdge(form);
    } else if (activeEdge.value) {
      await updateGraphEdge(activeEdge.value.id, form);
    }
    modalOpen.value = false;
    await Promise.all([load(), loadDetail()]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败，可能存在重复边或无效节点';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(edge: GraphEdgeItem) {
  deleteCandidate.value = edge;
}

async function performDelete() {
  if (!deleteCandidate.value) return;
  saving.value = true;
  error.value = '';
  try {
    await deleteGraphEdge(deleteCandidate.value.id);
    deleteCandidate.value = null;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除失败';
  } finally {
    saving.value = false;
  }
}

async function deleteSelected() {
  if (selectedIds.value.length === 0) return;
  saving.value = true;
  error.value = '';
  try {
    await Promise.all(selectedIds.value.map((id) => deleteGraphEdge(id)));
    selectedIds.value = [];
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '批量删除失败';
  } finally {
    saving.value = false;
  }
}

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : edges.value.map((edge) => edge.id);
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function edgeTypeName(id?: number) {
  return edgeTypes.value.find((item) => item.id === id)?.typeName ?? '未分类关系';
}

function formatDate(raw?: string | null) {
  if (!raw) return '-';
  return raw.replace('T', ' ').slice(0, 19);
}

watch(detailEdgeId, loadDetail, { immediate: true });

onMounted(load);
</script>

<template>
  <section v-if="detailEdgeId" class="edge-detail-page">
    <header class="page-heading edge-detail-heading">
      <div class="edge-detail-title">
        <p class="eyebrow">关系详情</p>
        <h2>{{ detailEdge ? `${detailEdge.sourceNodeName} → ${detailEdge.targetNodeName}` : '关系详情' }}</h2>
        <span>独立查看关系边的基础档案、方向、权重与审核状态。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="closeDetail">
          <ArrowLeft :size="16" />
          返回列表
        </button>
        <button v-if="detailEdge" class="primary-action" type="button" @click="openEditFromDetail">
          <Edit3 :size="16" />
          编辑关系
        </button>
      </div>
    </header>

    <div v-if="detailError" class="inline-error">{{ detailError }}</div>

    <div v-if="detailLoading" class="state-panel">
      <Loader2 :size="24" class="spin" />
      <span>正在加载关系详情</span>
    </div>

    <article v-else-if="detailEdge" class="edge-detail-layout">
      <!-- 左侧：关系可视化 + 核心属性 -->
      <div class="edge-detail-main">
        <section class="edge-hero-card">
          <div class="edge-hero-header">
            <span class="edge-type-badge">{{ edgeTypeName(detailEdge.edgeTypeId) }}</span>
            <span class="status-chip" :class="detailEdge.auditStatus.toLowerCase()">{{ statusLabels[detailEdge.auditStatus] }}</span>
          </div>

          <div class="edge-flow-visual">
            <div class="edge-node source">
              <span class="node-label">源节点</span>
              <strong>{{ detailEdge.sourceNodeName }}</strong>
              <code>{{ detailEdge.sourceNodeCode }}</code>
            </div>
            <div class="edge-connector" :class="{ directed: detailEdge.directed }">
              <div class="connector-line"></div>
              <span class="connector-type">{{ detailEdge.directed ? '有向' : '无向' }}</span>
              <div v-if="detailEdge.directed" class="connector-arrow">▶</div>
            </div>
            <div class="edge-node target">
              <span class="node-label">目标节点</span>
              <strong>{{ detailEdge.targetNodeName }}</strong>
              <code>{{ detailEdge.targetNodeCode }}</code>
            </div>
          </div>

          <div class="edge-quick-stats">
            <div class="quick-stat">
              <span>权重</span>
              <strong>{{ Number(detailEdge.weight).toFixed(2) }}</strong>
            </div>
            <div class="quick-stat">
              <span>方向</span>
              <strong>{{ detailEdge.directed ? '有向' : '无向' }}</strong>
            </div>
            <div class="quick-stat">
              <span>展示标签</span>
              <strong>{{ detailEdge.relationLabel || '暂无' }}</strong>
            </div>
            <div class="quick-stat">
              <span>起止年份</span>
              <strong>{{ detailEdge.startYear || '-' }} 至 {{ detailEdge.endYear || '-' }}</strong>
            </div>
          </div>
        </section>

        <section class="edge-metadata-card">
          <h3>元数据</h3>
          <dl>
            <div>
              <dt>关系链</dt>
              <dd>{{ detailEdge.sourceNodeName }} <span class="gold-arrow">→</span> {{ detailEdge.targetNodeName }}</dd>
            </div>
            <div>
              <dt>源节点编码</dt>
              <dd>{{ detailEdge.sourceNodeCode }}</dd>
            </div>
            <div>
              <dt>目标节点编码</dt>
              <dd>{{ detailEdge.targetNodeCode }}</dd>
            </div>
            <div>
              <dt>关系类型</dt>
              <dd>{{ edgeTypeName(detailEdge.edgeTypeId) }}</dd>
            </div>
            <div>
              <dt>方向</dt>
              <dd>{{ detailEdge.directed ? '有向' : '无向' }}</dd>
            </div>
            <div>
              <dt>权重</dt>
              <dd>{{ Number(detailEdge.weight).toFixed(2) }}</dd>
            </div>
            <div>
              <dt>展示标签</dt>
              <dd>{{ detailEdge.relationLabel || '暂无标签' }}</dd>
            </div>
            <div>
              <dt>起止年份</dt>
              <dd>{{ detailEdge.startYear || '-' }} 至 {{ detailEdge.endYear || '-' }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- 右侧：状态时间线 + 操作 -->
      <aside class="edge-detail-side">
        <section class="edge-status-card">
          <h3>审核状态</h3>
          <div class="edge-status-timeline">
            <div class="timeline-step" :class="{ active: detailEdge.auditStatus === 'DRAFT' || detailEdge.auditStatus === 'PENDING' || detailEdge.auditStatus === 'APPROVED' || detailEdge.auditStatus === 'REJECTED' }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>草稿</strong>
                <span>关系边初始创建</span>
              </div>
            </div>
            <div class="timeline-step" :class="{ active: detailEdge.auditStatus === 'PENDING' || detailEdge.auditStatus === 'APPROVED' || detailEdge.auditStatus === 'REJECTED' }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>待审核</strong>
                <span>提交审核等待处理</span>
              </div>
            </div>
            <div class="timeline-step" :class="{ active: detailEdge.auditStatus === 'APPROVED' }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>已通过</strong>
                <span>审核通过可展示</span>
              </div>
            </div>
            <div class="timeline-step" :class="{ active: detailEdge.auditStatus === 'REJECTED' }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>已驳回</strong>
                <span>审核未通过需修改</span>
              </div>
            </div>
          </div>
        </section>

        <section class="edge-timeline-card">
          <h3>时间记录</h3>
          <div class="edge-timeline-list">
            <div class="timeline-item">
              <div class="timeline-icon">
                <Loader2 :size="14" class="spin" style="animation: none;" />
              </div>
              <div class="timeline-body">
                <strong>创建时间</strong>
                <span>{{ formatDate(detailEdge.createdAt) }}</span>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon update">
                <RefreshCcw :size="14" />
              </div>
              <div class="timeline-body">
                <strong>更新时间</strong>
                <span>{{ formatDate(detailEdge.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="edge-actions-card">
          <h3>快捷操作</h3>
          <div class="edge-actions-list">
            <button class="primary-action" type="button" @click="openEditFromDetail">
              <Edit3 :size="16" />
              编辑关系
            </button>
            <button class="danger-action" type="button" @click="confirmDelete(detailEdge)">
              <Trash2 :size="16" />
              删除关系
            </button>
          </div>
        </section>
      </aside>
    </article>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="node-modal">
        <header>
          <div>
            <p class="eyebrow">{{ formMode === 'create' ? 'Create Edge' : 'Edit Edge' }}</p>
            <h3>{{ formMode === 'create' ? '新增关系边' : '编辑关系边' }}</h3>
          </div>
          <button class="icon-only" type="button" @click="modalOpen = false"><X :size="18" /></button>
        </header>

        <div class="form-grid">
          <label class="wide">
            <span>节点搜索</span>
            <div class="inline-search">
              <input v-model="nodeKeyword" type="search" placeholder="节点名称或编码，用于筛出下方两个下拉" @keyup.enter="loadNodeOptions" />
              <button class="secondary-action compact" type="button" :disabled="nodeLoading" @click="loadNodeOptions">
                <Loader2 v-if="nodeLoading" :size="15" class="spin" />
                <Search v-else :size="15" />
                搜索
              </button>
            </div>
            <small class="field-hint">候选一次加载前 500 个节点，找不到目标时先用上方搜索框筛选。</small>
          </label>
          <label>
            <span>源节点</span>
            <select v-model="form.sourceNodeId">
              <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.name }}</option>
            </select>
          </label>
          <label>
            <span>目标节点</span>
            <select v-model="form.targetNodeId">
              <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.name }}</option>
            </select>
          </label>
          <label>
            <span>关系类型</span>
            <select v-model="form.edgeTypeId">
              <option v-for="type in edgeTypes" :key="type.id" :value="type.id">{{ type.typeName }}</option>
            </select>
          </label>
          <label>
            <span>审核状态</span>
            <select v-model="form.auditStatus">
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </select>
          </label>
          <label>
            <span>权重</span>
            <input v-model.number="form.weight" type="number" min="0.0001" step="0.01" />
          </label>
          <label>
            <span>展示标签</span>
            <input v-model="form.relationLabel" placeholder="发源地、师承关系" />
          </label>
          <label>
            <span>开始年份</span>
            <input v-model.number="form.startYear" type="number" placeholder="可选" />
          </label>
          <label>
            <span>结束年份</span>
            <input v-model.number="form.endYear" type="number" placeholder="可选" />
          </label>
          <label class="wide checkbox-line">
            <input v-model="form.directed" type="checkbox" />
            <span>有向关系</span>
          </label>
        </div>

        <div v-if="error" class="inline-error modal-inline-error">
          {{ error }}
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveEdge">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存关系
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="deleteCandidate = null">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除关系？</h3>
        <p>将永久删除「<strong>{{ deleteCandidate.sourceNodeName }} → {{ deleteCandidate.targetNodeName }}</strong>」这条关系，<strong>不可恢复</strong>。</p>
        <footer>
          <button class="secondary-action" type="button" @click="deleteCandidate = null">取消</button>
          <button class="danger-action" type="button" :disabled="saving" @click="performDelete">
            <Loader2 v-if="saving" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>

  <section v-else class="node-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">图谱关系档案</p>
        <h2>关系边管理</h2>
        <span>维护非遗项目、地域、传承人、作品之间的结构化关系。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <GitBranchPlus :size="17" />
          新增关系
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="源节点、目标节点、关系标签" @keyup.enter="load" />
      </label>
      <label>
        <span>关系类型</span>
        <select v-model="filters.edgeTypeId">
          <option value="">全部类型</option>
          <option v-for="type in edgeTypes" :key="type.id" :value="type.id">{{ type.typeName }}</option>
        </select>
      </label>
      <label>
        <span>审核状态</span>
        <select v-model="filters.auditStatus">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已驳回</option>
        </select>
      </label>
      <div class="filter-actions">
        <button class="primary-action compact" type="button" @click="filters.page = 1; load()">
          <Search :size="16" />
          搜索
        </button>
        <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
      </div>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <span>共 {{ filters.total }} 条关系</span>
        <button class="danger-action compact" type="button" :disabled="selectedIds.length === 0" @click="deleteSelected">
          <Trash2 :size="15" />
          批量删除<span v-if="selectedIds.length" class="delete-count">{{ selectedIds.length }}</span>
        </button>
      </div>

      <div v-if="loading" class="state-panel">
        <Loader2 :size="24" class="spin" />
        <span>正在加载关系档案</span>
      </div>

      <div v-else-if="edges.length === 0" class="state-panel empty">
        <strong>暂无关系边</strong>
        <span>请先创建至少两个节点，再建立发源、师承、作品或材料关系。</span>
        <button class="primary-action compact" type="button" @click="openCreate">新增关系</button>
      </div>

      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th class="check-cell"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
              <th>关系链</th>
              <th>类型</th>
              <th>方向</th>
              <th>权重</th>
              <th>标签</th>
              <th>审核状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="edge in edges" :key="edge.id">
              <td class="check-cell"><input v-model="selectedIds" type="checkbox" :value="edge.id" /></td>
              <td>
                <strong>{{ edge.sourceNodeName }} <span class="gold-arrow">→</span> {{ edge.targetNodeName }}</strong>
                <small>{{ edge.sourceNodeCode }} / {{ edge.targetNodeCode }}</small>
              </td>
              <td><span class="type-chip">{{ edge.edgeTypeName }}</span></td>
              <td>{{ edge.directed ? '有向' : '无向' }}</td>
              <td>{{ Number(edge.weight).toFixed(2) }}</td>
              <td>{{ edge.relationLabel || '-' }}</td>
              <td><span class="status-chip" :class="edge.auditStatus.toLowerCase()">{{ statusLabels[edge.auditStatus] }}</span></td>
              <td>{{ edge.updatedAt || '-' }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" title="查看详情" @click="openDetail(edge)"><Eye :size="15" /></button>
                  <button type="button" title="编辑" @click="openEdit(edge)"><Edit3 :size="15" /></button>
                  <button type="button" title="删除" @click="confirmDelete(edge)"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
        <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
      </footer>
    </section>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="node-modal">
        <header>
          <div>
            <p class="eyebrow">{{ formMode === 'create' ? 'Create Edge' : 'Edit Edge' }}</p>
            <h3>{{ formMode === 'create' ? '新增关系边' : '编辑关系边' }}</h3>
          </div>
          <button class="icon-only" type="button" @click="modalOpen = false"><X :size="18" /></button>
        </header>

        <div class="form-grid">
          <label class="wide">
            <span>节点搜索</span>
            <div class="inline-search">
              <input v-model="nodeKeyword" type="search" placeholder="节点名称或编码，用于筛出下方两个下拉" @keyup.enter="loadNodeOptions" />
              <button class="secondary-action compact" type="button" :disabled="nodeLoading" @click="loadNodeOptions">
                <Loader2 v-if="nodeLoading" :size="15" class="spin" />
                <Search v-else :size="15" />
                搜索
              </button>
            </div>
            <small class="field-hint">候选一次加载前 500 个节点，找不到目标时先用上方搜索框筛选。</small>
          </label>
          <label>
            <span>源节点</span>
            <select v-model="form.sourceNodeId">
              <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.name }}</option>
            </select>
          </label>
          <label>
            <span>目标节点</span>
            <select v-model="form.targetNodeId">
              <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.name }}</option>
            </select>
          </label>
          <label>
            <span>关系类型</span>
            <select v-model="form.edgeTypeId">
              <option v-for="type in edgeTypes" :key="type.id" :value="type.id">{{ type.typeName }}</option>
            </select>
          </label>
          <label>
            <span>审核状态</span>
            <select v-model="form.auditStatus">
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </select>
          </label>
          <label>
            <span>权重</span>
            <input v-model.number="form.weight" type="number" min="0.0001" step="0.01" />
          </label>
          <label>
            <span>展示标签</span>
            <input v-model="form.relationLabel" placeholder="发源地、师承关系" />
          </label>
          <label>
            <span>开始年份</span>
            <input v-model.number="form.startYear" type="number" placeholder="可选" />
          </label>
          <label>
            <span>结束年份</span>
            <input v-model.number="form.endYear" type="number" placeholder="可选" />
          </label>
          <label class="wide checkbox-line">
            <input v-model="form.directed" type="checkbox" />
            <span>有向关系</span>
          </label>
        </div>

        <div v-if="error" class="inline-error modal-inline-error">
          {{ error }}
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveEdge">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存关系
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="deleteCandidate = null">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除关系？</h3>
        <p>将永久删除「<strong>{{ deleteCandidate.sourceNodeName }} → {{ deleteCandidate.targetNodeName }}</strong>」这条关系，<strong>不可恢复</strong>。</p>
        <footer>
          <button class="secondary-action" type="button" @click="deleteCandidate = null">取消</button>
          <button class="danger-action" type="button" :disabled="saving" @click="performDelete">
            <Loader2 v-if="saving" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
