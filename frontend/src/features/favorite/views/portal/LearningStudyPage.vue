<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, BookOpen, HelpCircle, Loader2, Network, NotebookPen, Sparkles, Wand2 } from 'lucide-vue-next';
import LearningCover from '../../components/LearningCover.vue';
import { FavoriteNodeItem, createFavoriteNode, fetchFavoriteNodes, updateFavoriteNote } from '../../services/favorite';
import { StudyAiFailure, StudyAiFailureKind, STUDY_AI_TIMEOUT_MS, StudyAiIntent, requestStudyAi } from '../../services/aiStudy';
import type { AiNavigationSuggestion } from '../../../ai/services/ai';
import { GraphNodeItem, GraphRelationsResponse, fetchGraphNode, fetchGraphRelations } from '../../../graph/services/graph';
import { authSession, currentUser } from '../../../auth/services/authState';
import {
  createEmptyLearningCard,
  learningScopeForUser,
  loadLocalLearningRecord,
  parseLearningNote,
  saveLocalLearningRecord,
  serializeLearningNote,
  type LearningCard,
} from '../../services/learningCard';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';

const route = useRoute();
const router = useRouter();

const nodeId = computed(() => {
  const raw = Number(route.params.nodeId);
  return Number.isInteger(raw) && raw > 0 ? raw : 0;
});

const node = ref<GraphNodeItem | null>(null);
const relations = ref<GraphRelationsResponse | null>(null);
const favorites = ref<FavoriteNodeItem[]>([]);
const note = ref('');
const learningCard = ref<LearningCard | null>(null);
// Loading/reconciliation must never replace text the learner has edited but not saved.
const hasUnsavedEdits = ref(false);
// Invalidates an in-flight save when the learner edits again or changes nodes.
let studyEditGeneration = 0;
const reviewRevealed = ref(false);
const customKeywords = ref('');
const localFavorite = ref<FavoriteNodeItem | null>(null);
// Must start `false`: loadAll()'s re-entry guard (required by the auth-timing watcher) would
// otherwise bail on the very first call, before the `finally` that clears the flag — the page
// would sit on 正在打开学习内容 forever. The guard owns the transition, so the panel still shows
// only while a load is genuinely in flight.
const loading = ref(false);
// A request that hits the re-entry guard while a load is in flight is queued here instead of
// being dropped; loadAll() replays it from its `finally`.
const reloadRequested = ref(false);
const saving = ref(false);
const error = ref('');
const successMessage = ref('');
const localOnlyFallback = ref(false);
let loadedFavoriteUserId = 0;
let loadGeneration = 0;

// AI 学习助手：答案只活在这次浏览里（不落库），「追加到笔记」把文本塞进 textarea，
// 真正写入仍然只由 saveNote() 触发。
const aiAnswer = ref('');
const aiIntent = ref<StudyAiIntent | null>(null);
const aiLoading = ref(false);
// true 表示后端这次给的不是真回答，而是导航兜底（source 非 AI_CHAT_COMPLETIONS）：
// 那种文本不能当总结渲染，也不能追加进笔记。
const aiDegraded = ref(false);
// 请求本身失败（超时 / 空回答 / 断线）的原因。与 aiDegraded 分开：一个是「后端给了兜底文本」，
// 一个是「这次压根没拿到回答」，两种说明不能互相冒充 —— 后者不是「系统的兜底提示」。
const aiFailure = ref<StudyAiFailureKind | ''>('');
// 这份答案属于哪个节点。切换节点时会清空，渲染与「追加到笔记」都拿它和当前 nodeId 对账：
// 即便某条路径漏了重置，张冠李戴的答案既显示不出来、也写不进笔记。
const aiAnswerNodeId = ref(0);
// 后端 suggestions 是唯一经过 pageIndex 校验的导航通道（非法路由后端已丢弃、最多 4 条）。
// 正文里的路由已被 stripRouteHints 清掉，所以要指路就只走这里 —— 渲染成站内链接。
const aiSuggestions = ref<AiNavigationSuggestion[]>([]);
const aiTitle = computed(() =>
  aiIntent.value === 'SUMMARY' ? 'AI 总结' : aiIntent.value === 'EXPAND' ? '扩展学习' : aiIntent.value === 'QUESTION' ? 'AI 自测问题' : '',
);
// 只有「有正文 + 正文属于当前节点」才算可展示的答案。这是渲染侧的结构性闸门。
const aiAnswerMatchesNode = computed(() => aiAnswer.value !== '' && aiAnswerNodeId.value === nodeId.value);
const aiFailureMessage = computed(() => {
  if (aiFailure.value === 'timeout') {
    return `AI 在 ${STUDY_AI_TIMEOUT_MS / 1000} 秒内没有返回，这次请求已停止，也没有任何内容写进笔记。可以再试一次。`;
  }
  if (aiFailure.value === 'empty') {
    return 'AI 这次返回了空内容，没能拿到可用的回答，也没有任何内容写进笔记。可以再试一次。';
  }
  return '这次请求没能发出去或中途断开了，没有拿到任何回答，也没有任何内容写进笔记。可以检查网络后重试。';
});

