<script setup lang="ts">
import SettingsModal from '~/components/SettingsModal_Final.vue'

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val) => colorMode.preference = val ? 'dark' : 'light'
})

const toggleTheme = () => {
  const modes = ['light', 'dark', 'system']
  const next = modes[(modes.indexOf(colorMode.value === 'dark' || colorMode.value === 'light' ? colorMode.preference : colorMode.value) + 1) % modes.length] || 'system'
  
  // Simplified toggle logic:
  if (colorMode.preference === 'system') {
    colorMode.preference = 'light'
  } else if (colorMode.preference === 'light') {
    colorMode.preference = 'dark'
  } else {
    colorMode.preference = 'system'
  }
}

const overlay = useOverlay()

const openSettings = () => {
  overlay.create(SettingsModal, {
    destroyOnClose: true
  }).open()
}
</script>

<template>
  <header class="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
    <UContainer class="h-16 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="bg-primary-50 dark:bg-primary-950/50 p-2 rounded-lg">
          <UIcon name="i-heroicons-photo" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">HEIC2JPEG</h1>
      </div>

      <div class="flex items-center gap-1">
        <ClientOnly>
          <UButton 
            :icon="colorMode.preference === 'system' ? 'i-heroicons-computer-desktop' : (colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun')" 
            color="neutral" 
            variant="ghost" 
            size="lg"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="toggleTheme" 
          />
          <template #fallback>
             <div class="w-10 h-10" />
          </template>
        </ClientOnly>
        <UButton 
          icon="i-heroicons-cog-6-tooth" 
          color="neutral" 
          variant="ghost"
          size="lg"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="openSettings" 
        />
      </div>
    </UContainer>
  </header>
</template>
