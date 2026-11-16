<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, CheckCircle2, FileImage, ImagePlus, Loader2, ShieldCheck, UploadCloud } from 'lucide-vue-next';
import { GraphNodeItem, fetchGraphNodes } from '../../../graph/services/graph';
import { submitImageMaterial, updateNodeCoverCaption } from '../../services/media';
import { authSession } from '../../../auth/services/authState';
import { getHeritageDisplay } from '../../../../heritage-intro/heritageDisplay';

const router = useRouter();
const nodes = ref<GraphNodeItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const error = ref('');
const message = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref('');

const form = reactive({
  nodeId: '' as string,
  caption: '',
});

const isMaterialAdmin = computed(() => (
  authSession.auth?.user.userType === 'SUPER_ADMIN'
  || authSession.auth?.roles.some((role) => role.roleCode === 'SUPER_ADMIN')
));
const submitModeText = computed(() => (
  isMaterialAdmin.value ? '管理员提交后将直接写入本地并展示' : '普通用户提交后将进入管理员审核，审核通过后展示'
));

// 技法/工具是图谱中间层，没有也不该有封面图，不计入「待补全」。
const GRAPH_ONLY_TYPES = new Set(['craft_technique', 'craft_tool']);

const incompleteItems = computed(() => nodes.value
  .filter((item) => !(item.nodeTypeCode && GRAPH_ONLY_TYPES.has(item.nodeTypeCode)))
  .map((item) => {
    const display = getHeritageDisplay(item);
    return {
      id: item.id,
      name: item.name,
      category: display.category,
      region: item.province || item.city || '地区未设置',
      missingFields: display.missingFields,
      hasCoverImage: display.hasCoverImage,
    };
  })
  .filter((item) => item.missingFields.length > 0));

// 待补全分两类：完全没有图片的，和已有图片但缺图像说明的。
const missingStats = computed(() => ({
  noImage: incompleteItems.value.filter((item) => item.missingFields.includes('图像信息')).length,
  noCaption: incompleteItems.value.filter((item) => item.missingFields.includes('图像说明')).length,
}));

const selectedItem = computed(() => incompleteItems.value.find((item) => String(item.id) === form.nodeId));
// 已有图片的条目：管理员可以不换图、只补图像说明。
const canCaptionOnly = computed(() => isMaterialAdmin.value && Boolean(selectedItem.value?.hasCoverImage));
const selectedFileMeta = computed(() => {
  if (!selectedFile.value) return '';
  const sizeMb = selectedFile.value.size / 1024 / 1024;
  return `${selectedFile.value.name} · ${sizeMb.toFixed(sizeMb >= 1 ? 1 : 2)} MB`;
});

async function loadNodes() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchGraphNodes({ auditStatus: 'APPROVED', page: 1, size: 500 });
    nodes.value = response.items.filter((item) => item.visibility === 'PUBLIC');
    if (!form.nodeId && incompleteItems.value[0]) {
      form.nodeId = String(incompleteItems.value[0].id);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '待补全内容加载失败';
  } finally {
    loading.value = false;
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  selectedFile.value = file;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = file ? URL.createObjectURL(file) : '';
}

async function submitMaterial() {
  const nodeId = Number(form.nodeId);
  if (!authSession.token) {
    await router.push({ path: '/login', query: { redirect: '/material-submit' } });
    return;
  }
  if (!nodeId || !selectedItem.value) {
    error.value = '请选择需要补全资料的内容';
    return;
  }
  if (!selectedFile.value) {
    error.value = '请选择要上传的本地图片文件';
    return;
  }
  if (!selectedFile.value.type.startsWith('image/')) {
    error.value = '只能上传图片文件';
    return;
  }

  submitting.value = true;
  error.value = '';
  message.value = '';
  try {
    const result = await submitImageMaterial({
      nodeId,
      caption: form.caption.trim() || `${selectedItem.value.name}真实图片`,
      file: selectedFile.value,
    });
    message.value = result.directApproved
      ? `已上传并补全「${selectedItem.value.name}」的图片资料`
      : `已提交「${selectedItem.value.name}」的图片资料，待管理员审核通过后展示`;
    form.caption = '';
    selectedFile.value = null;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = '';
    }
    await loadNodes();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '图片提交失败，请确认登录状态和文件格式';
  } finally {
    submitting.value = false;
  }
}

onMounted(loadNodes);

const captionSaving = ref(false);

// 只补图像说明：不新增图片，直接给当前封面写 caption。
async function saveCaptionOnly() {
  if (!authSession.token) {
    await router.push({ path: '/login', query: { redirect: '/material-submit' } });
    return;
  }
  if (!selectedItem.value) {
    error.value = '请选择需要补全资料的内容';
    return;
  }
  const caption = form.caption.trim();
  if (!caption) {
    error.value = '请填写图像说明';
    return;
  }
  captionSaving.value = true;
  error.value = '';
  message.value = '';
  try {
    await updateNodeCoverCaption(selectedItem.value.id, caption);
    message.value = `已为「${selectedItem.value.name}」补充图像说明`;
    form.caption = '';
    await loadNodes();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '图像说明保存失败';
  } finally {
    captionSaving.value = false;
  }
}
</script>

