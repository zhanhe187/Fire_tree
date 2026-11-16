<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ImagePlus, ListMusic, LockKeyhole, Package, Pause, Play, Save, SkipBack, SkipForward, UserRound } from 'lucide-vue-next';
import { changeCurrentUserPassword, updateCurrentUserProfile, uploadCurrentUserAvatar } from '../services/auth';
import { ProductOrderItem, fetchProductOrders } from '../../product/services/product';
import { resolveMediaUrl } from '../../../shared/utils/mediaUrl';
import { authSession, currentUser, setAuthSession } from '../services/authState';
import Hyperspeed from '../../../shared/components/Hyperspeed.vue';

type LyricLine = {
  time: number;
  text: string;
};

type Song = {
  id: number;
  title: string;
  artist: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  lyrics: LyricLine[];
};

const router = useRouter();
const profileSaving = reactive({ active: false });
const passwordSaving = reactive({ active: false });
const avatarUploading = ref(false);
const AVATAR_MAX_SIZE = 640;
const AVATAR_UPLOAD_QUALITY = 0.82;
const messages = reactive({
  profileError: '',
  profileSuccess: '',
  passwordError: '',
  passwordSuccess: '',
});

const profileForm = reactive({
  nickname: '',
  realName: '',
  phone: '',
  email: '',
  avatarUrl: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const profileHyperspeedOptions = {
  distortion: 'turbulentDistortion',
  length: 520,
  roadWidth: 11,
  islandWidth: 2.2,
  lanesPerRoad: 4,
  fov: 92,
  fovSpeedUp: 148,
  speedUp: 2.25,
  carLightsFade: 0.42,
  totalSideLightSticks: 26,
  lightPairsPerRoadWay: 46,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.55,
  lightStickWidth: [0.12, 0.42] as [number, number],
  lightStickHeight: [1.4, 2.2] as [number, number],
  movingAwaySpeed: [66, 92] as [number, number],
  movingCloserSpeed: [-150, -196] as [number, number],
  carLightsLength: [18, 120] as [number, number],
  carLightsRadius: [0.045, 0.13] as [number, number],
  carWidthPercentage: [0.28, 0.48] as [number, number],
  carShiftX: [-0.75, 0.75] as [number, number],
  carFloorSeparation: [0, 5] as [number, number],
  colors: {
    roadColor: 0x030406,
    islandColor: 0x06090d,
    background: 0x020407,
    shoulderLines: 0x7de9ff,
    brokenLines: 0xf7dfad,
    leftCars: [0xd856bf, 0xff4757, 0xf4b43f],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x27ff64],
    sticks: [0x03b3c3, 0xf4b43f, 0xff4757],
  },
};

const songSeeds = [
  { id: 30352891, title: '牵丝戏', artist: '银临 / Aki阿杰', duration: 239, coverUrl: 'https://p1.music.126.net/Nd86SOcyCxU5Qu7jdZn_MQ==/7725168696876736.jpg?param=360y360' },
  { id: 1454730043, title: '赤伶', artist: '李玉刚', duration: 300, coverUrl: 'https://p1.music.126.net/0el5yaTEo3KjeJjL3ZXxmg==/109951165054951989.jpg?param=360y360' },
  { id: 1911377814, title: '鸳鸯债', artist: 'Uri / 喵酱', duration: 147, coverUrl: 'https://p1.music.126.net/ZrWgJqLD75XvALUIT7E9TQ==/109951166924195228.jpg?param=360y360' },
  { id: 1297802566, title: '十年人间', artist: '李常超', duration: 277, coverUrl: 'https://p1.music.126.net/TdqG8yFWSZgQqH2K235MgA==/109951163434990771.jpg?param=360y360' },
  { id: 2005252136, title: '相思遥', artist: '魏玉慧', duration: 193, coverUrl: 'https://p1.music.126.net/e1Q5ANvBtL3jLgPyQjc-NA==/109951168129929242.jpg?param=360y360' },
  { id: 1479526505, title: '虞兮叹', artist: '闻人听書_', duration: 210, coverUrl: 'https://p1.music.126.net/6gdwWjPXUkyTx4CuuSxkIg==/109951165319864977.jpg?param=360y360' },
  { id: 1913206466, title: '西厢寻他', artist: '伯爵Johnny / 唐伯虎Annie', duration: 224, coverUrl: 'https://p1.music.126.net/0emB6yNDS1d-SyIPC8nWIw==/109951166953218034.jpg?param=360y360' },
  { id: 2625746775, title: '壁上观', artist: '龚琳娜', duration: 223, coverUrl: 'https://p1.music.126.net/eZEjSm4b1iLIRpIeC9-dBA==/109951169950184961.jpg?param=360y360' },
  { id: 1451720450, title: '一笑江湖', artist: '闻人听書_', duration: 209, coverUrl: 'https://p1.music.126.net/SAK07yVLa64lR7HBGKmw7w==/109951165024026423.jpg?param=360y360' },
  { id: 30500857, title: '青丝', artist: '时光胶囊', duration: 293, coverUrl: 'https://p1.music.126.net/szRyfZ3Dgq6OTe-b4VYtyg==/7775746231888644.jpg?param=360y360' },
];

const songs = reactive<Song[]>(songSeeds.map((song) => ({
  ...song,
  audioUrl: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
  lyrics: [
    { time: 0, text: song.title },
    { time: Math.round(song.duration * 0.18), text: song.artist },
    { time: Math.round(song.duration * 0.38), text: '网易云歌单 · 国风戏腔' },
    { time: Math.round(song.duration * 0.58), text: '让旋律在个人档案里发光' },
    { time: Math.round(song.duration * 0.78), text: '非遗记忆，继续向前' },
  ],
})));

const displayName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '未登录用户');
const avatarInitial = computed(() => displayName.value.slice(0, 1).toUpperCase());
const displayAvatarUrl = computed(() => resolveMediaUrl(profileForm.avatarUrl));
const userTypeLabel = computed(() => {
  switch (currentUser.value?.userType) {
    case 'SUPER_ADMIN':
      return '超级管理员';
    case 'INHERITOR':
      return '传承人';
    case 'NORMAL':
      return '普通用户';
    default:
      return '未登录';
  }
});

