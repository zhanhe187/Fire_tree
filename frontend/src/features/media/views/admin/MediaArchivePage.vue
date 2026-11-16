<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Archive,
  AudioLines,
  Edit3,
  File,
  FileImage,
  FileText,
  Film,
  Link2,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Unlink2,
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-vue-next';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { MediaFileItem, MediaFilePayload, auditMediaFile, createMediaFile, deleteMediaFile, fetchMediaFile, fetchMediaFiles, linkMediaNode, replaceMediaFileContent, unlinkMediaNode, updateMediaFile, uploadMediaFile } from '../../services/media';

type ModalMode = 'create' | 'edit';

const files = ref<MediaFileItem[]>([]);
const selectedFile = ref<MediaFileItem | null>(null);
const nodeOptions = ref<GraphNodeItem[]>([]);
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const linking = ref(false);
const deletingId = ref<number | null>(null);
const modalOpen = ref(false);
const modalMode = ref<ModalMode>('create');
const error = ref('');
const uploadError = ref('');
const uploading = ref(false);
const nodeSearchKeyword = ref('');
const uploadedFileId = ref<number | null>(null);

const filters = reactive({
  keyword: '',
  fileType: '',
  auditStatus: '',
  page: 1,
  size: 5,
  total: 0,
});

const form = reactive<MediaFilePayload>({
  bucketName: 'heritage-demo',
  objectKey: '',
  originalName: '',
  fileType: 'IMAGE',
  contentType: 'image/jpeg',
  fileSize: 0,
  checksum: '',
  previewUrl: '',
  visibility: 'PUBLIC',
  auditStatus: 'APPROVED',
});

