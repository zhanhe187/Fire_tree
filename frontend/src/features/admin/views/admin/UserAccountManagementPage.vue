<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Edit3, KeyRound, Loader2, RefreshCcw, Search, ShieldCheck, ToggleLeft, ToggleRight, UserPlus, X } from 'lucide-vue-next';
import { AdminUserCreatePayload, AdminUserItem, AdminUserUpdatePayload, createAdminUser, fetchAdminUsers, resetAdminUserPassword, updateAdminUser } from '../../services/admin';
import { authSession } from '../../../auth/services/authState';

type ModalMode = 'create' | 'edit' | 'password';

const users = ref<AdminUserItem[]>([]);
const selectedUser = ref<AdminUserItem | null>(null);
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const modalMode = ref<ModalMode>('edit');
const error = ref('');
const successMessage = ref('');
// 当前登录账号：不允许停用/降级自己，避免把自己锁在门外
const currentUserId = computed(() => Number(authSession.auth?.user?.id ?? 0));

const filters = reactive({
  keyword: '',
  userType: '',
  status: '',
  page: 1,
  size: 10,
  total: 0,
});

const form = reactive<AdminUserUpdatePayload>({
  nickname: '',
  realName: '',
  phone: '',
  email: '',
  userType: 'NORMAL',
  status: 1,
});

const createForm = reactive<AdminUserCreatePayload>({
  username: '',
  password: '',
  nickname: '',
  userType: 'NORMAL',
  phone: '',
  email: '',
});

const passwordForm = reactive({
  newPassword: '',
});

const pageCount = computed(() => Math.max(1, Math.ceil(filters.total / filters.size)));
const activeCount = computed(() => users.value.filter((item) => Number(item.status) === 1).length);
const adminCount = computed(() => users.value.filter((item) => item.userType === 'SUPER_ADMIN').length);

const userTypeLabels: Record<string, string> = {
  SUPER_ADMIN: '管理员',
  INHERITOR: '传承人',
  NORMAL: '普通用户',
};

function statusToggle(user: AdminUserItem) {
  return Number(user.status) === 1 ? '启用' : '停用';
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchAdminUsers(filters);
    users.value = response.items;
    filters.total = response.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '用户列表加载失败';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  selectedUser.value = null;
  modalMode.value = 'create';
  Object.assign(createForm, {
    username: '',
    password: '',
    nickname: '',
    userType: 'NORMAL',
    phone: '',
    email: '',
  });
  modalOpen.value = true;
}

function openEdit(user: AdminUserItem) {
  selectedUser.value = user;
  modalMode.value = 'edit';
  Object.assign(form, {
    nickname: user.nickname,
    realName: user.realName ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    userType: user.userType,
    status: Number(user.status),
  });
  modalOpen.value = true;
}

function openPassword(user: AdminUserItem) {
  selectedUser.value = user;
  modalMode.value = 'password';
  passwordForm.newPassword = '';
  modalOpen.value = true;
}

async function saveCreate() {
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await createAdminUser({
      username: createForm.username,
      password: createForm.password,
      nickname: createForm.nickname || undefined,
      userType: createForm.userType,
      phone: createForm.phone || undefined,
      email: createForm.email || undefined,
    });
    modalOpen.value = false;
    successMessage.value = '账号已创建';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '账号创建失败';
  } finally {
    saving.value = false;
  }
}

async function saveEdit() {
  if (!selectedUser.value) return;
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await updateAdminUser(selectedUser.value.id, {
      nickname: form.nickname,
      realName: form.realName || null,
      phone: form.phone || null,
      email: form.email || null,
      userType: form.userType,
      status: Number(form.status),
    });
    modalOpen.value = false;
    successMessage.value = '账号资料已更新';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '账号资料保存失败';
  } finally {
    saving.value = false;
  }
}

async function savePassword() {
  if (!selectedUser.value) return;
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await resetAdminUserPassword(selectedUser.value.id, { newPassword: passwordForm.newPassword });
    modalOpen.value = false;
    successMessage.value = '密码已重置';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '密码重置失败';
  } finally {
    saving.value = false;
  }
}

async function toggleUserStatus(user: AdminUserItem) {
  if (Number(user.id) === currentUserId.value) {
    error.value = '不能停用或启用当前登录的账号，请改用其他管理员账号操作。';
    successMessage.value = '';
    return;
  }
  saving.value = true;
  error.value = '';
  successMessage.value = '';
  const nextStatus = Number(user.status) === 1 ? 0 : 1;
  try {
    // 后端 updateUser 对 real_name / phone / email 是直接赋值（不是 coalesce），
    // 只发 { status } 会把这些字段写成 NULL。这里把列表里已有的值原样回传。
    await updateAdminUser(user.id, {
      nickname: user.nickname || undefined,
      realName: user.realName ?? null,
      phone: user.phone ?? null,
      email: user.email ?? null,
      status: nextStatus,
    });
    successMessage.value = nextStatus === 1 ? '账号已启用' : '账号已停用';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '状态更新失败';
  } finally {
    saving.value = false;
  }
}

function resetFilters() {
  filters.keyword = '';
  filters.userType = '';
  filters.status = '';
  filters.page = 1;
  void load();
}

function changePage(delta: number) {
  filters.page = Math.min(pageCount.value, Math.max(1, filters.page + delta));
  void load();
}

function formatTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

onMounted(load);
</script>

