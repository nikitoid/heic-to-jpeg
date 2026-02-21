import { ref, computed, watch } from 'vue'

// PWA State as a singleton
const installPrompt = ref<any>(null)
const isInstalled = ref(false)
let isListenerAdded = false

// Check if app is running in standalone mode (PWA)
const checkIsInstalled = () => {
    if (import.meta.client) {
        isInstalled.value = window.matchMedia('(display-mode: standalone)').matches
    }
}

if (import.meta.client && !isListenerAdded) {
    isListenerAdded = true

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        installPrompt.value = e
    })

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
        installPrompt.value = null
        checkIsInstalled()
    })

    checkIsInstalled()
}

export const usePwaUtils = () => {
    const { $pwa } = useNuxtApp()
    const toast = useToast()

    const canInstall = computed(() => !!installPrompt.value)

    // Trigger installation
    const installPwa = async () => {
        if (!installPrompt.value) return

        installPrompt.value.prompt()
        const { outcome } = await installPrompt.value.userChoice

        if (outcome === 'accepted') {
            installPrompt.value = null
        }
    }

    // Update check logic
    const isUpdateAvailable = ref(false)
    const isCheckingUpdate = ref(false)

    // Ensure we are client-side before using $pwa
    if (import.meta.client && $pwa) {
        // Sync reactive state with $pwa.needRefresh
        // needRefresh is a ref provided by @vite-pwa/nuxt
        watch(() => $pwa.needRefresh, (val) => {
            isUpdateAvailable.value = val
        }, { immediate: true })
    }

    const checkForUpdate = async () => {
        if (!import.meta.client || !$pwa) {
            toast.add({ title: 'PWA не активен', description: 'Сервис-воркер не найден или вы в режиме разработки.', color: 'info' })
            return
        }

        isCheckingUpdate.value = true
        try {
            // This triggers the browser to check for a new service worker script
            const registration = await navigator.serviceWorker.ready
            await registration.update()

            // Note: If an update is found, the 'updatefound' event fires, 
            // and eventually $pwa.needRefresh should become true if the new SW waits.
            // With registerType: 'prompt', the new SW should wait.

            toast.add({ title: 'Проверка завершена', description: 'Если обновление есть, кнопка изменится на "Обновить".', color: 'success' })
        } catch (e) {
            console.error('Update check failed', e)
            toast.add({ title: 'Ошибка проверки', description: 'Не удалось проверить обновление.', color: 'error' })
        } finally {
            isCheckingUpdate.value = false
        }
    }

    const installUpdate = async () => {
        if (import.meta.client && $pwa) {
            // This updates the SW and reloads the page (default behavior of updateServiceWorker)
            await $pwa.updateServiceWorker(true)
        }
    }

    return {
        canInstall,
        isInstalled,
        installPwa,
        isUpdateAvailable,
        checkForUpdate,
        isCheckingUpdate,
        installUpdate
    }
}
