<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Loader2, MessageCircle, Package, Send, ShoppingBag, Star, Tag, X } from 'lucide-vue-next';
import { fetchMediaFile } from '../../../media/services/media';
import { ProductItem, createProductReview, fetchProduct, purchaseProduct } from '../../services/product';
import { resolveMediaUrl } from '../../../../shared/utils/mediaUrl';
import { authSession } from '../../../auth/services/authState';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';
import '../../../../shared/styles/portalDetail.css';

const props = defineProps<{ productId: string | number }>();
const router = useRouter();
const product = ref<ProductItem | null>(null);
const loading = ref(false);
const submitting = ref(false);
const purchasing = ref(false);
const showPurchaseModal = ref(false);
const error = ref('');
const successMessage = ref('');
// 购买区就近反馈：购买成功/失败直接显示在下单按钮旁，不依赖右侧评价面板
const purchaseFeedback = ref('');
const purchaseFeedbackTone = ref<'success' | 'error'>('success');
const coverLoadFailed = ref(false);
const resolvedCoverUrl = ref('');
// 每次打开下单弹窗生成一个幂等键：提交重试/双击只会落到同一张订单
const purchaseIdempotencyKey = ref('');

const reviewForm = reactive({
  rating: 5,
  content: '',
});

const purchaseForm = reactive({
  quantity: 1,
  address: '',
  contactName: '',
  contactPhone: '',
});

const currentUserName = computed(() => authSession.auth?.user.nickname || authSession.auth?.user.username || '');
// 后端禁止购买自己上架的文创（防刷单），这里提前识别，避免点了才报错
const isOwnProduct = computed(() => {
  const ownerId = product.value?.ownerUserId;
  const userId = authSession.auth?.user?.id;
  return Boolean(ownerId && userId && Number(ownerId) === Number(userId));
});
const productMarkdown = computed(() => renderMarkdown(product.value?.description));
const productReviews = computed(() => product.value?.reviews ?? []);
const productCoverUrl = computed(() => {
  if (!product.value || coverLoadFailed.value) return '';
  return resolveMediaUrl(product.value.coverUrl || resolvedCoverUrl.value);
});

function stars(value: number) {
  return Math.max(0, Math.min(5, Math.round(Number(value ?? 0))));
}

function formatPrice(value?: number) {
  if (value === undefined || value === null) return '未定价';
  return `¥${Number(value).toFixed(2)}`;
}

function formatTotal() {
  if (!product.value?.price) return '未定价';
  return `¥${(product.value.price * Math.max(1, purchaseForm.quantity)).toFixed(2)}`;
}

function setPurchaseFeedback(tone: 'success' | 'error', message: string) {
  purchaseFeedbackTone.value = tone;
  purchaseFeedback.value = message;
}

