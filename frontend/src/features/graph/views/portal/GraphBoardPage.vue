<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import {
  GitBranch,
  Loader2,
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minus,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
} from 'lucide-vue-next';
import { EdgeTypeItem, GraphAiSearchResult, GraphNodeItem, GraphVisualizationEdge, GraphVisualizationNode, NodeTypeItem, SemanticChain, fetchEdgeTypes, fetchGraphHubs, fetchGraphNodes, fetchGraphRelations, fetchGraphVisualization, fetchNodeTypes, graphAiSearch } from '../../services/graph';
import {
  applyProjectedDrag,
  expandedWorldPosition,
  projectPoint,
  type ProjectedPoint,
  type WorldPoint,
} from '../../utils/graphLayout.js';

const nodeTypes = ref<NodeTypeItem[]>([]);
const edgeTypes = ref<EdgeTypeItem[]>([]);
const nodes = ref<GraphVisualizationNode[]>([]);
const edges = ref<GraphVisualizationEdge[]>([]);
const selectedNode = ref<GraphVisualizationNode | null>(null);
const nodePositions = ref<Record<number, { x: number; y: number; depth: number; scale: number }>>({});
const expandedNodePositions = ref<Record<number, WorldPoint>>({});
const svgRef = ref<SVGSVGElement | null>(null);
const sidePanelRef = ref<HTMLElement | null>(null);
const draggingNodeId = ref<number | null>(null);
const dragOffset = ref({ x: 0, y: 0, worldX: 0, worldY: 0, worldZ: 0, scale: 1 });
const graphExpanded = ref(false);
const graphRotating = ref(false);
const canvasActive = ref(false);
const canvasTransitionActive = ref(false);
const canvasTransitionOrigin = reactive({ x: '50%', y: '50%' });
let canvasTransitionTimer: number | undefined;
const searchCollapsed = ref(false);
const relationCollapsed = ref(false);
const semanticCollapsed = ref(false);
const graphRotation = ref({ yaw: -0.28, pitch: 18 });
const canvasZoom = ref(1);
const rotationStart = ref({ clientX: 0, clientY: 0, yaw: -0.28, pitch: 18 });
const chains = ref<SemanticChain[]>([]);
const aiAnswer = ref('');
const aiResults = ref<GraphAiSearchResult[]>([]);
const semanticSearched = ref(false);
const loading = ref(false);
const searching = ref(false);
const error = ref('');
const semanticError = ref('');

type RelationDisplayEdge = {
  edgeTypeCode?: string;
  edgeTypeName?: string;
  relationLabel?: string;
};

const filters = reactive({
  keyword: '',
  nodeTypeId: '' as number | '',
  edgeTypeId: '' as number | '',
  centerNodeId: '' as number | '',
  depth: 1,
  page: 1,
  size: 20,
  total: 0,
});

// 中心节点候选：用检索结果填充，保证"能选择看哪几个节点"。
const centerOptions = ref<GraphNodeItem[]>([]);
const centerLoading = ref(false);

const isCenterMode = computed(() => filters.centerNodeId !== '');

const semanticQuestion = ref('苏绣的传人的师父是谁');

const canvasNodes = computed(() => {
  return nodes.value.map((node, index) => {
    if (!graphExpanded.value) {
      const position = nodePositions.value[node.id] ?? initialNodePosition(index, nodes.value.length);
      return {
        ...node,
        ...position,
        worldX: position.x - 420,
        worldY: position.y - 260,
        worldZ: 0,
      };
    }
    const world = expandedNodePositions.value[node.id] ?? expandedWorldPosition(index, nodes.value.length);
    const position = projectPoint(world, graphRotation.value);
    return {
      ...node,
      ...position,
      worldX: world.x,
      worldY: world.y,
      worldZ: world.z,
    };
  }).sort((a, b) => a.depth - b.depth);
});

const positionById = computed(() => new Map(canvasNodes.value.map((node) => [node.id, node])));
const visibleEdges = computed(() => edges.value.filter((edge) => (
  edge.sourceNodeId !== edge.targetNodeId
  && positionById.value.has(edge.sourceNodeId)
  && positionById.value.has(edge.targetNodeId)
)));
const selectedNeighborEdges = computed(() => {
  const nodeId = selectedNode.value?.id;
  if (!nodeId) return [];
  return visibleEdges.value.filter((edge) => edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId);
});
// 当前子图的轻量分析：关系类型分布 + 度数最高的枢纽节点 + 孤立节点数。
const subgraphAnalysis = computed(() => {
  const degree = new Map<number, number>();
  const relationCount = new Map<string, number>();
  const nameById = new Map(nodes.value.map((node) => [node.id, node.name]));
  for (const edge of visibleEdges.value) {
    degree.set(edge.sourceNodeId, (degree.get(edge.sourceNodeId) ?? 0) + 1);
    if (edge.targetNodeId !== edge.sourceNodeId) {
      degree.set(edge.targetNodeId, (degree.get(edge.targetNodeId) ?? 0) + 1);
    }
    const label = edgeLabelText(edge) || '未知关系';
    relationCount.set(label, (relationCount.get(label) ?? 0) + 1);
  }
  const topRelations = [...relationCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
  const topNodes = [...degree.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, name: nameById.get(id) ?? `节点 #${id}`, count }));
  const isolated = nodes.value.filter((node) => !degree.has(node.id)).length;
  return {
    nodeCount: nodes.value.length,
    edgeCount: visibleEdges.value.length,
    isolated,
    topRelations,
    topNodes,
  };
});
const canvasTransform = computed(() => `translate(420 260) scale(${canvasZoom.value}) translate(-420 -260)`);
const selectedNodeRegion = computed(() => [selectedNode.value?.province, selectedNode.value?.city].filter(Boolean).join(' / ') || '地区未设置');
const selectedNodeSummary = computed(() => selectedNode.value?.summary || '该节点已收录为非遗知识图谱项目，暂无关系时可先查看其类型、地区与基础档案。');
const fallbackAiResults = computed<GraphAiSearchResult[]>(() => {
  if (aiResults.value.length) return aiResults.value;
  const byId = new Map<number, GraphAiSearchResult>();
  chains.value.forEach((chain) => {
    const node = [...chain.nodes].reverse().find((item) => item.nodeTypeCode === 'inheritor') ?? chain.nodes.at(-1);
    if (!node || byId.has(node.id)) return;
    byId.set(node.id, {
      id: node.id,
      name: node.name,
      nodeTypeCode: node.nodeTypeCode,
      nodeTypeName: displayNodeTypeName(node.nodeTypeCode),
      relations: chain.edges
        .map((edge) => displayRelationLabel(edge))
        .filter(Boolean),
    });
  });
  return [...byId.values()];
});
const fallbackAiAnswer = computed(() => {
  if (aiAnswer.value) return displayAiAnswer(aiAnswer.value);
  if (fallbackAiResults.value.length) {
    return `找到相关结果：${fallbackAiResults.value.map((item) => item.name).join('、')}。`;
  }
  return semanticSearched.value ? '暂未在图谱中找到匹配结果。' : '';
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [typeResponse, edgeTypeResponse] = await Promise.all([
      fetchNodeTypes(),
      fetchEdgeTypes(),
    ]);
    nodeTypes.value = typeResponse.items;
    edgeTypes.value = edgeTypeResponse.items;

    if (isCenterMode.value) {
      // 中心模式：直接取该节点的 1–2 跳邻居与它们之间的真实关系边，
      // 保证画布上一定有连线（全图分页模式做不到，因为相邻节点通常不在同一页）。
      const selectedEdgeType = filters.edgeTypeId
        ? edgeTypes.value.find((type) => type.id === filters.edgeTypeId)
        : undefined;
      try {
        const relations = await fetchGraphRelations(Number(filters.centerNodeId), {
          depth: filters.depth,
          direction: 'both',
          limit: filters.size,
          relationTypes: selectedEdgeType ? [selectedEdgeType.typeCode] : undefined,
        });
        nodes.value = relations.nodes;
        edges.value = relations.edges;
        filters.total = relations.nodeCount;
        filters.page = 1;
      } catch (centerError) {
        // 中心节点被删除或不可见：退回全图，而不是让整块画布报错。
        filters.centerNodeId = '';
        throw centerError;
      }
    } else {
      const graphResponse = await fetchGraphVisualization(filters);
      nodes.value = graphResponse.nodes;
      edges.value = graphResponse.edges;
      filters.total = graphResponse.total;
    }

    if (isCenterMode.value) {
      syncCenterPositions(nodes.value, edges.value);
    } else {
      syncNodePositions(nodes.value);
    }
    if (!nodes.value.some((node) => node.id === selectedNode.value?.id)) {
      selectedNode.value = firstConnectedNode(nodes.value, edges.value) ?? nodes.value[0] ?? null;
    }
    await loadCenterOptions();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '图谱看板加载失败';
  } finally {
    loading.value = false;
  }
}

/** 中心节点候选：跟当前关键词/类型一致的前 50 个节点。 */
async function loadCenterOptions() {
  centerLoading.value = true;
  try {
    const response = await fetchGraphNodes({
      keyword: filters.keyword,
      nodeTypeId: filters.nodeTypeId === '' ? undefined : Number(filters.nodeTypeId),
      auditStatus: 'APPROVED',
      page: 1,
      size: 50,
    });
    const options = [...response.items];
    // 当前中心可能不在这一批候选里（例如翻页后），补一个占位项避免下拉显示空白。
    if (filters.centerNodeId !== '' && !options.some((item) => item.id === filters.centerNodeId)) {
      const known = nodes.value.find((node) => node.id === filters.centerNodeId);
      options.unshift({
        id: Number(filters.centerNodeId),
        nodeCode: '',
        nodeTypeId: 0,
        nodeTypeName: known?.nodeTypeName ?? '',
        name: known?.name ?? `节点 #${filters.centerNodeId}`,
        visibility: 'PUBLIC',
        auditStatus: 'APPROVED',
      });
    }
    centerOptions.value = options;
  } catch {
    // 候选列表只是辅助选择，失败不影响画布本身。
  } finally {
    centerLoading.value = false;
  }
}

