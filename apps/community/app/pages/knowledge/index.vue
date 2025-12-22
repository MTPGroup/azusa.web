<script setup lang="ts">
const knowledgeStore = useKnowledgeStore();
const userStore = useUserStore();
const searchQuery = ref("");
const isCreateModalOpen = ref(false);

const newKB = ref({
  name: "",
  description: "",
  isPublic: false,
});

onMounted(() => {
  knowledgeStore.fetchKnowledgeBases();
  knowledgeStore.subscribeToChanges();
});

onUnmounted(() => {
  knowledgeStore.unsubscribeFromChanges();
});

const filteredBases = computed(() => {
  if (!searchQuery.value) return knowledgeStore.knowledgeBases;
  return knowledgeStore.knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      kb.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleCreate = async () => {
  const result = await knowledgeStore.createKnowledgeBase(newKB.value);
  if (result) {
    isCreateModalOpen.value = false;
    newKB.value = { name: "", description: "", isPublic: false };
  }
};

const kbToDelete = ref<any>(null);
const isDeleteModalOpen = ref(false);
const deleting = ref(false);

const confirmDelete = async () => {
  if (!kbToDelete.value) return;
  deleting.value = true;
  const success = await knowledgeStore.deleteKnowledgeBase(kbToDelete.value.id);
  if (success) {
    isDeleteModalOpen.value = false;
    kbToDelete.value = null;
  }
  deleting.value = false;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10"
    >
      <div>
        <h1 class="text-3xl font-bold mb-2">知识库</h1>
        <p class="text-dim">共享的知识与文档，支持向量搜索与智能检索</p>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜索知识库..."
          class="flex-grow md:w-64"
        />
        <UButton
          color="primary"
          class="bg-gradient-to-r from-green-500 to-teal-500 border-none shrink-0"
          icon="i-heroicons-plus"
          @click="isCreateModalOpen = true"
        >
          创建知识库
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="knowledgeStore.loading" class="flex flex-col gap-4">
      <div
        v-for="i in 5"
        :key="i"
        class="bg-card border border-border rounded-xl p-5 flex items-center gap-6"
      >
        <USkeleton class="w-12 h-12 rounded-lg" />
        <div class="flex-grow space-y-2">
          <USkeleton class="h-5 w-1/4" />
          <USkeleton class="h-4 w-1/3" />
        </div>
        <USkeleton class="w-8 h-8 rounded-full" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredBases.length === 0"
      class="text-center py-20 bg-surface border border-border rounded-2xl"
    >
      <UIcon
        name="i-heroicons-folder-open"
        class="w-16 h-16 text-gray-600 mb-4 mx-auto"
      />
      <h3 class="text-xl font-medium text-dim">暂无知识库</h3>
      <p class="text-dim mt-2">创建一个知识库来开始管理你的文档吧！</p>
    </div>

    <!-- Knowledge Base List -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="kb in filteredBases"
        :key="kb.id"
        class="bg-card border border-border rounded-xl p-5 flex items-center gap-6 hover:border-green-500/50 hover:bg-surface transition-all group cursor-pointer"
        @click="$router.push(`/knowledge/${kb.id}`)"
      >
        <div
          class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
        >
          📚
        </div>
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3
              class="text-lg font-semibold truncate group-hover:text-green-400 transition-colors"
            >
              {{ kb.name }}
            </h3>
            <UBadge v-if="kb.isPublic" size="xs" color="neutral" variant="soft"
              >公开</UBadge
            >
          </div>
          <p class="text-dim text-sm truncate mb-1">
            {{ kb.description || "暂无描述" }}
          </p>
          <div class="flex items-center gap-3 text-xs text-dim">
            <span class="flex items-center gap-1">
              <UAvatar
                :src="kb.author.avatar"
                :alt="kb.author.username"
                size="xs"
              />
              @{{ kb.author.username }}
            </span>
            <span>•</span>
            <span>更新于 {{ formatDate(kb.updatedAt) }}</span>
          </div>
        </div>
        <div
          class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UButton
            v-if="userStore.profile?.id === kb.author?.id"
            icon="i-heroicons-trash"
            color="error"
            variant="ghost"
            @click.stop="
              kbToDelete = kb;
              isDeleteModalOpen = true;
            "
          />
          <UButton
            icon="i-heroicons-chevron-right"
            color="neutral"
            variant="ghost"
          />
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal (List View) -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <UCard v-if="kbToDelete">
          <template #header>
            <h3 class="text-base font-semibold">确认删除</h3>
          </template>
          <p class="text-gray-400">
            确定要删除知识库
            <span class="text-white font-bold">"{{ kbToDelete.name }}"</span>
            吗？此操作不可撤销。
          </p>
          <div class="flex justify-end gap-3 mt-6">
            <UButton
              variant="ghost"
              color="neutral"
              @click="isDeleteModalOpen = false"
              >取消</UButton
            >
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              确认删除
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <h3
                class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
              >
                创建知识库
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isCreateModalOpen = false"
              />
            </div>
          </template>

          <UForm :state="newKB" class="space-y-4" @submit="handleCreate">
            <UFormField label="名称" name="name" required>
              <UInput v-model="newKB.name" placeholder="例如：产品设计文档" />
            </UFormField>

            <UFormField label="描述" name="description">
              <UTextarea
                v-model="newKB.description"
                placeholder="简单描述一下这个知识库的内容..."
              />
            </UFormField>

            <UFormField
              label="公开访问"
              name="isPublic"
              help="开启后，其他用户可以查看并搜索该知识库中的文档"
            >
              <UToggle v-model="newKB.isPublic" />
            </UFormField>

            <div class="flex justify-end gap-3 mt-6">
              <UButton
                variant="ghost"
                color="neutral"
                @click="isCreateModalOpen = false"
                >取消</UButton
              >
              <UButton
                type="submit"
                color="primary"
                class="bg-gradient-to-r from-green-500 to-teal-500"
                >确认创建</UButton
              >
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
