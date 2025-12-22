<script setup lang="ts">
const route = useRoute();
const characterStore = useCharacterStore();
const knowledgeStore = useKnowledgeStore();
const userStore = useUserStore();
const toast = useToast();

const characterId = route.params.id as string;
const character = ref<Character | null>(null);
const loading = ref(true);
const linkedKBs = ref<any[]>([]);

const isEditModalOpen = ref(false);
const editForm = ref({
  name: "",
  signature: "",
  avatarUrl: "",
  persona: "",
  isPublic: true,
});
const isUpdating = ref(false);
const isConfirmDeleteOpen = ref(false);
const isDeleting = ref(false);

const isAddKBModalOpen = ref(false);
const selectedKBId = ref("");
const priority = ref(0);

const fetchDetail = async () => {
  loading.value = true;
  try {
    const data = await characterStore.getCharacter(characterId);
    if (!data) throw new Error("Character not found");
    character.value = data;

    const { data: kbData, error: kbError } =
      await useSupabaseClient().functions.invoke(
        `characters/${characterId}/knowledge-bases`,
        {
          method: "GET",
        }
      );
    if (kbError) throw kbError;
    linkedKBs.value = kbData.data;
  } catch (err) {
    console.error("Fetch character detail error:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchDetail();
});

watch(
  () => knowledgeStore.knowledgeBases,
  (newVal) => {
    console.log("[Debug] knowledgeBases changed:", newVal);
  },
  { deep: true }
);

const openAddKBModal = async () => {
  isAddKBModalOpen.value = true;
  // Only fetch if empty to avoid redundant requests, but await it
  if (knowledgeStore.knowledgeBases.length === 0) {
    await knowledgeStore.fetchKnowledgeBases();
  }
};

const handleLinkKB = async () => {
  if (!selectedKBId.value) return;
  try {
    const { error } = await useSupabaseClient().functions.invoke(
      `characters/${characterId}/knowledge-bases`,
      {
        method: "POST",
        body: {
          knowledgeBaseId: selectedKBId.value,
          priority: priority.value,
        },
      }
    );
    if (error) throw error;

    toast.add({ title: "关联成功", color: "success" });
    isAddKBModalOpen.value = false;
    await fetchDetail();
  } catch (err) {
    toast.add({ title: "关联失败", color: "error" });
  }
};

const openEditModal = () => {
  if (!character.value) return;
  editForm.value = {
    name: character.value.name,
    signature: character.value.signature,
    avatarUrl: character.value.avatarUrl || "",
    persona: character.value.persona,
    isPublic: character.value.isPublic,
  };
  isEditModalOpen.value = true;
};

const handleUpdate = async () => {
  if (!editForm.value.name) return;
  isUpdating.value = true;
  try {
    await characterStore.updateCharacter(characterId, editForm.value);
    toast.add({ title: "修改成功", color: "success" });
    isEditModalOpen.value = false;
    await fetchDetail();
  } catch (err) {
    toast.add({ title: "修改失败", color: "error" });
  } finally {
    isUpdating.value = false;
  }
};

const handleUnlinkKB = async (kbId: string) => {
  try {
    const { error } = await useSupabaseClient().functions.invoke(
      `characters/${characterId}/knowledge-bases/${kbId}`,
      {
        method: "DELETE",
      }
    );
    if (error) throw error;

    toast.add({ title: "解除成功", color: "success" });
    await fetchDetail();
  } catch (err) {
    toast.add({ title: "解除失败", color: "error" });
  }
};

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    await characterStore.deleteCharacter(characterId);
    toast.add({ title: "删除成功", color: "success" });
    navigateTo("/characters");
  } catch (err) {
    toast.add({ title: "删除失败", color: "error" });
  } finally {
    isDeleting.value = false;
    isConfirmDeleteOpen.value = false;
  }
};
</script>

