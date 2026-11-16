<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  GitBranch,
  Loader2,
  MessageSquareText,
  RefreshCcw,
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
const draggingNodeId = ref<number | null>(null);
const dragOffset = ref({ x: 0, y: 0, worldX: 0, worldY: 0, worldZ: 0, scale: 1 });
const graphExpanded = ref(false);
const graphRotating = ref(false);
const graphRotation = ref({ yaw: -0.28, pitch: 18 });
const rotationStart = ref({ clientX: 0, clientY: 0, yaw: -0.28, pitch: 18 });
const chains = ref<SemanticChain[]>([]);
const aiAnswer = ref('');
const aiResults = ref<GraphAiSearchResult[]>([]);
const semanticSearched = ref(false);
const loading = ref(false);
const searching = ref(false);
const error = ref('');
const semanticError = ref('');

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

const centerOptions = ref<GraphNodeItem[]>([]);
const centerLoading = ref(false);
const isCenterMode = computed(() => filters.centerNodeId !== '');

const semanticQuestion = ref('苏绣的传人的师父是谁');

const semanticTextTranslations: Record<string, string> = {
  'Project inheritor master chain': '项目师承链',
  'Project inheritor chain': '项目传承链',
};

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
// 子图分析：关系类型分布 + 枢纽节点 + 孤立节点数（纯前端，不额外请求）。
const subgraphAnalysis = computed(() => {
  const degree = new Map<number, number>();
  const relationCount = new Map<string, number>();
  const nameById = new Map(nodes.value.map((node) => [node.id, node.name]));
  for (const edge of visibleEdges.value) {
    degree.set(edge.sourceNodeId, (degree.get(edge.sourceNodeId) ?? 0) + 1);
    degree.set(edge.targetNodeId, (degree.get(edge.targetNodeId) ?? 0) + 1);
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
  return {
    nodeCount: nodes.value.length,
    edgeCount: visibleEdges.value.length,
    isolated: nodes.value.filter((node) => !degree.has(node.id)).length,
    topRelations,
    topNodes,
  };
});
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
      nodeTypeName: node.nodeTypeCode === 'inheritor' ? '传承人' : '相关节点',
      relations: chain.edges
        .map((edge) => edge.relationLabel || edge.edgeTypeCode)
        .filter(Boolean),
    });
  });
  return [...byId.values()];
});
const fallbackAiAnswer = computed(() => {
  if (aiAnswer.value) return aiAnswer.value;
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

async function loadCenterOptions() {
  centerLoading.value = true;
  try {
    const response = await fetchGraphNodes({
      keyword: filters.keyword,
      nodeTypeId: filters.nodeTypeId === '' ? undefined : Number(filters.nodeTypeId),
      page: 1,
      size: 50,
    });
    const options = [...response.items];
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
    // 候选列表只是辅助选择
  } finally {
    centerLoading.value = false;
  }
}

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

function firstConnectedNode(nextNodes: GraphVisualizationNode[], nextEdges: GraphVisualizationEdge[]) {
  const connectedIds = new Set<number>();
  nextEdges.forEach((edge) => {
    connectedIds.add(edge.sourceNodeId);
    connectedIds.add(edge.targetNodeId);
  });
  return nextNodes.find((node) => connectedIds.has(node.id)) ?? null;
}

function localizedSemanticChainTitle(title: string) {
  return semanticTextTranslations[title] ?? title;
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

/** 中心模式：中心 0 层、直接关系 1 层、再外 1 层分环排布（不复用全图模式的旧坐标）。 */
function syncCenterPositions(nextNodes: GraphVisualizationNode[], nextEdges: GraphVisualizationEdge[]) {
  const nextPositions: Record<number, { x: number; y: number; depth: number; scale: number }> = {};
  const nextExpandedPositions: Record<number, WorldPoint> = {};
  if (!nextNodes.length) {
    nodePositions.value = nextPositions;
    expandedNodePositions.value = nextExpandedPositions;
    return;
  }

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

function edgeIsRelated(edge: GraphVisualizationEdge) {
  const nodeId = selectedNode.value?.id;
  return Boolean(nodeId && (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId));
}

function edgeLabelText(edge: GraphVisualizationEdge) {
  return edge.relationLabel || edge.edgeTypeName || edge.edgeTypeCode || '';
}

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

function neighborName(edge: GraphVisualizationEdge) {
  if (edge.sourceNodeId === selectedNode.value?.id) return edge.targetNodeName;
  return edge.sourceNodeName;
}

function relationDirection(edge: GraphVisualizationEdge) {
  if (edge.sourceNodeId === selectedNode.value?.id) return `${edge.sourceNodeName} -> ${edge.targetNodeName}`;
  return `${edge.sourceNodeName} -> ${edge.targetNodeName}`;
}

/** 首屏默认以关系最多的项目为中心展开，打开画布就是有连线的图。 */
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
});
</script>

<template>
  <section class="graph-board-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">图谱看板</p>
        <h2>知识图谱看板</h2>
        <span>拖拽节点调整关系布局，筛选图谱范围，并用问句追踪传承链路。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>

    <section class="filter-bar graph-board-filter">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="节点名称 / 编码 / 简介" @keyup.enter="load" />
      </label>
      <label>
        <span>节点类型</span>
        <select v-model="filters.nodeTypeId">
          <option value="">全部节点</option>
          <option v-for="type in nodeTypes" :key="type.id" :value="type.id">{{ type.typeName }}</option>
        </select>
      </label>
      <label>
        <span>中心节点</span>
        <select v-model="filters.centerNodeId" :disabled="centerLoading" @change="load">
          <option value="">全图浏览（按更新时间）</option>
          <option v-for="option in centerOptions" :key="option.id" :value="option.id">
            {{ option.name }}<template v-if="option.nodeTypeName"> · {{ option.nodeTypeName }}</template>
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
          <option v-for="type in edgeTypes" :key="type.id" :value="type.id">{{ type.typeName }}</option>
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
          <span>这 {{ nodes.length }} 个节点之间没有直接关系线。相邻节点通常不在同一页，请选一个中心节点展开。</span>
          <button type="button" @click="focusNode(nodes[0].id)">以「{{ nodes[0].name }}」为中心展开</button>
        </div>

        <div v-if="loading" class="state-panel">
          <Loader2 :size="24" class="spin" />
          <span>正在加载图谱关系</span>
        </div>

        <div v-else-if="nodes.length === 0" class="state-panel empty">
          <strong>暂无匹配节点</strong>
          <span>调整关键词或类型筛选后重新检索。</span>
        </div>

        <div
          v-else
          class="graph-stage"
          :class="{ expanded: graphExpanded, rotating: graphRotating }"
          @mouseenter="graphExpanded = true"
          @mouseover="graphExpanded = true"
          @mouseleave="collapseGraph"
        >
          <div class="graph-depth-hint">
            <span>{{ graphExpanded ? '按住鼠标中键旋转，左键拖动节点' : '悬停展开 3D 关系图谱' }}</span>
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
            <g v-if="visibleEdges.length <= 14">
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
          </svg>
        </div>
      </article>

      <aside class="graph-side-panel">
        <section class="side-section relation-box">
          <p class="eyebrow">节点关系</p>
          <h3>{{ selectedNode ? selectedNode.name : '选择节点查看关系' }}</h3>
          <div v-if="!selectedNode" class="chain-empty">
            <GitBranch :size="18" />
            <span>点击画布节点后，高亮与其相邻的关系连线。</span>
          </div>
          <div v-else-if="selectedNeighborEdges.length === 0" class="chain-empty">
            <GitBranch :size="18" />
            <span>当前节点暂无相邻关系。</span>
          </div>
          <div v-else class="relation-list">
            <article v-for="edge in selectedNeighborEdges" :key="edge.id">
              <span>{{ edge.relationLabel || edge.edgeTypeName }}</span>
              <strong>{{ neighborName(edge) }}</strong>
              <small>{{ relationDirection(edge) }}</small>
            </article>
          </div>
          <div v-if="selectedNode" class="relation-actions">
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
          <div v-if="subgraphAnalysis.topRelations.length" class="subgraph-block">
            <small>关系类型分布</small>
            <ul>
              <li v-for="item in subgraphAnalysis.topRelations" :key="'rel-' + item.label">
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </div>
          <div v-if="subgraphAnalysis.topNodes.length" class="subgraph-block">
            <small>枢纽节点（按关系数）</small>
            <ul>
              <li v-for="item in subgraphAnalysis.topNodes" :key="'node-' + item.id">
                <span>{{ item.name }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </div>
          <div v-if="subgraphAnalysis.edgeCount === 0" class="subgraph-empty">
            当前子图没有关系线。选择中心节点展开后，这里会统计它的关系类型分布与枢纽节点。
          </div>
        </section>

        <section class="side-section semantic-box">
          <p class="eyebrow">AI 检索</p>
          <h3>AI 智能检索</h3>
          <label>
            <span>问句</span>
            <textarea v-model="semanticQuestion" rows="3" placeholder="例如：苏绣的传人的师父是谁" />
          </label>
          <button class="primary-action" type="button" :disabled="searching" @click="askSemantic">
            <Loader2 v-if="searching" :size="16" class="spin" />
            <MessageSquareText v-else :size="16" />
            检索链路
          </button>
          <div v-if="semanticError" class="inline-error">{{ semanticError }}</div>
          <div v-if="fallbackAiAnswer" class="ai-answer-card">
            <strong>{{ fallbackAiAnswer }}</strong>
          </div>
          <div v-if="fallbackAiResults.length" class="ai-result-list">
            <article v-for="result in fallbackAiResults" :key="result.id" class="ai-result-card">
              <span>{{ result.nodeTypeName || '相关节点' }}</span>
              <strong>{{ result.name }}</strong>
              <p v-if="result.relationSummary">{{ result.relationSummary }}</p>
              <p v-else-if="result.relations?.length">{{ result.relations.join('；') }}</p>
            </article>
          </div>
          <div v-if="!semanticSearched" class="chain-empty">
            <GitBranch :size="18" />
            <span>输入问题后，我会直接返回找到的结果</span>
          </div>
          <article v-for="chain in chains" :key="chain.title + chain.nodes.map((node) => node.id).join('-')" class="chain-card">
            <strong>{{ localizedSemanticChainTitle(chain.title) }}</strong>
            <div class="chain-path">
              <template v-for="(node, index) in chain.nodes" :key="node.id">
                <span>{{ node.name }}</span>
                <em v-if="index < chain.edges.length">{{ chain.edges[index]?.relationLabel || chain.edges[index]?.edgeTypeCode }}</em>
              </template>
            </div>
          </article>
        </section>
      </aside>
    </section>
  </section>
</template>
