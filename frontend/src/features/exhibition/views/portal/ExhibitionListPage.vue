<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, Building2, CalendarDays, Loader2, MapPin, MapPinned, Search } from 'lucide-vue-next';
import { ExhibitionItem, fetchExhibitions } from '../../services/exhibition';
import { excerptText, formatChinaDate, formatDateBadge, joinPresent } from '../../../../shared/utils/portalFormatting';
import '../../../../shared/styles/portalDirectory.css';

const router = useRouter();
const exhibitions = ref<ExhibitionItem[]>([]);
const loading = ref(false);
const error = ref('');
const failedCoverIds = ref(new Set<number>());

const filters = reactive({
  keyword: '',
  province: '',
  city: '',
  status: 'PUBLISHED',
  page: 1,
  size: 12,
  total: 0,
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchExhibitions(filters);
    exhibitions.value = response.items;
    filters.total = response.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '展览加载失败';
  } finally {
    loading.value = false;
  }
}

function openExhibition(item: ExhibitionItem) {
  void router.push(`/exhibitions/${item.id}`);
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function exhibitionPlace(item: ExhibitionItem) {
  return joinPresent([item.province, item.city]) || '地点待定';
}

function exhibitionSummary(item: ExhibitionItem) {
  return excerptText(item.description || item.address, 104) || '暂无展览介绍，点击进入查看活动详情。';
}

function exhibitionDateRange(item: ExhibitionItem) {
  const start = formatChinaDate(item.startTime);
  const end = formatChinaDate(item.endTime);
  if (start === '日期待定' && end === '日期待定') return '时间待定';
  return `${start} - ${end}`;
}

function exhibitionCoverUrl(item: ExhibitionItem) {
  if (failedCoverIds.value.has(item.id)) return '';
  return item.coverUrl || item.linkedNodeCoverUrl || '';
}

function handleExhibitionCoverError(item: ExhibitionItem) {
  const next = new Set(failedCoverIds.value);
  next.add(item.id);
  failedCoverIds.value = next;
}

onMounted(load);
</script>

<template>
  <main class="portal-page content-directory-page exhibition-directory-page">
    <div class="directory-shell">
      <section class="directory-hero">
        <div>
          <p class="directory-kicker">展览市集</p>
          <h1>正在发生的非遗展览、市集与传播活动</h1>
          <p>把线下展陈、市集摊位、主办机构和非遗项目挂接起来，方便顺着时间与地点找到真实发生的传承现场。</p>
        </div>
        <aside class="directory-stat-panel" aria-label="展览统计">
          <strong>{{ filters.total }}</strong>
          <span>当前发布的展览与市集活动，优先呈现时间、地点和关联项目。</span>
        </aside>
      </section>

      <section class="directory-toolbar" aria-label="展览筛选">
        <form class="directory-search" @submit.prevent="filters.page = 1; load()">
          <input v-model="filters.keyword" type="search" placeholder="搜索展览、市集、主办方或地点" aria-label="搜索展览" />
          <button type="submit"><Search :size="16" />搜索</button>
        </form>
      </section>
    </div>

    <div v-if="error" class="portal-empty">{{ error }}</div>
    <div v-else-if="loading" class="portal-empty">
      <Loader2 :size="22" class="spin" />
      正在加载展览
    </div>

    <section v-else class="directory-shell">
      <div class="directory-grid">
        <article
          v-for="item in exhibitions"
          :key="item.id"
          class="directory-card exhibition-card"
          role="link"
          tabindex="0"
          @click="openExhibition(item)"
          @keydown.enter.prevent="openExhibition(item)"
        >
          <header class="exhibition-card-head">
            <img
              v-if="exhibitionCoverUrl(item)"
              class="exhibition-card-cover"
              :src="exhibitionCoverUrl(item)"
              :alt="item.title"
              @error="handleExhibitionCoverError(item)"
            />
            <div class="date-badge" aria-label="开始日期">
              <strong>{{ formatDateBadge(item.startTime).day }}</strong>
              <span>{{ formatDateBadge(item.startTime).month }}</span>
              <small>{{ formatDateBadge(item.startTime).year }}</small>
            </div>
            <div>
              <span class="directory-region"><MapPinned :size="13" />{{ exhibitionPlace(item) }}</span>
              <h2>{{ item.title }}</h2>
            </div>
          </header>
          <div class="directory-card-body">
            <div class="directory-meta-row">
              <span class="directory-date"><CalendarDays :size="14" />{{ exhibitionDateRange(item) }}</span>
              <span class="directory-organizer"><Building2 :size="14" />{{ item.organizer || '非遗运营' }}</span>
            </div>
            <p>{{ exhibitionSummary(item) }}</p>
            <div class="directory-meta-row">
              <span v-if="item.address" class="directory-location"><MapPin :size="14" />{{ item.address }}</span>
              <span>{{ item.linkedNodeCount ?? 0 }} 个关联项目</span>
            </div>
            <span class="directory-card-action">查看详情 <ArrowRight :size="15" /></span>
          </div>
        </article>
      </div>
      <div v-if="exhibitions.length === 0" class="portal-empty">
        <MapPinned :size="24" />
        暂无已发布展览
      </div>
    </section>

    <footer class="directory-pagination">
      <button type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
      <span>{{ filters.page }} / {{ pageCount }}</span>
      <button type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
    </footer>
  </main>
</template>
