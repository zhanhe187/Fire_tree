<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  BarChart3,
  Compass,
  Loader2,
  MapPinned,
  PieChart,
  RefreshCcw,
  Route,
  Search,
  UsersRound,
} from 'lucide-vue-next';
import chinaGeoJson from 'china-geojson/src/geojson/china.json';
import { AnalyticsOverviewResponse, AnalyticsProvinceItem, AnalyticsTrackItem, BehaviorTrendItem, OperationAuditItem, SearchHotItem, fetchAnalyticsOverview, fetchBehaviorTrend, fetchOperationAudit, fetchSearchHot } from '../../services/analytics';

type MapPoint = [number, number];
type MapRing = MapPoint[];
type MapPolygon = MapRing[];
type MapFeature = {
  properties: {
    name: string;
    cp?: MapPoint;
    latitude?: number;
    longitude?: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: MapPolygon | MapPolygon[];
  };
};
type ProvincePath = {
  name: string;
  label: string;
  cx: number;
  cy: number;
  d: string;
};
type MapBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
type MapLabelItem = {
  key: string;
  name: string;
  text: string;
  cx: number;
  cy: number;
  priority: number;
  weight: number;
  box: MapBounds;
  anchor: 'middle' | 'start' | 'end';
  offsets: MapPoint[];
};
type MapLabel = MapLabelItem & {
  x: number;
  y: number;
};
type ProvinceGeometry = {
  feature: MapFeature;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const overview = ref<AnalyticsOverviewResponse | null>(null);
const searchHot = ref<SearchHotItem[]>([]);
const behaviorTrend = ref<BehaviorTrendItem[]>([]);
const operationAudit = ref<OperationAuditItem[]>([]);
const loading = ref(false);
const error = ref('');
const hoveredProvince = ref('');
const categoryPage = ref(1);
const provincePage = ref(1);
const trackPage = ref(1);

const categoryPageSize = 2;
const provincePageSize = 3;
const trackPageSize = 2;
const mapWidth = 800;
const mapHeight = 500;
const mapPadding = { x: 24, y: 18 };
const labelCjkWidth = 1.16;
const labelLatinWidth = 0.62;
const labelLineHeight = 1.34;
const labelAvoidanceGap = 5;
const labelBoxInflation = 1.5;
const geoFeatures = (chinaGeoJson as unknown as { features: MapFeature[] }).features;

const nodeTypeLabels: Record<string, string> = {
  heritage_project: '非遗项目',
  inheritor: '传承人',
  region: '地区',
  unesco_element: '联合国教科文组织名录项目',
  organization: '保护单位',
  craft_technique: '技艺',
  craft_process: '工艺流程',
  craft_material: '工艺材料',
  craft_tool: '工艺工具',
  representative_work: '代表作品',
  work: '代表作品',
  historical_period: '历史时期',
  exhibition_market: '展览与市集',
  cultural_product: '文创产品',
};

const provinceFullNames: Record<string, string> = {
  北京: '北京市',
  天津: '天津市',
  上海: '上海市',
  重庆: '重庆市',
  河北: '河北省',
  山西: '山西省',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  福建: '福建省',
  江西: '江西省',
  山东: '山东省',
  河南: '河南省',
  湖北: '湖北省',
  湖南: '湖南省',
  广东: '广东省',
  海南: '海南省',
  四川: '四川省',
  贵州: '贵州省',
  云南: '云南省',
  陕西: '陕西省',
  甘肃: '甘肃省',
  青海: '青海省',
  台湾: '台湾省',
  内蒙古: '内蒙古自治区',
  广西: '广西壮族自治区',
  西藏: '西藏自治区',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
  南海诸岛: '南海诸岛',
};

const provinceShortNames: Record<string, string> = {
  北京市: '北京',
  天津市: '天津',
  上海市: '上海',
  重庆市: '重庆',
  内蒙古自治区: '内蒙古',
  广西壮族自治区: '广西',
  西藏自治区: '西藏',
  宁夏回族自治区: '宁夏',
  新疆维吾尔自治区: '新疆',
  香港特别行政区: '香港',
  澳门特别行政区: '澳门',
};

const mapBounds = findGeoBounds(geoFeatures);
const provinceGeometries = geoFeatures.map(toProvinceGeometry).filter((item): item is ProvinceGeometry => item !== null);
const chinaProvincePaths = geoFeatures.map(toProvincePath).filter((province) => province.d);
const provinceLabelLayout = computed(() => layoutMapLabels());
const placedProvinceLabels = computed(() => provinceLabelLayout.value.provinces);
const placedHeatLabels = computed(() => provinceLabelLayout.value.heat);
const provinceLabelFontSize = Math.round(mapWidth / 62);

const maxCategory = computed(() => Math.max(1, ...((overview.value?.categoryShare ?? []).map((item) => Number(item.nodeCount)))));
const maxAge = computed(() => Math.max(1, ...((overview.value?.ageBuckets ?? []).map((item) => Number(item.nodeCount)))));
const maxProvince = computed(() => Math.max(1, ...((overview.value?.provinceHeatmap ?? []).map((item) => Number(item.nodeCount)))));
const topProvince = computed(() => overview.value?.provinceHeatmap[0] ?? null);
const hasAgeData = computed(() => (overview.value?.ageBuckets ?? []).some((item) => Number(item.nodeCount) > 0));
const provinceHeatByName = computed(() => {
  const map = new Map<string, AnalyticsProvinceItem>();
  for (const item of overview.value?.provinceHeatmap ?? []) {
    map.set(canonicalProvinceName(item.province), item);
  }
  return map;
});
const hoveredProvinceData = computed(() => provinceHeatByName.value.get(hoveredProvince.value) ?? null);
const categoryPageCount = computed(() => Math.max(1, Math.ceil((overview.value?.categoryShare.length ?? 0) / categoryPageSize)));
const provincePageCount = computed(() => Math.max(1, Math.ceil((overview.value?.provinceHeatmap.length ?? 0) / provincePageSize)));
const trackPageCount = computed(() => Math.max(1, Math.ceil((overview.value?.propagationTracks.length ?? 0) / trackPageSize)));
const pagedCategories = computed(() => slicePage(overview.value?.categoryShare ?? [], categoryPage.value, categoryPageSize));
const pagedProvinces = computed(() => slicePage(overview.value?.provinceHeatmap ?? [], provincePage.value, provincePageSize));
const pagedTracks = computed(() => slicePage(overview.value?.propagationTracks ?? [], trackPage.value, trackPageSize));

function formatAdminError(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [overviewData, searchHotData, behaviorTrendData, operationAuditData] = await Promise.all([
      fetchAnalyticsOverview(),
      fetchSearchHot(8),
      fetchBehaviorTrend(7),
      fetchOperationAudit({ page: 1, size: 8 }),
    ]);
    overview.value = overviewData;
    searchHot.value = searchHotData.items;
    behaviorTrend.value = behaviorTrendData.items;
    operationAudit.value = operationAuditData.items;
    categoryPage.value = 1;
    provincePage.value = 1;
    trackPage.value = 1;
  } catch (err) {
    error.value = formatAdminError(err, '大屏聚合数据加载失败');
  } finally {
    loading.value = false;
  }
}

