import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const sourcePath = new URL('./services/learningCard.ts', import.meta.url);

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
  source += '\nObject.assign(exports, { parseLearningNote, serializeLearningNote, createEmptyLearningCard, loadLocalLearningRecord, saveLocalLearningRecord });';
  Function('globalThis', 'exports', source)(globalThis, exports);
  return exports;
}

function validCard(nodeId = 7, overrides = {}) {
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
    ...overrides,
  };
}

function memoryStorage() {
  const storage = new Map();
  return {
    storage,
    api: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      key: (index) => [...storage.keys()][index] ?? null,
      get length() { return storage.size; },
    },
  };
}

test('parses empty notes as empty without inventing a card', () => {
  const { parseLearningNote } = loadServiceWithoutTypeScriptRuntime();
  assert.deepEqual(parseLearningNote(''), { privateNote: '', card: null, source: 'empty' });
  assert.deepEqual(parseLearningNote(null), { privateNote: '', card: null, source: 'empty' });
});

test('preserves legacy text as a private note', () => {
  const { parseLearningNote } = loadServiceWithoutTypeScriptRuntime();
  assert.deepEqual(parseLearningNote('remember the festival origin'), {
    privateNote: 'remember the festival origin', card: null, source: 'legacy',
  });
});

test('accepts a valid versioned envelope', () => {
  const { parseLearningNote } = loadServiceWithoutTypeScriptRuntime();
  const card = validCard();
  assert.deepEqual(parseLearningNote(JSON.stringify({ version: 1, privateNote: 'note', card })), {
    privateNote: 'note', card, source: 'structured',
  });
});

test('preserves malformed JSON and marks object-looking text invalid', () => {
  const { parseLearningNote } = loadServiceWithoutTypeScriptRuntime();
  assert.deepEqual(parseLearningNote('{not json'), { privateNote: '{not json', card: null, source: 'invalid' });
  assert.deepEqual(parseLearningNote('[not json'), { privateNote: '[not json', card: null, source: 'invalid' });
});

test('rejects invalid review states and array fields', () => {
  const { parseLearningNote, serializeLearningNote } = loadServiceWithoutTypeScriptRuntime();
  for (const card of [
    validCard(7, { reviewState: 'done' }),
    validCard(7, { relatedNodeIds: [1, '2'] }),
    validCard(7, { relatedKeywords: ['ok', 2] }),
  ]) {
    assert.equal(parseLearningNote(JSON.stringify({ version: 1, privateNote: '', card })).source, 'invalid');
    assert.throws(() => serializeLearningNote('', card), TypeError);
  }
});

test('rejects invalid card node IDs and mismatched expected node IDs', () => {
  const { parseLearningNote, serializeLearningNote } = loadServiceWithoutTypeScriptRuntime();
  for (const card of [validCard(-1), validCard(7, { nodeId: 7.5 }), validCard(7, { nodeId: '7' })]) {
    assert.equal(parseLearningNote(JSON.stringify({ version: 1, privateNote: '', card })).source, 'invalid');
    assert.throws(() => serializeLearningNote('', card), TypeError);
  }
  assert.equal(parseLearningNote(JSON.stringify({ version: 1, privateNote: '', card: validCard(8) }), 7).source, 'invalid');
});

test('serializes and parses a learning note without losing review data', () => {
  const { parseLearningNote, serializeLearningNote } = loadServiceWithoutTypeScriptRuntime();
  const card = validCard(7, { reviewState: 'mastered', reviewCount: 3, lastReviewedAt: '2026-02-01T00:00:00.000Z' });
  const serialized = serializeLearningNote('private', card);
  assert.deepEqual(parseLearningNote(serialized, 7), { privateNote: 'private', card, source: 'structured' });
});

test('does not require localStorage for local record APIs', () => {
  globalThis.localStorage = undefined;
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  assert.deepEqual(loadLocalLearningRecord('anonymous', 7), { privateNote: '', card: null, source: 'empty' });
  assert.doesNotThrow(() => saveLocalLearningRecord('anonymous', 7, 'offline note', null));
});

test('isolates local records by both scope and node', () => {
  const { api } = memoryStorage();
  globalThis.localStorage = api;
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  saveLocalLearningRecord('scope-a', 7, 'a-seven', null);
  saveLocalLearningRecord('scope-a', 8, 'a-eight', null);
  saveLocalLearningRecord('scope-b', 7, 'b-seven', null);
  assert.equal(loadLocalLearningRecord('scope-a', 7).privateNote, 'a-seven');
  assert.equal(loadLocalLearningRecord('scope-a', 8).privateNote, 'a-eight');
  assert.equal(loadLocalLearningRecord('scope-b', 7).privateNote, 'b-seven');
});

test('persists review state and count only within the matching node boundary', () => {
  const { api } = memoryStorage();
  globalThis.localStorage = api;
  const { loadLocalLearningRecord, saveLocalLearningRecord } = loadServiceWithoutTypeScriptRuntime();
  const reviewed = validCard(7, { reviewState: 'fuzzy', reviewCount: 1, lastReviewedAt: '2026-02-01T00:00:00.000Z' });
  saveLocalLearningRecord('scope-a', 7, 'note', reviewed);
  assert.deepEqual(loadLocalLearningRecord('scope-a', 7).card, reviewed);
  assert.throws(() => saveLocalLearningRecord('scope-a', 8, 'note', reviewed), TypeError);
  assert.equal(loadLocalLearningRecord('scope-a', 8).card, null);
});
