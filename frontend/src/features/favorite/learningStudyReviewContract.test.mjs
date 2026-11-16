import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const sourcePath = new URL('./views/portal/LearningStudyPage.vue', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');

test('study page renders a structured review flow and separate private note', () => {
  assert.match(source, /coreUnderstanding/);
  assert.match(source, /selfTestQuestion/);
  assert.match(source, /relatedNodeIds/);
  assert.match(source, /relatedKeywords/);
  assert.match(source, /掌握/);
  assert.match(source, /模糊/);
  assert.match(source, /不会/);
  assert.match(source, /aria-live/);
  assert.match(source, /serializeLearningNote/);
});

test('study review presents question and related content before the reveal prompt', () => {
  const question = source.indexOf('id="learning-question"');
  const reveal = source.indexOf('先想一想答案，再揭晓核心理解。');
  const relations = source.indexOf('class="study-related-combined"');
  assert.ok(question >= 0 && reveal > question && relations > reveal, 'related content must follow the reveal prompt');
});

test('portal review keeps core understanding behind the reveal gate', () => {
  const revealBlock = source.indexOf('class="learning-review-answer"');
  const coreEditor = source.indexOf('id="learning-core"');
  assert.ok(revealBlock >= 0 && coreEditor >= 0, 'core editor and revealed review block must both exist');
  assert.match(source, /核心理解/);
});

test('study page renders step-guided learning card with numbered steps', () => {
  assert.match(source, /class="study-step"/);
  assert.match(source, /class="study-step-num"/);
  assert.match(source, /写核心理解/);
  assert.match(source, /设自测问题/);
  assert.match(source, /复习自测/);
  assert.match(source, /关联与关键词/);
  assert.match(source, /让 AI 帮我出题/);
  assert.match(source, /采用这个问题/);
});

test('AI append targets private note and guards degraded answers', () => {
  assert.match(source, /aiDegraded/);
  assert.match(source, /privateNote/);
  assert.match(source, /appendAiToNote/);
});

test('AI question intent generates a self-test question and offers apply-to-card', () => {
  assert.match(source, /runStudyAi\('QUESTION'\)/);
  assert.match(source, /applyAiQuestionToCard/);
  assert.match(source, /aiQuizAnswer/);
  assert.match(source, /aiQuizRevealed/);
  assert.match(source, /填入自测问题/);
  assert.match(source, /让 AI 帮我出题/);
});

test('selected relation nodes render removable chips, including stale persisted IDs', () => {
  assert.match(source, /selectedRelatedNodes/);
  assert.match(source, /removeRelatedNode/);
  assert.match(source, /related-chip/);
  assert.match(source, /关联节点/);
});

test('signed-in transport failures preserve the draft in a user-scoped local fallback', () => {
  assert.doesNotMatch(source, /saveLocalLearningRecord\('browser'/);
  assert.match(source, /learningScopeForUser\(activeUserId\.value\)/);
  assert.match(source, /仅本机保存/);
  assert.match(source, /isTransportOrUnavailableError/);
  assert.match(source, /401|403/);
});

test('study and index pages share the exact local fallback scope helper', () => {
  const indexSource = fs.readFileSync(new URL('./views/portal/LearningIndexPage.vue', import.meta.url), 'utf8');
  assert.match(source, /learningScopeForUser\(activeUserId\.value\)/);
  assert.match(indexSource, /learningScopeForUser\(activeUserId\.value\)/);
  assert.match(source, /learningScopeForUser\(activeUserId\.value\)/);
  assert.match(indexSource, /learningScopeForUser\(activeUserId\.value\)/);
});

test('signed-in index transport failures fall back to local records and mark them local-only', () => {
  const indexSource = fs.readFileSync(new URL('./views/portal/LearningIndexPage.vue', import.meta.url), 'utf8');
  assert.match(indexSource, /isTransportOrUnavailableError/);
  assert.match(indexSource, /const scope = learningScopeForUser\(activeUserId\.value\)/);
  assert.match(indexSource, /listLocalLearningRecords\(scope\)/);
  assert.match(indexSource, /localOnlyFallback\.value = true/);
  assert.match(indexSource, /storageMode = computed/);
  assert.match(indexSource, /!localOnlyFallback\.value/);
});

test('signed-in reload loads the private fallback before the server and keeps it on load failure', () => {
  assert.match(source, /loadLocalLearningRecord\(localLearningScope\.value, nodeId\.value\)/);
  assert.match(source, /localFavorite\.value = .*local/);
  assert.match(source, /catch \(err\)[\s\S]{0,500}学习清单暂时无法同步/);
  assert.match(source, /localOnlyFallback\.value = true/);
});

test('related node candidates use an accessible labelled group', () => {
  assert.match(source, /<fieldset[^>]*study-related-combined/);
  assert.match(source, /<legend[^>]*>关联节点<\/legend>/);
  assert.match(source, /aria-pressed/);
});

test('dirty study edits survive favorite-load reconciliation until a successful save or node change', () => {
  assert.match(source, /hasUnsavedEdits/);
  assert.match(source, /markStudyDirty/);
  assert.match(source, /if \(!hasUnsavedEdits\.value\) setLearningNote/);
  assert.match(source, /clearStudyDirty/);
  assert.match(source, /studyEditGeneration/);
  assert.match(source, /if \(requestStillCurrent\(\) && studyEditGeneration === saveGeneration\)/);
  assert.match(source, /@input="updatePrivateNote/);
});

test('auth hydration from anonymous to an account does not clear a dirty draft', () => {
  const authWatcher = source.match(/watch\(activeUserId,[\s\S]*?\}, \{ immediate: true \}\);/u)?.[0];
  assert.ok(authWatcher, 'the active-user hydration watcher must remain explicit');
  assert.doesNotMatch(authWatcher, /clearStudyDirty/);
});

const adminSourcePath = new URL('./views/admin/FavoriteGraphPage.vue', import.meta.url);
const adminSource = fs.readFileSync(adminSourcePath, 'utf8');

test('admin review requires an explicit reveal and resets it when selection changes', () => {
  assert.match(adminSource, /revealedCardNodeId/);
  assert.match(adminSource, /revealedCardNodeId\.value = null/);
  assert.match(adminSource, /selfTestQuestion/);
  assert.match(adminSource, /coreUnderstanding/);
  assert.match(adminSource, /revealedCardNodeId.*selectedFavorite/);
  assert.match(adminSource, /掌握/);
  assert.match(adminSource, /模糊/);
  assert.match(adminSource, /不会/);
});

test('admin archive heading states its review and knowledge-relationship scope', () => {
  assert.match(adminSource, /查看学习进度、复习状态与知识关联/);
});

test('admin private note is a separate panel from the structured learning card', () => {
  const cardPanel = adminSource.indexOf('class="side-section learning-card-editor"');
  const notePanel = adminSource.indexOf('class="side-section private-note-panel"');
  assert.ok(cardPanel >= 0 && notePanel > cardPanel, 'private note panel must follow a separate learning-card panel');
  assert.match(adminSource, /private-note-panel/);
});

test('admin learning metrics use the unfiltered archive total for studying nodes', () => {
  assert.match(adminSource, /archiveSummary\.value = \{ items, total: firstPage\.total \}/);
  assert.match(adminSource, /<span>在学节点<\/span>\s*<strong>\{\{ archiveSummary\.total \}\}<\/strong>/);
});

test('admin stale related node IDs render removable fallback chips', () => {
  assert.match(adminSource, /removeRelatedNode/);
  assert.match(adminSource, /节点 #\{\{ id \}\}/);
  assert.match(adminSource, /:aria-label="`移除关联节点/);
});

test('admin review presents question and relations before the reveal prompt', () => {
  const question = adminSource.indexOf('>设自测问题<');
  const relations = adminSource.indexOf('关联节点候选');
  const reveal = adminSource.indexOf('完成自测后揭示核心理解');
  assert.ok(question >= 0 && reveal > question, 'review prompt must follow question');
  assert.ok(relations >= 0, 'relations must exist');
});

test('admin custom keywords use a dedicated input instead of the collection filter', () => {
  assert.match(adminSource, /customKeyword/);
  assert.match(adminSource, /addCustomKeyword/);
  assert.match(adminSource, /removeRelatedKeyword/);
  assert.doesNotMatch(adminSource, /addRelatedKeyword\(filters\.keyword/);
});

test('admin metrics load an unfiltered archive summary independently of paginated rows', () => {
  assert.match(adminSource, /archiveSummary/);
  assert.match(adminSource, /size: 100/);
  assert.match(adminSource, /cardCount.*archiveSummary/);
  assert.match(adminSource, /loadArchiveSummary/);
});

test('admin review persistence uses the shared serializer and backend note update', () => {
  assert.match(adminSource, /serializeLearningNote\(noteForm\.note, learningCard\.value\)/);
  assert.match(adminSource, /updateFavoriteNote/);
  assert.match(adminSource, /reviewCount: learningCard\.value\.reviewCount \+ 1/);
  assert.match(adminSource, /lastReviewedAt: now/);
  assert.match(adminSource, /saveNote\(\)/);
  assert.doesNotMatch(adminSource, /localStorage/);
});

test('admin learner identity is exclusive and every request uses the active identity', () => {
  assert.match(adminSource, /setUsername/);
  assert.match(adminSource, /filters\.userId = ''/);
  assert.match(adminSource, /identity\.username/);
  assert.match(adminSource, /identity\.userId/);
  assert.doesNotMatch(adminSource, /userId: userId \|\| undefined, username: username \|\| undefined/);
  assert.match(adminSource, /deleteFavoriteNodeByUsername\(identity\.username/);
});

test('admin learner changes clear drafts and ignore stale responses', () => {
  assert.match(adminSource, /requestGeneration/);
  assert.match(adminSource, /selectedFavorite\.value = null/);
  assert.match(adminSource, /selectedGraphNode\.value = null/);
  assert.match(adminSource, /learningCard\.value = null/);
  assert.match(adminSource, /noteForm\.note = ''/);
  assert.match(adminSource, /if \(generation !== requestGeneration\.value\) return/);
});

test('admin refresh, search, and pagination each advance the shared request generation', () => {
  assert.match(adminSource, /const generation = \+\+requestGeneration\.value;/);
  assert.match(adminSource, /loadFavorites\(generation\)/);
  assert.match(adminSource, /loadArchiveSummary\(generation\)/);
  assert.match(adminSource, /loadGraph\(generation\)/);
  assert.match(adminSource, /loadNodeOptions\(generation\)/);
});
