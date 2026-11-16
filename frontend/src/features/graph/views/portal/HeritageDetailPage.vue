<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, BookOpen, ExternalLink, FileText, Heart, Image, Loader2, MapPin, Music2, PlaySquare, Tag } from 'lucide-vue-next';
import { getHeritageDisplay } from '../../../../heritage-intro/heritageDisplay';
import { createFavoriteNode } from '../../../favorite/services/favorite';
import { GraphNodeItem, GraphNodeMediaItem, fetchGraphNode, fetchGraphNodeMediaFiles } from '../../services/graph';
import { MediaFileItem, fetchMediaFiles } from '../../../media/services/media';
import { resolveMediaUrl } from '../../../../shared/utils/mediaUrl';
import { authSession, currentUser } from '../../../auth/services/authState';

const props = defineProps<{ nodeId: string | number }>();
const router = useRouter();
const loading = ref(false);
const mediaLoading = ref(false);
const savingLearning = ref(false);
const error = ref('');
const successMessage = ref('');
const node = ref<GraphNodeItem | null>(null);
const imageLoadFailed = ref(false);

const regionText = computed(() => [node.value?.province, node.value?.city, node.value?.district].filter(Boolean).join(' / '));
const display = computed(() => getHeritageDisplay(node.value || {}));
const displayCategory = computed(() => display.value.category);
const displayedCoverImage = computed(() => (imageLoadFailed.value ? '' : display.value.coverImageUrl));
const bodyText = computed(() => display.value.content);
const paragraphs = computed(() => bodyText.value.split(/\n+/).map((item) => item.trim()).filter(Boolean));
const relatedMediaFiles = computed(() => node.value?.mediaFiles ?? []);
const detailFacts = computed(() => [
  { label: '项目类别', value: displayCategory.value },
  { label: '保护级别', value: display.value.projectLevel || '待完善' },
  { label: '所在地区', value: regionText.value || '地区未设置' },
  { label: '数据来源', value: display.value.sourceName || node.value?.nodeTypeName || '非遗数据库' },
]);
const activeUserId = computed(() => currentUser.value?.id ?? 0);
const isSignedIn = computed(() => Boolean(authSession.token && activeUserId.value));

const mediaTypeLabels: Record<GraphNodeMediaItem['fileType'], string> = {
  IMAGE: '图片资料',
  VIDEO: '视频资料',
  AUDIO: '音频资料',
  DOCUMENT: '文档资料',
  OTHER: '其他资料',
};

const mediaTypeIcons: Record<GraphNodeMediaItem['fileType'], typeof Image> = {
  IMAGE: Image,
  VIDEO: PlaySquare,
  AUDIO: Music2,
  DOCUMENT: FileText,
  OTHER: FileText,
};

