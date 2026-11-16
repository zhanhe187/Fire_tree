<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trophy,
} from 'lucide-vue-next';
import { LearningCheckinItem, LearningCheckinResponse, LearningHotItem, LearningRecommendationResponse, createLearningCheckin, fetchDailyRecommendation, fetchLearningCheckins, fetchLearningHot, generateDailyRecommendation } from '../../services/learning';
import { authSession, currentUser } from '../../../auth/services/authState';
import { formatLocalDate, formatLocalMonth, shiftLocalMonth } from '../../../../shared/utils/localDate';

const props = defineProps<{
  currentUserId?: number | null;
}>();

const router = useRouter();

const recommendation = ref<LearningRecommendationResponse | null>(null);
const hotItems = ref<LearningHotItem[]>([]);
const checkins = ref<LearningCheckinResponse | null>(null);
const loading = ref(false);
const generating = ref(false);
const checkingIn = ref(false);
const error = ref('');
const successMessage = ref('');

// 必须用本地日期：toISOString() 是 UTC，UTC+8 每天 00:00–07:59 会取到昨天
const todayText = formatLocalDate();
const currentMonth = formatLocalMonth();

const filters = reactive({
  date: todayText,
  month: currentMonth,
});

const recommendationPager = reactive({
  page: 1,
  size: 3,
});

const checkedByDate = computed(() => {
  const map = new Map<string, LearningCheckinItem>();
  for (const item of checkins.value?.items ?? []) {
    map.set(item.checkinDate, item);
  }
  return map;
});

const calendarDays = computed(() => {
  const [year, month] = filters.month.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const date = `${filters.month}-${String(day).padStart(2, '0')}`;
    const checkin = checkedByDate.value.get(date);
    return {
      day,
      date,
      checked: Boolean(checkin),
      continuousDays: checkin?.continuousDays ?? 0,
    };
  });
});

const topRecommendation = computed(() => recommendation.value?.items[0] ?? null);
const visibleHotItems = computed(() => hotItems.value.slice(0, 5));
const activeUserId = computed(() => currentUser.value?.id ?? props.currentUserId ?? 0);
const currentUserName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '未登录用户');
const isSignedIn = computed(() => Boolean(authSession.token && activeUserId.value));
const checkedToday = computed(() => checkedByDate.value.has(todayText));
const isBrowsingCurrentMonth = computed(() => filters.month === currentMonth);
const checkedDaysText = computed(() =>
  isBrowsingCurrentMonth.value
    ? `本月已打卡 ${checkins.value?.total ?? 0} 天`
    : `该月已打卡 ${checkins.value?.total ?? 0} 天`,
);
const recommendationPageCount = computed(() => Math.max(1, Math.ceil((recommendation.value?.items.length ?? 0) / recommendationPager.size)));
const pagedRecommendations = computed(() => {
  const start = (recommendationPager.page - 1) * recommendationPager.size;
  return recommendation.value?.items.slice(start, start + recommendationPager.size) ?? [];
});

async function loadRecommendation() {
  recommendation.value = await fetchDailyRecommendation(filters.date);
  recommendationPager.page = 1;
}

async function loadHot() {
  const response = await fetchLearningHot(8);
  hotItems.value = response.items;
}

async function requireLogin(action: string) {
  if (isSignedIn.value) return true;
  error.value = `请先登录后再${action}`;
  await router.push({ path: '/login', query: { redirect: '/favorites/checkin' } });
  return false;
}

async function loadCheckins() {
  const userId = activeUserId.value;
  if (!userId) {
    checkins.value = {
      userId: 0,
      month: filters.month,
      total: 0,
      currentStreak: 0,
      items: [],
    };
    return;
  }
  checkins.value = await fetchLearningCheckins({
    userId,
    month: filters.month,
  });
}

async function loadAll() {
  loading.value = true;
  error.value = '';
  const failures: string[] = [];
  await Promise.all([
    loadRecommendation().catch((err) => failures.push(err instanceof Error ? err.message : '推荐数据加载失败')),
    loadHot().catch((err) => failures.push(err instanceof Error ? err.message : '热门榜加载失败')),
    loadCheckins().catch((err) => {
      checkins.value = {
        userId: activeUserId.value,
        month: filters.month,
        total: 0,
        currentStreak: 0,
        items: [],
      };
      failures.push(err instanceof Error ? err.message : '打卡日历加载失败');
    }),
  ]);
  if (failures.length > 0) {
    error.value = failures[0];
  }
  loading.value = false;
}

