<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen", { default: false });
const isLogin = ref(true);
const loading = ref(false);
const errorMsg = ref("");

const client = useSupabaseClient();

const state = reactive({
  email: "",
  password: "",
});

const resetForm = () => {
  state.email = "";
  state.password = "";
  errorMsg.value = "";
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

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = "";

  try {
    if (isLogin.value) {
      const { error } = await client.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });
      if (error) throw error;

      const userStore = useUserStore();
      await userStore.fetchProfile();
    } else {
      const { error } = await client.auth.signUp({
        email: state.email,
        password: state.password,
      });
      if (error) throw error;
      alert("注册成功，请查收确认邮件（如已启用邮件确认）");
    }

    // Close modal after a short delay to allow background processes to settle
    setTimeout(() => {
      isOpen.value = false;
    }, 100);
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
          class="hidden md:flex w-5/12 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-10 flex-col justify-between text-white relative h-full"
        >
          <!-- Animated Background Elements -->
          <div
            class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
          ></div>
          <div
            class="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-[100px]"
          ></div>
          <div
            class="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-[100px]"
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
                    base: 'bg-surface border-border text-main placeholder-dim focus:ring-2 focus:ring-indigo-500/50',
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
                    base: 'bg-surface border-border text-main placeholder-dim focus:ring-2 focus:ring-indigo-500/50',
                  }"
                />
              </UFormField>

              <div
                v-if="errorMsg"
                class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500"
              >
                {{ errorMsg }}
              </div>

              <UButton
                type="submit"
                color="primary"
                block
                :loading="loading"
                size="xl"
                class="bg-gradient-to-r from-indigo-500 to-purple-600 border-none w-full shadow-lg shadow-purple-500/20 h-12 text-base font-semibold"
              >
                {{ isLogin ? "立即登录" : "提交注册" }}
              </UButton>

              <div class="text-center text-sm text-dim">
                {{ isLogin ? "还没有账号？" : "已有账号？" }}
                <button
                  type="button"
                  class="text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300 transition-colors ml-1"
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
