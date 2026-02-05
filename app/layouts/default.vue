<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.initDirectoryHandle()
})
</script>

<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300">
    <AppHeader />
    
    <main class="flex-1 w-full">
      <slot />
    </main>
  </div>
</template>