/** 以某个节点为中心展开（画布点选与下拉共用）。 */
async function focusNode(nodeId: number) {
  filters.centerNodeId = nodeId;
  filters.page = 1;
  await load();
}

async function clearCenter() {
  filters.centerNodeId = '';
  filters.page = 1;
  await load();
}

async function focusSelectedNode() {
  if (!selectedNode.value) return;
  await focusNode(selectedNode.value.id);
}

/** 空态引导：以第一个节点为中心展开，并直接进入画布，避免用户还要多点一次。 */
async function focusFirstNode() {
  if (!nodes.value.length) return;
  await focusNode(nodes.value[0].id);
  enterCanvas();
}

async function askSemantic() {
  if (!semanticQuestion.value.trim()) {
    semanticError.value = '请输入语义检索问句';
    return;
  }
  searching.value = true;
  semanticSearched.value = true;
  semanticError.value = '';
  aiAnswer.value = '';
  aiResults.value = [];
  chains.value = [];
  try {
    const response = await graphAiSearch({
      question: semanticQuestion.value,
      mode: 'RELATION_EXPLORATION',
      topK: 20,
      currentNodeId: selectedNode.value?.id,
    });
    aiAnswer.value = response.answer ?? '';
    aiResults.value = response.results ?? [];
    chains.value = response.execution?.chains ?? [];
  } catch (err) {
    semanticError.value = err instanceof Error ? err.message : 'AI 智能检索失败';
  } finally {
    searching.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.nodeTypeId = '';
  filters.edgeTypeId = '';
  filters.page = 1;
  void load();
}

function enterCanvas() {
  canvasActive.value = true;
  graphExpanded.value = true;
  requestAnimationFrame(() => {
    document.getElementById('graph-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function startCanvasEntryTransition(event: MouseEvent) {
  if (canvasActive.value || canvasTransitionActive.value) return;

  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (target) {
    const rect = target.getBoundingClientRect();
    canvasTransitionOrigin.x = `${Math.round(rect.left + rect.width / 2)}px`;
    canvasTransitionOrigin.y = `${Math.round(rect.top + rect.height / 2)}px`;
  } else {
    canvasTransitionOrigin.x = '50%';
    canvasTransitionOrigin.y = '50%';
  }

  graphExpanded.value = true;
  canvasTransitionActive.value = true;
  canvasTransitionTimer = window.setTimeout(() => {
    canvasTransitionActive.value = false;
    enterCanvas();
    canvasTransitionTimer = undefined;
  }, 920);
}

function zoomCanvas(delta: number) {
  graphExpanded.value = true;
  canvasZoom.value = Math.min(1.55, Math.max(0.72, Number((canvasZoom.value + delta).toFixed(2))));
}

function resetCanvasZoom() {
  graphExpanded.value = true;
  canvasZoom.value = 1;
}

function handleCanvasWheel(event: WheelEvent) {
  event.preventDefault();
  zoomCanvas(event.deltaY > 0 ? -0.08 : 0.08);
}

function handleSidePanelWheel(event: WheelEvent) {
  sidePanelRef.value?.scrollBy({ top: event.deltaY, behavior: 'auto' });
}

function firstConnectedNode(nextNodes: GraphVisualizationNode[], nextEdges: GraphVisualizationEdge[]) {
  const connectedIds = new Set<number>();
  nextEdges.forEach((edge) => {
    connectedIds.add(edge.sourceNodeId);
    connectedIds.add(edge.targetNodeId);
  });
  return nextNodes.find((node) => connectedIds.has(node.id)) ?? null;
}

function nodeRadius(node: GraphVisualizationNode) {
  if (graphExpanded.value) {
    if (selectedNode.value?.id === node.id) return nodes.value.length > 24 ? 28 : 32;
    return nodes.value.length > 24 ? 22 : 26;
  }
  if (draggingNodeId.value === node.id) return 40;
  return selectedNode.value?.id === node.id ? 36 : 30;
}

function initialNodePosition(index: number, total: number) {
  const centerX = 420;
  const centerY = 260;
  const radiusX = total > 5 ? 270 : 210;
  const radiusY = total > 5 ? 158 : 128;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: centerX + Math.cos(angle) * radiusX,
    y: centerY + Math.sin(angle) * radiusY,
    depth: 0.78 + (Math.sin(angle) + 1) * 0.16,
    scale: 1,
  };
}

function syncNodePositions(nextNodes: GraphVisualizationNode[]) {
  const nextPositions: Record<number, { x: number; y: number; depth: number; scale: number }> = {};
  const nextExpandedPositions: Record<number, WorldPoint> = {};
  nextNodes.forEach((node, index) => {
    nextPositions[node.id] = nodePositions.value[node.id] ?? initialNodePosition(index, nextNodes.length);
    nextExpandedPositions[node.id] = expandedNodePositions.value[node.id] ?? expandedWorldPosition(index, nextNodes.length);
  });
  nodePositions.value = nextPositions;
  expandedNodePositions.value = nextExpandedPositions;
}

/**
 * 中心模式专用布局：中心节点在画布中心，按 BFS 层级分环摆放（1 跳内环、2 跳外环）。
 * 不能复用全图模式的位置——同一节点在两次检索里会保留旧坐标，星形关系会偏到画面边缘。
 */
function syncCenterPositions(nextNodes: GraphVisualizationNode[], nextEdges: GraphVisualizationEdge[]) {
  const nextPositions: Record<number, { x: number; y: number; depth: number; scale: number }> = {};
  const nextExpandedPositions: Record<number, WorldPoint> = {};
  if (!nextNodes.length) {
    nodePositions.value = nextPositions;
    expandedNodePositions.value = nextExpandedPositions;
    return;
  }

  // 用边做 BFS 分层：中心 0 层，直接关系 1 层，再往外 2 层。
  const ids = new Set(nextNodes.map((node) => node.id));
  const adjacency = new Map<number, number[]>();
  for (const edge of nextEdges) {
    if (!ids.has(edge.sourceNodeId) || !ids.has(edge.targetNodeId)) continue;
    if (!adjacency.has(edge.sourceNodeId)) adjacency.set(edge.sourceNodeId, []);
    if (!adjacency.has(edge.targetNodeId)) adjacency.set(edge.targetNodeId, []);
    adjacency.get(edge.sourceNodeId)!.push(edge.targetNodeId);
    adjacency.get(edge.targetNodeId)!.push(edge.sourceNodeId);
  }
  const centerId = nextNodes[0].id;
  const levelById = new Map<number, number>([[centerId, 0]]);
  const queue: number[] = [centerId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!levelById.has(neighbor)) {
        levelById.set(neighbor, (levelById.get(current) ?? 0) + 1);
        queue.push(neighbor);
      }
    }
  }

  const byLevel = new Map<number, number[]>();
  for (const node of nextNodes) {
    const level = levelById.get(node.id) ?? 2;
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level)!.push(node.id);
  }

  nextPositions[centerId] = { x: 420, y: 268, depth: 1.06, scale: 1 };
  nextExpandedPositions[centerId] = { x: 0, y: 0, z: 0 };

  const radii = [
    { x: 168, y: 92 },
    { x: 232, y: 128 },
  ];
  for (const [level, nodeIds] of byLevel) {
    if (level === 0) continue;
    const ring = radii[Math.min(level - 1, radii.length - 1)];
    nodeIds.forEach((nodeId, index) => {
      const angle = (index / Math.max(nodeIds.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nextPositions[nodeId] = {
        x: 408 + Math.cos(angle) * ring.x,
        y: 268 + Math.sin(angle) * ring.y,
        depth: 0.9 - level * 0.04 + (Math.sin(angle) + 1) * 0.03,
        scale: 1,
      };
      nextExpandedPositions[nodeId] = {
        x: Math.cos(angle) * (ring.x + 8),
        y: Math.sin(angle) * (ring.y + 6),
        z: Math.sin(angle * 2) * 26,
      };
    });
  }

  nodePositions.value = nextPositions;
  expandedNodePositions.value = nextExpandedPositions;
}

function svgPoint(event: PointerEvent) {
  const svg = svgRef.value;
  if (!svg) return { x: 0, y: 0 };
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : { x: point.x, y: point.y };
}

function startDrag(
  event: PointerEvent,
  node: GraphVisualizationNode & { x: number; y: number; depth: number; scale?: number; worldX?: number; worldY?: number; worldZ?: number },
) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  selectedNode.value = node;
  draggingNodeId.value = node.id;
  const point = svgPoint(event);
  dragOffset.value = {
    x: point.x - node.x,
    y: point.y - node.y,
    worldX: 'worldX' in node ? Number(node.worldX) : node.x - 420,
    worldY: 'worldY' in node ? Number(node.worldY) : node.y - 260,
    worldZ: 'worldZ' in node ? Number(node.worldZ) : 0,
    scale: 'scale' in node ? Number(node.scale) : 1,
  };
  capturePointer(event.currentTarget as SVGElement, event.pointerId);
}

function dragNode(event: PointerEvent) {
  if (draggingNodeId.value === null) return;
  const point = svgPoint(event);
  const x = Math.min(790, Math.max(50, point.x - dragOffset.value.x));
  const y = Math.min(470, Math.max(58, point.y - dragOffset.value.y));
  if (graphExpanded.value) {
    const delta = {
      x: x - projectPoint({
        x: dragOffset.value.worldX,
        y: dragOffset.value.worldY,
        z: dragOffset.value.worldZ,
      }, graphRotation.value).x,
      y: y - projectPoint({
        x: dragOffset.value.worldX,
        y: dragOffset.value.worldY,
        z: dragOffset.value.worldZ,
      }, graphRotation.value).y,
    };
    expandedNodePositions.value = {
      ...expandedNodePositions.value,
      [draggingNodeId.value]: applyProjectedDrag({
        x: dragOffset.value.worldX,
        y: dragOffset.value.worldY,
        z: dragOffset.value.worldZ,
      }, delta, dragOffset.value.scale),
    };
    return;
  }
  nodePositions.value = {
      ...nodePositions.value,
      [draggingNodeId.value]: {
      ...(nodePositions.value[draggingNodeId.value] ?? { x, y, depth: 1, scale: 1 }),
      x,
      y,
      depth: 1.08,
      scale: 1,
    },
  };
}

function endDrag(event?: PointerEvent) {
  if (draggingNodeId.value === null) return;
  if (event?.currentTarget instanceof SVGElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const id = draggingNodeId.value;
  if (!graphExpanded.value) {
    nodePositions.value = {
      ...nodePositions.value,
      [id]: {
        ...nodePositions.value[id],
        depth: 0.96,
        scale: 1,
      },
    };
  }
  draggingNodeId.value = null;
}

function startGraphRotate(event: PointerEvent) {
  if (event.button !== 1) return;
  graphExpanded.value = true;
  event.preventDefault();
  graphRotating.value = true;
  rotationStart.value = {
    clientX: event.clientX,
    clientY: event.clientY,
    yaw: graphRotation.value.yaw,
    pitch: graphRotation.value.pitch,
  };
  if (svgRef.value) {
    capturePointer(svgRef.value, event.pointerId);
  }
}

function rotateGraph(event: PointerEvent) {
  if (!graphRotating.value) return;
  const deltaX = event.clientX - rotationStart.value.clientX;
  const deltaY = event.clientY - rotationStart.value.clientY;
  graphRotation.value = {
    yaw: rotationStart.value.yaw + deltaX * 0.012,
    pitch: Math.min(38, Math.max(-18, rotationStart.value.pitch - deltaY * 0.16)),
  };
}

function endGraphRotate(event?: PointerEvent) {
  if (!graphRotating.value) return;
  if (event && svgRef.value?.hasPointerCapture(event.pointerId)) {
    svgRef.value.releasePointerCapture(event.pointerId);
  }
  graphRotating.value = false;
}

function capturePointer(element: SVGElement, pointerId: number) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointer events used by automation do not always create an active pointer.
  }
}

