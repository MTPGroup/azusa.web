<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const session = useSupabaseSession();
const client = useSupabaseClient();
const userStore = useUserStore();
const isAuthModalOpen = ref(false);

const openAuthModal = () => {
  isAuthModalOpen.value = true;
};

const logout = async () => {
  const { error } = await client.auth.signOut();
  if (error) {
    console.error("Logout error:", error);
  } else {
    userStore.clearProfile();
  }
};

const navLinks: NavigationMenuItem[] = [
  { label: "插件", icon: "i-heroicons-cube", to: "/plugins" },
  { label: "AI 角色", icon: "i-lucide-user", to: "/characters" },
  { label: "知识库", icon: "i-lucide-database", to: "/knowledge" },
];

const userMenuItems = computed(() => [
  [
    {
      label: userStore.profile?.username || "用户",
      slot: "account",
      disabled: true,
    },
  ],
  [
    {
      label: "退出登录",
      icon: "i-heroicons-log-out",
      onSelect: logout,
    },
  ],
]);
</script>

<template>
  <div class="min-h-screen bg-app text-main flex flex-col">
    <!-- Auth Modal -->
    <AuthModal v-model:isOpen="isAuthModalOpen" />

    <UHeader class="bg-app/80 backdrop-blur-md border-b border-border">
      <template #title>
        <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold">
          <span
            class="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent italic"
            >Azusa</span
          >
          <span class="dark:text-white text-gray-900 border-none">社区</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navLinks" />

      <template #right>
        <UColorModeSwitch />

        <ClientOnly>
          <div class="flex items-center pl-2">
            <template v-if="session">
              <UDropdownMenu
                :items="userMenuItems"
                :popper="{ placement: 'bottom-end' }"
              >
                <UAvatar
                  :src="userStore.profile?.avatar"
                  :alt="userStore.profile?.username"
                  size="sm"
                  class="cursor-pointer ring-2 ring-border hover:ring-purple-500 transition-all shadow-lg"
                />
                <template #account="{ item }">
                  <div class="text-left px-2 py-1.5">
                    <p
                      class="text-[10px] uppercase font-bold text-dim tracking-wider"
                    >
                      当前账号
                    </p>
                    <p class="truncate font-medium text-main">
                      {{ item.label }}
                    </p>
                  </div>
                </template>
              </UDropdownMenu>
            </template>
            <template v-else>
              <UButton
                color="primary"
                variant="solid"
                class="bg-gradient-to-r from-blue-500 to-purple-500 border-none hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all font-semibold"
                @click="openAuthModal"
              >
                登 录
              </UButton>
            </template>
          </div>
        </ClientOnly>
      </template>

      <template #body>
        <UNavigationMenu
          :items="navLinks"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain class="flex-grow py-4">
      <UContainer>
        <slot />
      </UContainer>
    </UMain>

    <UFooter class="border-t border-border bg-app">
      <template #left>
        <span class="text-sm text-dim">
          Copyright &copy; 2025 MTPGroup -
          <ULink
            href="https://github.com/MTPGroup/azusa.supabase"
            target="_blank"
            class="hover:underline"
            >MIT License</ULink
          >
        </span>
      </template>

      <template #right>
        <div class="flex items-center gap-4 text-dim">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-simple-icons-github"
            to="https://github.com/MTPGroup"
            target="_blank"
          />
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-simple-icons-qq"
            to="https://qm.qq.com/q/VHpRTUdpO8"
            target="_blank"
          />
        </div>
      </template>
    </UFooter>
  </div>
</template>
