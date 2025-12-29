<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen", { default: false });
const isLogin = ref(true);
const loading = ref(false);
const errorMsg = ref("");
const infoMsg = ref("");
const isOtpStep = ref(false);
const verificationCode = ref("");

const client = useSupabaseClient();

const state = reactive({
  email: "",
  password: "",
});

const resetForm = () => {
  state.email = "";
  state.password = "";
  verificationCode.value = "";
  isOtpStep.value = false;
  errorMsg.value = "";
  infoMsg.value = "";
};

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  resetForm();
};

// Reset form when modal opens or closes
watch(isOpen, (val) => {
  if (val || !val) {
    resetForm();
  }
});

const handleVerifyOtp = async () => {
  if (!verificationCode.value.trim()) {
    errorMsg.value = "请输入验证码";
    return false;
  }
  loading.value = true;
  errorMsg.value = "";
  try {
    const { data, error } = await client.auth.verifyOtp({
      email: state.email,
      token: verificationCode.value.trim(),
      type: "signup",
    });
    if (error) throw error;
    if (!data.session) {
      // 部分场景需要再登录以获取 session
      const { error: signInError } = await client.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });
      if (signInError) throw signInError;
    }
    const userStore = useUserStore();
    await userStore.fetchProfile();
    setTimeout(() => {
      isOpen.value = false;
    }, 100);
    return true;
  } catch (e: any) {
    errorMsg.value = e.message || "验证码校验失败";
    return false;
  } finally {
    loading.value = false;
  }
};

const resendCode = async () => {
  loading.value = true;
  errorMsg.value = "";
  infoMsg.value = "";
  try {
    const { error } = await client.auth.signUp({
      email: state.email,
      password: state.password,
    });
    if (error) throw error;
    infoMsg.value = "验证码已重新发送，1 小时内有效";
  } catch (e: any) {
    errorMsg.value = e.message || "验证码发送失败";
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = "";
  infoMsg.value = "";

  try {
    if (isLogin.value) {
      const { error } = await client.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });
      if (error) throw error;

      const userStore = useUserStore();
      // 不阻塞登录流程，避免函数请求延迟导致转圈
      void userStore.fetchProfile();
      setTimeout(() => {
        isOpen.value = false;
      }, 100);
      return;
    }

    if (isOtpStep.value) {
      const ok = await handleVerifyOtp();
      if (ok) return;
      // 若失败，保持在验证码步骤但释放 loading
      return;
    }

    const { error } = await client.auth.signUp({
      email: state.email,
      password: state.password,
    });
    if (error) throw error;
    isOtpStep.value = true;
    infoMsg.value = "验证码已发送到邮箱，1 小时内有效";
  } catch (e: any) {
    errorMsg.value = e.message || "发生错误";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content:
        'p-0 sm:max-w-[760px] overflow-hidden rounded-2xl border border-border shadow-3xl',
    }"
  >
    <template #content>
      <!-- Fixed height on desktop to prevent internal scrollbars, auto height on mobile -->
      <div class="flex flex-col md:flex-row bg-app md:h-[540px]">
        <!-- Left Side: Branding (Hidden on mobile) -->
        <div
          class="hidden md:flex w-5/12 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-10 flex-col justify-between text-white relative h-full"
        >
          <!-- Animated Background Elements -->
          <div
            class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
          ></div>
          <div
            class="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-[100px]"
          ></div>
          <div
              class="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-[100px]"

          ></div>

          <div class="relative z-10">
            <div class="flex items-center gap-3 text-2xl font-bold mb-10">
              <div
                class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl"
              >
                A
              </div>
              <span class="tracking-tight">Azusa</span>
            </div>

            <div class="space-y-6">
              <h2 class="text-4xl font-extrabold leading-tight tracking-tight">
                连接<br />AI 的未来
              </h2>
              <p class="text-white/70 text-lg leading-relaxed font-light">
                探索由社区驱动的<br />下一代智能角色与插件集。
              </p>
            </div>
          </div>

          <div
            class="relative z-10 flex items-center gap-2 text-sm text-white/50"
          >
            <span
              class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
            ></span>
            社区实时在线
          </div>
        </div>

        <!-- Right Side: Auth Form -->
        <div
          class="flex-1 p-10 md:p-12 flex flex-col justify-center relative bg-app h-full overflow-hidden"
        >
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="absolute top-6 right-6 hover:bg-surface"
            @click="isOpen = false"
          />

          <div class="w-full max-w-[340px] mx-auto">
            <div class="mb-10">
              <h3 class="text-3xl font-bold text-main mb-3 tracking-tight">
                {{ isLogin ? "账号登录" : "开启旅程" }}
              </h3>
              <p class="text-dim text-base">
                {{
                  isLogin
                    ? "请登录您的 Azusa 社区账号"
                    : "立即注册，加入全球 AI 创作者行列"
                }}
              </p>
            </div>

            <UForm :state="state" @submit="handleSubmit" class="space-y-6">
              <UFormField label="邮箱地址" name="email">
                <UInput
                  v-model="state.email"
                  placeholder="name@example.com"
                  icon="i-heroicons-envelope"
                  class="w-full"
                  size="xl"
                  :ui="{
                    base: 'bg-surface border-border text-main placeholder-dim focus:ring-2 focus:ring-emerald-500/50',
                  }"
                />
              </UFormField>

              <UFormField label="设置密码" name="password">
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-heroicons-lock-closed"
                  class="w-full"
                  size="xl"
                  :ui="{
                    base: 'bg-surface border-border text-main placeholder-dim focus:ring-2 focus:ring-emerald-500/50',
                  }"
                />
              </UFormField>

              <UFormField v-if="!isLogin && isOtpStep" label="邮箱验证码" name="code">
                <UInput
                  v-model="verificationCode"
                  placeholder="输入邮件中的 6 位验证码"
                  icon="i-heroicons-key"
                  class="w-full"
                  size="xl"
                  :ui="{
                    base: 'bg-surface border-border text-main placeholder-dim focus:ring-2 focus:ring-emerald-500/50',
                  }"
                />
              </UFormField>

              <div v-if="infoMsg" class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500">
                {{ infoMsg }}
              </div>

              <div
                v-if="errorMsg"
                class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500"
              >
                {{ errorMsg }}
              </div>

              <div class="flex items-center justify-between gap-3" v-if="!isLogin && isOtpStep">
                <UButton
                  type="button"
                  variant="ghost"
                  color="neutral"
                  size="lg"
                  :loading="loading"
                  @click="resendCode"
                >
                  重新发送验证码
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  :loading="loading"
                  size="lg"
                  class="flex-1 h-12 text-base font-semibold justify-center bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20 transition-colors duration-200"
                >
                  提交验证码
                </UButton>
              </div>

              <UButton
                v-else
                type="submit"
                color="primary"
                block
                :loading="loading"
                size="xl"
                class="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20 transition-colors duration-200"
              >
                {{ isLogin ? "立即登录" : "发送验证码" }}
              </UButton>

              <div class="text-center text-sm text-dim">
                {{ isLogin ? "还没有账号？" : "已有账号？" }}
                <button
                  type="button"
                  class="text-emerald-400 font-semibold cursor-pointer hover:text-emerald-300 transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ml-1"
                  @click="toggleMode"
                >
                  {{ isLogin ? "立即注册" : "返回登录" }}
                </button>
              </div>
            </UForm>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