function handleCanvasPointerMove(event: PointerEvent) {
  graphExpanded.value = true;
  if (graphRotating.value) {
    rotateGraph(event);
    return;
  }
  dragNode(event);
}

function endCanvasPointer(event?: PointerEvent) {
  endGraphRotate(event);
  endDrag(event);
}

function collapseGraph() {
  if (draggingNodeId.value !== null || graphRotating.value) return;
  graphExpanded.value = false;
  graphRotating.value = false;
}

function edgePath(edge: GraphVisualizationEdge) {
  const source = positionById.value.get(edge.sourceNodeId);
  const target = positionById.value.get(edge.targetNodeId);
  if (!source || !target) return '';
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const curve = Math.min(46, length * 0.12);
  const controlX = midX - (dy / length) * curve;
  const controlY = midY + (dx / length) * curve;
  return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
}

/** 关系名称：优先关系标签，其次关系类型名，最后用编码兜底。 */
function edgeLabelText(edge: GraphVisualizationEdge) {
  return edge.relationLabel || edge.edgeTypeName || edge.edgeTypeCode || '';
}

/** 二次贝塞尔 t=0.5 处的中点，沿法线外移一点，避免多条边的名称在节点旁叠成一团。 */
function edgeLabelPoint(edge: GraphVisualizationEdge) {
  const source = positionById.value.get(edge.sourceNodeId);
  const target = positionById.value.get(edge.targetNodeId);
  if (!source || !target) return null;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const curve = Math.min(46, length * 0.12);
  const controlX = (source.x + target.x) / 2 - (dy / length) * curve;
  const controlY = (source.y + target.y) / 2 + (dx / length) * curve;
  const baseX = 0.25 * source.x + 0.5 * controlX + 0.25 * target.x;
  const baseY = 0.25 * source.y + 0.5 * controlY + 0.25 * target.y;
  return {
    x: baseX - (dy / length) * 10,
    y: baseY + (dx / length) * 10,
  };
}

function isSelfLoop(edge: GraphVisualizationEdge) {
  return edge.sourceNodeId === edge.targetNodeId;
}

function edgeIsRelated(edge: GraphVisualizationEdge) {
  const nodeId = selectedNode.value?.id;
  return Boolean(nodeId && (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId));
}

function neighborName(edge: GraphVisualizationEdge) {
  if (edge.sourceNodeId === selectedNode.value?.id) return edge.targetNodeName;
  return edge.sourceNodeName;
}

const nodeTypeLabels: Record<string, string> = {
  PROJECT: '非遗项目',
  INHERITOR: '传承人',
  REGION: '地域',
  WORK: '作品',
  PROCESS: '工艺',
  EVENT: '活动',
  MEDIA: '媒资',
};

function displayNodeTypeName(value?: string) {
  const text = value?.trim();
  if (!text) return '相关节点';
  const localized = text.replace(/\b(project|inheritor|region|work|process|event|media)\b/gi, (item) => nodeTypeLabels[item.toUpperCase()] || item);
  if (nodeTypeLabels[text.toUpperCase()]) return nodeTypeLabels[text.toUpperCase()];
  return /[\u3400-\u9fff]/.test(localized) && !/[A-Za-z]/.test(localized) ? localized : '相关节点';
}

function displayRelationDirection(value?: string) {
  const text = value?.trim();
  if (!text) return '关系';
  const labels: Record<string, string> = { OUTGOING: '关联到', INCOMING: '来自' };
  const normalized = text.toUpperCase();
  if (labels[normalized]) return labels[normalized];
  return /[\u3400-\u9fff]/.test(text) && !/[A-Za-z]/.test(text) ? text : '关系';
}

function relationDirection(edge: GraphVisualizationEdge) {
  if (edge.sourceNodeId === selectedNode.value?.id) return `${displayRelationDirection('OUTGOING')} ${edge.targetNodeName}`;
  return `${displayRelationDirection('INCOMING')} ${edge.sourceNodeName}`;
}

function isPlaceholderRelationLabel(label?: string) {
  return Boolean(label?.trim() && /^[?？]+$/.test(label.trim()));
}

function displayRelationLabel(edge?: RelationDisplayEdge) {
  if (!edge) return '相关关系';
  const label = edge.relationLabel?.trim();
  if (label && !isPlaceholderRelationLabel(label)) return displayRelationText(label);
  return displayRelationText(edge.edgeTypeName || edge.edgeTypeCode);
}

const relationLabels: Record<string, string> = {
  originated_in: '发源于',
  has_inheritor: '拥有传承人',
  listed_by: '列入名录',
  uses_technique: '使用技艺',
  masters_technique: '掌握技艺',
  uses_tool: '使用工具',
  displayed_at: '展出于',
  inherited_from: '师承',
  'uses technique': '使用技艺',
  'used by': '被使用',
  'masters technique': '掌握技艺',
  'mastered by': '被掌握',
  'uses tool': '使用工具',
};

function displayRelationText(value?: string) {
  const text = value?.trim();
  if (!text) return '相关关系';
  const label = relationLabels[text.toLowerCase()] || text;
  return /[\u3400-\u9fff]/.test(label) && !/[A-Za-z]/.test(label) ? label : '相关关系';
}

function displayRelationTexts(values?: string[]) {
  return values?.map((value) => displayRelationText(value)).join('；') || '';
}

function displayAiAnswer(value?: string) {
  const text = value?.trim();
  if (!text) return '';
  const localized = text
    .replace(/related entities?/gi, '相关实体')
    .replace(/related projects?/gi, '相关项目')
    .replace(/relationships?/gi, '关系')
    .replace(/inheritors?/gi, '传承人')
    .replace(/representative works?/gi, '代表作品')
    .replace(/regions?/gi, '相关地区')
    .replace(/techniques?/gi, '相关技法')
    .replace(/entities?/gi, '实体')
    .replace(/projects?/gi, '项目');
  // Only strip as a last resort: the sentence is Chinese, so leftover Latin letters are an
  // untranslated label — but blind stripping is what turned 「的inheritors有」 into 「的有」.
  return /[A-Za-z]/.test(localized)
    ? `智能检索结果：${localized.replace(/[A-Za-z]+/g, '').replace(/\s{2,}/g, ' ').trim()}`
    : localized;
}

/**
 * 首屏默认以「关系最多的项目」为中心展开，打开画布就是有连线的图。
 * 拉不到枢纽时退回全图模式，不影响可用性。
 */
async function applyDefaultCenter() {
  if (filters.centerNodeId !== '') return;
  try {
    const response = await fetchGraphHubs(5);
    const hub = response.items?.find((item) => item.nodeTypeCode === 'heritage_project') ?? response.items?.[0];
    if (!hub) return;
    filters.centerNodeId = hub.id;
    filters.depth = 1;
    filters.page = 1;
  } catch {
    // 枢纽接口失败时保持全图浏览
  }
}

onMounted(async () => {
  await applyDefaultCenter();
  await load();
  // 已经有默认中心且拿到关系边时，直接进入画布：打开页面就是有连线的图，
  // 不需要先点一次「进入图谱画布」。
  if (isCenterMode.value && edges.value.length > 0) {
    enterCanvas();
  }
});

onUnmounted(() => {
  if (canvasTransitionTimer) {
    window.clearTimeout(canvasTransitionTimer);
  }
});
</script>