<template>
  <div class="max-w-5xl mx-auto p-6 w-full">
    <div v-if="loading" class="animate-pulse space-y-8">
      <div class="flex items-center gap-6">
        <div class="w-32 h-32 rounded-3xl bg-surface"></div>
        <div class="flex-1 space-y-4">
          <div class="h-8 bg-surface rounded w-1/3"></div>
          <div class="h-4 bg-surface rounded w-2/3"></div>
        </div>
      </div>
      <div class="h-64 bg-surface rounded-3xl"></div>
    </div>

    <div v-else-if="character" class="space-y-8">
      <!-- Header Section -->
      <section class="flex flex-col md:flex-row gap-8 items-start">
        <UAvatar
          :src="character.avatarUrl || ''"
          :alt="character.name"
          size="3xl"
          class="rounded-3xl shadow-xl ring-4 ring-border bg-card"
          :ui="{ root: 'rounded-3xl' }"
        />
        <div class="flex-1 pt-2">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-4xl font-bold text-main">{{ character.name }}</h1>
            <UBadge
              v-if="character.isPublic"
              color="primary"
              variant="subtle"
              class="rounded-full"
              >公开角色</UBadge
            >
          </div>
          <div class="flex items-center gap-2 mb-4">
            <UAvatar
              :src="character.author?.avatar || ''"
              size="2xs"
              class="rounded-full"
            />
            <span class="text-dim text-sm">{{
              character.author?.name || "未知作者"
            }}</span>
            <span class="text-border mx-1">•</span>
            <span class="text-dim text-sm"
              >更新于
              {{ new Date(character.updatedAt).toLocaleDateString() }}</span
            >
          </div>
          <p class="text-lg text-main leading-relaxed mb-6">
            {{ character.signature || "这个角色暂时没有签名。" }}
          </p>

          <div class="flex gap-4">
            <UButton
              icon="i-heroicons-chat-bubble-left-right"
              label="开始对话"
              size="lg"
              class="shadow-lg shadow-primary-500/20"
            />
            <UButton
              v-if="userStore.profile?.id === character.authorId"
              icon="i-heroicons-pencil-square"
              label="编辑角色"
              variant="ghost"
              color="neutral"
              @click="openEditModal"
            />
            <UButton
              v-if="userStore.profile?.id === character.authorId"
              icon="i-heroicons-trash"
              label="删除"
              variant="ghost"
              color="error"
              :loading="isDeleting"
              @click="isConfirmDeleteOpen = true"
            />
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Persona Card -->
          <UCard :ui="{ root: 'rounded-3xl' }" class="bg-card border-border">
            <template #header>
              <h3 class="text-xl font-bold text-main">
                角色设定 (System Prompt)
              </h3>
            </template>
            <div
              class="prose prose-invert max-w-none text-dim whitespace-pre-wrap leading-relaxed"
            >
              {{ character.persona || "未设置详细的 Prompt。" }}
            </div>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-8">
          <!-- Knowledge bases -->
          <UCard
            :ui="{ root: 'rounded-3xl', body: 'p-4' }"
            class="bg-card border-border"
          >
            <template #header>
              <div class="flex items-center justify-between px-2">
                <h3 class="font-bold text-main">关联知识库</h3>
                <UButton
                  v-if="userStore.profile?.id === character.authorId"
                  icon="i-heroicons-plus"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  @click="openAddKBModal"
                />
              </div>
            </template>

            <div v-if="linkedKBs.length" class="space-y-2">
              <div
                v-for="item in linkedKBs"
                :key="item.knowledgeBase.id"
                class="flex items-center justify-between p-3 bg-app border border-border rounded-2xl group transition-all hover:border-primary-500/30"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <UIcon
                    name="i-heroicons-book-open"
                    class="text-primary-500 flex-shrink-0"
                  />
                  <span class="text-sm font-medium text-main truncate">{{
                    item.knowledgeBase.name
                  }}</span>
                </div>
                <UButton
                  v-if="userStore.profile?.id === character.authorId"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  variant="ghost"
                  color="error"
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="handleUnlinkKB(item.knowledgeBase.id)"
                />
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p class="text-dim text-xs">尚未关联任何知识库</p>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Link KB Modal -->
    <UModal
      v-model:open="isAddKBModalOpen"
      :ui="{
        content:
          'sm:max-w-md p-0 overflow-hidden rounded-3xl border border-border shadow-2xl',
      }"
    >
      <template #content>
        <div class="bg-card flex flex-col">
          <div
            class="px-6 py-5 border-b border-border flex items-center justify-between"
          >
            <h3 class="text-xl font-bold text-main">关联知识库</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isAddKBModalOpen = false"
            />
          </div>

          <div class="p-6 space-y-6">
            <UFormField label="选择知识库">
              <USelectMenu
                v-model="selectedKBId"
                :items="knowledgeStore.knowledgeBases"
                value-key="id"
                label-key="name"
                :placeholder="
                  knowledgeStore.loading
                    ? '正在加载知识库...'
                    : knowledgeStore.knowledgeBases.length
                    ? '选择一个现有的知识库...'
                    : '暂无可用知识库'
                "
                size="lg"
                class="w-full"
                :disabled="
                  knowledgeStore.loading ||
                  !knowledgeStore.knowledgeBases.length
                "
              />
              <p
                v-if="
                  !knowledgeStore.loading &&
                  !knowledgeStore.knowledgeBases.length
                "
                class="text-xs text-error-500 mt-1"
              >
                看起来您还没有创建任何知识库。请先前往
                <ULink to="/knowledge" class="underline">知识库页面</ULink>
                创建。
              </p>
            </UFormField>

            <UFormField label="权重优先级">
              <template #description
                >数字越大，知识库在对话中的参考权重越高。</template
              >
              <UInput v-model="priority" type="number" size="lg" />
            </UFormField>
          </div>

          <div
            class="px-6 py-5 border-t border-border flex justify-end gap-3 bg-app/50"
          >
            <UButton
              label="取消"
              color="neutral"
              variant="ghost"
              @click="isAddKBModalOpen = false"
            />
            <UButton label="确认关联" class="px-6" @click="handleLinkKB" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal
      v-model:open="isEditModalOpen"
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
            <h3 class="text-xl font-bold text-main">编辑角色设置</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isEditModalOpen = false"
            />
          </div>

          <div class="p-6 overflow-y-auto space-y-6 flex-1">
            <UFormField label="名称" required>
              <UInput
                v-model="editForm.name"
                placeholder="为你的角色起个名字"
                size="lg"
                :ui="{ base: 'rounded-xl' }"
              />
            </UFormField>

            <UFormField label="头像 URL">
              <UInput
                v-model="editForm.avatarUrl"
                placeholder="https://..."
                size="lg"
                :ui="{ base: 'rounded-xl' }"
              />
            </UFormField>

            <UFormField label="个性签名/简介">
              <UTextarea
                v-model="editForm.signature"
                placeholder="简单介绍一下角色的背景或性格..."
                :rows="3"
                :ui="{ base: 'rounded-xl' }"
              />
            </UFormField>

            <UFormField label="角色设定 (System Prompt)">
              <template #description
                >详细描述角色的说话风格、知识储备和行为准则...</template
              >
              <UTextarea
                v-model="editForm.persona"
                placeholder="你是一个博学多才的助手..."
                :rows="5"
                :ui="{ base: 'rounded-xl' }"
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
              <USwitch v-model="editForm.isPublic" />
            </div>
          </div>

          <div
            class="px-6 py-5 border-t border-border flex justify-end gap-3 bg-app/50"
          >
            <UButton
              label="取消"
              color="neutral"
              variant="ghost"
              @click="isEditModalOpen = false"
            />
            <UButton
              label="保存修改"
              :loading="isUpdating"
              class="px-8 shadow-lg shadow-primary-500/20"
              @click="handleUpdate"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
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
              <span class="text-main font-bold">"{{ character?.name }}"</span>
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
              :loading="isDeleting"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
