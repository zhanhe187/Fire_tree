<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Heart, LayoutDashboard, LogIn, LogOut, Package, UserRound, X } from 'lucide-vue-next';
import type { gsap as GsapType } from 'gsap';

type AccountAction = 'profile' | 'orders' | 'favorites' | 'admin' | 'login' | 'logout';

interface AccountMenuItem {
  label: string;
  caption: string;
  action: AccountAction;
}

const props = defineProps<{
  accountName: string;
  accountRole: string;
  avatarUrl?: string;
  signedIn: boolean;
  backstageAccess?: boolean;
}>();

const emit = defineEmits<{
  select: [action: AccountAction];
}>();

const open = ref(false);
const busy = ref(false);
const panelRef = ref<HTMLElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);

const menuItems = computed<AccountMenuItem[]>(() => {
  if (!props.signedIn) {
    return [
      { label: '登录注册', caption: '登录后使用收藏、问答和个人中心', action: 'login' },
    ];
  }
  const items: AccountMenuItem[] = [
    { label: '个人信息', caption: '头像、联系方式与账号资料', action: 'profile' },
    { label: '我的订单', caption: '查看文创产品购买记录', action: 'orders' },
    { label: '收藏学习', caption: '查看个人收藏图谱与学习打卡', action: 'favorites' },
  ];
  if (props.backstageAccess) {
    items.push({ label: '管理后台', caption: '进入非遗知识图谱管理端', action: 'admin' });
  }
  items.push({ label: '退出登录', caption: '清除当前登录状态', action: 'logout' });
  return items;
});

const initial = computed(() => props.accountName.slice(0, 1).toUpperCase());

let clickAwayHandler: ((event: MouseEvent) => void) | null = null;
let gsapModulePromise: Promise<typeof import('gsap')> | null = null;

async function getGsap(): Promise<typeof GsapType> {
  const module = await (gsapModulePromise ??= import('gsap'));
  return module.gsap;
}

function layerElements() {
  return Array.from(layerRef.value?.querySelectorAll('.account-menu-layer') ?? []) as HTMLElement[];
}

function itemElements() {
  return Array.from(panelRef.value?.querySelectorAll('.account-menu-item-label') ?? []) as HTMLElement[];
}

async function setClosedState() {
  const gsap = await getGsap();
  const panel = panelRef.value;
  const layers = layerElements();
  if (!panel) return;
  gsap.set([panel, ...layers], { xPercent: 105, opacity: 1 });
  gsap.set(itemElements(), { yPercent: 130, rotate: 8 });
}

async function openMenu() {
  const panel = panelRef.value;
  const layers = layerElements();
  if (!panel || busy.value) return;
  const gsap = await getGsap();

  busy.value = true;
  open.value = true;
  bindClickAway();
  gsap.killTweensOf([panel, ...layers, ...itemElements()]);
  gsap.set(itemElements(), { yPercent: 130, rotate: 8 });

  const timeline = gsap.timeline({
    onComplete: () => {
      busy.value = false;
    },
  });

  layers.forEach((layer, index) => {
    timeline.fromTo(layer, { xPercent: 105 }, { xPercent: 0, duration: 0.52, ease: 'power4.out' }, index * 0.07);
  });
  timeline.fromTo(panel, { xPercent: 105 }, { xPercent: 0, duration: 0.64, ease: 'power4.out' }, 0.16);
  timeline.to(
    itemElements(),
    { yPercent: 0, rotate: 0, duration: 0.82, ease: 'power4.out', stagger: 0.08 },
    0.26,
  );
}

async function closeMenu() {
  const panel = panelRef.value;
  const layers = layerElements();
  if (!panel) return;
  const gsap = await getGsap();

  busy.value = true;
  unbindClickAway();
  gsap.killTweensOf([panel, ...layers, ...itemElements()]);
  gsap.to([panel, ...layers], {
    xPercent: 105,
    duration: 0.34,
    ease: 'power3.in',
    onComplete: () => {
      open.value = false;
      busy.value = false;
      gsap.set(itemElements(), { yPercent: 130, rotate: 8 });
    },
  });
}

function toggleMenu() {
  if (open.value) {
    closeMenu();
  } else {
    openMenu();
  }
}

function selectItem(action: AccountAction) {
  emit('select', action);
  closeMenu();
}

function bindClickAway() {
  unbindClickAway();
  clickAwayHandler = (event: MouseEvent) => {
    const target = event.target as Node;
    if (panelRef.value?.contains(target) || buttonRef.value?.contains(target)) return;
    closeMenu();
  };
  document.addEventListener('mousedown', clickAwayHandler);
}

function unbindClickAway() {
  if (!clickAwayHandler) return;
  document.removeEventListener('mousedown', clickAwayHandler);
  clickAwayHandler = null;
}

watch(menuItems, () => {
  if (open.value) {
    nextTick(() => {
      getGsap().then((gsap) => {
        gsap.set(itemElements(), { yPercent: 0, rotate: 0 });
      });
    });
  }
});

onMounted(() => {
  nextTick(() => {
    void setClosedState();
  });
});

onBeforeUnmount(() => {
  unbindClickAway();
  const panel = panelRef.value;
  if (gsapModulePromise) {
    void getGsap().then((gsap) => {
      gsap.killTweensOf([panel, ...layerElements(), ...itemElements()].filter(Boolean));
    });
  }
});
</script>