<template>
  <section class="material-submit-page">
    <button class="detail-back-button" type="button" @click="router.push('/explore')">
      <ArrowLeft :size="18" />
      返回浏览
    </button>

    <section class="material-submit-hero">
      <div class="material-submit-hero-copy">
        <p class="label-tag">内容提交</p>
        <h1>补全非遗内容的图片资料</h1>
        <p>{{ submitModeText }}。还没有图片的内容请上传本地图片；已有图片只缺说明的，可以直接补写图像说明。</p>
      </div>
      <div class="material-submit-stats" aria-label="资料补全状态">
        <article>
          <FileImage :size="20" />
          <span>待补全</span>
          <strong>{{ incompleteItems.length }}</strong>
          <small>缺图 {{ missingStats.noImage }} · 缺说明 {{ missingStats.noCaption }}</small>
        </article>
        <article>
          <ShieldCheck :size="20" />
          <span>提交模式</span>
          <strong>{{ isMaterialAdmin ? '直接生效' : '待审核' }}</strong>
        </article>
      </div>
    </section>

    <div v-if="loading" class="heritage-list-state">正在加载待补全内容</div>
    <div v-else-if="error" class="heritage-list-state error">{{ error }}</div>

    <section v-else class="material-submit-layout">
      <aside class="material-submit-list">
        <div class="material-panel-heading material-list-heading">
          <div>
            <p class="label-tag">待补全列表</p>
            <h2>选择内容</h2>
            <span>缺图的请上传图片，已有图的只需补写说明</span>
          </div>
        </div>
        <div class="material-submit-scroll">
        <button
          v-for="item in incompleteItems"
          :key="item.id"
          type="button"
          :class="{ active: form.nodeId === String(item.id) }"
          @click="form.nodeId = String(item.id)"
        >
          <strong>{{ item.name }}</strong>
          <span>{{ item.region }} · {{ item.category }}</span>
          <em>{{ item.hasCoverImage ? '已有图片，缺少：' : '缺少：' }}{{ item.missingFields.join('、') }}</em>
        </button>
        <div v-if="incompleteItems.length === 0" class="material-complete-state">当前没有待补全资料</div>
        </div>
      </aside>

      <form class="material-upload-card" @submit.prevent="submitMaterial">
        <div class="material-upload-summary">
          <p class="label-tag">{{ canCaptionOnly ? '补写说明 / 更换图片' : '上传图片' }}</p>
          <h2>{{ selectedItem?.name || '请选择内容' }}</h2>
          <span>{{ selectedItem ? `${selectedItem.region} · ${selectedItem.category}` : '从左侧列表选择需要补全的内容' }}</span>
          <em v-if="selectedItem">{{ selectedItem.hasCoverImage ? '已有图片，缺少：' : '缺少：' }}{{ selectedItem.missingFields.join('、') }}</em>
        </div>

        <div class="material-upload-main">
          <label class="material-file-drop" :class="{ ready: previewUrl }">
            <input type="file" accept="image/*" @change="handleFileChange" />
            <img v-if="previewUrl" :src="previewUrl" alt="待提交图片预览" />
            <span v-else>
              <ImagePlus :size="34" />
              <strong>选择本地图片文件</strong>
              <small>支持 JPG / PNG / WEBP 等图片格式</small>
            </span>
          </label>

          <div class="material-upload-side">
            <div class="material-upload-tip">
              <CheckCircle2 :size="18" />
              <span>{{ selectedFileMeta || '选择图片后将在左侧预览' }}</span>
            </div>
            <label class="material-upload-field">
              <span>图像说明</span>
              <input v-model="form.caption" type="text" placeholder="例如：梁祝传说相关场景图 / 官方展演图" />
            </label>
            <button class="material-upload-submit" type="submit" :disabled="submitting || incompleteItems.length === 0">
              <Loader2 v-if="submitting" :size="18" class="spin" />
              <UploadCloud v-else :size="18" />
              {{ submitting ? '提交中…' : (isMaterialAdmin ? '上传并直接更新' : '上传并提交审核') }}
            </button>
            <button
              v-if="canCaptionOnly"
              class="material-upload-caption-only"
              type="button"
              :disabled="captionSaving || !form.caption.trim()"
              @click="saveCaptionOnly"
            >
              <Loader2 v-if="captionSaving" :size="18" class="spin" />
              <CheckCircle2 v-else :size="18" />
              {{ captionSaving ? '保存中…' : '只补图像说明' }}
            </button>
            <p v-if="message" class="material-message success">{{ message }}</p>
            <p v-if="error" class="material-message error">{{ error }}</p>
          </div>
        </div>
      </form>
    </section>
  </section>
</template>
