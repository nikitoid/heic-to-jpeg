import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { get, set } from 'idb-keyval'

declare global {
    interface Window {
        showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>
    }
}

export const useSettingsStore = defineStore('settings', () => {
    // Настройки с персистенцией через localStorage
    const quality = useStorage('heic2jpeg-quality', 0.8)
    const saveMethod = useStorage<'browser' | 'fs'>('heic2jpeg-save-method', 'browser')

    // Хэндл директории (нельзя сохранить в localStorage, используем IndexedDB)
    const directoryHandle = ref<FileSystemDirectoryHandle | null>(null)
    const isDirectorySet = ref(false)

    // Инициализация хэндла из IDB
    const initDirectoryHandle = async () => {
        try {
            const handle = await get<FileSystemDirectoryHandle>('directoryHandle')
            if (handle) {
                // Проверяем разрешения при необходимости, но пока просто восстанавливаем
                directoryHandle.value = handle
                isDirectorySet.value = true
            }
        } catch (e) {
            console.error('Failed to restore directory handle', e)
        }
    }

    // Установка новой директории
    const setDirectoryHandle = async () => {
        try {
            const handle = await window.showDirectoryPicker()
            directoryHandle.value = handle
            isDirectorySet.value = true
            await set('directoryHandle', handle)
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                console.error('Failed to pick directory', e)
                throw e // Пробрасываем ошибку для UI
            }
        }
    }

    return {
        quality,
        saveMethod,
        directoryHandle,
        isDirectorySet,
        initDirectoryHandle,
        setDirectoryHandle
    }
})
