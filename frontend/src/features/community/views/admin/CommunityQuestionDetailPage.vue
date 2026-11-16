<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Heart,
  Loader2,
  MessageCircleQuestion,
  MessageSquare,
  RefreshCcw,
  Send,
  Trash2,
  UserRoundCheck,
} from 'lucide-vue-next';
import {
  CommunityCommentItem,
  CommunityQuestionItem,
  createCommunityAnswer,
  createCommunityAnswerComment,
  createCommunityQuestionComment,
  deleteCommunityQuestion,
  fetchCommunityQuestion,
  likeCommunityQuestion,
} from '../../services/community';
import { authSession, currentUser } from '../../../auth/services/authState';

const route = useRoute();
const router = useRouter();

const listRoute = '/admin/content/community';

const question = ref<CommunityQuestionItem | null>(null);
const loading = ref(false);
const answering = ref(false);
const liking = ref(false);
const deleting = ref(false);
const savingComment = ref('');
const deleteCandidate = ref(false);
const error = ref('');
const successMessage = ref('');
const answerForm = reactive({ content: '' });
const questionCommentForm = reactive({ content: '' });
const answerCommentForms = reactive<Record<number, { content: string }>>({});

const questionId = computed(() => {
  const raw = Array.isArray(route.params.questionId) ? route.params.questionId[0] : route.params.questionId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
});

const answerCount = computed(() => question.value?.answers?.length ?? 0);
const questionComments = computed<CommunityCommentItem[]>(
  () => (question.value?.comments ?? []).filter((comment) => comment.targetType === 'QUESTION'),
);
const answerComments = computed(() => {
  const grouped = new Map<number, CommunityCommentItem[]>();
  for (const comment of question.value?.comments ?? []) {
    if (comment.targetType !== 'ANSWER') continue;
    grouped.set(comment.targetId, [...(grouped.get(comment.targetId) ?? []), comment]);
  }
  return grouped;
});
const relatedInheritors = computed(() => question.value?.relatedInheritors ?? []);
const currentUserName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '当前登录用户');
const isAdmin = computed(() => authSession.auth?.roles.some((role) => role.roleCode === 'SUPER_ADMIN') ?? false);
const canDelete = computed(() => Boolean(question.value) && (isAdmin.value || question.value?.authorId === currentUser.value?.id));

function backToList() {
  void router.push(listRoute);
}

function ensureSignedIn(action: string) {
  if (authSession.token) return true;
  error.value = `请先登录后再${action}`;
  return false;
}

async function load() {
  const id = questionId.value;
  if (id === null) {
    question.value = null;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const detail = await fetchCommunityQuestion(id);
    question.value = detail;
    for (const answer of detail.answers ?? []) {
      answerCommentForms[answer.id] ??= { content: '' };
    }
  } catch (err) {
    question.value = null;
    error.value = err instanceof Error ? err.message : '帖子详情加载失败';
  } finally {
    loading.value = false;
  }
}

async function saveAnswer() {
  const id = questionId.value;
  if (id === null || !answerForm.content.trim()) return;
  if (!ensureSignedIn('回答问题')) return;
  answering.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createCommunityAnswer(id, { content: answerForm.content });
    answerForm.content = '';
    successMessage.value = '回答已发布';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '回答发布失败';
  } finally {
    answering.value = false;
  }
}

async function saveAnswerComment(answerId: number) {
  const form = answerCommentForms[answerId];
  if (!form || !form.content.trim()) return;
  if (!ensureSignedIn('发表评论')) return;
  savingComment.value = `answer-${answerId}`;
  error.value = '';
  try {
    await createCommunityAnswerComment(answerId, { content: form.content });
    form.content = '';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '回答评论发布失败';
  } finally {
    savingComment.value = '';
  }
}

async function saveQuestionComment() {
  const id = questionId.value;
  if (id === null || !questionCommentForm.content.trim()) return;
  if (!ensureSignedIn('发表评论')) return;
  savingComment.value = `question-${id}`;
  error.value = '';
  try {
    await createCommunityQuestionComment(id, { content: questionCommentForm.content });
    questionCommentForm.content = '';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '评论发布失败';
  } finally {
    savingComment.value = '';
  }
}

