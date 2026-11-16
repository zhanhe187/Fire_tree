<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  ImagePlus,
  Loader2,
  Music2,
  PlaySquare,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next';
import { GraphNodeItem, GraphNodeMediaItem, GraphNodePayload, NodeTypeItem, createGraphNode, deleteGraphNode, fetchGraphNode, fetchGraphNodeMediaFiles, fetchGraphNodes, fetchNodeTypes, updateGraphNode } from '../../services/graph';
import { MediaFileItem, fetchMediaFiles, submitImageMaterial } from '../../../media/services/media';
import { resolveMediaUrl } from '../../../../shared/utils/mediaUrl';

type FormMode = 'create' | 'edit';

const route = useRoute();
const router = useRouter();
const nodeTypes = ref<NodeTypeItem[]>([]);
const nodes = ref<GraphNodeItem[]>([]);
const selectedIds = ref<number[]>([]);
const activeNode = ref<GraphNodeItem | null>(null);
const detailNode = ref<GraphNodeItem | null>(null);
const loading = ref(false);
const detailLoading = ref(false);
const detailMediaLoading = ref(false);
const saving = ref(false);
const error = ref('');
const successMessage = ref('');
const detailError = ref('');
const modalOpen = ref(false);
const formMode = ref<FormMode>('create');
const deleteCandidate = ref<GraphNodeItem | null>(null);
// 批量删除：与单条删除一致，必须先二次确认（后端会同时物理删除关联关系边）
const batchDeleteOpen = ref(false);
const coverFile = ref<File | null>(null);
const coverPreviewUrl = ref('');

