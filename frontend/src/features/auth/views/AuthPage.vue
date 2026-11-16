<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Eye, EyeOff, KeyRound, LogIn, Mail, RotateCw, UserPlus } from 'lucide-vue-next';
import { CaptchaResponse, fetchCaptcha, fetchCurrentUser, login, register, resetPasswordByEmail, sendAuthEmailCode } from '../services/auth';
import { authSession, clearAuthSession, setAuthSession } from '../services/authState';
import loginBgUrl from '../../../heritage-intro/assets/login.png';
import adminLoginBgUrl from '../../../heritage-intro/assets/login2.png';
import RotatingText from '../../../shared/components/RotatingText.vue';
import TrueFocus from '../../../shared/components/TrueFocus.vue';

const props = defineProps<{
  admin?: boolean;
}>();

type AuthMode = 'login' | 'register' | 'forgot';

const text = {
  heritage: '非遗文化',
  projects: ['皮影戏', '景泰蓝', '木版年画', '龙泉青瓷', '花鼓戏'],
  adminFocus: '非遗匠心传承',
  adminSubtitle: '登录后进入非遗知识图谱管理后台',
  userSubtitle: '登录后参与提问、评论、点赞、收藏与个人学习',
  login: '登录',
  register: '注册',
  forgot: '忘记密码',
  logout: '退出当前账号',
  username: '用户名',
  usernamePlaceholder: '请输入用户名',
  demoHint: '',
  nickname: '昵称',
  nicknamePlaceholder: '显示在评论区的名字',
  email: '邮箱',
  emailPlaceholder: '请输入邮箱地址',
  password: '密码',
  newPassword: '新密码',
  passwordPlaceholder: '请输入密码',
  newPasswordPlaceholder: '请输入新密码',
  userType: '账号类型',
  normalUser: '普通用户',
  inheritor: '传承人',
  admin: '管理员',
  captcha: '图形验证码',
  captchaPlaceholder: '输入图形验证码',
  emailCode: '邮箱验证码',
  emailCodePlaceholder: '输入邮箱验证码',
  sendCode: '发送验证码',
  sending: '发送中',
  processing: '处理中...',
  registerSubmit: '注册并登录',
  resetPassword: '重置密码',
  showPassword: '显示密码',
  hidePassword: '隐藏密码',
};

const route = useRoute();
const router = useRouter();
const mode = ref<AuthMode>('login');
const loading = ref(false);
const sendingCode = ref(false);
const showPassword = ref(false);
const showNewPassword = ref(false);
const error = ref('');
const success = ref('');
const captcha = ref<CaptchaResponse | null>(null);
const captchaLoading = ref(false);
const authCardStyle = reactive({ '--card-x': '50%', '--card-y': '50%' });

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  emailCode: '',
  newPassword: '',
  captchaCode: '',
  userType: props.admin ? 'SUPER_ADMIN' : 'NORMAL',
});

const subtitle = computed(() => (props.admin ? text.adminSubtitle : text.userSubtitle));
const currentName = computed(() => authSession.auth?.user.nickname || authSession.auth?.user.username || '');
const submitLabel = computed(() => {
  if (loading.value) return text.processing;
  if (mode.value === 'register') return text.registerSubmit;
  if (mode.value === 'forgot') return text.resetPassword;
  return text.login;
});

onMounted(() => {
  void loadCaptcha();
});

watch(mode, () => {
  error.value = '';
  success.value = '';
  form.captchaCode = '';
  void loadCaptcha();
});

async function loadCaptcha() {
  captchaLoading.value = true;
  captcha.value = null;
  try {
    captcha.value = await fetchCaptcha();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '验证码加载失败';
  } finally {
    captchaLoading.value = false;
  }
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode;
  showPassword.value = false;
  showNewPassword.value = false;
}

async function sendEmailCode(purpose: 'REGISTER' | 'RESET_PASSWORD') {
  error.value = '';
  success.value = '';
  if (!form.email) {
    error.value = '请先填写邮箱';
    return;
  }
  if (captchaLoading.value || !captcha.value || !form.captchaCode) {
    error.value = '请先输入图形验证码';
    return;
  }

  sendingCode.value = true;
  try {
    const response = await sendAuthEmailCode({
      email: form.email,
      purpose,
      captchaId: captcha.value.captchaId,
      captchaCode: form.captchaCode,
    });
    success.value = `验证码已发送至 ${response.email}，请在邮箱中查看后填写`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '邮箱验证码发送失败';
  } finally {
    sendingCode.value = false;
    form.captchaCode = '';
    await loadCaptcha();
  }
}

