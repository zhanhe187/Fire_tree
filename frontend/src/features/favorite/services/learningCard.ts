export type ReviewState = 'todo' | 'fuzzy' | 'mastered';

export interface LearningCard {
  nodeId: number;
  coreUnderstanding: string;
  selfTestQuestion: string;
  relatedNodeIds: number[];
  relatedKeywords: string[];
  reviewState: ReviewState;
  reviewCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningNotePayload {
  version: 1;
  privateNote: string;
  card: LearningCard | null;
}

export interface LocalLearningRecord extends ParsedLearningNote {
  nodeId: number;
}

export type ParsedLearningNote = {
  privateNote: string;
  card: LearningCard | null;
  source: 'structured' | 'legacy' | 'empty' | 'invalid';
};

const REVIEW_STATES: readonly ReviewState[] = ['todo', 'fuzzy', 'mastered'];
const LOCAL_KEY_PREFIX = 'fire-tree:learning-card:';
const ANONYMOUS_LEARNING_SCOPE = 'anonymous';

/** Build the one browser-local scope used by both portal learning pages. */
export function learningScopeForUser(userId: number): string {
  return userId > 0 ? `user:${userId}` : ANONYMOUS_LEARNING_SCOPE;
}

function text(value: unknown): value is string {
  return typeof value === 'string';
}

function finiteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

function validTimestamp(value: unknown, nullable = false): value is string | null {
  if (nullable && value === null) return true;
  return text(value) && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isReviewState(value: unknown): value is ReviewState {
  return typeof value === 'string' && REVIEW_STATES.includes(value as ReviewState);
}

function isLearningCard(value: unknown): value is LearningCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Record<string, unknown>;
  return (
    finiteInteger(card.nodeId) &&
    card.nodeId >= 0 &&
    text(card.coreUnderstanding) &&
    text(card.selfTestQuestion) &&
    Array.isArray(card.relatedNodeIds) &&
    card.relatedNodeIds.every((id) => finiteInteger(id) && id >= 0) &&
    Array.isArray(card.relatedKeywords) &&
    card.relatedKeywords.every(text) &&
    isReviewState(card.reviewState) &&
    finiteInteger(card.reviewCount) &&
    card.reviewCount >= 0 &&
    validTimestamp(card.lastReviewedAt, true) &&
    validTimestamp(card.createdAt) &&
    validTimestamp(card.updatedAt)
  );
}

function emptyParsed(source: ParsedLearningNote['source'], privateNote = ''): ParsedLearningNote {
  return { privateNote, card: null, source };
}

export function parseLearningNote(raw?: string | null, expectedNodeId?: number): ParsedLearningNote {
  if (raw == null || raw === '') return emptyParsed('empty');
  if (typeof raw !== 'string') return emptyParsed('invalid', String(raw));

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const trimmed = raw.trimStart();
    return emptyParsed(trimmed.startsWith('{') || trimmed.startsWith('[') ? 'invalid' : 'legacy', raw);
  }

  if (!parsed || typeof parsed !== 'object') return emptyParsed('invalid', raw);
  const payload = parsed as Record<string, unknown>;
  if (
    payload.version !== 1 ||
    !text(payload.privateNote) ||
    (payload.card !== null &&
      (!isLearningCard(payload.card) || (expectedNodeId !== undefined && (payload.card as LearningCard).nodeId !== expectedNodeId)))
  ) {
    return emptyParsed('invalid', raw);
  }
  return { privateNote: payload.privateNote, card: payload.card as LearningCard | null, source: 'structured' };
}

export function serializeLearningNote(privateNote: string, card: LearningCard | null): string {
  if (card !== null && !isLearningCard(card)) {
    throw new TypeError('Invalid learning card');
  }
  const payload: LearningNotePayload = {
    version: 1,
    privateNote: typeof privateNote === 'string' ? privateNote : String(privateNote ?? ''),
    card,
  };
  return JSON.stringify(payload);
}

export function createEmptyLearningCard(nodeId: number, now = new Date().toISOString()): LearningCard {
  return {
    nodeId,
    coreUnderstanding: '',
    selfTestQuestion: '',
    relatedNodeIds: [],
    relatedKeywords: [],
    reviewState: 'todo',
    reviewCount: 0,
    lastReviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function learningCardStatus(card: LearningCard | null): 'todo' | 'review' | 'mastered' {
  if (!card || card.reviewState === 'todo') return 'todo';
  if (card.reviewState === 'fuzzy') return 'review';
  return 'mastered';
}

function localStorageKey(scope: string, nodeId: number): string {
  return `${LOCAL_KEY_PREFIX}${scope}:${nodeId}`;
}

/** Load the private note and optional card for one scope/node local record. */
export function loadLocalLearningRecord(scope: string, nodeId: number): ParsedLearningNote {
  if (typeof globalThis.localStorage === 'undefined') return emptyParsed('empty');

  let raw: string | null;
  try {
    raw = globalThis.localStorage.getItem(localStorageKey(scope, nodeId));
  } catch {
    return emptyParsed('empty');
  }
  return parseLearningNote(raw, nodeId);
}

/** Save a private note and optional card under the explicit scope/node key. */
export function saveLocalLearningRecord(
  scope: string,
  nodeId: number,
  privateNote: string,
  card: LearningCard | null,
): void {
  if (!finiteInteger(nodeId)) throw new TypeError('Invalid learning card node ID');
  if (card !== null && (!isLearningCard(card) || card.nodeId !== nodeId)) {
    throw new TypeError('Learning card node ID does not match storage key');
  }
  const serialized = serializeLearningNote(privateNote, card);

  try {
    if (typeof globalThis.localStorage === 'undefined') return;
    globalThis.localStorage.setItem(localStorageKey(scope, nodeId), serialized);
  } catch {
    // Local storage is an optional fallback and must never block learning.
  }
}

/** List all saved records in one scope so anonymous study records can feed the index. */
export function listLocalLearningRecords(scope: string): LocalLearningRecord[] {
  if (typeof globalThis.localStorage === 'undefined') return [];
  const prefix = `${LOCAL_KEY_PREFIX}${scope}:`;
  const records: LocalLearningRecord[] = [];
  try {
    for (let index = 0; index < globalThis.localStorage.length; index += 1) {
      const key = globalThis.localStorage.key(index);
      if (!key || !key.startsWith(prefix)) continue;
      const rawNodeId = key.slice(prefix.length);
      const nodeId = Number(rawNodeId);
      if (!finiteInteger(nodeId) || nodeId < 0) continue;
      records.push({ nodeId, ...loadLocalLearningRecord(scope, nodeId) });
    }
  } catch {
    return [];
  }
  return records.sort((a, b) => a.nodeId - b.nodeId);
}
