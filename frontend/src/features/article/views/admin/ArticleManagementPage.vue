<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';
import {
  Edit3,
  FileText,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-vue-next';
import { ArticleItem, ArticlePayload, ArticleNodeItem, createArticle, deleteArticle, fetchArticles, fetchArticle, linkArticleNode, linkArticleProduct, offlineArticle, publishArticle, unlinkArticleNode, unlinkArticleProduct, updateArticle } from '../../services/article';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { uploadMediaImage } from '../../../media/services/media';
import { ProductItem, fetchProducts } from '../../../product/services/product';

type ModalMode = 'create' | 'edit';

const articles = ref<ArticleItem[]>([]);
const nodeOptions = ref<GraphNodeItem[]>([]);
const productOptions = ref<ProductItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref<number | null>(null);
const modalOpen = ref(false);
const modalMode = ref<ModalMode>('create');
const error = ref('');
const successMessage = ref('');
const nodeLoadWarning = ref('');
const productLoadWarning = ref('');
const activeArticle = ref<ArticleItem | null>(null);
const coverUploading = ref(false);
const coverPreviewUrl = ref('');
const deleteCandidate = ref<ArticleItem | null>(null);
const selectedArticle = ref<ArticleItem | null>(null);
const nodeLinkId = ref<number | ''>('');
const nodeSearchKeyword = ref('');
const productLinkId = ref<number | ''>('');
const productSearchKeyword = ref('');
const showLinkPanel = ref(false);
const articleNodes = computed<ArticleNodeItem[]>(() => selectedArticle.value?.linkedNodes ?? []);
// 已挂接的节点不再进候选，避免重复挂接被后端唯一键拒绝（409 Conflict）
const linkableNodeOptions = computed(() => {
  const linkedNodeIds = new Set(articleNodes.value.map((link) => link.nodeId));
  return nodeOptions.value.filter((node) => !linkedNodeIds.has(node.id));
});
// 已挂接的文创同样不能再进候选，否则必被后端唯一键拒绝（409 Conflict）
const linkableProductOptions = computed(() => {
  const linkedProductIds = new Set(
    (selectedArticle.value?.linkedProducts ?? []).map((link) => link.productId),
  );
  return productOptions.value.filter((product) => !linkedProductIds.has(product.id));
});

const filters = reactive({
  keyword: '',
  articleType: '',
  status: '',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive<ArticlePayload>({
  title: '',
  summary: '',
  content: '',
  coverFileId: null,
  relatedNodeId: null,
  articleType: 'NEWS',
  status: 'DRAFT',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
// 详情栏正文：与用户端一致走 Markdown 渲染
const selectedArticleMarkdown = computed(() => renderMarkdown(selectedArticle.value?.content ?? ''));

const typeLabels: Record<string, string> = {
  NEWS: '资讯',
  ACTIVITY: '活动',
  STUDY: '研学',
};

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  OFFLINE: '已下线',
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchArticles({ ...filters, backstage: true });
    articles.value = response.items;
    filters.total = response.total;
    if (selectedArticle.value) {
      const next = articles.value.find((item) => item.id === selectedArticle.value?.id);
      if (next) {
        const keepLinkedNodes = selectedArticle.value.linkedNodes;
        const keepLinkedProducts = selectedArticle.value.linkedProducts;
        selectedArticle.value = { ...next, linkedNodes: keepLinkedNodes, linkedProducts: keepLinkedProducts };
      } else {
        selectedArticle.value = null;
        showLinkPanel.value = false;
      }
    }
    // 首次进入默认选中第一篇，右侧详情栏不留空
    if (!selectedArticle.value && articles.value.length > 0) {
      await selectArticle(articles.value[0]);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章列表加载失败';
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

async function selectArticle(article: ArticleItem) {
  nodeLinkId.value = '';
  productLinkId.value = '';
  try {
    selectedArticle.value = await fetchArticle(article.id, { backstage: true });
  } catch {
    selectedArticle.value = article;
  }
}

async function openLinkPanel(article: ArticleItem) {
  if (selectedArticle.value?.id === article.id) {
    toggleLinkPanel();
    return;
  }
  showLinkPanel.value = false;
  await selectArticle(article);
  showLinkPanel.value = true;
  void loadNodes();
  void loadProducts();
}

async function attachNode() {
  if (!selectedArticle.value || nodeLinkId.value === '') return;
  saving.value = true;
  error.value = '';
  try {
    await linkArticleNode(selectedArticle.value.id, { nodeId: Number(nodeLinkId.value) });
    successMessage.value = '节点已挂接';
    await load();
    nodeLinkId.value = '';
    if (selectedArticle.value) {
      await selectArticle(selectedArticle.value);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '节点挂接失败';
  } finally {
    saving.value = false;
  }
}

async function detachNode(nodeId: number) {
  if (!selectedArticle.value) return;
  saving.value = true;
  error.value = '';
  try {
    await unlinkArticleNode(selectedArticle.value.id, nodeId);
    successMessage.value = '节点已取消挂接';
    await load();
    if (selectedArticle.value) {
      await selectArticle(selectedArticle.value);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消挂接失败';
  } finally {
    saving.value = false;
  }
}

async function attachProduct() {
  if (!selectedArticle.value || productLinkId.value === '') return;
  saving.value = true;
  error.value = '';
  try {
    selectedArticle.value = await linkArticleProduct(selectedArticle.value.id, Number(productLinkId.value));
    productLinkId.value = '';
    successMessage.value = '文创产品已挂接';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品挂接失败';
  } finally {
    saving.value = false;
  }
}

async function detachProduct(productId: number) {
  if (!selectedArticle.value) return;
  saving.value = true;
  error.value = '';
  try {
    await unlinkArticleProduct(selectedArticle.value.id, productId);
    selectedArticle.value = await fetchArticle(selectedArticle.value.id, { backstage: true });
    successMessage.value = '文创产品已取消挂接';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消文创产品挂接失败';
  } finally {
    saving.value = false;
  }
}

function toggleLinkPanel() {
  showLinkPanel.value = !showLinkPanel.value;
  if (showLinkPanel.value) {
    void loadNodes();
    void loadProducts();
  }
}

function openCreate() {
  modalMode.value = 'create';
  activeArticle.value = null;
  coverPreviewUrl.value = '';
  Object.assign(form, {
    title: '',
    summary: '',
    content: '',
    coverFileId: null,
    relatedNodeId: null,
    articleType: 'NEWS',
    status: 'DRAFT',
  });
  modalOpen.value = true;
}

function openEdit(article: ArticleItem) {
  modalMode.value = 'edit';
  activeArticle.value = article;
  coverPreviewUrl.value = article.coverUrl ?? '';
  Object.assign(form, {
    title: article.title,
    summary: article.summary ?? '',
    content: article.content ?? '',
    coverFileId: article.coverFileId ?? null,
    relatedNodeId: article.relatedNodeId ?? null,
    articleType: article.articleType,
    status: article.status,
  });
  selectedArticle.value = article;
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
    if (modalMode.value === 'edit' && activeArticle.value) {
      await updateArticle(activeArticle.value.id, form);
      successMessage.value = '封面图已上传并保存，前台资讯列表和详情页将同步显示。';
      await load();
    } else {
      successMessage.value = '封面图已上传，请保存文章后在前台显示。';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '封面图上传失败';
  } finally {
    coverUploading.value = false;
    input.value = '';
  }
}

async function saveArticle() {
  if (!form.title?.trim() || !form.content?.trim()) {
    error.value = '标题和正文不能为空';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    if (modalMode.value === 'create') {
      await createArticle(form);
      successMessage.value = '文章已创建';
    } else if (activeArticle.value) {
      await updateArticle(activeArticle.value.id, form);
      successMessage.value = '文章已更新';
    }
    modalOpen.value = false;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章保存失败';
  } finally {
    saving.value = false;
  }
}

function requestDeleteArticle(article: ArticleItem) {
  deleteCandidate.value = article;
}

function cancelDeleteArticle() {
  deleteCandidate.value = null;
}

async function performDeleteArticle() {
  const article = deleteCandidate.value;
  if (!article) return;
  deletingId.value = article.id;
  error.value = '';
  try {
    await deleteArticle(article.id);
    deleteCandidate.value = null;
    successMessage.value = '文章已删除';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章删除失败';
  } finally {
    deletingId.value = null;
  }
}

async function togglePublish(article: ArticleItem) {
  saving.value = true;
  error.value = '';
  try {
    if (article.status === 'PUBLISHED') {
      await offlineArticle(article.id);
    } else {
      await publishArticle(article.id);
    }
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '发布状态切换失败';
  } finally {
    saving.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.articleType = '';
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
    nodeLoadWarning.value = err instanceof Error ? err.message : '关联节点加载失败，可稍后刷新重试';
  });
  await loadProducts();
});
</script>

<template>
  <section class="article-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">资讯运营</p>
        <h2>文章与内容发布</h2>
        <span>维护新闻、活动与研学内容，并控制发布状态与关联节点。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <Plus :size="17" />
          新建文章
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
        <input v-model="filters.keyword" type="search" placeholder="标题 / 摘要 / 正文 / 节点" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>类型</span>
        <select v-model="filters.articleType">
          <option value="">全部类型</option>
          <option value="NEWS">资讯</option>
          <option value="ACTIVITY">活动</option>
          <option value="STUDY">研学</option>
        </select>
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

    <section class="article-workbench">
      <article class="table-panel article-table-panel">
        <div class="table-toolbar">
          <span>共 {{ filters.total }} 篇文章</span>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载文章</span>
        </div>

        <div v-else-if="articles.length === 0" class="state-panel empty">
          <FileText :size="28" />
          <strong>暂无文章</strong>
          <span>可以先创建一篇资讯、活动或研学内容。</span>
          <button class="primary-action compact" type="button" @click="openCreate">新建文章</button>
        </div>

        <div v-else class="data-table article-table">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>类型</th>
                <th>关联节点</th>
                <th>状态</th>
                <th>发布时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="article in articles"
                :key="article.id"
                :class="{ selected: selectedArticle?.id === article.id }"
                @click="selectArticle(article)"
              >
                <td>
                  <strong>{{ article.title }}</strong>
                  <small>{{ article.summary || article.content?.slice(0, 42) || '-' }}</small>
                </td>
                <td>{{ typeLabels[article.articleType] }}</td>
                <td>
                  <strong>{{ article.relatedNodeName || '未关联' }}</strong>
                  <small>{{ article.relatedNodeCode || '-' }}</small>
                  <small v-if="article.linkedNodeCount">挂接 {{ article.linkedNodeCount }} 个节点</small>
                </td>
                <td><span class="status-chip" :class="article.status.toLowerCase()">{{ statusLabels[article.status] }}</span></td>
                <td>{{ article.publishedAt || article.createdAt || '-' }}</td>
                <td>
                  <div class="row-actions" @click.stop>
                    <button type="button" title="编辑" @click="openEdit(article)"><Edit3 :size="15" /></button>
                    <button type="button" title="挂接节点" :class="{ active: selectedArticle?.id === article.id && showLinkPanel }" @click="openLinkPanel(article)"><Link2 :size="15" /></button>
                    <button type="button" title="发布/下线" @click="togglePublish(article)"><Send :size="15" /></button>
                    <button type="button" title="删除" :disabled="deletingId === article.id" @click="requestDeleteArticle(article)"><Trash2 :size="15" /></button>
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

      <aside class="article-detail-panel">
        <section v-if="selectedArticle" class="side-section article-detail-hero">
          <img
            v-if="selectedArticle.coverUrl"
            class="article-detail-cover"
            :src="selectedArticle.coverUrl"
            :alt="selectedArticle.title"
          />
          <div class="detail-title-row">
            <h3>{{ selectedArticle.title }}</h3>
            <span class="status-chip" :class="selectedArticle.status.toLowerCase()">{{ statusLabels[selectedArticle.status] }}</span>
          </div>
          <div class="community-thread-actions">
            <span>{{ typeLabels[selectedArticle.articleType] }}</span>
            <span>{{ selectedArticle.relatedNodeName || '未关联节点' }}</span>
            <span v-if="selectedArticle.linkedNodeCount">挂接 {{ selectedArticle.linkedNodeCount }} 个节点</span>
          </div>
          <p class="section-hint">
            作者：{{ selectedArticle.authorName || '-' }}
            <template v-if="selectedArticle.publishedAt"> / 发布：{{ selectedArticle.publishedAt }}</template>
            <template v-else-if="selectedArticle.createdAt"> / 创建：{{ selectedArticle.createdAt }}</template>
          </p>
          <p v-if="selectedArticle.summary" class="article-detail-summary">{{ selectedArticle.summary }}</p>
        </section>

        <section v-if="selectedArticle" class="side-section">
          <h3>文章正文</h3>
          <div v-if="selectedArticleMarkdown" class="markdown-body article-detail-markdown" v-html="selectedArticleMarkdown" />
          <p v-else class="markdown-empty">这篇文章还没有正文内容，可在编辑弹窗中补充。</p>
        </section>

        <section v-if="selectedArticle" class="side-section">
          <h3>内容操作</h3>
          <div class="article-detail-actions">
            <button class="secondary-action compact" type="button" @click="openEdit(selectedArticle)">
              <Edit3 :size="15" />
              编辑
            </button>
            <button class="secondary-action compact" type="button" @click="openLinkPanel(selectedArticle)">
              <Link2 :size="15" />
              挂接节点
            </button>
            <button class="primary-action compact" type="button" @click="togglePublish(selectedArticle)">
              <Send :size="15" />
              {{ selectedArticle.status === 'PUBLISHED' ? '下线' : '发布' }}
            </button>
          </div>
        </section>

        <div v-else class="state-panel compact-state">
          <FileText :size="26" />
          <strong>选择一篇文章</strong>
          <span>右侧会展示封面、正文、关联节点与发布状态。</span>
        </div>
      </aside>
    </section>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="node-modal">
        <header>
          <div>
            <p class="eyebrow">{{ modalMode === 'create' ? '新增文章' : '编辑文章' }}</p>
            <h3>{{ modalMode === 'create' ? '新建内容' : '编辑内容' }}</h3>
          </div>
          <button class="icon-only" type="button" @click="modalOpen = false"><X :size="18" /></button>
        </header>
        <div class="form-grid">
          <label class="wide">
            <span>标题</span>
            <input v-model="form.title" type="text" placeholder="苏绣研学活动记录" />
          </label>
          <label>
            <span>类型</span>
            <select v-model="form.articleType">
              <option value="NEWS">资讯</option>
              <option value="ACTIVITY">活动</option>
              <option value="STUDY">研学</option>
            </select>
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
            <span>关联节点</span>
            <select v-model="form.relatedNodeId">
              <option :value="null">不关联</option>
              <option v-for="node in nodeOptions" :key="node.id" :value="node.id">{{ node.name }} / {{ node.nodeCode }}</option>
            </select>
          </label>
          <label class="wide">
            <span>摘要</span>
            <input v-model="form.summary" type="text" placeholder="概述内容重点" />
          </label>
          <label class="wide cover-upload-control">
            <span>封面图片</span>
            <input type="file" accept="image/*" :disabled="coverUploading" @change="handleCoverFileChange" />
            <div class="cover-upload-preview">
              <img
                v-if="coverPreviewUrl"
                :src="coverPreviewUrl"
                :alt="form.title || '文章封面图预览'"
              />
              <div v-else>
                <ImagePlus :size="28" />
                <strong>{{ coverUploading ? '正在上传封面图' : '管理员可上传或更换封面图' }}</strong>
                <small>保存文章后，将在前台资讯列表和详情页展示。</small>
              </div>
            </div>
          </label>
          <label class="wide">
            <span>正文（支持 Markdown，包括 # 标题、- 列表、| 表格、``` 代码块）</span>
            <textarea v-model="form.content" rows="8" placeholder="输入文章正文" />
          </label>
          <label class="wide">
            <span>正文预览</span>
            <div class="markdown-preview markdown-body" v-html="renderMarkdown(form.content)" />
          </label>
        </div>
        <div v-if="error" class="inline-error modal-inline-error">
          {{ error }}
        </div>
        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveArticle">
            <Loader2 v-if="saving" :size="16" class="spin" />
            保存
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="cancelDeleteArticle">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除文章？</h3>
        <p>将删除「<strong>《{{ deleteCandidate.title }}》</strong>」，该操作不可恢复。</p>
        <footer>
          <button class="secondary-action" type="button" @click="cancelDeleteArticle">取消</button>
          <button class="danger-action" type="button" :disabled="deletingId === deleteCandidate.id" @click="performDeleteArticle">
            <Loader2 v-if="deletingId === deleteCandidate.id" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>

    <section v-if="showLinkPanel && selectedArticle" class="article-link-panel">
      <header>
        <h3>挂接节点：{{ selectedArticle.title }}</h3>
        <button class="icon-only" type="button" @click="showLinkPanel = false">
          <X :size="18" />
        </button>
      </header>
      <div class="link-panel-body">
        <section class="side-section">
          <h3>已挂接节点</h3>
          <div class="linked-node-list">
            <article v-for="link in articleNodes" :key="link.id">
              <span>
                <strong>{{ link.nodeName }}</strong>
                <small>{{ link.nodeCode }} / {{ link.nodeTypeName }}</small>
              </span>
              <button class="icon-only" type="button" title="取消挂接" :disabled="saving" @click="detachNode(link.nodeId)">
                <Trash2 :size="15" />
              </button>
            </article>
            <div v-if="!articleNodes.length" class="chain-empty">
              <span>尚未挂接节点</span>
            </div>
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
            <small v-if="nodeOptions.length > 0 && linkableNodeOptions.length === 0">当前文章已挂接全部可搜索节点</small>
          </label>
          <button class="primary-action" type="button" :disabled="saving || nodeLinkId === ''" @click="attachNode">
            <Loader2 v-if="saving" :size="16" class="spin" />
            <Plus v-else :size="16" />
            挂接节点
          </button>
        </section>
        <section class="side-section">
          <h3>已挂接文创产品</h3>
          <div v-if="!(selectedArticle.linkedProducts ?? []).length" class="chain-empty">尚未挂接文创产品</div>
          <div v-else class="linked-node-list">
            <article v-for="product in selectedArticle.linkedProducts ?? []" :key="product.id">
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
</template>
