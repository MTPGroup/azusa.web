<template>
  <div>
    <div class="flex justify-between items-center mb-10">
      <div>
        <h1 class="text-3xl font-bold mb-2">AI 角色</h1>
        <p class="text-gray-400">遇见新的人格，或创建属于你自己的角色</p>
      </div>
      <UButton color="primary" class="bg-gradient-to-r from-blue-500 to-purple-500 border-none">
        创建角色
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-gray-900 border border-white/10 rounded-xl p-6 text-center hover:border-purple-500 transition-colors" v-for="i in 4" :key="i">
            <div class="w-20 h-20 rounded-full bg-white/5 border-2 border-white/10 mx-auto mb-4"></div>
            <h3 class="text-xl font-semibold mb-2">Azusa 角色 {{ i }}</h3>
            <p class="text-purple-400 text-sm mb-3">得力助手</p>
            <p class="text-gray-400 text-sm">我在这里为您提供日常任务和创意工作的协助。</p>
        </div>
    </div>
  </div>
</template>