const filters = reactive({
  keyword: '',
  nodeTypeId: '' as number | '',
  auditStatus: '',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive<GraphNodePayload>({
  nodeCode: '',
  nodeTypeId: undefined,
  name: '',
  alias: '',
  category: '',
  summary: '',
  content: '',
  province: '',
  city: '',
  district: '',
  address: '',
  historicalPeriod: '',
  projectLevel: '',
  birthYear: undefined,
  sourceName: '',
  sourceUrl: '',
  coverImageUrl: '',
  coverImageCaption: '',
  visibility: 'PUBLIC',
  auditStatus: 'PENDING',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const allSelected = computed(() => nodes.value.length > 0 && nodes.value.every((node) => selectedIds.value.includes(node.id)));
const nodeRelatedMedia = computed(() => detailNode.value?.mediaFiles ?? []);
const detailNodeId = computed(() => {
  const rawId = route.params.nodeId;
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  return value ? Number(value) : 0;
});
const isInheritorForm = computed(() => {
  const type = nodeTypes.value.find((item) => item.id === form.nodeTypeId);
  return type?.typeCode === 'inheritor';
});

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
};

const visibilityLabels: Record<string, string> = {
  PUBLIC: '公开',
  PRIVATE: '私有',
};

const mediaTypeLabels: Record<GraphNodeMediaItem['fileType'], string> = {
  IMAGE: '图片资料',
  VIDEO: '视频资料',
  AUDIO: '音频资料',
  DOCUMENT: '文档资料',
  OTHER: '其他资料',
};

const mediaTypeIcons: Record<GraphNodeMediaItem['fileType'], typeof ImagePlus> = {
  IMAGE: ImagePlus,
  VIDEO: PlaySquare,
  AUDIO: Music2,
  DOCUMENT: FileText,
  OTHER: FileText,
};

const fieldLabels: Record<string, string> = {
  nodeCode: '业务编码',
  name: '节点名称',
  nodeTypeId: '节点类型',
  auditStatus: '审核状态',
  visibility: '可见性',
  birthYear: '出生年份',
  sourceUrl: '来源链接',
  coverImageUrl: '封面图片',
};

const nodeTextTranslations: Record<string, string> = {
  昆曲: '昆曲',
  古琴艺术: '古琴艺术',
  中国书法: '中国书法',
  端午节: '端午节',
  中医针灸: '中医针灸',
  二十四节气: '二十四节气',
  'UNESCO名录项目': '联合国教科文组织名录项目',
  UNESCO: '联合国教科文组织',
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [typesResponse, nodesResponse] = await Promise.all([
      fetchNodeTypes(),
      fetchGraphNodes(filters),
    ]);
    nodeTypes.value = typesResponse.items;
    nodes.value = nodesResponse.items;
    filters.total = nodesResponse.total;
    selectedIds.value = selectedIds.value.filter((id) => nodes.value.some((node) => node.id === id));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '节点数据加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadDetail() {
  if (!detailNodeId.value) {
    detailNode.value = null;
    detailError.value = '';
    return;
  }
  detailLoading.value = true;
  detailError.value = '';
  try {
    const nodeDetail = await fetchGraphNode(detailNodeId.value, { includeAllMedia: true });
    detailNode.value = {
      ...nodeDetail,
      mediaFiles: await loadNodeMediaFiles(detailNodeId.value, nodeDetail.mediaFiles, true),
    };
  } catch (err) {
    detailError.value = err instanceof Error ? err.message : '节点详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

async function loadNodeMediaFiles(nodeId: number, existing: GraphNodeMediaItem[] | undefined, includeAllMedia: boolean) {
  if (existing && existing.length > 0) return existing;
  detailMediaLoading.value = true;
  try {
    const response = await fetchGraphNodeMediaFiles(nodeId, { includeAllMedia });
    return response.items;
  } catch {
    const response = await fetchMediaFiles({ nodeId, page: 1, size: 100 });
    return response.items.map(mediaFileToNodeMedia);
  } finally {
    detailMediaLoading.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.nodeTypeId = '';
  filters.auditStatus = '';
  filters.page = 1;
  void load();
}

function openCreate() {
  formMode.value = 'create';
  resetCoverUpload();
  Object.assign(form, {
    nodeCode: '',
    nodeTypeId: nodeTypes.value[0]?.id,
    name: '',
    alias: '',
    category: '',
    summary: '',
    content: '',
    province: '',
    city: '',
    district: '',
    address: '',
    historicalPeriod: '',
    projectLevel: '',
    birthYear: undefined,
    sourceName: '',
    sourceUrl: '',
    coverImageUrl: '',
    coverImageCaption: '',
    visibility: 'PUBLIC',
    auditStatus: 'PENDING',
  });
  modalOpen.value = true;
}

function openEdit(node: GraphNodeItem) {
  formMode.value = 'edit';
  resetCoverUpload();
  Object.assign(form, {
    nodeCode: node.nodeCode,
    nodeTypeId: node.nodeTypeId,
    name: node.name,
    alias: node.alias ?? '',
    category: node.category ?? '',
    summary: node.summary ?? '',
    content: node.content ?? '',
    province: node.province ?? '',
    city: node.city ?? '',
    district: node.district ?? '',
    address: node.address ?? '',
    historicalPeriod: node.historicalPeriod ?? '',
    projectLevel: node.projectLevel ?? '',
    birthYear: node.birthYear,
    sourceName: node.sourceName ?? '',
    sourceUrl: node.sourceUrl ?? '',
    coverImageUrl: node.coverImageUrl ?? '',
    coverImageCaption: node.coverImageCaption ?? '',
    visibility: node.visibility,
    auditStatus: node.auditStatus,
  });
  activeNode.value = node;
  modalOpen.value = true;
}

function openDetail(node: GraphNodeItem) {
  void router.push(`/admin/graph/nodes/${node.id}`);
}

function closeDetail() {
  void router.push('/admin/graph/nodes');
}

function resetCoverUpload() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
  }
  coverFile.value = null;
  coverPreviewUrl.value = '';
}

function handleCoverFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  resetCoverUpload();
  coverFile.value = file;
  coverPreviewUrl.value = file ? URL.createObjectURL(file) : '';
}

function validateNodeForm(): string {
  if (formMode.value === 'create' && !form.nodeCode?.trim()) {
    return '请填写业务编码';
  }
  if (!form.name?.trim()) {
    return '请填写节点名称';
  }
  if (formMode.value === 'create' && !form.nodeTypeId) {
    return '请选择节点类型';
  }
  if (form.sourceUrl && form.sourceUrl.length > 512) {
    return `${fieldLabels.sourceUrl} 长度不能超过 512 个字符`;
  }
  if (isInheritorForm.value && form.birthYear != null) {
    const year = Number(form.birthYear);
    if (!Number.isFinite(year) || year < 1850 || year > new Date().getFullYear()) {
      return `${fieldLabels.birthYear} 不合法，请填写合理年份`;
    }
  }
  return '';
}

async function saveNode() {
  const validationError = validateNodeForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload: GraphNodePayload = { ...form };
    if (!isInheritorForm.value) {
      payload.birthYear = undefined;
    } else if (payload.birthYear == null || !Number.isFinite(Number(payload.birthYear))) {
      payload.birthYear = undefined;
    } else {
      payload.birthYear = Number(payload.birthYear);
    }
    if (coverFile.value) {
      payload.coverImageUrl = undefined;
    }
    let savedNode: GraphNodeItem | null = null;
    if (formMode.value === 'create') {
      savedNode = await createGraphNode(payload);
    } else if (activeNode.value) {
      savedNode = await updateGraphNode(activeNode.value.id, payload);
    }
    if (coverFile.value && savedNode) {
      const result = await submitImageMaterial({
        nodeId: savedNode.id,
        caption: form.coverImageCaption,
        file: coverFile.value,
      });
      if (result.media.previewUrl) {
        // 必须带上完整 payload：后端用 json_merge_patch 写 extra_attrs，
        // 只发封面字段会让 category/sourceName/sourceUrl/birthYear 被当成 null 删掉。
        savedNode = await updateGraphNode(savedNode.id, {
          ...payload,
          coverImageUrl: result.media.previewUrl,
          coverImageCaption: form.coverImageCaption,
        });
      }
    }
    modalOpen.value = false;
    resetCoverUpload();
    successMessage.value = formMode.value === 'create' ? '节点已创建' : '节点已更新';
    await load();
    if (detailNodeId.value) {
      detailNode.value = savedNode;
      await loadDetail();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '保存失败';
    error.value = translateSaveError(message);
  } finally {
    saving.value = false;
  }
}

function translateSaveError(message: string): string {
  const knownPatterns: Array<{ pattern: RegExp; text: string }> = [
    { pattern: /nodeCode is required|业务编码不能为空/, text: '请填写业务编码' },
    { pattern: /name is required|节点名称不能为空/, text: '请填写节点名称' },
    { pattern: /nodeTypeId is required|请选择节点类型/, text: '请选择节点类型' },
    { pattern: /nodeTypeId is invalid|节点类型不合法/, text: '节点类型不合法，请重新选择' },
    { pattern: /birthYear is invalid|出生年份不合法/, text: '出生年份不合法，请填写合理年份' },
    { pattern: /visibility is invalid|可见性不合法/, text: '可见性不合法，请重新选择' },
    { pattern: /auditStatus is invalid|审核状态不合法/, text: '审核状态不合法，请重新选择' },
    { pattern: /Node code already exists|节点编码已存在/, text: '业务编码已存在，请更换业务编码' },
    { pattern: /size must be between 0 and 96|长度不能超过 96/, text: '业务编码长度不能超过 96 个字符' },
    { pattern: /size must be between 0 and 128|长度不能超过 128/, text: '节点名称长度不能超过 128 个字符' },
    { pattern: /size must be between 0 and 1000|长度不能超过 1000/, text: '节点简介长度不能超过 1000 个字符' },
    { pattern: /Internal Server Error|后台服务暂时不可用/, text: '后台服务暂时不可用，请稍后重试' },
  ];
  for (const item of knownPatterns) {
    if (item.pattern.test(message)) return item.text;
  }
  return message || '保存失败，请检查填写内容后重试';
}

async function confirmDelete(node: GraphNodeItem) {
  deleteCandidate.value = node;
}

async function performDelete() {
  if (!deleteCandidate.value) return;
  saving.value = true;
  error.value = '';
  try {
    await deleteGraphNode(deleteCandidate.value.id);
    deleteCandidate.value = null;
    successMessage.value = '节点已删除，其关联关系边同时被移除';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除失败';
  } finally {
    saving.value = false;
  }
}

async function deleteSelected() {
  if (selectedIds.value.length === 0) return;
  const count = selectedIds.value.length;
  saving.value = true;
  error.value = '';
  batchDeleteOpen.value = false;
  try {
    await Promise.all(selectedIds.value.map((id) => deleteGraphNode(id)));
    selectedIds.value = [];
    successMessage.value = `已删除 ${count} 个节点，其关联关系边同时被移除`;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '批量删除失败';
  } finally {
    saving.value = false;
  }
}

function requestBatchDelete() {
  if (selectedIds.value.length === 0) return;
  error.value = '';
  successMessage.value = '';
  batchDeleteOpen.value = true;
}

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : nodes.value.map((node) => node.id);
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function localizedNodeText(value?: string | null) {
  if (!value) return '';
  return Object.entries(nodeTextTranslations).reduce(
    (text, [source, target]) => text.replaceAll(source, target),
    value,
  );
}

function localizedNodeCode(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/^unesco_element_(\d+)$/, '联合国名录项目-$1')
    .replace(/^hunan_unesco_([a-z]+)$/, '湖南名录项目-$1')
    .replace(/^hunan_region_([a-z]+)$/, '湖南市州-$1')
    .replace(/^hunan_inheritor_(\d+)$/, '湖南非遗传承人-$1')
    .replace(/^hunan_project_(\d+)$/, '湖南非遗项目-$1')
    .replace(/^ihchina_inheritor_(\d+)$/, '非遗传承人-$1')
    .replace(/^heritage_/, '非遗项目-');
}

function typeName(id?: number) {
  return localizedNodeText(nodeTypes.value.find((item) => item.id === id)?.typeName ?? '未分类');
}

function nodeMediaPreviewUrl(media: GraphNodeMediaItem) {
  return resolveMediaUrl(media.previewUrl || media.objectKey);
}

function nodeMediaTitle(media: GraphNodeMediaItem) {
  return localizedNodeText(media.caption || mediaTypeLabels[media.fileType] || '多媒体资料');
}

function nodeMediaSubTitle(media: GraphNodeMediaItem) {
  const readableName = media.originalName?.trim();
  const storagePath = media.objectKey?.trim();
  if (readableName && !storagePath?.endsWith(readableName)) {
    return localizedNodeText(readableName);
  }
  return media.contentType || '类型未记录';
}

function mediaFileToNodeMedia(file: MediaFileItem): GraphNodeMediaItem {
  return {
    linkId: file.id,
    id: file.id,
    fileId: file.id,
    bucketName: file.bucketName,
    objectKey: file.objectKey,
    originalName: file.originalName,
    fileType: file.fileType,
    contentType: file.contentType,
    fileSize: file.fileSize,
    previewUrl: file.previewUrl,
    caption: file.captions?.split(',').map((item) => item.trim()).filter(Boolean)[0],
    sortOrder: 0,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

function formatNodeMediaSize(value?: number) {
  const bytes = Number(value ?? 0);
  if (!bytes) return '大小未记录';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

watch(detailNodeId, loadDetail, { immediate: true });

onMounted(load);
onBeforeUnmount(resetCoverUpload);
</script>

<template>
  <section class="node-page">
    <template v-if="detailNodeId">
      <section class="node-detail-page">
        <header class="page-heading node-detail-heading">
          <div>
            <p class="eyebrow">节点详情</p>
            <h2>{{ detailNode ? localizedNodeText(detailNode.name) : '节点详情' }}</h2>
            <span>独立查看图谱节点的基础档案、前台详情展示内容和封面信息。</span>
          </div>
          <div class="heading-actions">
            <button class="secondary-action" type="button" @click="closeDetail">
              <ArrowLeft :size="16" />
              返回列表
            </button>
            <button v-if="detailNode" class="primary-action" type="button" @click="openEdit(detailNode)">
              <Edit3 :size="16" />
              编辑节点
            </button>
          </div>
        </header>

        <div v-if="detailError" class="inline-error">{{ detailError }}</div>
        <div v-if="error" class="inline-error">{{ error }}</div>
        <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

        <div v-if="detailLoading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载节点详情</span>
        </div>

        <article v-else-if="detailNode" class="node-detail-layout">
          <section class="node-detail-cover">
            <img
              v-if="detailNode.coverImageUrl"
              :src="detailNode.coverImageUrl"
              :alt="detailNode.coverImageCaption || detailNode.name"
            />
            <div v-else class="node-detail-cover-empty">
              <ImagePlus :size="32" />
              <span>未上传封面图片</span>
            </div>
            <small>{{ detailNode.coverImageCaption || '暂无封面说明' }}</small>
          </section>

          <section class="node-detail-info">
            <dl>
              <div>
                <dt>业务编码</dt>
                <dd>{{ localizedNodeCode(detailNode.nodeCode) }}</dd>
              </div>
              <div>
                <dt>节点类型</dt>
                <dd>{{ typeName(detailNode.nodeTypeId) }}</dd>
              </div>
              <div>
                <dt>地区</dt>
                <dd>{{ [detailNode.province, detailNode.city, detailNode.district].filter(Boolean).join(' / ') || '未设置' }}</dd>
              </div>
              <div>
                <dt>审核状态</dt>
                <dd>{{ statusLabels[detailNode.auditStatus] }}</dd>
              </div>
              <div>
                <dt>可见性</dt>
                <dd>{{ visibilityLabels[detailNode.visibility] }}</dd>
              </div>
              <div>
                <dt>保护级别</dt>
                <dd>{{ detailNode.projectLevel || '未设置' }}</dd>
              </div>
              <div v-if="detailNode.nodeTypeCode === 'inheritor'">
                <dt>出生年份</dt>
                <dd>{{ detailNode.birthYear || '未补充' }}</dd>
              </div>
              <div class="wide">
                <dt>简介</dt>
                <dd>{{ localizedNodeText(detailNode.summary) || '暂无简介' }}</dd>
              </div>
              <div class="wide">
                <dt>详细介绍</dt>
                <dd>{{ localizedNodeText(detailNode.content) || '暂无详细介绍' }}</dd>
              </div>
              <div class="wide">
                <dt>来源</dt>
                <dd>{{ detailNode.sourceName || detailNode.sourceUrl || '未设置' }}</dd>
              </div>
            </dl>
          </section>

          <section class="node-mounted-media">
            <div class="node-mounted-media-head">
              <div>
                <p class="eyebrow">挂接资源</p>
                <h3>节点已挂接资源</h3>
              </div>
              <span>{{ nodeRelatedMedia.length }} 项</span>
            </div>
            <p class="section-hint">这些资源来自多媒体档案的节点挂接关系，会同步体现在用户端节点详情的相关资料区域。</p>
            <div v-if="detailMediaLoading" class="chain-empty">
              <Loader2 :size="16" class="spin" />
              <span>正在读取节点挂接资源</span>
            </div>
            <div v-else-if="nodeRelatedMedia.length === 0" class="chain-empty">
              <FileText :size="16" />
              <span>当前节点还没有挂接媒体档案，可在多媒体档案中选择资源后挂接到该节点。</span>
            </div>
            <div v-else class="node-mounted-media-grid">
              <article v-for="media in nodeRelatedMedia" :key="media.linkId" class="node-mounted-media-card">
                <div class="node-mounted-media-preview" :class="media.fileType.toLowerCase()">
                  <img
                    v-if="media.fileType === 'IMAGE' && nodeMediaPreviewUrl(media)"
                    :src="nodeMediaPreviewUrl(media)"
                    :alt="nodeMediaTitle(media)"
                  />
                  <component v-else :is="mediaTypeIcons[media.fileType]" :size="26" />
                </div>
                <div>
                  <span>{{ mediaTypeLabels[media.fileType] }}</span>
                  <strong>{{ nodeMediaTitle(media) }}</strong>
                  <small>{{ formatNodeMediaSize(media.fileSize) }} · {{ nodeMediaSubTitle(media) }}</small>
                </div>
              </article>
            </div>
          </section>
        </article>
      </section>
    </template>

    <template v-else>
    <header class="page-heading">
      <div>
        <p class="eyebrow">图谱实体档案</p>
        <h2>图谱节点管理</h2>
        <span>维护非遗项目、传承人、地域、作品等知识图谱核心实体。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <FilePlus2 :size="17" />
          新增节点
        </button>
      </div>
    </header>

    <div v-if="error && !modalOpen" class="inline-error">
      {{ error }}
    </div>
    <div v-if="successMessage && !modalOpen" class="inline-success">
      {{ successMessage }}
    </div>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="名称、编码、简介" @keyup.enter="load" />
      </label>
      <label>
        <span>节点类型</span>
        <select v-model="filters.nodeTypeId">
          <option value="">全部类型</option>
          <option v-for="type in nodeTypes" :key="type.id" :value="type.id">{{ localizedNodeText(type.typeName) }}</option>
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
        <span>共 {{ filters.total }} 个节点</span>
        <button class="danger-action compact" type="button" :disabled="selectedIds.length === 0" @click="requestBatchDelete">
          <Trash2 :size="15" />
          批量删除<span v-if="selectedIds.length" class="delete-count">{{ selectedIds.length }}</span>
        </button>
      </div>

      <div v-if="loading" class="state-panel">
        <Loader2 :size="24" class="spin" />
        <span>正在加载节点档案</span>
      </div>

      <div v-else-if="nodes.length === 0" class="state-panel empty">
        <strong>暂无节点数据</strong>
        <span>可以先新增一个非遗项目或传承人节点，开始构建知识图谱。</span>
        <button class="primary-action compact" type="button" @click="openCreate">新增节点</button>
      </div>

      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th class="check-cell"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
              <th>封面</th>
              <th>节点名称</th>
              <th>类型</th>
              <th>地区</th>
              <th>审核状态</th>
              <th>可见性</th>
              <th>热度</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="node in nodes" :key="node.id">
              <td class="check-cell">
                <input v-model="selectedIds" type="checkbox" :value="node.id" />
              </td>
              <td>
                <img v-if="node.coverImageUrl" class="node-cover-thumb" :src="node.coverImageUrl" :alt="node.coverImageCaption || node.name" />
                <span v-else class="type-chip">未关联</span>
              </td>
              <td>
                <strong>{{ localizedNodeText(node.name) }}</strong>
                <small>{{ localizedNodeCode(node.nodeCode) }}</small>
              </td>
              <td>
                <span class="type-chip" :style="{ borderColor: node.nodeTypeColor || '#d7a84f' }">
                  {{ localizedNodeText(node.nodeTypeName) }}
                </span>
              </td>
              <td>{{ [node.province, node.city, node.district].filter(Boolean).join(' / ') || '未设置' }}</td>
              <td><span class="status-chip" :class="node.auditStatus.toLowerCase()">{{ statusLabels[node.auditStatus] }}</span></td>
              <td>{{ visibilityLabels[node.visibility] }}</td>
              <td>{{ node.popularityCount ?? 0 }}</td>
              <td>{{ node.updatedAt || '-' }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" title="查看详情" @click="openDetail(node)"><Eye :size="15" /></button>
                  <button type="button" title="编辑节点" @click="openEdit(node)"><Edit3 :size="15" /></button>
                  <button type="button" title="删除节点" @click="confirmDelete(node)"><Trash2 :size="15" /></button>
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
    </template>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="node-modal">
        <header>
          <div>
            <p class="eyebrow">{{ formMode === 'create' ? '新增节点' : '编辑节点' }}</p>
            <h3>{{ formMode === 'create' ? '新增图谱节点' : '编辑图谱节点' }}</h3>
          </div>
          <button class="icon-only" type="button" @click="modalOpen = false"><X :size="18" /></button>
        </header>

        <div v-if="error && modalOpen" class="inline-error modal-inline-error">
          <AlertTriangle :size="16" />
          <span>{{ error }}</span>
        </div>

        <p class="form-section-title">
          <span>基础档案</span>
          <small>业务编码、节点类型和审核状态会影响后台检索与图谱管理。</small>
        </p>
        <div class="form-grid">
          <label>
            <span>业务编码</span>
            <input v-model="form.nodeCode" :disabled="formMode === 'edit'" placeholder="heritage_suxiu" />
          </label>
          <label>
            <span>节点名称</span>
            <input v-model="form.name" placeholder="苏绣" />
          </label>
          <label>
            <span>别名</span>
            <input v-model="form.alias" placeholder="项目别名或俗称" />
          </label>
          <label>
            <span>节点类型</span>
            <select v-model="form.nodeTypeId" :disabled="formMode === 'edit'">
              <option v-for="type in nodeTypes" :key="type.id" :value="type.id">{{ localizedNodeText(type.typeName) }}</option>
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
            <span>省份</span>
            <input v-model="form.province" placeholder="江苏省" />
          </label>
          <label>
            <span>城市</span>
            <input v-model="form.city" placeholder="苏州市" />
          </label>
          <label>
            <span>区县</span>
            <input v-model="form.district" placeholder="姑苏区" />
          </label>
          <label>
            <span>历史时期</span>
            <input v-model="form.historicalPeriod" placeholder="明清以来" />
          </label>
          <label>
            <span>详细地址</span>
            <input v-model="form.address" placeholder="展示或传承地点" />
          </label>
          <label>
            <span>可见性</span>
            <select v-model="form.visibility">
              <option value="PUBLIC">公开</option>
              <option value="PRIVATE">私有</option>
            </select>
          </label>
        </div>

        <p class="form-section-title">
          <span>前台详情展示</span>
          <small>管理员可在这里修改用户端详情页展示的图片、摘要、正文和地区等级信息。</small>
        </p>
        <div class="form-grid">
          <label>
            <span>展示类别</span>
            <input v-model="form.category" placeholder="民俗 / 传统技艺 / 传统戏剧" />
          </label>
          <label>
            <span>保护级别</span>
            <input v-model="form.projectLevel" placeholder="国家级非遗" />
          </label>
          <label v-if="isInheritorForm">
            <span>出生年份</span>
            <input v-model.number="form.birthYear" type="number" min="1850" max="2100" placeholder="1958" />
          </label>
          <label class="wide cover-upload-control">
            <span>封面图片</span>
            <input type="file" accept="image/*" @change="handleCoverFileChange" />
            <div class="cover-upload-preview">
              <img
                v-if="coverPreviewUrl || form.coverImageUrl"
                :src="coverPreviewUrl || form.coverImageUrl"
                :alt="form.coverImageCaption || form.name || '封面图片预览'"
              />
              <div v-else>
                <ImagePlus :size="28" />
                <strong>选择本地图片上传</strong>
                <small>保存节点后自动作为详情页展示图</small>
              </div>
            </div>
          </label>
          <label>
            <span>封面图片说明</span>
            <input v-model="form.coverImageCaption" placeholder="例如：二十四节气展示图" />
          </label>
          <label>
            <span>数据来源名称</span>
            <input v-model="form.sourceName" placeholder="例如：中国非物质文化遗产网" />
          </label>
          <label>
            <span>来源链接</span>
            <input v-model="form.sourceUrl" placeholder="https://example.com/source" />
          </label>
          <label class="wide">
            <span>节点简介</span>
            <textarea v-model="form.summary" rows="4" placeholder="记录非遗实体的来源、技艺特点和保护信息" />
          </label>
          <label class="wide">
            <span>详细介绍</span>
            <textarea v-model="form.content" rows="7" placeholder="用于用户端非遗详情页的正文介绍" />
          </label>
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveNode">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存节点
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="deleteCandidate = null">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除节点？</h3>
        <p>
          「<strong>{{ localizedNodeText(deleteCandidate.name) }}</strong>」将从列表和图谱中移除，
          其<strong>全部关系边会被永久删除且无法恢复</strong>。
        </p>
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

    <div v-if="batchDeleteOpen" class="modal-backdrop" @click.self="batchDeleteOpen = false">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认批量删除节点？</h3>
        <p>
          将删除已勾选的 <strong>{{ selectedIds.length }}</strong> 个节点，它们关联的
          <strong>关系边会被永久删除且无法恢复</strong>。
        </p>
        <footer>
          <button class="secondary-action" type="button" @click="batchDeleteOpen = false">取消</button>
          <button class="danger-action" type="button" :disabled="saving" @click="deleteSelected">
            <Loader2 v-if="saving" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除 {{ selectedIds.length }} 个
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
