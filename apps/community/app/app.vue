<script setup lang="ts">
const userStore = useUserStore();

onMounted(() => {
  userStore.fetchProfile();
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
