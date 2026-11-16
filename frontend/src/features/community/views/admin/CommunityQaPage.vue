<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Heart,
  Loader2,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  UserRoundCheck,
  X,
  Trash2,
} from 'lucide-vue-next';
import { CommunityQuestionItem, CommunityQuestionPayload, createCommunityAnswer, createCommunityAnswerComment, createCommunityQuestion, createCommunityQuestionComment, deleteCommunityQuestion, fetchCommunityQuestion, fetchCommunityQuestions, likeCommunityQuestion } from '../../services/community';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { authSession, currentUser } from '../../../auth/services/authState';

const router = useRouter();

const questions = ref<CommunityQuestionItem[]>([]);
const selectedQuestion = ref<CommunityQuestionItem | null>(null);
const nodeOptions = ref<GraphNodeItem[]>([]);
const loading = ref(false);
const detailLoading = ref(false);
const savingQuestion = ref(false);
const savingAnswer = ref(false);
const savingComment = ref('');
const liking = ref(false);
const deletingId = ref<number | null>(null);
const deleteCandidate = ref<CommunityQuestionItem | null>(null);
const modalOpen = ref(false);
const error = ref('');
const successMessage = ref('');
const nodeSearchKeyword = ref('');

const filters = reactive({
  keyword: '',
  nodeId: '' as number | '',
  page: 1,
  size: 10,
  total: 0,
});

const questionForm = reactive<CommunityQuestionPayload>({
  nodeId: null,
  title: '',
  content: '',
});

const answerForm = reactive({
  content: '',
});

const questionCommentForm = reactive({
  content: '',
});