async function submit() {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    if (mode.value === 'login') {
      if (!captcha.value) {
        throw new Error('验证码未加载');
      }
      const payload = await login({
        username: form.username,
        password: form.password,
        captchaId: captcha.value.captchaId,
        captchaCode: form.captchaCode,
      });
      setAuthSession(payload);
      if (!payload.token && authSession.token) {
        setAuthSession(await fetchCurrentUser(authSession.token));
      }
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
      const roleCodes = payload.roles?.map((role) => role.roleCode) ?? [];
      const isBackstage = roleCodes.includes('SUPER_ADMIN') || roleCodes.includes('INHERITOR');
      let target = redirect || (isBackstage ? '/admin' : '/community');
      if (target.startsWith('/admin') && !isBackstage) {
        target = '/community';
      }
      await router.push(target);
      return;
    }

    if (mode.value === 'register') {
      const payload = await register({
        username: form.username,
        password: form.password,
        nickname: form.nickname || form.username,
        userType: form.userType as 'SUPER_ADMIN' | 'INHERITOR' | 'NORMAL',
        email: form.email,
        emailCode: form.emailCode,
      });
      setAuthSession(payload);
      const roleCodes = payload.roles?.map((role) => role.roleCode) ?? [];
      const isBackstage = roleCodes.includes('SUPER_ADMIN') || roleCodes.includes('INHERITOR');
      await router.push(isBackstage ? '/admin' : '/community');
      return;
    }

    await resetPasswordByEmail({
      email: form.email,
      emailCode: form.emailCode,
      newPassword: form.newPassword,
    });
    form.password = '';
    form.newPassword = '';
    form.emailCode = '';
    switchMode('login');
    success.value = '密码已重置，请使用新密码登录';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
    form.captchaCode = '';
    await loadCaptcha();
  } finally {
    loading.value = false;
  }
}

function logout() {
  clearAuthSession();
}

function handleAuthCardPointerMove(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
  const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
  authCardStyle['--card-x'] = `${x}%`;
  authCardStyle['--card-y'] = `${y}%`;
}
</script>

