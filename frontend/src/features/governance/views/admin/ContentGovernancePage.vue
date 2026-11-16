<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Loader2, RefreshCcw, ShieldAlert, Trash2, Plus, FileSearch } from 'lucide-vue-next';
import { OperationAuditItem } from '../../../analytics/services/analytics';
import { ContentReviewRecordItem, SensitiveWordItem, createSensitiveWord, deleteSensitiveWord, fetchContentGovernanceOperationLogs, fetchContentReviewRecords, fetchSensitiveWords } from '../../services/governance';

const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const saving = ref(false);
// 敏感词删除是物理删除，必须二次确认
const removeCandidate = ref<SensitiveWordItem | null>(null);
const removingId = ref<number | null>(null);
const wordKeyword = ref('');
const reviewKeyword = ref('');
const logKeyword = ref('');
const sensitiveWords = ref<SensitiveWordItem[]>([]);
const reviewRecords = ref<ContentReviewRecordItem[]>([]);
const operationLogs = ref<OperationAuditItem[]>([]);
const wordTotal = ref(0);
const reviewTotal = ref(0);
const logTotal = ref(0);
const wordPage = ref(1);
const wordPageSize = 6;
const wordPageCount = computed(() => Math.max(1, Math.ceil(wordTotal.value / wordPageSize)));
const reviewPage = ref(1);
const reviewPageSize = 6;
const reviewPageCount = computed(() => Math.max(1, Math.ceil(reviewTotal.value / reviewPageSize)));
const logPage = ref(1);
const logPageSize = 6;
const logPageCount = computed(() => Math.max(1, Math.ceil(logTotal.value / logPageSize)));
const wordForm = ref({
  word: '',
  wordType: 'GENERAL',
  severity: 1,
  status: 1,
});

async function load() {
  loading.value = true;
  error.value = '';
  // 删除/筛选后当前页可能已越界，回落到最后一个有效页
  if (wordPage.value > wordPageCount.value) {
    wordPage.value = wordPageCount.value;
  }
  if (reviewPage.value > reviewPageCount.value) {
    reviewPage.value = reviewPageCount.value;
  }
  if (logPage.value > logPageCount.value) {
    logPage.value = logPageCount.value;
  }
  try {
    const [words, reviews, logs] = await Promise.all([
      fetchSensitiveWords({ keyword: wordKeyword.value, page: wordPage.value, size: wordPageSize }),
      fetchContentReviewRecords({ keyword: reviewKeyword.value, page: reviewPage.value, size: reviewPageSize }),
      fetchContentGovernanceOperationLogs({ keyword: logKeyword.value, page: logPage.value, size: logPageSize }),
    ]);
    sensitiveWords.value = words.items;
    reviewRecords.value = reviews.items;
    operationLogs.value = logs.items;
    wordTotal.value = words.total;
    reviewTotal.value = reviews.total;
    logTotal.value = logs.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '内容治理数据加载失败';
  } finally {
    loading.value = false;
  }
}

function searchSensitiveWords() {
  wordPage.value = 1;
  void load();
}

function searchReviewRecords() {
  reviewPage.value = 1;
  void load();
}

function searchOperationLogs() {
  logPage.value = 1;
  void load();
}

function changeWordPage(delta: number) {
  wordPage.value = Math.min(wordPageCount.value, Math.max(1, wordPage.value + delta));
  void load();
}

function changeReviewPage(delta: number) {
  reviewPage.value = Math.min(reviewPageCount.value, Math.max(1, reviewPage.value + delta));
  void load();
}

function changeLogPage(delta: number) {
  logPage.value = Math.min(logPageCount.value, Math.max(1, logPage.value + delta));
  void load();
}

