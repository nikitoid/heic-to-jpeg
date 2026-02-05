import { ref } from 'vue'
import heic2any from 'heic2any'
import type { ConvertedImage } from '~/types'
import { useSettingsStore } from '~/stores/settings'

export const useConverter = () => {
    const images = ref<ConvertedImage[]>([])
    const isProcessing = ref(false)
    const currentProcessingId = ref<string | null>(null)
    const settingsStore = useSettingsStore()

    const addFiles = (files: File[]) => {
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

            // Auto-save removed as per user request
            // if (settingsStore.saveMethod === 'fs' && settingsStore.directoryHandle) {
            //     await saveToDirectory(settingsStore.directoryHandle, pendingImage.originalName, blob)
            // }

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
            const newName = originalName.replace(/\.heic$/i, '.jpg')
            const fileHandle = await dirHandle.getFileHandle(newName, { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(blob)
            await writable.close()
        } catch (e) {
            console.error('Failed to save to FS', e)
            // Could set a warning flag on the image
        }
    }

    const saveSingleImage = async (image: ConvertedImage) => {
        if (image.status !== 'done' || !image.blob) return

        if (settingsStore.saveMethod === 'fs' && settingsStore.directoryHandle) {
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