const myOrders = ref<ProductOrderItem[]>([]);
const ordersLoading = ref(false);
const ordersError = ref('');

async function loadMyOrders() {
  ordersLoading.value = true;
  ordersError.value = '';
  try {
    // 个人中心只展示"我买到的"，与"我的订单"页口径一致
    const response = await fetchProductOrders({ direction: 'BUYING', page: 1, size: 20 });
    myOrders.value = response.items;
  } catch (err) {
    ordersError.value = err instanceof Error ? err.message : '订单加载失败';
  } finally {
    ordersLoading.value = false;
  }
}

const sceneRef = ref<HTMLElement | null>(null);
const audioPlayerRef = ref<HTMLAudioElement | null>(null);
const songProgressRef = ref<HTMLElement | null>(null);
const songListRef = ref<HTMLElement | null>(null);
const lyricsContainerRef = ref<HTMLElement | null>(null);
const visualizerBars = Array.from({ length: 50 }, (_, index) => index);
const barHeights = ref(visualizerBars.map(() => 10));
const selectedSongIndex = ref(0);
const menuFocusIndex = ref(0);
const songMenuOpen = ref(false);
const isPlaying = ref(false);
const currentTime = ref(0);
const lyricsExpanded = ref(false);
const lyricPreviewing = ref(false);
const progressDragging = ref(false);
const sceneDragging = ref(false);
const smoothRotateX = ref(0);
const smoothRotateY = ref(0);
const progressStretch = reactive({
  stretch: 1,
  squash: 1,
  thumbX: 0,
});

let targetRotateX = 0;
let targetRotateY = 0;
let baseRotateX = 0;
let baseRotateY = 0;
let dragStartX = 0;
let dragStartY = 0;
let sceneFrameId = 0;
let visualizerFrameId = 0;
let playbackFrameId = 0;
let progressFrameId = 0;
let lyricPreviewTimer: ReturnType<typeof setTimeout> | null = null;
let lyricRequestToken = 0;
const lyricCache = new Map<number, LyricLine[]>();

const currentSong = computed(() => songs[selectedSongIndex.value]);
const activeLyricIndex = computed(() => getActiveLyricIndex());
const progressPercent = computed(() => {
  const duration = getSongDuration();
  return `${Math.max(0, Math.min(currentTime.value / duration, 1)) * 100}%`;
});
const sceneStyle = computed(() => ({
  '--rx': `${smoothRotateX.value.toFixed(3)}deg`,
  '--ry': `${smoothRotateY.value.toFixed(3)}deg`,
}));
const containerStyle = computed(() => ({
  transform: `rotateX(${smoothRotateX.value.toFixed(3)}deg) rotateY(${smoothRotateY.value.toFixed(3)}deg)`,
}));
const progressStyle = computed(() => ({
  '--progress': progressPercent.value,
  '--stretch': progressStretch.stretch.toFixed(3),
  '--squash': progressStretch.squash.toFixed(3),
  '--thumb-x': `${progressStretch.thumbX.toFixed(1)}px`,
}));

watch(
  currentUser,
  (user) => {
    if (!user) {
      if (!authSession.token) {
        void router.push({ path: '/login', query: { redirect: '/profile' } });
      }
      return;
    }

    profileForm.nickname = user.nickname || '';
    profileForm.realName = user.realName || '';
    profileForm.phone = user.phone || '';
    profileForm.email = user.email || '';
    profileForm.avatarUrl = resolveMediaUrl(user.avatarUrl);
  },
  { immediate: true },
);

onMounted(() => {
  renderSceneFrame();
  ensureAudioSource();
  void loadLyricsForSong(selectedSongIndex.value);
  void loadMyOrders();
  window.addEventListener('pointermove', handleWindowPointerMove);
  window.addEventListener('pointerup', handleWindowPointerUp);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(sceneFrameId);
  cancelAnimationFrame(visualizerFrameId);
  cancelAnimationFrame(playbackFrameId);
  cancelAnimationFrame(progressFrameId);
  if (lyricPreviewTimer) clearTimeout(lyricPreviewTimer);
  window.removeEventListener('pointermove', handleWindowPointerMove);
  window.removeEventListener('pointerup', handleWindowPointerUp);
  window.removeEventListener('resize', handleResize);
});

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function compressAvatarFile(file: File) {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') {
    return file;
  }

  let image: ImageBitmap | null = null;
  try {
    image = await createImageBitmap(file);
    const scale = Math.min(1, AVATAR_MAX_SIZE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, width, height);

    const outputType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, outputType, AVATAR_UPLOAD_QUALITY);
    if (!blob || blob.size >= file.size) return file;
    const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
    return new File([blob], `${baseName}.${extension}`, { type: outputType });
  } catch {
    return file;
  } finally {
    image?.close();
  }
}

async function saveProfile() {
  profileSaving.active = true;
  messages.profileError = '';
  messages.profileSuccess = '';

  try {
    const payload = await updateCurrentUserProfile({
      nickname: profileForm.nickname,
      realName: profileForm.realName,
      phone: profileForm.phone,
      email: profileForm.email,
      avatarUrl: profileForm.avatarUrl,
    });
    setAuthSession(payload);
    messages.profileSuccess = '个人信息已更新';
  } catch (error) {
    messages.profileError = error instanceof Error ? error.message : '个人信息更新失败';
  } finally {
    profileSaving.active = false;
  }
}

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  messages.profileError = '';
  messages.profileSuccess = '';
  if (!file.type.startsWith('image/')) {
    messages.profileError = '请选择图片文件作为头像';
    input.value = '';
    return;
  }

  avatarUploading.value = true;
  try {
    const avatarFile = await compressAvatarFile(file);
    const payload = await uploadCurrentUserAvatar(avatarFile);
    setAuthSession(payload);
    profileForm.avatarUrl = resolveMediaUrl(payload.user.avatarUrl || payload.avatarUrl);
    messages.profileSuccess = '头像已上传';
  } catch (error) {
    messages.profileError = error instanceof Error ? error.message : '头像上传失败';
  } finally {
    avatarUploading.value = false;
    input.value = '';
  }
}