<template>
  <section class="user-account-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">系统管理</p>
        <h2>全部用户账号密码管理</h2>
        <span>管理员集中查看全部账号，维护账号状态、基础资料并重置密码。</span>
      </div>
      <div class="heading-actions">
        <button class="primary-action" type="button" @click="openCreate">
          <UserPlus :size="16" />
          创建账号
        </button>
        <button class="secondary-action" type="button" @click="load">
          <RefreshCcw :size="16" />
          刷新
        </button>
      </div>
    </header>

    <div v-if="error" class="inline-error">{{ error }}</div>
    <div v-if="successMessage" class="inline-success">{{ successMessage }}</div>

    <section class="risk-stats">
      <article>
        <ShieldCheck :size="20" />
        <span>用户总数</span>
        <strong>{{ filters.total }}</strong>
      </article>
      <article>
        <ToggleRight :size="20" />
        <span>启用账号</span>
        <strong>{{ activeCount }}</strong>
      </article>
      <article>
        <KeyRound :size="20" />
        <span>管理员</span>
        <strong>{{ adminCount }}</strong>
      </article>
    </section>

    <section class="filter-bar">
      <label>
        <span>关键词</span>
        <input v-model="filters.keyword" type="search" placeholder="用户名 / 昵称 / 手机 / 邮箱" @keyup.enter="filters.page = 1; load()" />
      </label>
      <label>
        <span>账号类型</span>
        <select v-model="filters.userType">
          <option value="">全部类型</option>
          <option value="SUPER_ADMIN">管理员</option>
          <option value="INHERITOR">传承人</option>
          <option value="NORMAL">普通用户</option>
        </select>
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">停用</option>
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

    <section class="table-panel">
      <div class="table-toolbar">
        <span>共 {{ filters.total }} 个账号</span>
        <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
      </div>

      <div v-if="loading" class="state-panel">
        <Loader2 :size="24" class="spin" />
        <span>正在加载用户账号</span>
      </div>

      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th>账号</th>
              <th>类型</th>
              <th>联系方式</th>
              <th>状态</th>
              <th>最近登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <strong>{{ user.nickname || user.username }}</strong>
                <small>{{ user.username }}</small>
              </td>
              <td>{{ userTypeLabels[user.userType] || user.userType }}</td>
              <td>
                <strong>{{ user.phone || '-' }}</strong>
                <small>{{ user.email || '-' }}</small>
              </td>
              <td>
                <span class="status-chip" :class="Number(user.status) === 1 ? 'published' : 'offline'">
                  {{ statusToggle(user) }}
                </span>
              </td>
              <td>{{ formatTime(user.lastLoginAt) }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" title="编辑账号" @click="openEdit(user)">
                    <Edit3 :size="15" />
                  </button>
                  <button type="button" title="重置密码" @click="openPassword(user)">
                    <KeyRound :size="15" />
                  </button>
                  <button type="button" title="启停账号" @click="toggleUserStatus(user)">
                    <ToggleRight v-if="Number(user.status) === 1" :size="15" />
                    <ToggleLeft v-else :size="15" />
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

    <div v-if="modalOpen" class="modal-backdrop">
      <section class="node-modal">
        <header>
          <h3>{{ modalMode === 'create' ? '创建账号' : (modalMode === 'edit' ? '编辑账号' : '重置密码') }}</h3>
          <button class="icon-only" type="button" @click="modalOpen = false">
            <X :size="16" />
          </button>
        </header>

        <div v-if="modalMode === 'create'" class="form-grid">
          <label>
            <span>用户名</span>
            <input v-model.trim="createForm.username" type="text" placeholder="登录账号" />
          </label>
          <label>
            <span>密码</span>
            <input v-model="createForm.password" type="password" minlength="6" placeholder="至少 6 位" />
          </label>
          <label>
            <span>昵称</span>
            <input v-model.trim="createForm.nickname" type="text" />
          </label>
          <label>
            <span>手机号</span>
            <input v-model.trim="createForm.phone" type="tel" />
          </label>
          <label>
            <span>邮箱</span>
            <input v-model.trim="createForm.email" type="email" />
          </label>
          <label>
            <span>账号类型</span>
            <select v-model="createForm.userType">
              <option value="SUPER_ADMIN">管理员</option>
              <option value="INHERITOR">传承人</option>
              <option value="NORMAL">普通用户</option>
            </select>
          </label>
        </div>

        <div v-else-if="modalMode === 'edit'" class="form-grid">
          <label>
            <span>昵称</span>
            <input v-model="form.nickname" type="text" />
          </label>
          <label>
            <span>真实姓名</span>
            <input v-model="form.realName" type="text" />
          </label>
          <label>
            <span>手机号</span>
            <input v-model="form.phone" type="tel" />
          </label>
          <label>
            <span>邮箱</span>
            <input v-model="form.email" type="email" />
          </label>
          <label>
            <span>账号类型</span>
            <select v-model="form.userType">
              <option value="SUPER_ADMIN">管理员</option>
              <option value="INHERITOR">传承人</option>
              <option value="NORMAL">普通用户</option>
            </select>
          </label>
          <label>
            <span>状态</span>
            <select v-model.number="form.status">
              <option :value="1">启用</option>
              <option :value="0">停用</option>
            </select>
          </label>
        </div>

        <div v-else class="form-grid">
          <label class="wide">
            <span>新密码</span>
            <input v-model="passwordForm.newPassword" type="password" minlength="6" placeholder="至少 6 位" />
          </label>
        </div>

        <div v-if="error" class="inline-error modal-inline-error">
          {{ error }}
        </div>

        <footer>
          <button class="secondary-action" type="button" @click="modalOpen = false">取消</button>
          <button class="primary-action" type="button" :disabled="saving" @click="modalMode === 'create' ? saveCreate() : (modalMode === 'edit' ? saveEdit() : savePassword())">
            <Loader2 v-if="saving" :size="16" class="spin" />
            {{ modalMode === 'create' ? '创建' : '保存' }}
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
