<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FilePlus2,
  FileWarning,
  History,
  Loader2,
  Trash2,
  RefreshCcw,
  Search,
  Send,
  X,
  XCircle,
} from 'lucide-vue-next';
import { ApplicationItem, ApplicationPayload, ApplicationStatus, ApplicationType, approveApplication, createApplication, deleteApplication, fetchApplication, fetchApplications, rejectApplication, submitApplication, updateApplication } from '../../services/application';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { currentAuth, currentUser } from '../../../auth/services/authState';

type Decision = 'approve' | 'reject';

const applications = ref<ApplicationItem[]>([]);
const selectedApplication = ref<ApplicationItem | null>(null);
const nodeOptions = ref<GraphNodeItem[]>([]);
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const reviewing = ref<Decision | ''>('');
const submittingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const modalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingApplicationId = ref<number | null>(null);
const error = ref('');
const successMessage = ref('');
const nodeSearchKeyword = ref('');
const deleteCandidate = ref<ApplicationItem | null>(null);

const filters = reactive({
  keyword: '',
  status: '',
  applicationType: '',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive<ApplicationPayload>({
  applicationNo: '',
  applicantUserId: undefined,
  applicantUsername: '',
  targetNodeId: null,
  applicationType: 'PROJECT',
  title: '',
  formData: {},
  currentStep: 1,
});

const draftFormData = reactive({
  summary: '',
  projectLevel: '',
  materialCount: 0,
});

const decisionForm = reactive({
  reviewerId: undefined as number | undefined,
  reviewComment: '',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const isSuperAdmin = computed(() => currentAuth.value?.roles.some((role) => role.roleCode === 'SUPER_ADMIN') ?? false);
const isApplicantMode = computed(() => !isSuperAdmin.value);
const submittedCount = computed(() => applications.value.filter((item) => item.status === 'SUBMITTED').length);
const approvedCount = computed(() => applications.value.filter((item) => item.status === 'APPROVED').length);
const rejectedCount = computed(() => applications.value.filter((item) => item.status === 'REJECTED').length);

const typeLabels: Record<ApplicationType, string> = {
  PROJECT: '项目申报',
  INHERITOR: '传承人',
  MEDIA: '媒体材料',
  RELATION: '关系建模',
};

const statusLabels: Record<ApplicationStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '待审核',
  REJECTED: '已驳回',
  APPROVED: '已通过',
  CANCELLED: '已取消',
};

const applicationStepOptions = [
  { value: 1, label: '资料填写' },
  { value: 2, label: '材料核验' },
  { value: 3, label: '专家审核' },
  { value: 4, label: '入库归档' },
];

function parseApplicationFormData(raw: unknown): Record<string, unknown> | null {
  let current = raw;
  for (let depth = 0; depth < 3 && typeof current === 'string'; depth += 1) {
    const trimmed = current.trim();
    if (!trimmed) return null;
    try {
      current = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  return current && typeof current === 'object' && !Array.isArray(current)
    ? current as Record<string, unknown>
    : null;
}

function formatApplicationFormValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const selectedFormRows = computed(() => {
  const raw = selectedApplication.value?.formData;
  if (!raw) return [];
  const parsed = parseApplicationFormData(raw);
  if (parsed) {
    return Object.entries(parsed).filter(([, value]) => value !== null && value !== undefined && value !== '');
  }
  return [['原始表单', formatApplicationFormValue(raw)]];
});

function formatAdminError(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function formatApplicantError(err: unknown, fallback: string) {
  const message = formatAdminError(err, fallback);
  if (isApplicantMode.value && message.includes('当前账号没有访问该后台模块的权限')) {
    return '';
  }
  return message;
}

function normalizeApplicantFilters() {
  if (isApplicantMode.value) {
    filters.applicationType = 'PROJECT';
  }
}

function upsertApplicationRecord(application: ApplicationItem) {
  const existingIndex = applications.value.findIndex((item) => item.id === application.id);
  if (existingIndex >= 0) {
    applications.value.splice(existingIndex, 1, application);
  } else {
    applications.value.unshift(application);
  }
  filters.total = Math.max(filters.total, applications.value.length);
  selectedApplication.value = application;
}

async function load(preserveApplication?: ApplicationItem) {
  loading.value = true;
  error.value = '';
  try {
    normalizeApplicantFilters();
    const response = await fetchApplications(filters);
    applications.value = response.items;
    filters.total = response.total;
    if (preserveApplication && !applications.value.some((item) => item.id === preserveApplication.id)) {
      upsertApplicationRecord(preserveApplication);
    }
    if (applications.value.length > 0) {
      const currentId = preserveApplication?.id ?? selectedApplication.value?.id;
      const next = applications.value.find((item) => item.id === currentId) ?? applications.value[0];
      await selectApplication(next);
    } else {
      selectedApplication.value = null;
    }
  } catch (err) {
    error.value = formatApplicantError(err, '申报列表加载失败');
    if (preserveApplication) {
      upsertApplicationRecord(preserveApplication);
    }
  } finally {
    loading.value = false;
  }
}

async function selectApplication(application: ApplicationItem) {
  detailLoading.value = true;
  error.value = '';
  try {
    selectedApplication.value = await fetchApplication(application.id);
    decisionForm.reviewComment = selectedApplication.value.reviewComment ?? '';
  } catch (err) {
    error.value = formatApplicantError(err, '申报详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

async function searchNodes() {
  if (isApplicantMode.value) {
    nodeOptions.value = [];
    return;
  }
  const response = await fetchGraphNodes({
    keyword: nodeSearchKeyword.value,
    auditStatus: 'APPROVED',
    page: 1,
    size: 500,
  });
  nodeOptions.value = response.items;
}

function openCreate() {
  modalMode.value = 'create';
  editingApplicationId.value = null;
  decisionForm.reviewerId = currentUser.value?.id;
  Object.assign(form, {
    applicationNo: `APP-${Date.now()}`,
    applicantUserId: undefined,
    applicantUsername: currentUser.value?.username ?? '',
    targetNodeId: null,
    applicationType: 'PROJECT',
    title: '',
    formData: {},
    currentStep: 1,
  });
  Object.assign(draftFormData, {
    summary: '',
    projectLevel: '',
    materialCount: 0,
  });
  modalOpen.value = true;
}

function openEdit(application: ApplicationItem) {
  if (!canEditApplication(application)) return;
  modalMode.value = 'edit';
  editingApplicationId.value = application.id;
  decisionForm.reviewerId = currentUser.value?.id;
  Object.assign(form, {
    applicationNo: application.applicationNo,
    applicantUserId: application.applicantUserId,
    applicantUsername: '',
    targetNodeId: application.targetNodeId ?? null,
    applicationType: application.applicationType,
    title: application.title,
    formData: {},
    currentStep: application.currentStep ?? 1,
  });
  const parsedFormData = parseApplicationFormData(application.formData) ?? {};
  Object.assign(draftFormData, {
    summary: String(parsedFormData.summary ?? ''),
    projectLevel: String(parsedFormData.projectLevel ?? ''),
    materialCount: Number(parsedFormData.materialCount ?? 0),
  });
  modalOpen.value = true;
}

async function saveApplication() {
  saving.value = true;
  error.value = '';
  try {
    if (!form.title?.trim()) {
      form.title = `申报草稿-${new Date().toLocaleDateString('zh-CN')}`;
    }
    if (!form.applicantUsername?.trim() && currentUser.value?.username) {
      form.applicantUsername = currentUser.value.username;
    }
    const payload: ApplicationPayload = {
      ...form,
      applicantUserId: isApplicantMode.value ? undefined : form.applicantUserId,
      applicantUsername: isApplicantMode.value ? undefined : form.applicantUsername,
      targetNodeId: isApplicantMode.value ? null : form.targetNodeId || null,
      applicationType: isApplicantMode.value ? 'PROJECT' : form.applicationType,
      currentStep: isApplicantMode.value ? 1 : form.currentStep,
      formData: {
        summary: draftFormData.summary,
        projectLevel: draftFormData.projectLevel,
        materialCount: draftFormData.materialCount,
      },
    };
    const saved = modalMode.value === 'edit' && editingApplicationId.value
      ? await updateApplication(editingApplicationId.value, payload)
      : await createApplication(payload);
    modalOpen.value = false;
    successMessage.value = modalMode.value === 'edit' ? '申报流程已更新' : '已创建申报草稿';
    filters.page = 1;
    filters.status = '';
    upsertApplicationRecord(saved);
    await load(saved);
  } catch (err) {
    error.value = formatAdminError(err, modalMode.value === 'edit' ? '申报流程更新失败' : '申报草稿保存失败');
  } finally {
    saving.value = false;
  }
}

function requestDeleteApplication(application: ApplicationItem) {
  if (!canDeleteApplication(application)) return;
  deleteCandidate.value = application;
}

function cancelDeleteApplication() {
  deleteCandidate.value = null;
}

async function performDeleteApplication() {
  const application = deleteCandidate.value;
  if (!application) return;
  deletingId.value = application.id;
  error.value = '';
  successMessage.value = '';
  try {
    await deleteApplication(application.id);
    deleteCandidate.value = null;
    successMessage.value = '申报已删除';
    if (selectedApplication.value?.id === application.id) {
      selectedApplication.value = null;
    }
    await load();
  } catch (err) {
    error.value = formatAdminError(err, '删除申报失败');
  } finally {
    deletingId.value = null;
  }
}

async function submitDraft(application: ApplicationItem) {
  if (!canSubmitApplication(application)) return;
  submittingId.value = application.id;
  error.value = '';
  successMessage.value = '';
  try {
    const submitted = await submitApplication(application.id);
    successMessage.value = '申报已提交审核';
    upsertApplicationRecord(submitted);
    await load(submitted);
  } catch (err) {
    error.value = formatAdminError(err, '提交申报失败');
  } finally {
    submittingId.value = null;
  }
}

async function review(decision: Decision) {
  if (!isSuperAdmin.value) return;
  if (!selectedApplication.value) return;
  if (!decisionForm.reviewerId && currentUser.value?.id) {
    decisionForm.reviewerId = currentUser.value.id;
  }
  reviewing.value = decision;
  error.value = '';
  successMessage.value = '';
  try {
    const payload = {
      reviewerId: decisionForm.reviewerId,
      reviewComment: decisionForm.reviewComment,
    };
    const updated = decision === 'approve'
      ? await approveApplication(selectedApplication.value.id, payload)
      : await rejectApplication(selectedApplication.value.id, payload);
    successMessage.value = decision === 'approve' ? '申报已通过，并已同步到图谱节点' : '申报已驳回';
    await load();
    await selectApplication(updated);
  } catch (err) {
    error.value = formatAdminError(err, '审核操作失败');
  } finally {
    reviewing.value = '';
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.status = '';
  filters.applicationType = isApplicantMode.value ? 'PROJECT' : '';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function refreshApplications() {
  void load();
}

function statusClass(status?: string) {
  return (status ?? '').toLowerCase();
}

function stepLabel(step?: number) {
  return applicationStepOptions.find((item) => item.value === step)?.label ?? '流程待确认';
}

function canEditApplication(application: ApplicationItem) {
  return isSuperAdmin.value || ['DRAFT', 'REJECTED'].includes(application.status);
}

function canDeleteApplication(application: ApplicationItem) {
  return isSuperAdmin.value || ['DRAFT', 'REJECTED'].includes(application.status);
}

function canSubmitApplication(application: ApplicationItem) {
  return ['DRAFT', 'REJECTED'].includes(application.status);
}

onMounted(async () => {
  normalizeApplicantFilters();
  decisionForm.reviewerId = currentUser.value?.id;
  await Promise.all([load(), searchNodes()]);
});
</script>

<template>
  <section class="application-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">{{ isApplicantMode ? '项目申报' : '申报审核' }}</p>
        <h2>{{ isApplicantMode ? '我的非遗项目申报' : '非遗数字化申报审核' }}</h2>
        <span>
          {{ isApplicantMode ? '创建项目申报草稿并提交管理员审核，审核通过后由管理员同步入库。' : '集中处理项目、传承人、媒体材料与关系建模申报，保留每一步审核记录。' }}
        </span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="refreshApplications">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <FilePlus2 :size="17" />
          新建申报
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <section class="application-stats">
      <article>
        <ClipboardCheck :size="20" />
        <span>{{ isApplicantMode ? '我的申报' : '当前列表' }}</span>
        <strong>{{ filters.total }}</strong>
      </article>
      <article>
        <FileWarning :size="20" />
        <span>待审核</span>
        <strong>{{ submittedCount }}</strong>
      </article>
      <article class="approved">
        <CheckCircle2 :size="20" />
        <span>已通过</span>
        <strong>{{ approvedCount }}</strong>
      </article>
      <article class="rejected">
        <XCircle :size="20" />
        <span>已驳回</span>
        <strong>{{ rejectedCount }}</strong>
      </article>
    </section>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" :placeholder="isApplicantMode ? '编号 / 标题' : '编号 / 标题 / 申报人 / 关联节点'" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label v-if="!isApplicantMode">
        <span>申报类型</span>
        <select v-model="filters.applicationType">
          <option value="">全部类型</option>
          <option value="PROJECT">项目申报</option>
          <option value="INHERITOR">传承人</option>
          <option value="MEDIA">媒体材料</option>
          <option value="RELATION">关系建模</option>
        </select>
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="SUBMITTED">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已驳回</option>
          <option value="CANCELLED">已取消</option>
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

    <section class="application-workbench">
      <article class="table-panel application-table-panel">
        <div class="table-toolbar">
          <span>共 {{ filters.total }} 条{{ isApplicantMode ? '项目申报' : '申报' }}</span>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载申报列表</span>
        </div>

        <div v-else-if="applications.length === 0" class="state-panel empty">
          <ClipboardCheck :size="28" />
          <strong>暂无申报记录</strong>
          <span>可以先创建一条草稿，再提交进入审核流。</span>
          <button class="primary-action compact" type="button" @click="openCreate">新建申报</button>
        </div>

        <div v-else class="data-table application-table">
          <table>
            <thead>
              <tr>
                <th>申报</th>
                <th>类型</th>
                <th>申报人</th>
                <th>关联节点</th>
                <th>进度</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="application in applications"
                :key="application.id"
                :class="{ selected: selectedApplication?.id === application.id }"
                @click="selectApplication(application)"
              >
                <td>
                  <strong>{{ application.title }}</strong>
                  <small>{{ application.applicationNo }}</small>
                </td>
                <td>{{ typeLabels[application.applicationType] }}</td>
                <td>
                  <strong>{{ application.applicantName }}</strong>
                  <small>申报用户</small>
                </td>
                <td>
                  <strong>{{ application.targetNodeName || '未关联节点' }}</strong>
                  <small>{{ application.targetNodeCode || '-' }}</small>
                </td>
                <td>{{ stepLabel(application.currentStep) }}</td>
                <td>
                  <span class="status-chip" :class="statusClass(application.status)">
                    {{ statusLabels[application.status] }}
                  </span>
                </td>
                <td>
                  <div class="row-actions" @click.stop>
                    <button
                      type="button"
                      title="编辑流程"
                      :disabled="!canEditApplication(application)"
                      @click="openEdit(application)"
                    >
                      <Edit3 :size="15" />
                    </button>
                    <button
                      type="button"
                      title="提交审核"
                      :disabled="!canSubmitApplication(application) || submittingId === application.id"
                      @click="submitDraft(application)"
                    >
                      <Loader2 v-if="submittingId === application.id" :size="15" class="spin" />
                      <Send v-else :size="15" />
                    </button>
                    <button
                      type="button"
                      title="删除申报"
                      :disabled="!canDeleteApplication(application)"
                      @click="requestDeleteApplication(application)"
                    >
                      <Trash2 :size="15" />
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

      <aside class="application-detail-panel">
        <div v-if="detailLoading" class="state-panel compact-state">
          <Loader2 :size="22" class="spin" />
          <span>正在加载申报详情</span>
        </div>

        <template v-else-if="selectedApplication">
          <section class="side-section application-summary">
            <div class="detail-title-row">
              <h3>{{ selectedApplication.title }}</h3>
              <span class="status-chip" :class="statusClass(selectedApplication.status)">
                {{ statusLabels[selectedApplication.status] }}
              </span>
            </div>
            <div class="detail-actions">
              <button class="secondary-action compact" type="button" :disabled="!canEditApplication(selectedApplication)" @click="openEdit(selectedApplication)">
                <Edit3 :size="15" />
                编辑流程
              </button>
              <button class="danger-action compact" type="button" :disabled="!canDeleteApplication(selectedApplication)" @click="requestDeleteApplication(selectedApplication)">
                <Trash2 :size="15" />
                删除
              </button>
            </div>
            <dl>
              <div>
                <dt>申报编号</dt>
                <dd>{{ selectedApplication.applicationNo }}</dd>
              </div>
              <div>
                <dt>申报类型</dt>
                <dd>{{ typeLabels[selectedApplication.applicationType] }}</dd>
              </div>
              <div>
                <dt>申报人</dt>
                <dd>{{ selectedApplication.applicantName }}</dd>
              </div>
              <div>
                <dt>关联节点</dt>
                <dd>{{ selectedApplication.targetNodeName || '未关联节点' }}</dd>
              </div>
              <div>
                <dt>提交 / 审核</dt>
                <dd>{{ selectedApplication.submittedAt || '-' }} / {{ selectedApplication.reviewedAt || '-' }}</dd>
              </div>
            </dl>
            <div
              v-if="selectedApplication.status === 'APPROVED' && selectedApplication.targetNodeId"
              class="node-ingest-card"
            >
              <div>
                <span>已入库节点</span>
                <strong>{{ selectedApplication.targetNodeName || selectedApplication.title }}</strong>
                <small>{{ selectedApplication.targetNodeCode || '系统自动生成节点编码' }}</small>
              </div>
              <a
                v-if="isSuperAdmin"
                class="secondary-action compact"
                :href="`/admin/graph/nodes/${selectedApplication.targetNodeId}`"
              >
                查看节点详情
              </a>
              <small v-else>管理员已完成入库归档。</small>
            </div>
          </section>

          <section class="side-section">
            <h3>表单摘要</h3>
            <div v-if="selectedFormRows.length === 0" class="chain-empty">
              <span>暂无表单数据</span>
            </div>
            <dl v-else class="form-data-list">
              <div v-for="[key, value] in selectedFormRows" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ formatApplicationFormValue(value) }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="isSuperAdmin" class="side-section review-action-panel">
            <h3>审核处理</h3>
            <label>
              <span>审核人 ID</span>
              <input :value="currentUser?.nickname || currentUser?.username || decisionForm.reviewerId || '当前管理员'" type="text" disabled />
            </label>
            <label>
              <span>审核意见</span>
              <textarea v-model="decisionForm.reviewComment" rows="4" placeholder="填写通过说明或驳回原因" />
            </label>
            <div class="decision-actions">
              <button
                class="primary-action"
                type="button"
                :disabled="selectedApplication.status !== 'SUBMITTED' || reviewing !== ''"
                @click="review('approve')"
              >
                <Loader2 v-if="reviewing === 'approve'" :size="16" class="spin" />
                <CheckCircle2 v-else :size="16" />
                通过
              </button>
              <button
                class="danger-action"
                type="button"
                :disabled="selectedApplication.status !== 'SUBMITTED' || reviewing !== ''"
                @click="review('reject')"
              >
                <Loader2 v-if="reviewing === 'reject'" :size="16" class="spin" />
                <XCircle v-else :size="16" />
                驳回
              </button>
            </div>
          </section>

          <section class="side-section">
            <h3>审核历史</h3>
            <div v-if="!selectedApplication.reviewLogs?.length" class="chain-empty">
              <History :size="16" />
              <span>暂无审核记录</span>
            </div>
            <div v-else class="review-log-list">
              <article v-for="log in selectedApplication.reviewLogs" :key="log.id">
                <strong>{{ statusLabels[log.fromStatus || 'DRAFT'] }} → {{ statusLabels[log.toStatus] }}</strong>
                <small>{{ log.reviewerName || '系统' }} · {{ log.createdAt || '-' }}</small>
                <span v-if="log.reviewComment">{{ log.reviewComment }}</span>
              </article>
            </div>
          </section>
        </template>

        <div v-else class="state-panel compact-state">
          <ClipboardCheck :size="26" />
          <strong>选择一条申报</strong>
          <span>{{ isApplicantMode ? '右侧会展示表单摘要和审核流转历史。' : '右侧会展示表单摘要、审核操作和流转历史。' }}</span>
        </div>
      </aside>
    </section>

    <div v-if="modalOpen" class="modal-backdrop">
      <section class="node-modal">
        <header>
          <h3>{{ modalMode === 'edit' ? '编辑申报流程' : '新建申报草稿' }}</h3>
          <button class="icon-only" type="button" @click="modalOpen = false">
            <X :size="16" />
          </button>
        </header>

        <div class="form-grid">
          <label>
            <span>申报编号</span>
            <input v-model="form.applicationNo" type="text" placeholder="APP-202606230001" />
          </label>
          <label>
            <span>申报类型</span>
            <select v-model="form.applicationType" :disabled="isApplicantMode">
              <option value="PROJECT">项目申报</option>
              <option value="INHERITOR">传承人</option>
              <option value="MEDIA">媒体材料</option>
              <option value="RELATION">关系建模</option>
            </select>
          </label>
          <label v-if="!isApplicantMode">
            <span>申报人用户名</span>
            <input v-model.trim="form.applicantUsername" type="text" placeholder="如：demo_learner" />
          </label>
          <label v-if="!isApplicantMode">
            <span>当前步骤</span>
            <select v-model.number="form.currentStep">
              <option v-for="step in applicationStepOptions" :key="step.value" :value="step.value">{{ step.label }}</option>
            </select>
          </label>
          <label class="wide">
            <span>申报标题</span>
            <input v-model="form.title" type="text" placeholder="如：苏绣项目省级申报" />
          </label>
          <label v-if="!isApplicantMode" class="wide">
            <span>搜索关联节点</span>
            <div class="inline-search">
              <input v-model="nodeSearchKeyword" type="search" placeholder="节点名称或编码" @keyup.enter="searchNodes" />
              <button class="secondary-action compact" type="button" @click="searchNodes">
                <Search :size="15" />
              </button>
            </div>
          </label>
          <label v-if="!isApplicantMode" class="wide">
            <span>关联节点</span>
            <select v-model.number="form.targetNodeId">
              <option :value="null">不关联节点</option>
              <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
                {{ node.name }} / {{ node.nodeCode }}
              </option>
            </select>
          </label>
          <label>
            <span>项目级别</span>
            <input v-model="draftFormData.projectLevel" type="text" placeholder="国家级 / 省级 / 市级" />
          </label>
          <label>
            <span>材料数量</span>
            <input v-model.number="draftFormData.materialCount" type="number" min="0" />
          </label>
          <label class="wide">
            <span>申报摘要</span>
            <textarea v-model="draftFormData.summary" rows="4" placeholder="填写申报理由、材料范围或补充说明" />
          </label>
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="saveApplication">
            <Loader2 v-if="saving" :size="16" class="spin" />
            {{ modalMode === 'edit' ? '保存修改' : '保存草稿' }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="cancelDeleteApplication">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除申报？</h3>
        <p>将删除「<strong>{{ deleteCandidate.title }}</strong>」申报流程及其审核记录。</p>
        <footer>
          <button class="secondary-action" type="button" @click="cancelDeleteApplication">取消</button>
          <button class="danger-action" type="button" :disabled="deletingId === deleteCandidate.id" @click="performDeleteApplication">
            <Loader2 v-if="deletingId === deleteCandidate.id" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
