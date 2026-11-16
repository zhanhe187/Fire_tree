<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Building2, CalendarDays, Loader2, MapPinned } from 'lucide-vue-next';
import { ExhibitionItem, fetchExhibition } from '../../services/exhibition';
import { formatChinaDateTime, joinPresent } from '../../../../shared/utils/portalFormatting';
import { renderMarkdown } from '../../../../shared/utils/markdownRenderer';
import '../../../../shared/styles/portalDetail.css';

const props = defineProps<{ exhibitionId: string | number }>();
const router = useRouter();
const exhibition = ref<ExhibitionItem | null>(null);
const loading = ref(false);
const error = ref('');
const coverLoadFailed = ref(false);

function placeText(item: ExhibitionItem) {
  return joinPresent([item.province, item.city]) || '地点待定';
}

const exhibitionCoverUrl = computed(() => {
  if (!exhibition.value || coverLoadFailed.value) return '';
  return exhibition.value.coverUrl || exhibition.value.linkedNodeCoverUrl || '';
});

const exhibitionMarkdown = computed(() => renderMarkdown(exhibition.value?.description));
const approvedProducts = computed(() => (exhibition.value?.linkedProducts ?? []).filter((product) => product.status === 'APPROVED'));

async function load() {
  loading.value = true;
  error.value = '';
  coverLoadFailed.value = false;
  try {
    exhibition.value = await fetchExhibition(Number(props.exhibitionId));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '展览详情加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.exhibitionId, load);
</script>

<template>
  <main class="portal-detail-page museum-detail-page">
    <div class="detail-shell">
      <button class="detail-back-button" type="button" @click="router.push('/exhibitions')">
        <ArrowLeft :size="18" />
        返回展览市集
      </button>

      <div v-if="loading" class="portal-empty">
        <Loader2 :size="22" class="spin" />
        正在加载展览
      </div>
      <div v-else-if="error" class="portal-empty">{{ error }}</div>

      <article v-else-if="exhibition" class="museum-detail-article portal-exhibition-detail">
        <figure v-if="exhibitionCoverUrl" class="detail-cover">
          <img :src="exhibitionCoverUrl" :alt="exhibition.title" @error="coverLoadFailed = true" />
        </figure>

        <header class="detail-header">
          <p class="label-tag">展览市集</p>
          <h1>{{ exhibition.title }}</h1>
          <div class="detail-meta-strip">
            <span><MapPinned :size="15" />{{ placeText(exhibition) }}</span>
            <span><CalendarDays :size="15" />{{ formatChinaDateTime(exhibition.startTime) }} - {{ formatChinaDateTime(exhibition.endTime) }}</span>
            <span><Building2 :size="15" />{{ exhibition.organizer || '非遗运营' }}</span>
          </div>
          <div v-if="exhibition.linkedNodes?.length" class="linked-node-chips">
            <button
              v-for="node in exhibition.linkedNodes"
              :key="node.id"
              type="button"
              class="linked-node-chip"
              @click="router.push(`/heritage/${node.nodeId}`)"
            >
              {{ node.nodeName }}
              <small v-if="node.boothNo">{{ node.nodeTypeName }} · 摊位 {{ node.boothNo }}</small>
              <small v-else>{{ node.nodeTypeName }} / {{ node.nodeCode }}</small>
            </button>
          </div>
        </header>

        <section class="detail-complete-section">
          <div class="portal-detail-body">
            <div class="detail-section-heading">
              <span>展览介绍</span>
              <h2>活动内容</h2>
            </div>
            <div v-if="exhibitionMarkdown" class="markdown-body" v-html="exhibitionMarkdown"></div>
            <p v-else>暂无展览介绍。</p>
          </div>
        </section>

        <section v-if="exhibition.linkedNodes?.length" class="portal-linked-nodes detail-complete-section">
          <h2>关联非遗项目</h2>
          <div class="linked-node-cards">
            <article
              v-for="node in exhibition.linkedNodes"
              :key="node.id"
              class="linked-node-card"
              @click="router.push(`/heritage/${node.nodeId}`)"
            >
              <strong>{{ node.nodeName }}</strong>
              <span>{{ node.nodeTypeName }} / {{ node.nodeCode }}</span>
              <small v-if="node.boothNo">摊位 {{ node.boothNo }}</small>
            </article>
          </div>
        </section>

        <section v-if="approvedProducts.length" class="portal-linked-products detail-complete-section">
          <div class="detail-section-heading">
            <span>市集好物</span>
            <h2>选购文创产品</h2>
          </div>
          <div class="linked-product-cards">
            <button v-for="product in approvedProducts" :key="product.id" type="button" class="linked-product-card" @click="router.push(`/products/${product.productId}`)">
              <img v-if="product.coverUrl" :src="product.coverUrl" :alt="product.productName" />
              <span><strong>{{ product.productName }}</strong><small>{{ product.description || product.productCode }}</small></span>
              <b>¥{{ product.price ?? 0 }}</b>
            </button>
          </div>
        </section>
      </article>
    </div>
  </main>
</template>
