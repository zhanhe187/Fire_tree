<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GraphNodeItem, GraphRelationHint, NodeTypeItem, fetchGraphRelations, fetchNodeTypes, unifiedGraphSearch } from '../../services/graph';

const route = useRoute();
const router = useRouter();
const keyword = ref(String(route.query.q ?? ''));
const activeTypeCode = ref('');
const nodeTypes = ref<NodeTypeItem[]>([]);
const groups = ref<Array<{ typeCode: string; typeName: string; count: number; items: GraphNodeItem[] }>>([]);
const relationHints = ref<GraphRelationHint[]>([]);
const selectedNode = ref<GraphNodeItem | null>(null);
const selectedRelations = ref<GraphRelationHint[]>([]);
const loading = ref(false);
const relationLoading = ref(false);
const error = ref('');

const visibleGroups = computed(() => {
  if (!activeTypeCode.value) return groups.value;
  return groups.value.filter((group) => group.typeCode === activeTypeCode.value);
});

const typeFilters = computed(() => [
  { typeCode: '', typeName: '全部', count: groups.value.reduce((sum, group) => sum + group.count, 0) },
  ...groups.value.map((group) => ({ typeCode: group.typeCode, typeName: group.typeName, count: group.count })),
]);

watch(() => route.query.q, (next) => {
  keyword.value = String(next ?? '');
  void search();
});

async function loadTypes() {
  const response = await fetchNodeTypes();
  nodeTypes.value = response.items;
}

async function search() {
  loading.value = true;
  error.value = '';
  selectedNode.value = null;
  selectedRelations.value = [];
  try {
    const response = await unifiedGraphSearch({
      keyword: keyword.value,
      typeCodes: activeTypeCode.value ? [activeTypeCode.value] : undefined,
      includeRelations: true,
      page: 1,
      size: 36,
    });
    groups.value = response.groups;
    relationHints.value = response.relationHints ?? [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : '统一搜索加载失败';
  } finally {
    loading.value = false;
  }
}

async function submitSearch() {
  await router.replace({ query: keyword.value ? { q: keyword.value } : {} });
  await search();
}

async function inspectNode(node: GraphNodeItem) {
  selectedNode.value = node;
  relationLoading.value = true;
  try {
    const response = await fetchGraphRelations(node.id, { depth: 1, direction: 'both', limit: 40 });
    selectedRelations.value = response.edges.map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      sourceNodeName: edge.sourceNodeName,
      sourceTypeCode: '',
      targetNodeId: edge.targetNodeId,
      targetNodeName: edge.targetNodeName,
      targetTypeCode: '',
      edgeTypeCode: edge.edgeTypeCode,
      edgeTypeName: edge.edgeTypeName,
      relationLabel: edge.relationLabel,
    }));
  } finally {
    relationLoading.value = false;
  }
}

function nodeMeta(node: GraphNodeItem) {
  return [node.province, node.city, node.projectLevel].filter(Boolean).join(' / ') || node.nodeTypeName;
}

function relationText(relation: GraphRelationHint) {
  return `${relation.sourceNodeName} —${relation.relationLabel || relation.edgeTypeName}→ ${relation.targetNodeName}`;
}

onMounted(async () => {
  await loadTypes();
  await search();
});
</script>

<template>
  <main class="portal-page">
    <section class="portal-page-head">
      <p>统一检索</p>
      <h1>按项目、传承人、技法、材料、工具和作品细分检索</h1>
      <form class="portal-filter-bar" @submit.prevent="submitSearch">
        <input v-model="keyword" type="search" placeholder="搜索苏绣、李雅琴、乱针绣、真丝绣线" aria-label="统一搜索" />
        <button type="submit">搜索</button>
      </form>
      <div class="portal-segments" aria-label="节点类型筛选">
        <button
          v-for="item in typeFilters"
          :key="item.typeCode || 'all'"
          type="button"
          :class="{ active: activeTypeCode === item.typeCode }"
          @click="activeTypeCode = item.typeCode; search()"
        >
          {{ item.typeName }} {{ item.count }}
        </button>
      </div>
    </section>

    <div v-if="error" class="portal-empty">{{ error }}</div>
    <div v-else-if="loading" class="portal-empty">正在检索图谱节点...</div>

    <section v-else class="portal-search-layout">
      <div class="portal-result-column">
        <section v-for="group in visibleGroups" :key="group.typeCode" class="portal-result-group">
          <header>
            <span>{{ group.typeName }}</span>
            <strong>{{ group.count }} 个结果</strong>
          </header>
          <article v-for="node in group.items" :key="node.id" class="portal-node-card" @click="inspectNode(node)">
            <div class="node-type-dot" :style="{ background: node.nodeTypeColor || '#8f261e' }" />
            <div>
              <span>{{ nodeMeta(node) }}</span>
              <h2>{{ node.name }}</h2>
              <p>{{ node.summary || node.alias || '暂无简介' }}</p>
            </div>
            <button type="button">关系探索</button>
          </article>
        </section>
        <div v-if="visibleGroups.length === 0" class="portal-empty">没有匹配的图谱节点</div>
      </div>

      <aside class="portal-relation-panel">
        <section>
          <p>关系探索</p>
          <h2>{{ selectedNode ? selectedNode.name : '选择一个节点' }}</h2>
          <div v-if="relationLoading" class="relation-empty">正在加载一跳关系...</div>
          <div v-else-if="selectedNode && selectedRelations.length === 0" class="relation-empty">暂无相邻关系</div>
          <div v-else-if="selectedNode" class="relation-list">
            <article v-for="relation in selectedRelations" :key="relation.id">
              {{ relationText(relation) }}
            </article>
          </div>
          <div v-else class="relation-empty">点击搜索结果中的“关系探索”，查看项目、传承人、技法、材料、工具和作品之间的关系。</div>
        </section>

        <section v-if="relationHints.length">
          <p>推荐关系</p>
          <article v-for="hint in relationHints.slice(0, 8)" :key="hint.id" class="hint-card">
            {{ relationText(hint) }}
          </article>
        </section>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.portal-page {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(38px, 6vw, 72px) 0 70px;
}