/**
 * 请求代次。每次发起请求或切换节点都会 +1；响应回来时如果代次已经变了（用户切了节点、又发了一次、
 * 状态已被重置），这次响应连同它的 loading 复位一起作废 —— 否则上一个节点的答案会渲染在当前节点上，
 * 还能被「追加到笔记」写进当前节点的笔记。
 *
 * 故意用普通变量而不是 ref：它只回答「这还是不是当前那次请求」，不参与渲染。
 */
let aiGeneration = 0;

// AI 自测：AI 生成问题后，用户在这里写下自己的回答，再揭晓核心理解对照。
const aiQuizAnswer = ref('');
const aiQuizRevealed = ref(false);

/** 丢掉当前 AI 状态（切换节点时调用）。 */
function resetStudyAi() {
  aiGeneration += 1;
  aiAnswer.value = '';
  aiAnswerNodeId.value = 0;
  aiSuggestions.value = [];
  aiIntent.value = null;
  aiDegraded.value = false;
  aiFailure.value = '';
  aiQuizAnswer.value = '';
  aiQuizRevealed.value = false;
  // 上一个节点的请求可能还在飞：它已经作废，不能让它的 spinner 继续代表当前节点。
  aiLoading.value = false;
}

const activeUserId = computed(() => currentUser.value?.id ?? 0);
const isSignedIn = computed(() => Boolean(authSession.token && activeUserId.value));
// Signed-in fallback records must never share a browser-wide scope; anonymous records remain separate.
const localLearningScope = computed(() => learningScopeForUser(activeUserId.value));
// 未登录时两个按钮都是禁用的、标题也写着「登录后可用」，引导语就不能再叫用户「选一个按钮」。
const aiIdleHint = computed(() =>
  isSignedIn.value
    ? '选一个按钮，让 AI 把这个节点讲一遍；结果可以追加到笔记再保存。'
    : '登录后可以让 AI 把这个节点讲一遍，并把结果追加到笔记再保存。',
);
const favorite = computed(() => favorites.value.find((item) => item.nodeId === nodeId.value) ?? localFavorite.value);
const orderedFavorites = computed(() =>
  [...favorites.value].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))),
);
const lessonIndex = computed(() => orderedFavorites.value.findIndex((item) => item.nodeId === nodeId.value));
const previousLesson = computed(() => (lessonIndex.value > 0 ? orderedFavorites.value[lessonIndex.value - 1] : null));
const nextLesson = computed(() =>
  lessonIndex.value >= 0 && lessonIndex.value < orderedFavorites.value.length - 1
    ? orderedFavorites.value[lessonIndex.value + 1]
    : null,
);
const nodeContentHtml = computed(() => renderMarkdown(node.value?.content || node.value?.summary || ''));

/** 相邻节点按关系名分组；同一节点出现在多个关系里时保留首条。 */
const relationGroups = computed(() => {
  const startId = relations.value?.startNodeId ?? nodeId.value;
  const nameById = new Map((relations.value?.nodes ?? []).map((item) => [item.id, item.name]));
  const grouped = new Map<string, Array<{ id: number; name: string }>>();
  const seen = new Set<number>();
  for (const edge of relations.value?.edges ?? []) {
    const otherId = edge.sourceNodeId === startId ? edge.targetNodeId : edge.sourceNodeId;
    if (!otherId || otherId === startId || seen.has(otherId)) continue;
    seen.add(otherId);
    const label = edge.relationLabel || edge.edgeTypeName || '相关';
    const list = grouped.get(label) ?? [];
    list.push({ id: otherId, name: nameById.get(otherId) ?? edge.sourceNodeName });
    grouped.set(label, list);
  }
  return [...grouped.entries()].map(([label, items]) => ({ label, items }));
});

/** 已选节点独立于候选关系列表，故而不会丢失已持久化但本次查询未返回的 ID。 */
const selectedRelatedNodes = computed(() => {
  const names = new Map(relationGroups.value.flatMap((group) => group.items.map((item) => [item.id, item.name])));
  return (learningCard.value?.relatedNodeIds ?? []).map((id) => ({ id, name: names.get(id) ?? `节点 #${id}` }));
});

function resetReviewFlow() {
  reviewRevealed.value = false;
}

function markStudyDirty() {
  studyEditGeneration += 1;
  hasUnsavedEdits.value = true;
}

function clearStudyDirty() {
  studyEditGeneration += 1;
  hasUnsavedEdits.value = false;
}

function updatePrivateNote(value: string) {
  note.value = value;
  markStudyDirty();
}

function setLearningNote(raw: string | null | undefined) {
  const parsed = parseLearningNote(raw, nodeId.value);
  note.value = parsed.privateNote;
  learningCard.value = parsed.card;
  customKeywords.value = parsed.card?.relatedKeywords.join(', ') ?? '';
  resetReviewFlow();
}

function ensureLearningCard() {
  if (!learningCard.value || learningCard.value.nodeId !== nodeId.value) {
    learningCard.value = createEmptyLearningCard(nodeId.value);
    markStudyDirty();
  }
  return learningCard.value;
}

