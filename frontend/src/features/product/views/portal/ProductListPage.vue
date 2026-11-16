<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  BadgeCheck,
  Loader2,
  MessageCircle,
  PackageCheck,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from 'lucide-vue-next';
import { fetchMediaFile } from '../../../media/services/media';
import { ProductItem, fetchProducts } from '../../services/product';
import { resolveMediaUrl } from '../../../../shared/utils/mediaUrl';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';
import '../../../../shared/styles/portalDirectory.css';

const router = useRouter();
const products = ref<ProductItem[]>([]);
const loading = ref(false);
const error = ref('');
const failedCoverIds = ref(new Set<number>());
const coverUrlByFileId = ref<Record<number, string>>({});

const filters = reactive({
  keyword: '',
  status: 'APPROVED',
  sort: 'rating',
  page: 1,
  size: 12,
  total: 0,
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const ratedProductCount = computed(() => products.value.filter((product) => Number(product.ratingCount ?? 0) > 0).length);
const averageCatalogScore = computed(() => {
  const rated = products.value.filter((product) => Number(product.ratingCount ?? 0) > 0);
  if (rated.length === 0) return '0.0';
  const total = rated.reduce((sum, product) => sum + Number(product.averageRating ?? 0), 0);
  return (total / rated.length).toFixed(1);
});

function stars(value: number) {
  return Math.max(0, Math.min(5, Math.round(Number(value ?? 0))));
}

function formatPrice(value?: number) {
  if (value === undefined || value === null) return '未定价';
  return `¥${Number(value).toFixed(2)}`;
}

function productInitial(name?: string) {
  return (name || '文').trim().slice(0, 1);
}

function plainTextFromMarkdown(value?: string) {
  const rendered = renderMarkdown(value).replace(/<[^>]+>/g, ' ');
  return rendered.replace(/\s+/g, ' ').trim();
}

function productSummary(product: ProductItem) {
  return plainTextFromMarkdown(product.description)
    || '暂无产品说明，等待上架方补充工艺、材质与使用场景。';
}

function productCoverUrl(product: ProductItem) {
  if (failedCoverIds.value.has(product.id)) return '';
  return resolveMediaUrl(product.coverUrl || (product.coverFileId ? coverUrlByFileId.value[product.coverFileId] : ''));
}

function handleCoverError(product: ProductItem) {
  const next = new Set(failedCoverIds.value);
  next.add(product.id);
  failedCoverIds.value = next;
}

function sortLabel(value: string) {
  if (value === 'newest') return '最近更新';
  if (value === 'price') return '价格升序';
  return '评分优先';
}

function openProduct(product: ProductItem) {
  void router.push(`/products/${product.id}`);
}

async function loadProducts() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchProducts(filters);
    products.value = response.items;
    filters.total = response.total;
    const missingCoverFileIds = [...new Set(response.items
      .filter((product) => !product.coverUrl && product.coverFileId)
      .map((product) => product.coverFileId as number))];
    await Promise.all(missingCoverFileIds.map(async (fileId) => {
      if (coverUrlByFileId.value[fileId]) return;
      try {
        const media = await fetchMediaFile(fileId);
        coverUrlByFileId.value = {
          ...coverUrlByFileId.value,
          [fileId]: media.previewUrl ?? '',
        };
      } catch {
        coverUrlByFileId.value = {
          ...coverUrlByFileId.value,
          [fileId]: '',
        };
      }
    }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品加载失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void loadProducts();
}

onMounted(loadProducts);
</script>

<template>
  <section class="portal-page content-directory-page product-portal-page">
    <section class="directory-hero product-hero-panel">
      <div>
        <p class="label-tag">文创产品</p>
        <h1>非遗文创评分</h1>
        <p>查看后台上架的非遗文创，进入详情页留下真实使用体验、工艺印象与改进建议。</p>
      </div>
      <div class="product-hero-metrics">
        <article>
          <ShoppingBag :size="20" />
          <span>上架产品</span>
          <strong>{{ filters.total }}</strong>
        </article>
        <article>
          <Star :size="20" />
          <span>目录均分</span>
          <strong>{{ averageCatalogScore }}</strong>
        </article>
        <article>
          <MessageCircle :size="20" />
          <span>已有评价</span>
          <strong>{{ ratedProductCount }}</strong>
        </article>
      </div>
    </section>

    <div v-if="error" class="portal-list-state error">{{ error }}</div>

    <section class="directory-toolbar product-filter-panel">
      <div class="product-catalog-head">
        <span>文创目录</span>
        <strong>{{ filters.total }} 件产品 · {{ sortLabel(filters.sort) }}</strong>
      </div>
      <label>
        <span>关键词</span>
        <div class="product-search-field">
          <Search :size="16" />
          <input
            v-model="filters.keyword"
            type="search"
            placeholder="搜索产品或关联非遗节点"
            @keyup.enter="filters.page = 1; loadProducts()"
          />
        </div>
      </label>
      <label>
        <span>排序</span>
        <select v-model="filters.sort" @change="filters.page = 1; loadProducts()">
          <option value="rating">评分优先</option>
          <option value="newest">最近更新</option>
          <option value="price">价格升序</option>
        </select>
      </label>
      <button class="btn compact solid" type="button" @click="filters.page = 1; loadProducts()">
        <SlidersHorizontal :size="16" />
        筛选
      </button>
    </section>

    <div v-if="loading" class="portal-list-state">
      <Loader2 :size="20" class="spin" />
      正在加载文创产品
    </div>

    <section v-else class="product-catalog-panel">
      <div v-if="products.length === 0" class="portal-empty">
        <PackageCheck :size="28" />
        <strong>暂无上架文创</strong>
        <span>可以调整关键词，或等待后台发布新的非遗文创产品。</span>
      </div>
      <div v-else class="directory-grid">
        <article
          v-for="product in products"
          :key="product.id"
          class="directory-card product-card"
          role="link"
          tabindex="0"
          @click="openProduct(product)"
          @keydown.enter.prevent="openProduct(product)"
        >
          <figure class="product-card-cover">
            <img
              v-if="productCoverUrl(product)"
              :src="productCoverUrl(product)"
              :alt="product.name"
              loading="lazy"
              @error="handleCoverError(product)"
            />
            <span v-else>{{ productInitial(product.name) }}</span>
            <BadgeCheck v-if="product.relatedNodeName" :size="17" />
          </figure>
          <div class="product-card-body">
            <div>
              <small>{{ product.relatedNodeName || '未绑定非遗节点' }}</small>
              <h2>{{ product.name }}</h2>
            </div>
            <p>{{ productSummary(product) }}</p>
            <div class="product-meta-grid">
              <span>
                <strong>{{ formatPrice(product.price) }}</strong>
                参考价格
              </span>
              <span>
                <strong>{{ Number(product.averageRating ?? 0).toFixed(1) }}</strong>
                平均分
              </span>
              <span>
                <strong>{{ product.ratingCount }}</strong>
                条评价
              </span>
            </div>
            <div class="rating-row">
              <div class="rating-stars">
                <Star v-for="index in 5" :key="index" :size="15" :class="{ on: index <= stars(product.averageRating) }" />
              </div>
              <small>{{ product.updatedAt || '等待更新' }}</small>
            </div>
            <span class="directory-card-action">查看详情 <ArrowRight :size="15" /></span>
          </div>
        </article>
      </div>
    </section>

    <footer class="directory-pagination">
      <button type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
      <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
      <button  type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
    </footer>
  </section>
</template>
