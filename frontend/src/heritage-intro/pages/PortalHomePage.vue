<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Search, MapPinned, Network, MessageCircleQuestion, Heart, CalendarCheck } from 'lucide-vue-next';

const query = ref('');
const heroCards = [
  { title: '湘绣', meta: '传统美术 / 长沙', image: '/heritage-media/embroidery-cover.jpg' },
  { title: '汨罗江畔端午习俗', meta: '民俗 / 岳阳', image: '/heritage-media/dragon-boat-cover.jpg' },
  { title: '醴陵釉下五彩瓷', meta: '传统技艺 / 株洲', image: '/heritage-media/porcelain-cover.jpg' },
];

const normalizedQuery = computed(() => query.value.trim());
</script>

<template>
  <main class="portal-home">
    <section class="portal-hero">
      <div class="portal-hero-copy">
        <p class="portal-kicker">面向公众的湖南非遗文化网站</p>
        <h1>从项目、地区、图谱和问答进入湖南非遗知识现场</h1>
        <form class="portal-search" @submit.prevent>
          <Search :size="19" />
          <input v-model="query" type="search" placeholder="搜索非遗项目、地区、传承人" aria-label="搜索非遗内容" />
          <RouterLink :to="normalizedQuery ? `/explore?q=${encodeURIComponent(normalizedQuery)}` : '/explore'">
            搜索
          </RouterLink>
        </form>
        <div class="portal-actions">
          <RouterLink to="/explore"><MapPinned :size="18" />地区与项目</RouterLink>
          <RouterLink to="/graph"><Network :size="18" />知识图谱</RouterLink>
          <RouterLink to="/community"><MessageCircleQuestion :size="18" />社区问答</RouterLink>
        </div>
      </div>

      <div class="portal-hero-gallery" aria-label="非遗项目精选">
        <article v-for="card in heroCards" :key="card.title">
          <img :src="card.image" :alt="card.title" />
          <span>{{ card.meta }}</span>
          <strong>{{ card.title }}</strong>
        </article>
      </div>
    </section>

    <section class="portal-workflows" aria-label="用户端核心功能">
      <RouterLink to="/explore">
        <MapPinned :size="22" />
        <strong>浏览项目</strong>
        <span>按地区、类别和关键词查看公开内容</span>
      </RouterLink>
      <RouterLink to="/graph">
        <Network :size="22" />
        <strong>探索关系</strong>
        <span>从项目延伸到传承人、作品和地域</span>
      </RouterLink>
      <RouterLink to="/favorites">
        <Heart :size="22" />
        <strong>收藏学习</strong>
        <span>沉淀个人节点、笔记和打卡记录</span>
      </RouterLink>
      <RouterLink to="/favorites">
        <CalendarCheck :size="22" />
        <strong>每日推荐</strong>
        <span>围绕兴趣继续发现新的非遗线索</span>
      </RouterLink>
    </section>

    <section class="portal-feature-strip">
      <img src="/heritage-media/region-cover.jpg" alt="湖南非遗地区文化景观" />
      <div>
        <p class="portal-kicker">与后台分工清晰</p>
        <h2>用户端负责发现和互动，后台负责审核和治理</h2>
        <p>
          普通用户从网站入口浏览、搜索、收藏和提问；管理员从后台入口维护节点、关系、媒资、审核和统计。
          两端复用同一套图谱数据，但展示边界和操作权限分开。
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.portal-home {
  padding-bottom: 64px;
}

.portal-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
  gap: clamp(28px, 5vw, 70px);
  align-items: center;
  min-height: calc(100vh - 76px);
  padding: clamp(42px, 8vw, 88px) clamp(20px, 5vw, 64px);
}

.portal-kicker {
  margin: 0 0 12px;
  color: #9a3328;
  font-size: 13px;
  font-weight: 900;
}

.portal-hero h1 {
  max-width: 760px;
  margin: 0;
  color: #211711;
  font-family: var(--font-display);
  font-size: clamp(42px, 7vw, 86px);
  line-height: 1.02;
  letter-spacing: 0;
}

.portal-search {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  max-width: 680px;
  margin-top: 30px;
  padding: 10px 10px 10px 18px;
  border: 1px solid rgba(98, 54, 24, 0.2);
  background: rgba(255, 255, 255, 0.66);
  box-shadow: 0 24px 70px rgba(90, 56, 18, 0.13);
}

.portal-search input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #241912;
  font: inherit;
}

.portal-search a,
.portal-actions a,
.portal-workflows a {
  color: inherit;
  text-decoration: none;
}

.portal-search a {
  display: inline-grid;
  place-items: center;
  min-height: 42px;
  padding: 0 20px;
  background: #8f261e;
  color: #fff6e1;
  font-weight: 900;
}

.portal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.portal-actions a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 15px;
  border: 1px solid rgba(98, 54, 24, 0.2);
  background: rgba(255, 255, 255, 0.34);
  font-weight: 800;
}

.portal-hero-gallery {
  display: grid;
  grid-template-columns: 1fr 0.82fr;
  grid-auto-rows: 230px;
  gap: 14px;
}

.portal-hero-gallery article {
  position: relative;
  overflow: hidden;
  min-height: 0;
  background: #1b1410;
  color: #fff3d1;
}

.portal-hero-gallery article:first-child {
  grid-row: span 2;
}

.portal-hero-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
}

.portal-hero-gallery span,
.portal-hero-gallery strong {
  position: absolute;
  left: 18px;
  right: 18px;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.42);
}

.portal-hero-gallery span {
  bottom: 54px;
  font-size: 12px;
  font-weight: 800;
}

.portal-hero-gallery strong {
  bottom: 20px;
  font-size: 24px;
}

.portal-workflows,
.portal-feature-strip {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.portal-workflows {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.portal-workflows a {
  display: grid;
  gap: 9px;
  padding: 22px;
  border: 1px solid rgba(98, 54, 24, 0.18);
  background: rgba(255, 251, 240, 0.68);
}

.portal-workflows strong {
  font-size: 18px;
}

.portal-workflows span {
  color: rgba(39, 29, 21, 0.66);
  font-size: 13px;
  line-height: 1.7;
}

.portal-feature-strip {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) 1fr;
  gap: clamp(24px, 5vw, 62px);
  align-items: center;
  margin-top: 54px;
}

.portal-feature-strip img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.portal-feature-strip h2 {
  margin: 0;
  color: #251913;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.12;
}

.portal-feature-strip p:last-child {
  max-width: 680px;
  color: rgba(39, 29, 21, 0.72);
  line-height: 1.9;
}

@media (max-width: 960px) {
  .portal-hero,
  .portal-feature-strip {
    grid-template-columns: 1fr;
  }

  .portal-workflows {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .portal-hero-gallery,
  .portal-workflows {
    grid-template-columns: 1fr;
  }

  .portal-search {
    grid-template-columns: auto 1fr;
  }

  .portal-search a {
    grid-column: 1 / -1;
  }
}
</style>