async function savePassword() {
  messages.passwordError = '';
  messages.passwordSuccess = '';
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    messages.passwordError = '两次输入的新密码不一致';
    return;
  }

  passwordSaving.active = true;
  try {
    const payload = await changeCurrentUserPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    setAuthSession(payload);
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    messages.passwordSuccess = '密码已修改';
  } catch (error) {
    messages.passwordError = error instanceof Error ? error.message : '密码修改失败';
  } finally {
    passwordSaving.active = false;
  }
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('button, input, textarea, select, a, [role="button"], [role="option"], [role="slider"], .song-list, .right-song-menu, .lyrics-container, .avatar-wrapper, .controls, .elastic-progress'));
}

function handleScenePointerDown(event: PointerEvent) {
  if (event.button !== 0 || isInteractiveTarget(event.target)) return;
  sceneDragging.value = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  baseRotateX = targetRotateX;
  baseRotateY = targetRotateY;
}

function handleWindowPointerMove(event: PointerEvent) {
  if (!sceneDragging.value) return;
  targetRotateY = baseRotateY + (event.clientX - dragStartX) * 0.18;
  targetRotateX = baseRotateX - (event.clientY - dragStartY) * 0.18;
}

function handleWindowPointerUp() {
  if (!sceneDragging.value) return;
  sceneDragging.value = false;
  baseRotateX = targetRotateX;
  baseRotateY = targetRotateY;
}

function renderSceneFrame() {
  smoothRotateX.value += (targetRotateX - smoothRotateX.value) * 0.14;
  smoothRotateY.value += (targetRotateY - smoothRotateY.value) * 0.14;
  if (Math.abs(targetRotateX - smoothRotateX.value) < 0.001) smoothRotateX.value = targetRotateX;
  if (Math.abs(targetRotateY - smoothRotateY.value) < 0.001) smoothRotateY.value = targetRotateY;
  sceneFrameId = requestAnimationFrame(renderSceneFrame);
}

function getSongDuration(song = currentSong.value) {
  return Math.max(song?.duration || 1, 1);
}

function formatTime(value: number) {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function ensureAudioSource() {
  const audio = audioPlayerRef.value;
  const song = currentSong.value;
  if (!audio || !song) return;
  if (!audio.src || audio.dataset.songId !== String(song.id)) {
    audio.src = song.audioUrl;
    audio.dataset.songId = String(song.id);
    audio.load();
  }
}

async function playCurrentSong() {
  ensureAudioSource();
  const audio = audioPlayerRef.value;
  if (!audio) return;
  try {
    await audio.play();
    setPlayingState(true);
  } catch (error) {
    console.warn('Audio play failed:', error);
    setPlayingState(false);
  }
}

function setPlayingState(playing: boolean) {
  isPlaying.value = playing;
  if (playing) {
    updateVisualizer();
    syncPlaybackFrame();
  } else {
    cancelAnimationFrame(visualizerFrameId);
    cancelAnimationFrame(playbackFrameId);
    barHeights.value = visualizerBars.map(() => 10);
  }
}

function togglePlay() {
  const audio = audioPlayerRef.value;
  if (isPlaying.value) {
    audio?.pause();
  } else {
    void playCurrentSong();
  }
}

function prevSong() {
  selectSong(selectedSongIndex.value - 1);
}

function nextSong() {
  selectSong(selectedSongIndex.value + 1);
}

function selectSong(index: number) {
  const shouldResume = isPlaying.value;
  selectedSongIndex.value = (index + songs.length) % songs.length;
  menuFocusIndex.value = selectedSongIndex.value;
  currentTime.value = 0;
  lyricPreviewing.value = false;
  if (lyricPreviewTimer) clearTimeout(lyricPreviewTimer);
  const audio = audioPlayerRef.value;
  if (audio) {
    audio.pause();
    audio.src = songs[selectedSongIndex.value].audioUrl;
    audio.dataset.songId = String(songs[selectedSongIndex.value].id);
  }
  setSongMenu(false);
  void loadLyricsForSong(selectedSongIndex.value);
  void nextTick(() => {
    updateLyricsActive();
    updateMenuDepth();
  });
  if (shouldResume) void playCurrentSong();
  else setPlayingState(false);
}

function updateVisualizer() {
  if (!isPlaying.value) return;
  const time = performance.now() * 0.004;
  barHeights.value = visualizerBars.map((_, index) => {
    const waveA = Math.sin(index * 0.38 + time) * 12;
    const waveB = Math.cos(index * 0.17 + time * 1.65) * 7;
    const pulse = Math.sin(time * 0.9 + selectedSongIndex.value) * 5;
    return 24 + waveA + waveB + pulse;
  });
  visualizerFrameId = requestAnimationFrame(updateVisualizer);
}

function syncPlaybackFrame() {
  cancelAnimationFrame(playbackFrameId);
  const tick = () => {
    if (!isPlaying.value) return;
    currentTime.value = audioPlayerRef.value?.currentTime || currentTime.value;
    updateLyricsActive();
    playbackFrameId = requestAnimationFrame(tick);
  };
  playbackFrameId = requestAnimationFrame(tick);
}

function progressValueFromPointer(clientX: number) {
  const rect = songProgressRef.value?.getBoundingClientRect();
  if (!rect?.width) return 0;
  const ratio = (clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(ratio, 1)) * getSongDuration();
}

function seekTo(value: number, autoplay = false) {
  currentTime.value = Math.max(0, Math.min(value, getSongDuration()));
  const audio = audioPlayerRef.value;
  if (audio?.src) audio.currentTime = currentTime.value;
  updateLyricsActive();
  if (autoplay) void playCurrentSong();
}

function setProgressStretch(clientX: number) {
  const rect = songProgressRef.value?.getBoundingClientRect();
  if (!rect) return;
  const overflowLeft = Math.max(rect.left - clientX, 0);
  const overflowRight = Math.max(clientX - rect.right, 0);
  const overflow = Math.min(Math.max(overflowLeft, overflowRight), 58);
  progressStretch.stretch = 1 + overflow / Math.max(rect.width, 1);
  progressStretch.squash = 1.28 - Math.min(overflow / 58, 1) * 0.26;
  progressStretch.thumbX = overflowLeft ? -overflow / 2 : overflowRight ? overflow / 2 : 0;
}

function releaseProgressStretch() {
  cancelAnimationFrame(progressFrameId);
  const startStretch = progressStretch.stretch;
  const startSquash = progressStretch.squash;
  const startThumb = progressStretch.thumbX;
  const startedAt = performance.now();
  const duration = 420;
  const animate = (now: number) => {
    const t = Math.min((now - startedAt) / duration, 1);
    const spring = 1 - Math.cos(t * Math.PI * 3) * Math.exp(-t * 5);
    progressStretch.stretch = startStretch + (1 - startStretch) * spring;
    progressStretch.squash = startSquash + (1 - startSquash) * spring;
    progressStretch.thumbX = startThumb + (0 - startThumb) * spring;
    if (t < 1) progressFrameId = requestAnimationFrame(animate);
  };
  progressFrameId = requestAnimationFrame(animate);
}

function handleProgressPointer(event: PointerEvent) {
  event.stopPropagation();
  seekTo(progressValueFromPointer(event.clientX), false);
  setProgressStretch(event.clientX);
}

function handleProgressPointerDown(event: PointerEvent) {
  progressDragging.value = true;
  songProgressRef.value?.setPointerCapture(event.pointerId);
  handleProgressPointer(event);
}

function handleProgressPointerMove(event: PointerEvent) {
  if (!progressDragging.value) return;
  handleProgressPointer(event);
}

function handleProgressPointerUp(event: PointerEvent) {
  if (!progressDragging.value) return;
  event.stopPropagation();
  progressDragging.value = false;
  songProgressRef.value?.releasePointerCapture(event.pointerId);
  releaseProgressStretch();
}

function handleProgressKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 5;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    seekTo(currentTime.value + step, false);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    seekTo(currentTime.value - step, false);
  } else if (event.key === 'Home') {
    event.preventDefault();
    seekTo(0, false);
  } else if (event.key === 'End') {
    event.preventDefault();
    seekTo(getSongDuration(), false);
  }
}