function percent(value: number, total: number) {
  return `${Math.max(4, Math.round((Number(value) / total) * 100))}%`;
}

function slicePage<T>(items: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

function changeLocalPage(target: 'category' | 'province' | 'track', delta: number) {
  if (target === 'category') {
    categoryPage.value = Math.min(categoryPageCount.value, Math.max(1, categoryPage.value + delta));
  } else if (target === 'province') {
    provincePage.value = Math.min(provincePageCount.value, Math.max(1, provincePage.value + delta));
  } else {
    trackPage.value = Math.min(trackPageCount.value, Math.max(1, trackPage.value + delta));
  }
}

function canonicalProvinceName(name?: string) {
  if (!name) return '';
  const trimmed = name.trim();
  if (provinceFullNames[trimmed]) return provinceFullNames[trimmed];
  const matchedShortName = Object.entries(provinceFullNames).find(([, fullName]) => fullName === trimmed)?.[0];
  return matchedShortName ? provinceFullNames[matchedShortName] : trimmed;
}

function provinceShortName(name?: string) {
  const canonical = canonicalProvinceName(name);
  return provinceShortNames[canonical] ?? canonical.replace(/(省|市|自治区|特别行政区)$/, '');
}

function localizeCategoryName(typeCode?: string, typeName?: string) {
  const key = (typeCode ?? '').trim().toLowerCase();
  if (nodeTypeLabels[key]) return nodeTypeLabels[key];
  const label = (typeName ?? '').trim();
  return nodeTypeLabels[label.toLowerCase()] ?? (label || '未分类');
}

function estimateLabelWidth(text: string, fontSize: number) {
  let width = 0;
  for (const char of text) {
    width += /[\u3000-\u9fff\uff00-\uffef]/.test(char) ? fontSize * labelCjkWidth : fontSize * labelLatinWidth;
  }
  return width;
}

function labelBox(cx: number, cy: number, width: number, height: number, anchor: MapLabelItem['anchor']): MapBounds {
  const left = anchor === 'start' ? cx : anchor === 'end' ? cx - width : cx - width / 2;
  return { left, right: left + width, top: cy - height / 2, bottom: cy + height / 2 };
}

function boxesOverlap(a: MapBounds, b: MapBounds, gap = labelAvoidanceGap) {
  const at = a.top - labelBoxInflation;
  const ab = a.bottom + labelBoxInflation;
  const al = a.left - labelBoxInflation;
  const ar = a.right + labelBoxInflation;
  return al < b.right + gap && ar + gap > b.left && at < b.bottom + gap && ab + gap > b.top;
}

function unionBoxes(a: MapBounds, b: MapBounds): MapBounds {
  return {
    left: Math.min(a.left, b.left),
    right: Math.max(a.right, b.right),
    top: Math.min(a.top, b.top),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

function withinMapBounds(box: MapBounds, padding = 4) {
  const frame = { left: padding, top: padding, right: mapWidth - padding, bottom: mapHeight - padding };
  return box.left >= frame.left && box.right <= frame.right && box.top >= frame.top && box.bottom <= frame.bottom;
}

function resolveLabelPosition(item: MapLabelItem, placed: MapBounds[]) {
  for (const [dx, dy] of item.offsets) {
    const box = {
      left: item.box.left + dx,
      right: item.box.right + dx,
      top: item.box.top + dy,
      bottom: item.box.bottom + dy,
    };
    if (!withinMapBounds(box)) continue;
    if (placed.some((other) => boxesOverlap(box, other))) continue;
    return { x: item.cx + dx, y: item.cy + dy, box };
  }
  return null;
}

function placeMapLabels(items: MapLabelItem[], reserved: MapBounds[] = []) {
  const placedBoxes: MapBounds[] = [...reserved];
  const labels: MapLabel[] = [];
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  for (const item of sorted) {
    const position = resolveLabelPosition(item, placedBoxes);
    if (!position) continue;
    placedBoxes.push(position.box);
    labels.push({ ...item, x: position.x, y: position.y });
  }
  return { labels, boxes: placedBoxes };
}

function heatLabelOffsets(radius: number, anchor: MapLabelItem['anchor']) {
  const gap = radius + 7;
  const side = anchor === 'end' ? -1 : 1;
  const offsets: MapPoint[] = [[gap * side, 0]];
  for (let ring = 1; ring <= 2; ring += 1) {
    const distance = gap + ring * 8;
    for (const angle of [-30, 30, -60, 60, 90, -90]) {
      const radians = (angle * Math.PI) / 180;
      offsets.push([
        distance * Math.cos(radians) * side + radius * side * 0.4,
        distance * Math.sin(radians) + radius * 0.4,
      ]);
    }
  }
  return offsets;
}

function layoutMapLabels() {
  const placedBoxes: MapBounds[] = [];
  const heatLabels: MapLabel[] = [];
  const provinceItems: MapLabelItem[] = [];
  const heatFontSize = provinceLabelFontSize;

  const heatItems = (overview.value?.provinceHeatmap ?? [])
    .map((item) => ({ item, point: provincePoint(item) }))
    .filter(({ point }) => withinMapBounds({ left: point.x, right: point.x, top: point.y, bottom: point.y }, 0))
    .sort((a, b) => Number(b.item.nodeCount) - Number(a.item.nodeCount));

  for (const { item, point } of heatItems) {
    const radius = 7 + (Number(item.nodeCount) / maxProvince.value) * 18;
    const anchor: MapLabelItem['anchor'] = point.x > mapWidth * 0.68 ? 'end' : 'start';
    const text = provinceShortName(item.province);
    const width = estimateLabelWidth(text, heatFontSize);
    const height = heatFontSize * labelLineHeight;
    const box = labelBox(point.x, point.y, width, height, anchor);
    const label: MapLabelItem = {
      key: `${item.province}-heat`,
      name: item.province,
      text,
      cx: point.x,
      cy: point.y,
      priority: 5000 + Number(item.nodeCount),
      weight: heatFontSize,
      box,
      anchor,
      offsets: heatLabelOffsets(radius, anchor),
    };
    const position = resolveLabelPosition(label, placedBoxes);
    if (!position) continue;
    placedBoxes.push(position.box);
    heatLabels.push({ ...label, x: position.x, y: position.y });
    // Reserve the whole heat marker strip (dot circle + its own caption) so a static
    // province name is never drawn on top of a heat marker or its label.
    const dotBox = labelBox(point.x, point.y, radius * 2 + 2, radius * 2 + 2, 'middle');
    provinceItems.push({
      ...label,
      key: `${item.province}-center`,
      text: '',
      priority: 4000 + Number(item.nodeCount),
      weight: 0,
      box: unionBoxes(dotBox, position.box),
      anchor: 'middle',
      offsets: [[0, 0]],
    });
  }

  const provinceNameItems = provinceGeometries.map(({ feature, minX, minY, maxX, maxY }): MapLabelItem | null => {
    const name = canonicalProvinceName(feature.properties?.name);
    const center = feature.properties?.cp ?? [
      Number(feature.properties?.longitude),
      Number(feature.properties?.latitude),
    ];
    if (!Number.isFinite(center[0]) || !Number.isFinite(center[1])) return null;
    const point = projectPoint(center as MapPoint);
    const text = name;
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const fontSize = Math.max(8, Math.min(provinceLabelFontSize, Math.min(boxHeight * 0.6, boxWidth * 0.3, 15)));
    const width = estimateLabelWidth(text, fontSize);
    const height = fontSize * labelLineHeight;
    if (width > boxWidth * 0.86 || height > boxHeight * 0.82) return null;
    return {
      key: `${name}-label`,
      name,
      text,
      cx: point.x,
      cy: point.y,
      priority: 100 + Math.min(boxHeight, 26),
      weight: fontSize,
      box: labelBox(point.x, point.y, width, height, 'middle'),
      anchor: 'middle',
      offsets: [[0, 0]],
    };
  }).filter((item): item is MapLabelItem => item !== null);

  // Heat markers are placed first (descending node count); every accepted marker reserves
  // its dot plus its caption as an unbreakable strip, and static province names can only
  // use the space that is left over.
  const provinceResult = placeMapLabels(
    provinceNameItems,
    provinceItems.map((item) => item.box),
  );
  return {
    provinces: provinceResult.labels,
    heat: heatLabels,
  };
}

function findGeoBounds(features: MapFeature[]) {
  const points: MapPoint[] = [];
  for (const feature of features) {
    collectPoints(feature.geometry.coordinates, points);
  }
  return points.reduce(
    (bounds, [longitude, latitude]) => ({
      minLongitude: Math.min(bounds.minLongitude, longitude),
      maxLongitude: Math.max(bounds.maxLongitude, longitude),
      minLatitude: Math.min(bounds.minLatitude, latitude),
      maxLatitude: Math.max(bounds.maxLatitude, latitude),
    }),
    {
      minLongitude: Number.POSITIVE_INFINITY,
      maxLongitude: Number.NEGATIVE_INFINITY,
      minLatitude: Number.POSITIVE_INFINITY,
      maxLatitude: Number.NEGATIVE_INFINITY,
    },
  );
}

function collectPoints(value: unknown, points: MapPoint[]) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    points.push(value as MapPoint);
    return;
  }
  for (const child of value) {
    collectPoints(child, points);
  }
}

function projectPoint([longitude, latitude]: MapPoint) {
  const xRatio = (longitude - mapBounds.minLongitude) / (mapBounds.maxLongitude - mapBounds.minLongitude);
  const yRatio = (latitude - mapBounds.minLatitude) / (mapBounds.maxLatitude - mapBounds.minLatitude);
  return {
    x: mapPadding.x + xRatio * (mapWidth - mapPadding.x * 2),
    y: mapHeight - mapPadding.y - yRatio * (mapHeight - mapPadding.y * 2),
  };
}

function ringPath(ring: MapRing) {
  return ring
    .map((point, index) => {
      const projected = projectPoint(point);
      return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

function geometryPath(geometry: MapFeature['geometry']) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as MapPolygon] : geometry.coordinates as MapPolygon[];
  return polygons
    .map((polygon) => polygon.map((ring) => ringPath(ring)).join(' '))
    .join(' ');
}

function toProvincePath(feature: MapFeature): ProvincePath {
  const label = feature.properties.name;
  const center = projectPoint(provinceCenter(feature));
  return {
    name: canonicalProvinceName(label),
    label,
    cx: center.x,
    cy: center.y,
    d: geometryPath(feature.geometry),
  };
}

function provinceCenter(feature: MapFeature): MapPoint {
  if (Array.isArray(feature.properties?.cp) && feature.properties.cp.length === 2) {
    return feature.properties.cp;
  }
  const fallback: MapPoint = [Number(feature.properties?.longitude), Number(feature.properties?.latitude)];
  return fallback.every((value) => Number.isFinite(value)) ? fallback : [104.2, 35.8];
}

function toProvinceGeometry(feature: MapFeature): ProvinceGeometry | null {
  const bounds = { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY };
  const projected: MapPoint[] = [];
  collectPoints(feature.geometry.coordinates, projected);
  if (projected.length === 0) return null;
  for (const point of projected) {
    const { x, y } = projectPoint(point);
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
  return { feature, ...bounds };
}

const provinceCoordinates: Record<string, { longitude: number; latitude: number }> = {
  中国: { longitude: 104.2, latitude: 35.8 },
  江苏省: { longitude: 119.8, latitude: 32.9 },
  浙江省: { longitude: 120.1, latitude: 29.2 },
  贵州省: { longitude: 106.7, latitude: 26.6 },
  云南省: { longitude: 102.7, latitude: 25.0 },
  河北省: { longitude: 115.2, latitude: 38.0 },
  广西壮族自治区: { longitude: 108.3, latitude: 23.8 },
  湖南省: { longitude: 112.9, latitude: 27.8 },
  甘肃省: { longitude: 103.8, latitude: 36.1 },
};

for (const province of chinaProvincePaths) {
  provinceCoordinates[province.name] ??= unprojectPoint(province.cx, province.cy);
}

function unprojectPoint(x: number, y: number) {
  const longitude = ((x - mapPadding.x) / (mapWidth - mapPadding.x * 2)) * (mapBounds.maxLongitude - mapBounds.minLongitude) + mapBounds.minLongitude;
  const latitude = ((mapHeight - mapPadding.y - y) / (mapHeight - mapPadding.y * 2)) * (mapBounds.maxLatitude - mapBounds.minLatitude) + mapBounds.minLatitude;
  return { longitude, latitude };
}

function normalizedCoordinate(longitude?: number, latitude?: number, province?: string) {
  const lng = Number(longitude);
  const lat = Number(latitude);
  if (Number.isFinite(lng) && Number.isFinite(lat) && lng >= 73 && lng <= 141 && lat >= 17 && lat <= 54) {
    return { longitude: lng, latitude: lat };
  }
  return provinceCoordinates[canonicalProvinceName(province)] ?? provinceCoordinates['中国'];
}

function mapPoint(longitude?: number, latitude?: number, province?: string) {
  const coordinate = normalizedCoordinate(longitude, latitude, province);
  return projectPoint([coordinate.longitude, coordinate.latitude]);
}

function provincePoint(item: AnalyticsProvinceItem) {
  return mapPoint(item.longitude, item.latitude, item.province);
}

function trackPath(track: AnalyticsTrackItem) {
  const source = mapPoint(track.sourceLongitude, track.sourceLatitude, track.sourceProvince);
  const target = mapPoint(track.targetLongitude, track.targetLatitude, track.targetProvince);
  const cx = (source.x + target.x) / 2;
  const cy = Math.min(source.y, target.y) - 42;
  return `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`;
}

function formatAuditTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-';
}

function provinceHeatOpacity(provinceName: string) {
  const item = provinceHeatByName.value.get(provinceName);
  if (!item) return 0;
  return Math.min(0.72, 0.16 + (Number(item.nodeCount) / maxProvince.value) * 0.56);
}

function localizeSearchType(value?: string) {
  return {
    KEYWORD: '关键词',
    SEMANTIC: '语义检索',
    TAG: '标签',
  }[value ?? ''] ?? value ?? '未知类型';
}

function localizeBehaviorType(value?: string) {
  return {
    VIEW_NODE: '浏览节点',
    VIEW_ARTICLE: '浏览资讯',
    VIEW_EXHIBITION: '浏览展览',
    SEARCH: '搜索',
    FAVORITE: '收藏',
    CHECKIN: '打卡',
  }[value ?? ''] ?? value ?? '未知行为';
}

function localizeTargetType(value?: string) {
  return {
    NODE: '节点',
    ARTICLE: '资讯',
    EXHIBITION: '展览',
    SEARCH: '搜索',
    GRAPH: '图谱',
    PRODUCT: '文创',
    RISK: '风险',
    MEDIA: '素材',
  }[value ?? ''] ?? value ?? '未知对象';
}

onMounted(load);
</script>

<template>
  <section class="analytics-page compact-page">
    <header class="page-heading analytics-heading compact-heading">
      <div>
        <p class="eyebrow">大屏与地图</p>
        <h2>非遗资源时空大屏</h2>
        <span>汇总类别占比、传承人年龄、区域热力与传播轨迹，用于核验聚合数据准确性。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" :disabled="loading" @click="load">
          <Loader2 v-if="loading" :size="16" class="spin" />
          <RefreshCcw v-else :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error compact-message">{{ error }}</div>

    <div v-if="loading && !overview" class="state-panel analytics-loading compact-state">
      <Loader2 :size="24" class="spin" />
      <span>正在加载聚合数据</span>
    </div>

    <template v-else-if="overview">
      <section class="analytics-stats compact-stats">
        <article>
          <PieChart :size="18" />
          <span>公开节点</span>
          <strong>{{ overview.totals.nodeCount }}</strong>
        </article>
        <article>
          <MapPinned :size="18" />
          <span>覆盖省份</span>
          <strong>{{ overview.totals.provinceCount }}</strong>
        </article>
        <article>
          <Route :size="18" />
          <span>传播轨迹</span>
          <strong>{{ overview.totals.trackCount }}</strong>
        </article>
        <article>
          <Compass :size="18" />
          <span>热力最高</span>
          <strong>{{ topProvince?.province || '-' }}</strong>
        </article>
      </section>

      <section class="analytics-grid">
        <article class="analytics-panel category-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">类别统计</p>
              <h2>类别占比</h2>
            </div>
            <PieChart :size="18" />
          </div>
          <div class="category-list">
            <article v-for="item in pagedCategories" :key="item.typeCode">
              <span class="category-dot" :style="{ backgroundColor: item.color || '#d8aa54' }"></span>
              <div>
                <strong>{{ localizeCategoryName(item.typeCode, item.typeName) }}</strong>
                <small>{{ item.typeCode }} / {{ item.percentage }}%</small>
              </div>
              <b>{{ item.nodeCount }}</b>
              <span class="bar-track">
                <i :style="{ width: percent(item.nodeCount, maxCategory), backgroundColor: item.color || '#d8aa54' }"></i>
              </span>
            </article>
          </div>
          <footer class="mini-pagination" v-if="categoryPageCount > 1">
            <button type="button" :disabled="categoryPage <= 1" @click="changeLocalPage('category', -1)">上一页</button>
            <span>{{ categoryPage }} / {{ categoryPageCount }}</span>
            <button type="button" :disabled="categoryPage >= categoryPageCount" @click="changeLocalPage('category', 1)">下一页</button>
          </footer>
        </article>

        <article class="analytics-panel age-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">年龄分布</p>
              <h2>传承人年龄柱状图</h2>
            </div>
            <UsersRound :size="18" />
          </div>
          <div v-if="hasAgeData" class="age-bars">
            <article v-for="bucket in overview.ageBuckets" :key="bucket.label">
              <div class="age-column" :style="{ height: percent(bucket.nodeCount, maxAge) }">
                <strong>{{ bucket.nodeCount }}</strong>
              </div>
              <span>{{ bucket.label }}</span>
            </article>
          </div>
          <div v-else class="age-empty-state">
            <strong>暂无出生年份数据</strong>
            <span>可在“图谱节点管理”中为传承人补充出生年份，保存后这里会自动更新年龄分布。</span>
          </div>
        </article>

        <article class="analytics-panel map-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">时空地图</p>
              <h2>湖南省域热力与传播轨迹</h2>
            </div>
            <MapPinned :size="18" />
          </div>
          <div class="map-stage">
            <svg viewBox="0 0 800 500" role="img" aria-label="非遗省份热力与传播轨迹">
              <defs>
                <linearGradient id="track-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#d8aa54" />
                  <stop offset="100%" stop-color="#3b8b70" />
                </linearGradient>
              </defs>
              <g class="china-map">
                <path
                  v-for="province in chinaProvincePaths"
                  :key="province.name"
                  class="province-map-path"
                  :class="{ active: hoveredProvince === province.name, heated: provinceHeatByName.has(province.name) }"
                  :d="province.d"
                  :style="{ '--province-heat': provinceHeatOpacity(province.name) }"
                  @pointerenter="hoveredProvince = province.name"
                  @pointerleave="hoveredProvince = ''"
                >
                  <title>{{ province.name }}</title>
                </path>
              </g>
              <path
                v-for="track in overview.propagationTracks"
                :key="track.id"
                class="track-line"
                :d="trackPath(track)"
              />
              <g class="province-label-layer">
                <text
                  v-for="label in placedProvinceLabels"
                  :key="label.key"
                  class="province-map-label"
                  :x="label.x"
                  :y="label.y"
                  :font-size="label.weight"
                >
                  {{ label.text }}
                </text>
              </g>
              <g class="heat-label-layer">
                <g v-for="item in overview.provinceHeatmap" :key="item.province">
                  <circle
                    class="heat-dot"
                    :cx="provincePoint(item).x"
                    :cy="provincePoint(item).y"
                    :r="7 + (Number(item.nodeCount) / maxProvince) * 18"
                  />
                </g>
                <text
                  v-for="label in placedHeatLabels"
                  :key="label.key"
                  class="heat-map-label"
                  :x="label.x"
                  :y="label.y"
                  :font-size="label.weight"
                  :text-anchor="label.anchor"
                >
                  {{ label.text }}
                </text>
              </g>
            </svg>
            <div v-if="hoveredProvince" class="map-tooltip">
              <strong>{{ hoveredProvince }}</strong>
              <span v-if="hoveredProvinceData">
                节点 {{ hoveredProvinceData.nodeCount }} 个 / 热度 {{ hoveredProvinceData.popularityTotal }}
              </span>
              <span v-else>暂无热力数据</span>
            </div>
          </div>
        </article>

        <article class="analytics-panel province-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">区域热力</p>
              <h2>湖南省域热力</h2>
            </div>
            <BarChart3 :size="18" />
          </div>
          <div class="province-list">
            <article v-for="item in pagedProvinces" :key="item.province">
              <div>
                <strong>{{ item.province }}</strong>
                <small>热度 {{ item.popularityTotal }} / 节点 {{ item.nodeCount }}</small>
              </div>
              <span class="bar-track">
                <i :style="{ width: percent(item.nodeCount, maxProvince) }"></i>
              </span>
            </article>
          </div>
          <footer class="mini-pagination" v-if="provincePageCount > 1">
            <button type="button" :disabled="provincePage <= 1" @click="changeLocalPage('province', -1)">上一页</button>
            <span>{{ provincePage }} / {{ provincePageCount }}</span>
            <button type="button" :disabled="provincePage >= provincePageCount" @click="changeLocalPage('province', 1)">下一页</button>
          </footer>
        </article>

        <article class="analytics-panel track-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">传播路径</p>
              <h2>传播轨迹明细</h2>
            </div>
            <Route :size="18" />
          </div>
          <div class="track-list">
            <article v-for="track in pagedTracks" :key="track.id">
              <strong>{{ track.sourceNodeName }} -> {{ track.targetNodeName }}</strong>
              <small>{{ track.relationLabel || track.edgeTypeName }} / {{ track.sourceProvince || '-' }} 到 {{ track.targetProvince || '-' }}</small>
            </article>
          </div>
          <footer class="mini-pagination" v-if="trackPageCount > 1">
            <button type="button" :disabled="trackPage <= 1" @click="changeLocalPage('track', -1)">上一页</button>
            <span>{{ trackPage }} / {{ trackPageCount }}</span>
            <button type="button" :disabled="trackPage >= trackPageCount" @click="changeLocalPage('track', 1)">下一页</button>
          </footer>
        </article>

        <article class="analytics-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">搜索热词</p>
              <h2>最近搜索与结果量</h2>
            </div>
            <Search :size="18" />
          </div>
          <div class="track-list">
            <article v-for="item in searchHot" :key="item.keyword + item.searchType">
              <strong>{{ item.keyword }}</strong>
              <small>{{ localizeSearchType(item.searchType) }} / {{ item.searchCount }} 次 / 结果 {{ item.resultTotal ?? 0 }}</small>
            </article>
            <div v-if="searchHot.length === 0" class="chain-empty">暂无搜索记录</div>
          </div>
        </article>

        <article class="analytics-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">行为趋势</p>
              <h2>近 7 日访问行为</h2>
            </div>
            <BarChart3 :size="18" />
          </div>
          <div class="track-list">
            <article v-for="item in behaviorTrend" :key="`${item.date}-${item.behaviorType}-${item.targetType}`">
              <strong>{{ item.date }} / {{ localizeBehaviorType(item.behaviorType) }}</strong>
              <small>{{ localizeTargetType(item.targetType) }} / {{ item.eventCount }} 次</small>
            </article>
            <div v-if="behaviorTrend.length === 0" class="chain-empty">暂无行为记录</div>
          </div>
        </article>

        <article class="analytics-panel">
          <div class="panel-title">
            <div>
              <p class="eyebrow">操作审计</p>
              <h2>管理端操作记录</h2>
            </div>
            <UsersRound :size="18" />
          </div>
          <div class="track-list">
            <article v-for="item in operationAudit" :key="item.id">
              <strong>{{ item.operation }} / {{ localizeTargetType(item.resourceType) }}</strong>
              <small>{{ item.operatorName || item.operatorUsername || item.operatorId || '系统用户' }} / {{ item.requestMethod }} {{ item.requestUri }} / {{ formatAuditTime(item.createdAt) }}</small>
            </article>
            <div v-if="operationAudit.length === 0" class="chain-empty">暂无操作记录</div>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>
