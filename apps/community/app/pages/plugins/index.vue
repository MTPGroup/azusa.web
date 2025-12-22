<script setup lang="ts">
const pluginsStore = usePluginsStore();
const userStore = useUserStore();
const searchQuery = ref("");

onMounted(() => {
  pluginsStore.fetchPlugins();
  pluginsStore.subscribeToChanges();
});

onUnmounted(() => {
  pluginsStore.unsubscribeFromChanges();
});

const filteredPlugins = computed(() => {
  if (!searchQuery.value) return pluginsStore.plugins;
  return pluginsStore.plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const isSubmitModalOpen = ref(false);
const isSubmitting = ref(false);
const toast = useToast();

const newPlugin = ref({
  name: "",
  description: "",
  version: "1.0.0",
  schema: JSON.stringify(
    {
      name: "example_tool",
      description: "An example tool schema",
      parameters: {
        type: "object",
        properties: {
          input: { type: "string" },
        },
        required: ["input"],
      },
    },
    null,
    2
  ),
  code: "// Define your tool logic here\n// The code will be executed in a sandboxed environment\n// Return the result of your tool execution",
});

const editingPlugin = ref<any>(null);

const openSubmitModal = () => {
  editingPlugin.value = null;
  newPlugin.value = {
    name: "",
    description: "",
    version: "1.0.0",
    schema: JSON.stringify(
      {
        name: "example_tool",
        description: "An example tool schema",
        parameters: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
          required: ["input"],
        },
      },
      null,
      2
    ),
    code: "// Define your tool logic here\n// The code will be executed in a sandboxed environment\n// Return the result of your tool execution",
  };
  isSubmitModalOpen.value = true;
};

const openEditModal = (plugin: any) => {
  editingPlugin.value = plugin;
  newPlugin.value = {
    name: plugin.name,
    description: plugin.description || "",
    version: plugin.version,
    schema: JSON.stringify(plugin.schema, null, 2),
    code: plugin.code || "// Define logic here",
  };
  isSubmitModalOpen.value = true;
};

const handleSubmit = async () => {
  if (!newPlugin.value.name || !newPlugin.value.code) {
    toast.add({ title: "请填写完整插件信息", color: "error" });
    return;
  }

  let parsedSchema = {};
  try {
    parsedSchema = JSON.parse(newPlugin.value.schema);
  } catch (e) {
    toast.add({ title: "JSON Schema 格式错误", color: "error" });
    return;
  }

  isSubmitting.value = true;
  try {
    let result;
    if (editingPlugin.value) {
      result = await pluginsStore.updatePlugin(editingPlugin.value.id, {
        ...newPlugin.value,
        schema: parsedSchema,
      });
    } else {
      result = await pluginsStore.createPlugin({
        ...newPlugin.value,
        schema: parsedSchema,
      });
    }

    if (result.success) {
      toast.add({
        title: editingPlugin.value ? "更新成功" : "提交成功，等待审核",
        color: "success",
      });
      isSubmitModalOpen.value = false;
    } else {
      toast.add({ title: result.error || "操作失败", color: "error" });
    }
  } catch (err) {
    toast.add({ title: "操作过程中发生错误", color: "error" });
  } finally {
    isSubmitting.value = false;
  }
};

const isDeleteModalOpen = ref(false);
const pluginToDelete = ref<any>(null);
const isDeleting = ref(false);

const openDeleteModal = (plugin: any) => {
  pluginToDelete.value = plugin;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!pluginToDelete.value) return;

  isDeleting.value = true;
  try {
    const { success, error } = await pluginsStore.deletePlugin(
      pluginToDelete.value.id
    );
    if (success) {
      toast.add({ title: "删除成功", color: "success" });
      isDeleteModalOpen.value = false;
    } else {
      toast.add({ title: error || "删除失败", color: "error" });
    }
  } catch (err) {
    toast.add({ title: "删除时发生意外错误", color: "error" });
  } finally {
    isDeleting.value = false;
    pluginToDelete.value = null;
  }
};

const handleToggleSubscribe = async (plugin: any) => {
  if (plugin.isSubscribed) {
    const success = await pluginsStore.unsubscribePlugin(plugin.id);
    if (success) {
      toast.add({ title: "已取消订阅", color: "neutral" });
    } else {
      toast.add({ title: "取消订阅失败", color: "error" });
    }
  } else {
    const success = await pluginsStore.subscribePlugin(plugin.id);
    if (success) {
      toast.add({ title: "订阅成功", color: "success" });
    } else {
      toast.add({ title: "订阅失败", color: "error" });
    }
  }
};