<template>
  <div class="account-menu-shell">
    <button
      ref="buttonRef"
      class="account-entry"
      :class="{ 'is-open': open }"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="打开用户菜单"
      @click="toggleMenu"
    >
      <div class="account-avatar">
        <img v-if="avatarUrl" :src="avatarUrl" alt="" />
        <b v-else>{{ initial }}</b>
      </div>
      <strong>{{ accountName }}</strong>
      <small>{{ accountRole }}</small>
    </button>

    <div v-show="open" class="account-menu-scrim" aria-hidden="true"></div>
    <div ref="layerRef" v-show="open || busy" class="account-menu-layers" :class="{ 'is-open': open }" aria-hidden="true">
      <div class="account-menu-layer layer-one"></div>
      <div class="account-menu-layer layer-two"></div>
    </div>

    <aside ref="panelRef" v-show="open || busy" class="account-menu-panel" :class="{ 'is-open': open }" :aria-hidden="!open">
      <button class="account-menu-close" type="button" aria-label="关闭用户菜单" @click="closeMenu">
        <X :size="18" />
      </button>

      <div class="account-menu-head">
        <span class="account-menu-avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="" />
          <span v-else>{{ initial }}</span>
        </span>
        <div>
          <strong>{{ accountName }}</strong>
          <small>{{ accountRole }}</small>
        </div>
      </div>

      <nav class="account-menu-list" aria-label="用户菜单">
        <button
          v-for="(item, index) in menuItems"
          :key="item.action"
          class="account-menu-item"
          type="button"
          :data-index="String(index + 1).padStart(2, '0')"
          @click="selectItem(item.action)"
        >
          <span class="account-menu-icon" aria-hidden="true">
            <UserRound v-if="item.action === 'profile'" :size="20" />
            <Package v-else-if="item.action === 'orders'" :size="20" />
            <Heart v-else-if="item.action === 'favorites'" :size="20" />
            <LayoutDashboard v-else-if="item.action === 'admin'" :size="20" />
            <LogOut v-else-if="item.action === 'logout'" :size="20" />
            <LogIn v-else :size="20" />
          </span>
          <span class="account-menu-text">
            <span class="account-menu-item-label">{{ item.label }}</span>
            <small>{{ item.caption }}</small>
          </span>
        </button>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
.account-menu-shell {
  position: relative;
  z-index: 80;
}

.account-menu-scrim {
  position: fixed;
  inset: 0;
  z-index: 65;
  background: rgba(39, 29, 21, 0.24);
  backdrop-filter: blur(2px);
}

.account-avatar {
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, #d83a2e, #f4b43f);
  font-weight: 900;
}

.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-avatar b {
  color: #fff;
  font-size: 14px;
  line-height: 1;
}

.account-menu-layers {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 66;
  width: min(420px, 92vw);
  pointer-events: none;
  visibility: hidden;
  overflow: hidden;
}

.account-menu-layer,
.account-menu-panel {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.layer-one {
  background: #2e6f63;
}

.layer-two {
  background: #bd4633;
}

.account-menu-panel {
  position: fixed;
  left: auto;
  right: 0;
  z-index: 67;
  display: flex;
  flex-direction: column;
  width: min(420px, 92vw);
  height: 100vh;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(255, 248, 232, 0.96), rgba(244, 231, 204, 0.96)),
    #fff8ea;
  box-shadow: -28px 0 70px rgba(39, 29, 21, 0.22);
  pointer-events: none;
  visibility: hidden;
  overflow-x: hidden;
}

.account-menu-layers.is-open,
.account-menu-panel.is-open {
  visibility: visible;
}

.account-menu-panel.is-open {
  pointer-events: auto;
}

.account-menu-close {
  align-self: flex-end;
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(125, 33, 25, 0.22);
  background: rgba(255, 255, 255, 0.46);
  color: #7d2119;
  cursor: pointer;
}

.account-menu-head {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 16px;
  margin: 34px 0 42px;
}

.account-menu-avatar {
  display: inline-grid;
  place-items: center;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border: 1px solid rgba(125, 33, 25, 0.28);
  background: #7d2119;
  color: #f7dfad;
  font-weight: 900;
  font-size: 24px;
}

.account-menu-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-menu-head strong {
  display: block;
  color: #271d15;
  font-size: 24px;
}

.account-menu-head small {
  display: block;
  margin-top: 6px;
  color: rgba(39, 29, 21, 0.58);
  font-weight: 700;
}

.account-menu-list {
  display: grid;
  gap: 12px;
}

.account-menu-item {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 14px;
  min-height: 82px;
  padding: 14px 46px 14px 14px;
  overflow: hidden;
  border: 1px solid rgba(125, 33, 25, 0.18);
  background: rgba(255, 255, 255, 0.38);
  color: #271d15;
  text-align: left;
  cursor: pointer;
}

.account-menu-item::after {
  content: attr(data-index);
  position: absolute;
  top: 14px;
  right: 16px;
  color: #bd4633;
  font-size: 12px;
  font-weight: 900;
}

.account-menu-icon {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  background: #271d15;
  color: #f7dfad;
}

.account-menu-text {
  display: grid;
  gap: 7px;
  overflow: hidden;
}

.account-menu-item-label {
  display: inline-block;
  color: #271d15;
  font-size: 22px;
  font-weight: 900;
  will-change: transform;
  transform-origin: 50% 100%;
}

.account-menu-item small {
  color: rgba(39, 29, 21, 0.58);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}

.account-menu-item:hover,
.account-menu-item:focus-visible {
  border-color: rgba(189, 70, 51, 0.6);
  background: rgba(255, 255, 255, 0.66);
  outline: none;
}

@media (max-width: 640px) {
  .account-menu-panel,
  .account-menu-layers {
    width: 100vw;
  }

  .account-menu-panel {
    padding: 18px;
  }
}
</style>