async function generateToday() {
  generating.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    recommendation.value = await generateDailyRecommendation({ date: filters.date, limit: 6 });
    recommendationPager.page = 1;
    await loadHot();
    successMessage.value = '每日推荐已生成';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '每日推荐生成失败';
  } finally {
    generating.value = false;
  }
}

async function checkinToday() {
  if (!(await requireLogin('打卡'))) return;
  if (checkedToday.value) {
    error.value = '今日已打卡，明天再来继续学习吧。';
    return;
  }
  checkingIn.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const item = await createLearningCheckin({
      userId: activeUserId.value,
      date: todayText,
    });
    successMessage.value = `打卡成功，已连续 ${item.continuousDays} 天`;
    if (!isBrowsingCurrentMonth.value) {
      filters.month = currentMonth;
    }
    await loadCheckins();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '打卡失败，请稍后重试';
  } finally {
    checkingIn.value = false;
  }
}

function changeMonth(delta: number) {
  const next = shiftLocalMonth(filters.month, delta);
  if (next > currentMonth) return;
  filters.month = next;
  void loadCheckins();
}

const canGoNext = computed(() => filters.month < currentMonth);

function changeRecommendationPage(delta: number) {
  recommendationPager.page = Math.min(recommendationPageCount.value, Math.max(1, recommendationPager.page + delta));
}

watch(
  () => props.currentUserId,
  (userId) => {
    if (userId) {
      void loadCheckins();
    }
  },
);

watch(
  () => currentUser.value?.id,
  (userId) => {
    if (userId) {
      void loadCheckins();
      return;
    }
    checkins.value = {
      userId: 0,
      month: filters.month,
      total: 0,
      currentStreak: 0,
      items: [],
    };
  },
);

onMounted(loadAll);
</script>