function getActiveLyricIndex() {
  let activeIndex = 0;
  currentSong.value.lyrics.forEach((line, index) => {
    if (currentTime.value >= line.time) activeIndex = index;
  });
  return activeIndex;
}

function parseLrc(lrcText: string) {
  if (!lrcText) return [];
  return lrcText
    .split('\n')
    .flatMap((line) => {
      const stamps = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
      const text = line.replace(/\[[^\]]+\]/g, '').trim();
      if (!stamps.length || !text) return [];
      return stamps.map((stamp) => ({
        time: Number(stamp[1]) * 60 + Number(stamp[2]) + Number((stamp[3] || '0').padEnd(3, '0')) / 1000,
        text,
      }));
    })
    .sort((a, b) => a.time - b.time);
}

function lyricSources(songId: number) {
  const lyricUrl = `https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`;
  return [
    `https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id=${songId}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(lyricUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(lyricUrl)}`,
    lyricUrl,
  ];
}

function fetchWithTimeout(url: string, timeout = 4200) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  return fetch(url, { cache: 'force-cache', signal: controller.signal }).finally(() => window.clearTimeout(timer));
}

async function fetchLyricsFromSource(source: string) {
  try {
    const response = await fetchWithTimeout(source);
    if (!response.ok) return [];
    const text = await response.text();
    const data = JSON.parse(text);
    const nestedData = data?.contents ? JSON.parse(data.contents) : data;
    return parseLrc(nestedData?.lrc?.lyric || nestedData?.lyric || '');
  } catch (error) {
    console.warn('Lyric load failed:', source, error);
    return [];
  }
}

function applyLoadedLyrics(index: number, lyrics: LyricLine[]) {
  if (index !== selectedSongIndex.value || !lyrics.length) return;
  songs[index].lyrics = lyrics;
  void nextTick(() => {
    updateLyricsActive();
    updateLyricDepth();
  });
}

async function loadLyricsForSong(index: number) {
  const song = songs[index];
  if (!song?.id) return;
  const requestToken = ++lyricRequestToken;
  if (lyricCache.has(song.id)) {
    applyLoadedLyrics(index, lyricCache.get(song.id) ?? []);
    return;
  }

  let applied = false;
  await Promise.all(lyricSources(song.id).map(async (source) => {
    const lyrics = await fetchLyricsFromSource(source);
    if (applied || requestToken !== lyricRequestToken || !lyrics.length) return;
    applied = true;
    lyricCache.set(song.id, lyrics);
    applyLoadedLyrics(index, lyrics);
  }));
}

