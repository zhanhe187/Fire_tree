import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/**
 * Extract the body of a top-level function by matching braces.
 *
 * Scoping an assertion to one function must not mean "everything after its signature":
 * that slice also contains every later top-level declaration, so a count of a token
 * inside it (e.g. `loading.value = false;`) would break as soon as an unrelated function
 * legitimately touched the same ref. Plain character scanning, no regex, so there is
 * nothing to escape or mis-balance.
 */
function functionBody(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${signature} must exist`);
  const open = source.indexOf('{', start + signature.length);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(open + 1, index);
      }
    }
  }
  assert.fail(`unbalanced braces after ${signature}`);
}

test('learning study route is registered and old space route redirects to the index page', () => {
  const router = read('./router/index.ts');

  assert.match(router, /path:\s*['"]\/favorites\/study\/:nodeId['"]/);
  assert.match(router, /name:\s*['"]heritage-favorites-study['"]/);
  assert.match(router, /path:\s*['"]\/favorites\/space['"],\s*redirect:\s*['"]\/favorites['"]/);
});

test('portal shell renders the three learning pages by path', () => {
  const app = read('./heritage-intro/App.vue');

  assert.match(app, /const LearningIndexPage\b/);
  assert.match(app, /import\('\.\.\/features\/favorite\/views\/portal\/LearningIndexPage\.vue'\)/);
  assert.match(app, /const LearningStudyPage\b/);
  assert.match(app, /import\('\.\.\/features\/favorite\/views\/portal\/LearningStudyPage\.vue'\)/);
  assert.match(app, /const LearningCheckinPage\b/);
  assert.match(app, /import\('\.\.\/features\/learning\/views\/portal\/LearningCheckinPage\.vue'\)/);
  assert.match(app, /<LearningStudyPage v-if="currentPath\.startsWith\('\/favorites\/study\/'\)"/);
  assert.match(app, /<LearningCheckinPage v-else-if="currentPath\.startsWith\('\/favorites\/checkin'\)"/);
  assert.match(app, /<LearningIndexPage v-else-if="currentPath === '\/favorites'"\s*\/>/);
  assert.doesNotMatch(app, /FavoriteGraphPage/);
  assert.doesNotMatch(app, /ModelParticleField|GlitchText|heritageStackImages|Stack\.vue/);
});

test('portal shell normalizes trailing slashes before matching the favorites path', () => {
  const app = read('./heritage-intro/App.vue');

  assert.match(app, /const currentPath = computed\(\(\) => route\.path\.replace\(/);
  assert.ok(app.includes("replace(/\\/+$/, '') || '/'"), 'currentPath must strip trailing slashes and fall back to "/"');
  assert.match(app, /v-if="currentPath === '\/favorites'"/);
  assert.match(app, /<LearningIndexPage v-else-if="currentPath === '\/favorites'"\s*\/>/);
});

test('cover loading is cached, viewport-gated and concurrency limited', () => {
  const covers = read('./features/favorite/services/learningCovers.ts');

  assert.match(covers, /const coverCache = new Map<number, string \| null>\(\)/);
  assert.match(covers, /export function readCachedCover\(nodeId: number\)/);
  assert.match(covers, /export async function loadNodeCover\(nodeId: number\)/);
  assert.match(covers, /MAX_CONCURRENT_COVERS = 4/);
  assert.match(covers, /fetchGraphNode\(nodeId\)/);
  assert.match(covers, /export function relationCountsFromGraph\(/);

  const cover = read('./features/favorite/components/LearningCover.vue');
  assert.match(cover, /IntersectionObserver/);
  assert.match(cover, /rootMargin/);
  assert.match(cover, /getBoundingClientRect/);
});

test('learning cover never pre-populates the cover cache and delegates loading to learningCovers', () => {
  const cover = read('./features/favorite/components/LearningCover.vue');

  // Regression: `primeCover(props.nodeId, readCachedCover(props.nodeId) ?? null)` wrote
  // `null` into the cache for uncached ids, so loadNodeCover() saw a cache hit and never
  // called fetchGraphNode — every card fell back to the type-colour placeholder forever.
  // Tripwire: the component must never touch the cover cache itself, not even through a
  // re-added helper, because only loadNodeCover may decide what a cache entry means.
  assert.doesNotMatch(cover, /primeCover/);

  const covers = read('./features/favorite/services/learningCovers.ts');
  // FavoriteGraphResponse is referenced in type position only; a value import would drag
  // the favorite module into every chunk that renders a cover.
  assert.match(
    covers,
    /import type\s*\{[^}]*\bFavoriteGraphResponse\b[^}]*\}\s*from\s*['"]\.\/favorite['"]/,
  );
  // `has()` is the "already resolved (possibly to no cover)" gate that priming poisoned.
  assert.match(covers, /if \(coverCache\.has\(nodeId\)\)/);
  assert.match(covers, /const node = await fetchGraphNode\(nodeId\)/);
  assert.match(covers, /coverCache\.set\(nodeId, url\)/);

  // Every helper the component imports must still be exported by the service.
  const importLine = cover
    .split('\n')
    .find((line) => line.includes("from '../services/learningCovers'"));
  assert.ok(importLine, 'LearningCover.vue must import its cover helpers from learningCovers');
  for (const name of ['loadNodeCover', 'readCachedCover']) {
    assert.ok(importLine.includes(name), `LearningCover.vue must keep importing ${name}`);
    assert.ok(
      covers.includes(`export function ${name}(`) || covers.includes(`export async function ${name}(`),
      `${name} must be exported by learningCovers.ts`,
    );
  }
});

test('learning index page is a paginated card grid with a study summary strip', () => {
  const page = read('./features/favorite/views/portal/LearningIndexPage.vue');

  assert.match(page, /size:\s*12/);
  assert.match(page, /fetchFavoriteNodes/);
  assert.match(page, /fetchFavoriteGraph/);
  assert.match(page, /relationCountsFromGraph\(/);
  assert.match(page, /fetchLearningCheckins/);
  assert.match(page, /class="learn-metrics"/);
  assert.match(page, /class="learning-card-grid"/);
  assert.match(page, /LearningCard/);
  assert.match(page, /\/favorites\/study\/\$\{nodeId\}/);
  assert.doesNotMatch(page, /learning-space-row-primary/);

  const card = read('./features/favorite/components/LearningCard.vue');
  assert.match(card, /LearningCover/);
  // The card must hand the whole favourite back to the page, otherwise the page
  // cannot know which node was opened. The navigation call site is checked below.
  assert.match(card, /@click="emit\('open', item\)"/);
  assert.match(card, /关联/);
  assert.match(card, /待建立|待复习|模糊|已掌握/);

  // `toStudy` is the only path to the study route, so it must exist in the page
  // script AND be wired to the card's `open` event. The plan's original assertion
  // demanded the literal `toStudy(item)`, which the plan's own code never contained
  // (the plan bound `@open="toStudy"` and declared `function toStudy(item)`), so the
  // assertion could not pass and guarded nothing. `@open="toStudy(item)"` would also
  // have been a valid runtime binding (the v-for alias is in scope and the emit
  // payload is the item); the page instead unwraps it explicitly, which is
  // equivalent. Matching the handler name alone would additionally pass for a
  // handler that ignores its argument — hence the exact `toStudy($event.nodeId)`
  // form, which is what the page actually implements.
  assert.match(page, /function toStudy\(nodeId: number\)/);
  assert.match(page, /@open="toStudy\(\$event\.nodeId\)"/);
});

test('learning index reloads once the auth payload arrives after the first mount', () => {
  const page = read('./features/favorite/views/portal/LearningIndexPage.vue');
  const script = page.split('</script>')[0];

  // Regression: a refresh restores only the token, so App.vue fetches /api/auth/me
  // asynchronously. On the first mount `activeUserId` is 0, loadCards() bails out and
  // the page kept the empty state ("你的学习清单还是空的") forever even though the user
  // has favourites. Measured in the browser with /api/auth/me delayed by 1500ms:
  // cards stayed 0 and 在学节点 stayed 0.
  assert.match(script, /watch\(activeUserId, \(\) => \{[\s\S]*?void loadAll\(\);\s*\}, \{ immediate: true \}\)/);
  assert.ok(
    script.includes('if (loading.value) {'),
    'loadAll must not re-enter: `immediate: true` lets the watcher run before onMounted',
  );
  // Without the guard the watcher and onMounted would fire two overlapping loadAll
  // runs and the slower, user-less one could win and blank the list. If auth resolves
  // during the first request, the guarded watcher call must be replayed afterwards.
  const loadAllBody = script.split('async function loadAll() {')[1] ?? '';
  assert.ok(
    loadAllBody.indexOf('if (loading.value) {') < loadAllBody.indexOf('loading.value = true;'),
    'the re-entry guard must precede the loading flag assignment',
  );
  assert.ok(loadAllBody.includes('reloadRequested.value = true;'), 'auth reloads must be queued while loading');
  assert.ok(loadAllBody.includes('reloadRequested.value = false;'), 'queued reloads must be consumed');
  assert.ok(loadAllBody.includes('void loadAll();'), 'queued auth reloads must replay after loading');
});

test('admin learner requests guard stale search and mutation state updates', () => {
  const page = read('./features/favorite/views/admin/FavoriteGraphPage.vue');
  const script = page.split('</script>')[0];
  const searchBody = functionBody(script, 'async function searchNodes()');

  assert.match(searchBody, /const generation = requestGeneration\.value;/);
  assert.match(searchBody, /if \(!isCurrent\(generation\)\) return;/);
  assert.ok(
    searchBody.indexOf('if (!isCurrent(generation)) return;') < searchBody.indexOf('nodeOptions.value = response.items;'),
    'stale node searches must not replace current node options',
  );

  for (const name of ['addFavorite', 'saveNote', 'removeFavorite']) {
    const signature = name === 'removeFavorite' ? 'async function removeFavorite(item: FavoriteNodeItem)' : `async function ${name}()`;
    const body = functionBody(script, signature);
    assert.match(body, /catch \(err\) \{[\s\S]*?if \(isCurrent\(generation\)\)/, `${name} errors must be generation guarded`);
    assert.match(body, /finally \{[\s\S]*?if \(isCurrent\(generation\)[\s\S]*?saving\.value = false;/, `${name} saving cleanup must be generation guarded`);
  }

  const resetBody = functionBody(script, 'function resetLearnerContext()');
  assert.match(resetBody, /favoriteForm\.nodeId = '';/);
  for (const flag of ['loading', 'graphLoading', 'saving']) {
    assert.match(resetBody, new RegExp(`${flag}\\.value = false;`), `${flag} must reset with the learner context`);
  }

  const graphBody = functionBody(script, 'async function loadGraph');
  assert.match(graphBody, /finally \{[\s\S]*?if \(isCurrent\(generation\)\) graphLoading\.value = false;/);
  const loadAllBody = functionBody(script, 'async function loadAll()');
  assert.ok(
    loadAllBody.indexOf('if (!isCurrent(generation)) return;') < loadAllBody.indexOf('loading.value = false;'),
    'stale learner loads must not clear a newer loading state',
  );
});

test('study page loads node detail, relations, note and neighbour navigation', () => {
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');

  // Every assertion below anchors on the call site (or on the computed/template binding
  // that consumes it) instead of the bare identifier, because `fetchGraphNode(` or
  // `renderMarkdown` alone also match a dead import that is never actually used.
  assert.ok(page.includes('fetchGraphNode(nodeId.value)'), 'the routed node detail must be fetched');
  assert.ok(
    page.includes('fetchGraphRelations(nodeId.value, { depth: 1, limit: 20 })'),
    'relations must be fetched for the routed node with depth/limit',
  );
  // The plan's literal regex was `fetchFavoriteNodes({ userId, page: 1, size: 100 })`, which
  // the plan's own code never contains: it passes the reactive `userId: activeUserId.value`.
  // Anchoring on the actual call keeps the intent (one unpaginated fetch that feeds the
  // prev/next lesson order) instead of matching a snippet that cannot compile.
  assert.ok(
    page.includes('fetchFavoriteNodes({ userId: requestUserId, page: 1, size: 100 })'),
    'favourites must be fetched once, unpaginated, for the captured active user',
  );
  assert.ok(
    page.includes('updateFavoriteNote(saveNodeId, { userId: saveUserId, note: serialized })'),
    'the versioned learning record must be saved through updateFavoriteNote for the captured active user and node',
  );
  assert.ok(page.includes('serializeLearningNote(saveNote, saveCard)'), 'private note and card must share one versioned payload');
  assert.ok(
    page.includes('createFavoriteNode({ userId: activeUserId.value, nodeId: nodeId.value })'),
    'the join-the-list button must create a favourite for the routed node',
  );
  assert.ok(
    page.includes("renderMarkdown(node.value?.content || node.value?.summary || '')"),
    'the material body must be rendered through renderMarkdown',
  );
  assert.ok(page.includes('const relationGroups = computed('), 'relationGroups must be computed');
  assert.ok(
    page.includes('v-for="group in relationGroups"'),
    'the relation groups must actually be rendered',
  );
  assert.ok(page.includes('const previousLesson = computed('), 'previousLesson must be computed');
  assert.ok(
    page.includes(':disabled="!previousLesson"'),
    'the previous-lesson button must be gated by previousLesson',
  );
  assert.ok(page.includes('const nextLesson = computed('), 'nextLesson must be computed');
  assert.ok(
    page.includes(':disabled="!nextLesson"'),
    'the next-lesson button must be gated by nextLesson',
  );
  assert.ok(page.includes('async function saveNote()'), 'saveNote must be a real handler');
  assert.ok(page.includes('@click="saveNote"'), 'saveNote must be wired to the save button');
});

test('study page reloads once the auth payload arrives after the first mount', () => {
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');
  const script = page.split('</script>')[0];
  const loadAllBody = functionBody(script, 'async function loadAll()');

  // Regression: a refresh restores only the token, so App.vue fetches /api/auth/me
  // asynchronously. loadFavorites() bails out while activeUserId is still 0, and the
  // load used to hang off onMounted alone, so a signed-in refresh kept
  // "该节点不在你的收藏里" — no note, no previous/next lesson — forever. Measured in the
  // browser with /api/auth/me delayed by 1500ms. `immediate: true` makes this watcher the
  // one and only mount-time trigger, which is why the page must not also call loadAll()
  // from onMounted — that duplicate would be swallowed by the guard and then replayed,
  // costing a whole extra load phase per cold mount (measured: relations 2 -> 3 requests).
  assert.match(script, /watch\(activeUserId, \(\) => \{[\s\S]*?void loadAll\(\);\s*\}, \{ immediate: true \}\)/);
  // Broadened beyond the literal 'onMounted(' — that spelling alone would miss the
  // equivalent mount triggers onBeforeMount( and onActivated(. (The plan's suggested
  // regex `\bon(Before)?Mount\s*\(` matches onMount(/onBeforeMount( but NOT onMounted(
  // itself, so the three hooks are spelled out instead.) Known residual evasion this
  // guard still cannot see: a *differently-named* duplicate trigger (e.g. loadAll()
  // called from a second watch(...) or a custom composable hook) is invisible to it;
  // the browser-level request count stays the real proof.
  assert.doesNotMatch(
    script,
    /\bonMounted\s*\(|\bonBeforeMount\s*\(|\bonActivated\s*\(/,
    'the immediate watcher already covers the mount, so a second mount trigger is a redundant load',
  );
  assert.ok(
    script.includes('if (loading.value) {'),
    'loadAll must not re-enter: the auth watcher can fire while the first load is still in flight',
  );

  // Regression, reproduced in the browser with /api/auth/me resolving *inside* the first
  // load's flight window (auth at 673ms against a 293-813ms load): the watcher-triggered
  // retry hit the guard and returned bare, so nothing ever replayed it — zero
  // /api/favorites/nodes requests, "该节点不在你的收藏里" and both lesson buttons disabled
  // for the whole observation window. A dropped request must be queued, not swallowed.
  // Tripwire: reverting the guard to `if (loading.value) return;` deletes the queue write.
  const guardBlock = loadAllBody.slice(0, loadAllBody.indexOf('if (!nodeId.value)'));
  assert.ok(guardBlock.includes('if (loading.value) {'), 'the re-entry guard must open a block');
  assert.ok(
    guardBlock.includes('reloadRequested.value = true;'),
    'a request blocked by the re-entry guard must be queued for replay',
  );
  assert.ok(guardBlock.includes('return;'), 'the guard must still return from the in-flight call');
  assert.ok(
    !script.includes('if (loading.value) return;'),
    'a bare `return` silently drops the auth-triggered retry',
  );
  assert.ok(
    loadAllBody.indexOf('if (loading.value)') < loadAllBody.indexOf('loading.value = true;'),
    'the re-entry guard must precede the loading flag assignment',
  );
  // `loading.value = false` outside the `finally` would break the guard: the flag would
  // drop while the run is still in flight and the next watcher tick would start a second,
  // overlapping load. The one permitted extra reset is the early return for an invalid
  // node id, which never reaches the awaited section at all. The body is now scoped to
  // loadAll() itself (brace-matched), so an unrelated later function touching `loading`
  // can no longer break this count.
  const finallyBlock = loadAllBody.split('} finally {')[1] ?? '';
  assert.ok(
    finallyBlock.includes('loading.value = false;'),
    'loadAll must reset the loading flag in its finally block',
  );
  assert.ok(
    finallyBlock.includes('void loadAll();'),
    'the queued request must be replayed from the finally block, not from a timer or a watcher',
  );
  // Termination: a replay must consume the queue, otherwise the replay would find the flag
  // still set and replay itself forever. Clearing it before the replay (the finally clears
  // it, then calls loadAll()) is what bounds the chain to one replay per dropped request.
  assert.ok(
    finallyBlock.indexOf('reloadRequested.value = false;') > -1
      && finallyBlock.indexOf('reloadRequested.value = false;') < finallyBlock.indexOf('void loadAll();'),
    'the queue flag must be cleared before the replay so the replay cannot retrigger itself',
  );
  assert.ok(
    loadAllBody.includes('reloadRequested.value = false;'),
    'loadAll must also clear a stale queue flag when a load actually starts',
  );
  const resets = loadAllBody.split('loading.value = false;').length - 1;
  assert.equal(
    resets,
    2,
    'loading.value = false must appear exactly twice in loadAll: the invalid-node early return and the finally block',
  );

  // Regression, found in the browser (the page sat on 正在打开学习内容 forever and issued no
  // node request at all): with the guard in place, `const loading = ref(true)` deadlocks. The
  // `immediate: true` watcher calls loadAll() during setup, the guard sees the initial `true`
  // and returns before the `finally` that would ever clear it. The flag must therefore start
  // false and be owned by loadAll().
  assert.match(
    script,
    /const loading = ref\(false\);/,
    'loading must start false so the first loadAll() passes its own re-entry guard',
  );
  // The queue flag starts false because false is the only honest initial state: nothing
  // has been queued yet. (An earlier version of this comment claimed an initial `true`
  // would make the first loadAll() replay itself — that mechanism cannot happen: every
  // path that reaches the try/finally clears the flag before the first await, and the
  // invalid-node early return never reaches the finally at all, so an initial `true`
  // would be silently inert.) The pin still earns its keep: it documents the
  // empty-queue invariant and catches a refactor that stops clearing the flag at load
  // start, where a stale `true` would then cause a real spurious replay.
  assert.match(
    script,
    /const reloadRequested = ref\(false\);/,
    'reloadRequested must start false so an idle page never replays',
  );
});

test('study page renders the node cover with the shared learning cover component', () => {
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');

  // The design spec's 左栏·读 lists the cover first (coverImageUrl when present, the type
  // colour otherwise), but the plan's study-page code block omitted it. Reusing
  // LearningCover is free: loadNodeCover shares the module-level cache with the cards, so
  // arriving from the index page issues no extra request.
  // (The `primeCover` regression belongs to LearningCover.vue itself and is asserted in the
  // cover test above — asserting it here on the study page was vacuous.)
  assert.match(page, /import LearningCover from '\.\.\/\.\.\/components\/LearningCover\.vue';/);
  assert.match(
    page,
    /<LearningCover\s+:node-id="nodeId"\s+:alt="node\.name"\s+:color="node\.nodeTypeColor"\s+:icon-char="node\.nodeTypeName\.slice\(0, 1\)"\s*\/>/,
  );
});

/**
 * The backend AI is a navigation assistant whose system prompt encourages route suggestions, and
 * the study page renders `answer` only (the validated `suggestions` channel is never shown), so a
 * generated note used to carry raw `/explore`-style paths. The prompt now forbids them and asks for
 * page names instead.
 *
 * What this catches: the guard being deleted, or being wired into one intent only instead of every
 * prompt that ships a study note. It cannot prove the model obeys — that is prompt-level
 * best-effort, and the only hard guarantee would be rendering `suggestions` instead of `answer`.
 */
test('every study AI prompt forbids raw route paths and asks for page names', () => {
  const ai = read('./features/favorite/services/aiStudy.ts');

  assert.ok(
    ai.includes('不要输出以 / 开头的路由路径'),
    'the study AI prompt must forbid raw route paths',
  );
  assert.ok(
    ai.includes('中文页面名称'),
    'the guard must name the replacement (a Chinese page name) rather than just banning paths',
  );

  // The guard has to reach every intent — not just EXPAND, which is only where it was noticed.
  const buildBody = functionBody(ai, 'export function buildStudyPrompt(');
  assert.ok(
    buildBody.includes('...OUTPUT_GUARD'),
    'buildStudyPrompt must splice the route guard into the prompt for all intents',
  );
  for (const intent of ['SUMMARY', 'EXPAND', 'QUESTION']) {
    assert.match(ai, new RegExp(`\\n  ${intent}: \\[`), `${intent} rules must still exist`);
  }
});

/**
 * The prompt is a request, not a guarantee, so a model that ignores OUTPUT_GUARD must still not be
 * able to put a route on screen. `stripRouteHints` cleans the answer body; the only route-carrying
 * thing the page renders is the backend-validated `suggestions` list, as links.
 *
 * The stripping rules themselves are behaviour-tested outside this file (they need to run, not to
 * be matched): what this tripwire protects is the wiring — the stripper being skipped for a real
 * completion, a lookbehind creeping back in (SyntaxError on Safari < 16.4), or the page losing the
 * suggestions channel and going back to printing paths.
 */
test('study AI answers are stripped of routes and navigation is rendered as links', () => {
  const ai = read('./features/favorite/services/aiStudy.ts');
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');
  // `functionBody` keys off the first `{`, which here lands inside the `params: {…}` type literal,
  // so this scope is "from the signature to the end of the file" (it is the last declaration).
  const requestStart = ai.indexOf('export async function requestStudyAi(');
  assert.notEqual(requestStart, -1, 'requestStudyAi must exist');
  const requestBody = ai.slice(requestStart);

  assert.match(ai, /export function stripRouteHints\(answer: string\): string/, 'the stripper must exist');
  assert.ok(
    requestBody.includes('stripRouteHints(raw)'),
    'a real completion must be passed through the stripper before it reaches the page',
  );
  // Degraded text is displayed inside the "no real answer" panel and is never written into the note,
  // so it is the one path that must NOT be rewritten.
  assert.ok(
    requestBody.includes('degraded ? raw : stripRouteHints(raw)'),
    'only a real completion may be rewritten; the fallback text must stay verbatim',
  );
  assert.ok(!ai.includes('(?<='), 'no lookbehind: it is a parse-time SyntaxError on older Safari');
  // The fallback answer is not rewritten, so a stripped-to-nothing answer must not be shown as blank.
  assert.ok(
    requestBody.includes("'empty'"),
    'an answer that was nothing but routes must be reported as empty, not rendered as a blank card',
  );

  // The page keeps the validated channel and renders it as links, not as text.
  const script = page.split('</script>')[0];
  assert.ok(script.includes('const aiSuggestions = ref<AiNavigationSuggestion[]>([])'), 'suggestions state');
  const runBody = functionBody(script, 'async function runStudyAi(');
  assert.ok(runBody.includes('result.suggestions'), 'suggestions must come from the AI result');
  assert.ok(
    runBody.includes("aiSuggestions.value = intent === 'QUESTION' ? [] : result.suggestions"),
    'the quiz box must not be followed by a row of navigation links',
  );
  assert.ok(runBody.includes('aiSuggestions.value = []'), 'a failed attempt must clear the links');
  const resetBody = functionBody(script, 'function resetStudyAi(');
  assert.ok(resetBody.includes('aiSuggestions.value = []'), 'switching nodes must clear the links');

  assert.match(page, /<nav v-if="aiSuggestions.length" class="study-ai-suggestions"/);
  assert.match(page, /<RouterLink[\s\S]{0,220}?:to="suggestion.route"/);
  // The route itself must never be printed: the chip shows the page name.
  assert.ok(!page.includes('{{ suggestion.route }}'), 'the route must be the href, never the label');
});

test('study page asks AI for a summary and an extension block, degrading safely', () => {
  const ai = read('./features/favorite/services/aiStudy.ts');
  assert.match(ai, /export type StudyAiIntent = 'SUMMARY' \| 'EXPAND'/);
  assert.match(ai, /export function buildStudyPrompt\(/);
  assert.match(ai, /export async function requestStudyAi\(/);
  assert.match(ai, /sendAiChat\(/);
  assert.match(ai, /AI_CHAT_COMPLETIONS/);
  assert.match(ai, /slice\(0, 800\)/);

  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');
  assert.match(page, /AI 总结/);
  assert.match(page, /扩展学习/);
  assert.match(page, /重新生成/);
  assert.match(page, /追加到笔记/);
  assert.match(page, /aiAnswer/);
  assert.match(page, /aiDegraded/);
});

/**
 * The AI transport is a navigation assistant: on a missing key, an upstream error or an
 * unparsable completion the backend answers with a *fallback* whose `source` is
 * AI_UNAVAILABLE_FALLBACK / NAVIGATION_FALLBACK. That text is not a reading of the node, so the
 * page must (a) mark it as unavailable, (b) never render it through the markdown block and
 * (c) never let 「追加到笔记」 write it into the note.
 */
test('study page never presents a degraded AI fallback as a summary or writes it into the note', () => {
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');
  const script = page.split('</script>')[0];

  // The degraded flag must come from the response source, not from a hard-coded failure.
  assert.ok(
    script.includes('aiDegraded.value = result.degraded'),
    'aiDegraded must be driven by the source reported for this response',
  );
  // Tripwire for the honesty path: dropping the `aiDegraded.value` check would let a fallback
  // be appended and, on the next 保存笔记, persisted as if the AI had read the node.
  const appendBody = functionBody(script, 'function appendAiToNote()');
  assert.ok(
    appendBody.includes('aiDegraded.value'),
    'appendAiToNote must refuse a degraded answer',
  );
  // The note is only written by saveNote(); appending must not save on its own.
  assert.ok(
    !appendBody.includes('updateFavoriteNote('),
    'appendAiToNote must not save the note — the save button stays the only writer',
  );

  // Structure: the degraded branch opens before the markdown block and 「追加到笔记」 sits after
  // it, i.e. inside the non-degraded branch. (Comment on the weak spots of these two index
  // checks: they pin the source order, not the template tree — a degraded branch that *also*
  // re-rendered v-html after the markdown block would slip past them.)
  const degradedIndex = page.indexOf('v-if="aiDegraded"');
  const markdownIndex = page.indexOf('v-html="renderMarkdown(aiAnswer)"');
  const appendButtonIndex = page.indexOf('@click="appendAiToNote"');
  assert.ok(degradedIndex > -1 && markdownIndex > degradedIndex, 'the degraded branch must be rendered as plain text, before the markdown block');
  assert.ok(appendButtonIndex > markdownIndex, '「追加到笔记」 must live in the non-degraded branch');

  // Signed-out visitors must not be able to fire an AI request.
  assert.ok(
    page.split(':disabled="aiLoading || !isSignedIn"').length - 1 >= 2,
    'both AI buttons must be disabled while loading and when signed out',
  );
});

/**
 * Fix A from the independent review — a real behaviour defect, not a style nit. The plan's snippet
 * had neither a request generation nor any reset, so an answer leaked across nodes by two routes:
 * (1) start a request on node A (昆曲/36) and navigate to node B (端午节/3347) while it is in
 * flight, (2) with nothing in flight, simply navigate away. In both cases node A's answer rendered
 * on node B's page, labelled 「AI 总结」, with 「追加到笔记」 enabled, and clicking it put node A's
 * text into node B's textarea, where 保存笔记 then persisted it as node B's note. Reproduced in the
 * browser against a 4s-delayed /api/ai/chat plus an intercepted PUT: nodeId=3347, note carrying
 * node A's text (details in the commit message).
 *
 * What this tripwire CAN catch: the generation token being deleted; the resolve path (or the catch
 * path) writing state with no comparison against the captured generation; the nodeId watcher no
 * longer resetting the AI state; appendAiToNote losing its "this answer belongs to the node on
 * screen" check; the template gate disappearing.
 *
 * What it CANNOT catch, and must not be mistaken for proof of: a differently-spelled guard that is
 * still wrong (comparing node ids instead of generations, a token advanced in the wrong place,
 * `if (generation === aiGeneration) { ... }` with an unguarded trailing write, or a reset wired to
 * a watcher that never fires at runtime). It cannot see ordering or Vue reactivity timing, and it
 * only inspects the code paths named below — any new path that writes aiAnswer is invisible to it.
 * Matching one exact spelling is exactly the false confidence a previous round warned about, so the
 * runtime evidence (before/after browser runs recorded in the commit message) stays the real proof.
 */
test('study page scopes an AI answer to the node that requested it', () => {
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');
  const script = page.split('</script>')[0];
  const runBody = functionBody(script, 'async function runStudyAi(');
  const resetBody = functionBody(script, 'function resetStudyAi()');
  const appendBody = functionBody(script, 'function appendAiToNote()');
  const nodeWatcherBody = functionBody(script, 'watch(nodeId, () =>');

  // The token itself, captured before the request and compared when the response resolves.
  assert.ok(script.includes('let aiGeneration = 0;'), 'the AI request generation token must exist');
  assert.ok(
    runBody.includes('const generation = (aiGeneration += 1);'),
    'runStudyAi must capture the generation before awaiting the response',
  );
  const comparisons = runBody.split('if (generation !== aiGeneration) return;').length - 1;
  assert.equal(
    comparisons,
    2,
    'both the resolve path and the catch path must discard a response whose generation moved on',
  );
  assert.ok(
    runBody.indexOf('if (generation !== aiGeneration) return;') <
      runBody.indexOf('aiAnswer.value = result.answer;'),
    'the generation must be checked before the answer is written, not after',
  );
  assert.ok(
    runBody.includes('if (generation === aiGeneration) aiLoading.value = false;'),
    'a stale request must not clear the spinner of the request that replaced it',
  );

  // Changing the routed node must throw the previous answer away.
  assert.ok(nodeWatcherBody.includes('resetStudyAi();'), 'the nodeId watcher must reset the AI state');
  assert.ok(resetBody.includes('aiGeneration += 1;'), 'resetting must invalidate in-flight requests');
  for (const anchor of ["aiAnswer.value = '';", 'aiIntent.value = null;', 'aiDegraded.value = false;']) {
    assert.ok(resetBody.includes(anchor), `resetStudyAi must clear ${anchor}`);
  }

  // Structural guarantee: even if a reset were missed, an answer that does not belong to the node
  // on screen can neither be rendered nor appended.
  assert.ok(
    script.includes('aiAnswerNodeId.value = requestedNodeId;'),
    'the answer must record the node it was requested for',
  );
  assert.ok(
    script.includes('const aiAnswerMatchesNode = computed('),
    'the template needs a node-scoped predicate to render against',
  );
  assert.ok(
    page.includes('v-else-if="aiAnswerMatchesNode"'),
    'the AI output block must be gated on the answer belonging to the current node',
  );
  assert.ok(
    appendBody.includes('aiAnswerNodeId.value !== nodeId.value'),
    'appendAiToNote must refuse an answer that belongs to another node',
  );
});

/**
 * Fixes B, C and D of the same review: a blank answer with a real source used to fall through to
 * the idle hint, a hung request left 「AI 正在阅读这个节点…」 spinning forever with both buttons
 * disabled, and a transport failure was rendered as the raw English `Failed to fetch` under a
 * heading claiming it was 「系统的兜底提示」.
 *
 * What this tripwire CAN catch: the timeout constant / failure classification being deleted, the
 * failure branch being dropped from the template, the idle copy losing its sign-in condition, and a
 * revert to rendering the raw backend/transport error. It CANNOT prove the timeout actually fires
 * at 20s or that the failure text reaches the DOM — that was observed in the browser instead.
 */
test('study page reports AI timeouts, empty answers and transport failures honestly', () => {
  const ai = read('./features/favorite/services/aiStudy.ts');
  const page = read('./features/favorite/views/portal/LearningStudyPage.vue');
  const script = page.split('</script>')[0];
  const runBody = functionBody(script, 'async function runStudyAi(');

  // C: a client-side deadline comfortably above the backend's own 10s.
  assert.ok(ai.includes('export const STUDY_AI_TIMEOUT_MS = 20000;'), 'the study AI needs a client timeout');
  assert.ok(ai.includes('setTimeout('), 'the timeout must be a real timer');
  assert.ok(ai.includes("new StudyAiFailure('timeout'"), 'a timeout must be reported as a timeout');
  // B: a blank answer is a failed attempt, not "no request was made".
  assert.ok(ai.includes("new StudyAiFailure("), 'blank/failed attempts must be classified');
  assert.ok(ai.includes("'empty'"), 'an empty answer with a real source must be its own failure kind');
  assert.ok(ai.includes('if (!answer)'), 'the empty answer must be detected before returning');
  // D: the raw transport error must not be rendered, and a failure must not be called a fallback.
  assert.ok(
    !runBody.includes('aiAnswer.value = err instanceof Error ? err.message'),
    'the raw English transport error must never be shown as the AI answer',
  );
  assert.ok(page.includes('v-else-if="aiFailure"'), 'failures need their own branch');
  assert.ok(page.includes('{{ aiFailureMessage }}'), 'the failure branch must explain what happened');
  const failureIndex = page.indexOf('v-else-if="aiFailure"');
  const failureBlock = page.slice(failureIndex, page.indexOf('v-else-if="aiAnswerMatchesNode"'));
  assert.ok(
    page.indexOf('重新生成', failureIndex) > failureIndex,
    'the failure branch must offer a retry',
  );
  // ...and it must not be described as the backend's fallback *answer*: those are two different
  // things, and calling a broken connection 「系统的兜底提示」 was the reported mislabelling.
  assert.ok(!failureBlock.includes('兜底'), 'a failed request must not be presented as a fallback answer');
  const degradedBlock = page.slice(page.indexOf('v-if="aiDegraded"'), page.indexOf('v-html="renderMarkdown(aiAnswer)"'));
  assert.ok(
    degradedBlock.includes('兜底提示'),
    'the backend fallback text must still be framed as a fallback, not as a reading of the node',
  );
  // E: the idle hint must not tell a signed-out visitor to press a disabled button.
  const template = page.split('</script>')[1] ?? '';
  assert.ok(script.includes('const aiIdleHint = computed('), 'the idle hint must depend on the session');
  assert.ok(script.includes('登录后可以让 AI'), 'the signed-out hint must say the feature needs a sign-in');
  assert.ok(template.includes('{{ aiIdleHint }}'), 'the idle hint must be rendered from the computed');
  assert.ok(
    !template.includes('选一个按钮'),
    'the signed-in idle sentence must not be hard-coded in the template, where it would render for guests too',
  );
});

test('learning index and study page styles are defined with responsive grids', () => {
  const styles = read('./heritage-intro/styles.css');

  assert.match(styles, /\.learning-card-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill/);
  assert.match(styles, /\.learning-card\s*\{[^}]*border-radius/);
  assert.match(styles, /\.learning-cover\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(styles, /\.study-grid\s*\{[^}]*grid-template-columns:\s*minmax\(280px,\s*0\.85fr\)\s+minmax\(0,\s*1\.15fr\)/);
  assert.match(styles, /\.study-relation-group/);
  assert.match(styles, /\.study-ai-output/);
  assert.match(styles, /@media \(max-width: 1120px\)[\s\S]{0,200}\.study-grid/);

  // The Task 6 heading blockquote mandates styles for every AI block class, including
  // `.study-ai-failure` (timeout/empty/transport container added by fix 52a00bb).
  assert.ok(styles.includes('.study-ai-failure'), 'the AI failure container must be styled');
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]{0,200}\.learning-card-grid/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}\.learning-card/);
});
