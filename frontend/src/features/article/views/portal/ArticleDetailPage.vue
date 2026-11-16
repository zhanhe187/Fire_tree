<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, CalendarDays, Loader2, Tag, UserRound } from 'lucide-vue-next';
import { ArticleItem, fetchArticle } from '../../services/article';
import { formatChinaDateTime } from '../../../../shared/utils/portalFormatting';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';
import '../../../../shared/styles/portalDetail.css';

const props = defineProps<{ articleId: string | number }>();
const router = useRouter();
const article = ref<ArticleItem | null>(null);
const loading = ref(false);
const error = ref('');
const coverLoadFailed = ref(false);

const typeLabels: Record<string, string> = {
  NEWS: '资讯',
  ACTIVITY: '活动',
  STUDY: '研学',
};

const articleCoverUrl = computed(() => {
  if (!article.value || coverLoadFailed.value) return '';
  return article.value.coverUrl || article.value.relatedNodeCoverUrl || '';
});

const articleIntro = computed(() => {
  if (!article.value) return '';
  return article.value.summary || article.value.content?.split(/\n+/).find((item) => item.trim()) || '';
});

const articleMarkdown = computed(() => renderMarkdown(article.value?.content));
const approvedProducts = computed(() => (article.value?.linkedProducts ?? []).filter((product) => product.status === 'APPROVED'));

async function load() {
  loading.value = true;
  error.value = '';
  coverLoadFailed.value = false;
  try {
    article.value = await fetchArticle(Number(props.articleId));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章详情加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.articleId, load);
</script>

<template>
  <main class="portal-detail-page museum-detail-page">
    <div class="detail-shell">
      <button class="detail-back-button" type="button" @click="router.push('/articles')">
        <ArrowLeft :size="18" />
        返回资讯研学
      </button>

      <div v-if="loading" class="portal-empty">
        <Loader2 :size="22" class="spin" />
        正在加载文章
      </div>
      <div v-else-if="error" class="portal-empty">{{ error }}</div>

      <article v-else-if="article" class="museum-detail-article portal-article-detail">
        <figure v-if="articleCoverUrl" class="detail-cover">
          <img :src="articleCoverUrl" :alt="article.title" @error="coverLoadFailed = true" />
        </figure>

        <header class="detail-header">
          <p class="label-tag">{{ typeLabels[article.articleType] }}</p>
          <h1>{{ article.title }}</h1>
          <div class="detail-meta-strip">
            <span><Tag :size="15" />{{ article.relatedNodeName || '非遗内容' }}</span>
            <span><CalendarDays :size="15" />{{ formatChinaDateTime(article.publishedAt || article.createdAt) }}</span>
            <span><UserRound :size="15" />{{ article.authorName || '内容运营' }}</span>
          </div>
          <p v-if="articleIntro" class="portal-detail-summary">{{ articleIntro }}</p>
          <div v-if="article.linkedNodes?.length" class="linked-node-chips">
            <button
              v-for="node in article.linkedNodes"
              :key="node.id"
              type="button"
              class="linked-node-chip"
              @click="router.push(`/heritage/${node.nodeId}`)"
            >
              {{ node.nodeName }}
              <small>{{ node.nodeTypeName }} / {{ node.nodeCode }}</small>
            </button>
          </div>
        </header>

        <section class="detail-complete-section">
          <div class="portal-detail-body">
            <div class="detail-section-heading">
              <span>正文记录</span>
              <h2>详细内容</h2>
            </div>
            <div v-if="articleMarkdown" class="markdown-body" v-html="articleMarkdown"></div>
            <p v-else>暂无正文内容。</p>
          </div>
        </section>

        <section v-if="article.linkedNodes?.length" class="portal-linked-nodes detail-complete-section">
          <h2>关联非遗项目</h2>
          <div class="linked-node-cards">
            <article
              v-for="node in article.linkedNodes"
              :key="node.id"
              class="linked-node-card"
              @click="router.push(`/heritage/${node.nodeId}`)"
            >
              <strong>{{ node.nodeName }}</strong>
              <span>{{ node.nodeTypeName }} / {{ node.nodeCode }}</span>
            </article>
          </div>
        </section>

        <section v-if="approvedProducts.length" class="portal-linked-products detail-complete-section">
          <div class="detail-section-heading">
            <span>关联文创</span>
            <h2>选购文创产品</h2>
          </div>
          <div class="linked-product-cards">
            <button v-for="product in approvedProducts" :key="product.id" type="button" class="linked-product-card" @click="router.push(`/products/${product.productId}`)">
              <img v-if="product.coverUrl" :src="product.coverUrl" :alt="product.productName" />
              <span><strong>{{ product.productName }}</strong><small>{{ product.description || product.productCode }}</small></span>
              <b>¥{{ product.price ?? 0 }}</b>
            </button>
          </div>
        </section>
      </article>
    </div>
  </main>
</template>