async function loadNode() {
  loading.value = true;
  error.value = '';
  try {
    imageLoadFailed.value = false;
    const nodeDetail = await fetchGraphNode(props.nodeId);
    node.value = {
      ...nodeDetail,
      mediaFiles: await loadRelatedMediaFiles(props.nodeId, nodeDetail.mediaFiles),
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : '非遗详情加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadRelatedMediaFiles(nodeId: string | number, existing: GraphNodeMediaItem[] | undefined) {
  if (existing && existing.length > 0) return existing;
  mediaLoading.value = true;
  try {
    const response = await fetchGraphNodeMediaFiles(nodeId);
    return response.items;
  } catch {
    const response = await fetchMediaFiles({ nodeId: Number(nodeId), auditStatus: 'APPROVED', page: 1, size: 100 });
    return response.items
      .filter((item) => item.visibility === 'PUBLIC' && item.auditStatus === 'APPROVED')
      .map(mediaFileToNodeMedia);
  } finally {
    mediaLoading.value = false;
  }
}

function mediaPreviewUrl(media: GraphNodeMediaItem) {
  return resolveMediaUrl(media.previewUrl || media.objectKey);
}

function isImageMedia(media: GraphNodeMediaItem) {
  return media.fileType === 'IMAGE';
}

function mediaTitle(media: GraphNodeMediaItem) {
  return media.caption || media.originalName || mediaTypeLabels[media.fileType] || '多媒体资料';
}

function mediaFileToNodeMedia(file: MediaFileItem): GraphNodeMediaItem {
  return {
    linkId: file.id,
    id: file.id,
    fileId: file.id,
    bucketName: file.bucketName,
    objectKey: file.objectKey,
    originalName: file.originalName,
    fileType: file.fileType,
    contentType: file.contentType,
    fileSize: file.fileSize,
    previewUrl: file.previewUrl,
    caption: file.captions?.split(',').map((item) => item.trim()).filter(Boolean)[0],
    sortOrder: 0,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

function formatMediaSize(value?: number) {
  const bytes = Number(value ?? 0);
  if (!bytes) return '大小未记录';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function addToLearning() {
  if (!node.value) return;
  if (!isSignedIn.value) {
    await router.push({ path: '/login', query: { redirect: '/heritage/' + props.nodeId } });
    return;
  }
  savingLearning.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createFavoriteNode({ userId: activeUserId.value, nodeId: node.value.id, note: '' });
    successMessage.value = '已加入收藏学习清单';
  } catch {
    successMessage.value = '该项目已在收藏学习清单中';
  } finally {
    savingLearning.value = false;
  }
}

onMounted(loadNode);
watch(() => props.nodeId, loadNode);
</script>

<template>
  <section class="heritage-detail-page">
    <button class="detail-back-button" type="button" @click="router.push('/explore')">
      <ArrowLeft :size="18" />
      返回浏览
    </button>

    <div v-if="loading" class="heritage-detail-state">正在加载非遗档案</div>
    <div v-else-if="error" class="heritage-detail-state error">{{ error }}</div>
    <div v-if="successMessage" class="heritage-detail-toast">{{ successMessage }}</div>

    <article v-else-if="node" class="heritage-detail-shell">
      <figure class="heritage-detail-cover" :class="{ 'has-image': displayedCoverImage }">
        <div class="heritage-detail-image-stage">
          <img v-if="displayedCoverImage" :src="displayedCoverImage" :alt="display.coverImageCaption || node.name" @error="imageLoadFailed = true" />
          <div v-else class="heritage-detail-cover-fallback">
            <strong>暂无图像信息</strong>
            <span>管理员可在后台为「{{ node.name }}」补充展示图片。</span>
          </div>
        </div>
        <figcaption>
          <span>{{ display.coverImageCaption || '暂无图像说明' }}</span>
          <small>{{ displayCategory }}</small>
        </figcaption>
      </figure>

      <div class="heritage-detail-copy">
        <p class="label-tag">{{ displayCategory }}</p>
        <h1>{{ node.name }}</h1>
        <p v-if="node.alias" class="heritage-detail-alias">{{ node.alias }}</p>
        <div class="heritage-detail-meta">
          <span><MapPin :size="16" />{{ regionText || '地区未设置' }}</span>
          <span><BookOpen :size="16" />{{ display.projectLevel || '级别未设置' }}</span>
          <span><Tag :size="16" />{{ display.nodeTypeName }}</span>
        </div>
        <div class="heritage-detail-actions">
          <button class="detail-learning-button" type="button" :disabled="savingLearning" @click="addToLearning">
            <Loader2 v-if="savingLearning" :size="17" class="spin" />
            <Heart v-else :size="17" />
            {{ isSignedIn ? '加入收藏学习' : '登录后加入学习' }}
          </button>
          <button class="detail-secondary-button" type="button" @click="router.push('/favorites')">查看学习清单</button>
        </div>
        <p v-if="display.summary" class="heritage-detail-summary">{{ display.summary }}</p>
        <p class="heritage-detail-admin-note">本页图片、摘要、正文、节点信息和挂接资料均可由管理员在后台维护。</p>
        <div class="heritage-detail-facts" aria-label="非遗档案要点">
          <div v-for="fact in detailFacts" :key="fact.label">
            <span>{{ fact.label }}</span>
            <strong>{{ fact.value }}</strong>
          </div>
        </div>
        <div class="heritage-detail-body">
          <p v-for="paragraph in paragraphs" :key="paragraph">{{ paragraph }}</p>
        </div>
        <section v-if="relatedMediaFiles.length || mediaLoading" class="heritage-related-media">
          <div class="detail-section-heading">
            <span>相关资料</span>
            <h2>挂接到该节点的多媒体档案</h2>
            <small>{{ mediaLoading ? '正在读取挂接资料' : `共 ${relatedMediaFiles.length} 项资料` }}</small>
          </div>
          <div v-if="mediaLoading" class="heritage-media-loading">
            <Loader2 :size="18" class="spin" />
            <span>正在同步多媒体资料</span>
          </div>
          <div v-else class="heritage-media-grid">
            <article v-for="media in relatedMediaFiles" :key="media.linkId" class="heritage-media-card" :class="media.fileType.toLowerCase()">
              <div class="heritage-media-preview">
                <img v-if="isImageMedia(media) && mediaPreviewUrl(media)" :src="mediaPreviewUrl(media)" :alt="mediaTitle(media)" />
                <audio v-else-if="media.fileType === 'AUDIO' && mediaPreviewUrl(media)" :src="mediaPreviewUrl(media)" controls />
                <video v-else-if="media.fileType === 'VIDEO' && mediaPreviewUrl(media)" :src="mediaPreviewUrl(media)" controls playsinline />
                <div v-else>
                  <component :is="mediaTypeIcons[media.fileType]" :size="28" />
                  <span>{{ mediaTypeLabels[media.fileType] }}</span>
                </div>
              </div>
              <div class="heritage-media-copy">
                <span>{{ mediaTypeLabels[media.fileType] }}</span>
                <strong>{{ mediaTitle(media) }}</strong>
                <small>{{ formatMediaSize(media.fileSize) }} · {{ media.contentType || '类型未记录' }}</small>
                <a v-if="mediaPreviewUrl(media)" :href="mediaPreviewUrl(media)" target="_blank" rel="noreferrer">
                  查看原始资料
                  <ExternalLink :size="14" />
                </a>
              </div>
            </article>
          </div>
        </section>
        <a v-if="node.sourceUrl" class="heritage-source-link" :href="node.sourceUrl" target="_blank" rel="noreferrer">
          <BookOpen :size="16" />查看官方来源<ExternalLink :size="15" />
        </a>
      </div>
    </article>
  </section>
</template>