<template>
  <section
    id="graph-canvas"
    class="graph-board-page"
    :class="{ 'canvas-active': canvasActive, 'canvas-transitioning': canvasTransitionActive }"
    :style="{ '--canvas-transition-x': canvasTransitionOrigin.x, '--canvas-transition-y': canvasTransitionOrigin.y }"
  >
    <header class="page-heading">
      <div>
        <p class="eyebrow">图谱看板</p>
        <h2>知识图谱看板</h2>
        <span>拖拽节点调整关系布局，筛选图谱范围，并用问句追踪传承链路。</span>
      </div>
      <div class="heading-actions">
        <button class="primary-action" type="button" @click="enterCanvas">
          <Maximize2 :size="16" />
          进入图谱画布
        </button>
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>

    <section class="filter-bar graph-board-filter" :class="{ collapsed: searchCollapsed }">
      <button class="panel-collapse graph-filter-toggle" type="button" @click="searchCollapsed = !searchCollapsed">
        <ChevronDown v-if="searchCollapsed" :size="15" />
        <ChevronUp v-else :size="15" />
        <span>{{ searchCollapsed ? '展开检索' : '收起检索' }}</span>
      </button>
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="节点名称 / 编码 / 简介" @keyup.enter="load" />
      </label>
      <label>
        <span>节点类型</span>
        <select v-model="filters.nodeTypeId">
          <option value="">全部节点</option>
          <option v-for="type in nodeTypes" :key="type.id" :value="type.id">{{ displayNodeTypeName(type.typeName) }}</option>
        </select>
      </label>
      <label>
        <span>中心节点</span>
        <select
          v-model="filters.centerNodeId"
          :disabled="centerLoading"
          @change="load"
        >
          <option value="">全图浏览（按更新时间）</option>
          <option v-for="option in centerOptions" :key="option.id" :value="option.id">
            {{ option.name }}<template v-if="option.nodeTypeName"> · {{ displayNodeTypeName(option.nodeTypeName) }}</template>
          </option>
        </select>
      </label>
      <label>
        <span>展开深度</span>
        <select v-model.number="filters.depth" @change="load">
          <option :value="1">1 跳（直接关系）</option>
          <option :value="2">2 跳（关系的关系）</option>
        </select>
      </label>
      <label>
        <span>展示节点数</span>
        <select v-model.number="filters.size" @change="load">
          <option :value="20">20 个</option>
          <option :value="30">30 个</option>
          <option :value="50">50 个</option>
        </select>
      </label>
      <label>
        <span>关系类型</span>
        <select v-model="filters.edgeTypeId" @change="load">
          <option value="">全部关系</option>
          <option v-for="type in edgeTypes" :key="type.id" :value="type.id">{{ displayRelationText(type.typeName) }}</option>
        </select>
      </label>
      <div class="filter-actions">
        <button class="primary-action compact" type="button" @click="filters.page = 1; load()">
          <Search :size="16" />
          检索
        </button>
        <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
      </div>
    </section>

    <section class="graph-board-layout">
      <article class="graph-workbench">
        <div class="table-toolbar">
          <span>节点 {{ nodes.length }} / 关系 {{ edges.length }}</span>
          <span v-if="isCenterMode">已按中心节点展开 · 深度 {{ filters.depth }} 跳</span>
          <span v-else>拖拽节点可实时调整画布</span>
        </div>

        <div v-if="!isCenterMode && !loading && nodes.length > 0 && edges.length === 0" class="graph-center-hint">
          <GitBranch :size="16" />
          <span>这 {{ nodes.length }} 个节点之间没有直接关系线。图谱只展示同一页内的边，相邻节点通常不在这里。</span>
          <button type="button" @click="focusFirstNode">以「{{ nodes[0].name }}」为中心展开</button>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载图谱关系</span>
        </div>

        <div v-else-if="nodes.length === 0" class="state-panel empty">
          <strong>暂无匹配节点</strong>
          <span>调整关键词或类型筛选后重新检索。</span>
        </div>

        <button v-if="!canvasActive && !canvasTransitionActive" class="graph-canvas-entry" type="button" @click="startCanvasEntryTransition">
          <Maximize2 :size="18" />
          <strong>进入图谱画布</strong>
          <span>进入后可滚轮缩放画布、拖动节点、查看右侧悬浮节点档案。</span>
        </button>

        <div v-else-if="canvasTransitionActive" class="graph-canvas-expansion" aria-hidden="true">
          <div class="graph-canvas-expansion-preview">
            <svg viewBox="0 0 840 520" role="img">
              <g class="graph-zoom-layer" :transform="canvasTransform">
                <g class="edge-layer">
                  <path
                    v-for="edge in visibleEdges"
                    :key="'preview-edge-' + edge.id"
                    :d="edgePath(edge)"
                    stroke="rgba(118, 85, 45, .24)"
                    stroke-width="1.2"
                    fill="none"
                  />
                </g>
                <g
                  v-for="node in canvasNodes"
                  :key="'preview-node-' + node.id"
                  :transform="`translate(${node.x} ${node.y}) scale(${node.scale ?? 1})`"
                  class="graph-node"
                >
                  <circle :r="nodeRadius(node)" :fill="node.nodeTypeColor || '#d7a84f'" />
                  <circle :r="Math.max(12, nodeRadius(node) - 8)" fill="rgba(255,255,255,.18)" />
                  <text y="5" text-anchor="middle">{{ node.name.slice(0, 4) }}</text>
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div
          v-else-if="canvasActive"
          class="graph-stage"
          :class="{ expanded: graphExpanded, rotating: graphRotating }"
          @mouseenter="graphExpanded = true"
          @mouseover="graphExpanded = true"
          @mouseleave="collapseGraph"
        >
          <div class="graph-depth-hint">
            <span>{{ graphExpanded ? '滚轮缩放画布，按住鼠标中键旋转，左键拖动节点' : '点击进入画布后可缩放与拖动节点' }}</span>
          </div>
          <div class="graph-zoom-controls" aria-label="图谱画布缩放控制">
            <button type="button" title="放大画布" @click="zoomCanvas(0.1)"><Plus :size="15" /></button>
            <strong>{{ Math.round(canvasZoom * 100) }}%</strong>
            <button type="button" title="缩小画布" @click="zoomCanvas(-0.1)"><Minus :size="15" /></button>
            <button type="button" title="复位画布" @click="resetCanvasZoom"><RotateCcw :size="15" /></button>
          </div>
          <svg
            ref="svgRef"
            viewBox="0 0 840 520"
            role="img"
            aria-label="知识图谱关系画布"
            :class="{ 'is-dragging': draggingNodeId !== null || graphRotating }"
            @pointerdown="startGraphRotate"
            @pointermove="handleCanvasPointerMove"
            @mousemove="graphExpanded = true"
            @pointerup="endCanvasPointer"
            @pointercancel="endCanvasPointer"
            @wheel.prevent="handleCanvasWheel"
            @auxclick.prevent
          >
            <defs>
              <radialGradient id="node-glass" cx="32%" cy="24%" r="72%">
                <stop offset="0%" stop-color="#fff4d6" stop-opacity="0.88" />
                <stop offset="36%" stop-color="#d7a84f" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#111412" stop-opacity="0.22" />
              </radialGradient>
              <linearGradient id="edge-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#6b5424" stop-opacity="0.2" />
                <stop offset="45%" stop-color="#d7a84f" stop-opacity="0.92" />
                <stop offset="100%" stop-color="#78fbb6" stop-opacity="0.45" />
              </linearGradient>
              <filter id="node-depth" x="-70%" y="-70%" width="240%" height="240%">
                <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.45" />
                <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#d7a84f" flood-opacity="0.22" />
              </filter>
              <filter id="edge-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#d7a84f" flood-opacity="0.52" />
              </filter>
              <marker id="edge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#d7a84f" />
              </marker>
            </defs>
            <g class="graph-zoom-layer" :transform="canvasTransform">
              <g v-for="edge in visibleEdges" :key="edge.id">
              <path
                class="board-edge edge-shadow"
                :class="{ related: edgeIsRelated(edge), muted: selectedNode && !edgeIsRelated(edge) }"
                :d="edgePath(edge)"
              />
              <path
                class="board-edge edge-flow"
                :class="{ related: edgeIsRelated(edge), muted: selectedNode && !edgeIsRelated(edge) }"
                :d="edgePath(edge)"
                :marker-end="edge.directed ? 'url(#edge-arrow)' : undefined"
              />
              </g>
              <g v-if="visibleEdges.length <= 14" class="edge-label-layer">
                <text
                  v-for="edge in visibleEdges"
                  :key="'label-' + edge.id"
                  class="board-edge-label"
                  :class="{ related: edgeIsRelated(edge), muted: selectedNode && !edgeIsRelated(edge) }"
                  :x="edgeLabelPoint(edge)?.x"
                  :y="edgeLabelPoint(edge)?.y"
                  text-anchor="middle"
                >{{ edgeLabelText(edge) }}</text>
              </g>

              <g
                v-for="node in canvasNodes"
              :key="node.id"
              class="board-node"
              :class="{ selected: selectedNode?.id === node.id, dragging: draggingNodeId === node.id }"
              :transform="`translate(${node.x}, ${node.y})`"
              :style="{ '--node-delay': `${node.id % 6 * 0.18}s`, '--node-depth': String(node.depth), '--node-scale': String(node.scale ?? node.depth) }"
              @pointerdown="startDrag($event, node)"
            >
              <g class="node-orb">
                <circle :r="nodeRadius(node) + 13" class="node-halo" />
                <circle :r="nodeRadius(node) + 5" class="node-shadow-disc" />
                <circle :r="nodeRadius(node)" :fill="node.nodeTypeColor || '#3e8f72'" class="node-core" />
                <circle :r="nodeRadius(node)" fill="url(#node-glass)" class="node-glass" />
                <ellipse :rx="nodeRadius(node) * 0.43" :ry="nodeRadius(node) * 0.18" :cy="nodeRadius(node) * -0.35" class="node-highlight" />
                <text y="5">{{ node.name.slice(0, 8) }}</text>
              </g>
              </g>
            </g>
          </svg>
        </div>
      </article>

      <aside ref="sidePanelRef" class="graph-side-panel" @wheel.prevent.stop="handleSidePanelWheel">
        <section class="side-section relation-box" :class="{ collapsed: relationCollapsed }">
          <button class="panel-collapse" type="button" @click="relationCollapsed = !relationCollapsed">
            <ChevronDown v-if="relationCollapsed" :size="15" />
            <ChevronUp v-else :size="15" />
          </button>
          <p class="eyebrow">节点关系</p>
          <h3>{{ selectedNode ? selectedNode.name : '选择节点查看关系' }}</h3>
          <div v-if="!selectedNode" class="chain-empty collapsible-content">
            <GitBranch :size="18" />
            <span>点击画布节点后，高亮与其相邻的关系连线。</span>
          </div>
          <div v-else-if="selectedNeighborEdges.length === 0" class="node-fallback-card collapsible-content">
            <GitBranch :size="18" />
            <div>
              <span>当前节点暂无相邻关系</span>
              <strong>{{ selectedNode.name }}</strong>
              <small>{{ displayNodeTypeName(selectedNode.nodeTypeName) }} · {{ selectedNodeRegion }}</small>
              <p>{{ selectedNodeSummary }}</p>
            </div>
          </div>
          <div v-else class="relation-list collapsible-content">
            <article v-for="edge in selectedNeighborEdges" :key="edge.id">
              <span>{{ displayRelationLabel(edge) }}</span>
              <strong>{{ neighborName(edge) }}</strong>
              <small>{{ relationDirection(edge) }}</small>
            </article>
          </div>
          <div v-if="selectedNode" class="relation-actions collapsible-content">
            <button
              v-if="filters.centerNodeId !== selectedNode.id"
              class="primary-action compact"
              type="button"
              @click="focusSelectedNode"
            >
              <GitBranch :size="15" />
              以此节点为中心展开
            </button>
            <button v-else class="secondary-action compact" type="button" @click="clearCenter">
              回到全图浏览
            </button>
          </div>
        </section>

        <section v-if="nodes.length" class="side-section subgraph-box">
          <p class="eyebrow">子图分析</p>
          <h3>当前展示的 {{ subgraphAnalysis.nodeCount }} 个节点</h3>
          <div class="subgraph-metrics">
            <span><strong>{{ subgraphAnalysis.edgeCount }}</strong> 条关系</span>
            <span><strong>{{ subgraphAnalysis.isolated }}</strong> 个孤立节点</span>
          </div>
          <div v-if="subgraphAnalysis.topRelations.length" class="subgraph-block collapsible-content">
            <small>关系类型分布</small>
            <ul>
              <li v-for="item in subgraphAnalysis.topRelations" :key="'rel-' + item.label">
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </div>
          <div v-if="subgraphAnalysis.topNodes.length" class="subgraph-block collapsible-content">
            <small>枢纽节点（按关系数）</small>
            <ul>
              <li v-for="item in subgraphAnalysis.topNodes" :key="'node-' + item.id">
                <span>{{ item.name }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </div>
          <div v-if="subgraphAnalysis.edgeCount === 0" class="subgraph-empty collapsible-content">
            当前子图没有关系线。选择中心节点展开后，这里会统计它的关系类型分布与枢纽节点。
          </div>
        </section>

        <section class="side-section semantic-box" :class="{ collapsed: semanticCollapsed }">
          <button class="panel-collapse" type="button" @click="semanticCollapsed = !semanticCollapsed">
            <ChevronDown v-if="semanticCollapsed" :size="15" />
            <ChevronUp v-else :size="15" />
          </button>
          <p class="eyebrow">AI 检索</p>
          <h3>AI 智能检索</h3>
          <label class="collapsible-content">
            <span>问句</span>
            <textarea v-model="semanticQuestion" rows="3" placeholder="例如：苏绣的传人的师父是谁" />
          </label>
          <button class="primary-action collapsible-content" type="button" :disabled="searching" @click="askSemantic">
            <Loader2 v-if="searching" :size="16" class="spin" />
            <MessageSquareText v-else :size="16" />
            检索链路
          </button>
          <div v-if="semanticError" class="inline-error collapsible-content">{{ semanticError }}</div>
          <div v-if="fallbackAiAnswer" class="ai-answer-card collapsible-content">
            <strong>{{ fallbackAiAnswer }}</strong>
          </div>
          <div v-if="fallbackAiResults.length" class="ai-result-list collapsible-content">
            <article v-for="result in fallbackAiResults" :key="result.id" class="ai-result-card">
              <span>{{ displayNodeTypeName(result.nodeTypeName) }}</span>
              <strong>{{ result.name }}</strong>
              <p v-if="result.relationSummary">{{ result.relationSummary }}</p>
              <p v-else-if="result.relations?.length">{{ displayRelationTexts(result.relations) }}</p>
            </article>
          </div>
          <div v-if="!semanticSearched" class="chain-empty collapsible-content">
            <GitBranch :size="18" />
            <span>输入问题后，我会直接返回找到的结果</span>
          </div>
          <article v-for="chain in chains" :key="chain.title + chain.nodes.map((node) => node.id).join('-')" class="chain-card collapsible-content">
            <strong>{{ chain.title }}</strong>
            <div class="chain-path">
              <template v-for="(node, index) in chain.nodes" :key="node.id">
                <span>{{ node.name }}</span>
                <em v-if="index < chain.edges.length">{{ displayRelationLabel(chain.edges[index]) }}</em>
              </template>
            </div>
          </article>
        </section>
      </aside>
    </section>
  </section>
</template>

<style scoped>
:global(.portal-function-section:has(.graph-board-page)) {
  position: relative;
  isolation: isolate;
  padding-top: clamp(42px, 5vw, 72px);
  background:
    radial-gradient(circle at 12% 6%, rgba(234, 88, 12, 0.14), transparent 28%),
    radial-gradient(circle at 84% 10%, rgba(20, 184, 166, 0.16), transparent 30%),
    radial-gradient(circle at 52% 92%, rgba(59, 130, 246, 0.12), transparent 34%),
    linear-gradient(180deg, #fff8ef 0%, #f7fbff 44%, #fff7eb 100%);
}

:global(.portal-function-section:has(.graph-board-page)::before) {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent);
  pointer-events: none;
}

.graph-board-page {
  --graph-ink: #172033;
  --graph-muted: #64748b;
  --graph-soft: #f8fafc;
  --graph-card: rgba(255, 255, 255, 0.82);
  --graph-line: rgba(15, 23, 42, 0.1);
  --graph-primary: #c2410c;
  --graph-primary-2: #f59e0b;
  --graph-teal: #0f766e;
  --graph-blue: #2563eb;
  --graph-shadow: 0 26px 70px rgba(88, 54, 24, 0.12);
  width: min(1240px, 100%);
  gap: 24px;
  color: var(--graph-ink);
}

.page-heading,
.graph-board-filter,
.graph-workbench,
.graph-side-panel .side-section,
.state-panel {
  border: 1px solid rgba(124, 45, 18, 0.09) !important;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 250, 242, 0.72)),
    rgba(255, 255, 255, 0.84) !important;
  box-shadow: var(--graph-shadow) !important;
  backdrop-filter: blur(22px) saturate(1.16) !important;
}

