import { ref } from 'vue'
import heic2any from 'heic2any'
import type { ConvertedImage } from '~/types'
import { useSettingsStore } from '~/stores/settings'

export const useConverter = () => {
    const images = ref<ConvertedImage[]>([])
    const isProcessing = ref(false)
    const currentProcessingId = ref<string | null>(null)
    const settingsStore = useSettingsStore()

    const addFiles = async (files: File[]) => {
        // If auto-save to FS is enabled, check permissions UPFRONT
        // This must be done here, synchronously after the user interaction (file dro/pick)
        if (settingsStore.saveMethod === 'fs' && settingsStore.directoryHandle) {
            const hasPermission = await settingsStore.verifyPermission(true)
            if (!hasPermission) {
                useToast().add({ title: 'Ошибка доступа', description: 'Необходимо разрешить доступ к папке для сохранения.', color: 'error' })
                return
            }
        }

        const newImages: ConvertedImage[] = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            originalName: file.name,
            originalSize: file.size,
            status: 'pending'
        }))
        images.value.push(...newImages)
        processQueue()
    }

    const removeImage = (id: string) => {
        const index = images.value.findIndex(img => img.id === id)
        if (index !== -1) {
            const image = images.value[index]
            if (image?.url) {
                URL.revokeObjectURL(image.url)
            }
            images.value.splice(index, 1)
        }
    }

    const processQueue = async () => {
        if (isProcessing.value) return

        const pendingImage = images.value.find(img => img.status === 'pending')
        if (!pendingImage) return

        isProcessing.value = true
        currentProcessingId.value = pendingImage.id
        pendingImage.status = 'processing'

        try {
            // Conversion
            const quality = settingsStore.quality
            const resultBlob = await heic2any({
                blob: pendingImage.file,
                toType: 'image/jpeg',
                quality: quality
            }) as Blob

            // Handle array result (though usually single for single file)
            const blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob

            pendingImage.blob = blob
            pendingImage.convertedSize = blob.size
            pendingImage.status = 'done'
            pendingImage.url = URL.createObjectURL(blob)

            // Auto-save logic
            if (settingsStore.saveMethod === 'fs' && settingsStore.directoryHandle) {
                await saveToDirectory(settingsStore.directoryHandle, pendingImage.originalName, blob)
                useToast().add({ title: 'Сохранено', description: `Файл ${pendingImage.originalName.replace(/\.heic$/i, '.jpg')} сохранен`, color: 'success' })
            }

        } catch (error) {
            console.error('Conversion failed', error)
            pendingImage.status = 'error'
        } finally {
            isProcessing.value = false
            currentProcessingId.value = null
            processQueue() // Process next
        }
    }

    const saveToDirectory = async (dirHandle: FileSystemDirectoryHandle, originalName: string, blob: Blob) => {
        try {
            if (!blob || blob.size === 0) {
                console.error('Blob is empty, cannot save')
                useToast().add({ title: 'Ошибка', description: 'Файл пуст', color: 'error' })
                return
            }

            // Permission is verified upfront in addFiles or saveSingleImage
            // Double check is safe but we rely on the implementation plan to do it early.
            // However, verifyPermission(true) is safe to call again if granted.

            const newName = originalName.replace(/\.heic$/i, '.jpg')
            const fileHandle = await dirHandle.getFileHandle(newName, { create: true })
            const writable = await fileHandle.createWritable()

            // Explicitly convert to ArrayBuffer to ensure data is written correctly
            const arrayBuffer = await blob.arrayBuffer()
            await writable.write(arrayBuffer)
            await writable.close()
        } catch (e) {
            console.error('Failed to save to FS', e)
            useToast().add({ title: 'Ошибка сохранения', description: (e as Error).message, color: 'error' })
        }
    }

    const saveSingleImage = async (image: ConvertedImage) => {
        if (image.status !== 'done' || !image.blob) return

        if (settingsStore.saveMethod === 'fs' && settingsStore.directoryHandle) {
            // Verify permission before saving single file manually
            const hasPermission = await settingsStore.verifyPermission(true)
            if (!hasPermission) return

            await saveToDirectory(settingsStore.directoryHandle, image.originalName, image.blob)
            useToast().add({ title: 'Сохранено', description: `Файл ${image.originalName.replace(/\.heic$/i, '.jpg')} сохранен в папку`, color: 'primary', duration: 2000 })
        } else {
            // Browser download fallback
            const a = document.createElement('a')
            a.href = image.url!
            a.download = image.originalName.replace(/\.heic$/i, '.jpg')
            a.click()
        }
    }

    return {
        images,
        isProcessing,
        addFiles,
        removeImage,
        saveSingleImage
    }
}