function updateLyricsActive() {
  void nextTick(() => {
    updateLyricDepth();
    if (!isPlaying.value || lyricPreviewing.value) return;
    const active = lyricsContainerRef.value?.querySelector('.lyric-line.active');
    active?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}

function updateLyricDepth() {
  const container = lyricsContainerRef.value;
  const lines = [...(container?.querySelectorAll<HTMLElement>('.lyric-line') ?? [])];
  if (!container || !lines.length) return;
  const containerRect = container.getBoundingClientRect();
  const center = containerRect.top + containerRect.height / 2;
  lines.forEach((line) => {
    const rect = line.getBoundingClientRect();
    const distance = Math.min(Math.abs(rect.top + rect.height / 2 - center) / 120, 1.7);
    line.style.setProperty('--lyric-z', `${(60 - distance * 74).toFixed(1)}px`);
    line.style.setProperty('--lyric-scale', Math.max(1.08 - distance * 0.12, 0.9).toFixed(3));
    line.style.setProperty('--lyric-opacity', Math.max(1 - distance * 0.5, 0.28).toFixed(3));
  });
}

function setLyricsExpanded(expanded: boolean) {
  lyricsExpanded.value = expanded;
  void nextTick(() => {
    updateLyricDepth();
    if (expanded && !lyricPreviewing.value) lyricsContainerRef.value?.querySelector('.lyric-line.active')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}

function handleLyricWheel(event: WheelEvent) {
  event.preventDefault();
  const container = lyricsContainerRef.value;
  if (!container) return;
  container.scrollTop += event.deltaY;
  lyricPreviewing.value = true;
  if (lyricPreviewTimer) clearTimeout(lyricPreviewTimer);
  lyricPreviewTimer = window.setTimeout(() => {
    lyricPreviewing.value = false;
    if (isPlaying.value) lyricsContainerRef.value?.querySelector('.lyric-line.active')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 2200);
  requestAnimationFrame(updateLyricDepth);
}

function handleLyricClick(line: LyricLine) {
  seekTo(line.time, true);
}

function setSongMenu(open: boolean) {
  songMenuOpen.value = open;
  if (!open) return;
  menuFocusIndex.value = selectedSongIndex.value;
  void nextTick(() => {
    const selected = songListRef.value?.querySelector<HTMLElement>(`[data-index="${selectedSongIndex.value}"]`);
    selected?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    updateMenuDepth();
    songListRef.value?.focus({ preventScroll: true });
  });
}

function updateMenuDepth() {
  const list = songListRef.value;
  const items = [...(list?.querySelectorAll<HTMLElement>('.song-option') ?? [])];
  if (!list || !items.length) return;
  const listRect = list.getBoundingClientRect();
  const center = listRect.top + listRect.height / 2;
  items.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const distance = Math.min(Math.abs(rect.top + rect.height / 2 - center) / 150, 1.55);
    const depth = Math.max(86 - distance * 96, -70);
    const scale = Math.max(1.08 - distance * 0.14, 0.9);
    const opacity = Math.max(1 - distance * 0.52, 0.26);
    const index = Number(item.dataset.index);
    item.style.setProperty('--item-z', `${depth.toFixed(1)}px`);
    item.style.setProperty('--item-scale', scale.toFixed(3));
    item.style.setProperty('--item-opacity', opacity.toFixed(3));
    item.classList.toggle('selected', index === menuFocusIndex.value);
    item.setAttribute('aria-selected', String(index === menuFocusIndex.value));
  });
}

function handleSongListKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
    event.preventDefault();
    menuFocusIndex.value = Math.min(menuFocusIndex.value + 1, songs.length - 1);
  } else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
    event.preventDefault();
    menuFocusIndex.value = Math.max(menuFocusIndex.value - 1, 0);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    selectSong(menuFocusIndex.value);
    return;
  } else if (event.key === 'Escape') {
    setSongMenu(false);
    return;
  } else {
    return;
  }
  void nextTick(() => {
    const selected = songListRef.value?.querySelector<HTMLElement>(`[data-index="${menuFocusIndex.value}"]`);
    selected?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    updateMenuDepth();
  });
}

function handleResize() {
  requestAnimationFrame(updateMenuDepth);
  requestAnimationFrame(updateLyricDepth);
}
</script>