.page-heading {
  position: relative;
  min-height: 174px;
  padding: clamp(28px, 4vw, 48px) !important;
  border-radius: 36px !important;
  overflow: hidden;
}

.page-heading::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 8% 10%, rgba(194, 65, 12, 0.14), transparent 30%),
    radial-gradient(circle at 78% 22%, rgba(245, 158, 11, 0.18), transparent 34%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.76), rgba(255, 247, 237, 0.24));
  pointer-events: none;
}

.page-heading::after {
  content: "用户端知识探索";
  position: absolute;
  right: clamp(26px, 4vw, 52px);
  bottom: 24px;
  padding: 10px 14px;
  border: 1px solid rgba(15, 118, 110, 0.16);
  border-radius: 999px;
  background: rgba(240, 253, 250, 0.72);
  color: var(--graph-teal);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.page-heading > * {
  position: relative;
  z-index: 1;
}

.page-heading h2 {
  margin: 8px 0 10px !important;
  color: #111827 !important;
  font-family: var(--display-cn), "Microsoft YaHei", sans-serif;
  font-size: clamp(40px, 5.4vw, 72px) !important;
  line-height: 0.98 !important;
  letter-spacing: 0.06em !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9), 12px 16px 0 rgba(245, 158, 11, 0.1);
}

.page-heading span {
  display: block;
  max-width: 720px;
  color: rgba(23, 32, 51, 0.64) !important;
  font-size: 15px;
  line-height: 1.7;
}

.eyebrow {
  display: inline-flex !important;
  align-items: center;
  gap: 7px;
  min-height: 28px;
  margin: 0 !important;
  padding: 0 12px !important;
  border: 1px solid rgba(194, 65, 12, 0.18) !important;
  border-radius: 999px !important;
  background: rgba(255, 247, 237, 0.78) !important;
  color: var(--graph-primary) !important;
  font-size: 12px !important;
  font-weight: 1000 !important;
  letter-spacing: 0.12em !important;
}

.eyebrow::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--graph-primary), var(--graph-primary-2));
  box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.12);
}

.heading-actions .secondary-action,
.filter-actions .secondary-action,
.primary-action,
.secondary-action {
  min-height: 44px !important;
  border-radius: 999px !important;
  font-weight: 900;
}

.heading-actions .secondary-action,
.filter-actions .secondary-action {
  border-color: rgba(15, 23, 42, 0.1) !important;
  background: rgba(255, 255, 255, 0.72) !important;
  color: #1f2937 !important;
}

.primary-action {
  border: 0 !important;
  background: linear-gradient(135deg, #dc2626, #f97316 48%, #fbbf24) !important;
  color: #fff !important;
  box-shadow: 0 16px 34px rgba(234, 88, 12, 0.28) !important;
}

.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(88, 54, 24, 0.16) !important;
}

.graph-board-filter {
  grid-template-columns: minmax(260px, 1.15fr) repeat(2, minmax(180px, 0.72fr)) auto !important;
  gap: 16px !important;
  align-items: end !important;
  padding: 18px !important;
  border-radius: 28px !important;
}

.graph-board-filter label,
.semantic-box label {
  gap: 9px;
}

.graph-board-filter label > span,
.semantic-box label > span {
  color: rgba(23, 32, 51, 0.66) !important;
  font-size: 13px;
  font-weight: 900;
}

