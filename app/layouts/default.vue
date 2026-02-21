<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.initDirectoryHandle()
})
</script>

<template>
  <div class="h-screen flex flex-col transition-colors duration-300 overflow-hidden">
    <AppHeader class="flex-none" />
    
    <main class="flex-1 w-full min-h-0 overflow-y-auto">
      <slot />
    </main>

    <PwaUpdate />
  </div>
</template>