function updateCardField(field: 'coreUnderstanding' | 'selfTestQuestion', value: string) {
  const card = ensureLearningCard();
  learningCard.value = { ...card, [field]: value, updatedAt: new Date().toISOString() };
  markStudyDirty();
}

function toggleRelatedNode(relatedId: number) {
  const card = ensureLearningCard();
  const relatedNodeIds = card.relatedNodeIds.includes(relatedId)
    ? card.relatedNodeIds.filter((id) => id !== relatedId)
    : [...card.relatedNodeIds, relatedId];
  learningCard.value = { ...card, relatedNodeIds, updatedAt: new Date().toISOString() };
  markStudyDirty();
}

function removeRelatedNode(relatedId: number) {
  const card = ensureLearningCard();
  learningCard.value = {
    ...card,
    relatedNodeIds: card.relatedNodeIds.filter((id) => id !== relatedId),
    updatedAt: new Date().toISOString(),
  };
  markStudyDirty();
}

function updateKeywords(value: string) {
  customKeywords.value = value;
  const card = ensureLearningCard();
  learningCard.value = {
    ...card,
    relatedKeywords: value.split(',').map((keyword) => keyword.trim()).filter(Boolean),
    updatedAt: new Date().toISOString(),
  };
  markStudyDirty();
}

function errorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as { status?: unknown; response?: { status?: unknown } };
  const status = candidate.status ?? candidate.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function isTransportOrUnavailableError(err: unknown): boolean {
  const status = errorStatus(err);
  if (status === 401 || status === 403) return false;
  if (status !== undefined) return status === 0 || status >= 500;
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return err instanceof TypeError || /failed to fetch|network|offline|unavailable|timeout|timed out/.test(message);
}

async function persistLearningRecord(successText = '学习卡片已保存') {
  const saveFavorite = favorite.value;
  if (!saveFavorite) return;
  const saveNodeId = nodeId.value;
  const saveUserId = activeUserId.value;
  const saveSignedIn = isSignedIn.value;
  const saveScope = localLearningScope.value;
  const saveNote = note.value;
  const saveCard = learningCard.value;
  const serialized = serializeLearningNote(saveNote, saveCard);
  const saveGeneration = studyEditGeneration;
  const requestStillCurrent = () =>
    nodeId.value === saveNodeId && activeUserId.value === saveUserId && isSignedIn.value === saveSignedIn;
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  localOnlyFallback.value = false;
  try {
    if (!saveSignedIn) {
      saveLocalLearningRecord(saveScope, saveNodeId, saveNote, saveCard);
      if (requestStillCurrent()) {
        localFavorite.value = { ...saveFavorite, note: serialized, updatedAt: new Date().toISOString() };
      }
    } else {
      const updated = await updateFavoriteNote(saveNodeId, { userId: saveUserId, note: serialized });
      if (requestStillCurrent()) {
        favorites.value = favorites.value.map((item) => (item.nodeId === saveNodeId ? updated : item));
      }
    }
    if (requestStillCurrent() && studyEditGeneration === saveGeneration) {
      successMessage.value = successText;
      clearStudyDirty();
    }
  } catch (err) {
    const status = errorStatus(err);
    if (isTransportOrUnavailableError(err)) {
      const fallbackNote = requestStillCurrent() ? note.value : saveNote;
      const fallbackCard = requestStillCurrent() ? learningCard.value : saveCard;
      saveLocalLearningRecord(saveScope, saveNodeId, fallbackNote, fallbackCard);
      if (requestStillCurrent()) {
        // The fallback writes the current editor values, including edits made while the server was pending.
        clearStudyDirty();
        localOnlyFallback.value = true;
        successMessage.value = '仅本机保存：网络暂不可用，学习记录已保存在本浏览器中。';
      }
    } else if (requestStillCurrent() && status === 401) {
      error.value = '登录状态已失效，学习记录未同步，请重新登录。';
    } else if (requestStillCurrent() && status === 403) {
      error.value = '当前账号没有权限保存这条学习记录。';
    } else if (requestStillCurrent()) {
      error.value = err instanceof Error ? err.message : '学习记录保存失败';
    }
  } finally {
    saving.value = false;
  }
}

async function rateReview(reviewState: LearningCard['reviewState']) {
  const card = ensureLearningCard();
  const now = new Date().toISOString();
  learningCard.value = {
    ...card,
    reviewState,
    reviewCount: card.reviewCount + 1,
    lastReviewedAt: now,
    updatedAt: now,
  };
  reviewRevealed.value = false;
  await persistLearningRecord('复习结果已保存');
}

function localFavoriteFromRecord(local: ReturnType<typeof loadLocalLearningRecord>): FavoriteNodeItem | null {
  if (local.source === 'empty') return null;
  const serialized = JSON.stringify({ version: 1, privateNote: local.privateNote, card: local.card });
  return {
    id: `local-${nodeId.value}`,
    nodeId: nodeId.value,
    nodeName: node.value?.name ?? `节点 ${nodeId.value}`,
    note: serialized,
    createdAt: local.card?.createdAt ?? new Date().toISOString(),
    updatedAt: local.card?.updatedAt ?? new Date().toISOString(),
  } as unknown as FavoriteNodeItem;
}