<template>
  <section class="profile-page">
    <div class="profile-hyperspeed-background" aria-hidden="true">
      <Hyperspeed :effect-options="profileHyperspeedOptions" />
    </div>
    <div class="profile-background-shade" aria-hidden="true"></div>

    <div
      ref="sceneRef"
      class="profile-scene"
      :class="{ dragging: sceneDragging }"
      :style="sceneStyle"
      @pointerdown="handleScenePointerDown"
    >
      <div class="profile-container-wrapper" :style="containerStyle">
        <aside class="profile-sidebar">
          <div class="glass-panel music-player" :class="{ playing: isPlaying }">
            <div class="visualizer-ring">
              <div class="controls billboard">
                <button class="player-btn" type="button" aria-label="上一首" @click.stop="prevSong">
                  <SkipBack :size="17" />
                </button>
                <button class="player-btn main" type="button" :aria-label="isPlaying ? '暂停' : '播放'" @click.stop="togglePlay">
                  <Pause v-if="isPlaying" :size="20" />
                  <Play v-else :size="20" />
                </button>
                <button class="player-btn" type="button" aria-label="下一首" @click.stop="nextSong">
                  <SkipForward :size="17" />
                </button>
              </div>

              <span
                v-for="bar in visualizerBars"
                :key="bar"
                class="bar"
                :style="{ '--bar-rotate': `${bar * 7.2}deg`, height: `${barHeights[bar]}px` }"
              />

              <button class="avatar-wrapper billboard" type="button" @click.stop="togglePlay">
                <img v-if="displayAvatarUrl" class="avatar-img" :src="displayAvatarUrl" alt="" />
                <span v-else class="avatar-letter">{{ avatarInitial }}</span>
              </button>
            </div>

            <h2 class="billboard">{{ displayName }}</h2>
            <p class="billboard">{{ userTypeLabel }} · {{ currentUser?.username || '访客' }}</p>

            <div class="progress-shell billboard">
              <div class="progress-time">
                <span>{{ formatTime(currentTime) }}</span>
                <span>{{ formatTime(getSongDuration()) }}</span>
              </div>
              <div
                ref="songProgressRef"
                class="elastic-progress"
                :class="{ dragging: progressDragging }"
                :style="progressStyle"
                role="slider"
                tabindex="0"
                aria-label="Song progress"
                aria-valuemin="0"
                :aria-valuemax="getSongDuration()"
                :aria-valuenow="Math.round(currentTime)"
                @pointerdown="handleProgressPointerDown"
                @pointermove="handleProgressPointerMove"
                @pointerup="handleProgressPointerUp"
                @pointercancel="handleProgressPointerUp"
                @keydown="handleProgressKeydown"
              >
                <div class="progress-track">
                  <div class="progress-fill" />
                </div>
                <div class="progress-thumb" />
              </div>
            </div>

            <button
              class="song-menu-toggle billboard"
              type="button"
              :aria-expanded="songMenuOpen"
              aria-controls="rightSongMenu"
              @click.stop="setSongMenu(!songMenuOpen)"
            >
              <ListMusic :size="16" />
              歌曲选择
            </button>
          </div>

          <div class="lyrics-shell billboard" :class="{ expanded: lyricsExpanded }">
            <button class="lyrics-toggle" type="button" :aria-expanded="lyricsExpanded" @click.stop="setLyricsExpanded(!lyricsExpanded)">
              {{ lyricsExpanded ? '收起歌词' : '展开歌词' }}
            </button>
            <div ref="lyricsContainerRef" class="lyrics-container" @wheel.prevent="handleLyricWheel">
              <button
                v-for="(line, index) in currentSong.lyrics"
                :key="`${currentSong.id}-${index}`"
                class="lyric-line"
                :class="{ active: index === activeLyricIndex }"
                type="button"
                :data-index="index"
                :style="{ '--lyric-i': index }"
                @click.stop="handleLyricClick(line)"
              >
                {{ line.text }}
              </button>
            </div>
          </div>
        </aside>

        <main class="main-content" :class="{ 'show-song-menu': songMenuOpen }">
          <div v-show="!songMenuOpen" id="profileContent">
            <form class="glass-panel profile-panel" @submit.prevent="saveProfile">
              <div class="profile-panel-title billboard">
                <UserRound :size="22" />
                <div>
                  <h3>个人资料 / Profile</h3>
                  <span>头像与基础联系信息</span>
                </div>
              </div>

              <label class="profile-avatar-field avatar-upload-control billboard">
                <span><ImagePlus :size="16" /> 上传头像图片</span>
                <input type="file" accept="image/*" :disabled="avatarUploading || profileSaving.active" @change="handleAvatarFileChange" />
                <small>{{ avatarUploading ? '头像上传中' : '支持 JPG、PNG、WEBP 等图片格式' }}</small>
              </label>

              <div class="profile-form-grid">
                <label class="billboard">
                  <span>昵称</span>
                  <input v-model.trim="profileForm.nickname" maxlength="64" required />
                </label>
                <label class="billboard">
                  <span>真实姓名</span>
                  <input v-model.trim="profileForm.realName" maxlength="64" />
                </label>
                <label class="billboard">
                  <span>手机号</span>
                  <input v-model.trim="profileForm.phone" maxlength="32" inputmode="tel" />
                </label>
                <label class="billboard">
                  <span>邮箱</span>
                  <input v-model.trim="profileForm.email" maxlength="128" type="email" />
                </label>
              </div>

              <p v-if="messages.profileError" class="inline-error billboard">{{ messages.profileError }}</p>
              <p v-if="messages.profileSuccess" class="inline-success billboard">{{ messages.profileSuccess }}</p>

              <button class="primary-action billboard" type="submit" :disabled="profileSaving.active">
                <Save :size="18" />
                {{ profileSaving.active ? '保存中' : '保存资料' }}
              </button>
            </form>

            <form class="glass-panel profile-panel password-panel" @submit.prevent="savePassword">
              <div class="profile-panel-title billboard">
                <LockKeyhole :size="22" />
                <div>
                  <h3>修改密码</h3>
                  <span>需要验证当前密码</span>
                </div>
              </div>

              <div class="profile-form-grid">
                <label class="billboard">
                  <span>当前密码</span>
                  <input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" required />
                </label>
                <label class="billboard">
                  <span>新密码</span>
                  <input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" required maxlength="128" />
                </label>
                <label class="billboard">
                  <span>确认新密码</span>
                  <input v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" required maxlength="128" />
                </label>
              </div>

              <p v-if="messages.passwordError" class="inline-error billboard">{{ messages.passwordError }}</p>
              <p v-if="messages.passwordSuccess" class="inline-success billboard">{{ messages.passwordSuccess }}</p>

              <button class="primary-action billboard" type="submit" :disabled="passwordSaving.active">
                <LockKeyhole :size="18" />
                {{ passwordSaving.active ? '修改中' : '修改密码' }}
              </button>
            </form>

            <section class="glass-panel profile-panel orders-panel">
              <div class="profile-panel-title billboard">
                <Package :size="22" />
                <div>
                  <h3>我的订单</h3>
                  <span>文创产品购买记录（数据来自服务端）</span>
                </div>
              </div>

              <div v-if="ordersError" class="billboard order-empty">{{ ordersError }}</div>
              <div v-else-if="ordersLoading" class="billboard order-empty">正在加载订单</div>
              <div v-else-if="!myOrders.length" class="billboard order-empty">
                暂无订单记录，购买文创产品后会显示在这里。
              </div>
              <div v-else class="order-list">
                <article v-for="order in myOrders" :key="order.id" class="billboard order-card">
                  <div class="order-header">
                    <strong>{{ order.orderNo }}</strong>
                    <span class="order-status">{{ order.status === 'PAID' ? '已付款' : order.status }}</span>
                  </div>
                  <div class="order-product">
                    <img v-if="order.productCoverUrl" :src="order.productCoverUrl" :alt="order.productName" />
                    <span v-else class="order-fallback">{{ order.productName?.slice(0, 1) }}</span>
                    <div>
                      <strong>{{ order.productName }}</strong>
                      <small>{{ new Date(order.createdAt || '').toLocaleString() }}</small>
                    </div>
                  </div>
                  <div class="order-meta">
                    <span>数量：{{ order.quantity }}</span>
                    <span>合计：¥{{ Number(order.total).toFixed(2) }}</span>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <div
            v-show="songMenuOpen"
            id="rightSongMenu"
            class="right-song-menu"
            :class="{ open: songMenuOpen }"
            :aria-hidden="!songMenuOpen"
          >
            <div
              ref="songListRef"
              class="song-list right-song-list"
              role="listbox"
              tabindex="0"
              aria-label="Song selector"
              @scroll="updateMenuDepth"
              @keydown="handleSongListKeydown"
            >
              <button
                v-for="(song, index) in songs"
                :key="song.id"
                class="song-option"
                type="button"
                role="option"
                :data-index="index"
                :aria-selected="index === menuFocusIndex"
                :style="{ '--item-i': index }"
                @mouseenter="menuFocusIndex = index; updateMenuDepth()"
                @click.stop="selectSong(index)"
              >
                <span class="song-title">{{ song.title }}</span>
                <span class="song-meta">{{ song.artist }}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>

    <audio
      ref="audioPlayerRef"
      preload="metadata"
      @loadedmetadata="currentTime = audioPlayerRef?.currentTime || 0"
      @timeupdate="currentTime = audioPlayerRef?.currentTime || 0; updateLyricsActive()"
      @play="setPlayingState(true)"
      @pause="setPlayingState(false)"
      @ended="nextSong"
    />
  </section>
</template>

<style scoped>
.profile-page {
  --primary: #ff4757;
  --secondary: #2f3542;
  --glass: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.15);
  --neon: #00d2ff;
  position: relative;
  isolation: isolate;
  min-height: calc(100vh - 86px);
  padding: 94px clamp(16px, 3vw, 44px) 38px;
  background: #020407;
  color: #fff;
  perspective: 2000px;
  overflow: hidden;
}