.graph-board-filter input,
.graph-board-filter select,
.semantic-box textarea {
  border: 1px solid rgba(15, 23, 42, 0.1) !important;
  border-radius: 18px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--graph-ink) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.graph-board-filter input:focus,
.graph-board-filter select:focus,
.semantic-box textarea:focus {
  border-color: rgba(234, 88, 12, 0.5) !important;
  box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.14) !important;
}

.graph-board-layout {
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.5fr) !important;
  gap: 22px !important;
}

.graph-workbench {
  position: relative;
  gap: 0 !important;
  padding: 14px !important;
  border-radius: 34px !important;
  overflow: hidden;
}

.graph-workbench::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 8% 0%, rgba(37, 99, 235, 0.09), transparent 24%),
    radial-gradient(circle at 94% 4%, rgba(15, 118, 110, 0.1), transparent 28%);
  pointer-events: none;
}

.graph-workbench > * {
  position: relative;
  z-index: 1;
}

.table-toolbar {
  margin: 0 0 12px !important;
  padding: 8px 8px 16px !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.table-toolbar span:first-child {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 13px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-weight: 1000;
}

.table-toolbar span:last-child {
  color: rgba(23, 32, 51, 0.55) !important;
  font-size: 13px;
  font-weight: 800;
}

.graph-stage {
  position: relative;
  min-height: 610px;
  border: 1px solid rgba(37, 99, 235, 0.12) !important;
  border-radius: 30px !important;
  background:
    radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0.96) 0 21%, rgba(255, 237, 213, 0.55) 22%, transparent 43%),
    radial-gradient(circle at 28% 18%, rgba(45, 212, 191, 0.18), transparent 28%),
    radial-gradient(circle at 72% 70%, rgba(251, 191, 36, 0.2), transparent 30%),
    linear-gradient(90deg, rgba(37, 99, 235, 0.07) 1px, transparent 1px),
    linear-gradient(0deg, rgba(15, 118, 110, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, #f8fdff 0%, #fff7ed 100%) !important;
  background-size: auto, auto, auto, 38px 38px, 38px 38px, auto !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.84), 0 24px 58px rgba(37, 99, 235, 0.1) !important;
}

.graph-stage::before {
  content: "";
  position: absolute;
  inset: 16px;
  border: 1px dashed rgba(15, 23, 42, 0.1);
  border-radius: 24px;
  pointer-events: none;
}

.graph-stage svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 610px;
}

.graph-depth-hint {
  top: 18px;
  right: 18px;
  z-index: 3;
  border-radius: 999px !important;
  background: rgba(17, 24, 39, 0.74) !important;
  color: #fff !important;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16) !important;
  backdrop-filter: blur(14px);
}

.board-edge.edge-shadow {
  stroke: rgba(15, 23, 42, 0.12);
  stroke-width: 4;
  fill: none;
}

.board-edge.edge-flow {
  stroke: url(#edge-gold);
  stroke-width: 2;
  fill: none;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.18));
  opacity: 0.72;
}

.board-edge.related.edge-flow {
  stroke-width: 3.2;
  opacity: 1;
}

.board-edge.muted {
  opacity: 0.18;
}

.board-node {
  cursor: grab;
}

.board-node.dragging {
  cursor: grabbing;
}

.node-core {
  stroke: rgba(255, 255, 255, 0.86);
  stroke-width: 2.5;
  filter: drop-shadow(0 18px 16px rgba(15, 23, 42, 0.2));
}

.node-halo {
  fill: rgba(251, 191, 36, 0.12);
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 1;
}

.node-shadow-disc {
  fill: rgba(15, 23, 42, 0.13);
  transform: translate(0, 7px);
}

.node-highlight {
  fill: rgba(255, 255, 255, 0.72);
}

.board-node text {
  fill: #fff;
  font-size: 12px;
  font-weight: 1000;
  letter-spacing: 0.03em;
  text-anchor: middle;
  pointer-events: none;
  text-shadow: 0 1px 4px rgba(15, 23, 42, 0.45);
}

.board-node:hover .node-core,
.board-node.selected .node-core {
  stroke: rgba(251, 191, 36, 0.98);
  stroke-width: 3;
}

.graph-side-panel {
  gap: 18px !important;
}

.graph-side-panel .side-section {
  position: relative;
  border-radius: 30px !important;
  overflow: hidden;
}

.graph-side-panel .side-section::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 10% 0%, rgba(245, 158, 11, 0.12), transparent 28%);
  pointer-events: none;
}

.graph-side-panel .side-section > * {
  position: relative;
  z-index: 1;
}

.relation-box,
.semantic-box {
  padding: 24px !important;
}

.side-section h3 {
  color: #111827 !important;
  font-family: var(--display-cn), "Microsoft YaHei", sans-serif;
  font-size: clamp(22px, 2vw, 30px) !important;
  line-height: 1.12;
  letter-spacing: 0.05em !important;
}

.relation-list,
.chain-card,
.chain-empty {
  margin-top: 16px;
}

.relation-list {
  display: grid;
  gap: 12px;
}

.relation-list article,
.chain-card,
.chain-empty {
  border: 1px solid rgba(15, 23, 42, 0.09) !important;
  border-radius: 22px !important;
  background: rgba(255, 255, 255, 0.72) !important;
  box-shadow: 0 14px 34px rgba(88, 54, 24, 0.08) !important;
}

.relation-list article {
  display: grid;
  gap: 6px;
  padding: 16px !important;
}

.relation-list article span {
  width: max-content;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #a16207;
  font-size: 12px;
  font-weight: 1000;
}

.relation-list article strong,
.chain-card strong {
  color: #111827 !important;
  font-size: 17px;
}

.relation-list article small,
.chain-empty {
  color: rgba(23, 32, 51, 0.6) !important;
}

.semantic-box textarea {
  min-height: 110px;
  resize: vertical;
}

.semantic-box .primary-action {
  width: 100%;
  margin-top: 14px;
}

.chain-empty {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 16px !important;
}

.ai-answer-card {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(15, 118, 110, 0.12);
  border-radius: 8px;
  background: rgba(240, 253, 250, 0.7);
  color: #0f766e;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
}

.ai-result-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.ai-result-card {
  display: grid;
  gap: 5px;
  padding: 12px;
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 8px;
  background: rgba(255, 251, 235, 0.78);
}

.ai-result-card span {
  color: #b45309;
  font-size: 11px;
  font-weight: 800;
}

.ai-result-card strong {
  color: #111827;
  font-size: 16px;
}

.ai-result-card p {
  margin: 0;
  color: rgba(31, 41, 55, 0.72);
  font-size: 12px;
}

.chain-card {
  display: grid;
  gap: 12px;
  padding: 16px !important;
}

.chain-path {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chain-path span {
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 900;
}

.chain-path em {
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: rgba(37, 99, 235, 0.82);
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
}

.inline-error {
  border-radius: 18px !important;
  color: #b91c1c !important;
}

@media (max-width: 1120px) {
  .graph-board-layout,
  .graph-board-filter {
    grid-template-columns: 1fr !important;
  }

  .page-heading {
    min-height: 0;
  }

  .page-heading::after {
    display: none;
  }

  .graph-stage,
  .graph-stage svg {
    min-height: 520px;
  }
}

@media (max-width: 720px) {
  .page-heading,
  .graph-workbench,
  .graph-side-panel .side-section {
    border-radius: 24px !important;
  }

  .page-heading h2 {
    font-size: clamp(34px, 11vw, 48px) !important;
  }

  .filter-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}


/* Fullscreen graph-board composition: canvas first, controls float above it. */
:global(.portal-function-section:has(.graph-board-page)) {
  min-height: 100vh;
  padding: 0 !important;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 16%, rgba(30, 156, 255, 0.14), transparent 30%),
    radial-gradient(circle at 84% 22%, rgba(244, 180, 63, 0.18), transparent 32%),
    linear-gradient(135deg, #eaf7ff 0%, #fff8eb 54%, #f7ead7 100%) !important;
}

.graph-board-page {
  position: relative;
  width: 100vw !important;
  max-width: none !important;
  min-height: 100vh;
  margin: 0 calc(50% - 50vw) !important;
  overflow: hidden;
}

.page-heading {
  display: none !important;
}

.graph-board-page > .inline-error {
  position: absolute;
  top: 18px;
  left: 50%;
  z-index: 50;
  transform: translateX(-50%);
  width: min(780px, calc(100vw - 48px));
}

.graph-board-filter {
  position: absolute;
  top: clamp(18px, 3vh, 34px);
  left: 50%;
  z-index: 40;
  transform: translateX(-50%);
  width: min(1060px, calc(100vw - 430px));
  margin: 0 !important;
  grid-template-columns: minmax(240px, 1fr) minmax(160px, 0.55fr) minmax(160px, 0.55fr) auto !important;
  border-radius: 999px !important;
  padding: 14px 16px !important;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 235, 0.68)),
    rgba(255, 255, 255, 0.78) !important;
  box-shadow: 0 24px 70px rgba(40, 28, 16, 0.16) !important;
  backdrop-filter: blur(24px) saturate(1.18) !important;
}

.graph-board-filter input,
.graph-board-filter select {
  min-height: 42px !important;
  border-radius: 999px !important;
}

.graph-board-layout {
  position: relative;
  display: block !important;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  margin: 0 !important;
}

.graph-workbench {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.graph-workbench::before {
  inset: 0;
  background:
    linear-gradient(90deg, rgba(30, 156, 255, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(7, 7, 7, 0.035) 1px, transparent 1px),
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.78), transparent 26%);
  background-size: 42px 42px, 42px 42px, auto;
}

.table-toolbar {
  position: absolute;
  top: clamp(102px, 13vh, 132px);
  left: clamp(22px, 3vw, 44px);
  z-index: 26;
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 !important;
  padding: 0 !important;
  pointer-events: none;
}

.table-toolbar span {
  min-height: 34px;
  padding: 0 14px !important;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68) !important;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(16px);
}

