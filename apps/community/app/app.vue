<script setup lang="ts">
// Ensure user store is initialized to start auth listeners
useUserStore();
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