.profile-hyperspeed-background,
.profile-background-shade {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.profile-hyperspeed-background {
  z-index: -2;
  opacity: 0.82;
  filter: saturate(1.25) contrast(1.08);
}

.profile-background-shade {
  z-index: -1;
  background:
    radial-gradient(circle at 48% 34%, rgba(0, 210, 255, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(2, 4, 7, 0.2), rgba(2, 4, 7, 0.7) 72%, rgba(2, 4, 7, 0.9));
}

.profile-scene {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  min-height: 750px;
  margin: 0 auto;
  transform-style: preserve-3d;
  cursor: grab;
  touch-action: none;
  animation: fadeIn 0.8s ease-out;
}

.profile-scene.dragging {
  cursor: grabbing;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.profile-container-wrapper {
  width: 100%;
  min-height: 750px;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 30px;
  padding: 30px;
  transform-style: preserve-3d;
  transition: transform 0.08s linear;
  will-change: transform;
}

.billboard {
  transform: rotateY(calc(-1 * var(--ry))) rotateX(calc(-1 * var(--rx))) translateZ(1px);
  transform-style: preserve-3d;
  backface-visibility: visible;
}

.glass-panel {
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 30px;
  padding: 30px;
  color: white;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform-style: preserve-3d;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease;
  backface-visibility: visible;
}

.glass-panel:hover {
  transform: scale(1.02) translateZ(10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  transform-style: preserve-3d;
}

.music-player {
  position: relative;
  text-align: center;
}

.visualizer-ring {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
}

.avatar-wrapper {
  width: 130px;
  height: 130px;
  border: 4px solid #fff;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  z-index: 10;
  padding: 0;
  background: linear-gradient(135deg, #ff4757, #111827);
  color: #fff;
  transition: 0.5s;
  position: relative;
}

.avatar-img,
.avatar-letter {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  object-fit: cover;
  font-size: 46px;
  font-weight: 900;
  transform-origin: center;
  will-change: transform;
}

.playing .avatar-wrapper {
  box-shadow: 0 0 30px var(--neon);
}

.playing .avatar-img,
.playing .avatar-letter {
  animation: rotateAvatar 10s linear infinite;
}

@keyframes rotateAvatar {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.bar {
  position: absolute;
  width: 3px;
  min-height: 10px;
  background: var(--neon);
  bottom: 50%;
  transform: rotate(var(--bar-rotate)) translateY(-96px);
  transform-origin: bottom center;
  opacity: 0;
  transition: opacity 0.5s, height 0.14s ease-out;
  will-change: height, opacity;
}

.playing .bar {
  opacity: 0.8;
}

.controls {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  z-index: 20;
  opacity: 0;
  transition: 0.3s;
  pointer-events: none;
  backface-visibility: visible;
}

.visualizer-ring:hover .controls,
.controls:hover {
  opacity: 1;
}

.player-btn {
  display: inline-grid;
  place-items: center;
  width: 35px;
  height: 35px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.2s ease, background 0.2s ease;
}

.player-btn.main {
  width: 45px;
  height: 45px;
}

.player-btn:hover {
  background: var(--primary);
  transform: scale(1.2);
}

.music-player h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.music-player p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.progress-shell {
  width: min(245px, 86%);
  margin: 18px auto 0;
  color: rgba(255, 255, 255, 0.68);
  transform-style: preserve-3d;
  backface-visibility: visible;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.elastic-progress {
  --progress: 0%;
  --stretch: 1;
  --squash: 1;
  --thumb-x: 0px;
  position: relative;
  display: flex;
  align-items: center;
  height: 30px;
  cursor: grab;
  touch-action: none;
  transform: translateZ(22px) scaleX(var(--stretch)) scaleY(var(--squash));
  transform-origin: center;
  transition: transform 0.18s ease, opacity 0.18s ease;
  opacity: 0.82;
  backface-visibility: visible;
}

.elastic-progress.dragging {
  cursor: grabbing;
  opacity: 1;
  transition: opacity 0.12s ease;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.25);
}

.progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--progress);
  border-radius: inherit;
  background: linear-gradient(90deg, var(--neon), #27ff64);
  box-shadow: 0 0 18px rgba(0, 210, 255, 0.52);
}

.progress-thumb {
  position: absolute;
  left: var(--progress);
  top: 50%;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 18px rgba(39, 255, 100, 0.72), 0 0 0 5px rgba(0, 210, 255, 0.12);
  transform: translate(calc(-50% + var(--thumb-x)), -50%);
  transition: transform 0.18s ease;
  pointer-events: none;
}

.progress-shell:hover .elastic-progress,
.elastic-progress.dragging {
  --squash: 1.28;
  opacity: 1;
}

.song-menu-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.38);
  color: white;
  cursor: pointer;
  transform: translateZ(18px);
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}

.song-menu-toggle:hover,
.song-menu-toggle[aria-expanded='true'] {
  background: rgba(0, 210, 255, 0.18);
  border-color: rgba(0, 210, 255, 0.48);
  transform: translateZ(28px) scale(1.04);
}

.lyrics-shell {
  position: relative;
  min-height: 42px;
  transform-style: preserve-3d;
  backface-visibility: visible;
}

.lyrics-toggle {
  position: absolute;
  top: -12px;
  right: 8px;
  z-index: 6;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 6px;
  transform: translateZ(22px);
  transition: color 0.2s ease, text-shadow 0.2s ease;
}

.lyrics-toggle:hover,
.lyrics-shell.expanded .lyrics-toggle {
  color: var(--neon);
  text-shadow: 0 0 12px var(--neon);
}

.lyrics-container {
  margin-top: 10px;
  max-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  opacity: 0;
  scrollbar-width: none;
  scroll-behavior: smooth;
  perspective: 760px;
  transform-style: preserve-3d;
  transition: max-height 0.32s cubic-bezier(0.2, 0.85, 0.28, 1), opacity 0.24s ease, padding 0.24s ease;
}

.lyrics-shell.expanded .lyrics-container {
  max-height: min(62vh, 440px);
  padding: 24px 10px 6px;
  pointer-events: auto;
  opacity: 1;
}

.lyrics-container::-webkit-scrollbar {
  display: none;
}

.lyric-line {
  display: block;
  width: 100%;
  min-height: 24px;
  padding: 2px 8px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
  font-size: 16px;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: var(--lyric-opacity, 0.5);
  transform: translateZ(var(--lyric-z, 0px)) scale(var(--lyric-scale, 1));
  transform-style: preserve-3d;
  animation: lyricItemIn 0.34s ease both;
  animation-delay: calc(var(--lyric-i, 0) * 42ms);
  transition: color 0.4s, transform 0.4s, opacity 0.4s;
}

.lyric-line:hover {
  color: rgba(255, 255, 255, 0.88);
}

.lyric-line.active {
  color: var(--neon);
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 0 15px var(--neon);
}

@keyframes lyricItemIn {
  from {
    opacity: 0;
    transform: translateY(10px) translateZ(-48px) scale(0.9);
  }

  to {
    opacity: var(--lyric-opacity, 0.5);
    transform: translateZ(var(--lyric-z, 0px)) scale(var(--lyric-scale, 1));
  }
}

.main-content {
  position: relative;
  min-height: 620px;
  transform-style: preserve-3d;
}

#profileContent {
  display: grid;
  gap: 25px;
  transform-style: preserve-3d;
  transition: opacity 0.26s ease, transform 0.32s ease;
}

.main-content.show-song-menu #profileContent {
  opacity: 0;
  pointer-events: none;
  transform: translateZ(-70px) scale(0.96);
}

.profile-panel-title {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 22px;
  color: var(--neon);
}

.profile-panel-title h3 {
  margin: 0;
  color: #fff;
  font-size: 22px;
}

.profile-panel-title span {
  display: block;
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  font-weight: 700;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.profile-avatar-field,
.profile-form-grid label {
  display: grid;
  gap: 8px;
}

.profile-avatar-field {
  margin-bottom: 16px;
}

.avatar-upload-control {
  grid-template-columns: minmax(0, 1fr);
  padding: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.045);
}

.avatar-upload-control small {
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  font-weight: 700;
}

.profile-avatar-field span,
.profile-form-grid span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 800;
}