.graph-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100vh;
  min-height: 100vh !important;
  border: 0 !important;
  border-radius: 0 !important;
  background:
    radial-gradient(circle at 52% 48%, rgba(255, 255, 255, 0.96) 0 15%, rgba(255, 237, 213, 0.48) 16%, transparent 38%),
    radial-gradient(circle at 28% 18%, rgba(45, 212, 191, 0.16), transparent 28%),
    radial-gradient(circle at 72% 70%, rgba(251, 191, 36, 0.18), transparent 30%),
    linear-gradient(90deg, rgba(37, 99, 235, 0.07) 1px, transparent 1px),
    linear-gradient(0deg, rgba(15, 118, 110, 0.052) 1px, transparent 1px),
    linear-gradient(180deg, rgba(248, 253, 255, 0.82) 0%, rgba(255, 247, 237, 0.82) 100%) !important;
  background-size: auto, auto, auto, 42px 42px, 42px 42px, auto !important;
  box-shadow: none !important;
}

.graph-stage::before {
  inset: clamp(18px, 2.4vw, 42px);
  border-color: rgba(15, 23, 42, 0.08);
  border-radius: 32px;
}

.graph-stage svg {
  width: 100%;
  height: 100%;
  min-height: 100vh !important;
}

.graph-depth-hint {
  top: clamp(102px, 13vh, 132px) !important;
  right: calc(min(330px, 24vw) + clamp(42px, 5vw, 76px));
  z-index: 28;
}

.graph-side-panel {
  position: absolute;
  top: clamp(96px, 12vh, 128px);
  right: clamp(18px, 3vw, 42px);
  bottom: clamp(18px, 3vh, 34px);
  z-index: 35;
  width: min(330px, 24vw);
  min-width: 292px;
  overflow-y: auto;
  padding-right: 2px;
  align-content: start;
  pointer-events: auto;
}

.graph-side-panel .side-section {
  border-radius: 28px !important;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(255, 248, 235, 0.68)),
    rgba(255, 255, 255, 0.72) !important;
  box-shadow: 0 24px 70px rgba(40, 28, 16, 0.18) !important;
  backdrop-filter: blur(24px) saturate(1.16) !important;
}

@media (max-width: 1120px) {
  .graph-board-page {
    min-height: auto;
    overflow: visible;
  }

  .graph-board-layout {
    height: auto;
    min-height: 100vh;
    padding: 18px;
  }

  .graph-board-filter,
  .graph-side-panel,
  .graph-workbench,
  .graph-stage {
    position: relative;
    inset: auto;
    top: auto;
    right: auto;
    left: auto;
    bottom: auto;
    transform: none;
    width: 100% !important;
    min-width: 0;
  }

  .graph-board-filter {
    margin: 18px !important;
    width: calc(100% - 36px) !important;
    border-radius: 28px !important;
  }

  .graph-workbench {
    height: 68vh;
    min-height: 560px;
    border-radius: 28px !important;
    overflow: hidden;
  }

  .graph-stage,
  .graph-stage svg {
    height: 100%;
    min-height: 560px !important;
  }

  .graph-side-panel {
    margin-top: 18px;
    max-height: none;
    overflow: visible;
  }

  .table-toolbar,
  .graph-depth-hint {
    top: 18px !important;
    right: 18px;
  }
}



/* Requested refinements: lower floating search, independent right cards, entry state, and smooth canvas. */
.graph-board-filter {
  top: clamp(88px, 10vh, 116px) !important;
  width: min(1040px, calc(100vw - 500px)) !important;
}

.graph-board-page:not(.canvas-active) .graph-board-filter,
.graph-board-page:not(.canvas-active) .graph-side-panel,
.graph-board-page:not(.canvas-active) .table-toolbar,
.graph-board-page:not(.canvas-active) .graph-depth-hint {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
}

.graph-canvas-entry {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 45;
  display: grid;
  place-items: center;
  gap: 10px;
  width: min(360px, calc(100vw - 44px));
  min-height: 168px;
  border: 1px solid rgba(194, 65, 12, 0.14);
  border-radius: 32px;
  padding: 26px;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at 50% 0%, rgba(244, 180, 63, 0.16), transparent 48%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 235, 0.7));
  color: var(--graph-ink);
  box-shadow: 0 28px 86px rgba(40, 28, 16, 0.18);
  backdrop-filter: blur(24px) saturate(1.16);
  cursor: pointer;
}

.graph-canvas-entry strong {
  font-family: var(--display-cn), "Microsoft YaHei", sans-serif;
  font-size: 30px;
  letter-spacing: 0.04em;
}

.graph-canvas-entry span {
  max-width: 260px;
  color: rgba(23, 32, 51, 0.62);
  font-size: 13px;
  line-height: 1.6;
}

.graph-canvas-entry svg {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dc2626, #f59e0b);
  color: #fff;
  box-shadow: 0 14px 32px rgba(220, 38, 38, 0.2);
}

.graph-stage,
.graph-stage svg,
.graph-zoom-layer,
.board-node,
.board-edge {
  transform-box: fill-box;
  backface-visibility: hidden;
  will-change: transform;
}

.graph-stage svg {
  shape-rendering: geometricPrecision;
}

.graph-zoom-controls {
  position: absolute;
  left: clamp(22px, 3vw, 44px);
  bottom: clamp(20px, 3vh, 34px);
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(18px) saturate(1.12);
}

.graph-zoom-controls button {
  display: inline-grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 248, 235, 0.9);
  color: #7c2d12;
  cursor: pointer;
}

.graph-zoom-controls strong {
  min-width: 48px;
  color: #172033;
  font-size: 12px;
  text-align: center;
}

.graph-side-panel {
  display: flex !important;
  flex-direction: column;
  gap: 16px !important;
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.graph-side-panel .side-section {
  border: 1px solid rgba(255, 255, 255, 0.58) !important;
  border-radius: 30px !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(244, 180, 63, 0.14), transparent 32%),
    rgba(255, 255, 255, 0.74) !important;
  box-shadow: 0 22px 64px rgba(43, 31, 21, 0.16) !important;
  backdrop-filter: blur(22px) saturate(1.12) !important;
}

.node-fallback-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding: 15px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.68);
}

.node-fallback-card svg {
  margin-top: 2px;
  color: var(--graph-teal);
}

.node-fallback-card span,
.node-fallback-card small,
.node-fallback-card p {
  display: block;
}

.node-fallback-card span {
  color: #92400e;
  font-size: 12px;
  font-weight: 1000;
}

.node-fallback-card strong {
  display: block;
  margin-top: 4px;
  color: #111827;
  font-size: 17px;
}

.node-fallback-card small {
  margin-top: 4px;
  color: rgba(23, 32, 51, 0.56);
  font-size: 12px;
}

.node-fallback-card p {
  margin: 10px 0 0;
  color: rgba(23, 32, 51, 0.66);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1120px) {
  .graph-board-filter {
    top: auto !important;
    width: calc(100% - 36px) !important;
  }

  .graph-board-page:not(.canvas-active) .graph-board-filter,
  .graph-board-page:not(.canvas-active) .graph-side-panel,
  .graph-board-page:not(.canvas-active) .table-toolbar,
  .graph-board-page:not(.canvas-active) .graph-depth-hint {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }
}



/* Layout polish: clearer zones, no occlusion, collapsible floating controls. */
.graph-board-filter {
  top: clamp(116px, 13vh, 148px) !important;
  width: min(880px, calc(100vw - 520px)) !important;
  min-height: 72px;
  grid-template-columns: minmax(220px, 1fr) minmax(140px, 0.52fr) minmax(140px, 0.52fr) auto auto !important;
  transition: width .24s ease, min-height .24s ease, opacity .24s ease, transform .24s ease;
}

.graph-board-filter.collapsed {
  width: 168px !important;
  min-height: 48px;
  grid-template-columns: 1fr !important;
  padding: 8px !important;
  border-radius: 999px !important;
}

.graph-board-filter.collapsed label,
.graph-board-filter.collapsed .filter-actions {
  display: none !important;
}

.graph-filter-toggle {
  order: 9;
}

.panel-collapse,
.graph-filter-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  border: 1px solid rgba(15, 23, 42, .08);
  border-radius: 999px;
  padding: 0 10px;
  background: rgba(255, 255, 255, .78);
  color: #7c2d12;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.graph-side-panel {
  top: clamp(116px, 13vh, 148px) !important;
  right: clamp(24px, 3.6vw, 56px) !important;
  bottom: clamp(74px, 8vh, 104px) !important;
  width: min(316px, 22vw) !important;
  min-width: 286px;
  gap: 14px !important;
  overflow: visible !important;
}

.graph-side-panel .side-section {
  position: relative;
  padding: 20px !important;
  transition: min-height .22s ease, padding .22s ease, transform .22s ease, opacity .22s ease;
}

.graph-side-panel .side-section .panel-collapse {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 4;
  width: 32px;
  min-width: 32px;
  height: 32px;
  padding: 0;
}

.graph-side-panel .side-section.collapsed {
  min-height: 68px;
  padding: 16px 52px 16px 18px !important;
}

