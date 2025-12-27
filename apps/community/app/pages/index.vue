<template>
  <div class="text-center py-20">
    <section class="max-w-4xl mx-auto px-4 mb-20">
      <h1 class="text-6xl font-bold mb-6">
        欢迎来到
        <span
          class="bg-gradient-to-r from-emerald-500 to-lime-500 bg-clip-text text-transparent"
          >Azusa</span
        >
      </h1>
      <p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
        探索社区插件，创建独特的 AI 角色，并构建共享知识库。
      </p>
      <div class="flex gap-4 justify-center">
        <UButton
          to="/plugins"
          size="xl"
          color="primary"
          class="bg-gradient-to-r from-emerald-500 to-lime-500 border-none"
        >
          浏览插件
        </UButton>
        <UButton
          to="/characters"
          size="xl"
          color="primary"
          variant="soft"
          class="border border-primary/30 bg-primary/10 hover:bg-primary/15 text-main hover:text-primary"
        >
          创建角色
        </UButton>
      </div>
    </section>

    <section
      class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4"
    >
      <NuxtLink to="/plugins" class="block group">
        <div
          class="bg-card border border-border rounded-xl p-8 transition-all h-full text-left hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
        >
          <h3
            class="text-2xl font-semibold mb-3 text-main group-hover:text-primary transition-colors"
          >
            插件
          </h3>
          <p class="text-dim">使用社区开发的强大功能模块扩展 Azusa。</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/characters" class="block group">
        <div
          class="bg-card border border-border rounded-xl p-8 transition-all h-full text-left hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
        >
          <h3
            class="text-2xl font-semibold mb-3 text-main group-hover:text-primary transition-colors"
          >
            AI 角色
          </h3>
          <p class="text-dim">设计并分享多样的 AI 人格。</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/knowledge" class="block group">
        <div
          class="bg-card border border-border rounded-xl p-8 transition-all h-full text-left hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
        >
          <h3
            class="text-2xl font-semibold mb-3 text-main group-hover:text-primary transition-colors"
          >
            知识库
          </h3>
          <p class="text-dim">协作维护 RAG 数据和文档。</p>
        </div>
      </NuxtLink>
    </section>
  </div>
</template>