async function loadFavorites() {
  const requestNodeId = nodeId.value;
  const requestUserId = activeUserId.value;
  // Read the private fallback first so a refresh can render it while the server request is pending.
  const local = loadLocalLearningRecord(localLearningScope.value, nodeId.value);
  localFavorite.value = localFavoriteFromRecord(local);
  if (!activeUserId.value) {
    favorites.value = [];
    loadedFavoriteUserId = 0;
    if (!hasUnsavedEdits.value) setLearningNote(localFavorite.value?.note ?? '');
    return;
  }

  // Clear only when the account changes; on a same-account failure retain the current server record.
  if (loadedFavoriteUserId !== activeUserId.value) favorites.value = [];
  try {
    const response = await fetchFavoriteNodes({ userId: requestUserId, page: 1, size: 100 });
    if (nodeId.value !== requestNodeId || activeUserId.value !== requestUserId) return;
    favorites.value = response.items;
    loadedFavoriteUserId = activeUserId.value;
    localOnlyFallback.value = !favorites.value.some((item) => item.nodeId === nodeId.value) && Boolean(localFavorite.value);
  } catch (err) {
    if (nodeId.value !== requestNodeId || activeUserId.value !== requestUserId) return;
    // Keep localFavorite and the current private card; a sync error is non-blocking.
    localOnlyFallback.value = Boolean(localFavorite.value);
    error.value = '学习清单暂时无法同步，已保留当前未保存编辑。';
    if (!hasUnsavedEdits.value) setLearningNote(localFavorite.value?.note ?? '');
    void err;
  }
}

async function loadAll() {
  // 重入 guard 必须在 loading.value = true 之前：装载会跟着 activeUserId / nodeId 的 watcher
  // 再次触发，若与飞行中的装载并发，慢的那次（activeUserId 还是 0）可能后写，
  // 把笔记与上一课/下一课清空。
  // 但被挡下的请求必须排队重放，不能直接 return：App.vue 的 /api/auth/me 是异步的，如果它正好
  // 落在首次装载的飞行窗口里，这次 watcher 触发就会被吞掉，loadFavorites() 永远不会跑，
  // 笔记与上一课/下一课会永久停在空状态。
  if (loading.value) {
    reloadRequested.value = true;
    return;
  }
  if (!nodeId.value) {
    loading.value = false;
    node.value = null;
    relations.value = null;
    favorites.value = [];
    note.value = '';
    learningCard.value = null;
    customKeywords.value = '';
    resetReviewFlow();
    return;
  }
  loading.value = true;
  reloadRequested.value = false;
  const requestGeneration = ++loadGeneration;
  const requestNodeId = nodeId.value;
  const requestUserId = activeUserId.value;
  const requestStillCurrent = () =>
    loadGeneration === requestGeneration && nodeId.value === requestNodeId && activeUserId.value === requestUserId;
  error.value = '';
  successMessage.value = '';
  try {
    const [nodeResult, relationResult] = await Promise.allSettled([
      fetchGraphNode(nodeId.value),
      fetchGraphRelations(nodeId.value, { depth: 1, limit: 20 }),
      // 与节点资料并行等待：收藏列表失败只该影响笔记与上一课/下一课，
      // 不该把已经取到的节点资料一起丢掉。
      loadFavorites(),
    ]);
    if (!requestStillCurrent()) return;
    node.value = nodeResult.status === 'fulfilled' ? nodeResult.value : null;
    relations.value = relationResult.status === 'fulfilled' ? relationResult.value : null;
    if (nodeResult.status === 'rejected') {
      error.value = '这个节点打不开，可能已被删除或未公开。';
    }
    if (isSignedIn.value && !hasUnsavedEdits.value) setLearningNote(favorite.value?.note ?? '');
  } catch (err) {
    if (!requestStillCurrent()) return;
    error.value = err instanceof Error ? err.message : '学习内容加载失败';
    node.value = null;
    relations.value = null;
  } finally {
    // 装载路径上只能在这里复位：guard 依赖 loading，若在 try 之内提前置 false，重入保护就
    // 失效了。（上面 invalid-node 的提前返回里也有一句 loading.value = false —— 那是无害的
    // no-op：能走到那里说明 guard 没拦截，flag 本来就是 false。）
    loading.value = false;
    // 重放装载期间被 guard 挡下的请求。终止性：只有「上一次装载期间真的有人请求过」才会重放，
    // 而标记在每次装载开始（await 之前）就被清空，所以每个被丢弃的请求最多换来一次重放，
    // 不会自激成循环；同一次装载期间的多次请求也会合并成一次重放。
    if (reloadRequested.value) {
      reloadRequested.value = false;
      void loadAll();
    }
  }
}

async function saveNote() {
  await persistLearningRecord('学习记录已保存');
}

