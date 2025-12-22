<script setup lang="ts">
const characterStore = useCharacterStore();
const userStore = useUserStore();
const toast = useToast();

const search = ref("");
const isCreateModalOpen = ref(false);
const isDeleting = ref<string | null>(null);
const isConfirmDeleteOpen = ref(false);
const characterToDelete = ref<Character | null>(null);

const newCharacter = ref({
  name: "",
  signature: "",
  avatarUrl: "",
  persona: "",
  isPublic: true,
});

const isSubmitting = ref(false);

const handleFetch = async (page = 1) => {
  await characterStore.fetchCharacters({
    page,
    search: search.value,
  });
};

onMounted(async () => {
  await handleFetch();
  characterStore.subscribeToChanges();
});

onUnmounted(() => {
  characterStore.unsubscribeFromChanges();
});

watch(search, () => {
  handleFetch(1);
});

const openCreateModal = () => {
  newCharacter.value = {
    name: "",
    signature: "",
    avatarUrl: "",
    persona: "",
    isPublic: true,
  };
  isCreateModalOpen.value = true;
};

const handleCreate = async () => {
  if (!newCharacter.value.name) return;
  isSubmitting.value = true;
  try {
    await characterStore.createCharacter(newCharacter.value);
    isCreateModalOpen.value = false;
    toast.add({
      title: "创建成功",
      description: `角色 ${newCharacter.value.name} 已创建`,
      color: "success",
    });
    handleFetch(1);
  } catch (err) {
    toast.add({
      title: "创建失败",
      description: "请稍后再试",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (char: Character) => {
  characterToDelete.value = char;
  isConfirmDeleteOpen.value = true;
};

const handleDelete = async () => {
  if (!characterToDelete.value) return;
  isDeleting.value = characterToDelete.value.id;
  try {
    await characterStore.deleteCharacter(characterToDelete.value.id);
    isConfirmDeleteOpen.value = false;
    toast.add({
      title: "删除成功",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "删除失败",
      color: "error",
    });
  } finally {
    isDeleting.value = null;
    characterToDelete.value = null;
  }
};
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto w-full">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-main mb-2">AI 角色</h1>
        <p class="text-dim">
          发现和创建独特的 AI 角色，拥有独立的性格和知识背景。
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        label="创建角色"
        size="lg"
        class="rounded-xl shadow-lg shadow-primary-500/20"
        @click="openCreateModal"
      />
    </div>

    <!-- Filters -->
    <div class="mb-8">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="搜索角色名称或背景..."
        size="xl"
        class="max-w-md shadow-sm"
        :ui="{ root: 'rounded-2xl' }"
      />
    </div>

    <!-- Character Grid -->
    <div
      v-if="characterStore.loading && !characterStore.characters.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="bg-card border border-border rounded-3xl p-6 h-64 animate-pulse"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-2xl bg-surface"></div>
          <div class="flex-1">
            <div class="h-6 bg-surface rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-surface rounded w-1/3"></div>
          </div>
        </div>
        <div class="h-4 bg-surface rounded w-full mb-2"></div>
        <div class="h-4 bg-surface rounded w-full mb-2"></div>
        <div class="h-4 bg-surface rounded w-2/3"></div>
      </div>
    </div>

    <div
      v-else-if="characterStore.characters.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="char in characterStore.characters"
        :key="char.id"
        class="group bg-card border border-border hover:border-primary-500/30 transition-all duration-300 rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1"
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="flex items-center gap-4">
            <UAvatar
              :src="char.avatarUrl || ''"
              :alt="char.name"
              size="xl"
              class="rounded-2xl ring-2 ring-border group-hover:ring-primary-500/30 transition-all"
              :ui="{ root: 'rounded-2xl' }"
            />
            <div>
              <h3
                class="text-xl font-bold text-main group-hover:text-primary-500 transition-colors"
              >
                {{ char.name }}
              </h3>
              <div class="flex items-center gap-1.5 text-xs text-dim mt-1">
                <UAvatar
                  :src="char.author?.avatar || ''"
                  size="3xs"
                  class="rounded-full"
                />
                <span>{{ char.author?.name || "未知作者" }}</span>
              </div>
            </div>
          </div>

          <div
            v-if="userStore.profile?.id === char.authorId"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              square
              :loading="isDeleting === char.id"
              @click.stop="confirmDelete(char)"
            />
          </div>
        </div>

        <p class="text-sm text-dim line-clamp-3 mb-6 flex-1">
          {{ char.signature || "该角色很神秘，还没有介绍呢..." }}
        </p>

        <div
          class="flex items-center justify-between pt-4 border-t border-border mt-auto"
        >
          <div class="flex gap-2">
            <UBadge
              v-if="char.isPublic"
              color="primary"
              variant="subtle"
              size="xs"
              class="rounded-full px-2"
              >公开</UBadge
            >
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
              size="xs"
              class="rounded-full px-2"
              >私有</UBadge
            >
          </div>
          <UButton
            label="查看详情"
            variant="ghost"
            trailing-icon="i-heroicons-chevron-right"
            size="sm"
            color="neutral"
            :to="`/characters/${char.id}`"
          />
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        class="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mb-4"
      >
        <UIcon name="i-heroicons-users" class="w-10 h-10 text-dim" />
      </div>
      <h3 class="text-xl font-bold text-main mb-2">暂无角色</h3>
      <p class="text-dim max-w-xs">
        还没有人创建 AI 角色，快来成为第一个创造者吧！
      </p>
      <UButton
        label="立即创建"
        class="mt-6 shadow-lg shadow-primary-500/20"
        @click="openCreateModal"
      />
    </div>

    <!-- Pagination -->
    <div
      v-if="
        characterStore.pagination && characterStore.pagination.totalPages > 1
      "
      class="mt-10 flex justify-center"
    >
      <UPagination
        v-model="characterStore.pagination.page"
        :total="characterStore.pagination.total"
        :page-count="characterStore.pagination.limit"
        @update:model-value="handleFetch"
      />
    </div>

    <!-- Create Modal -->
    <UModal
      v-model:open="isCreateModalOpen"
      :ui="{
        content:
          'sm:max-w-xl p-0 overflow-hidden rounded-3xl border border-border shadow-2xl',
      }"
    >
      <template #content>
        <div class="bg-card flex flex-col max-h-[85vh]">
          <div
            class="px-6 py-5 border-b border-border flex items-center justify-between"
          >
            <h3 class="text-xl font-bold text-main">创建新角色</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isCreateModalOpen = false"
            />
          </div>

          <div class="p-6 overflow-y-auto space-y-6 flex-1">
            <UFormField label="名称" required>
              <UInput
                v-model="newCharacter.name"
                placeholder="为你的角色起个名字"
                size="lg"
                :ui="{ base: 'rounded-xl' }"
              />
            </UFormField>

            <UFormField label="头像 URL">
              <UInput
                v-model="newCharacter.avatarUrl"
                placeholder="https://..."
                size="lg"
                :ui="{ base: 'rounded-xl' }"
                class="w-full"
              />
            </UFormField>

            <UFormField label="个性签名/简介">
              <UTextarea
                v-model="newCharacter.signature"
                placeholder="简单介绍一下角色的背景或性格..."
                :rows="3"
                :ui="{ base: 'rounded-xl' }"
                class="w-full"
              />
            </UFormField>

            <UFormField label="角色设定 (System Prompt)">
              <template #description
                >详细描述角色的说话风格、知识储备和行为准则...</template
              >
              <UTextarea
                v-model="newCharacter.persona"
                placeholder="你是一个博学多才的助手..."
                :rows="5"
                :ui="{ base: 'rounded-xl' }"
                class="w-full"
              />
            </UFormField>

            <div
              class="flex items-center justify-between p-4 bg-app border border-border rounded-2xl"
            >
              <div class="flex flex-col">
                <span class="text-sm font-bold text-main">公开可见</span>
                <span class="text-xs text-dim"
                  >允许社区其他用户发现并使用此角色</span
                >
              </div>
              <USwitch v-model="newCharacter.isPublic" />
            </div>
          </div>

          <div
            class="px-6 py-5 border-t border-border flex justify-end gap-3 bg-app/50"
          >
            <UButton
              label="取消"
              color="neutral"
              variant="ghost"
              @click="isCreateModalOpen = false"
            />
            <UButton
              label="确认并保存"
              :loading="isSubmitting"
              class="px-8 shadow-lg shadow-primary-500/20"
              @click="handleCreate"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation -->
    <UModal
      v-model:open="isConfirmDeleteOpen"
      :ui="{
        content:
          'sm:max-w-md p-0 overflow-hidden rounded-3xl border border-border',
      }"
    >
      <template #content>
        <div class="bg-card p-6 text-center space-y-6">
          <div
            class="w-16 h-16 bg-error-500/10 rounded-2xl flex items-center justify-center mx-auto"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-8 h-8 text-error-500"
            />
          </div>
          <div>
            <h3 class="text-xl font-bold text-main mb-2">确认删除角色？</h3>
            <p class="text-dim">
              你确定要删除角色
              <span class="text-main font-bold"
                >"{{ characterToDelete?.name }}"</span
              >
              吗？此操作无法撤销。
            </p>
          </div>
          <div class="flex justify-center gap-3 pt-2">
            <UButton
              label="保留它"
              color="neutral"
              variant="ghost"
              @click="isConfirmDeleteOpen = false"
            />
            <UButton
              label="确认删除"
              color="error"
              class="px-6"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
```
