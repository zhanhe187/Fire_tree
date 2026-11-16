<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  CheckCircle2,
  Loader2,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldAlert,
  Truck,
  XCircle,
} from 'lucide-vue-next';
import { ProductOrderDirection, ProductOrderItem, fetchProductOrders, updateProductOrderStatus } from '../../services/product';
import { resolveMediaUrl } from '../../../../shared/utils/mediaUrl';
import { currentAuth } from '../../../auth/services/authState';

const orders = ref<ProductOrderItem[]>([]);
const loading = ref(false);
const updatingId = ref<number | null>(null);
const error = ref('');
const successMessage = ref('');
const statusSummary = ref<Record<string, number>>({});

const filters = reactive({
  keyword: '',
  status: '' as ProductOrderItem['status'] | '',
  direction: 'ALL' as ProductOrderDirection,
  page: 1,
  size: 20,
  total: 0,
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
// 统计优先用后端 summary（全量、不受分页影响）；后端未返回时退回"当前页计数"
const hasSummary = computed(() => Object.keys(statusSummary.value).length > 0);
const countOf = (statuses: string[]) => (hasSummary.value
  ? statuses.reduce((sum, status) => sum + Number(statusSummary.value[status] ?? 0), 0)
  : orders.value.filter((order) => statuses.includes(order.status)).length);
const paidCount = computed(() => countOf(['PAID']));
const shippedCount = computed(() => countOf(['SHIPPED']));
const completedCount = computed(() => countOf(['COMPLETED']));
const refundedCount = computed(() => countOf(['REFUNDED', 'CANCELLED']));
const isSuperAdmin = computed(() => currentAuth.value?.roles.some((role) => role.roleCode === 'SUPER_ADMIN') ?? false);
const isTerminal = (status: string) => ['COMPLETED', 'REFUNDED', 'CANCELLED'].includes(status);

function formatPrice(value?: number) {
  if (value === undefined || value === null) return '-';
  return `¥${Number(value).toFixed(2)}`;
}

function statusLabel(status?: string) {
  switch (status) {
    case 'PAID':
      return '已付款';
    case 'SHIPPED':
      return '已发货';
    case 'COMPLETED':
      return '已完成';
    case 'REFUNDED':
      return '已退款';
    case 'CANCELLED':
      return '已取消';
    default:
      return status || '未知';
  }
}

function statusClass(status?: string) {
  switch (status) {
    case 'PAID':
      return 'paid';
    case 'SHIPPED':
      return 'shipped';
    case 'COMPLETED':
      return 'completed';
    case 'REFUNDED':
    case 'CANCELLED':
      return 'refunded';
    default:
      return '';
  }
}

function coverUrl(item: ProductOrderItem) {
  return resolveMediaUrl(item.productCoverUrl);
}

async function load() {
  loading.value = true;
  error.value = '';
  // 注意：这里不能清 successMessage —— setStatus 是「先写提示再 await load()」，
  // 在 load 里清会让发货/退款的成功提示同帧消失。清空只放在动作入口。
  try {
    const response = await fetchProductOrders({
      keyword: filters.keyword,
      status: filters.status || undefined,
      direction: filters.direction,
      page: filters.page,
      size: filters.size,
    });
    orders.value = response.items;
    filters.total = response.total;
    statusSummary.value = response.summary ?? {};
  } catch (err) {
    error.value = err instanceof Error ? err.message : '订单加载失败';
  } finally {
    loading.value = false;
  }
}

async function setStatus(order: ProductOrderItem, nextStatus: ProductOrderItem['status']) {
  if (order.status === nextStatus) return;
  updatingId.value = order.id;
  error.value = '';
  successMessage.value = '';
  try {
    await updateProductOrderStatus(order.id, nextStatus);
    successMessage.value = `订单 ${order.orderNo} 已更新为${statusLabel(nextStatus)}`;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '状态更新失败';
  } finally {
    updatingId.value = null;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.status = '';
  filters.direction = 'ALL';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

onMounted(load);
</script>

<template>
  <section class="product-page order-management-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">文创订单</p>
        <h2>文创购买订单管理</h2>
        <span>管理与本人相关的文创订单；管理员可查看全量订单并处理退款或取消。</span>
      </div>
      <div class="heading-actions">
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <section class="product-stats">
      <article>
        <PackageCheck :size="20" />
        <span>订单总数（按筛选）</span>
        <strong>{{ filters.total }}</strong>
      </article>
      <article>
        <ShieldAlert :size="20" />
        <span>待发货（{{ hasSummary ? '全量' : '本页' }}）</span>
        <strong>{{ paidCount }}</strong>
      </article>
      <article>
        <Truck :size="20" />
        <span>已发货（{{ hasSummary ? '全量' : '本页' }}）</span>
        <strong>{{ shippedCount }}</strong>
      </article>
      <article>
        <CheckCircle2 :size="20" />
        <span>已完成（{{ hasSummary ? '全量' : '本页' }}）</span>
        <strong>{{ completedCount }}</strong>
      </article>
      <article>
        <XCircle :size="20" />
        <span>已退款/取消（{{ hasSummary ? '全量' : '本页' }}）</span>
        <strong>{{ refundedCount }}</strong>
      </article>
    </section>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="订单号 / 商品 / 买家" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="PAID">已付款（待发货）</option>
          <option value="SHIPPED">已发货</option>
          <option value="COMPLETED">已完成</option>
          <option value="REFUNDED">已退款</option>
          <option value="CANCELLED">已取消</option>
        </select>
      </label>
      <label>
        <span>方向</span>
        <select v-model="filters.direction">
          <option value="ALL">全部方向</option>
          <option value="BUYING">我买入的</option>
          <option value="SELLING">我卖出的</option>
        </select>
      </label>
      <div class="filter-actions">
        <button class="primary-action compact" type="button" @click="filters.page = 1; load()">
          <Search :size="16" />
          筛选
        </button>
        <button class="secondary-action compact" type="button" @click="resetFilters">重置</button>
      </div>
    </section>

    <section class="order-table-panel">
      <div class="table-toolbar">
        <span>共 {{ filters.total }} 条订单</span>
        <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
      </div>

      <div v-if="loading" class="state-panel">
        <Loader2 :size="24" class="spin" />
        <span>正在加载订单</span>
      </div>

      <div v-else-if="orders.length === 0" class="state-panel empty">
        <PackageCheck :size="28" />
        <strong>暂无订单</strong>
        <span>用户完成文创产品购买后，订单会出现在这里。</span>
      </div>

      <div v-else class="data-table order-table">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品</th>
              <th>买家</th>
              <th>方向</th>
              <th>数量</th>
              <th>合计</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="mono">{{ order.orderNo }}</td>
              <td>
                <div class="order-product-cell">
                  <img v-if="coverUrl(order)" :src="coverUrl(order)" :alt="order.productName" />
                  <span v-else class="order-fallback">{{ order.productName?.slice(0, 1) || '文' }}</span>
                  <strong>{{ order.productName || '未知商品' }}</strong>
                </div>
              </td>
              <td>
                <strong>{{ order.buyerName || order.buyerUsername || '-' }}</strong>
                <small v-if="order.buyerUsername">{{ order.buyerUsername }}</small>
              </td>
              <td>
                <strong>{{ order.isSeller ? '售出' : order.isBuyer ? '购入' : '平台订单' }}</strong>
                <small v-if="order.isSeller">买家：{{ order.buyerName || order.buyerUsername || '-' }}</small>
                <small v-else-if="order.isBuyer">卖家：{{ order.sellerName || order.sellerUsername || '-' }}</small>
              </td>
              <td>{{ order.quantity }}</td>
              <td class="order-total-cell">{{ formatPrice(order.total) }}</td>
              <td>
                <span class="status-chip" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
              </td>
              <td class="order-time-cell">
                {{ new Date(order.createdAt || '').toLocaleString() }}
                <small v-if="order.updatedAt && order.updatedAt !== order.createdAt">
                  更新 {{ new Date(order.updatedAt).toLocaleString() }}
                </small>
              </td>
              <td>
                <div class="row-actions order-actions">
                  <button
                    v-if="order.isSeller && order.status === 'PAID'"
                    type="button"
                    :disabled="updatingId === order.id || order.status !== 'PAID'"
                    @click="setStatus(order, 'SHIPPED')"
                  >
                    <Truck :size="14" />
                    发货
                  </button>
                  <button
                    v-if="order.isBuyer && order.status === 'SHIPPED'"
                    type="button"
                    :disabled="updatingId === order.id || order.status !== 'SHIPPED'"
                    @click="setStatus(order, 'COMPLETED')"
                  >
                    <CheckCircle2 :size="14" />
                    完成
                  </button>
                  <!-- 已完成/已退款/已取消为终态：后端白名单也不允许再改，这里直接不提供入口 -->
                  <button
                    v-if="isSuperAdmin && !isTerminal(order.status)"
                    type="button"
                    class="danger-action compact"
                    :disabled="updatingId === order.id"
                    @click="setStatus(order, 'REFUNDED')"
                  >
                    <XCircle :size="14" />
                    退款
                  </button>
                  <button
                    v-if="isSuperAdmin && !isTerminal(order.status)"
                    type="button"
                    class="danger-action compact"
                    :disabled="updatingId === order.id"
                    @click="setStatus(order, 'CANCELLED')"
                  >
                    <XCircle :size="14" />
                    取消
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
        <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
        <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.order-management-page {
  --order-panel-bg: rgba(255, 255, 255, 0.04);
  --order-panel-line: var(--line);
  --order-muted: var(--muted);
  --order-total-ink: #f7dfad;
  --order-action-bg: rgba(255, 255, 255, 0.06);
  --order-action-hover: rgba(255, 255, 255, 0.12);
  --order-action-line: rgba(255, 255, 255, 0.14);
  --order-action-ink: var(--paper);
  --status-paid-bg: rgba(0, 168, 198, 0.16);
  --status-paid-ink: #000000;
  --status-shipped-bg: rgba(244, 180, 63, 0.16);
  --status-shipped-ink: #111111;
  --status-completed-bg: rgba(39, 174, 96, 0.16);
  --status-completed-ink: #090909;
  --status-refunded-bg: rgba(136, 136, 136, 0.16);
  --status-refunded-ink: #151414;
}

:global(:root[data-theme="glass"]) .order-management-page {
  --order-panel-bg: rgba(255, 255, 255, 0.58);
  --order-panel-line: rgba(111, 86, 48, 0.2);
  --order-total-ink: #7c4e11;
  --order-action-bg: rgba(255, 250, 239, 0.82);
  --order-action-hover: rgba(245, 226, 190, 0.92);
  --order-action-line: rgba(111, 86, 48, 0.28);
  --status-paid-bg: rgba(0, 122, 146, 0.13);
  --status-paid-ink: #00647a;
  --status-shipped-bg: rgba(153, 99, 17, 0.13);
  --status-shipped-ink: #70460b;
  --status-completed-bg: rgba(20, 106, 84, 0.13);
  --status-completed-ink: #125f4c;
  --status-refunded-bg: rgba(91, 82, 73, 0.12);
  --status-refunded-ink: #51483f;
}

.order-table-panel {
  background: var(--order-panel-bg);
  border: 1px solid var(--order-panel-line);
  border-radius: 18px;
  padding: 22px;
}

.order-table thead th {
  white-space: nowrap;
}

.order-product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.order-product-cell img,
.order-fallback {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex: 0 0 auto;
  background: linear-gradient(135deg, #bd4633, #f4b43f);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 14px;
}

.order-product-cell strong {
  font-size: 14px;
}

.order-total-cell {
  font-weight: 900;
  color: var(--order-total-ink);
  white-space: nowrap;
}

.order-time-cell {
  white-space: nowrap;
  font-size: 13px;
  color: var(--order-muted);
}

.order-time-cell small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--order-muted);
  opacity: 0.86;
}

.order-actions {
  flex-wrap: nowrap;
  gap: 6px;
}

.order-actions button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--order-action-line);
  border-radius: 8px;
  background: var(--order-action-bg);
  color: var(--order-action-ink);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.order-actions button:hover:not(:disabled) {
  background: var(--order-action-hover);
}

.order-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.status-chip.paid {
  background: var(--status-paid-bg);
  color: var(--status-paid-ink);
}

.status-chip.shipped {
  background: var(--status-shipped-bg);
  color: var(--status-shipped-ink);
}

.status-chip.completed {
  background: var(--status-completed-bg);
  color: var(--status-completed-ink);
}

.status-chip.refunded {
  background: var(--status-refunded-bg);
  color: var(--status-refunded-ink);
}

@media (max-width: 1200px) {
  .order-table {
    overflow-x: auto;
  }

  .order-table table {
    min-width: 1100px;
  }
}
</style>