/** 让 AI 读一遍当前节点：SUMMARY 出结构化总结，EXPAND 出延伸学习建议，QUESTION 出自测问题。 */
async function runStudyAi(intent: StudyAiIntent) {
  if (!node.value || !isSignedIn.value) return;
  // 代次在发请求之前捕获。响应回来时只有代次仍然相等，才允许写进当前状态。
  const generation = (aiGeneration += 1);
  const requestedNodeId = nodeId.value;
  aiLoading.value = true;
  aiIntent.value = intent;
  aiAnswer.value = '';
  aiAnswerNodeId.value = 0;
  aiSuggestions.value = [];
  aiDegraded.value = false;
  aiFailure.value = '';
  // 新问题生成时，清掉旧的回答和揭晓状态
  aiQuizAnswer.value = '';
  aiQuizRevealed.value = false;
  error.value = '';
  try {
    const result = await requestStudyAi({ node: node.value, note: note.value, intent, currentRoute: route.fullPath });
    // 过期响应（用户已经切走或又发了一次）：连答案带 loading 复位一起丢掉。
    if (generation !== aiGeneration) return;
    aiAnswer.value = result.answer;
    aiAnswerNodeId.value = requestedNodeId;
    aiDegraded.value = result.degraded;
    // 自测问题区的重点是「先自己答」，下面再挂一排导航链接会把作答打断。
    aiSuggestions.value = intent === 'QUESTION' ? [] : result.suggestions;
  } catch (err) {
    if (generation !== aiGeneration) return;
    // 只按失败类型给中文说明；原始英文错误（Failed to fetch）绝不上屏，也绝不冒充后端兜底。
    aiFailure.value = err instanceof StudyAiFailure ? err.kind : 'transport';
    aiAnswer.value = '';
    aiAnswerNodeId.value = 0;
    aiSuggestions.value = [];
    aiDegraded.value = false;
  } finally {
    // 只有当前这次请求有权关掉 spinner：过期请求的复位会把新请求的「正在阅读」误关掉。
    if (generation === aiGeneration) aiLoading.value = false;
  }
}

/** 把 AI 生成的问题填入学习卡片的自测问题字段。 */
function applyAiQuestionToCard() {
  if (!aiAnswer.value || aiDegraded.value) return;
  if (aiAnswerNodeId.value !== nodeId.value) return;
  if (aiIntent.value !== 'QUESTION') return;
  updateCardField('selfTestQuestion', aiAnswer.value);
  successMessage.value = '已填入自测问题，可以开始作答。';
}

/** 只把答案贴进 textarea，不落库：写入仍然只由 saveNote() 负责。降级态与跨节点答案一律拒绝。 */
function appendAiToNote() {
  if (!aiAnswer.value || aiDegraded.value) return;
  // 结构性保证：答案必须属于当前显示的节点。切换节点时 resetStudyAi() 已经清空，
  // 这一句让「某个路径漏了重置」也不会变成张冠李戴的写入。
  if (aiAnswerNodeId.value !== nodeId.value) return;
  const head = aiTitle.value ? `\n\n【${aiTitle.value}】\n` : '\n\n';
  note.value = `${note.value.trimEnd()}${head}${aiAnswer.value}`.trim();
  markStudyDirty();
  successMessage.value = '已追加到笔记，确认后点「保存笔记」写入。';
}

async function addToFavorites() {
  if (!isSignedIn.value) {
    saveLocalLearningRecord('anonymous', nodeId.value, note.value, null);
    clearStudyDirty();
    await loadAll();
    successMessage.value = '已加入本机学习清单';
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    await createFavoriteNode({ userId: activeUserId.value, nodeId: nodeId.value });
    await loadAll();
    successMessage.value = '已加入学习清单';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加入收藏失败';
  } finally {
    saving.value = false;
  }
}

function goToLesson(item: FavoriteNodeItem) {
  void router.push(`/favorites/study/${item.nodeId}`);
}

watch(nodeId, () => {
  // 换节点是用户的明确放弃动作：旧节点编辑不应污染新节点。
  clearStudyDirty();
  // 换节点 = 上一份 AI 答案和复习揭晓状态作废。
  resetStudyAi();
  learningCard.value = null;
  customKeywords.value = '';
  resetReviewFlow();
  void loadAll();
});

// 刷新时只有 token 从 localStorage 恢复，App.vue 异步取 /api/auth/me，所以首次挂载
// activeUserId 仍是 0，loadFavorites() 直接返回空，笔记与上一课/下一课会永久停在
// 「该节点不在你的收藏里」。这个 watcher 让装载跟随用户 id 就绪；immediate 覆盖
// 「异步页面组件挂载时载荷已经在」的顺序，同时它也是本页**唯一**的挂载期触发点 ——
// 不要再补一个 onMounted 之类的触发，那只会被 guard 排队成一次多余的重放。
// loadAll() 不并发重入：载荷如果正好落在首次装载的飞行窗口里，这次触发会被排进
// reloadRequested 并在装载结束时重放。
watch(activeUserId, () => {
  // Auth hydration is reconciliation, not a deliberate node change or save; preserve the current draft.
  void loadAll();
}, { immediate: true });
</script>

