<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';
import {
  Edit3,
  ImagePlus,
  Link2,
  Loader2,
  MapPinned,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next';
import { ExhibitionItem, ExhibitionPayload, createExhibition, deleteExhibition, fetchExhibition, fetchExhibitions, linkExhibitionNode, linkExhibitionProduct, unlinkExhibitionNode, unlinkExhibitionProduct, updateExhibition } from '../../services/exhibition';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { uploadMediaImage } from '../../../media/services/media';
import { ProductItem, fetchProducts } from '../../../product/services/product';

type ModalMode = 'create' | 'edit';

const exhibitions = ref<ExhibitionItem[]>([]);
const nodeOptions = ref<GraphNodeItem[]>([]);
const productOptions = ref<ProductItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref<number | null>(null);
const deleteCandidate = ref<ExhibitionItem | null>(null);
const modalOpen = ref(false);
const modalMode = ref<ModalMode>('create');
const error = ref('');
const successMessage = ref('');
const nodeLoadWarning = ref('');
const productLoadWarning = ref('');
const selectedExhibition = ref<ExhibitionItem | null>(null);
const showLinkPanel = ref(false);
const nodeLinkId = ref<number | ''>('');
const boothNo = ref('');
// 已挂接的节点不再进候选，避免重复挂接被后端唯一键拒绝（409 Conflict）；
// 展览自身的图谱节点（exhibition_market 类型）也不能挂——那会构成自环边。
const linkableNodeOptions = computed(() => {
  const linkedNodeIds = new Set((selectedExhibition.value?.linkedNodes ?? []).map((link) => link.nodeId));
  return nodeOptions.value.filter((node) => (
    !linkedNodeIds.has(node.id) && node.nodeTypeCode !== 'exhibition_market'
  ));
});
// 已挂接的文创也不再进候选：否则选中必被后端唯一键拒绝（409 Conflict）
const linkableProductOptions = computed(() => {
  const linkedProductIds = new Set(
    (selectedExhibition.value?.linkedProducts ?? []).map((link) => link.productId),
  );
  return productOptions.value.filter((product) => !linkedProductIds.has(product.id));
});
const nodeSearchKeyword = ref('');
const productLinkId = ref<number | ''>('');
const productSearchKeyword = ref('');
const coverUploading = ref(false);
const coverPreviewUrl = ref('');

const filters = reactive({
  keyword: '',
  province: '',
  city: '',
  status: '',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive<ExhibitionPayload>({
  title: '',
  description: '',
  coverFileId: null,
  province: '',
  city: '',
  address: '',
  longitude: null,
  latitude: null,
  startTime: null,
  endTime: null,
  organizer: '',
  status: 'DRAFT',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  OFFLINE: '已下线',
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchExhibitions({ ...filters, backstage: true });
    exhibitions.value = response.items;
    filters.total = response.total;
    if (selectedExhibition.value) {
      const next = exhibitions.value.find((item) => item.id === selectedExhibition.value?.id);
      if (next) {
        const keepLinkedNodes = selectedExhibition.value.linkedNodes;
        const keepLinkedProducts = selectedExhibition.value.linkedProducts;
        selectedExhibition.value = { ...next, linkedNodes: keepLinkedNodes, linkedProducts: keepLinkedProducts };
      } else {
        selectedExhibition.value = null;
        showLinkPanel.value = false;
      }
    } else if (exhibitions.value.length > 0) {
      await selectExhibition(exhibitions.value[0]);
    } else {
      selectedExhibition.value = null;
      showLinkPanel.value = false;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '展览列表加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadNodes() {
  nodeLoadWarning.value = '';
  try {
    const response = await fetchGraphNodes({ keyword: nodeSearchKeyword.value, auditStatus: 'APPROVED', page: 1, size: 500 });
    nodeOptions.value = response.items || [];
  } catch (err) {
    nodeLoadWarning.value = err instanceof Error ? err.message : '节点加载失败';
    nodeOptions.value = [];
  }
}

async function loadProducts() {
  productLoadWarning.value = '';
  try {
    // 挂接选择器走用户端产品目录：传承人可以挂接他人已上架的文创，
    // 传 backstage=true 会被后端按归属过滤成"只有自己的文创"。
    const response = await fetchProducts({ keyword: productSearchKeyword.value, status: 'APPROVED', page: 1, size: 50 });
    productOptions.value = response.items || [];
  } catch (err) {
    productLoadWarning.value = err instanceof Error ? err.message : '文创产品加载失败';
    productOptions.value = [];
  }
}

function openCreate() {
  modalMode.value = 'create';
  coverPreviewUrl.value = '';
  Object.assign(form, {
    title: '',
    description: '',
    coverFileId: null,
    province: '',
    city: '',
    address: '',
    longitude: null,
    latitude: null,
    startTime: null,
    endTime: null,
    organizer: '',
    status: 'DRAFT',
  });
  modalOpen.value = true;
}

function openEdit(item: ExhibitionItem) {
  modalMode.value = 'edit';
  coverPreviewUrl.value = item.coverUrl ?? '';
  Object.assign(form, {
    title: item.title,
    description: item.description ?? '',
    coverFileId: item.coverFileId ?? null,
    province: item.province ?? '',
    city: item.city ?? '',
    address: item.address ?? '',
    longitude: item.longitude ?? null,
    latitude: item.latitude ?? null,
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    organizer: item.organizer ?? '',
    status: item.status,
  });
  selectedExhibition.value = item;
  modalOpen.value = true;
}

async function handleCoverFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  coverUploading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const media = await uploadMediaImage(file);
    form.coverFileId = media.id;
    coverPreviewUrl.value = media.previewUrl ?? '';
    if (modalMode.value === 'edit' && selectedExhibition.value) {
      await updateExhibition(selectedExhibition.value.id, form);
      successMessage.value = '封面图已上传并保存，前台展览列表和详情页将同步显示。';
      await load();
    } else {
      successMessage.value = '封面图已上传，请保存展览后在前台显示。';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '封面图上传失败';
  } finally {
    coverUploading.value = false;
    input.value = '';
  }
}

async function saveExhibition() {
  if (!form.title?.trim()) {
    error.value = '标题不能为空';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    if (modalMode.value === 'create') {
      await createExhibition(form);
      successMessage.value = '展览已创建';
    } else if (selectedExhibition.value) {
      await updateExhibition(selectedExhibition.value.id, form);
      successMessage.value = '展览已更新';
    }
    modalOpen.value = false;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '展览保存失败';
  } finally {
    saving.value = false;
  }
}

function requestDeleteExhibition(item: ExhibitionItem) {
  deleteCandidate.value = item;
}

function cancelDeleteExhibition() {
  deleteCandidate.value = null;
}

async function performDeleteExhibition() {
  const item = deleteCandidate.value;
  if (!item) return;
  deletingId.value = item.id;
  error.value = '';
  try {
    await deleteExhibition(item.id);
    deleteCandidate.value = null;
    successMessage.value = '展览已删除';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '展览删除失败';
  } finally {
    deletingId.value = null;
  }
}

async function selectExhibition(item: ExhibitionItem) {
  nodeLinkId.value = '';
  productLinkId.value = '';
  boothNo.value = '';
  try {
    selectedExhibition.value = await fetchExhibition(item.id, { backstage: true });
  } catch {
    selectedExhibition.value = item;
  }
}

async function openLinkPanel(item: ExhibitionItem) {
  if (selectedExhibition.value?.id === item.id) {
    toggleLinkPanel();
    return;
  }
  showLinkPanel.value = false;
  await selectExhibition(item);
  showLinkPanel.value = true;
  void loadNodes();
  void loadProducts();
}

function toggleLinkPanel() {
  showLinkPanel.value = !showLinkPanel.value;
  if (showLinkPanel.value) {
    void loadNodes();
    void loadProducts();
  }
}

async function attachNode() {
  if (!selectedExhibition.value || nodeLinkId.value === '') return;
  saving.value = true;
  error.value = '';
  try {
    await linkExhibitionNode(selectedExhibition.value.id, {
      nodeId: Number(nodeLinkId.value),
      boothNo: boothNo.value || undefined,
    });
    successMessage.value = '节点已挂接';
    await load();
    nodeLinkId.value = '';
    boothNo.value = '';
    if (selectedExhibition.value) {
      await selectExhibition(selectedExhibition.value);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '节点挂接失败';
  } finally {
    saving.value = false;
  }
}

async function detachNode(nodeId: number) {
  if (!selectedExhibition.value) return;
  saving.value = true;
  error.value = '';
  try {
    await unlinkExhibitionNode(selectedExhibition.value.id, nodeId);
    successMessage.value = '节点已取消挂接';
    await load();
    if (selectedExhibition.value) {
      await selectExhibition(selectedExhibition.value);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消挂接失败';
  } finally {
    saving.value = false;
  }
}

async function attachProduct() {
  if (!selectedExhibition.value || productLinkId.value === '') return;
  saving.value = true;
  error.value = '';
  try {
    selectedExhibition.value = await linkExhibitionProduct(selectedExhibition.value.id, Number(productLinkId.value));
    productLinkId.value = '';
    successMessage.value = '文创产品已挂接';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品挂接失败';
  } finally {
    saving.value = false;
  }
}

async function detachProduct(productId: number) {
  if (!selectedExhibition.value) return;
  saving.value = true;
  error.value = '';
  try {
    await unlinkExhibitionProduct(selectedExhibition.value.id, productId);
    selectedExhibition.value = await fetchExhibition(selectedExhibition.value.id, { backstage: true });
    successMessage.value = '文创产品已取消挂接';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消文创产品挂接失败';
  } finally {
    saving.value = false;
  }
}

async function togglePublish(item: ExhibitionItem) {
  saving.value = true;
  error.value = '';
  try {
    await updateExhibition(item.id, {
      title: item.title,
      description: item.description,
      coverFileId: item.coverFileId ?? null,
      province: item.province,
      city: item.city,
      address: item.address,
      longitude: item.longitude,
      latitude: item.latitude,
      startTime: item.startTime,
      endTime: item.endTime,
      organizer: item.organizer,
      status: item.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED',
    });
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '状态切换失败';
  } finally {
    saving.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.province = '';
  filters.city = '';
  filters.status = '';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

onMounted(async () => {
  await load();
  await loadNodes().catch((err) => {
    nodeLoadWarning.value = err instanceof Error ? err.message : '可挂接节点加载失败，可稍后刷新重试';
  });
  await loadProducts();
});
</script>

<template>
  <section class="exhibition-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">展览市集</p>
        <h2>展览与市集管理</h2>
        <span>维护展览、市集、传播活动与非遗节点挂接关系。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <Plus :size="17" />
          新建展览
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="nodeLoadWarning" class="inline-warning">{{ nodeLoadWarning }}</div>
    <div v-if="productLoadWarning" class="inline-warning">{{ productLoadWarning }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="标题 / 地址 / 主办方" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>省份</span>
        <input v-model="filters.province" type="text" placeholder="江苏省" />
      </label>
      <label>
        <span>城市</span>
        <input v-model="filters.city" type="text" placeholder="苏州市" />
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">已发布</option>
          <option value="OFFLINE">已下线</option>
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

    <section class="exhibition-workbench">
      <article class="table-panel">
        <div class="table-toolbar">
          <span>共 {{ filters.total }} 条展览</span>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载展览</span>
        </div>

        <div v-else-if="exhibitions.length === 0" class="state-panel empty">
          <MapPinned :size="28" />
          <strong>暂无展览</strong>
          <span>可以先创建一个市集或展览，再挂接节点。</span>
          <button class="primary-action compact" type="button" @click="openCreate">新建展览</button>
        </div>

        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>地点</th>
                <th>时间</th>
                <th>节点数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in exhibitions"
                :key="item.id"
                :class="{ selected: selectedExhibition?.id === item.id }"
                @click="selectExhibition(item)"
              >
                <td>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.organizer || '-' }}</small>
                </td>
                <td>
                  <strong>{{ [item.province, item.city].filter(Boolean).join(' / ') || '未设置' }}</strong>
                  <small>{{ item.address || '-' }}</small>
                </td>
                <td>{{ item.startTime || '-' }} - {{ item.endTime || '-' }}</td>
                <td>{{ item.linkedNodeCount ?? 0 }}</td>
                <td><span class="status-chip" :class="item.status.toLowerCase()">{{ statusLabels[item.status] }}</span></td>
                <td>
                  <div class="row-actions" @click.stop>
                    <button type="button" title="编辑" @click="openEdit(item)"><Edit3 :size="15" /></button>
                    <button type="button" title="挂接节点" :class="{ active: selectedExhibition?.id === item.id && showLinkPanel }" @click="openLinkPanel(item)"><Link2 :size="15" /></button>
                    <button type="button" title="切换发布状态" @click="togglePublish(item)">{{ item.status === 'PUBLISHED' ? '下线' : '发布' }}</button>
                    <button type="button" title="删除" :disabled="deletingId === item.id" @click="requestDeleteExhibition(item)"><Trash2 :size="15" /></button>
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
      </article>

      <aside class="media-preview-panel">
        <template v-if="selectedExhibition">
          <section class="side-section">
            <p class="eyebrow">展览详情</p>
            <h3>{{ selectedExhibition.title }}</h3>
            <div v-if="selectedExhibition.coverUrl" class="cover-upload-preview">
              <img :src="selectedExhibition.coverUrl" :alt="selectedExhibition.title" />
            </div>
            <p>{{ selectedExhibition.description || '暂无介绍' }}</p>
            <dl>
              <div><dt>地点</dt><dd>{{ [selectedExhibition.province, selectedExhibition.city].filter(Boolean).join(' / ') || '未设置' }}</dd></div>
              <div><dt>地址</dt><dd>{{ selectedExhibition.address || '-' }}</dd></div>
              <div><dt>主办方</dt><dd>{{ selectedExhibition.organizer || '-' }}</dd></div>
            </dl>
          </section>

        </template>
      </aside>

      <section v-if="showLinkPanel && selectedExhibition" class="exhibition-link-panel">
        <header>
          <h3>挂接节点：{{ selectedExhibition.title }}</h3>
          <button class="icon-only" type="button" @click="showLinkPanel = false">
            <X :size="18" />
          </button>
        </header>
        <div class="link-panel-body">
          <section class="side-section">
            <h3>已挂接节点</h3>
            <div v-if="(selectedExhibition.linkedNodes ?? []).length === 0" class="chain-empty">
              <MapPinned :size="16" />
              <span>尚未挂接节点</span>
            </div>
            <div v-else class="linked-node-list">
              <article v-for="link in selectedExhibition.linkedNodes ?? []" :key="link.id">
                <span>
                  <strong>{{ link.nodeName }}</strong>
                  <small>{{ link.nodeCode }} / {{ link.nodeTypeName }}</small>
                  <small v-if="link.boothNo">{{ link.boothNo }}</small>
                </span>
                <button class="icon-only" type="button" title="取消挂接" :disabled="saving" @click="detachNode(link.nodeId)">
                  <Trash2 :size="15" />
                </button>
              </article>
            </div>
          </section>

          <section class="side-section">
            <h3>新增挂接</h3>
            <label>
              <span>节点搜索</span>
              <div class="inline-search">
                <input v-model="nodeSearchKeyword" type="search" placeholder="节点名称或编码" @keyup.enter="loadNodes" />
                <button class="secondary-action compact" type="button" @click="loadNodes">
                  <Search :size="15" />
                </button>
              </div>
            </label>
            <label>
              <span>节点</span>
              <select v-model="nodeLinkId">
                <option value="">请选择节点</option>
                <option v-for="node in linkableNodeOptions" :key="node.id" :value="node.id">{{ node.name }} / {{ node.nodeCode }}</option>
              </select>
              <small v-if="nodeOptions.length > 0 && linkableNodeOptions.length === 0">当前展览已挂接全部可搜索节点</small>
            </label>
            <label>
              <span>摊位号</span>
              <input v-model="boothNo" type="text" placeholder="A-12" />
            </label>
            <button class="primary-action" type="button" :disabled="saving || nodeLinkId === ''" @click="attachNode">
              <Loader2 v-if="saving" :size="16" class="spin" />
              <Plus v-else :size="16" />
              挂接节点
            </button>
          </section>

          <section class="side-section">
            <h3>已挂接文创产品</h3>
            <div v-if="!(selectedExhibition.linkedProducts ?? []).length" class="chain-empty">尚未挂接文创产品</div>
            <div v-else class="linked-node-list">
              <article v-for="product in selectedExhibition.linkedProducts ?? []" :key="product.id">
                <span><strong>{{ product.productName }}</strong><small>{{ product.productCode }} / ¥{{ product.price ?? 0 }}</small></span>
                <button class="icon-only" type="button" title="取消挂接" :disabled="saving" @click="detachProduct(product.productId)"><Trash2 :size="15" /></button>
              </article>
            </div>
            <label>
              <span>文创产品搜索</span>
              <div class="inline-search">
                <input v-model="productSearchKeyword" type="search" placeholder="产品名称或编码" @keyup.enter="loadProducts" />
                <button class="secondary-action compact" type="button" @click="loadProducts"><Search :size="15" /></button>
              </div>
            </label>
            <label>
              <span>文创产品</span>
              <select v-model="productLinkId">
                <option value="">请选择已审核产品</option>
                <option v-for="product in linkableProductOptions" :key="product.id" :value="product.id">{{ product.name }} / {{ product.productCode }}</option>
              </select>
            </label>
            <button class="primary-action" type="button" :disabled="saving || productLinkId === ''" @click="attachProduct">
              <Loader2 v-if="saving" :size="16" class="spin" /><Plus v-else :size="16" />挂接文创产品
            </button>
          </section>
        </div>
      </section>
    </section>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="node-modal">
        <header>
          <div>
            <p class="eyebrow">{{ modalMode === 'create' ? '新增展览' : '编辑展览' }}</p>
            <h3>{{ modalMode === 'create' ? '新建展览' : '编辑展览' }}</h3>
          </div>
          <button class="icon-only" type="button" @click="modalOpen = false"><X :size="18" /></button>
        </header>
        <div class="form-grid">
          <label class="wide">
            <span>标题</span>
            <input v-model="form.title" type="text" placeholder="苏绣展览市集" />
          </label>
          <label>
            <span>状态</span>
            <select v-model="form.status">
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
              <option value="OFFLINE">已下线</option>
            </select>
          </label>
          <label>
            <span>主办方</span>
            <input v-model="form.organizer" type="text" placeholder="文化馆 / 非遗中心" />
          </label>
          <label>
            <span>省份</span>
            <input v-model="form.province" type="text" />
          </label>
          <label>
            <span>城市</span>
            <input v-model="form.city" type="text" />
          </label>
          <label>
            <span>地址</span>
            <input v-model="form.address" type="text" />
          </label>
          <label>
            <span>开始时间</span>
            <input v-model="form.startTime" type="datetime-local" />
          </label>
          <label>
            <span>结束时间</span>
            <input v-model="form.endTime" type="datetime-local" />
          </label>
          <label class="wide cover-upload-control">
            <span>封面图片</span>
            <input type="file" accept="image/*" :disabled="coverUploading" @change="handleCoverFileChange" />
            <div class="cover-upload-preview">
              <img
                v-if="coverPreviewUrl"
                :src="coverPreviewUrl"
                :alt="form.title || '展览封面图预览'"
              />
              <div v-else>
                <ImagePlus :size="28" />
                <strong>{{ coverUploading ? '正在上传封面图' : '管理员可上传或更换封面图' }}</strong>
                <small>保存展览后，将在前台展览列表和详情页展示。</small>
              </div>
            </div>
          </label>
          <label class="wide">
            <span>介绍（支持 Markdown，包括 # 标题、- 列表、| 表格、``` 代码块）</span>
            <textarea v-model="form.description" rows="6" placeholder="展览或市集简介" />
          </label>
          <label class="wide">
            <span>介绍预览</span>
            <div class="markdown-preview markdown-body" v-html="renderMarkdown(form.description)" />
          </label>
        </div>
        <div v-if="error" class="inline-error modal-inline-error">
          {{ error }}
        </div>
        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveExhibition">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="cancelDeleteExhibition">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除展览？</h3>
        <p>将删除「<strong>《{{ deleteCandidate.title }}》</strong>」及其挂接节点关系。</p>
        <footer>
          <button class="secondary-action" type="button" @click="cancelDeleteExhibition">取消</button>
          <button class="danger-action" type="button" :disabled="deletingId === deleteCandidate.id" @click="performDeleteExhibition">
            <Loader2 v-if="deletingId === deleteCandidate.id" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
