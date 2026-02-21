<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

onMounted(async () => {
  const store = useSettingsStore()
  await store.initDirectoryHandle()
})
</script>

<template>
  <UApp :toaster="{ duration: 2000, expand: true }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