async function submitPurchase() {
  if (!product.value) return;
  if (!authSession.auth?.user.id) {
    setPurchaseFeedback('error', '请先登录后再购买。');
    return;
  }
  if (isOwnProduct.value) {
    setPurchaseFeedback('error', '这是你自己上架的文创，不能购买自己的产品。');
    return;
  }
  const quantity = Math.max(1, purchaseForm.quantity);
  if ((product.value.stock ?? 0) < quantity) {
    setPurchaseFeedback('error', '库存不足，请减少购买数量。');
    return;
  }
  purchasing.value = true;
  purchaseFeedback.value = '';
  try {
    const result = await purchaseProduct(product.value.id, {
      quantity,
      address: purchaseForm.address,
      contactName: purchaseForm.contactName,
      contactPhone: purchaseForm.contactPhone,
    }, purchaseIdempotencyKey.value || undefined);
    showPurchaseModal.value = false;
    // 先刷新（刷新不再清空提示），再写提示，避免成功文案被 loadProduct 擦掉
    await loadProduct();
    setPurchaseFeedback(
      'success',
      result.reused
        ? `该订单已提交过，未重复下单：${result.orderNo}`
        : `购买成功，订单已生成：${result.orderNo}`,
    );
  } catch (err) {
    setPurchaseFeedback('error', err instanceof Error ? err.message : '购买失败，请稍后重试。');
  } finally {
    purchasing.value = false;
  }
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function openPurchase() {
  if (!authSession.auth?.user.id) {
    setPurchaseFeedback('error', '请先登录后再购买。');
    return;
  }
  if (isOwnProduct.value) {
    setPurchaseFeedback('error', '这是你自己上架的文创，不能购买自己的产品。');
    return;
  }
  purchaseForm.quantity = 1;
  purchaseForm.address = '';
  purchaseForm.contactName = authSession.auth.user.nickname || authSession.auth.user.username || '';
  purchaseForm.contactPhone = '';
  purchaseIdempotencyKey.value = createIdempotencyKey();
  showPurchaseModal.value = true;
}

/**
 * 只负责拉取产品数据，不再清空提示消息。
 * 之前这里清空 successMessage，导致购买成功/评价成功的文案刚写入就被擦掉。
 */
async function loadProduct() {
  loading.value = true;
  coverLoadFailed.value = false;
  resolvedCoverUrl.value = '';
  try {
    product.value = await fetchProduct(Number(props.productId));
    if (!product.value.coverUrl && product.value.coverFileId) {
      const media = await fetchMediaFile(product.value.coverFileId);
      resolvedCoverUrl.value = media.previewUrl ?? '';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文创产品详情加载失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

async function submitReview() {
  if (!product.value) return;
  if (!authSession.auth?.user.username) {
    error.value = '请先登录后再发布评价。';
    return;
  }
  submitting.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createProductReview(product.value.id, {
      rating: reviewForm.rating,
      content: reviewForm.content,
    });
    reviewForm.content = '';
    successMessage.value = '评价已发布，感谢留下真实体验。';
    await loadProduct();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '评价发布失败，请修改后重试。';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  error.value = '';
  successMessage.value = '';
  purchaseFeedback.value = '';
  void loadProduct();
});
watch(() => props.productId, () => {
  error.value = '';
  successMessage.value = '';
  purchaseFeedback.value = '';
  void loadProduct();
});
</script>

<template>
  <main class="portal-detail-page product-detail-page">
    <div class="detail-shell product-detail-shell">
      <button class="detail-back-button" type="button" @click="router.push('/products')">
        <ArrowLeft :size="18" />
        返回文创产品
      </button>

      <div v-if="loading" class="portal-empty">
        <Loader2 :size="22" class="spin" />
        正在加载文创产品
      </div>
      <div v-else-if="error && !product" class="portal-empty">{{ error }}</div>

      <article v-else-if="product" class="product-detail-layout">
        <section class="product-detail-main">
          <figure class="product-detail-cover">
            <img v-if="productCoverUrl" :src="productCoverUrl" :alt="product.name" @error="coverLoadFailed = true" />
            <div v-else class="product-detail-cover-fallback">{{ product.name.slice(0, 1) }}</div>
          </figure>

          <header class="detail-header product-detail-header">
            <p class="label-tag">非遗文创</p>
            <h1>{{ product.name }}</h1>
            <div class="detail-meta-strip">
              <span><Tag :size="15" />{{ product.relatedNodeName || '未绑定非遗节点' }}</span>
              <span><ShoppingBag :size="15" />{{ formatPrice(product.price) }}</span>
              <span v-if="product.stock !== undefined"><Package :size="15" />库存 {{ product.stock }} 件</span>
              <span><Star :size="15" />{{ Number(product.averageRating ?? 0).toFixed(1) }} 分</span>
            </div>
            <div class="product-purchase-row">
              <button
                class="primary-action"
                type="button"
                :disabled="purchasing || isOwnProduct || (product.stock ?? 0) <= 0"
                @click="openPurchase"
              >
                <Loader2 v-if="purchasing" :size="16" class="spin" />
                <ShoppingBag v-else :size="16" />
                {{ isOwnProduct ? '这是你上架的文创' : ((product.stock ?? 0) <= 0 ? '暂时缺货' : '立即购买') }}
              </button>
            </div>
            <p
              v-if="purchaseFeedback"
              class="product-purchase-feedback"
              :class="purchaseFeedbackTone"
            >
              {{ purchaseFeedback }}
            </p>
            <p v-else-if="isOwnProduct" class="product-purchase-feedback muted">
              不能购买自己上架的文创，请使用其他账号下单。
            </p>
          </header>

          <section class="detail-complete-section">
            <div class="portal-detail-body">
              <div class="detail-section-heading">
                <span>产品说明</span>
                <h2>工艺与使用场景</h2>
              </div>
              <div v-if="productMarkdown" class="markdown-body product-description-markdown" v-html="productMarkdown"></div>
              <p v-else>暂无产品说明，等待上架方补充工艺、材质与使用场景。</p>
            </div>
          </section>
        </section>

        <aside class="product-review-panel product-detail-review-panel">
          <div class="product-score-card">
            <figure v-if="productCoverUrl" class="product-score-cover">
              <img :src="productCoverUrl" :alt="product.name" />
            </figure>
            <span>当前评分</span>
            <h2>{{ product.name }}</h2>
            <div>
              <strong>{{ Number(product.averageRating ?? 0).toFixed(1) }}</strong>
              <small>{{ product.ratingCount }} 条评价 · {{ formatPrice(product.price) }}</small>
            </div>
            <div class="rating-stars">
              <Star v-for="index in 5" :key="index" :size="17" :class="{ on: index <= stars(product.averageRating) }" />
            </div>
          </div>

          <div v-if="error" class="portal-list-state error compact">{{ error }}</div>
          <div v-if="successMessage" class="portal-list-state compact">{{ successMessage }}</div>

          <form @submit.prevent="submitReview">
            <label>
              <span>评价用户</span>
              <input :value="currentUserName || '请先登录'" type="text" disabled />
            </label>
            <label>
              <span>评分</span>
              <select v-model.number="reviewForm.rating">
                <option :value="5">5 星</option>
                <option :value="4">4 星</option>
                <option :value="3">3 星</option>
                <option :value="2">2 星</option>
                <option :value="1">1 星</option>
              </select>
            </label>
            <label>
              <span>评价内容</span>
              <textarea v-model="reviewForm.content" rows="4" placeholder="写下使用体验、工艺印象或改进建议" />
            </label>
            <button class="btn compact solid" type="submit" :disabled="submitting">
              <Loader2 v-if="submitting" :size="16" class="spin" />
              <Send v-else :size="16" />
              发布评价
            </button>
          </form>

          <div class="product-review-list">
            <article v-for="review in productReviews" :key="review.id">
              <div>
                <strong>{{ review.userName }}</strong>
                <span>{{ review.rating }} 星</span>
              </div>
              <p>{{ review.content || '未填写文字评价' }}</p>
            </article>
            <div v-if="productReviews.length === 0" class="review-empty">
              <MessageCircle :size="18" />
              <span>还没有评价，成为第一位留下体验的人。</span>
            </div>
          </div>
        </aside>
      </article>
    </div>

    <div v-if="showPurchaseModal" class="modal-backdrop" @click.self="showPurchaseModal = false">
      <section class="node-modal purchase-modal">
        <header>
          <div>
            <p class="eyebrow">确认订单</p>
            <h3>{{ product?.name }}</h3>
          </div>
          <button class="icon-only" type="button" @click="showPurchaseModal = false">
            <X :size="18" />
          </button>
        </header>
        <div class="form-grid">
          <div class="purchase-summary">
            <span class="purchase-modal">单价：{{ formatPrice(product?.price) }}</span>
            <span class="purchase-modal">合计：{{ formatTotal() }}</span>
          </div>
          <label>
            <span>购买数量</span>
            <input v-model.number="purchaseForm.quantity" type="number" min="1" :max="product?.stock ?? 1" />
          </label>
          <label class="wide">
            <span>收货地址</span>
            <input v-model="purchaseForm.address" type="text" placeholder="省 / 市 / 区 / 详细地址" />
          </label>
          <label>
            <span>联系人</span>
            <input v-model="purchaseForm.contactName" type="text" />
          </label>
          <label>
            <span>联系电话</span>
            <input v-model="purchaseForm.contactPhone" type="tel" />
          </label>
          <p class="purchase-note">当前为模拟支付，提交后订单即视为已付款，库存实时扣减。</p>
        </div>
        <footer>
          <button class="secondary-action" type="button" @click="showPurchaseModal = false">取消</button>
          <button class="primary-action" type="button" :disabled="purchasing" @click="submitPurchase">
            <Loader2 v-if="purchasing" :size="16" class="spin" />
            <ShoppingBag v-else :size="16" />
            确认购买
          </button>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.product-purchase-feedback {
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;
  border: 1px solid transparent;
}

.product-purchase-feedback.success {
  border-color: rgba(64, 145, 108, 0.42);
  background: rgba(64, 145, 108, 0.14);
  color: #a8e0c2;
}

.product-purchase-feedback.error {
  border-color: rgba(185, 71, 53, 0.42);
  background: rgba(147, 0, 10, 0.14);
  color: #ffb4ab;
}

.product-purchase-feedback.muted {
  border-color: rgba(216, 170, 84, 0.3);
  background: rgba(216, 170, 84, 0.08);
  color: var(--muted, #d3c1aa);
}

.product-detail-page .purchase-modal {
  --purchase-modal-surface: #1b1511;
  --purchase-modal-surface-raised: #120f0d;
  --purchase-modal-ink: #fff4df;
  --purchase-modal-muted: #d3c1aa;
  --purchase-modal-placeholder: #a99984;
  --purchase-modal-line: rgba(216, 170, 84, 0.38);
  color: var(--purchase-modal-ink);
  background:
    linear-gradient(180deg, rgba(255, 244, 220, 0.055), transparent 46%),
    var(--purchase-modal-surface);
}

.purchase-modal h3,
.purchase-modal .purchase-summary {
  color: var(--purchase-modal-ink);
}

.purchase-modal .form-grid label > span,
.purchase-modal .purchase-note {
  color: var(--purchase-modal-muted);
}

.purchase-modal .form-grid input {
  border-color: var(--purchase-modal-line);
  background: var(--purchase-modal-surface-raised);
  color: var(--purchase-modal-ink);
  caret-color: #f0bd61;
}

.purchase-modal input::placeholder {
  color: var(--purchase-modal-placeholder);
  opacity: 1;
}

.purchase-modal .icon-only,
.purchase-modal .secondary-action {
  color: var(--purchase-modal-ink);
}

.purchase-modal :is(input, button):focus-visible {
  outline: 2px solid #f0bd61;
  outline-offset: 2px;
}
</style>
