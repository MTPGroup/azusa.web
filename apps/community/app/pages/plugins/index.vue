<script setup lang="ts">
const pluginsStore = usePluginsStore();
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
        >
          提交插件
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="pluginsStore.loading"
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
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-heart" class="w-4 h-4" />
              <span>{{ plugin.liked }}</span>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-plus-circle"
              size="xs"
              @click.stop="pluginsStore.subscribePlugin(plugin.id)"
            />
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-right"
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