const linkForm = reactive({
  nodeId: '' as number | '',
  caption: '',
  sortOrder: 0,
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const selectedLinks = computed(() => selectedFile.value?.linkedNodes ?? []);
// 已挂接的节点不再进候选：否则选中必被后端唯一键拒绝（409 Conflict）
const linkableNodeOptions = computed(() => {
  const linkedNodeIds = new Set(selectedLinks.value.map((link) => link.nodeId));
  return nodeOptions.value.filter((node) => !linkedNodeIds.has(node.id));
});

const typeLabels: Record<string, string> = {
  IMAGE: '图片',
  VIDEO: '视频',
  AUDIO: '音频',
  DOCUMENT: '文档',
  OTHER: '其他',
};

const statusLabels: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
};

const visibilityLabels: Record<string, string> = {
  PUBLIC: '公开',
  PRIVATE: '内部可见',
};

const mediaTextTranslations: Record<string, string> = {
  昆曲: '昆曲',
  古琴艺术: '古琴艺术',
  中国书法: '中国书法',
  端午节: '端午节',
  中医针灸: '中医针灸',
  二十四节气: '二十四节气',
  'UNESCO China official source item': 'UNESCO中国名录官方来源项',
  'official source item': '官方来源项',
};

const typeIcons = {
  IMAGE: FileImage,
  VIDEO: Film,
  AUDIO: AudioLines,
  DOCUMENT: FileText,
  OTHER: File,
};

function friendlyMediaName(file: Pick<MediaFileItem, 'originalName' | 'fileType' | 'contentType' | 'createdAt'>) {
  const name = file.originalName?.trim() ?? '';
  const looksSystemNamed = /(?:thumb|thumbnail|uploads?|local-upload|[0-9a-f]{8}-[0-9a-f-]{13,})/i.test(name);
  if (name && !looksSystemNamed) return localizedMediaText(name);
  const type = typeLabels[file.fileType] ?? '档案';
  const date = file.createdAt ? String(file.createdAt).slice(0, 10) : new Date().toLocaleDateString('zh-CN');
  return `${date}${type}资料`;
}

function uploadedFriendlyName(file: File, uploaded: MediaFileItem) {
  const type = typeLabels[uploaded.fileType] ?? '档案';
  const base = file.name.replace(/\.[^.]+$/, '').trim();
  const looksSystemNamed = /(?:thumb|thumbnail|[0-9a-f]{8}-[0-9a-f-]{13,})/i.test(base);
  return looksSystemNamed || !base ? `${new Date().toLocaleDateString('zh-CN')}${type}资料` : `${base}${type}资料`;
}

function nodeDetailUrl(nodeId: number) {
  return `/admin/graph/nodes/${nodeId}`;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchMediaFiles(filters);
    files.value = response.items;
    filters.total = response.total;
    if (files.value.length > 0) {
      const currentId = selectedFile.value?.id;
      const next = files.value.find((item) => item.id === currentId) ?? files.value[0];
      await selectFile(next);
    } else {
      selectedFile.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '媒体档案加载失败';
  } finally {
    loading.value = false;
  }
}

async function selectFile(file: MediaFileItem) {
  detailLoading.value = true;
  error.value = '';
  try {
    selectedFile.value = await fetchMediaFile(file.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '媒体详情加载失败';
  } finally {
    detailLoading.value = false;
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

function openCreate() {
  modalMode.value = 'create';
  uploadError.value = '';
  uploadedFileId.value = null;
  Object.assign(form, {
    bucketName: 'heritage-demo',
    objectKey: '',
    originalName: '',
    fileType: 'IMAGE',
    contentType: 'image/jpeg',
    fileSize: 0,
    checksum: '',
    previewUrl: '',
    visibility: 'PUBLIC',
    auditStatus: 'APPROVED',
  });
  modalOpen.value = true;
}

function openEdit(file: MediaFileItem) {
  modalMode.value = 'edit';
  uploadError.value = '';
  uploadedFileId.value = null;
  Object.assign(form, {
    bucketName: file.bucketName,
    objectKey: file.objectKey,
    originalName: file.originalName,
    fileType: file.fileType,
    contentType: file.contentType ?? '',
    fileSize: file.fileSize ?? 0,
    checksum: file.checksum ?? '',
    previewUrl: file.previewUrl ?? '',
    visibility: file.visibility,
    auditStatus: file.auditStatus,
  });
  selectedFile.value = file;
  modalOpen.value = true;
}

async function saveFile() {
  saving.value = true;
  error.value = '';
  try {
    if (!form.originalName?.trim()) {
      error.value = '请先填写文件名或上传多媒体文件';
      return;
    }
    const saved = modalMode.value === 'create'
      ? uploadedFileId.value
        ? await updateMediaFile(uploadedFileId.value, form)
        : await createMediaFile(form)
      : await updateMediaFile(selectedFile.value!.id, form);
    uploadedFileId.value = null;
    modalOpen.value = false;
    await load();
    await selectFile(saved);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '媒体档案保存失败';
  } finally {
    saving.value = false;
  }
}

async function closeModal() {
  // 新增弹窗里"选文件即入库"：取消时把这张刚上传但没保存的档案删掉，
  // 避免列表里留下没有节点挂接的幽灵档案。
  if (modalMode.value === 'create' && uploadedFileId.value) {
    const orphanId = uploadedFileId.value;
    uploadedFileId.value = null;
    modalOpen.value = false;
    try {
      await deleteMediaFile(orphanId);
      await load();
    } catch {
      // 删除失败不影响关闭：档案仍留在列表里，可手动清理
    }
    return;
  }
  modalOpen.value = false;
}

const deleteCandidate = ref<MediaFileItem | null>(null);

function requestDeleteFile(file: MediaFileItem) {
  deleteCandidate.value = file;
}

async function confirmDeleteFile() {
  const file = deleteCandidate.value;
  if (!file) return;
  deletingId.value = file.id;
  error.value = '';
  try {
    await deleteMediaFile(file.id);
    deleteCandidate.value = null;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '媒体档案删除失败';
  } finally {
    deletingId.value = null;
  }
}

const auditingId = ref<number | null>(null);

// 一键审核：通过会同时把可见性改为公开，避免只改审核状态导致图片永久不可见。
async function auditFile(file: MediaFileItem, action: 'APPROVE' | 'REJECT') {
  auditingId.value = file.id;
  error.value = '';
  try {
    await auditMediaFile(file.id, action);
    await load();
    if (selectedFile.value?.id === file.id) {
      selectedFile.value = await fetchMediaFile(file.id);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : (action === 'APPROVE' ? '审核通过失败' : '驳回失败');
  } finally {
    auditingId.value = null;
  }
}

async function attachNode() {
  if (!selectedFile.value || linkForm.nodeId === '') return;
  linking.value = true;
  error.value = '';
  try {
    await linkMediaNode(selectedFile.value.id, {
      nodeId: Number(linkForm.nodeId),
      caption: linkForm.caption,
      sortOrder: linkForm.sortOrder,
    });
    linkForm.nodeId = '';
    linkForm.caption = '';
    linkForm.sortOrder = 0;
    await selectFile(selectedFile.value);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '节点挂接失败';
  } finally {
    linking.value = false;
  }
}

async function detachNode(nodeId: number) {
  if (!selectedFile.value) return;
  linking.value = true;
  error.value = '';
  try {
    await unlinkMediaNode(selectedFile.value.id, nodeId);
    await selectFile(selectedFile.value);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消挂接失败';
  } finally {
    linking.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.fileType = '';
  filters.auditStatus = '';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function formatBytes(value?: number) {
  const bytes = Number(value ?? 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mediaPreviewLabel(file: MediaFileItem) {
  if (file.previewUrl) return file.previewUrl;
  return `${file.bucketName}/${file.objectKey}`;
}

async function handleArchiveUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  if (!file) return;
  uploading.value = true;
  uploadError.value = '';
  error.value = '';
  try {
    if (modalMode.value === 'edit' && selectedFile.value) {
      // replace the existing record's content in place; refresh form from the updated record
      const updated = await replaceMediaFileContent(selectedFile.value.id, file);
      Object.assign(form, {
        bucketName: updated.bucketName,
        objectKey: updated.objectKey,
        originalName: updated.originalName ?? form.originalName,
        fileType: updated.fileType,
        contentType: updated.contentType ?? file.type,
        fileSize: updated.fileSize ?? file.size,
        previewUrl: updated.previewUrl ?? '',
      });
    } else {
      const uploaded = await uploadMediaFile(file);
      uploadedFileId.value = uploaded.id;
      Object.assign(form, {
        bucketName: uploaded.bucketName,
        objectKey: uploaded.objectKey,
        originalName: uploadedFriendlyName(file, uploaded),
        fileType: uploaded.fileType,
        contentType: uploaded.contentType ?? file.type,
        fileSize: uploaded.fileSize ?? file.size,
        previewUrl: uploaded.previewUrl ?? '',
        visibility: uploaded.visibility,
        auditStatus: uploaded.auditStatus,
      });
    }
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : '文件上传失败';
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function localizedMediaText(value?: string | null) {
  if (!value) return '';
  return Object.entries(mediaTextTranslations).reduce(
    (text, [source, target]) => text.replaceAll(source, target),
    value,
  );
}

onMounted(async () => {
  await Promise.all([load(), searchNodes()]);
});
</script>

<template>
  <section class="media-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">多媒体档案</p>
        <h2>多媒体档案管理</h2>
        <span>管理图片、音视频与文档元数据，并将档案挂接到知识图谱节点。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <Plus :size="17" />
          新增档案
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="文件名 / 对象 Key / 关联节点" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>文件类型</span>
        <select v-model="filters.fileType">
          <option value="">全部类型</option>
          <option value="IMAGE">图片</option>
          <option value="VIDEO">视频</option>
          <option value="AUDIO">音频</option>
          <option value="DOCUMENT">文档</option>
          <option value="OTHER">其他</option>
        </select>
      </label>
      <label>
        <span>审核状态</span>
        <select v-model="filters.auditStatus">
          <option value="">全部状态</option>
          <option value="APPROVED">已通过</option>
          <option value="PENDING">待审核</option>
          <option value="REJECTED">已驳回</option>
        </select>
      </label>
      <div class="filter-actions">
        <button class="primary-action compact" type="button" @click="filters.page = 1; load()">
          <Search :size="16" />
          筛选
        </button>
        <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
      </div>
    </section>

    <section class="media-workbench">
      <article class="table-panel media-table-panel">
        <div class="table-toolbar">
          <span>共 {{ filters.total }} 条媒体档案</span>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载媒体档案</span>
        </div>

        <div v-else-if="files.length === 0" class="state-panel empty">
          <Archive :size="28" />
          <strong>暂无媒体档案</strong>
          <span>先登记一条图片、音频或文档元数据，再挂接到图谱节点进行测试。</span>
          <button class="primary-action compact" type="button" @click="openCreate">新增档案</button>
        </div>

        <div v-else class="media-card-list">
          <article
            v-for="file in files"
            :key="file.id"
            class="media-card"
            :class="{ selected: selectedFile?.id === file.id }"
            @click="selectFile(file)"
          >
            <div class="media-card-main">
              <div class="media-card-heading">
                <div class="media-card-file-copy">
                  <strong>{{ friendlyMediaName(file) }}</strong>
                  <small>{{ file.contentType || '-' }} · {{ formatBytes(file.fileSize) }}</small>
                </div>
                <div class="media-card-badges">
                  <span class="type-chip">
                    <component :is="typeIcons[file.fileType]" :size="14" />
                    {{ typeLabels[file.fileType] }}
                  </span>
                  <span class="status-chip" :class="file.auditStatus.toLowerCase()">
                    {{ statusLabels[file.auditStatus] }}
                  </span>
                </div>
              </div>

              <div class="media-card-association">
                <div class="media-card-summary">
                  <span>关联节点</span>
                  <strong :title="localizedMediaText(file.linkedNodeNames) || '未挂接'">
                    {{ localizedMediaText(file.linkedNodeNames) || '未挂接' }}
                  </strong>
                  <small>{{ file.linkedNodeCount ?? 0 }} 个节点</small>
                </div>
                <div class="media-card-summary">
                  <span>说明</span>
                  <small :title="localizedMediaText(file.captions) || ''">
                    {{ localizedMediaText(file.captions) || '暂无说明' }}
                  </small>
                </div>
              </div>

              <div class="media-card-storage">
                <span>对象存储</span>
                <small :title="`${file.bucketName}/${file.objectKey}`">
                  {{ file.bucketName }}/{{ file.objectKey }}
                </small>
              </div>
            </div>

            <div class="row-actions media-card-actions" @click.stop>
              <button
                v-if="file.auditStatus === 'PENDING'"
                type="button"
                title="审核通过并公开"
                :disabled="auditingId === file.id"
                @click="auditFile(file, 'APPROVE')"
              >
                <Loader2 v-if="auditingId === file.id" :size="15" class="spin" />
                <CheckCircle2 v-else :size="15" />
              </button>
              <button
                v-if="file.auditStatus === 'PENDING'"
                class="danger-icon"
                type="button"
                title="驳回"
                :disabled="auditingId === file.id"
                @click="auditFile(file, 'REJECT')"
              >
                <XCircle :size="15" />
              </button>
              <button type="button" title="编辑" @click="openEdit(file)">
                <Edit3 :size="15" />
              </button>
              <button
                class="danger-icon"
                type="button"
                title="删除资源"
                :disabled="deletingId === file.id"
                @click="requestDeleteFile(file)"
              >
                <Loader2 v-if="deletingId === file.id" :size="15" class="spin" />
                <Trash2 v-else :size="15" />
              </button>
            </div>
          </article>
        </div>

        <footer class="pagination">
          <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
          <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
        </footer>
      </article>

      <aside class="media-side-stack">
        <section class="media-preview-panel">
          <div v-if="detailLoading" class="state-panel compact-state">
            <Loader2 :size="22" class="spin" />
            <span>正在加载详情</span>
          </div>

          <template v-else-if="selectedFile">
            <div class="media-preview-box" :class="selectedFile.fileType.toLowerCase()">
              <img v-if="selectedFile.fileType === 'IMAGE' && selectedFile.previewUrl" :src="selectedFile.previewUrl" :alt="friendlyMediaName(selectedFile)" />
              <div v-else>
                <component :is="typeIcons[selectedFile.fileType]" :size="42" />
                <strong>{{ typeLabels[selectedFile.fileType] }}预览</strong>
                <small>{{ mediaPreviewLabel(selectedFile) }}</small>
              </div>
            </div>

            <section class="side-section media-detail-section">
              <h3>{{ friendlyMediaName(selectedFile) }}</h3>
              <dl>
              <div>
                <dt>大小与类型</dt>
                <dd>{{ formatBytes(selectedFile.fileSize) }} · {{ selectedFile.contentType || '-' }}</dd>
              </div>
              <div>
                <dt>可见性 / 审核</dt>
                <dd>{{ visibilityLabels[selectedFile.visibility] }} / {{ statusLabels[selectedFile.auditStatus] }}</dd>
              </div>
              </dl>
              <details class="media-technical-meta">
                <summary>查看技术信息</summary>
                <dl>
                <div>
                  <dt>对象 Key</dt>
                  <dd>{{ selectedFile.bucketName }}/{{ selectedFile.objectKey }}</dd>
                </div>
                </dl>
              </details>
            </section>

          </template>

          <div v-else class="state-panel compact-state">
            <Archive :size="26" />
            <strong>选择一个媒体档案</strong>
            <span>右侧会展示预览与对象存储信息，并提供节点挂接入口。</span>
          </div>
        </section>

        <section v-if="selectedFile && !detailLoading" class="media-link-management">
        <section class="side-section">
          <h3>关联节点</h3>
          <p class="section-hint">挂接后的媒体会显示在对应节点的资料、图片或附件区域，用来说明这份档案属于哪个非遗项目、传承人或作品。</p>
          <div v-if="selectedLinks.length === 0" class="chain-empty">
            <Unlink2 :size="16" />
            <span>尚未挂接图谱节点</span>
          </div>
          <div v-else class="linked-node-list">
            <article v-for="link in selectedLinks" :key="link.linkId">
              <span>
                <strong>{{ localizedMediaText(link.nodeName) }}</strong>
                <small>{{ link.nodeCode }} · {{ localizedMediaText(link.nodeTypeName) }}</small>
                <small v-if="link.caption">{{ localizedMediaText(link.caption) }}</small>
              </span>
              <div class="linked-node-actions">
                <a class="node-detail-link" :href="nodeDetailUrl(link.nodeId)" title="查看节点详情" target="_blank" rel="noreferrer">
                  <ExternalLink :size="15" />
                  查看详情
                </a>
                <button class="icon-only" type="button" title="取消挂接" :disabled="linking" @click="detachNode(link.nodeId)">
                  <Unlink2 :size="15" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="side-section link-node-form">
          <h3>挂接节点</h3>
          <p class="section-hint">用于把当前档案绑定到一个图谱节点，并可填写说明与排序，方便用户端按节点查看相关媒体。</p>
          <label>
            <span>搜索节点</span>
            <div class="inline-search">
              <input v-model="nodeSearchKeyword" type="search" placeholder="节点名称或编码" @keyup.enter="searchNodes" />
              <button class="secondary-action compact" type="button" @click="searchNodes">
                <Search :size="15" />
              </button>
            </div>
          </label>
          <label>
            <span>节点</span>
            <select v-model.number="linkForm.nodeId">
              <option value="">请选择节点</option>
              <option v-for="node in linkableNodeOptions" :key="node.id" :value="node.id">
                {{ localizedMediaText(node.name) }} / {{ node.nodeCode }}
              </option>
            </select>
          </label>
          <label>
            <span>说明</span>
            <input v-model="linkForm.caption" type="text" placeholder="如：工艺细节图、口述音频" />
          </label>
          <label>
            <span>排序</span>
            <input v-model.number="linkForm.sortOrder" type="number" min="0" />
          </label>
          <button class="primary-action" type="button" :disabled="linking || linkForm.nodeId === ''" @click="attachNode">
            <Loader2 v-if="linking" :size="16" class="spin" />
            <Link2 v-else :size="16" />
            挂接到当前档案
          </button>
        </section>
        </section>
      </aside>
    </section>

    <div v-if="modalOpen" class="modal-backdrop">
      <section class="node-modal">
        <header>
          <h3>{{ modalMode === 'create' ? '新增媒体档案' : '编辑媒体档案' }}</h3>
          <button class="icon-only" type="button" @click="closeModal">
            <X :size="16" />
          </button>
        </header>

        <div class="form-grid">
          <label class="wide cover-upload-control">
            <span>{{ modalMode === 'create' ? '上传多媒体文件' : '重新上传文件（可选，替换现有文件）' }}</span>
            <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" @change="handleArchiveUpload" />
            <div class="cover-upload-preview">
              <img
                v-if="form.fileType === 'IMAGE' && form.previewUrl"
                :src="form.previewUrl"
                :alt="form.originalName || '媒体预览'"
              />
              <div v-else>
                <Archive :size="28" />
                <strong>{{ uploading ? '上传中...' : (form.originalName || '选择文件上传') }}</strong>
                <small>{{ form.objectKey || '系统会自动生成存储路径和预览地址' }}</small>
              </div>
            </div>
            <small v-if="uploadError" class="inline-error">{{ uploadError }}</small>
          </label>
          <label>
            <span>文件名</span>
            <input v-model="form.originalName" type="text" placeholder="如：suxiu-detail.jpg" />
          </label>
          <label>
            <span>文件类型</span>
            <select v-model="form.fileType">
              <option value="IMAGE">图片</option>
              <option value="VIDEO">视频</option>
              <option value="AUDIO">音频</option>
              <option value="DOCUMENT">文档</option>
              <option value="OTHER">其他</option>
            </select>
          </label>
          <label>
            <span>存储桶</span>
            <input v-model="form.bucketName" type="text" placeholder="heritage-demo" />
          </label>
          <label>
            <span>文件大小（Byte）</span>
            <input v-model.number="form.fileSize" type="number" min="0" />
          </label>
          <label v-if="modalMode === 'edit'" class="wide">
            <span>对象路径</span>
            <input v-model="form.objectKey" type="text" placeholder="archive/suxiu-detail.jpg" />
          </label>
          <label>
            <span>内容类型</span>
            <input v-model="form.contentType" type="text" placeholder="image/jpeg" />
          </label>
          <label class="wide">
            <span>预览地址</span>
            <input v-model="form.previewUrl" type="url" placeholder="https://example.com/preview.jpg" />
          </label>
          <label>
            <span>可见性</span>
            <select v-model="form.visibility">
              <option value="PUBLIC">公开</option>
              <option value="PRIVATE">私有</option>
            </select>
          </label>
          <label>
            <span>审核状态</span>
            <select v-model="form.auditStatus">
              <option value="APPROVED">已通过</option>
              <option value="PENDING">待审核</option>
              <option value="REJECTED">已驳回</option>
            </select>
          </label>
        </div>

        <div v-if="error" class="inline-error modal-inline-error">
          {{ error }}
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="closeModal">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveFile">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="deleteCandidate = null">
      <section class="confirm-modal">
        <h3>确认删除媒体档案？</h3>
        <p>
          将永久删除「{{ deleteCandidate.originalName }}」，同时会解除它与节点的挂接，
          并把引用该文件的文创、文章、展览封面置空，<strong>不可恢复</strong>。
        </p>
        <footer>
          <button class="secondary-action" type="button" @click="deleteCandidate = null">取消</button>
          <button class="danger-action" type="button" :disabled="deletingId === deleteCandidate.id" @click="confirmDeleteFile">
            <Loader2 v-if="deletingId === deleteCandidate.id" :size="15" class="spin" />
            <Trash2 v-else :size="15" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
