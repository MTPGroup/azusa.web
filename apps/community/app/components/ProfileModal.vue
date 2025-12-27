<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen", { default: false });
const userStore = useUserStore();
const toast = useToast();

const state = reactive({
  username: "",
  avatar: "",
});

const uploadingAvatar = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref("");

const resetForm = () => {
  if (userStore.profile) {
    state.username = userStore.profile.username || "";
    state.avatar = userStore.profile.avatar || "";
  }
  selectedFileName.value = "";
};

// Reset form when modal opens
watch(isOpen, (val) => {
  if (val) {
    resetForm();
  }
});

const handleAvatarFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  selectedFileName.value = file.name;
  uploadingAvatar.value = true;
  const result = await userStore.uploadAvatar(file);
  uploadingAvatar.value = false;
  if (result.success && result.avatarUrl) {
    state.avatar = result.avatarUrl;
    toast.add({ title: "头像上传成功", color: "success" });
  } else {
    toast.add({ title: result.error || "上传失败", color: "error" });
  }
};

const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

const handleSubmit = async () => {
  if (!state.username) {
    toast.add({ title: "用户名不能为空", color: "error" });
    return;
  }

  const result = await userStore.updateProfile({
    username: state.username,
    avatar: state.avatar,
  });

  if (result.success) {
    toast.add({ title: "个人信息已更新", color: "success" });
    isOpen.value = false;
  } else {
    toast.add({ title: result.error || "更新失败", color: "error" });
  }
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content:
        'sm:max-w-md p-0 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl',
    }"
  >
    <template #content>
      <div class="flex flex-col">
        <!-- Header -->
        <div
          class="p-6 border-b border-border bg-gradient-to-r from-emerald-500/10 to-lime-500/10"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-user-circle"
                class="w-7 h-7 text-primary"
              />
            </div>
            <div>
              <h3 class="text-xl font-bold text-main">个人资料设置</h3>
              <p class="text-dim text-sm mt-0.5">更新您的公开展示信息</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-8 space-y-8">
           <!-- Avatar Preview Section -->
          <div class="flex flex-col items-center gap-3 text-center">
            <div class="relative group cursor-pointer" @click="triggerFileSelect">
              <UAvatar
                :src="state.avatar"
                :alt="state.username"
                size="3xl"
                class="w-24 h-24 ring-4 ring-primary/20 shadow-xl transition-all group-hover:ring-primary/40"
              />
              <div
                class="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <UIcon name="i-heroicons-camera" class="w-8 h-8 text-white" />
              </div>
            </div>
            <p class="text-xs text-dim">点击头像上传本地图片（jpg/png/webp/gif，≤5MB）</p>
            <p v-if="selectedFileName" class="text-xs text-dim truncate max-w-[160px]">已选择：{{ selectedFileName }}</p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarFileChange"
            />
          </div>

          <UForm :state="state" @submit="handleSubmit" class="space-y-6">

            <UFormField
              label="用户名"
              name="username"
              required
              help="这是您在社区中显示的名字"
            >
              <UInput
                v-model="state.username"
                placeholder="设置您的用户名"
                icon="i-heroicons-user"
                size="xl"
                class="w-full"
                :ui="{ base: 'bg-surface' }"
              />
            </UFormField>

            <UFormField label="头像链接" name="avatar" help="输入图片 URL 地址">
              <UInput
                v-model="state.avatar"
                placeholder="https://example.com/avatar.png"
                icon="i-heroicons-link"
                size="xl"
                class="w-full"
                :ui="{ base: 'bg-surface' }"
              />
            </UFormField>

            <div class="flex gap-3 pt-4">
              <UButton
                label="取消"
                color="neutral"
                variant="ghost"
                class="flex-1 justify-center h-12 text-base"
                @click="isOpen = false"
              />
              <UButton
                type="submit"
                label="保存更改"
                color="primary"
                class="flex-1 justify-center h-12 text-base bg-gradient-to-r from-emerald-500 to-lime-600 shadow-lg shadow-emerald-500/20"
                :loading="userStore.loading"
              />
            </div>
          </UForm>
        </div>
      </div>
    </template>
  </UModal>
</template>
