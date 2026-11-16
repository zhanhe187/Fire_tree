<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, CheckCircle2, Loader2, Package, ShoppingBag, XCircle } from 'lucide-vue-next';
import { ProductOrderItem, cancelProductOrder, fetchProductOrders, updateProductOrderStatus } from '../../product/services/product';
import { resolveMediaUrl } from '../../../shared/utils/mediaUrl';
import { currentUser } from '../services/authState';
import '../../../shared/styles/portalDetail.css';
import '../../../shared/styles/portalDirectory.css';

const router = useRouter();
const orders = ref<ProductOrderItem[]>([]);
const loading = ref(false);
const updatingId = ref<number | null>(null);
const cancelCandidate = ref<ProductOrderItem | null>(null);
const error = ref('');
const successMessage = ref('');

const filters = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));

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

async function confirmReceipt(order: ProductOrderItem) {
  if (!order.isBuyer || order.status !== 'SHIPPED') return;
  updatingId.value = order.id;
  error.value = '';
  successMessage.value = '';
  try {
    await updateProductOrderStatus(order.id, 'COMPLETED');
    successMessage.value = `订单 ${order.orderNo} 已确认收货`;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '确认收货失败';
  } finally {
    updatingId.value = null;
  }
}

function requestCancel(order: ProductOrderItem) {
  if (!order.isBuyer || order.status !== 'PAID') return;
  cancelCandidate.value = order;
}

function dismissCancel() {
  cancelCandidate.value = null;
}

async function performCancel() {
  const order = cancelCandidate.value;
  if (!order) return;
  updatingId.value = order.id;
  error.value = '';
  successMessage.value = '';
  try {
    await cancelProductOrder(order.id);
    successMessage.value = `订单 ${order.orderNo} 已取消，库存已归还`;
    cancelCandidate.value = null;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消订单失败';
  } finally {
    updatingId.value = null;
  }
}

async function load() {
  if (!currentUser.value?.id) {
    error.value = '请先登录后查看订单。';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchProductOrders({
      // 用户端只展示"我买到的"，卖出单在后台订单管理里看
      direction: 'BUYING',
      page: filters.page,
      size: filters.size,
    });
    orders.value = response.items;
    filters.total = response.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '订单加载失败';
  } finally {
    loading.value = false;
  }
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

onMounted(load);
</script>

<template>
  <main class="portal-detail-page orders-page">
    <div class="detail-shell orders-shell">
      <button class="primary-action" type="button" @click="router.push('/profile')">
        <ArrowLeft :size="18" />
        返回个人中心
      </button>

      <header class="detail-header orders-header">
        <p class="label-tag"><Package :size="14" /> 我的订单</p>
        <h1>文创产品购买记录</h1>
        <p>查看已购文创产品的订单号、数量、金额与当前状态。订单数据来自服务端记录，更换设备后仍可查看。</p>
      </header>

      <div v-if="error" class="portal-list-state error">{{ error }}</div>
      <div v-if="successMessage" class="portal-list-state success">{{ successMessage }}</div>

      <div v-if="loading" class="portal-empty">
        <Loader2 :size="22" class="spin" />
        正在加载订单
      </div>

      <section v-else-if="orders.length === 0" class="orders-empty">
        <ShoppingBag :size="40" />
        <strong>暂无订单</strong>
        <span>在文创产品页点击“立即购买”，订单会实时同步到这里。</span>
        <button class="primary-action" type="button" @click="router.push('/products')">去逛逛</button>
      </section>

      <section v-else class="orders-list">
        <article v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-card-header">
            <strong>{{ order.orderNo }}</strong>
            <span class="order-status" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
          </div>

          <div class="order-card-product">
            <img v-if="coverUrl(order)" :src="coverUrl(order)" :alt="order.productName" />
            <span v-else class="order-fallback">{{ order.productName?.slice(0, 1) || '文' }}</span>
            <div class="order-product-info">
              <strong>{{ order.productName || '未知商品' }}</strong>
              <span>下单时间：{{ new Date(order.createdAt || '').toLocaleString() }}</span>
              <span v-if="order.updatedAt && order.updatedAt !== order.createdAt">
                状态更新：{{ new Date(order.updatedAt).toLocaleString() }}
              </span>
            </div>
          </div>

          <div class="order-card-meta">
            <span>数量：{{ order.quantity }}</span>
            <span>单价：{{ formatPrice(order.unitPrice) }}</span>
            <span class="order-total">合计：{{ formatPrice(order.total) }}</span>
          </div>

          <div v-if="order.address || order.contactName || order.contactPhone" class="order-card-address">
            <span v-if="order.contactName">{{ order.contactName }}</span>
            <span v-if="order.contactPhone">{{ order.contactPhone }}</span>
            <span v-if="order.address">{{ order.address }}</span>
          </div>
          <div class="order-card-actions">
            <button
              v-if="order.isBuyer && order.status === 'PAID'"
              class="secondary-action compact"
              type="button"
              :disabled="updatingId === order.id"
              @click="requestCancel(order)"
            >
              <XCircle :size="15" />
              取消订单
            </button>
            <button
              v-if="order.isBuyer && order.status === 'SHIPPED'"
              class="primary-action compact"
              type="button"
              :disabled="updatingId === order.id"
              @click="confirmReceipt(order)"
            >
              <Loader2 v-if="updatingId === order.id" :size="15" class="spin" />
              <CheckCircle2 v-else :size="15" />
              确认收货
            </button>
            <small v-if="order.status === 'PAID'">卖家未发货前可自助取消，取消后库存立即归还。</small>
          </div>
        </article>

        <footer class="pagination">
          <button class="secondary-action compact" type="button" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button>
          <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
          <button class="secondary-action compact" type="button" :disabled="filters.page >= pageCount" @click="changePage(1)">下一页</button>
        </footer>
      </section>
    </div>

    <div v-if="cancelCandidate" class="modal-backdrop" @click.self="dismissCancel">
      <section class="confirm-modal confirm-modal-danger">
        <h3>确认取消订单？</h3>
        <p>将取消「<strong>{{ cancelCandidate.productName || '该订单' }}</strong>」（{{ cancelCandidate.orderNo }}），库存会立即归还给卖家。</p>
        <footer>
          <button class="secondary-action" type="button" @click="dismissCancel">再想想</button>
          <button class="danger-action" type="button" :disabled="updatingId === cancelCandidate.id" @click="performCancel">
            <Loader2 v-if="updatingId === cancelCandidate.id" :size="16" class="spin" />
            <XCircle v-else :size="16" />
            确认取消
          </button>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.orders-page {
  min-height: calc(100vh - 76px);
  padding-top: 76px;
}

.orders-shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px clamp(16px, 4vw, 48px) 64px;
}