const handleToggleLike = async (plugin: any) => {
  if (plugin.isLiked) {
    const success = await pluginsStore.unlikePlugin(plugin.id);
    if (!success) toast.add({ title: "取消点赞失败", color: "error" });
  } else {
    const success = await pluginsStore.likePlugin(plugin.id);
    if (success) {
      toast.add({ title: "点赞成功", color: "success" });
    } else {
      toast.add({ title: "点赞失败", color: "error" });
    }
  }
};
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10"
    >
      <div>
        <h1 class="text-3xl font-bold mb-2">插件</h1>
        <p class="text-gray-400">为 Azusa 发现强大的功能扩展</p>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜索插件..."
          class="flex-grow md:w-64"
        />
        <UButton
          color="primary"
          class="bg-gradient-to-r from-blue-500 to-purple-500 border-none shrink-0"
          @click="openSubmitModal"
        >
          提交插件
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <!-- ... same loading state ... -->
    <div
      v-if="pluginsStore.loading && !isSubmitModalOpen"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <USkeleton class="h-6 w-3/4" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
        <div class="flex justify-between border-t border-border pt-4">
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-24" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <!-- ... same empty state ... -->
    <div
      v-else-if="filteredPlugins.length === 0"
      class="text-center py-20 bg-surface border border-border rounded-2xl"
    >
      <UIcon
        name="i-heroicons-cube-transparent"
        class="w-16 h-16 text-gray-600 mb-4 mx-auto"
      />
      <h3 class="text-xl font-medium text-dim">没有查找到相关插件</h3>
      <p class="text-dim mt-2">换个关键词试试，或者提交你自己的插件！</p>
    </div>

    <!-- Plugins Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="plugin in filteredPlugins"
        :key="plugin.id"
        class="bg-card border border-border rounded-xl p-6 hover:border-blue-500 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] group flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <h3
            class="text-xl font-semibold group-hover:text-blue-400 transition-colors"
          >
            {{ plugin.name }}
          </h3>
          <span
            class="text-xs px-2 py-1 bg-surface rounded-full text-dim border border-border"
          >
            v{{ plugin.version }}
          </span>
        </div>

        <p class="text-dim mb-6 text-sm line-clamp-2 flex-grow">
          {{ plugin.description }}
        </p>

        <div
          class="flex items-center justify-between text-sm border-t border-white/10 pt-4 mt-auto"
        >
          <div class="flex items-center gap-2">
            <UAvatar
              :src="plugin.author.avatar"
              :alt="plugin.author.username"
              size="xs"
              class="ring-1 ring-border"
            />
            <span class="text-dim">@{{ plugin.author.username }}</span>
          </div>
          <div class="flex items-center gap-3 text-dim">
            <UButton
              variant="ghost"
              :color="plugin.isLiked ? 'error' : 'neutral'"
              :icon="
                plugin.isLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'
              "
              size="xs"
              @click.stop="handleToggleLike(plugin)"
            >
              {{ plugin.liked }}
            </UButton>
            <UButton
              variant="ghost"
              :color="plugin.isSubscribed ? 'warning' : 'neutral'"
              :icon="
                plugin.isSubscribed
                  ? 'i-heroicons-star-solid'
                  : 'i-heroicons-star'
              "
              size="xs"
              @click.stop="handleToggleSubscribe(plugin)"
            />
            <!-- Author Actions -->
            <template v-if="userStore.profile?.id === plugin.author.id">
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-heroicons-pencil-square"
                size="xs"
                @click.stop="openEditModal(plugin)"
              />
              <UButton
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                size="xs"
                @click.stop="openDeleteModal(plugin)"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Plugin Modal -->
    <UModal
      v-model:open="isSubmitModalOpen"
      :ui="{
        content:
          'sm:max-w-xl p-0 overflow-hidden rounded-3xl border border-border',
      }"
    >
      <template #content>
        <div class="flex flex-col h-full max-h-[90vh]">
          <!-- Header -->
          <div class="p-6 border-b border-border bg-card">
            <h3 class="text-xl font-bold text-main">
              {{ editingPlugin ? "编辑插件" : "提交新插件" }}
            </h3>
            <p class="text-dim text-sm mt-1">
              {{
                editingPlugin
                  ? "修改插件信息并保存。"
                  : "分享你的插件给社区用户，通过审核后即可公开使用。"
              }}
            </p>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-card/50">
            <UFormField label="插件名称" required>
              <UInput
                v-model="newPlugin.name"
                placeholder="例如: WebSearch, Calculator"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="版本号" required>
                <UInput
                  v-model="newPlugin.version"
                  placeholder="1.0.0"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="功能描述">
              <UTextarea
                v-model="newPlugin.description"
                placeholder="描述插件的主要功能..."
                :rows="1"
                class="w-full"
              />
            </UFormField>

            <UFormField label="JSON Schema (Tool Definition)" required>
              <UTextarea
                v-model="newPlugin.schema"
                placeholder='{"name": "...", "parameters": {...}}'
                :rows="6"
                class="font-mono text-sm bg-surface w-full"
              />
              <template #help>
                定义插件的参数结构，用于 AI 理解如何调用。
              </template>
            </UFormField>

            <UFormField label="逻辑代码 (JavaScript/TypeScript)" required>
              <UTextarea
                v-model="newPlugin.code"
                placeholder="async function execute(args) { ... }"
                :rows="8"
                class="font-mono text-sm bg-surface w-full"
              />
              <template #help> 插件的实际运行逻辑。 </template>
            </UFormField>
          </div>

          <!-- Footer -->
          <div
            class="p-4 border-t border-border bg-card flex justify-end gap-3"
          >
            <UButton
              label="取消"
              color="neutral"
              variant="ghost"
              @click="isSubmitModalOpen = false"
            />
            <UButton
              :label="editingPlugin ? '保存' : '提交'"
              color="primary"
              class="px-8 shadow-lg shadow-primary-500/20"
              :loading="isSubmitting"
              @click="handleSubmit"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :ui="{
        content: 'sm:max-w-sm p-6 rounded-3xl border border-border bg-card',
      }"
    >
      <template #content>
        <div class="text-center">
          <div
            class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UIcon name="i-heroicons-trash" class="w-6 h-6 text-red-500" />
          </div>
          <h3 class="text-lg font-bold text-main mb-2">确认删除插件？</h3>
          <p class="text-dim text-sm mb-6">
            删除后将无法恢复，且订阅该插件的用户将无法继续使用。
          </p>
          <div class="flex gap-3">
            <UButton
              label="取消"
              color="neutral"
              variant="ghost"
              class="flex-1 justify-center"
              @click="isDeleteModalOpen = false"
            />
            <UButton
              label="确认删除"
              color="error"
              class="flex-1 justify-center"
              :loading="isDeleting"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
