<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, BookOpen, CalendarDays, Loader2, RefreshCcw, Search, Tag } from 'lucide-vue-next';
import { ArticleItem, fetchArticles } from '../../services/article';
import { excerptText, formatChinaDate } from '../../../../shared/utils/portalFormatting';
import '../../../../shared/styles/portalDirectory.css';

const router = useRouter();
const articles = ref<ArticleItem[]>([]);
const loading = ref(false);
const error = ref('');
const failedCoverIds = ref(new Set<number>());

const filters = reactive({
  keyword: '',
  articleType: '',
  status: 'PUBLISHED',
  page: 1,
  size: 12,
  total: 0,
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));

const typeLabels: Record<string, string> = {
  NEWS: '资讯',
  ACTIVITY: '活动',
  STUDY: '研学',
};

const currentTypeLabel = computed(() => (filters.articleType ? typeLabels[filters.articleType] : '全部内容'));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchArticles(filters);
    articles.value = response.items;
    filters.total = response.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章加载失败';
  } finally {
    loading.value = false;
  }
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function setArticleType(type: string) {
  filters.articleType = type;
  filters.page = 1;
  void load();
}

function openArticle(article: ArticleItem) {
  void router.push(`/articles/${article.id}`);
}

function articleSummary(article: ArticleItem) {
  return excerptText(article.summary || article.content, 104) || '暂无摘要，点击进入查看完整内容。';
}

function articleDate(article: ArticleItem) {
  return formatChinaDate(article.publishedAt || article.createdAt);
}

function articleSource(article: ArticleItem) {
  return article.relatedNodeName || article.authorName || '非遗内容运营';
}

function articleCoverUrl(article: ArticleItem) {
  if (failedCoverIds.value.has(article.id)) return '';
  return article.coverUrl || article.relatedNodeCoverUrl || '';
}

function handleArticleCoverError(article: ArticleItem) {
  const next = new Set(failedCoverIds.value);
  next.add(article.id);
  failedCoverIds.value = next;
}

onMounted(load);
</script>

<template>
  <main class="portal-page content-directory-page article-directory-page">
    <div class="directory-shell">
      <section class="directory-hero">
        <div>
          <p class="directory-kicker">资讯研学</p>
          <h1>非遗资讯、活动与研学记录</h1>
          <p>以时间、项目和主题串联非遗新闻动态、研学观察与传播活动，让公众快速找到值得继续阅读的文化线索。</p>
        </div>
        <aside class="directory-stat-panel" aria-label="资讯统计">
          <strong>{{ filters.total }}</strong>
          <span>当前检索到的{{ currentTypeLabel }}，按发布时间排序展示。</span>
        </aside>
      </section>

      <section class="directory-toolbar" aria-label="资讯筛选">
        <form class="directory-search" @submit.prevent="filters.page = 1; load()">
          <input v-model="filters.keyword" type="search" placeholder="搜索标题、摘要或关联非遗项目" aria-label="搜索文章" />
          <button type="submit"><Search :size="16" />搜索</button>
        </form>
        <div class="directory-segments">
          <button type="button" :class="{ active: !filters.articleType }" @click="setArticleType('')">全部</button>
          <button type="button" :class="{ active: filters.articleType === 'NEWS' }" @click="setArticleType('NEWS')">资讯</button>
          <button type="button" :class="{ active: filters.articleType === 'ACTIVITY' }" @click="setArticleType('ACTIVITY')">活动</button>
          <button type="button" :class="{ active: filters.articleType === 'STUDY' }" @click="setArticleType('STUDY')">研学</button>
          <button type="button" aria-label="刷新资讯列表" @click="load"><RefreshCcw :size="15" /></button>
        </div>
      </section>
    </div>

    <div v-if="error" class="portal-empty">{{ error }}</div>
    <div v-else-if="loading" class="portal-empty">
      <Loader2 :size="22" class="spin" />
      正在加载内容
    </div>

    <section v-else class="directory-shell">
      <div class="directory-grid">
        <article
          v-for="article in articles"
          :key="article.id"
          class="directory-card article-card"
          role="link"
          tabindex="0"
          @click="openArticle(article)"
          @keydown.enter.prevent="openArticle(article)"
        >
          <figure class="article-cover">
            <img v-if="articleCoverUrl(article)" :src="articleCoverUrl(article)" :alt="article.title" @error="handleArticleCoverError(article)" />
            <div v-else class="article-cover-fallback" aria-hidden="true">
              <span>非遗</span>
            </div>
          </figure>
          <div class="directory-card-body">
            <div class="directory-tag-row">
              <span class="directory-tag"><Tag :size="13" />{{ typeLabels[article.articleType] }}</span>
              <span class="directory-date"><CalendarDays :size="14" />{{ articleDate(article) }}</span>
            </div>
            <h2>{{ article.title }}</h2>
            <p>{{ articleSummary(article) }}</p>
            <div class="directory-meta-row">
              <span>{{ articleSource(article) }}</span>
            </div>
            <span class="directory-card-action">继续阅读 <ArrowRight :size="15" /></span>
          </div>
        </article>
      </div>
      <div v-if="articles.length === 0" class="portal-empty">
        <BookOpen :size="24" />
        暂无已发布内容
      </div>
    </section>

    <footer class="directory-pagination">
      <button type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
      <span>{{ filters.page }} / {{ pageCount }}</span>
      <button type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
    </footer>
  </main>
</template>
