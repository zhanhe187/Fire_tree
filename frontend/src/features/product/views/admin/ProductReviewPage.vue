<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCcw,
  ScrollText,
  Search,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from 'lucide-vue-next';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { uploadMediaImage } from '../../../media/services/media';
import { ProductItem, ProductPayload, ProductStatus, createProduct, createProductReview, deleteProduct, fetchProduct, fetchProducts, updateProduct } from '../../services/product';
import { AdminUserItem, fetchAdminUsers } from '../../../admin/services/admin';
import { currentAuth, currentUser } from '../../../auth/services/authState';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';

type ModalMode = 'create' | 'edit';

const products = ref<ProductItem[]>([]);
const selectedProduct = ref<ProductItem | null>(null);
const nodeOptions = ref<GraphNodeItem[]>([]);
const accountOptions = ref<AdminUserItem[]>([]);
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const reviewing = ref(false);
const deletingId = ref<number | null>(null);
const statusSavingId = ref<number | null>(null);
const deleteCandidate = ref<ProductItem | null>(null);
const coverUploading = ref(false);
const modalOpen = ref(false);
const modalMode = ref<ModalMode>('create');
const error = ref('');
const successMessage = ref('');
const nodeSearchKeyword = ref('');
const coverPreviewUrl = ref('');

