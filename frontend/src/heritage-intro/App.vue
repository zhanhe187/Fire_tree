<script setup lang="ts">
import { computed, defineAsyncComponent, h, onMounted, onUnmounted, ref, watch, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AiFloatingAssistant from '../shared/components/AiFloatingAssistant.vue';
import AccountStaggeredMenu from '../shared/components/AccountStaggeredMenu.vue';
import { getHeritageDisplay } from './heritageDisplay';
import { fetchCurrentUser } from '../features/auth/services/auth';
import { GraphNodeItem, fetchGraphNodes } from '../features/graph/services/graph';
import { authSession, clearAuthSession, setAuthSession } from '../features/auth/services/authState';
import {
  heritageRegions,
  introImages,
  palette,
  projectItems,
  regionCategories,
  swapCards,
} from './data';

const AuthPage = defineAsyncComponent(() => import('../features/auth/views/AuthPage.vue'));
const ArticleDetailPage = defineAsyncComponent(() => import('../features/article/views/portal/ArticleDetailPage.vue'));
const ArticleListPage = defineAsyncComponent(() => import('../features/article/views/portal/ArticleListPage.vue'));
const BorderGlow = defineAsyncComponent(() => import('./components/BorderGlow.vue'));
const CardSwap = defineAsyncComponent(() => import('./components/CardSwap.vue'));
const CircularGallery = defineAsyncComponent(() => import('./components/CircularGallery.vue'));
const CommunityQaPage = defineAsyncComponent(() => import('../features/community/views/portal/CommunityQaPage.vue'));
const CurvedLoop = defineAsyncComponent(() => import('./components/CurvedLoop.vue'));
const ExhibitionDetailPage = defineAsyncComponent(() => import('../features/exhibition/views/portal/ExhibitionDetailPage.vue'));
const ExhibitionListPage = defineAsyncComponent(() => import('../features/exhibition/views/portal/ExhibitionListPage.vue'));
const LearningIndexPage = defineAsyncComponent(() => import('../features/favorite/views/portal/LearningIndexPage.vue'));
const LearningStudyPage = defineAsyncComponent(() => import('../features/favorite/views/portal/LearningStudyPage.vue'));
const GraphBoardPage = defineAsyncComponent(() => import('../features/graph/views/portal/GraphBoardPage.vue'));
const GridMotion = defineAsyncComponent(() => import('./components/GridMotion.vue'));
const GridScan = defineAsyncComponent(() => import('./components/GridScan.vue'));
const HeritageDetailPage = defineAsyncComponent(() => import('../features/graph/views/portal/HeritageDetailPage.vue'));
const ImageTrail = defineAsyncComponent(() => import('./components/ImageTrail.vue'));
const LearningCheckinPage = defineAsyncComponent(() => import('../features/learning/views/portal/LearningCheckinPage.vue'));
const MagicRings = defineAsyncComponent(() => import('./components/MagicRings.vue'));
const Masonry = defineAsyncComponent(() => import('./components/Masonry.vue'));
const MaterialSubmitPage = defineAsyncComponent(() => import('../features/media/views/portal/MaterialSubmitPage.vue'));
const ProfilePage = defineAsyncComponent(() => import('../features/auth/views/ProfilePage.vue'));
const MyOrdersPage = defineAsyncComponent(() => import('../features/auth/views/MyOrdersPage.vue'));
const ProductDetailPage = defineAsyncComponent(() => import('../features/product/views/portal/ProductDetailPage.vue'));
const ProductListPage = defineAsyncComponent(() => import('../features/product/views/portal/ProductListPage.vue'));
const Radar = defineAsyncComponent(() => import('./components/Radar.vue'));
const ScrollFloat = defineAsyncComponent(() => import('./components/ScrollFloat.vue'));
const ScrollReveal = defineAsyncComponent(() => import('./components/ScrollReveal.vue'));
const Card: Component = (_props, { slots, attrs }) => h('div', { ...attrs, class: ['swap-card', attrs.class] }, slots.default?.());

type PageKey = 'home' | 'explore' | 'articles' | 'exhibitions' | 'products' | 'graph' | 'community' | 'qa' | 'favorites' | 'profile' | 'orders' | 'auth' | 'submit';

const route = useRoute();
const router = useRouter();
// vue-router keeps trailing slashes, so normalize once for the favorites shell branches.
const currentPath = computed(() => route.path.replace(/\/+$/, '') || '/');
const activeCategory = ref('全部');
const isNavScrolled = ref(false);
const exploreNodes = ref<GraphNodeItem[]>([]);
// 全量公开节点：供「资料补全」统计与无关键词时展示，不随搜索变化。
const allExploreNodes = ref<GraphNodeItem[]>([]);
const exploreKeyword = ref(String(route.query.q ?? ''));
const exploreTotal = ref(0);
const exploreTruncated = ref(false);
const exploreLoading = ref(false);
const exploreError = ref('');
// 快速连续搜索时的竞态保护：只认最后一次请求的结果。
let exploreSearchSeq = 0;
const EXPLORE_PAGE_SIZE = 100;
const EXPLORE_MAX_PAGES = 5;

function updateNavState() {
  isNavScrolled.value = window.scrollY > 48;
}

onMounted(() => {
  updateNavState();
  window.addEventListener('scroll', updateNavState, { passive: true });
  void refreshExplore();
  if (authSession.token && !authSession.auth) {
    fetchCurrentUser(authSession.token)
      .then(setAuthSession)
      .catch(clearAuthSession);
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateNavState);
});

// 浏览页与其它页面共用同一个壳组件，路由来回切换不会重新挂载：
// 每次进入浏览页（含 ?q= 变化）都按当前关键词重新取数，否则搜索结果与补全后的封面
// 都要靠整页刷新才可见。
watch(() => route.fullPath, () => {
  if (currentPath.value !== '/explore') {
    return;
  }
  void refreshExplore();
});

const navItems: Array<{ key: PageKey; label: string; path: string }> = [
  { key: 'products', label: '文创产品', path: '/products' },
  { key: 'home', label: '首页', path: '/' },
  { key: 'explore', label: '浏览', path: '/explore' },
  { key: 'articles', label: '资讯研学', path: '/articles' },
  { key: 'exhibitions', label: '展览市集', path: '/exhibitions' },
  { key: 'graph', label: '图谱', path: '/graph' },
  { key: 'community', label: '社区问答', path: '/community' },
  { key: 'favorites', label: '收藏学习', path: '/favorites' },
];

const activePage = computed<PageKey>(() => {
  if (route.path.startsWith('/heritage/')) return 'explore';
  if (route.path.startsWith('/explore')) return 'explore';
  if (route.path.startsWith('/articles')) return 'articles';
  if (route.path.startsWith('/exhibitions')) return 'exhibitions';
  if (route.path.startsWith('/products')) return 'products';
  if (route.path.startsWith('/graph')) return 'graph';
  if (route.path.startsWith('/community')) return 'community';
  if (route.path.startsWith('/qa')) return 'qa';
  if (route.path.startsWith('/favorites')) return 'favorites';
  if (route.path.startsWith('/material-submit')) return 'submit';
  if (route.path.startsWith('/profile')) return 'profile';
  if (route.path.startsWith('/orders')) return 'orders';
  if (route.path.startsWith('/login')) return 'auth';
  return 'home';
});

const accountName = computed(() => authSession.auth?.user.nickname || authSession.auth?.user.username || '登录 / 注册');
const accountRole = computed(() => (authSession.auth ? '已登录' : '收藏学习前请登录'));
const accountAvatarUrl = computed(() => authSession.auth?.user.avatarUrl || '');
const isSignedIn = computed(() => Boolean(authSession.auth?.user && authSession.token));
const hasBackstageAccess = computed(() => (authSession.auth?.roles ?? []).some(
  (role) => role.roleCode === 'SUPER_ADMIN' || role.roleCode === 'INHERITOR',
));

const filteredRegions = computed(() => (
  activeCategory.value === '全部'
    ? heritageRegions
    : heritageRegions.filter((item) => item.category === activeCategory.value)
));

function cardAccent(index: number) {
  return palette[index % palette.length];
}

// 技法/工具是图谱中间层，不作为浏览卡片，也不计入「资料补全」（它们没有也不该有封面图）。
const GRAPH_ONLY_TYPES = new Set(['craft_technique', 'craft_tool']);
function isGraphOnlyNode(item: { nodeTypeCode?: string }) {
  return Boolean(item.nodeTypeCode && GRAPH_ONLY_TYPES.has(item.nodeTypeCode));
}

const masonryItems = computed(() => exploreNodes.value
  .filter((item) => !isGraphOnlyNode(item))
  .filter((item) => activeCategory.value === '全部' || getHeritageDisplay(item).category === activeCategory.value)
  .map((item, index) => {
    const display = getHeritageDisplay(item);
    return {
      id: String(item.id),
      img: display.coverImageUrl,
      hasCoverImage: display.hasCoverImage,
      imageStatus: display.imageStatus,
      imageLabel: display.imageStatus === 'REAL_PROJECT_IMAGE'
        ? '真实项目图'
        : display.imageStatus === 'CATEGORY_FALLBACK'
          ? '类别示意图'
          : '未有图像信息',
      missingFields: display.missingFields,
      url: `/heritage/${item.id}`,
      height: 330 + (index % 5) * 42 + (display.summary.length > 64 ? 30 : 0),
      region: item.city || item.province || '湖南非遗',
      code: item.nodeCode,
      project: item.name,
      category: display.category,
      level: display.projectLevel,
      intro: display.summary,
      tags: [display.category, item.province, display.projectLevel].filter(Boolean) as string[],
      accent: cardAccent(index),
    };
  }));

// 资料补全统计始终基于全量公开节点，不随搜索或分类变化，否则「当前有 N 条」会缩水。
const incompleteMaterialItems = computed(() => allExploreNodes.value
  .filter((item) => !isGraphOnlyNode(item))
  .map((item) => {
    const display = getHeritageDisplay(item);
    return {
      id: item.id,
      name: item.name,
      category: display.category,
      region: item.province || item.city || '地区未设置',
      missingFields: display.missingFields,
    };
  })
  .filter((item) => item.missingFields.length > 0));


const communityTrailImages = [
  ...projectItems.map((item) => item.image),
  ...swapCards.map((item) => item.image),
  introImages.heroDramaUrl,
  introImages.bianlianUrl,
];

const inheritanceMotionImages = [
  '/heritage-media/5.png',
  '/heritage-media/7.png',
  '/heritage-media/6.png',
  '/heritage-media/8.png',
];

const storyCardItems = [
  { image: '/heritage-media/9.png', text: '01 活态传承' },
  { image: '/heritage-media/10.png', text: '02 地域记忆' },
  { image: '/heritage-media/11.png', text: '03 当代表达' },
  { image: '/heritage-media/12.png', text: '04 文化生态' },
];

const exploreMagicRingsProps = {
  color: '#d83a2e',
  colorTwo: '#1e9cff',
  ringCount: 7,
  speed: 0.72,
  attenuation: 8,
  lineThickness: 2.2,
  baseRadius: 0.2,
  radiusStep: 0.085,
  scaleRate: 0.14,
  opacity: 0.42,
  blur: 0.5,
  noiseAmount: 0.03,
  rotation: -12,
  ringGap: 1.42,
  fadeIn: 0.8,
  fadeOut: 0.56,
  followMouse: true,
  mouseInfluence: 0.12,
  hoverScale: 1.08,
  parallax: 0.04,
  clickBurst: false,
};

async function go(page: PageKey) {
  const target = navItems.find((item) => item.key === page)?.path ?? '/';
  if (route.path !== target) {
    await router.push(target);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function goLogin() {
  if (route.path !== '/login') {
    await router.push('/login');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function goPath(path: string) {
  if (route.path !== path) {
    await router.push(path);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleAccountMenuSelect(action: 'profile' | 'orders' | 'favorites' | 'admin' | 'login' | 'logout') {
  if (action === 'logout') {
    clearAuthSession();
    if (route.path.startsWith('/profile')) {
      await router.push('/login');
    }
    return;
  }

  const target = {
    profile: '/profile',
    orders: '/orders',
    favorites: '/favorites',
    admin: '/admin',
    login: '/login',
  }[action];

  if (target && route.path !== target) {
    await router.push(target);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** 拉全量公开节点：供「资料补全」统计与无关键词时的网格使用。 */
async function loadExploreNodes() {
  exploreLoading.value = true;
  exploreError.value = '';
  try {
    const response = await fetchGraphNodes({
      auditStatus: 'APPROVED',
      page: 1,
      size: 500,
    });
    const publicItems = response.items.filter((item) => item.visibility === 'PUBLIC');
    allExploreNodes.value = publicItems;
    if (!exploreKeyword.value.trim()) {
      exploreNodes.value = publicItems;
      exploreTotal.value = publicItems.length;
      exploreTruncated.value = false;
    }
  } catch (err) {
    exploreError.value = err instanceof Error ? err.message : '非遗项目加载失败';
  } finally {
    exploreLoading.value = false;
  }
}

/**
 * 走后端检索：按接口返回的 total 翻页取全，最多 5 页 × 100 条，
 * 与后端 size 上限 500 对齐；超过上限时明确提示而不是静默截断。
 */
async function searchExploreNodes(keyword: string) {
  const seq = ++exploreSearchSeq;
  exploreLoading.value = true;
  exploreError.value = '';
  try {
    const collected: GraphNodeItem[] = [];
    let total = 0;
    for (let page = 1; page <= EXPLORE_MAX_PAGES; page += 1) {
      const response = await fetchGraphNodes({
        keyword,
        auditStatus: 'APPROVED',
        page,
        size: EXPLORE_PAGE_SIZE,
      });
      if (seq !== exploreSearchSeq) return;
      total = response.total ?? 0;
      collected.push(...response.items.filter((item) => item.visibility === 'PUBLIC'));
      if (response.items.length === 0 || page * EXPLORE_PAGE_SIZE >= total) break;
    }
    if (seq !== exploreSearchSeq) return;
    exploreNodes.value = collected;
    exploreTotal.value = total;
    exploreTruncated.value = total > EXPLORE_MAX_PAGES * EXPLORE_PAGE_SIZE;
  } catch (err) {
    if (seq !== exploreSearchSeq) return;
    exploreError.value = err instanceof Error ? err.message : '统一检索加载失败';
  } finally {
    if (seq === exploreSearchSeq) {
      exploreLoading.value = false;
    }
  }
}

/** 按 URL 的 ?q= 决定拉全量还是搜索结果；进入浏览页与后退都走这里。 */
async function refreshExplore() {
  const keyword = String(route.query.q ?? '').trim();
  exploreKeyword.value = keyword;
  activeCategory.value = '全部';
  if (allExploreNodes.value.length === 0) {
    await loadExploreNodes();
  }
  if (keyword) {
    await searchExploreNodes(keyword);
    return;
  }
  exploreNodes.value = allExploreNodes.value;
  exploreTotal.value = allExploreNodes.value.length;
  exploreTruncated.value = false;
}

async function submitExploreSearch() {
  const keyword = exploreKeyword.value.trim().slice(0, 50);
  exploreKeyword.value = keyword;
  activeCategory.value = '全部';
  if (String(route.query.q ?? '') === keyword) {
    await refreshExplore();
    return;
  }
  await router.replace({ path: '/explore', query: keyword ? { q: keyword } : {} });
}

async function clearExploreSearch() {
  exploreKeyword.value = '';
  activeCategory.value = '全部';
  if (!route.query.q) {
    await refreshExplore();
    return;
  }
  await router.replace({ path: '/explore', query: {} });
}
</script>

<template>
  <header class="top-nav" :class="{ 'is-scrolled': isNavScrolled }">
    <button class="brand" type="button" aria-label="非遗文化数字门户首页" @click="go('home')">
      <span class="brand-emblem" aria-hidden="true">
        <span class="brand-mark">火树</span>
      </span>
      <span class="brand-text">
        <strong>火树</strong>
        <small>文化传承</small>
      </span>
    </button>
    <nav class="nav-links" aria-label="主导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        :class="{ active: activePage === item.key }"
        @click="go(item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
    <AccountStaggeredMenu
      :account-name="accountName"
      :account-role="accountRole"
      :avatar-url="accountAvatarUrl"
      :signed-in="isSignedIn"
      :backstage-access="hasBackstageAccess"
      @select="handleAccountMenuSelect"
    />
  </header>

  <main>
    <template v-if="activePage === 'auth'">
      <AuthPage />
    </template>

    <template v-else-if="activePage === 'profile'">
      <ProfilePage />
    </template>

    <template v-else-if="activePage === 'orders'">
      <MyOrdersPage />
    </template>

    <template v-else-if="activePage === 'home'">
      <section class="heritage-opening" aria-label="非遗文化视频开屏">
        <video
          class="video-bg"
          src="/videos/555.mp4"
          autoplay
          muted
          loop
          playsinline
          aria-label="非遗文化开屏背景视频"
        ></video>
        <div class="opening-vignette" aria-hidden="true"></div>
        <div class="opening-top-fade" aria-hidden="true"></div>
        <div class="opening-bottom-fade" aria-hidden="true"></div>

        <div class="p1-ui opening-center">
          <h1 data-title="非遗">非遗</h1>
          <p>卷三十二 · 活态传承</p>
        </div>

        <aside class="p1-ui opening-feature" aria-label="非遗文化专题">
          <p class="opening-label">特别策划：</p>
          <h2>非遗文化的<br />当代回响</h2>
          <div class="opening-body-wrap">
            <div class="opening-body-scroll">
              <p>在一针一线、一腔一调、一招一式之间，非遗保存着民间生活的温度。</p>
              <p>它来自土地、节令、家族、社区，也在新的媒介中继续生长。</p>
              <p>每一门技艺都连接着传承人的手、地方的记忆和共同的审美经验。</p>
              <p>数字化不是替代传统，而是让更多人看见、理解并参与守护。</p>
              <p>这是一段关于文化如何在今天继续发光的故事。</p>
              <p>在一针一线、一腔一调、一招一式之间，非遗保存着民间生活的温度。</p>
              <p>它来自土地、节令、家族、社区，也在新的媒介中继续生长。</p>
              <p>每一门技艺都连接着传承人的手、地方的记忆和共同的审美经验。</p>
              <p>数字化不是替代传统，而是让更多人看见、理解并参与守护。</p>
              <p>这是一段关于文化如何在今天继续发光的故事。</p>
            </div>
          </div>
          <button class="opening-btn" type="button" @click="go('explore')">浏览完整专题</button>
        </aside>

        <aside class="p1-ui opening-event" aria-label="近期非遗活动">
          <p>近期活动：</p>
          <strong>非遗数字展演<br />盛大开启</strong>
        </aside>

        <p class="p1-ui opening-vertical">守护民间记忆 · 连接当代生活</p>
      </section>

      <section class="hero home-hero">
        <div class="intro-radar-background" aria-hidden="true">
          <Radar
            :speed="0.78"
            :scale="0.68"
            :ring-count="14"
            :spoke-count="14"
            :ring-thickness="0.04"
            :spoke-thickness="0.009"
            :sweep-speed="0.95"
            :sweep-width="2.35"
            :sweep-lobes="2"
            color="#f4b43f"
            background-color="#000000"
            :falloff="2"
            :brightness="1.12"
            :enable-mouse-interaction="true"
            :mouse-influence="0.08"
          />
        </div>
        <div class="hero-copy">
          <p class="label-tag">非遗文化宣传</p>
          <h1>让古老技艺，成为可以被看见的未来文化</h1>
          <p>
            非物质文化遗产承载着一个民族世代相传的生活智慧、审美经验与精神记忆。这里以数字化方式展示传统戏剧、民俗节庆、传统技艺、传统美术、口头传统等代表性内容，让散落在地域、传承人、作品与仪式中的文化线索被系统梳理、持续传播。
          </p>
          <div class="hero-actions">
            <button class="btn solid" type="button" @click="go('explore')">浏览非遗内容</button>
            <button class="btn outline" type="button" @click="go('graph')">查看知识图谱</button>
          </div>
        </div>

        <div class="card-swap-stage" aria-label="非遗图片轮换展示">
          <CardSwap
            :card-distance="60"
            :vertical-distance="70"
            :delay="5000"
            :pause-on-hover="false"
            width="min(760px, 56vw)"
            height="min(520px, 42vw)"
          >
            <Card v-for="card in swapCards" :key="card.title">
              <img :src="card.image" :alt="card.alt" />
              <div class="swap-card-caption" :class="{ 'dark-caption': card.dark }">
                <span>{{ card.tag }}</span>
                <strong>{{ card.title }}</strong>
                <small>{{ card.desc }}</small>
              </div>
            </Card>
          </CardSwap>
        </div>
      </section>

      <section class="light-section spotlight-section">
        <div class="split-layout">
          <ScrollReveal
            :split-text="false"
            as="div"
            :base-opacity="0"
            :enable-blur="true"
            :base-rotation="0"
            :blur-strength="10"
            :stagger="0.08"
            container-class-name="reveal-slot"
            text-class-name="section-copy"
            rotation-end="center center"
            word-animation-end="center center"
          >
            <p class="stamp">非遗聚光</p>
            <ScrollReveal
              :base-opacity="0"
              :enable-blur="true"
              :base-rotation="5"
              :blur-strength="10"
              container-class-name="spotlight-reveal"
              text-class-name="spotlight-reveal-text"
              rotation-end="center center"
              word-animation-end="center center"
            >
              用更有冲击力的视觉方式讲述湖南非遗
            </ScrollReveal>
            <p>
              在湖南，非遗既包括湘剧、祁剧、花鼓戏、湘昆等舞台艺术，也包括湘绣、滩头木版年画、醴陵釉下五彩瓷、土家族织锦等手工传统，还包括汨罗江畔端午习俗、苗族赶秋、女书习俗、南岳庙会等与日常生活紧密相连的民俗实践。它们不是停留在展柜中的旧物，而是通过师徒传授、社区参与、节庆仪式和当代设计不断延续的活态文化。数字图谱把项目、地域、传承人、作品、活动与媒资连接起来，帮助公众从一项技艺看见背后的历史脉络、工序体系和文化生态。
            </p>
            <div class="button-row">
              <button class="btn outline dark" type="button" @click="go('community')">进入社区问答</button>
              <button class="btn outline dark" type="button" @click="go('explore')">进入内容浏览</button>
            </div>
          </ScrollReveal>
          <ScrollReveal
            :split-text="false"
            as="div"
            :base-opacity="0"
            :enable-blur="true"
            :base-rotation="0"
            :blur-strength="10"
            container-class-name="reveal-slot"
            text-class-name="feature-poster-reveal"
            rotation-end="center center"
            word-animation-end="center center"
          >
            <figure class="feature-poster">
              <img :src="introImages.bianlianUrl" alt="湘绣图片" />
              <figcaption>
                <strong>湘绣</strong>
                <span>湖湘针法的细腻层次</span>
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>
      </section>

      <section class="heritage-story-section">
        <div class="section-head story-head">
          <p class="label-tag">非遗是什么</p>
          <ScrollFloat
            container-class-name="story-float-title"
            text-class-name="story-float-text"
            :animation-duration="1"
            ease="back.inOut(2)"
            scroll-start="top bottom-=8%"
            scroll-end="center center+=16%"
            :stagger="0.025"
          >
            一项非遗，往往是一座地方文化的入口
          </ScrollFloat>
          <p>
            非遗的价值不只在于“稀有”或“古老”，更在于它仍然存在于人的记忆、手艺、声音、节令和社区关系之中。通过知识图谱，可以把看似分散的项目介绍、历史沿革、工艺流程、代表性传承人、作品影像和传播活动组织成可追溯的知识网络。
          </p>
        </div>
        <div class="story-gallery">
          <CircularGallery
            :items="storyCardItems"
            :bend="3"
            text-color="#fff8df"
            :border-radius="0.055"
            :scroll-speed="2"
            :scroll-ease="0.045"
            font='bold 54px "Microsoft YaHei"'
          />
        </div>
      </section>

      <section class="inheritance-section">
        <div class="inheritance-panel">
          <div>
            <p class="stamp">保护与传播</p>
            <ScrollFloat
              container-class-name="inheritance-float-title"
              text-class-name="inheritance-float-text"
              :animation-duration="1"
              ease="back.inOut(2)"
              scroll-start="top bottom-=10%"
              scroll-end="center center+=10%"
              :stagger="0.03"
            >
              从记录一门手艺，到理解一片文化生态
            </ScrollFloat>
          </div>
          <p>
            一个非遗项目通常包含名称、类别、保护级别、流布地区、历史源流、核心技法、仪式场景、代表性作品和传承群体等多层信息。知识图谱适合呈现这些复杂关系：观众可以从“湘绣”继续看到掺针、毛针与双面全异绣工艺；也可以从“醴陵釉下五彩瓷”进入拉坯、分水与高温烧成工序；还可以沿着“土家族织锦技艺”理解酉水流域的纹样、织机与社区传承之间的联系。
          </p>
        </div>
        <div class="inheritance-list" aria-label="非遗数字化保护重点">
          <BorderGlow
            class-name="inheritance-glow-card"
            background-color="rgba(255, 255, 255, .08)"
            glow-color="40 88 64"
            :border-radius="24"
            :glow-radius="30"
            :glow-intensity="0.9"
            :edge-sensitivity="24"
            :cone-spread="26"
            :animated="true"
            :fill-opacity="0.22"
            :colors="['#f4b43f', '#d83a2e', '#1e9cff']"
          >
            <div class="inheritance-card"><strong>采集</strong><span>整理文字、图片、音视频与口述史资料，保留项目真实语境。</span></div>
          </BorderGlow>
          <BorderGlow
            class-name="inheritance-glow-card"
            background-color="rgba(255, 255, 255, .08)"
            glow-color="202 88 70"
            :border-radius="24"
            :glow-radius="30"
            :glow-intensity="0.9"
            :edge-sensitivity="24"
            :cone-spread="26"
            :animated="true"
            :fill-opacity="0.22"
            :colors="['#1e9cff', '#22a76d', '#f4b43f']"
          >
            <div class="inheritance-card"><strong>关联</strong><span>连接项目、人物、地区、作品与活动，形成可检索的知识链路。</span></div>
          </BorderGlow>
          <BorderGlow
            class-name="inheritance-glow-card"
            background-color="rgba(255, 255, 255, .08)"
            glow-color="6 78 68"
            :border-radius="24"
            :glow-radius="30"
            :glow-intensity="0.9"
            :edge-sensitivity="24"
            :cone-spread="26"
            :animated="true"
            :fill-opacity="0.22"
            :colors="['#d83a2e', '#f4b43f', '#22a76d']"
          >
            <div class="inheritance-card"><strong>传播</strong><span>面向公众提供浏览、问答、收藏和学习入口，让非遗知识更容易抵达日常生活。</span></div>
          </BorderGlow>
        </div>
      </section>

      <section class="inheritance-motion-section" aria-label="非遗影像动态墙">
        <GridMotion :items="inheritanceMotionImages" gradient-color="rgba(244, 180, 63, .26)" />
      </section>

      <section class="dark-section quick-entry curved-heritage-section">
        <div class="curved-heritage-copy">
          <p class="label-tag">活态传承</p>
          <h2>让非遗在今天继续被看见、被学习、被创造</h2>
          <p>
            非遗连接着手艺人的经验、地方社区的节令生活和一代代人的审美记忆。通过数字化展示与知识图谱，传统戏剧、民俗活动、手工技艺、传统美术和口头传统不再只是静态条目，而能沿着地区、人物、作品、工序和活动形成持续生长的文化网络。
          </p>
        </div>
        <CurvedLoop
          marquee-text="湘绣 ✦ 汨罗端午 ✦ 醴陵釉下五彩瓷 ✦ 滩头木版年画 ✦ 土家族织锦 ✦ 湘昆 ✦ 女书习俗 ✦ 梅山武术 ✦ "
          :speed="2.2"
          :curve-amount="360"
          direction="left"
          :interactive="true"
          class-name="curved-heritage-marquee"
        />
        <div class="curved-heritage-notes" aria-label="非遗宣传重点">
          <button type="button" @click="go('explore')">
            <span>看见地域</span>
            <p>从省市自治区进入代表性项目，理解一项技艺如何被山川物产、方言声腔、生活习俗与地方审美共同塑造。</p>
          </button>
          <button type="button" @click="go('graph')">
            <span>追溯关系</span>
            <p>以知识图谱串联项目、传承人、作品、活动与媒资，让公众从一个节点继续发现背后的历史脉络与文化生态。</p>
          </button>
          <button type="button" @click="go('favorites')">
            <span>持续学习</span>
            <p>把感兴趣的非遗内容沉淀为个人收藏和学习线索，在日常浏览、问答与打卡中建立自己的文化记忆路径。</p>
          </button>
        </div>
      </section>
    </template>

    <template v-else-if="route.path.startsWith('/heritage/')">
      <HeritageDetailPage :node-id="String(route.params.id)" />
    </template>

    <template v-else-if="route.path.startsWith('/articles/')">
      <ArticleDetailPage :article-id="String(route.params.id)" />
    </template>

    <template v-else-if="activePage === 'articles'">
      <ArticleListPage />
    </template>

    <template v-else-if="route.path.startsWith('/exhibitions/')">
      <ExhibitionDetailPage :exhibition-id="String(route.params.id)" />
    </template>

    <template v-else-if="activePage === 'exhibitions'">
      <ExhibitionListPage />
    </template>

    <template v-else-if="route.path.startsWith('/products/')">
      <ProductDetailPage :product-id="String(route.params.id)" />
    </template>

    <template v-else-if="activePage === 'products'">
      <ProductListPage />
    </template>

    <template v-else-if="activePage === 'explore'">
      <section class="page-hero compact-hero">
        <div class="explore-magic-rings-background" aria-hidden="true">
          <MagicRings v-bind="exploreMagicRingsProps" />
        </div>
        <div>
          <p class="label-tag">浏览</p>
          <h1>按地区、类别和代表项目看见湖南非遗</h1>
          <p>浏览页直接读取数据库中的湖南非遗节点，优先展示已关联的真实项目图片和中文名录信息；可按民间文学、传统音乐、传统舞蹈、传统戏剧、曲艺、传统体育游艺与杂技、传统美术、传统技艺、民俗等分类筛选。</p>
        </div>
        <figure class="page-hero-image">
          <img :src="introImages.heroDramaUrl" alt="非遗主题图片" />
        </figure>
      </section>

      <section class="regions-page-section">
        <form class="explore-search" role="search" @submit.prevent="submitExploreSearch">
          <span class="explore-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" stroke-linecap="round" />
            </svg>
          </span>
          <input
            v-model="exploreKeyword"
            type="search"
            maxlength="50"
            placeholder="搜索非遗项目、传承人、地区或技艺，例如：湘绣 / 长沙"
            aria-label="搜索非遗内容"
          />
          <button v-if="exploreKeyword" class="explore-search-clear" type="button" aria-label="清空搜索" @click="clearExploreSearch">
            ×
          </button>
          <button class="explore-search-submit" type="submit">搜索</button>
        </form>

        <div v-if="exploreKeyword" class="explore-search-summary">
          <span>
            关键词「{{ exploreKeyword }}」共找到 <strong>{{ exploreTotal }}</strong> 条
            <template v-if="exploreTruncated">（结果过多，仅展示前 {{ EXPLORE_MAX_PAGES * EXPLORE_PAGE_SIZE }} 条，请加关键词）</template>
          </span>
          <button type="button" @click="clearExploreSearch">清除搜索</button>
        </div>

        <div class="filter-panel" aria-label="非遗分类筛选">
          <button
            v-for="category in regionCategories"
            :key="category"
            class="filter-btn"
            :class="{ active: activeCategory === category }"
            type="button"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>

        <div class="material-completion-bar">
          <div>
            <strong>资料补全</strong>
            <span>当前有 {{ incompleteMaterialItems.length }} 条公开内容缺少图像资料或图像说明。请在单独提交页上传本地图片文件。</span>
          </div>
          <button class="material-completion-toggle" type="button" @click="goPath('/material-submit')">
            进入内容提交页
          </button>
        </div>
        <div v-if="exploreLoading" class="heritage-list-state">正在加载数据库中的非遗项目</div>
        <div v-else-if="exploreError" class="heritage-list-state error">{{ exploreError }}</div>
        <div v-else-if="masonryItems.length === 0" class="heritage-list-state">
          <template v-if="exploreKeyword">没有匹配「{{ exploreKeyword }}」的非遗项目，试试更短的关键词。</template>
          <template v-else-if="activeCategory !== '全部'">当前分类下暂无可公开展示的非遗项目。</template>
          <template v-else>暂无可公开展示的非遗项目</template>
          <button v-if="exploreKeyword" class="explore-search-reset" type="button" @click="clearExploreSearch">清除搜索</button>
        </div>
        <Masonry
          v-else
          :items="masonryItems"
          ease="power3.out"
          :duration="0.6"
          :stagger="0.05"
          animate-from="bottom"
          :scale-on-hover="true"
          :hover-scale="0.95"
          :blur-to-focus="true"
          :color-shift-on-hover="false"
        />
      </section>
    </template>

    <template v-else-if="activePage === 'submit'">
      <MaterialSubmitPage />
    </template>

    <template v-else-if="activePage === 'graph'">
      <section v-if="route.path.startsWith('/graph/board')" class="portal-function-section graph-function-section graph-direct-page">
        <GraphBoardPage />
      </section>
      <section v-else class="page-hero projects-hero portal-feature-hero graph-scan-hero">
        <div class="graph-scan-background" aria-hidden="true">
          <GridScan
            class-name="graph-scan-canvas"
            :perspective="780"
            :grid-size="74"
            :beams-per-side="3"
            :beam-size="4"
            :beam-speed="1.4"
            :beam-delay-max="2.4"
            :beam-delay-min="0.25"
            :beam-length="0.72"
            glow-color="#FF9FFC"
            :line-thickness="1"
            lines-color="#2F293A"
            :grid-scale="0.1"
            scan-color="#FF9FFC"
            :scan-opacity="0.4"
            enable-post
            :bloom-intensity="0.6"
            :chromatic-aberration="0.002"
            :noise-intensity="0.01"
          />
        </div>
        <div class="graph-scan-copy">
          <p class="label-tag">知识图谱</p>
          <h1>从公开节点查看非遗项目之间的关系</h1>
          <p>用图谱把项目、地区、传承人、作品与活动连接起来，帮助用户沿着关系线索继续探索。</p>
          <div class="top-entry-actions graph-top-entry-actions">
            <button class="btn compact solid graph-entry-btn" type="button" @click="goPath('/graph/board')">进入图谱面板</button>
            <span>下方保留完整检索与节点关系功能</span>
          </div>
        </div>
      </section>
    </template>

    <template v-else-if="activePage === 'community'">
      <section class="page-hero about-hero portal-feature-hero community-trail-hero community-top-entry-only">
        <div class="community-trail-layer" aria-hidden="true">
          <ImageTrail :items="communityTrailImages" :variant="7" />
        </div>
        <div class="community-trail-copy">
          <p class="label-tag">社区问答</p>
          <h1>围绕节点向传承人和社区提问</h1>
          <p>用户可以围绕非遗项目发起问题、查看回答、补充评论，让知识发现和社区互动留在同一个入口中。移动鼠标，浏览真实非遗影像留下的文化轨迹。</p>
          <div class="community-trail-actions">
            <button class="btn solid community-enter-btn" type="button" @click="goPath('/qa')">进入非遗问答吧</button>
          </div>
        </div>
      </section>
    </template>

    <template v-else-if="activePage === 'qa'">
      <section class="portal-function-section qa-portal-section">
        <CommunityQaPage />
      </section>
    </template>

    <template v-else-if="activePage === 'favorites'">
      <section v-if="currentPath === '/favorites'" class="page-hero about-hero portal-feature-hero favorites-top-hero">
        <div>
          <p class="label-tag">收藏学习</p>
          <h1>我的非遗学习清单</h1>
          <p>把收藏过的非遗节点变成一条学习线：点开卡片读资料、记笔记、让 AI 帮你总结和扩展。</p>
          <div class="top-entry-actions favorites-top-entry-actions">
            <button class="btn compact outline favorite-checkin-btn" type="button" @click="goPath('/favorites/checkin')">每日打卡</button>
          </div>
        </div>
      </section>

      <section class="portal-function-section favorites-function-section favorites-direct-page">
        <LearningStudyPage v-if="currentPath.startsWith('/favorites/study/')" />
        <LearningCheckinPage v-else-if="currentPath.startsWith('/favorites/checkin')" :current-user-id="authSession.auth?.user.id ?? null" />
        <LearningIndexPage v-else-if="currentPath === '/favorites'" />
      </section>
    </template>
  </main>
  <AiFloatingAssistant audience="portal" :role-codes="authSession.auth?.roles.map((role) => role.roleCode) ?? []" />
</template>