async function addSensitiveWord() {
  if (!wordForm.value.word.trim()) {
    error.value = '请先填写敏感词';
    return;
  }
  const severity = Number(wordForm.value.severity);
  if (!Number.isInteger(severity) || severity < 1 || severity > 3) {
    error.value = '敏感词级别只能是 1、2、3（后端会把越界值强制改成边界值）';
    return;
  }
  if (wordForm.value.wordType.trim().length > 32) {
    error.value = '敏感词类型不能超过 32 个字符';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createSensitiveWord({
      word: wordForm.value.word.trim(),
      wordType: wordForm.value.wordType.trim().toUpperCase() || 'GENERAL',
      severity,
      status: wordForm.value.status,
    });
    wordForm.value.word = '';
    successMessage.value = '敏感词已新增';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '新增敏感词失败';
  } finally {
    saving.value = false;
  }
}

function requestRemoveWord(item: SensitiveWordItem) {
  removeCandidate.value = item;
  error.value = '';
  successMessage.value = '';
}

async function confirmRemoveWord() {
  const item = removeCandidate.value;
  if (!item) return;
  removingId.value = item.id;
  error.value = '';
  successMessage.value = '';
  try {
    await deleteSensitiveWord(item.id);
    removeCandidate.value = null;
    successMessage.value = `敏感词「${item.word}」已删除`;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '敏感词删除失败';
  } finally {
    removingId.value = null;
  }
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-';
}

onMounted(load);
</script>