async function likeQuestion() {
  const id = questionId.value;
  if (id === null) return;
  if (!ensureSignedIn('点赞')) return;
  liking.value = true;
  error.value = '';
  try {
    await likeCommunityQuestion(id, {});
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '点赞失败，可能已经点过赞';
  } finally {
    liking.value = false;
  }
}

function requestDelete() {
  if (!canDelete.value) return;
  deleteCandidate.value = true;
}

function cancelDelete() {
  deleteCandidate.value = false;
}

async function performDelete() {
  const id = questionId.value;
  if (id === null) return;
  deleting.value = true;
  error.value = '';
  try {
    await deleteCommunityQuestion(id);
    deleteCandidate.value = false;
    backToList();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除问题失败';
  } finally {
    deleting.value = false;
  }
}

function formatTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

watch(questionId, load, { immediate: true });
</script>

<template>
  <section class="community-post-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">社区问答 · 帖子详情</p>
        <h2>帖子详情</h2>
        <span>完整展示提问正文、回答、评论与传承人匹配信息，可在此直接互动。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="backToList">
          <ArrowLeft :size="16" />
          返回列表
        </button>
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
        <button v-if="canDelete" class="danger-action" type="button" :disabled="deleting" @click="requestDelete">
          <Loader2 v-if="deleting" :size="16" class="spin" />
          <Trash2 v-else :size="16" />
          删除帖子
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <div v-if="loading && !question" class="state-panel">
      <Loader2 :size="24" class="spin" />
      <span>正在加载帖子详情</span>
    </div>

    <div v-else-if="!question" class="state-panel empty">
      <MessageCircleQuestion :size="28" />
      <strong>没有找到这条帖子</strong>
      <span>帖子可能已被删除，或链接里的编号不正确。</span>
      <button class="primary-action compact" type="button" @click="backToList">返回社区问答</button>
    </div>

    <section v-else class="community-post-layout">
      <div class="community-post-main">
        <article class="side-section community-post-hero">
          <div class="detail-title-row">
            <h3>{{ question.title }}</h3>
            <span class="status-chip" :class="question.status.toLowerCase()">{{ question.status }}</span>
          </div>
          <p v-if="question.imageUrl" class="community-post-image">
            <img :src="question.imageUrl" :alt="question.title" />
          </p>
          <p class="community-post-content">{{ question.content }}</p>
          <div class="community-meta-row">
            <small>{{ question.authorName }}</small>
            <small>发布于 {{ formatTime(question.createdAt) }}</small>
          </div>
          <div class="community-thread-actions">
            <span>{{ question.nodeName || '未关联节点' }}</span>
            <span>{{ question.answerCount ?? answerCount }} 回答</span>
            <span>{{ question.likeCount }} 点赞</span>
            <span>{{ question.viewCount ?? 0 }} 浏览</span>
          </div>
        </article>

        <section class="side-section community-compose">
          <h3>回答问题</h3>
          <label>
            <span>回答内容</span>
            <textarea v-model="answerForm.content" rows="4" placeholder="填写对该非遗节点问题的答复" />
          </label>
          <div class="community-compose-actions">
            <button class="primary-action" type="button" :disabled="answering || !answerForm.content.trim()" @click="saveAnswer">
              <Loader2 v-if="answering" :size="16" class="spin" />
              <Send v-else :size="16" />
              发布回答
            </button>
            <small>发布时会检查敏感词，命中内容会被阻断并写入审核记录。</small>
          </div>
        </section>

        <section class="side-section">
          <h3>回答列表（{{ answerCount }}）</h3>
          <div v-if="!question.answers?.length" class="chain-empty">
            <MessageSquare :size="16" />
            <span>还没有回答，可以在上方发布第一条答复</span>
          </div>
          <div v-else class="community-answer-list">
            <article v-for="answer in question.answers" :key="answer.id">
              <strong>{{ answer.authorName }}</strong>
              <small>{{ formatTime(answer.createdAt) }} / {{ answer.likeCount }} 点赞</small>
              <p>{{ answer.content }}</p>
              <div v-if="answerComments.get(answer.id)?.length" class="community-comment-list">
                <span v-for="comment in answerComments.get(answer.id)" :key="comment.id">
                  {{ comment.authorName }}：{{ comment.content }}
                </span>
              </div>
              <div v-if="answerCommentForms[answer.id]" class="community-inline-form">
                <input v-model="answerCommentForms[answer.id].content" type="text" placeholder="评论这条回答" />
                <button
                  class="secondary-action compact"
                  type="button"
                  :disabled="savingComment === `answer-${answer.id}`"
                  @click="saveAnswerComment(answer.id)"
                >
                  <Loader2 v-if="savingComment === `answer-${answer.id}`" :size="15" class="spin" />
                  <Send v-else :size="15" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="side-section community-compose">
          <h3>问题评论（{{ questionComments.length }}）</h3>
          <div v-if="questionComments.length" class="community-comment-list standalone">
            <span v-for="comment in questionComments" :key="comment.id">
              {{ comment.authorName }}：{{ comment.content }}
            </span>
          </div>
          <label>
            <span>评论内容</span>
            <textarea v-model="questionCommentForm.content" rows="3" placeholder="补充提问或运营说明" />
          </label>
          <div class="community-compose-actions">
            <button
              class="secondary-action"
              type="button"
              :disabled="savingComment === `question-${question.id}` || !questionCommentForm.content.trim()"
              @click="saveQuestionComment"
            >
              <Loader2 v-if="savingComment === `question-${question.id}`" :size="16" class="spin" />
              <MessageSquare v-else :size="16" />
              发布评论
            </button>
          </div>
        </section>
      </div>

      <aside class="community-post-side">
        <section class="side-section">
          <h3>帖子信息</h3>
          <dl>
            <div>
              <dt>关联节点</dt>
              <dd>{{ question.nodeName || '未关联节点' }}</dd>
            </div>
            <div>
              <dt>节点编码</dt>
              <dd>{{ question.nodeCode || '-' }}</dd>
            </div>
            <div>
              <dt>提问人</dt>
              <dd>{{ question.authorName }}</dd>
            </div>
            <div>
              <dt>发布时间</dt>
              <dd>{{ formatTime(question.createdAt) }}</dd>
            </div>
            <div>
              <dt>最近更新</dt>
              <dd>{{ formatTime(question.updatedAt || question.createdAt) }}</dd>
            </div>
            <div>
              <dt>回答 / 点赞 / 浏览</dt>
              <dd>{{ question.answerCount ?? answerCount }} / {{ question.likeCount }} / {{ question.viewCount ?? 0 }}</dd>
            </div>
          </dl>
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
          <button class="secondary-action" type="button" :disabled="liking" @click="likeQuestion">
            <Loader2 v-if="liking" :size="16" class="spin" />
            <Heart v-else :size="16" />
            点赞
          </button>
        </section>

        <section class="side-section community-post-operator">
          <h3>当前身份</h3>
          <p>{{ currentUserName }}</p>
          <small>发帖、回答、评论与点赞都会自动使用登录账号。</small>
        </section>
      </aside>
    </section>

    <div v-if="deleteCandidate" class="modal-backdrop" @click.self="cancelDelete">
      <section class="confirm-modal confirm-modal-danger">
        <div class="confirm-modal-icon">
          <Trash2 :size="28" />
        </div>
        <h3>确认删除帖子？</h3>
        <p>将删除「<strong>{{ question?.title }}</strong>」及其关联的回答与评论。</p>
        <footer>
          <button class="secondary-action" type="button" @click="cancelDelete">取消</button>
          <button class="danger-action" type="button" :disabled="deleting" @click="performDelete">
            <Loader2 v-if="deleting" :size="16" class="spin" />
            <Trash2 v-else :size="16" />
            确认删除
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
