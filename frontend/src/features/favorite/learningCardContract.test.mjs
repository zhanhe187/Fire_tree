import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const sourcePath = new URL('./services/learningCard.ts', import.meta.url);

test('shared learning card service declares the versioned storage contract', () => {
  assert.equal(fs.existsSync(sourcePath), true, 'learningCard.ts must exist');
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.match(source, /LearningNotePayload/);
  assert.match(source, /coreUnderstanding/);
  assert.match(source, /selfTestQuestion/);
  assert.match(source, /relatedNodeIds/);
  assert.match(source, /relatedKeywords/);
  assert.match(source, /reviewState/);
  assert.match(source, /localStorage/);
  assert.match(source, /legacy|plain/i);
  assert.match(source, /payload\.version !== 1/);
  assert.match(source, /isReviewState/);
  assert.match(source, /Array\.isArray\(card\.relatedNodeIds\)/);
  assert.match(source, /Array\.isArray\(card\.relatedKeywords\)/);
  assert.match(source, /expectedNodeId/);
  assert.match(source, /LOCAL_KEY_PREFIX/);
});

test('storage service exposes the pure and local persistence API', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  for (const name of [
    'parseLearningNote',
    'serializeLearningNote',
    'createEmptyLearningCard',
    'learningCardStatus',
    'loadLocalLearningRecord',
    'saveLocalLearningRecord',
    'listLocalLearningRecords',
  ]) {
    assert.match(source, new RegExp(`export function ${name}`));
  }
});

