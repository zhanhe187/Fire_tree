import { sendAiChat } from '../../ai/services/ai';
import type { AiNavigationSuggestion } from '../../ai/services/ai';
import type { GraphNodeItem } from '../../graph/services/graph';

export type StudyAiIntent = 'SUMMARY' | 'EXPAND' | 'QUESTION';

/**
 * Why an attempt produced no answer at all — as opposed to a *response* that carried the
 * backend's own fallback text (that one is a successful request with `degraded === true`).
 *
 * - `timeout`: nothing came back inside STUDY_AI_TIMEOUT_MS.
 * - `empty`: the backend claimed a real completion (`source === AI_CHAT_COMPLETIONS`) but sent
 *   blank text, so there is nothing to show even though the request "succeeded".
 * - `transport`: the request itself failed (offline, DNS, connection reset, 5xx, abort).
 */
export type StudyAiFailureKind = 'timeout' | 'empty' | 'transport';

export class StudyAiFailure extends Error {
  readonly kind: StudyAiFailureKind;

  constructor(kind: StudyAiFailureKind, message: string) {
    super(message);
    this.name = 'StudyAiFailure';
    this.kind = kind;
  }
}

/**
 * The backend caps its own upstream AI call at 10s (`heritage.ai.timeout-seconds`), so the client
 * waits a comfortable multiple of that before giving up. Without this bound a request that never
 * settles leaves the study page stuck on 「AI 正在阅读这个节点…」 with both buttons disabled
 * forever, which reads as if the page were still working.
 *
 * The shared transport (`services/http.ts` -> `send()`) does not take an AbortSignal, so this is a
 * client-side deadline rather than a socket-level cancellation: we stop waiting and discard the
 * eventual response. Callers see exactly one thing either way — the attempt is over and produced
 * no answer.
 */
export const STUDY_AI_TIMEOUT_MS = 20000;

export interface StudyAiResult {
  answer: string;
  degraded: boolean;
  /**
   * The navigation the backend validated for us (`parseSuggestions` drops any route that is not in
   * its own pageIndex and caps the list at 4). This is the only route-carrying channel the study
   * page is allowed to show — the answer body is free text and gets `stripRouteHints` applied.
   */
  suggestions: AiNavigationSuggestion[];
}

/**
 * A markdown link whose target is a site route: keep the label, drop the address.
 * `/explore`-style addresses are meaningless inside a study note, and a dead-looking `[]()` would
 * be worse than plain text.
 */
const MARKDOWN_ROUTE_LINK = /\[([^\]\n]*)\]\(\s*\/[^)\s]*\s*\)/g;

/**
 * A bare route (`/explore`, `/graph/board`, `/favorites/checkin`). Deliberately narrow:
 *
 * - it must start with `/`, so dates (`2026/10/24`) and ratios (`10/24`) are untouched;
 * - the first segment must start with a letter, so a path-looking file name is not swallowed;
 * - the character before it must not be a word character or another slash, so `A/B`,
 *   `https://…/representative.html` and already-handled links survive.
 *
 * The preceding character is captured and re-emitted instead of using a lookbehind, because a
 * lookbehind is a parse-time SyntaxError on Safari < 16.4 — there the whole module would fail to
 * load, which is far worse than a leftover slash.
 */
const BARE_ROUTE = /(^|[^\w/])\/[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)*\/?/g;

/** The wrapper left behind once its route is gone: `（对应 ）`, `（见：）`, `()`. */
const EMPTY_HINT_PAREN = /[（(]\s*(?:对应|参见|详见|见|入口|页面)?\s*[:：]?\s*[）)]/g;

/**
 * Defence in depth for the route guard in OUTPUT_GUARD: prompts are a request, not a guarantee, so
 * a model that ignores the instruction must not be able to put a route on screen. Anything that is
 * not a route is preserved verbatim — this is not a markdown renderer and must never rewrite prose.
 */
