import type { FavoriteGraphResponse } from './favorite';
import { fetchGraphNode } from '../../graph/services/graph';

/** 并发上限：首屏最多同时发 4 个节点详情请求。 */
const MAX_CONCURRENT_COVERS = 4;

/** nodeId -> coverImageUrl；null 表示已确认该节点没有封面，避免重复请求。 */
const coverCache = new Map<number, string | null>();
const inflight = new Map<number, Promise<string | null>>();
let activeRequests = 0;
const waiting: Array<() => void> = [];

export function readCachedCover(nodeId: number): string | null | undefined {
  return coverCache.get(nodeId);
}

function acquire(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_COVERS) {
    activeRequests += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(resolve));
}

function release() {
  activeRequests -= 1;
  const next = waiting.shift();
  if (next) {
    activeRequests += 1;
    next();
  }
}

export async function loadNodeCover(nodeId: number): Promise<string | null> {
  if (coverCache.has(nodeId)) {
    return coverCache.get(nodeId) ?? null;
  }
  const pending = inflight.get(nodeId);
  if (pending) {
    return pending;
  }
  const task = (async () => {
    await acquire();
    try {
      const node = await fetchGraphNode(nodeId);
      const url = node.coverImageUrl ?? null;
      coverCache.set(nodeId, url);
      return url;
    } catch {
      // 静默降级为类型色块，不阻塞卡片渲染
      coverCache.set(nodeId, null);
      return null;
    } finally {
      release();
      inflight.delete(nodeId);
    }
  })();
  inflight.set(nodeId, task);
  return task;
}

/** 用一次 fetchFavoriteGraph 的结果算出每个收藏节点的关联度数，避免逐卡请求。 */
export function relationCountsFromGraph(graph: FavoriteGraphResponse | null): Map<number, number> {
  const counts = new Map<number, number>();
  for (const node of graph?.nodes ?? []) {
    counts.set(node.id, 0);
  }
  for (const edge of graph?.edges ?? []) {
    counts.set(edge.sourceNodeId, (counts.get(edge.sourceNodeId) ?? 0) + 1);
    counts.set(edge.targetNodeId, (counts.get(edge.targetNodeId) ?? 0) + 1);
  }
  return counts;
}