.orders-header {
  margin-bottom: 28px;
}

.orders-header .label-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.orders-empty {
  display: grid;
  place-items: center;
  gap: 14px;
  padding: 64px 24px;
  border: 1px dashed rgba(125, 33, 25, 0.22);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.42);
  color: #271d15;
}

.orders-empty svg {
  color: #bd4633;
}

.orders-empty strong {
  font-size: 20px;
}

.orders-empty span {
  color: rgba(39, 29, 21, 0.62);
  font-size: 14px;
}

.orders-list {
  display: grid;
  gap: 18px;
}

.order-card {
  padding: 20px 22px;
  border: 1px solid rgba(125, 33, 25, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 8px 28px rgba(39, 29, 21, 0.06);
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px dashed rgba(125, 33, 25, 0.14);
}

.order-card-header strong {
  font-size: 13px;
  color: #271d15;
  font-family: var(--font-mono, monospace);
}

.order-status {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  background: rgba(189, 70, 51, 0.12);
  color: #7d2119;
}

.order-status.paid {
  background: rgba(0, 210, 255, 0.14);
  color: #006b8f;
}

.order-status.shipped {
  background: rgba(244, 180, 63, 0.18);
  color: #8a5e08;
}

.order-status.completed {
  background: rgba(39, 255, 100, 0.14);
  color: #0d6e28;
}

.order-status.refunded {
  background: rgba(128, 128, 128, 0.14);
  color: #555;
}

.order-card-product {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.order-card-product img,
.order-fallback {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  flex: 0 0 auto;
  background: linear-gradient(135deg, #bd4633, #f4b43f);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 22px;
}

.order-product-info {
  display: grid;
  gap: 4px;
}

.order-product-info strong {
  font-size: 16px;
  color: #271d15;
}

.order-product-info span {
  font-size: 13px;
  color: rgba(39, 29, 21, 0.58);
}

.order-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: rgba(39, 29, 21, 0.72);
  margin-bottom: 12px;
}

.order-total {
  margin-left: auto;
  font-weight: 900;
  color: #bd4633;
}

.order-card-address {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(125, 33, 25, 0.08);
  font-size: 13px;
  color: rgba(39, 29, 21, 0.62);
}

.order-card-address span:not(:last-child)::after {
  content: '|';
  margin-left: 10px;
  color: rgba(125, 33, 25, 0.2);
}

.order-card-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.order-card-actions small {
  color: rgba(39, 29, 21, 0.54);
  font-size: 12px;
}

.orders-page .portal-list-state.success {
  color: #125f4c;
  background: rgba(20, 106, 84, 0.12);
}

/* 用户端是亮色页面：复用后台的确认弹窗结构，但换成亮色卡片，避免深色弹窗突兀 */
.orders-page .confirm-modal {
  background: rgba(255, 250, 239, 0.98);
  color: #271d15;
  box-shadow: 0 18px 48px rgba(39, 29, 21, 0.22);
}

.orders-page .confirm-modal h3 {
  color: #271d15;
}

.orders-page .confirm-modal p {
  color: rgba(39, 29, 21, 0.74);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
}

@media (max-width: 640px) {
  .order-card-meta {
    gap: 10px;
  }

  .order-total {
    width: 100%;
    margin-left: 0;
  }

  .order-card-address span:not(:last-child)::after {
    display: none;
  }
}
</style>
