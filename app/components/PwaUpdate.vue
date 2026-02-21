<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const { $pwa } = useNuxtApp()
const isBannerClosed = ref(false)

const hasUpdate = computed(() => {
  return $pwa?.needRefresh
})

const showBanner = computed(() => {
  return hasUpdate.value && !isBannerClosed.value
})

const showIcon = computed(() => {
  return hasUpdate.value && isBannerClosed.value
})

const closeBanner = () => {
  isBannerClosed.value = true
}

const openBanner = () => {
  isBannerClosed.value = false
}

const installUpdate = () => {
  if ($pwa?.updateServiceWorker) {
    $pwa.updateServiceWorker(true)
  }
}

// Надежная проверка интернета для сценариев с captive portal или блокировками оператора
const checkRealInternet = async (): Promise<boolean> => {
  try {
    const res = await fetch(`/favicon.ico?_=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store'
    })
    if (!res.ok) return false
    // Captive portal часто возвращает 200 OK, но тип контента - text/html
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

const checkForUpdates = async () => {
  if (!$pwa?.updateServiceWorker) return
  
  if (navigator.onLine) {
    const isOnline = await checkRealInternet()
    if (isOnline) {
      if ('update' in $pwa && typeof $pwa.update === 'function') {
        const pwaWithUpdate = $pwa as unknown as { update: () => Promise<void> }
        await pwaWithUpdate.update()
      } else if ($pwa.getSWRegistration) {
         // Fallback if $pwa.update is not provided by the current version
         const reg = await $pwa.getSWRegistration()
         if (reg?.update) {
           await reg.update()
         }
      }
    }
  }
}

let intervalId: ReturnType<typeof setInterval>

onMounted(() => {
  // Начальная проверка
  checkForUpdates()
  
  // Проверка каждый час
  intervalId = setInterval(checkForUpdates, 60 * 60 * 1000)
  
  // Проверка при появлении интернета и возвращении на страницу
  if (typeof window !== 'undefined') {
    window.addEventListener('online', checkForUpdates)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates()
      }
    })
  }
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', checkForUpdates)
    window.removeEventListener('visibilitychange', checkForUpdates)
  }
})
</script>

<template>
  <ClientOnly>
    <div v-if="hasUpdate">
      <!-- Banner -->
      <UCard 
        v-if="showBanner"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 shadow-xl min-w-[320px] max-w-[90vw]"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Доступно обновление</h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="closeBanner" />
          </div>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Установлена новая версия приложения. Обновите, чтобы использовать последние функции.
        </p>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="closeBanner">Позже</UButton>
          <UButton color="primary" @click="installUpdate">Обновить</UButton>
        </div>
      </UCard>

      <!-- Icon to reopen -->
      <UTooltip v-if="showIcon" text="Доступно обновление" class="fixed bottom-4 right-4 z-50">
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          size="lg"
          class="rounded-full shadow-lg h-14 w-14 flex items-center justify-center relative animate-bounce"
          @click="openBanner"
        >
          <span class="absolute -top-1 -right-1 flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </UButton>
      </UTooltip>
    </div>
  </ClientOnly>
</template>
