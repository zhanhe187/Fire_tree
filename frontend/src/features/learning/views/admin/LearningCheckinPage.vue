<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
import { formatLocalDate, formatLocalMonth, shiftLocalMonth } from '../../../../shared/utils/localDate';
import { AdminUserItem, fetchAdminUsers } from '../../../admin/services/admin';

const props = defineProps<{
  currentUserId?: number | null;
}>();

const recommendation = ref<LearningRecommendationResponse | null>(null);
const hotItems = ref<LearningHotItem[]>([]);
const checkins = ref<LearningCheckinResponse | null>(null);
const loading = ref(false);
const generating = ref(false);
const checkingIn = ref(false);
const error = ref('');
const successMessage = ref('');
// 打卡用户名只认 sys_users.username（拼音），手输昵称会 400，改成下拉选择
const accountOptions = ref<AdminUserItem[]>([]);

// 必须用本地日期：toISOString() 是 UTC，UTC+8 每天 00:00–07:59 会取到昨天
const todayText = formatLocalDate();
const currentMonth = formatLocalMonth();

const filters = reactive({
  date: todayText,
  month: currentMonth,
  userId: props.currentUserId ?? ('' as number | ''),
  username: '',
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
const checkedToday = computed(() => checkedByDate.value.has(filters.date));
const checkedDaysText = computed(() => `本月已打卡 ${checkins.value?.total ?? 0} 天`);
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

async function loadCheckins() {
  const userId = filters.userId;
  const username = filters.username.trim();
  if (!userId && !username) {
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
    userId: userId || undefined,
    username: username || undefined,
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
        userId: Number(filters.userId) || 0,
        month: filters.month,
        total: 0,
        currentStreak: 0,
        items: [],
      };
      failures.push(err instanceof Error ? err.message : '打卡日历加载失败');
    }),
  ]);
  if (failures.length > 0) {
    error.value = `请确认打卡用户名有效：${failures[0]}`;
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
  checkingIn.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const userId = filters.userId;
    const username = filters.username.trim();
    if (!userId && !username) {
      error.value = '请先登录或输入有效的打卡用户名';
      return;
    }
    const item = await createLearningCheckin({
      userId: userId || undefined,
      username: username || undefined,
      date: filters.date,
    });
    successMessage.value = `打卡成功，已连续 ${item.continuousDays} 天`;
    await loadCheckins();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '打卡失败，可能今日已经打卡';
  } finally {
    checkingIn.value = false;
  }
}

function changeMonth(delta: number) {
  filters.month = shiftLocalMonth(filters.month, delta);
  void loadCheckins();
}

function changeRecommendationPage(delta: number) {
  recommendationPager.page = Math.min(recommendationPageCount.value, Math.max(1, recommendationPager.page + delta));
}

watch(
  () => props.currentUserId,
  (userId) => {
    if (!filters.userId && userId) {
      filters.userId = userId;
      filters.username = '';
      void loadCheckins();
    }
  },
);

async function loadAccountOptions() {
  try {
    const response = await fetchAdminUsers({ status: 1, page: 1, size: 200 });
    accountOptions.value = response.items.filter((item) => item.status === 1);
  } catch {
    accountOptions.value = [];
  }
}

onMounted(() => {
  void loadAccountOptions();
  void loadAll();
});
</script>