const answerCommentForms = reactive<Record<number, { content: string }>>({});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const totalAnswers = computed(() => questions.value.reduce((sum, item) => sum + Number(item.answerCount ?? 0), 0));
const totalLikes = computed(() => questions.value.reduce((sum, item) => sum + Number(item.likeCount ?? 0), 0));
const relatedInheritors = computed(() => selectedQuestion.value?.relatedInheritors ?? []);
const questionComments = computed(() => (selectedQuestion.value?.comments ?? []).filter((item) => item.targetType === 'QUESTION'));
const currentUserName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '未登录用户');
const isAdmin = computed(() => authSession.auth?.roles.some((role) => role.roleCode === 'SUPER_ADMIN') ?? false);
const answerComments = computed(() => {
  const grouped = new Map<number, typeof questionComments.value>();
  for (const comment of selectedQuestion.value?.comments ?? []) {
    if (comment.targetType !== 'ANSWER') continue;
    grouped.set(comment.targetId, [...(grouped.get(comment.targetId) ?? []), comment]);
  }
  return grouped;
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchCommunityQuestions(filters);
    questions.value = response.items;
    filters.total = response.total;
    if (questions.value.length > 0) {
      const currentId = selectedQuestion.value?.id;
      const next = questions.value.find((item) => item.id === currentId) ?? questions.value[0];
      await selectQuestion(next);
    } else {
      selectedQuestion.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '社区问答列表加载失败';
  } finally {
    loading.value = false;
  }
}

async function selectQuestion(question: CommunityQuestionItem) {
  detailLoading.value = true;
  error.value = '';
  try {
    selectedQuestion.value = await fetchCommunityQuestion(question.id);
    for (const answer of selectedQuestion.value.answers ?? []) {
      answerCommentForms[answer.id] ??= { content: '' };
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '社区问答详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

// 打开独立的帖子详情页（/admin/content/community/:questionId）
function openQuestionDetail(question: CommunityQuestionItem) {
  void router.push(`/admin/content/community/${question.id}`);
}

async function searchNodes() {
  const response = await fetchGraphNodes({
    keyword: nodeSearchKeyword.value,
    auditStatus: 'APPROVED',
    page: 1,
    size: 30,
  });
  nodeOptions.value = response.items;
}

function openCreate() {
  Object.assign(questionForm, {
    nodeId: null,
    title: '',
    content: '',
  });
  modalOpen.value = true;
}

function ensureSignedIn(action: string) {
  if (authSession.token) return true;
  error.value = `请先登录后再${action}`;
  return false;
}

async function saveQuestion() {
  if (!ensureSignedIn('发布问题')) return;
  savingQuestion.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const created = await createCommunityQuestion({
      nodeId: questionForm.nodeId || null,
      title: questionForm.title,
      content: questionForm.content,
    });
    modalOpen.value = false;
    successMessage.value = '问题已发布';
    filters.page = 1;
    await load();
    await selectQuestion(created);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '问题发布失败，可能命中了敏感词拦截';
  } finally {
    savingQuestion.value = false;
  }
}

async function saveAnswer() {
  if (!selectedQuestion.value) return;
  if (!ensureSignedIn('回答问题')) return;
  savingAnswer.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createCommunityAnswer(selectedQuestion.value.id, { content: answerForm.content });
    answerForm.content = '';
    successMessage.value = '回答已发布';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '回答发布失败';
  } finally {
    savingAnswer.value = false;
  }
}

async function saveQuestionComment() {
  if (!selectedQuestion.value) return;
  if (!ensureSignedIn('发表评论')) return;
  savingComment.value = `question-${selectedQuestion.value.id}`;
  error.value = '';
  try {
    await createCommunityQuestionComment(selectedQuestion.value.id, { content: questionCommentForm.content });
    questionCommentForm.content = '';
    await selectQuestion(selectedQuestion.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '评论发布失败';
  } finally {
    savingComment.value = '';
  }
}

async function saveAnswerComment(answerId: number) {
  if (!selectedQuestion.value) return;
  if (!ensureSignedIn('发表评论')) return;
  const form = answerCommentForms[answerId];
  if (!form) return;
  savingComment.value = `answer-${answerId}`;
  error.value = '';
  try {
    await createCommunityAnswerComment(answerId, { content: form.content });
    form.content = '';
    await selectQuestion(selectedQuestion.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '回答评论发布失败';
  } finally {
    savingComment.value = '';
  }
}

async function likeSelectedQuestion() {
  if (!selectedQuestion.value) return;
  if (!ensureSignedIn('点赞')) return;
  liking.value = true;
  error.value = '';
  try {
    await likeCommunityQuestion(selectedQuestion.value.id, {});
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '点赞失败，可能已经点过赞';
  } finally {
    liking.value = false;
  }
}

function canDeleteQuestion(question: CommunityQuestionItem) {
  return isAdmin.value || question.authorId === currentUser.value?.id;
}

function requestDeleteQuestion(question: CommunityQuestionItem) {
  if (!canDeleteQuestion(question)) return;
  deleteCandidate.value = question;
}

function cancelDeleteQuestion() {
  deleteCandidate.value = null;
}

async function performDeleteQuestion() {
  const question = deleteCandidate.value;
  if (!question) return;
  deletingId.value = question.id;
  error.value = '';
  successMessage.value = '';
  try {
    await deleteCommunityQuestion(question.id);
    deleteCandidate.value = null;
    successMessage.value = '问题已删除';
    if (selectedQuestion.value?.id === question.id) {
      selectedQuestion.value = null;
    }
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除问题失败';
  } finally {
    deletingId.value = null;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.nodeId = '';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function formatTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

onMounted(async () => {
  await Promise.all([load(), searchNodes()]);
});
</script>

<template>
  <section class="community-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">社区问答</p>
        <h2>节点提问与传承人互动</h2>
        <span>围绕非遗节点沉淀问题、回答与评论，并在发布前进行敏感词拦截。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button class="primary-action" type="button" @click="openCreate">
          <Plus :size="17" />
          新增问题
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>
    <div class="community-session-strip">
      <span>当前身份</span>
      <strong>{{ currentUserName }}</strong>
      <small>发帖、评论和点赞将自动使用登录账号</small>
    </div>

    <section class="community-stats">
      <article>
        <MessageCircleQuestion :size="20" />
        <span>问题总数</span>
        <strong>{{ filters.total }}</strong>
      </article>
      <article>
        <MessageSquare :size="20" />
        <span>当前回答</span>
        <strong>{{ totalAnswers }}</strong>
      </article>
      <article>
        <Heart :size="20" />
        <span>当前点赞</span>
        <strong>{{ totalLikes }}</strong>
      </article>
      <article>
        <UserRoundCheck :size="20" />
        <span>匹配传承人</span>
        <strong>{{ relatedInheritors.length }}</strong>
      </article>
    </section>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="问题 / 内容 / 提问人 / 节点" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>节点</span>
        <select v-model.number="filters.nodeId">
          <option value="">全部节点</option>
          <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
            {{ node.name }} / {{ node.nodeCode }}
          </option>
        </select>
      </label>
      <label>
        <span>节点搜索</span>
        <div class="inline-search">
          <input v-model="nodeSearchKeyword" type="search" placeholder="节点名称或编码" @keyup.enter="searchNodes" />
          <button class="secondary-action compact" type="button" @click="searchNodes">
            <Search :size="15" />
          </button>
        </div>
      </label>
      <div class="filter-actions">
        <button class="primary-action compact" type="button" @click="filters.page = 1; load()">
          <Search :size="16" />
          筛选
        </button>
        <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
      </div>
    </section>

    <section class="community-workbench">
      <article class="community-list-panel">
        <div class="table-toolbar">
          <span>共 {{ filters.total }} 条问题</span>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载社区问答</span>
        </div>

        <div v-else-if="questions.length === 0" class="state-panel empty">
          <MessageCircleQuestion :size="28" />
          <strong>暂无问答记录</strong>
          <span>可以先围绕一个非遗节点发起提问，系统会匹配相关传承人。</span>
          <button class="primary-action compact" type="button" @click="openCreate">新增问题</button>
        </div>

        <div v-else class="community-question-list">
          <button
            v-for="question in questions"
            :key="question.id"
            class="community-question-card"
            :class="{ selected: selectedQuestion?.id === question.id }"
            type="button"
            @click="selectQuestion(question)"
          >
            <span class="community-meta-row">
              <strong>{{ question.nodeName || '未关联节点' }}</strong>
              <small>{{ formatTime(question.updatedAt || question.createdAt) }}</small>
            </span>
            <h3>{{ question.title }}</h3>
            <p>{{ question.content }}</p>
            <span class="community-thread-actions">
              <small>{{ question.authorName }}</small>
              <small>{{ question.answerCount }} 回答</small>
              <small>{{ question.likeCount }} 点赞</small>
              <span
                class="community-detail-link"
                role="link"
                tabindex="0"
                @click.stop="openQuestionDetail(question)"
                @keydown.enter.prevent="openQuestionDetail(question)"
              >
                查看详情
              </span>
              <button
                v-if="canDeleteQuestion(question)"
                class="icon-only"
                type="button"
                title="删除问题"
                :disabled="deletingId === question.id"
                @click.stop="requestDeleteQuestion(question)"
              >
                <Loader2 v-if="deletingId === question.id" :size="14" class="spin" />
                <Trash2 v-else :size="14" />
              </button>
            </span>
          </button>
        </div>

        <footer class="pagination">
          <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
          <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
        </footer>
      </article>

      <aside class="community-detail-panel">
        <div v-if="detailLoading" class="state-panel compact-state">
          <Loader2 :size="22" class="spin" />
          <span>正在加载问答详情</span>
        </div>

        <template v-else-if="selectedQuestion">
          <section class="side-section community-question-detail">
            <div class="detail-title-row">
              <h3>{{ selectedQuestion.title }}</h3>
              <span class="status-chip" :class="selectedQuestion.status.toLowerCase()">{{ selectedQuestion.status }}</span>
            </div>
            <p>{{ selectedQuestion.content }}</p>
            <div class="community-meta-row">
              <small>{{ selectedQuestion.authorName }}</small>
              <small>{{ formatTime(selectedQuestion.createdAt) }}</small>
            </div>
            <div class="community-thread-actions">
              <span>{{ selectedQuestion.nodeName || '未关联节点' }}</span>
              <span>{{ selectedQuestion.answerCount }} 回答</span>
              <span>{{ selectedQuestion.likeCount }} 点赞</span>
              <button
                v-if="canDeleteQuestion(selectedQuestion)"
                class="icon-only"
                type="button"
                :disabled="deletingId === selectedQuestion.id"
                @click="requestDeleteQuestion(selectedQuestion)"
              >
                <Loader2 v-if="deletingId === selectedQuestion.id" :size="14" class="spin" />
                <Trash2 v-else :size="14" />
              </button>
            </div>
          </section>

          <section class="side-section">
            <h3>相关传承人</h3>
            <div v-if="relatedInheritors.length === 0" class="chain-empty">
              <UserRoundCheck :size="16" />
              <span>当前节点暂无匹配传承人</span>
            </div>
            <div v-else class="community-inheritor-list">
              <article v-for="inheritor in relatedInheritors" :key="inheritor.id">
                <strong>{{ inheritor.name }}</strong>
                <small>{{ inheritor.nodeCode }}</small>
              </article>
            </div>
          </section>

          <section class="side-section community-compose community-like-card">
            <h3>点赞问题</h3>
            <button class="secondary-action" type="button" :disabled="liking" @click="likeSelectedQuestion">
              <Loader2 v-if="liking" :size="16" class="spin" />
              <Heart v-else :size="16" />
              点赞
            </button>
          </section>

          <section class="side-section community-compose">
            <h3>回答问题</h3>
            <label>
              <span>回答内容</span>
              <textarea v-model="answerForm.content" rows="4" placeholder="填写对该非遗节点问题的答复" />
            </label>
            <button class="primary-action" type="button" :disabled="savingAnswer" @click="saveAnswer">
              <Loader2 v-if="savingAnswer" :size="16" class="spin" />
              <Send v-else :size="16" />
              发布回答
            </button>
          </section>

          <section class="side-section">
            <h3>回答列表</h3>
            <div v-if="!selectedQuestion.answers?.length" class="chain-empty">
              <MessageSquare :size="16" />
              <span>还没有回答</span>
            </div>
            <div v-else class="community-answer-list">
              <article v-for="answer in selectedQuestion.answers" :key="answer.id">
                <strong>{{ answer.authorName }}</strong>
                <small>{{ formatTime(answer.createdAt) }} / {{ answer.likeCount }} 点赞</small>
                <p>{{ answer.content }}</p>
                <div v-if="answerComments.get(answer.id)?.length" class="community-comment-list">
                  <span v-for="comment in answerComments.get(answer.id)" :key="comment.id">
                    {{ comment.authorName }}：{{ comment.content }}
                  </span>
                </div>
                <div class="community-inline-form">
                  <input v-model="answerCommentForms[answer.id].content" type="text" placeholder="评论这条回答" />
                  <button class="secondary-action compact" type="button" :disabled="savingComment === `answer-${answer.id}`" @click="saveAnswerComment(answer.id)">
                    <Loader2 v-if="savingComment === `answer-${answer.id}`" :size="15" class="spin" />
                    <Send v-else :size="15" />
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section class="side-section community-compose">
            <h3>问题评论</h3>
            <div v-if="questionComments.length" class="community-comment-list standalone">
              <span v-for="comment in questionComments" :key="comment.id">
                {{ comment.authorName }}：{{ comment.content }}
              </span>
            </div>
            <label>
              <span>评论内容</span>
              <textarea v-model="questionCommentForm.content" rows="3" placeholder="补充提问或运营说明" />
            </label>
            <button class="secondary-action" type="button" :disabled="savingComment === `question-${selectedQuestion.id}`" @click="saveQuestionComment">
              <Loader2 v-if="savingComment === `question-${selectedQuestion.id}`" :size="16" class="spin" />
              <MessageSquare v-else :size="16" />
              发布评论
            </button>
          </section>
        </template>

        <div v-else class="state-panel compact-state">
          <MessageCircleQuestion :size="26" />
          <strong>选择一条问题</strong>
          <span>右侧会展示回答、评论、点赞和传承人匹配信息。</span>
        </div>
      </aside>
    </section>

    <div v-if="modalOpen" class="modal-backdrop">
      <section class="node-modal">
        <header>
          <h3>新增社区问题</h3>
          <button class="icon-only" type="button" @click="modalOpen = false">
            <X :size="16" />
          </button>
        </header>

        <div class="form-grid">
          <label>
            <span>关联节点</span>
            <select v-model.number="questionForm.nodeId">
              <option :value="null">不关联节点</option>
              <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
                {{ node.name }} / {{ node.nodeCode }}
              </option>
            </select>
          </label>
          <label class="wide">
            <span>问题标题</span>
            <input v-model="questionForm.title" type="text" placeholder="例如：这项技艺的关键传承步骤是什么？" />
          </label>
          <label class="wide">
            <span>问题内容</span>
            <textarea v-model="questionForm.content" rows="5" placeholder="描述背景、疑问和希望传承人补充的信息" />
          </label>
          <div class="wide community-moderation-note">
            <ShieldAlert :size="17" />
            <span>发布时会检查敏感词，命中内容会被阻断并写入内容审核记录。</span>
          </div>
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="savingQuestion" @click="saveQuestion">
            <Loader2 v-if="savingQuestion" :size="16" class="spin" />
            发布问题
          </button>
        </footer>
      </section>
    </div>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="cancelDeleteQuestion">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除问题？</h3>
        <p>将删除「<strong>{{ deleteCandidate.title }}</strong>」及其关联的回答与评论。</p>
        <footer>
          <button class="secondary-action" type="button" @click="cancelDeleteQuestion">取消</button>
          <button class="danger-action" type="button" :disabled="deletingId === deleteCandidate.id" @click="performDeleteQuestion">
            <Loader2 v-if="deletingId === deleteCandidate.id" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
