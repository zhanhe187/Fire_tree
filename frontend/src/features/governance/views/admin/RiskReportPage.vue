<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ScanSearch,
  Search,
  ShieldAlert,
  X,
} from 'lucide-vue-next';
import { RiskReportItem, fetchRiskReports, resolveRiskReport, scanRisks } from '../../services/governance';

const reports = ref<RiskReportItem[]>([]);
const loading = ref(false);
const scanning = ref(false);
const savingId = ref<number | null>(null);
const resolvingReport = ref<RiskReportItem | null>(null);
const error = ref('');
const scanMessage = ref('');
const resolveDecision = ref<'RESOLVED' | 'IGNORED'>('RESOLVED');
const resolutionNote = ref('');

const filters = reactive({
  keyword: '',
  severity: '',
  status: 'OPEN',
  page: 1,
  size: 5,
  total: 0,
  summary: {
    open: 0,
    high: 0,
    pending: 0,
    resolved: 0,
  },
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));

const severityLabels: Record<string, string> = {
  HIGH: '高危',
  MEDIUM: '中危',
  LOW: '低危',
};

const statusLabels: Record<string, string> = {
  OPEN: '待处理',
  IGNORED: '已忽略',
  RESOLVED: '已处理',
};

const decisionOptions = [
  { value: 'RESOLVED', label: '已处理' },
  { value: 'IGNORED', label: '忽略风险' },
] as const;

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchRiskReports(filters);
    reports.value = response.items;
    filters.total = response.total;
    filters.summary = response.summary;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '风险报告加载失败';
  } finally {
    loading.value = false;
  }
}

async function runScan() {
  scanning.value = true;
  scanMessage.value = '';
  error.value = '';
  try {
    const response = await scanRisks();
    scanMessage.value = `已扫描 ${response.scannedCount} 个风险对象，新增 ${response.generatedCount} 条开放报告。`;
    filters.page = 1;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '风险扫描失败';
  } finally {
    scanning.value = false;
  }
}

function openResolve(report: RiskReportItem) {
  resolvingReport.value = report;
  resolveDecision.value = 'RESOLVED';
  resolutionNote.value = '';
}

async function resolve(report: RiskReportItem) {
  savingId.value = report.id;
  error.value = '';
  try {
    await resolveRiskReport(report.id, {
      decision: resolveDecision.value,
      comment: resolutionNote.value,
    });
    resolvingReport.value = null;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '处理风险失败';
  } finally {
    savingId.value = null;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.severity = '';
  filters.status = 'OPEN';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

onMounted(load);
</script>

<template>
  <section class="risk-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">风险报告</p>
        <h2>传承风险报告</h2>
        <span>自动扫描知识图谱中的传承断点，集中处理待办风险。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" :disabled="scanning" @click="runScan">
          <Loader2 v-if="scanning" :size="16" class="spin" />
          <ScanSearch v-else :size="17" />
          执行扫描
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="scanMessage" class="inline-success">{{ scanMessage }}</div>

    <section class="risk-stats">
      <article>
        <ShieldAlert :size="20" />
        <span>开放风险</span>
        <strong>{{ filters.summary.open }}</strong>
      </article>
      <article class="high">
        <AlertTriangle :size="20" />
        <span>高危风险</span>
        <strong>{{ filters.summary.high }}</strong>
      </article>
      <article>
        <ScanSearch :size="20" />
        <span>待处理</span>
        <strong>{{ filters.summary.pending }}</strong>
      </article>
      <article class="resolved">
        <CheckCircle2 :size="20" />
        <span>已处理</span>
        <strong>{{ filters.summary.resolved }}</strong>
      </article>
    </section>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="标题 / 节点 / 规则编码" @keyup.enter="load" />
      </label>
      <label>
        <span>严重等级</span>
        <select v-model="filters.severity">
          <option value="">全部等级</option>
          <option value="HIGH">高危</option>
          <option value="MEDIUM">中危</option>
          <option value="LOW">低危</option>
        </select>
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="OPEN">待处理</option>
          <option value="RESOLVED">已处理</option>
          <option value="IGNORED">已忽略</option>
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

    <section class="table-panel">
      <div class="table-toolbar">
        <span>共 {{ filters.total }} 条风险报告</span>
        <span>当前页 {{ filters.page }} / {{ pageCount }}</span>
      </div>

      <div v-if="loading" class="state-panel">
        <Loader2 :size="24" class="spin" />
        <span>正在加载风险报告</span>
      </div>

      <div v-else-if="reports.length === 0" class="state-panel empty">
        <strong>暂无风险报告</strong>
        <span>可以执行一次风险扫描，检查非遗项目是否存在传承断点。</span>
        <button class="primary-action compact" type="button" :disabled="scanning" @click="runScan">执行扫描</button>
      </div>

      <div v-else class="data-table risk-table">
        <table>
          <thead>
            <tr>
              <th>风险标题</th>
              <th>规则</th>
              <th>关联节点</th>
              <th>等级</th>
              <th>状态</th>
              <th>检测时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td>
                <strong>{{ report.title }}</strong>
                <small>{{ report.description }}</small>
              </td>
              <td>
                <strong>{{ report.ruleName }}</strong>
                <small>{{ report.ruleCode }}</small>
              </td>
              <td>
                <strong>{{ report.nodeName || '未关联节点' }}</strong>
                <small>{{ report.nodeCode || '-' }}</small>
              </td>
              <td>
                <span class="severity-chip" :class="report.severity.toLowerCase()">
                  {{ severityLabels[report.severity] }}
                </span>
              </td>
              <td>
                <span class="status-chip" :class="report.status.toLowerCase()">
                  {{ statusLabels[report.status] }}
                </span>
              </td>
              <td>{{ report.detectedAt }}</td>
              <td>
                <button
                  class="secondary-action compact"
                  type="button"
                  :disabled="report.status === 'RESOLVED' || savingId === report.id"
                  @click="openResolve(report)"
                >
                  <Loader2 v-if="savingId === report.id" :size="15" class="spin" />
                  <CheckCircle2 v-else :size="15" />
                  处理
                </button>
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
    </section>

    <div v-if="resolvingReport" class="modal-backdrop">
      <section class="node-modal">
        <header>
          <h3>处理风险报告</h3>
          <button class="icon-only" type="button" @click="resolvingReport = null">
            <X :size="16" />
          </button>
        </header>

        <div class="form-grid">
          <label class="wide">
            <span>风险标题</span>
            <input :value="resolvingReport.title" type="text" disabled />
          </label>
          <label>
            <span>处理结果</span>
            <select v-model="resolveDecision">
              <option v-for="option in decisionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="wide">
            <span>处理说明</span>
            <textarea v-model="resolutionNote" rows="4" placeholder="记录核查结论、补充动作或忽略原因" />
          </label>
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="resolvingReport = null">取消</button>
          <button class="primary-action" type="button" :disabled="savingId === resolvingReport.id" @click="resolve(resolvingReport)">
            <Loader2 v-if="savingId === resolvingReport.id" :size="16" class="spin" />
            提交处理
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