<template>
  <section class="governance-page compact-page">
    <header class="page-heading compact-heading">
      <div>
        <p class="eyebrow">内容治理</p>
        <h2>敏感词与审核日志</h2>
        <span>维护敏感词，查看内容命中记录和后台审计日志。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" :disabled="loading" @click="load">
          <Loader2 v-if="loading" :size="16" class="spin" />
          <RefreshCcw v-else :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error compact-message">{{ error }}</div>
    <div v-if="successMessage" class="inline-success compact-message">{{ successMessage }}</div>

    <section class="governance-grid">
      <article class="compact-panel">
        <div class="panel-title">
          <div>
            <p class="eyebrow">敏感词库</p>
            <h2>新增与管理</h2>
          </div>
          <ShieldAlert :size="18" />
        </div>
        <div class="governance-form">
          <label>
            <span>敏感词</span>
            <input v-model="wordForm.word" type="text" placeholder="请输入敏感词" />
          </label>
          <label>
            <span>类型</span>
            <input v-model="wordForm.wordType" type="text" placeholder="GENERAL / COMMUNITY / PRODUCT" />
          </label>
          <label>
            <span>严重级别</span>
            <select v-model.number="wordForm.severity">
              <option :value="1">1 · 低</option>
              <option :value="2">2 · 中</option>
              <option :value="3">3 · 高</option>
            </select>
          </label>
          <label>
            <span>状态</span>
            <select v-model.number="wordForm.status">
              <option :value="1">启用</option>
              <option :value="0">停用</option>
            </select>
          </label>
          <button class="primary-action" type="button" :disabled="saving" @click="addSensitiveWord">
            <Plus :size="16" />
            新增敏感词
          </button>
        </div>
        <div class="compact-toolbar">
          <input v-model="wordKeyword" type="search" placeholder="搜索敏感词" @keyup.enter="searchSensitiveWords" />
          <button class="secondary-action" type="button" @click="searchSensitiveWords">筛选</button>
        </div>
        <div class="compact-list">
          <article v-for="item in sensitiveWords" :key="item.id">
            <div>
              <strong>{{ item.word }}</strong>
              <small>{{ item.wordType }} / 级别 {{ item.severity }} / {{ item.status === 1 ? '启用' : '停用' }}</small>
            </div>
            <button class="icon-only danger" type="button" title="删除" @click="requestRemoveWord(item)">
              <Trash2 :size="16" />
            </button>
          </article>
          <div v-if="sensitiveWords.length === 0" class="chain-empty">暂无敏感词</div>
        </div>
        <footer v-if="wordPageCount > 1" class="mini-pagination">
          <button type="button" :disabled="wordPage <= 1 || loading" @click="changeWordPage(-1)">上一页</button>
          <span>第 {{ wordPage }} / {{ wordPageCount }} 页</span>
          <button type="button" :disabled="wordPage >= wordPageCount || loading" @click="changeWordPage(1)">下一页</button>
        </footer>
        <div class="mini-summary">{{ wordTotal }} 条敏感词</div>
      </article>

      <article class="compact-panel">
        <div class="panel-title">
          <div>
            <p class="eyebrow">审核信息</p>
            <h2>内容命中记录</h2>
          </div>
          <FileSearch :size="18" />
        </div>
        <div class="compact-toolbar">
          <input v-model="reviewKeyword" type="search" placeholder="搜索命中内容" @keyup.enter="searchReviewRecords" />
          <button class="secondary-action" type="button" @click="searchReviewRecords">筛选</button>
        </div>
        <div class="compact-list">
          <article v-for="item in reviewRecords" :key="item.id">
            <div>
              <strong>{{ item.contentType }}</strong>
              <small>{{ item.status }} / {{ formatTime(item.createdAt) }}</small>
            </div>
            <p>{{ item.rawContent }}</p>
            <small>{{ item.matchedWords }}</small>
          </article>
          <div v-if="reviewRecords.length === 0" class="chain-empty">暂无审核记录</div>
        </div>
        <footer v-if="reviewPageCount > 1" class="mini-pagination">
          <button type="button" :disabled="reviewPage <= 1 || loading" @click="changeReviewPage(-1)">上一页</button>
          <span>第 {{ reviewPage }} / {{ reviewPageCount }} 页</span>
          <button type="button" :disabled="reviewPage >= reviewPageCount || loading" @click="changeReviewPage(1)">下一页</button>
        </footer>
        <div class="mini-summary">{{ reviewTotal }} 条审核记录</div>
      </article>

      <article class="compact-panel governance-log-panel">
        <div class="panel-title">
          <div>
            <p class="eyebrow">日志</p>
            <h2>后台操作日志</h2>
          </div>
          <ShieldAlert :size="18" />
        </div>
        <div class="compact-toolbar">
          <input v-model="logKeyword" type="search" placeholder="搜索操作日志" @keyup.enter="searchOperationLogs" />
          <button class="secondary-action" type="button" @click="searchOperationLogs">筛选</button>
        </div>
        <div class="compact-list">
          <article v-for="item in operationLogs" :key="item.id">
            <div>
              <strong>{{ item.operation }}</strong>
              <small>{{ item.operatorName || item.operatorUsername || item.operatorId || '系统用户' }}</small>
            </div>
            <p>{{ item.requestMethod }} {{ item.requestUri }}</p>
            <small>{{ formatTime(item.createdAt) }} / {{ item.requestBody }}</small>
          </article>
          <div v-if="operationLogs.length === 0" class="chain-empty">暂无操作日志</div>
        </div>
        <footer v-if="logPageCount > 1" class="mini-pagination">
          <button type="button" :disabled="logPage <= 1 || loading" @click="changeLogPage(-1)">上一页</button>
          <span>第 {{ logPage }} / {{ logPageCount }} 页</span>
          <button type="button" :disabled="logPage >= logPageCount || loading" @click="changeLogPage(1)">下一页</button>
        </footer>
        <div class="mini-summary">{{ logTotal }} 条操作日志</div>
      </article>
    </section>

    <div v-if="removeCandidate" class="modal-backdrop" @click.self="removeCandidate = null">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除敏感词？</h3>
        <p>
          将从敏感词库永久删除「<strong>{{ removeCandidate.word }}</strong>」，
          之后包含该词的内容不会再被拦截，<strong>不可恢复</strong>。
        </p>
        <footer>
          <button class="secondary-action" type="button" @click="removeCandidate = null">取消</button>
          <button
            class="danger-action"
            type="button"
            :disabled="removingId === removeCandidate.id"
            @click="confirmRemoveWord"
          >
            <Loader2 v-if="removingId === removeCandidate.id" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<style scoped>
/* .compact-panel 是 grid 容器，全局 .mini-pagination 的 margin-top:auto 在此不生效，补回间距 */
.governance-page .mini-pagination {
  margin-top: 10px;
}
</style>