const filters = reactive({
  keyword: '',
  relatedNodeId: '' as number | '',
  status: '',
  sort: 'rating',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive({
  productCode: '',
  name: '',
  description: '',
  coverFileId: null as number | null,
  relatedNodeId: '' as number | '',
  ownerUserId: undefined as number | undefined,
  ownerUsername: '',
  externalUrl: '',
  price: 0,
  stock: 0,
  status: 'APPROVED' as ProductStatus,
});

const reviewForm = reactive({
  rating: 5,
  content: '',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const approvedCount = computed(() => products.value.filter((item) => item.status === 'APPROVED').length);
const reviewCount = computed(() => products.value.reduce((sum, item) => sum + Number(item.ratingCount ?? 0), 0));
const bestProduct = computed(() => [...products.value].sort((a, b) => Number(b.averageRating) - Number(a.averageRating))[0] ?? null);
const formMarkdownPreview = computed(() => renderMarkdown(form.description));
const selectedProductMarkdown = computed(() => renderMarkdown(selectedProduct.value?.description));
const isSuperAdmin = computed(() => currentAuth.value?.roles.some((role) => role.roleCode === 'SUPER_ADMIN') ?? false);

const statusLabels: Record<ProductStatus, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  APPROVED: '已上架',
  OFFLINE: '已下架',
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchProducts({ ...filters, backstage: true });
    products.value = response.items;
    filters.total = response.total;
    if (products.value.length > 0) {
      const currentId = selectedProduct.value?.id;
      const next = products.value.find((item) => item.id === currentId) ?? products.value[0];
      await selectProduct(next);
    } else {
      selectedProduct.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品加载失败';
  } finally {
    loading.value = false;
  }
}

async function selectProduct(product: ProductItem) {
  detailLoading.value = true;
  error.value = '';
  try {
    selectedProduct.value = await fetchProduct(product.id, { backstage: true });
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创详情加载失败';
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

/**
 * 归属账号只接受 sys_users.username，手填中文昵称会直接返回 400。
 * 这里改成从账号列表下拉选择，显示“昵称（用户名）”，从根源避免填错。
 */
async function loadAccountOptions() {
  if (!isSuperAdmin.value) {
    accountOptions.value = [];
    return;
  }
  try {
    const response = await fetchAdminUsers({ status: 1, page: 1, size: 200 });
    accountOptions.value = response.items.filter((item) => item.status === 1);
  } catch {
    accountOptions.value = [];
  }
}

function openCreate() {
  modalMode.value = 'create';
  coverPreviewUrl.value = '';
  Object.assign(form, {
    productCode: '',
    name: '',
    description: '',
    coverFileId: null,
    relatedNodeId: '',
    ownerUserId: undefined,
    ownerUsername: '',
    externalUrl: '',
    price: 0,
    stock: 0,
    status: 'APPROVED',
  });
  modalOpen.value = true;
}

/**
 * 下拉只列出启用账号；若产品原归属账号已被停用/删除，
 * 补一个占位选项，避免打开编辑时被“默认”覆盖掉归属。
 */
function ensureOwnerOption(username?: string) {
  if (!username) return;
  if (accountOptions.value.some((item) => item.username === username)) return;
  accountOptions.value = [
    { id: -1, username, nickname: `${username}（当前归属）`, userType: 'NORMAL' as const, status: 1 },
    ...accountOptions.value,
  ];
}

function openEdit(product: ProductItem) {
  modalMode.value = 'edit';
  coverPreviewUrl.value = product.coverUrl ?? '';
  if (isSuperAdmin.value) {
    ensureOwnerOption(product.ownerUsername);
  }
  Object.assign(form, {
    productCode: product.productCode,
    name: product.name,
    description: product.description ?? '',
    coverFileId: product.coverFileId ?? null,
    relatedNodeId: product.relatedNodeId ?? '',
    ownerUserId: isSuperAdmin.value ? product.ownerUserId : undefined,
    ownerUsername: isSuperAdmin.value ? product.ownerUsername ?? '' : '',
    externalUrl: product.externalUrl ?? '',
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    status: product.status,
  });
  selectedProduct.value = product;
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
    successMessage.value = modalMode.value === 'edit'
      ? '封面图已上传，保存产品后将在用户端同步显示'
      : '封面图已上传，保存产品后将在用户端显示';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '封面图上传失败';
  } finally {
    coverUploading.value = false;
    input.value = '';
  }
}

function productPayload(): ProductPayload {
  return {
    productCode: modalMode.value === 'edit' ? form.productCode : undefined,
    name: form.name,
    description: form.description,
    coverFileId: form.coverFileId,
    relatedNodeId: form.relatedNodeId === '' ? null : Number(form.relatedNodeId),
    ...(isSuperAdmin.value ? {
      ownerUserId: form.ownerUserId,
      ownerUsername: form.ownerUsername || null,
    } : {}),
    externalUrl: form.externalUrl,
    price: Number(form.price || 0),
    stock: Number(form.stock ?? 0),
    status: form.status,
  };
}

function validateForm(): string {
  const name = (form.name ?? '').trim();
  if (!name) return '请填写文创产品名称';
  if (name.length > 128) return '产品名称不能超过 128 个字符';
  if ((form.description ?? '').length > 4000) return '产品说明不能超过 4000 个字符';
  if ((form.externalUrl ?? '').length > 512) return '外链地址不能超过 512 个字符';
  const price = Number(form.price ?? 0);
  if (!Number.isFinite(price) || price < 0) return '价格必须是大于等于 0 的数字';
  const stock = Number(form.stock ?? 0);
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return '库存必须是大于等于 0 的整数';
  return '';
}

async function saveProduct() {
  const validationError = validateForm();
  if (validationError) {
    error.value = validationError;
    successMessage.value = '';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const saved = modalMode.value === 'create'
      ? await createProduct(productPayload())
      : await updateProduct(selectedProduct.value!.id, productPayload());
    modalOpen.value = false;
    successMessage.value = modalMode.value === 'create' ? '文创产品已创建' : '文创产品已更新';
    await load();
    await selectProduct(saved);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品保存失败';
  } finally {
    saving.value = false;
  }
}

/**
 * 上架 / 下架：只改 status，产品记录始终保留在后台，可随时切回来。
 * 与“删除”彻底分开——删除走 DELETE 接口，是物理删除且会连带清掉评价与挂接关系。
 */
async function togglePublish(product: ProductItem) {
  const nextStatus: ProductStatus = product.status === 'APPROVED' ? 'OFFLINE' : 'APPROVED';
  statusSavingId.value = product.id;
  error.value = '';
  successMessage.value = '';
  try {
    await updateProduct(product.id, {
      name: product.name,
      description: product.description ?? '',
      coverFileId: product.coverFileId ?? null,
      relatedNodeId: product.relatedNodeId ?? null,
      // 必须回传归属，否则后端会把 owner_user_id 覆盖成 null
      ...(isSuperAdmin.value
        ? { ownerUserId: product.ownerUserId, ownerUsername: product.ownerUsername ?? null }
        : {}),
      externalUrl: product.externalUrl ?? '',
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      status: nextStatus,
    });
    successMessage.value = nextStatus === 'OFFLINE'
      ? '文创产品已下架，仍保留在后台，可随时重新上架'
      : '文创产品已重新上架，用户端将重新展示';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : (nextStatus === 'OFFLINE' ? '文创产品下架失败' : '文创产品上架失败');
  } finally {
    statusSavingId.value = null;
  }
}

function requestDeleteProduct(product: ProductItem) {
  deleteCandidate.value = product;
}

function cancelDeleteProduct() {
  deleteCandidate.value = null;
}

async function performDeleteProduct() {
  const product = deleteCandidate.value;
  if (!product) return;
  deletingId.value = product.id;
  error.value = '';
  try {
    await deleteProduct(product.id);
    deleteCandidate.value = null;
    successMessage.value = '文创产品已永久删除，其评价与挂接关系一并移除';
    if (selectedProduct.value?.id === product.id) {
      selectedProduct.value = null;
    }
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品删除失败';
  } finally {
    deletingId.value = null;
  }
}

async function saveReview() {
  if (!selectedProduct.value) return;
  reviewing.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createProductReview(selectedProduct.value.id, {
      rating: reviewForm.rating,
      content: reviewForm.content,
    });
    reviewForm.content = '';
    successMessage.value = '评价已发布，评分已重新计算';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '评价发布失败，可能命中敏感词或已评价过该产品';
  } finally {
    reviewing.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.relatedNodeId = '';
  filters.status = '';
  filters.sort = 'rating';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function stars(value: number) {
  return Math.round(Number(value ?? 0));
}

function formatPrice(value?: number) {
  if (value === undefined || value === null) return '未定价';
  return `¥${Number(value).toFixed(2)}`;
}

onMounted(async () => {
  await Promise.all([load(), searchNodes(), loadAccountOptions()]);
});
</script>

<template>
  <section class="product-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">文创与评价</p>
        <h2>文创产品运营台</h2>
        <span>将文创产品绑定到非遗节点，维护封面、Markdown 说明、用户评分与评价。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <Plus :size="17" />
          新增文创
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <section class="product-stats">
      <article>
        <PackageCheck :size="20" />
        <span>产品总数</span>
        <strong>{{ filters.total }}</strong>
      </article>
      <article>
        <ShieldAlert :size="20" />
        <span>已上架</span>
        <strong>{{ approvedCount }}</strong>
      </article>
      <article>
        <Star :size="20" />
        <span>当前评价</span>
        <strong>{{ reviewCount }}</strong>
      </article>
      <article>
        <PackageCheck :size="20" />
        <span>最高评分</span>
        <strong>{{ Number(bestProduct?.averageRating ?? 0).toFixed(1) }}</strong>
      </article>
    </section>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="产品 / 关联节点 / 说明" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>关联节点</span>
        <select v-model.number="filters.relatedNodeId">
          <option value="">全部节点</option>
          <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
            {{ node.name }} / {{ node.nodeCode }}
          </option>
        </select>
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="APPROVED">已上架</option>
          <option value="PENDING">待审核</option>
          <option value="DRAFT">草稿</option>
          <option value="OFFLINE">已下架</option>
        </select>
      </label>
      <label>
        <span>排序</span>
        <select v-model="filters.sort">
          <option value="rating">评分优先</option>
          <option value="newest">最近更新</option>
          <option value="price">价格升序</option>
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

    <section class="product-workbench">
      <div class="product-main-column">
        <article class="table-panel product-table-panel">
        <div class="table-toolbar">
          <span>共 {{ filters.total }} 个文创产品</span>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
          </div>
  
          <div v-if="loading" class="state-panel">
            <Loader2 :size="24" class="spin" />
            <span>正在加载文创产品</span>
          </div>
  
          <div v-else-if="products.length === 0" class="state-panel empty">
            <PackageCheck :size="28" />
            <strong>暂无文创产品</strong>
          <span>先新增一个与非遗节点绑定的产品，再收集评分和评价。</span>
            <button class="primary-action compact" type="button" @click="openCreate">新增文创</button>
          </div>
  
          <div v-else class="data-table product-table">
            <table>
              <thead>
                <tr>
                  <th>产品</th>
                  <th>关联节点</th>
                  <th>价格</th>
                  <th>评分</th>
                <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in products"
                  :key="product.id"
                  :class="{ selected: selectedProduct?.id === product.id }"
                  @click="selectProduct(product)"
                >
                  <td>
                    <strong>{{ product.name }}</strong>
                    <small>{{ product.coverUrl ? '已配置展示图' : '未配置展示图' }}</small>
                  </td>
                  <td>
                  <strong>{{ product.relatedNodeName || '未绑定' }}</strong>
                  <small>{{ product.relatedNodeCode || '可在编辑中补齐' }}</small>
                  </td>
                  <td>{{ formatPrice(product.price) }}</td>
                  <td>
                    <span class="rating-stars">
                      <Star v-for="index in 5" :key="index" :size="14" :class="{ on: index <= stars(product.averageRating) }" />
                    </span>
                  <small>{{ Number(product.averageRating).toFixed(2) }} / {{ product.ratingCount }} 条</small>
                  </td>
                  <td>
                    <span class="status-chip" :class="product.status.toLowerCase()">{{ statusLabels[product.status] }}</span>
                  </td>
                  <td>
                    <div class="row-actions" @click.stop>
                      <button type="button" title="编辑" @click="openEdit(product)">
                        <Edit3 :size="15" />
                      </button>
                      <button
                        type="button"
                        :title="product.status === 'APPROVED' ? '下架（仍保留在后台，可重新上架）' : '上架（用户端重新展示）'"
                        :disabled="statusSavingId === product.id"
                        @click="togglePublish(product)"
                      >
                        <Loader2 v-if="statusSavingId === product.id" :size="15" class="spin" />
                        <EyeOff v-else-if="product.status === 'APPROVED'" :size="15" />
                        <Eye v-else :size="15" />
                        {{ product.status === 'APPROVED' ? '下架' : '上架' }}
                      </button>
                      <button class="danger-action compact" type="button" title="永久删除（不可恢复）" :disabled="deletingId === product.id" @click="requestDeleteProduct(product)">
                        <Loader2 v-if="deletingId === product.id" :size="15" class="spin" />
                        <Trash2 v-else :size="15" />
                        删除
                      </button>
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

        <!--
          评价表单与评价列表跟着"当前选中的产品"走，但放在表格下方一行两列：
          右栏只保留产品详情 + 产品档案后高度才装得下，不必再给右栏加内部滚动条。
        -->
        <div v-if="selectedProduct" class="product-review-block">
          <section class="side-section product-review-form">
            <h3>发布评价</h3>
            <p class="section-hint">评价用户：{{ currentUser?.nickname || currentUser?.username || '当前登录用户' }}</p>
            <label>
              <span>评分</span>
              <select v-model.number="reviewForm.rating">
                <option :value="5">5 星</option>
                <option :value="4">4 星</option>
                <option :value="3">3 星</option>
                <option :value="2">2 星</option>
                <option :value="1">1 星</option>
              </select>
            </label>
            <label>
              <span>评价内容</span>
              <textarea v-model="reviewForm.content" rows="4" placeholder="评价会先通过敏感词检查" />
            </label>
            <button class="primary-action" type="button" :disabled="reviewing" @click="saveReview">
              <Loader2 v-if="reviewing" :size="16" class="spin" />
              <Send v-else :size="16" />
              发布评价
            </button>
          </section>

          <section class="side-section">
            <h3>评价列表</h3>
            <div v-if="!selectedProduct.reviews?.length" class="chain-empty">
              <Star :size="16" />
              <span>暂无公开评价</span>
            </div>
            <div v-else class="product-review-list">
              <article v-for="review in selectedProduct.reviews" :key="review.id">
                <div>
                  <strong>{{ review.userName }}</strong>
                  <span class="rating-stars">
                    <Star v-for="index in 5" :key="index" :size="13" :class="{ on: index <= review.rating }" />
                  </span>
                </div>
                <p>{{ review.content || '未填写文字评价' }}</p>
              </article>
            </div>
          </section>
        </div>
      </div>

      <aside class="product-detail-panel">
        <div v-if="detailLoading" class="state-panel compact-state">
          <Loader2 :size="22" class="spin" />
          <span>正在加载产品详情</span>
        </div>

        <template v-else-if="selectedProduct">
          <section class="side-section product-hero">
            <img
              v-if="selectedProduct.coverUrl"
              class="product-admin-cover"
              :src="selectedProduct.coverUrl"
              :alt="selectedProduct.name"
            />
            <span class="status-chip" :class="selectedProduct.status.toLowerCase()">{{ statusLabels[selectedProduct.status] }}</span>
            <h3>{{ selectedProduct.name }}</h3>
            <div
              v-if="selectedProductMarkdown"
              class="markdown-body admin-product-markdown"
              v-html="selectedProductMarkdown"
            />
            <p v-else>暂无产品说明</p>
            <div class="product-score-ring">
              <strong>{{ Number(selectedProduct.averageRating).toFixed(1) }}</strong>
              <span>{{ selectedProduct.ratingCount }} 条评价</span>
            </div>
          </section>

          <section class="side-section media-detail-section">
            <h3>产品档案</h3>
            <dl>
              <div>
                <dt>关联节点</dt>
                <dd>{{ selectedProduct.relatedNodeName || '未绑定' }}</dd>
              </div>
              <div>
                <dt>运营主体</dt>
                <dd>{{ selectedProduct.ownerName || selectedProduct.ownerUsername || '-' }}</dd>
              </div>
              <div>
                <dt>价格</dt>
                <dd>{{ formatPrice(selectedProduct.price) }}</dd>
              </div>
              <div>
                <dt>库存</dt>
                <dd>{{ selectedProduct.stock ?? 0 }} 件</dd>
              </div>
            </dl>
            <div class="row-actions product-status-actions">
              <button
                type="button"
                :disabled="statusSavingId === selectedProduct.id"
                @click="togglePublish(selectedProduct)"
              >
                <Loader2 v-if="statusSavingId === selectedProduct.id" :size="15" class="spin" />
                <EyeOff v-else-if="selectedProduct.status === 'APPROVED'" :size="15" />
                <Eye v-else :size="15" />
                {{ selectedProduct.status === 'APPROVED' ? '下架（保留在后台）' : '重新上架' }}
              </button>
            </div>
          </section>
        </template>

        <div v-else class="state-panel compact-state">
          <PackageCheck :size="26" />
          <strong>选择一个文创产品</strong>
          <span>右侧会展示封面图、节点绑定与评分均值，评价表单在列表下方。</span>
        </div>
      </aside>
    </section>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="node-modal product-edit-modal">
        <header>
          <div>
            <p class="eyebrow">{{ modalMode === 'create' ? '新增文创产品' : '编辑文创产品' }}</p>
            <h3>{{ modalMode === 'create' ? '新建产品档案' : '维护产品档案' }}</h3>
          </div>
          <button class="icon-only" type="button" @click="modalOpen = false">
            <X :size="16" />
          </button>
        </header>

        <div class="form-grid">
          <label>
            <span>产品名称</span>
            <input v-model="form.name" type="text" placeholder="苏绣纹样手账" />
          </label>
          <label>
            <span>关联节点</span>
            <select v-model.number="form.relatedNodeId">
              <option value="">不绑定节点</option>
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
          <label v-if="isSuperAdmin">
            <span>归属账号</span>
            <select v-model="form.ownerUsername">
              <option value="">默认（使用当前管理员账号）</option>
              <option
                v-for="account in accountOptions"
                :key="account.id"
                :value="account.username"
              >
                {{ account.nickname || account.username }}（{{ account.username }}）
              </option>
            </select>
            <small class="field-hint">按登录用户名归属，不能填传承人姓名或昵称。</small>
          </label>
          <label>
            <span>价格</span>
            <input v-model.number="form.price" type="number" min="0" step="0.01" />
          </label>
          <label>
            <span>库存</span>
            <input v-model.number="form.stock" type="number" min="0" step="1" />
          </label>
          <label>
            <span>状态</span>
            <select v-model="form.status">
              <option value="APPROVED">已上架</option>
              <option value="PENDING">待审核</option>
              <option value="DRAFT">草稿</option>
              <option value="OFFLINE">已下架</option>
            </select>
          </label>
          <label class="wide">
            <span>外链</span>
            <input v-model="form.externalUrl" type="url" placeholder="https://example.com/product" />
          </label>
          <label class="wide cover-upload-control">
            <span>展示图片</span>
            <input type="file" accept="image/*" :disabled="coverUploading" @change="handleCoverFileChange" />
            <div class="cover-upload-preview">
              <img
                v-if="coverPreviewUrl"
                :src="coverPreviewUrl"
                :alt="form.name || '文创产品展示图预览'"
              />
              <div v-else>
                <ImagePlus :size="28" />
                <strong>{{ coverUploading ? '正在上传展示图' : '上传或更换文创展示图' }}</strong>
                <small>保存后，用户端文创列表与详情都会显示这张图片。</small>
              </div>
            </div>
          </label>
          <label class="wide product-markdown-editor">
            <span>产品说明（Markdown）</span>
            <textarea v-model="form.description" rows="9" placeholder="例如：&#10;## 工艺亮点&#10;- 手工装帧&#10;- 天然染色纸张&#10;&#10;**适合场景**：礼赠、研学纪念、日常记录" />
          </label>
          <section class="wide markdown-preview-panel">
            <div class="markdown-preview-title">
              <span>用户端预览</span>
              <small>将按 Markdown 渲染</small>
            </div>
            <div
              v-if="formMarkdownPreview"
              class="markdown-body admin-product-markdown"
              v-html="formMarkdownPreview"
            />
            <p v-else class="markdown-empty">输入产品说明后，这里会显示用户端可见效果。</p>
          </section>
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving || coverUploading" @click="saveProduct">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="cancelDeleteProduct">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认永久删除产品？</h3>
        <p>
          将永久删除「<strong>{{ deleteCandidate.name }}</strong>」，其评价、展览挂接与文章关联会一并移除，
          <strong>无法恢复</strong>。
        </p>
        <p class="confirm-modal-hint">只想让用户端不再展示，请改用列表中的「下架」——产品会保留在后台，可随时重新上架。</p>
        <footer>
          <button class="secondary-action" type="button" @click="cancelDeleteProduct">取消</button>
          <button class="danger-action" type="button" :disabled="deletingId === deleteCandidate.id" @click="performDeleteProduct">
            <Loader2 v-if="deletingId === deleteCandidate.id" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