function loadServiceWithoutTypeScriptRuntime() {
  let source = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  source = source
    .replace(/export (?:type|interface)[\s\S]*?(?=\n\n)/g, '')
    .replace(/export function /g, 'function ')
    .replace(/: ParsedLearningNote\['source'\]/g, '')
    .replace(/: value is [^{]+(?=\{)/g, '')
    .replace(/raw\?: string \| null/g, 'raw')
    .replace(/source: ParsedLearningNote\['source'\]/g, 'source')
    .replace(/: LearningNotePayload/g, '')
    .replace(/: ParsedLearningNote/g, '')
    .replace(/: LocalLearningRecord\[\]/g, '')
     .replace(/: LearningCard/g, '')
    .replace(/ \| null/g, '')
    .replace(/: ReviewState/g, '')
    .replace(/: string \| null/g, '')
    .replace(/: string/g, '')
    .replace(/\?: number/g, '')
    .replace(/: number/g, '')
    .replace(/: boolean/g, '')
    .replace(/: unknown/g, '')
    .replace(/: void/g, '')
    .replace(/: readonly ReviewState\[\]/g, '')
    .replace(/: 'todo' \| 'review' \| 'mastered'/g, '')
    .replace(/ as Record<string, unknown>/g, '')
    .replace(/ as (?:LearningCard|ReviewState|unknown|LearningNotePayload) \| null/g, '')
    .replace(/ as (?:LearningCard|ReviewState|unknown|LearningNotePayload)/g, '');
  const exports = {};
  source += '\nObject.assign(exports, { parseLearningNote, serializeLearningNote, createEmptyLearningCard, learningCardStatus, loadLocalLearningRecord, saveLocalLearningRecord, listLocalLearningRecords });';
  Function('globalThis', 'exports', source)(globalThis, exports);
  return exports;
}

function validCard(nodeId = 7) {
  return {
    nodeId,
    coreUnderstanding: 'core',
    selfTestQuestion: 'question',
    relatedNodeIds: [],
    relatedKeywords: [],
    reviewState: 'todo',
    reviewCount: 0,
    lastReviewedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

test('runtime parser accepts structured notes and preserves legacy text', () => {
  const { parseLearningNote } = loadServiceWithoutTypeScriptRuntime();
  const structured = parseLearningNote(JSON.stringify({ version: 1, privateNote: 'note', card: validCard() }));
  assert.deepEqual(structured, { privateNote: 'note', card: validCard(), source: 'structured' });
  assert.deepEqual(parseLearningNote('plain note'), { privateNote: 'plain note', card: null, source: 'legacy' });
  assert.deepEqual(parseLearningNote('{malformed json'), { privateNote: '{malformed json', card: null, source: 'invalid' });
  assert.equal(parseLearningNote(JSON.stringify({ version: 1, privateNote: 'note', card: { ...validCard(), reviewCount: -1 } })).source, 'invalid');
});

test('runtime serializer rejects an invalid card instead of silently dropping it', () => {
  const { serializeLearningNote } = loadServiceWithoutTypeScriptRuntime();
  assert.throws(() => serializeLearningNote('note', { ...validCard(), reviewCount: -1 }), TypeError);
});

test('runtime local persistence surfaces invalid cards instead of silently losing them', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const { saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  assert.throws(
    () => saveLocalLearningRecord('user-1', 7, 'note', { ...validCard(), reviewCount: -1 }),
    TypeError,
  );
  assert.equal(storage.size, 0);
});

test('runtime local persistence rejects cards stored under a different node key', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const { loadLocalLearningRecord, saveLocalLearningRecord, parseLearningNote } = loadServiceWithoutTypeScriptRuntime();
  assert.throws(() => saveLocalLearningRecord('user-1', 7, 'note', validCard(8)), TypeError);
  assert.equal(parseLearningNote(JSON.stringify({ version: 1, privateNote: 'stale', card: validCard(8) }), 7).card, null);
  storage.set('fire-tree:learning-card:user-1:7', JSON.stringify({ version: 1, privateNote: 'stale', card: validCard(8) }));
  const loaded = loadLocalLearningRecord('user-1', 7);
  assert.equal(loaded.source, 'invalid');
  assert.equal(loaded.card, null);
});

test('runtime local persistence isolates records by scope', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  saveLocalLearningRecord('user-1', 7, 'first scope', null);
  saveLocalLearningRecord('user-2', 7, 'second scope', null);
  assert.equal(loadLocalLearningRecord('user-1', 7).privateNote, 'first scope');
  assert.equal(loadLocalLearningRecord('user-2', 7).privateNote, 'second scope');
  assert.equal(storage.size, 2);
});

test('runtime local persistence lists records in one anonymous scope', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    key: (index) => [...storage.keys()][index] ?? null,
    get length() { return storage.size; },
  };
  const { loadLocalLearningRecord, saveLocalLearningRecord, listLocalLearningRecords } = loadServiceWithoutTypeScriptRuntime();
  saveLocalLearningRecord('anonymous', 7, 'seven', null);
  saveLocalLearningRecord('anonymous', 8, 'eight', validCard(8));
  saveLocalLearningRecord('user-1', 9, 'private', null);
  assert.deepEqual(listLocalLearningRecords('anonymous'), [
    { nodeId: 7, ...loadLocalLearningRecord('anonymous', 7) },
    { nodeId: 8, ...loadLocalLearningRecord('anonymous', 8) },
  ]);
});

test('runtime local persistence keeps records isolated by node within a scope', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  saveLocalLearningRecord('user-1', 7, 'node seven', null);
  saveLocalLearningRecord('user-1', 8, 'node eight', null);
  assert.equal(loadLocalLearningRecord('user-1', 7).privateNote, 'node seven');
  assert.equal(loadLocalLearningRecord('user-1', 8).privateNote, 'node eight');
  assert.equal(storage.size, 2);
});

test('runtime local persistence preserves a private note when no card is present', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  saveLocalLearningRecord('user-1', 7, 'private only', null);
  assert.deepEqual(loadLocalLearningRecord('user-1', 7), {
    privateNote: 'private only',
    card: null,
    source: 'structured',
  });
});

test('runtime local persistence swallows storage failures', () => {
  globalThis.localStorage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  assert.deepEqual(loadLocalLearningRecord('user-1', 7), { privateNote: '', card: null, source: 'empty' });
  assert.doesNotThrow(() => saveLocalLearningRecord('user-1', 7, 'note', validCard()));
});

test('runtime local persistence does not swallow parser errors', () => {
  const parserFailure = new Error('parser failed');
  globalThis.localStorage = {
    getItem: () => ({ toString: () => { throw parserFailure; } }),
  };
  const { loadLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  assert.throws(() => loadLocalLearningRecord('user-1', 7), parserFailure);
});