<template>
  <section class="learning-page learning-journey-page">
    <header class="learning-journey-hero">
      <div>
        <p class="eyebrow">每日非遗灵感</p>
        <h2>今天从一个项目开始，持续认识湖南非遗</h2>
        <span>系统根据热度生成学习推荐，你可以按日期探索内容、完成每日打卡，并查看近期热门节点。</span>
      </div>
      <div class="learning-journey-actions">
        <div class="learning-user-summary" :class="{ signed: isSignedIn }">
          <span>{{ currentUserName.slice(0, 1) }}</span>
          <div>
            <strong>{{ currentUserName }}</strong>
            <small>{{ isSignedIn ? '打卡记录将保存到当前账号' : '登录后记录学习进度' }}</small>
          </div>
        </div>
        <button class="secondary-action" type="button" :disabled="loading" @click="loadAll">
          <Loader2 v-if="loading" :size="16" class="spin" />
          <RefreshCcw v-else :size="16" />
          刷新推荐
        </button>
        <button class="primary-action" type="button" :disabled="generating" @click="generateToday">
          <Loader2 v-if="generating" :size="16" class="spin" />
          <Sparkles v-else :size="17" />
          生成今日清单
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error compact-message">{{ error }}</div>
    <div v-if="successMessage" class="inline-success compact-message">{{ successMessage }}</div>

    <section class="learning-journey-overview">
      <article>
        <Sparkles :size="18" />
        <span>今日推荐</span>
        <strong>{{ recommendation?.total ?? 0 }}</strong>
      </article>
      <article>
        <CalendarCheck :size="18" />
        <span>本月打卡</span>
        <strong>{{ checkins?.total ?? 0 }}</strong>
      </article>
      <article class="streak">
        <CheckCircle2 :size="18" />
        <span>连续天数</span>
        <strong>{{ checkins?.currentStreak ?? 0 }}</strong>
      </article>
      <article class="hot">
        <Flame :size="18" />
        <span>热门节点</span>
        <strong>{{ hotItems.length }}</strong>
      </article>
    </section>

    <section class="learning-journey-controls">
      <label>
        <span>推荐日期</span>
        <input v-model="filters.date" type="date" @change="loadRecommendation" />
      </label>
      <label>
        <span>当前学习用户</span>
        <input :value="currentUserName" type="text" readonly @click="!isSignedIn && requireLogin('记录学习进度')" />
      </label>
      <button class="secondary-action" type="button" :disabled="loading" @click="loadAll">
        <Loader2 v-if="loading" :size="16" class="spin" />
        <RefreshCcw v-else :size="16" />
        刷新学习内容
      </button>
      <button class="primary-action" type="button" :disabled="generating" @click="generateToday">
        <Loader2 v-if="generating" :size="16" class="spin" />
        <Sparkles v-else :size="16" />
        生成今日清单
      </button>
    </section>

    <section class="learning-journey-main">
      <article class="daily-recommend-card">
        <div class="panel-title learning-panel-title">
          <div>
            <p class="eyebrow">今日推荐</p>
            <h3>{{ recommendation?.recommendDate || filters.date }}</h3>
          </div>
          <span v-if="topRecommendation" class="learning-focus-chip">{{ topRecommendation.nodeTypeName }}</span>
        </div>

        <section v-if="topRecommendation" class="daily-feature-card">
          <div>
            <span>首推节点</span>
            <h3>{{ topRecommendation.nodeName }}</h3>
            <p>{{ topRecommendation.summary || topRecommendation.reason }}</p>
          </div>
          <strong>{{ topRecommendation.popularityCount }}</strong>
        </section>

        <div v-if="loading" class="state-panel compact-state">
          <Loader2 :size="22" class="spin" />
          <span>正在加载推荐清单</span>
        </div>

        <div v-else-if="!recommendation?.items.length" class="state-panel empty compact-state learning-empty-state">
          <Sparkles :size="24" />
          <strong>暂无推荐</strong>
          <button class="primary-action compact" type="button" :disabled="generating" @click="generateToday">生成推荐</button>
        </div>

        <div v-else class="daily-learning-list">
          <article v-for="item in pagedRecommendations" :key="item.id">
            <span>{{ item.sortOrder }}</span>
            <div>
              <strong>{{ item.nodeName }}</strong>
              <small>{{ item.nodeCode }} / {{ item.nodeTypeName }} / {{ item.province || '未知地区' }}</small>
              <p>{{ item.reason }}</p>
            </div>
          </article>
        </div>

        <footer v-if="recommendationPageCount > 1" class="recommendation-pagination mini-pagination learning-pagination">
          <button type="button" :disabled="recommendationPager.page <= 1" @click="changeRecommendationPage(-1)">上一页</button>
          <span>{{ recommendationPager.page }} / {{ recommendationPageCount }}</span>
          <button type="button" :disabled="recommendationPager.page >= recommendationPageCount" @click="changeRecommendationPage(1)">下一页</button>
        </footer>
      </article>

      <aside class="learning-companion-panel">
        <section class="checkin-calendar-card">
          <div class="detail-title-row checkin-title-row">
            <div>
              <p class="eyebrow">学习打卡</p>
              <h3>打卡日历</h3>
              <small>{{ checkedDaysText }}</small>
            </div>
            <div class="heading-actions">
              <button class="icon-only" type="button" title="上一月" @click="changeMonth(-1)">
                <ChevronLeft :size="16" />
              </button>
              <button class="icon-only" type="button" title="下一月" :disabled="!canGoNext" @click="changeMonth(1)">
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
          <div class="checkin-calendar-toolbar">
            <label>
              <span>打卡月份</span>
              <input v-model="filters.month" type="month" @change="loadCheckins" />
            </label>
            <button
              class="primary-action checkin-action"
              type="button"
              :disabled="checkingIn || checkedToday || !isBrowsingCurrentMonth"
              :title="isBrowsingCurrentMonth ? '' : '切回当前月份后才能打卡'"
              @click="checkinToday"
            >
              <Loader2 v-if="checkingIn" :size="16" class="spin" />
              <CalendarCheck v-else :size="16" />
              {{ checkedToday ? '今日已打卡' : isBrowsingCurrentMonth ? '完成今日打卡' : '回到本月打卡' }}
            </button>
          </div>
          <div class="learning-calendar consumer-calendar">
            <span
              v-for="day in calendarDays"
              :key="day.date"
              :class="{ checked: day.checked, 'is-checked': day.checked, today: day.date === todayText, future: day.date > todayText }"
              :title="day.checked ? `已打卡，连续 ${day.continuousDays} 天` : day.date > todayText ? `${day.date} 未到，暂不能打卡` : `${day.date} 未打卡`"
            >
              <strong>{{ day.day }}</strong>
            </span>
          </div>
        </section>

        <section class="hot-heritage-card">
          <h3>热门非遗节点</h3>
          <div class="learning-hot-list consumer-hot-list">
            <article v-for="(item, index) in visibleHotItems" :key="item.id">
              <span>
                <Trophy v-if="index <= 2" :size="16" />
                <small v-else>{{ index + 1 }}</small>
              </span>
              <div>
                <strong>{{ item.nodeName }}</strong>
                <small>{{ item.nodeTypeName }} / 热度 {{ item.hotScore }}</small>
              </div>
            </article>
          </div>
        </section>
      </aside>
    </section>
  </section>
</template>