.profile-avatar-field input,
.profile-form-grid input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  padding: 0 13px;
  font: inherit;
}

.avatar-upload-control input[type='file'] {
  min-height: 0;
  padding: 10px 12px;
  cursor: pointer;
}

.profile-avatar-field input:focus,
.profile-form-grid input:focus {
  border-color: rgba(0, 210, 255, 0.62);
  outline: 3px solid rgba(0, 210, 255, 0.12);
}

.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  margin-top: 20px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(45deg, var(--primary), #ff6b81);
  color: white;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 14px 32px rgba(255, 71, 87, 0.22);
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.62;
}

.inline-error,
.inline-success {
  margin: 14px 0 0;
  font-size: 13px;
  font-weight: 800;
}

.inline-error {
  color: #ff8991;
}

.inline-success {
  color: #6ff2bd;
}

.right-song-menu {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transform: rotateY(calc(-1 * var(--ry))) rotateX(calc(-1 * var(--rx))) translateZ(120px) scale(0.96);
  transform-style: preserve-3d;
  backface-visibility: visible;
  transition: opacity 0.28s ease, transform 0.34s cubic-bezier(0.2, 0.85, 0.28, 1);
  z-index: 70;
  background: transparent;
  overflow: hidden;
}

.right-song-menu.open {
  opacity: 1;
  pointer-events: auto;
  transform: rotateY(calc(-1 * var(--ry))) rotateX(calc(-1 * var(--rx))) translateZ(140px) scale(1);
}

.right-song-menu::before,
.right-song-menu::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 90px;
  pointer-events: none;
  z-index: 2;
}

.right-song-menu::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(12, 24, 34, 0.52), transparent);
}

.right-song-menu::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(12, 24, 34, 0.52), transparent);
}

.right-song-list {
  position: relative;
  z-index: 3;
  height: 100%;
  max-height: 620px;
  padding: 54px 26px 70px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.right-song-list::-webkit-scrollbar {
  display: none;
}

.song-option {
  width: 100%;
  min-height: 72px;
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: white;
  text-align: center;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  transform-style: preserve-3d;
  backface-visibility: visible;
  transform: translateZ(var(--item-z, 0px)) scale(var(--item-scale, 1));
  opacity: var(--item-opacity, 0.55);
  transition: transform 0.22s ease, opacity 0.22s ease, color 0.2s ease, text-shadow 0.2s ease;
  animation: listItemIn 0.34s ease both;
  animation-delay: calc(var(--item-i, 0) * 42ms);
  will-change: transform, opacity;
}

.song-option:hover,
.song-option.selected {
  color: var(--neon);
  text-shadow: 0 0 16px var(--neon);
}

.song-title {
  display: block;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.25;
}

.song-meta {
  display: block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
}

@keyframes listItemIn {
  from {
    opacity: 0;
    transform: translateY(16px) translateZ(-80px) scale(0.82);
  }

  to {
    opacity: var(--item-opacity, 0.55);
    transform: translateZ(var(--item-z, 0px)) scale(var(--item-scale, 1));
  }
}

.order-list {
  display: grid;
  gap: 14px;
}

.order-card {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.order-header strong {
  color: #fff;
  font-size: 13px;
  font-weight: 900;
}

.order-status {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 210, 255, 0.16);
  color: #00d2ff;
  font-size: 12px;
  font-weight: 900;
}

.order-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-product img,
.order-fallback {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  flex: 0 0 auto;
}

.order-fallback {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: #fff;
  font-weight: 900;
}

.order-product strong {
  display: block;
  color: #fff;
  font-size: 15px;
}

.order-product small {
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
}

.order-meta {
  display: flex;
  gap: 16px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.order-empty {
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.58);
  text-align: center;
}

@media (max-width: 980px) {
  .profile-page {
    overflow: visible;
  }

  .profile-scene,
  .profile-container-wrapper {
    min-height: auto;
  }

  .profile-container-wrapper {
    grid-template-columns: 1fr;
    padding: 18px 0;
  }

  .profile-sidebar {
    max-width: 360px;
    width: 100%;
    margin: 0 auto;
  }

  .main-content {
    min-height: 620px;
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: 92px 14px 28px;
  }

  .profile-container-wrapper {
    gap: 18px;
  }

  .glass-panel {
    border-radius: 22px;
    padding: 20px;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
  }

  .song-title {
    font-size: 22px;
  }
}
</style>