<template>
  <section class="learning-study-page">
    <button class="secondary-action compact study-back" type="button" @click="router.push('/favorites')">
      <ArrowLeft :size="15" />
      返回学习清单
    </button>

    <div v-if="loading" class="state-panel compact-state">
      <Loader2 :size="22" class="spin" />
      <span>正在打开学习内容</span>
    </div>

    <div v-else-if="!node" class="learn-empty-card">
      <span class="learn-empty-art" aria-hidden="true"><BookOpen :size="30" /></span>
      <strong>没找到这个学习内容</strong>
      <span>{{ error || '链接里的节点编号不合法，回到学习清单重新选一个。' }}</span>
      <button class="primary-action compact learn-cta" type="button" @click="router.push('/favorites')">返回学习清单</button>
    </div>

    <template v-else>
      <div v-if="error" class="inline-error compact-message">{{ error }}</div>
      <div v-if="successMessage" class="inline-success compact-message">{{ successMessage }}</div>

      <div class="study-grid">
        <article class="study-read-column">
          <div class="side-section study-material">
            <LearningCover :node-id="nodeId" :alt="node.name" :color="node.nodeTypeColor" :icon-char="node.nodeTypeName.slice(0, 1)" />
            <p class="eyebrow">学习内容</p>
            <h1 class="study-title">{{ node.name }}</h1>
            <div class="study-material-meta">
              <em class="type-chip" :style="{ borderColor: node.nodeTypeColor || '#d7a84f' }">{{ node.nodeTypeName }}</em>
              <span>{{ node.nodeCode }}</span>
              <span>{{ [node.province, node.city].filter(Boolean).join(' ') || '未知地区' }}</span>
              <span v-if="node.historicalPeriod">{{ node.historicalPeriod }}</span>
              <span v-if="node.popularityCount !== undefined">热度 {{ node.popularityCount }}</span>
            </div>
            <div v-if="nodeContentHtml" class="markdown-body study-material-body" v-html="nodeContentHtml" />
            <p v-else class="study-material-empty">这个节点还没有公开的简介正文。</p>
          </div>

          <section class="side-section study-relations">
            <h3>关系脉络</h3>
            <div v-if="relationGroups.length === 0" class="chain-empty">
              <Network :size="16" />
              <span>暂无公开关联，可以先去学习地图看看这个节点的位置。</span>
            </div>
            <div v-else class="study-relation-groups">
              <div v-for="group in relationGroups" :key="group.label" class="study-relation-group">
                <p>{{ group.label }}</p>
                <button
                  v-for="item in group.items"
                  :key="`${group.label}-${item.id}`"
                  class="secondary-action compact"
                  type="button"
                  @click="router.push(`/favorites/study/${item.id}`)"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>
          </section>
        </article>

        <aside class="study-learn-column">
          <section class="side-section study-note" aria-labelledby="learning-note-title">
            <div class="study-note-head">
              <h3 id="learning-note-title">我的学习卡片</h3>
              <span class="learning-storage-badge" :class="isSignedIn && !localOnlyFallback ? 'is-synced' : 'is-local'" aria-live="polite">
                {{ isSignedIn && !localOnlyFallback ? '已同步' : '仅本机保存' }}
              </span>
            </div>
            <template v-if="favorite">
              <div class="learning-review-flow" aria-live="polite">
                <template v-if="learningCard">
                  <!-- 步骤 1：写核心理解 -->
                  <div class="study-step">
                    <div class="study-step-head">
                      <span class="study-step-num" aria-hidden="true">1</span>
                      <label for="learning-core" class="study-step-label">写核心理解</label>
                      <span v-if="learningCard.coreUnderstanding" class="study-step-done">✓</span>
                    </div>
                    <p class="study-step-hint">用自己的话总结这个节点最关键的内容，这是以后复习时的对照答案。</p>
                    <textarea id="learning-core" :value="learningCard.coreUnderstanding" rows="3" placeholder="用自己的话写下核心理解…" @input="updateCardField('coreUnderstanding', ($event.target as HTMLTextAreaElement).value)" />
                  </div>

                  <!-- 步骤 2：设自测问题 -->
                  <div class="study-step">
                    <div class="study-step-head">
                      <span class="study-step-num" aria-hidden="true">2</span>
                      <label for="learning-question" class="study-step-label">设自测问题</label>
                      <span v-if="learningCard.selfTestQuestion" class="study-step-done">✓</span>
                    </div>
                    <p class="study-step-hint">写一个能检验自己是否理解的问题，复习时先回想答案再揭晓对照。</p>
                    <textarea id="learning-question" :value="learningCard.selfTestQuestion" rows="2" placeholder="写一个检验自己理解的问题…" @input="updateCardField('selfTestQuestion', ($event.target as HTMLTextAreaElement).value)" />
                    <div class="study-step-ai">
                      <button class="secondary-action compact" type="button" :disabled="aiLoading || !isSignedIn || !favorite" @click="runStudyAi('QUESTION')">
                        <Loader2 v-if="aiLoading && aiIntent === 'QUESTION'" :size="14" class="spin" />
                        <HelpCircle v-else :size="14" />
                        让 AI 帮我出题
                      </button>
                      <button v-if="aiIntent === 'QUESTION' && aiAnswerMatchesNode && !aiDegraded" class="secondary-action compact" type="button" @click="applyAiQuestionToCard">采用这个问题</button>
                    </div>
                  </div>

                  <!-- 步骤 3：复习自测 -->
                  <div class="study-step">
                    <div class="study-step-head">
                      <span class="study-step-num" aria-hidden="true">3</span>
                      <span class="study-step-label">复习自测</span>
                      <span v-if="learningCard.reviewCount > 0" class="study-step-done">✓</span>
                    </div>
                    <p class="study-step-hint">先看自测问题，在脑子里回想答案，再揭晓核心理解对照。</p>
                    <div class="review-quiz-box">
                      <template v-if="!reviewRevealed">
                        <p class="learn-task-hint">先想一想答案，再揭晓核心理解。</p>
                        <button class="secondary-action compact review-reveal-btn" type="button" @click="reviewRevealed = true">揭晓核心理解</button>
                      </template>
                      <template v-else>
                        <div class="learning-review-answer">
                          <strong>核心理解</strong>
                          <p>{{ learningCard.coreUnderstanding || '还没有填写核心理解。' }}</p>
                          <div class="study-review-actions" role="group" aria-label="自我评估">
                            <button class="secondary-action compact" :class="{ 'is-active': learningCard.reviewState === 'mastered' }" type="button" @click="rateReview('mastered')">掌握</button>
                            <button class="secondary-action compact" :class="{ 'is-active': learningCard.reviewState === 'fuzzy' }" type="button" @click="rateReview('fuzzy')">模糊</button>
                            <button class="secondary-action compact" :class="{ 'is-active': learningCard.reviewState === 'todo' }" type="button" @click="rateReview('todo')">不会</button>
                          </div>
                          <small class="learning-review-meta">复习 {{ learningCard.reviewCount }} 次<span v-if="learningCard.lastReviewedAt"> · 最近 {{ learningCard.lastReviewedAt.slice(0, 10) }}</span></small>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- 步骤 4：关联与关键词 -->
                  <div class="study-step">
                    <div class="study-step-head">
                      <span class="study-step-num" aria-hidden="true">4</span>
                      <span class="study-step-label">关联与关键词</span>
                    </div>
                    <p class="study-step-hint">把相关节点和关键词串起来，形成自己的知识网络。</p>
                    <fieldset class="study-related-combined">
                      <legend>关联节点</legend>
                      <div class="related-selected-row">
                        <span v-for="item in selectedRelatedNodes" :key="`selected-related-${item.id}`" class="related-chip">
                          {{ item.name }}
                          <button type="button" :aria-label="`移除${item.name}`" @click="removeRelatedNode(item.id)">×</button>
                        </span>
                        <small v-if="selectedRelatedNodes.length === 0" class="related-empty-hint">尚未选择关联节点</small>
                      </div>
                      <div class="related-candidates-row">
                        <template v-for="group in relationGroups" :key="group.label">
                          <button v-for="item in group.items" :key="`related-${item.id}`" class="related-candidate-btn" :class="{ 'is-selected': learningCard.relatedNodeIds.includes(item.id) }" type="button" :aria-pressed="learningCard.relatedNodeIds.includes(item.id)" @click="toggleRelatedNode(item.id)">{{ item.name }}</button>
                        </template>
                        <small v-if="relationGroups.length === 0">暂无可选关联节点</small>
                      </div>
                    </fieldset>
                    <label for="learning-keywords" class="study-step-sub-label">自定义关键词</label>
                    <input id="learning-keywords" :value="customKeywords" placeholder="用逗号分隔关键词" @input="updateKeywords(($event.target as HTMLInputElement).value)" />
                  </div>
                </template>
                <button v-else class="secondary-action compact" type="button" @click="ensureLearningCard()">建立学习卡片</button>
              </div>
              <label for="private-learning-note">私人笔记</label>
              <textarea id="private-learning-note" :value="note" rows="5" placeholder="写下仅自己可见的补充、疑问、待查证的点…" @input="updatePrivateNote(($event.target as HTMLTextAreaElement).value)" />
              <button class="primary-action compact" type="button" :disabled="saving" @click="saveNote">
                <Loader2 v-if="saving" :size="16" class="spin" />
                <NotebookPen v-else :size="16" />
                保存学习记录
              </button>
            </template>
            <div v-else class="chain-empty">
              <NotebookPen :size="16" />
              <span>该节点不在你的收藏里，加入后即可记录学习卡片。</span>
            </div>
            <button v-if="!favorite" class="primary-action compact" type="button" :disabled="saving" @click="addToFavorites">加入学习清单</button>
          </section>

          <section class="side-section study-ai">
            <div class="study-note-head">
              <h3>AI 学习助手</h3>
              <small v-if="!isSignedIn">登录后可用</small>
            </div>
            <div class="study-ai-actions">
              <button class="primary-action compact" type="button" :disabled="aiLoading || !isSignedIn" @click="runStudyAi('SUMMARY')">
                <Loader2 v-if="aiLoading && aiIntent === 'SUMMARY'" :size="15" class="spin" />
                <Wand2 v-else :size="15" />
                AI 总结
              </button>
              <button class="secondary-action compact" type="button" :disabled="aiLoading || !isSignedIn" @click="runStudyAi('EXPAND')">
                <Loader2 v-if="aiLoading && aiIntent === 'EXPAND'" :size="15" class="spin" />
                <Sparkles v-else :size="15" />
                扩展学习
              </button>
            </div>
            <div v-if="aiLoading" class="state-panel compact-state"><Loader2 :size="18" class="spin" /><span>AI 正在阅读这个节点…</span></div>
            <!-- 请求本身失败（超时 / 空回答 / 断线）：只说清「这次没拿到回答」，不冒充系统的兜底提示。 -->
            <div v-else-if="aiFailure" class="study-ai-failure" aria-live="polite">
              <p class="learn-task-hint">{{ aiFailureMessage }}</p>
              <div class="study-ai-output-actions">
                <button class="secondary-action compact" type="button" :disabled="aiLoading" @click="runStudyAi(aiIntent || 'SUMMARY')">重新生成</button>
              </div>
            </div>
            <!-- 只有属于当前节点的答案才渲染；跨节点的旧答案连按钮都不会出现在 DOM 里。 -->
            <div v-else-if="aiAnswerMatchesNode" class="study-ai-output" aria-live="polite">
              <template v-if="aiDegraded">
                <p class="learn-task-hint">
                  这次没有拿到真实回答：AI 服务返回的是它自己的兜底提示，不是对「{{ node.name }}」的解读，也不会写进笔记：
                </p>
                <p class="learn-task-hint">{{ aiAnswer }}</p>
                <div class="study-ai-output-actions">
                  <button class="secondary-action compact" type="button" :disabled="aiLoading" @click="runStudyAi(aiIntent || 'SUMMARY')">重新生成</button>
                </div>
              </template>
              <template v-else>
                <strong>{{ aiTitle }}</strong>
                <div class="markdown-body" v-html="renderMarkdown(aiAnswer)" />
                <!-- AI 自测问题：用户先作答，再对照核心理解 -->
                <template v-if="aiIntent === 'QUESTION'">
                  <div class="ai-quiz-box">
                    <label for="ai-quiz-answer">我的回答</label>
                    <textarea id="ai-quiz-answer" v-model="aiQuizAnswer" rows="3" placeholder="先写下自己的回答，再揭晓对照…" />
                    <template v-if="!aiQuizRevealed">
                      <button class="secondary-action compact" type="button" @click="aiQuizRevealed = true">揭晓核心理解对照</button>
                    </template>
                    <template v-else>
                      <div class="learning-review-answer">
                        <strong>核心理解</strong>
                        <p>{{ learningCard?.coreUnderstanding || '还没有填写核心理解。' }}</p>
                        <p class="learn-task-hint">对比你的回答和核心理解，评估自己的掌握程度。</p>
                      </div>
                    </template>
                  </div>
                </template>
                <!-- 指路只走这一条通道：后端校验过的 suggestions（正文里的路由已被清洗掉）。
                     用站内链接而不是把 /xxx 印在正文里 —— 读者要的是页面，不是地址。 -->
                <nav v-if="aiSuggestions.length" class="study-ai-suggestions" aria-label="相关页面">
                  <span class="study-ai-suggestions-label">想接着看可以打开</span>
                  <RouterLink
                    v-for="suggestion in aiSuggestions"
                    :key="suggestion.route"
                    class="study-ai-suggestion"
                    :to="suggestion.route"
                    :title="suggestion.reason || suggestion.title"
                  >
                    {{ suggestion.title }}
                  </RouterLink>
                </nav>
                <div class="study-ai-output-actions">
                  <button class="secondary-action compact" type="button" :disabled="aiLoading" @click="runStudyAi(aiIntent || 'SUMMARY')">重新生成</button>
                  <button v-if="aiIntent === 'QUESTION'" class="primary-action compact" type="button" :disabled="!favorite" @click="applyAiQuestionToCard">填入自测问题</button>
                  <button v-else class="primary-action compact" type="button" :disabled="!favorite" @click="appendAiToNote">追加到笔记</button>
                </div>
              </template>
            </div>
            <p v-else class="learn-task-hint">{{ aiIdleHint }}</p>
          </section>

          <nav class="study-lesson-nav" aria-label="上一课下一课">
            <button class="secondary-action compact" type="button" :disabled="!previousLesson" @click="previousLesson && goToLesson(previousLesson)">
              <ArrowLeft :size="14" />
              {{ previousLesson ? previousLesson.nodeName : '已是第一课' }}
            </button>
            <button class="secondary-action compact" type="button" :disabled="!nextLesson" @click="nextLesson && goToLesson(nextLesson)">
              {{ nextLesson ? nextLesson.nodeName : '已是最后一课' }}
              <ArrowRight :size="14" />
            </button>
          </nav>
        </aside>
      </div>
    </template>
  </section>
</template>
