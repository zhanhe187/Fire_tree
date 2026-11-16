import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const portalBoard = read('./features/graph/views/portal/GraphBoardPage.vue');
const adminBoard = read('./features/graph/views/admin/GraphBoardPage.vue');

for (const [name, source] of [['门户', portalBoard], ['后台', adminBoard]]) {
  test(`${name}图谱看板支持选择中心节点并限制展示数量`, () => {
    assert.match(source, /fetchGraphRelations/);
    assert.match(source, /v-model="filters\.centerNodeId"/);
    assert.match(source, /v-model\.number="filters\.depth"/);
    assert.match(source, /v-model\.number="filters\.size"/);
    assert.match(source, /<option :value="20">/);
    assert.match(source, /<option :value="30">/);
    assert.match(source, /<option :value="50">/);
    assert.match(source, /filters\.centerNodeId = ''/);
  });

  test(`${name}图谱看板为关系边渲染名称与方向`, () => {
    assert.match(source, /function edgeLabelText\(edge: GraphVisualizationEdge\)/);
    assert.match(source, /function edgeLabelPoint\(edge: GraphVisualizationEdge\)/);
    assert.match(source, /class="board-edge-label"/);
    assert.match(source, /marker-end="edge\.directed \? 'url\(#edge-arrow\)' : undefined"/);
    assert.match(source, /edge\.sourceNodeId !== edge\.targetNodeId/);
  });

  test(`${name}图谱看板提供子图分析`, () => {
    assert.match(source, /const subgraphAnalysis = computed/);
    assert.match(source, /关系类型分布/);
    assert.match(source, /枢纽节点/);
    assert.match(source, /孤立节点/);
  });
}

test('全图浏览且没有关系线时给出改为中心展开的引导', () => {
  for (const source of [portalBoard, adminBoard]) {
    assert.match(source, /class="graph-center-hint"/);
    assert.match(source, /没有直接关系线/);
    assert.match(source, /以此节点为中心展开/);
    assert.match(source, /回到全图浏览/);
  }
});

test('中心模式取邻居关系，全图模式仍走可视化分页接口', () => {
  for (const source of [portalBoard, adminBoard]) {
    assert.match(source, /if \(isCenterMode\.value\)/);
    assert.match(source, /fetchGraphVisualization\(filters\)/);
    assert.match(source, /direction: 'both'/);
    assert.match(source, /relationTypes: selectedEdgeType \? \[selectedEdgeType\.typeCode\] : undefined/);
  }
});

test('打开看板默认以关系最多的项目为中心，首屏就有连线', () => {
  for (const source of [portalBoard, adminBoard]) {
    assert.match(source, /fetchGraphHubs/);
    assert.match(source, /async function applyDefaultCenter\(\)/);
    assert.match(source, /item\.nodeTypeCode === 'heritage_project'/);
    assert.match(source, /filters\.centerNodeId = hub\.id/);
    assert.match(source, /onMounted\(async \(\) => \{\s*await applyDefaultCenter\(\);\s*await load\(\);/);
  }
});