.portal-page-head {
  display: grid;
  gap: 18px;
  margin-bottom: 28px;
}

.portal-page-head > p {
  margin: 0;
  color: #9a3328;
  font-size: 13px;
  font-weight: 900;
}

.portal-page-head h1 {
  max-width: 920px;
  margin: 0;
  color: #241811;
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1.1;
}

.portal-filter-bar {
  display: grid;
  grid-template-columns: minmax(240px, 520px) 96px;
  gap: 12px;
  align-items: center;
}

.portal-filter-bar input,
.portal-filter-bar button {
  min-height: 46px;
  border: 1px solid rgba(98, 54, 24, 0.2);
  padding: 0 14px;
  color: #241811;
  font: inherit;
}

.portal-filter-bar input {
  background: rgba(255, 255, 255, 0.68);
}

.portal-filter-bar button,
.portal-segments button.active,
.portal-node-card button {
  background: #8f261e;
  color: #fff7e5;
  cursor: pointer;
}

.portal-segments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.portal-segments button {
  min-height: 38px;
  border: 1px solid rgba(98, 54, 24, 0.18);
  background: rgba(255, 255, 255, 0.34);
  color: #463222;
  cursor: pointer;
  padding: 0 13px;
}

.portal-search-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.portal-result-column,
.portal-result-group,
.portal-relation-panel {
  display: grid;
  gap: 14px;
}

.portal-result-group header,
.portal-relation-panel section {
  border: 1px solid rgba(98, 54, 24, 0.16);
  background: rgba(255, 251, 240, 0.74);
}

.portal-result-group header {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  color: #8f261e;
  font-weight: 900;
}

.portal-node-card {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  gap: 14px;
  align-items: center;
  border: 1px solid rgba(98, 54, 24, 0.16);
  background: rgba(255, 251, 240, 0.74);
  padding: 18px;
  cursor: pointer;
}

.node-type-dot {
  width: 12px;
  height: 48px;
}

.portal-node-card span {
  color: #9a3328;
  font-size: 12px;
  font-weight: 900;
}

.portal-node-card h2 {
  margin: 6px 0;
  color: #261a13;
  font-size: 24px;
}

.portal-node-card p {
  margin: 0;
  color: rgba(39, 29, 21, 0.68);
  line-height: 1.7;
}

.portal-node-card button {
  border: 0;
  min-height: 36px;
  padding: 0 12px;
}

.portal-relation-panel {
  position: sticky;
  top: 86px;
}

.portal-relation-panel section {
  padding: 18px;
}

.portal-relation-panel p {
  margin: 0 0 8px;
  color: #9a3328;
  font-size: 12px;
  font-weight: 900;
}

.portal-relation-panel h2 {
  margin: 0 0 14px;
  color: #241811;
}

.relation-list,
.relation-empty {
  display: grid;
  gap: 10px;
  color: rgba(39, 29, 21, 0.72);
}

.relation-list article,
.hint-card {
  border: 1px solid rgba(98, 54, 24, 0.12);
  background: rgba(255, 255, 255, 0.42);
  padding: 12px;
  line-height: 1.65;
}

.portal-empty {
  padding: 34px;
  border: 1px dashed rgba(98, 54, 24, 0.28);
  background: rgba(255, 255, 255, 0.35);
}

@media (max-width: 960px) {
  .portal-filter-bar,
  .portal-search-layout,
  .portal-node-card {
    grid-template-columns: 1fr;
  }

  .portal-relation-panel {
    position: static;
  }
}
</style>