export function stripRouteHints(answer: string): string {
  return answer
    .replace(MARKDOWN_ROUTE_LINK, '$1')
    .replace(BARE_ROUTE, '$1')
    .replace(EMPTY_HINT_PAREN, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([，。；、！？：）】」])/g, '$1')
    .replace(/^[ \t]*[-*+][ \t]*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Keep only what the study page can safely render: portal page entries, real route shapes, no
 * duplicates. `audience === 'admin'` is filtered again here rather than trusted from the backend,
 * because this list is now rendered as links.
 */
function usableSuggestions(items: AiNavigationSuggestion[] | undefined): AiNavigationSuggestion[] {
  const seen = new Set<string>();
  const kept: AiNavigationSuggestion[] = [];
  for (const item of items ?? []) {
    if (!item || item.audience === 'admin') continue;
    const route = (item.route ?? '').trim();
    if (!route.startsWith('/') || route.includes('//') || seen.has(route)) continue;
    seen.add(route);
    kept.push({
      title: (item.title ?? '').trim() || route,
      route,
      audience: item.audience,
      reason: (item.reason ?? '').trim(),
    });
    if (kept.length >= 4) break;
  }
  return kept;
}

/**
 * The backend endpoint is a navigation assistant: it carries no node content of its own, so the
 * study material and the user's own note have to be composed into `message` here. It also forces
 * a JSON completion, and answers with a navigation fallback (see DEGRADED_SOURCES below) when the
 * model is unconfigured or its answer cannot be parsed — which is why the prompt states the
 * output requirements explicitly instead of relying on the system prompt.
 *
 * The backend is a *navigation* assistant: its system prompt hands the model a pageIndex of
 * `{title, route, ...}` entries and tells it to answer with route suggestions, so a bare route
 * (`/explore`, `/graph/board`) tends to be pasted into the answer body next to each suggestion.
 * The study page renders `answer` only — the validated `suggestions` channel is never shown — so
 * those paths reach the reader as raw URLs inside a study note, which is noise there: this page is
 * for reading a node, not for reading the site map.
 *
 * Page *names* are kept on purpose: they are what the portal navigation actually calls these
 * places, and they stay meaningful even when a route later changes.
 */
const OUTPUT_GUARD: string[] = [
  '不要输出以 / 开头的路由路径、页面地址或英文标识，也不要输出 markdown 链接地址；需要指引页面时只用中文页面名称（例如「非遗项目浏览」「知识图谱看板」「问答台」「资料提交」）。',
];

const INTENT_RULES: Record<StudyAiIntent, string[]> = {
  SUMMARY: [
    '请为下面这个非遗节点写一份学习用的结构化总结。',
    '输出要求：markdown；分四个小节 —— 一句话概括 / 核心技艺或特征 / 传承与地域 / 值得记住的三个点。',
    '总长控制在 300 到 500 字。只依据给出的资料；资料没提到的内容，明确写「资料未提及」，不要编造。',
  ],
  EXPAND: [
    '请为下面这个非遗节点给出延伸学习建议。',
    '输出要求：markdown；先给 3 到 5 条「可以继续探索的方向」（每条一句话说明为什么值得看），再给 2 到 3 个自检问题。',
    '只依据给出的资料，不要编造具体的人名、地名或书目。',
  ],
  QUESTION: [
    '请为下面这个非遗节点出一个自测问题，用来检验学习者是否真正理解了这个节点。',
    '输出要求：只输出一个问题，不要输出答案、解析或任何其他内容。问题应该具体、可回答，能够检验对核心技艺、历史背景或文化意义的理解。',
    '只依据给出的资料出题；资料没提到的内容不要考。',
  ],
};

export function buildStudyPrompt(node: GraphNodeItem, note: string, intent: StudyAiIntent): string {
  return [
    ...INTENT_RULES[intent],
    ...OUTPUT_GUARD,
    '',
    `节点名称：${node.name}`,
    `节点编码：${node.nodeCode}`,
    `节点类型：${node.nodeTypeName}`,
    `地区：${[node.province, node.city].filter(Boolean).join(' ') || '未标注'}`,
    `历史时期：${node.historicalPeriod || '未标注'}`,
    `简介：${node.summary || '无'}`,
    `正文摘要：${(node.content || '').slice(0, 800) || '无'}`,
    `我的笔记：${note.trim() || '（无）'}`,
  ].join('\n');
}

export async function requestStudyAi(params: {
  node: GraphNodeItem;
  note: string;
  intent: StudyAiIntent;
  currentRoute: string;
}): Promise<StudyAiResult> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      sendAiChat({
        message: buildStudyPrompt(params.node, params.note, params.intent),
        audience: 'portal',
        currentRoute: params.currentRoute,
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new StudyAiFailure('timeout', `study AI request exceeded ${STUDY_AI_TIMEOUT_MS}ms`));
        }, STUDY_AI_TIMEOUT_MS);
      }),
    ]);

    // Only AI_CHAT_COMPLETIONS is a real completion: both AI_UNAVAILABLE_FALLBACK and
    // NAVIGATION_FALLBACK are backend-authored boilerplate about the site's own pages, not an
    // answer about this node. Callers must render them as unavailable rather than as a summary.
    const degraded = response.source !== 'AI_CHAT_COMPLETIONS';
    const raw = (response.answer ?? '').trim();
    // The fallback text is shown as-is inside the "no real answer" panel (it is not written into the
    // note either), so only a real completion is passed through the route stripper.
    const answer = degraded ? raw : stripRouteHints(raw);
    if (!answer) {
      // An "empty answer" with a real source used to fall through to the page's idle hint, as if
      // no request had ever been made. It is a failed attempt and has to be reported as one.
      // Stripping can empty an answer that was nothing but a list of routes — that is equally
      // useless to a reader, so it takes the same branch instead of showing a blank card.
      throw new StudyAiFailure(
        'empty',
        degraded ? 'AI returned an empty fallback' : 'AI_CHAT_COMPLETIONS returned an empty answer',
      );
    }
    // A degraded response's suggestions come from the navigation fallback, not from a real reading;
    // surfacing them would look like the model had an opinion about this node.
    return { answer, degraded, suggestions: degraded ? [] : usableSuggestions(response.suggestions) };
  } catch (error) {
    if (error instanceof StudyAiFailure) throw error;
    // The raw transport message ("Failed to fetch") is kept for debugging only: callers must never
    // render it, because it is English framework text, not an explanation of what happened.
    throw new StudyAiFailure('transport', error instanceof Error ? error.message : String(error));
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}