<template>
  <section class="learning-page compact-page">
    <header class="page-heading compact-heading">
      <div>
        <p class="eyebrow">推荐与打卡</p>
        <h2>每日学习推荐</h2>
        <span>围绕非遗节点热度生成学习清单，并记录用户连续打卡。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" :disabled="loading" @click="loadAll">
          <Loader2 v-if="loading" :size="16" class="spin" />
          <RefreshCcw v-else :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" :disabled="generating" @click="generateToday">
          <Loader2 v-if="generating" :size="16" class="spin" />
          <Sparkles v-else :size="17" />
          生成推荐
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error compact-message">{{ error }}</div>
    <div v-if="successMessage" class="inline-success compact-message">{{ successMessage }}</div>

    <section class="learning-data-strip">
      <div class="learning-stats compact-stats">
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
      </div>

      <section class="filter-bar compact-filter learning-filter">
        <label>
          <span>推荐日期</span>
          <input v-model="filters.date" type="date" @change="loadRecommendation" />
        </label>
        <label>
          <span>打卡用户名</span>
          <select v-model="filters.username" @change="loadCheckins">
            <option value="">当前登录用户</option>
            <option v-for="account in accountOptions" :key="account.id" :value="account.username">
              {{ account.nickname || account.username }}（{{ account.username }}）
            </option>
          </select>
        </label>
        <label>
          <span>打卡月份</span>
          <input v-model="filters.month" type="month" @change="loadCheckins" />
        </label>
        <div class="filter-actions">
          <button class="primary-action compact" type="button" :disabled="checkingIn || checkedToday" @click="checkinToday">
            <Loader2 v-if="checkingIn" :size="16" class="spin" />
            <CalendarCheck v-else :size="16" />
            {{ checkedToday ? '今日已打卡' : '今日打卡' }}
          </button>
        </div>
      </section>
    </section>

    <section class="learning-workbench compact-learning-workbench">
      <article class="learning-recommend-panel">
        <div class="panel-title">
          <div>
            <p class="eyebrow">今日推荐</p>
            <h2>{{ recommendation?.recommendDate || filters.date }}</h2>
          </div>
          <span v-if="topRecommendation" class="learning-focus-chip">{{ topRecommendation.nodeTypeName }}</span>
        </div>

        <section v-if="topRecommendation" class="learning-hero-node">
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

        <div v-else-if="!recommendation?.items.length" class="state-panel empty compact-state">
          <Sparkles :size="24" />
          <strong>暂无推荐</strong>
          <button class="primary-action compact" type="button" :disabled="generating" @click="generateToday">生成推荐</button>
        </div>

        <div v-else class="learning-lane">
          <div class="learning-recommend-list">
            <article v-for="item in pagedRecommendations" :key="item.id">
              <span>{{ item.sortOrder }}</span>
              <div>
                <strong>{{ item.nodeName }}</strong>
                <small>{{ item.nodeCode }} / {{ item.nodeTypeName }} / {{ item.province || '未知地区' }}</small>
                <p>{{ item.reason }}</p>
              </div>
            </article>
          </div>

          <footer v-if="recommendationPageCount > 1" class="recommendation-pagination mini-pagination">
            <button type="button" :disabled="recommendationPager.page <= 1" @click="changeRecommendationPage(-1)">上一页</button>
            <span>{{ recommendationPager.page }} / {{ recommendationPageCount }}</span>
            <button type="button" :disabled="recommendationPager.page >= recommendationPageCount" @click="changeRecommendationPage(1)">下一页</button>
          </footer>
        </div>
      </article>

      <aside class="learning-side">
        <section class="side-section">
          <div class="detail-title-row">
            <div>
              <h3>打卡日历</h3>
              <small>{{ checkedDaysText }}</small>
            </div>
            <div class="heading-actions">
              <button class="icon-only" type="button" title="上一月" @click="changeMonth(-1)">
                <ChevronLeft :size="16" />
              </button>
              <button class="icon-only" type="button" title="下一月" @click="changeMonth(1)">
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
          <div class="learning-calendar">
            <span
              v-for="day in calendarDays"
              :key="day.date"
              :class="{ checked: day.checked, 'is-checked': day.checked, today: day.date === filters.date }"
              :title="day.checked ? `已打卡，连续 ${day.continuousDays} 天` : `${day.date} 未打卡`"
            >
              <strong>{{ day.day }}</strong>
            </span>
          </div>
        </section>

        <section class="side-section">
          <h3>热门榜</h3>
          <div class="learning-hot-list">
            <article v-for="(item, index) in visibleHotItems" :key="item.id">
              <span>
                <Trophy v-if="index < 3" :size="16" />
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