.graph-side-panel .side-section.collapsed h3 {
  margin-bottom: 0 !important;
  font-size: 20px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.graph-side-panel .side-section.collapsed .collapsible-content,
.graph-side-panel .side-section.collapsed .relation-list,
.graph-side-panel .side-section.collapsed .node-fallback-card,
.graph-side-panel .side-section.collapsed .chain-card,
.graph-side-panel .side-section.collapsed .chain-empty,
.graph-side-panel .side-section.collapsed label,
.graph-side-panel .side-section.collapsed .primary-action,
.graph-side-panel .side-section.collapsed .inline-error {
  display: none !important;
}

.table-toolbar {
  top: clamp(116px, 13vh, 148px) !important;
  left: clamp(28px, 3.6vw, 58px) !important;
}

.graph-depth-hint {
  top: clamp(166px, 19vh, 208px) !important;
  right: calc(min(316px, 22vw) + clamp(52px, 6vw, 88px)) !important;
}

.graph-zoom-controls {
  left: clamp(28px, 3.6vw, 58px) !important;
  bottom: clamp(28px, 4vh, 46px) !important;
}

.graph-canvas-entry {
  top: 54%;
}

.graph-stage svg {
  transform: translateZ(0);
}

@media (max-width: 1280px) {
  .graph-board-filter {
    width: min(760px, calc(100vw - 430px)) !important;
    grid-template-columns: minmax(190px, 1fr) minmax(126px, .5fr) minmax(126px, .5fr) auto auto !important;
  }

  .graph-side-panel {
    width: 286px !important;
    min-width: 286px;
  }
}

@media (max-width: 1120px) {
  .graph-board-filter,
  .graph-side-panel {
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
  }

  .graph-board-filter.collapsed {
    width: calc(100% - 36px) !important;
  }

  .graph-board-filter.collapsed label,
  .graph-board-filter.collapsed .filter-actions {
    display: grid !important;
  }

  .graph-side-panel .side-section.collapsed .collapsible-content,
  .graph-side-panel .side-section.collapsed .relation-list,
  .graph-side-panel .side-section.collapsed .node-fallback-card,
  .graph-side-panel .side-section.collapsed .chain-card,
  .graph-side-panel .side-section.collapsed .chain-empty,
  .graph-side-panel .side-section.collapsed label,
  .graph-side-panel .side-section.collapsed .primary-action,
  .graph-side-panel .side-section.collapsed .inline-error {
    display: revert !important;
  }
}



/* Search visibility and layout: keep canvas controls bounded and independent from the side panel. */
.graph-board-page:not(.canvas-active) .graph-board-filter {
  display: none !important;
}

.graph-board-page.canvas-active .graph-board-filter {
  left: clamp(28px, 3.6vw, 58px) !important;
  top: clamp(112px, 13vh, 142px) !important;
  right: auto !important;
  transform: none !important;
  width: min(760px, calc(100vw - 430px)) !important;
  min-width: 0;
  min-height: 64px;
  grid-template-columns: minmax(0, 1.35fr) minmax(118px, .7fr) minmax(118px, .7fr) auto auto !important;
  align-items: end;
  gap: 10px !important;
  padding: 10px 12px !important;
}

.graph-board-page.canvas-active .graph-board-filter label,
.graph-board-page.canvas-active .graph-board-filter .filter-actions,
.graph-board-page.canvas-active .graph-board-filter .graph-filter-toggle {
  min-width: 0;
}

.graph-board-page.canvas-active .graph-board-filter .filter-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.graph-board-page.canvas-active .graph-board-filter .graph-filter-toggle {
  grid-column: 1 / -1;
  justify-self: start;
  margin: 0;
}

.graph-board-page.canvas-active .graph-board-filter label > span {
  font-size: 12px !important;
}

.graph-board-page.canvas-active .graph-board-filter input,
.graph-board-page.canvas-active .graph-board-filter select {
  min-height: 38px !important;
}

.graph-board-page.canvas-active .graph-board-filter .primary-action,
.graph-board-page.canvas-active .graph-board-filter .secondary-action,
.graph-board-page.canvas-active .graph-board-filter .graph-filter-toggle {
  min-height: 38px !important;
}

.graph-board-page.canvas-active .graph-board-filter.collapsed {
  width: 150px !important;
  min-height: 44px;
  grid-template-columns: 1fr !important;
}

.graph-board-page.canvas-active .graph-side-panel {
  top: clamp(164px, 20vh, 198px) !important;
  bottom: clamp(52px, 6vh, 76px) !important;
}

.graph-board-page.canvas-active .table-toolbar {
  top: clamp(188px, 23vh, 224px) !important;
}

@media (max-width: 1280px) {
  .graph-board-page.canvas-active .graph-board-filter {
    width: min(760px, calc(100vw - 430px)) !important;
    grid-template-columns: minmax(0, 1fr) minmax(118px, .7fr) minmax(118px, .7fr) auto !important;
  }
}

@media (max-width: 1120px) {
  .graph-board-page:not(.canvas-active) .graph-board-filter {
    display: grid !important;
  }

  .graph-board-page.canvas-active .graph-board-filter {
    left: auto !important;
    top: auto !important;
    width: calc(100% - 36px) !important;
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
}

/* Floating panel refinements: hug content, contain text, tidy collapse states. */
.graph-side-panel {
  bottom: auto !important;
  max-height: calc(100vh - 176px) !important;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  scrollbar-width: auto;
  scrollbar-color: rgba(124, 45, 18, 0.58) rgba(255, 248, 235, 0.72);
}

.graph-side-panel::-webkit-scrollbar {
  width: 10px;
}

.graph-side-panel::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgba(255, 248, 235, 0.72);
}

.graph-side-panel::-webkit-scrollbar-thumb {
  border: 2px solid rgba(255, 248, 235, 0.72);
  border-radius: 999px;
  background: linear-gradient(180deg, #c2410c, #f59e0b);
}

.graph-side-panel .side-section {
  overflow: hidden;
  min-width: 0;
}

.graph-side-panel > .side-section {
  flex: 0 0 auto;
}

.graph-side-panel .side-section .eyebrow {
  display: inline-block;
  max-width: calc(100% - 44px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.graph-side-panel .side-section h3 {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.graph-side-panel .side-section.collapsed {
  min-height: 0;
  padding: 14px 52px 14px 18px !important;
}

.graph-side-panel .side-section.collapsed .eyebrow {
  margin-bottom: 6px;
}

.graph-side-panel .side-section.collapsed h3 {
  font-size: 17px !important;
  line-height: 1.35;
  margin-bottom: 0 !important;
}

.graph-side-panel .side-section .relation-list article,
.graph-side-panel .side-section .ai-result-card {
  min-width: 0;
}

.graph-side-panel .side-section .relation-list article strong,
.graph-side-panel .side-section .ai-result-card strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.graph-board-filter.collapsed .graph-filter-toggle {
  width: 100%;
  margin: 0;
  min-height: 34px;
}

.graph-board-page.canvas-active .graph-side-panel {
  top: clamp(164px, 20vh, 198px) !important;
  right: clamp(18px, 3vw, 42px) !important;
  bottom: clamp(24px, 4vh, 48px) !important;
  display: flex !important;
  flex-direction: column;
  min-height: 0;
  max-height: none !important;
  overflow-x: hidden !important;
  overflow-y: scroll !important;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  touch-action: pan-y;
}

.graph-board-page.canvas-active .graph-side-panel .side-section,
.graph-board-page.canvas-active .graph-side-panel .relation-list article,
.graph-board-page.canvas-active .graph-side-panel .ai-result-card,
.graph-board-page.canvas-active .graph-side-panel .chain-card {
  min-width: 0;
  overflow-wrap: anywhere;
}

.graph-board-page.canvas-active .graph-side-panel .side-section h3,
.graph-board-page.canvas-active .graph-side-panel .side-section strong,
.graph-board-page.canvas-active .graph-side-panel .side-section p,
.graph-board-page.canvas-active .graph-side-panel .side-section span,
.graph-board-page.canvas-active .graph-side-panel .side-section small {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
}

.graph-board-page.canvas-active .graph-side-panel .side-section h3 {
  overflow: visible;
  text-overflow: clip;
}

.graph-board-page.canvas-active .graph-side-panel .side-section.collapsed h3 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.graph-board-page.canvas-active .graph-side-panel .relation-list article span {
  width: auto;
  max-width: 100%;
}

@media (max-width: 1120px) {
  .graph-board-page.canvas-active .graph-side-panel {
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    width: calc(100% - 36px) !important;
    min-width: 0;
    max-width: none !important;
    max-height: calc(100vh - 176px) !important;
    overflow-x: hidden !important;
    overflow-y: scroll !important;
  }
}

/* 中心节点展开 + 关系标签 + 子图分析 */
.graph-board-page.canvas-active .graph-board-filter {
  width: min(1120px, calc(100vw - 420px)) !important;
  grid-template-columns:
    minmax(0, 1.15fr)
    minmax(96px, .55fr)
    minmax(150px, .95fr)
    minmax(96px, .5fr)
    minmax(88px, .46fr)
    minmax(104px, .58fr)
    auto !important;
}

.graph-center-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 10px 0 14px;
  padding: 12px 14px;
  border: 1px solid rgba(194, 65, 12, .18);
  border-radius: 16px;
  background: rgba(255, 247, 237, .92);
  color: #7c2d12;
  font-size: 13px;
  font-weight: 800;
}

.graph-center-hint span {
  flex: 1 1 260px;
  line-height: 1.6;
}

.graph-center-hint button {
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #dc2626, #f59e0b);
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.board-edge-label {
  fill: #7c2d12;
  font-size: 10px;
  font-weight: 800;
  paint-order: stroke;
  stroke: rgba(255, 253, 247, .92);
  stroke-width: 3px;
  pointer-events: none;
  user-select: none;
}

.board-edge-label.related {
  fill: #b45309;
  font-size: 11px;
}

.board-edge-label.muted {
  opacity: .35;
}

.relation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.subgraph-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 4px 0 10px;
  color: rgba(15, 23, 42, .68);
  font-size: 12px;
  font-weight: 800;
}

.subgraph-metrics strong {
  color: #b45309;
  font-size: 16px;
}

.subgraph-block {
  margin-top: 10px;
}

.subgraph-block small {
  display: block;
  margin-bottom: 6px;
  color: rgba(15, 23, 42, .52);
  font-size: 11px;
  font-weight: 900;
}

.subgraph-block ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.subgraph-block li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(15, 23, 42, .08);
  border-radius: 10px;
  background: rgba(255, 255, 255, .66);
  font-size: 12px;
  font-weight: 800;
}

.subgraph-block li strong {
  color: #b45309;
}

.subgraph-empty {
  margin-top: 8px;
  color: rgba(15, 23, 42, .58);
  font-size: 12px;
  line-height: 1.6;
}

</style>