<template>
  <section
    class="auth-page"
    :class="{ admin }"
    :style="admin ? { '--auth-bg': `url(${adminLoginBgUrl})` } : { '--auth-bg': `url(${loginBgUrl})` }"
  >
    <div class="auth-visual">
      <div v-if="!admin" class="auth-rotating-headline" :aria-label="text.heritage">
        <strong>{{ text.heritage }}</strong>
        <RotatingText
          :texts="text.projects"
          main-class-name="rotating-heritage-name"
          stagger-from="last"
          :initial="{ y: '100%', opacity: 0 }"
          :animate="{ y: 0, opacity: 1 }"
          :exit="{ y: '-120%', opacity: 0 }"
          :stagger-duration="0.035"
          split-level-class-name="rotating-heritage-split"
          element-level-class-name="rotating-heritage-char"
          :transition="{ type: 'spring', damping: 30, stiffness: 420 }"
          :rotation-interval="2000"
        />
      </div>
      <template v-else>
        <span class="auth-kicker">ADMIN</span>
        <TrueFocus
          class="admin-true-focus"
          :sentence="text.adminFocus"
          separator=""
          :manual-mode="false"
          :blur-amount="4"
          border-color="#f0b45a"
          glow-color="rgba(240, 180, 90, 0.62)"
          :animation-duration="0.8"
          :pause-between-animations="0.85"
        />
        <p>{{ subtitle }}</p>
      </template>
    </div>

    <form class="auth-card" :style="authCardStyle" @pointermove="handleAuthCardPointerMove" @submit.prevent="submit">
      <div class="auth-tabs" role="tablist">
        <button type="button" :class="{ active: mode === 'login' }" @click="switchMode('login')">{{ text.login }}</button>
        <button type="button" :class="{ active: mode === 'register' }" @click="switchMode('register')">{{ text.register }}</button>
      </div>

      <button class="auth-forgot-tab" type="button" :class="{ active: mode === 'forgot' }" @click="switchMode('forgot')">
        {{ text.forgot }}
      </button>

      <div v-if="currentName" class="auth-current">
        <strong>{{ currentName }}</strong>
        <button type="button" @click="logout">{{ text.logout }}</button>
      </div>

      <label v-if="mode !== 'forgot'">
        <span>{{ text.username }}</span>
        <input v-model.trim="form.username" autocomplete="username" required :placeholder="text.usernamePlaceholder" />
      </label>

      <p v-if="mode === 'login'" class="auth-helper">{{ text.demoHint }}</p>

      <label v-if="mode === 'register'">
        <span>{{ text.nickname }}</span>
        <input v-model.trim="form.nickname" :placeholder="text.nicknamePlaceholder" />
      </label>

      <label v-if="mode !== 'login'">
        <span>{{ text.email }}</span>
        <input v-model.trim="form.email" type="email" autocomplete="email" required :placeholder="text.emailPlaceholder" />
      </label>

      <label v-if="mode !== 'forgot'">
        <span>{{ text.password }}</span>
        <div class="auth-input-action">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            required
            :placeholder="text.passwordPlaceholder"
          />
          <button type="button" :aria-label="showPassword ? text.hidePassword : text.showPassword" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" :size="17" />
            <Eye v-else :size="17" />
          </button>
        </div>
      </label>

      <label v-else>
        <span>{{ text.newPassword }}</span>
        <div class="auth-input-action">
          <input
            v-model="form.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
            :placeholder="text.newPasswordPlaceholder"
          />
          <button type="button" :aria-label="showNewPassword ? text.hidePassword : text.showPassword" @click="showNewPassword = !showNewPassword">
            <EyeOff v-if="showNewPassword" :size="17" />
            <Eye v-else :size="17" />
          </button>
        </div>
      </label>

      <label v-if="mode === 'register'">
        <span>{{ text.userType }}</span>
        <select v-model="form.userType">
          <option value="NORMAL">{{ text.normalUser }}</option>
          <option value="INHERITOR">{{ text.inheritor }}</option>
          <option v-if="admin" value="SUPER_ADMIN">{{ text.admin }}</option>
        </select>
      </label>

      <label class="captcha-field">
        <span>{{ text.captcha }}</span>
        <div class="captcha-row">
          <input v-model.trim="form.captchaCode" maxlength="8" :required="mode === 'login'" :placeholder="text.captchaPlaceholder" />
          <button class="captcha-image" type="button" :disabled="captchaLoading" @click="loadCaptcha">
            <img v-if="captcha" :src="captcha.captchaImage" :alt="text.captcha" />
            <RotateCw v-else :size="18" />
          </button>
        </div>
      </label>

      <div v-if="mode !== 'login'" class="email-code-row">
        <label>
          <span>{{ text.emailCode }}</span>
          <input v-model.trim="form.emailCode" maxlength="12" required :placeholder="text.emailCodePlaceholder" />
        </label>
        <button
          type="button"
          :disabled="sendingCode || captchaLoading"
          @click="sendEmailCode(mode === 'register' ? 'REGISTER' : 'RESET_PASSWORD')"
        >
          <Mail :size="16" />
          {{ sendingCode ? text.sending : text.sendCode }}
        </button>
      </div>

      <p v-if="error" class="auth-error">{{ error }}</p>
      <p v-if="success" class="auth-success">{{ success }}</p>

      <button class="auth-submit" type="submit" :disabled="loading">
        <LogIn v-if="mode === 'login'" :size="18" />
        <UserPlus v-else-if="mode === 'register'" :size="18" />
        <KeyRound v-else :size="18" />
        {{ submitLabel }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.auth-card input {
  color: #faf1c3;
}
.auth-forgot-tab {
  width: 100%;
  min-height: 34px;
  margin: -6px 0 4px;
  border: 0;
  background: transparent;
  color: rgba(40, 30, 22, 0.72);
  cursor: pointer;
  font-weight: 800;
}

.auth-forgot-tab.active {
  color: #8f241c;
}

.auth-helper {
  margin: -8px 0 2px;
  color: rgba(39, 29, 21, 0.68);
  font-size: 12px;
  font-weight: 700;
}

.auth-input-action {
  display: grid;
  grid-template-columns: 1fr 42px;
  gap: 8px;
}

.auth-input-action button,
.captcha-image,
.email-code-row > button {
  display: inline-grid;
  place-items: center;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.28);
  color: #2c2018;
  cursor: pointer;
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 10px;
}

.captcha-image {
  padding: 0;
  overflow: hidden;
}

.captcha-image img {
  display: block;
  width: 132px;
  height: 44px;
}

.email-code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  align-items: end;
  gap: 10px;
}

.email-code-row label {
  margin: 0;
}

.email-code-row > button {
  gap: 6px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 900;
}

.auth-success {
  margin: 0;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(48, 128, 82, 0.18);
  color: #1d6b48;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 560px) {
  .captcha-row,
  .email-code-row {
    grid-template-columns: 1fr;
  }
}
</style>
