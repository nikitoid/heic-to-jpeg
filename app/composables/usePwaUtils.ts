export const usePwaUtils = () => {
    const { $pwa } = useNuxtApp()

    // Installation state
    const installPrompt = ref<any>(null)
    const canInstall = computed(() => !!installPrompt.value)
    const isInstalled = ref(false) // Simple check if running in standalone mode

    // Check if app is running in standalone mode (PWA)
    const checkIsInstalled = () => {
        if (import.meta.client) {
            isInstalled.value = window.matchMedia('(display-mode: standalone)').matches
        }
    }

    // Capture install prompt
    if (import.meta.client) {
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

    // Trigger installation
    const installPwa = async () => {
        if (!installPrompt.value) return

        installPrompt.value.prompt()
        const { outcome } = await installPrompt.value.userChoice

        if (outcome === 'accepted') {
            installPrompt.value = null
        }
    }

    // Update check
    const isUpdateAvailable = ref(false)
    const isCheckingUpdate = ref(false)

    // Setup initial state from $pwa if available
    if ($pwa) {
        isUpdateAvailable.value = $pwa.needRefresh
    }

    const checkForUpdate = async () => {
        if (!$pwa) {
            useToast().add({ title: 'PWA не активен', description: 'Сервис-воркер не найден или вы в режиме разработки.', color: 'info' })
            return
        }

        isCheckingUpdate.value = true
        try {
            await $pwa.updateServiceWorker(true) // Force update check
            // Note: If update is found, registerType: 'autoUpdate' usually handles it,
            // or needRefresh becomes true if configured differently.
            // With autoUpdate, the page usually reloads automatically if configured.

            // However, manual check sometimes needs a dedicated method if the plugin exposes it.
            // The default vite-pwa/nuxt injection is simple.
            // Let's rely on the registration update.

            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration()
                if (registration) {
                    await registration.update()
                    useToast().add({ title: 'Проверка завершена', description: 'Если обновление найдено, оно будет применено.', color: 'success' })
                } else {
                    useToast().add({ title: 'Ошибка', description: 'SW Registration not found', color: 'error' })
                }
            }
        } catch (e) {
            console.error('Update check failed', e)
            useToast().add({ title: 'Ошибка проверки', description: 'Не удалось проверить обновление.', color: 'error' })
        } finally {
            isCheckingUpdate.value = false
        }
    }

    return {
        canInstall,
        isInstalled,
        installPwa,
        isUpdateAvailable,
        checkForUpdate,
        isCheckingUpdate
    }
}
