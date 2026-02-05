<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useConverter } from '~/composables/useConverter'
// import Lightbox from '~/components/Lightbox.vue' // To be created

const settingsStore = useSettingsStore()
// Local quality can override default, initially synced
const localQuality = ref(settingsStore.quality)

// Sync local modification back to global store (optional, or just use store directly)
// For this app, let's keep them synced:
watch(localQuality, (newVal) => {
  settingsStore.quality = newVal
})

const { images, addFiles, removeImage, saveSingleImage, isProcessing } = useConverter()

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    handleFiles(Array.from(input.files))
  }
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer?.files) {
    handleFiles(Array.from(e.dataTransfer.files))
  }
}

const handleFiles = async (newFiles: File[]) => {
  const heicFiles = newFiles.filter(f => f.name.toLowerCase().endsWith('.heic'))
  if (heicFiles.length === 0) {
    // Show toast
    useToast().add({ title: 'Нет HEIC файлов', description: 'Пожалуйста, выберите файлы с расширением .heic', color: 'error' })
    return
  }
  await addFiles(heicFiles)
}

const triggerFileInput = () => {
  document.getElementById('file-input')?.click()
}

const downloadLabel = computed(() => {
  return settingsStore.saveMethod === 'fs' ? 'Сохранить все' : 'Скачать все'
})

const handleDownloadAll = async () => {
  for (const img of images.value) {
    if (img.status === 'done') {
      await saveSingleImage(img)
    }
  }
}

// Lightbox state
const lightboxIndex = ref<number | null>(null)
const isLightboxOpen = computed({
  get: () => lightboxIndex.value !== null,
  set: (val) => { if (!val) lightboxIndex.value = null }
})

const openLightbox = (index: number) => {
  if (images.value[index]?.status === 'done') {
    lightboxIndex.value = index
  }
}

</script>

<template>
  <UContainer class="pb-32 sm:pb-12">
    <!-- Hero / Empty State -->
    <div v-if="images.length === 0" class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div class="space-y-4 max-w-lg mx-auto">
        <div class="bg-primary-50 dark:bg-primary-950/30 w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6 ring-1 ring-primary-100 dark:ring-primary-900">
           <UIcon name="i-heroicons-photo" class="w-12 h-12 text-primary-500" />
        </div>
        <h2 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          HEIC to JPEG
        </h2>
        <p class="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
          Конвертируйте ваши фотографии мгновенно и безопасно прямо в браузере. Полностью оффлайн.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto px-4">
        <UButton 
          block 
          size="xl" 
          color="primary" 
          variant="solid" 
          icon="i-heroicons-arrow-up-tray"
          class="h-14 text-lg font-bold shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30 transition-all rounded-2xl"
          @click="triggerFileInput" 
        >
          Выбрать файлы
        </UButton>
      </div>
      
      <!-- Quality Slider (Quick Access) -->
      <div class="w-full max-w-xs mx-auto pt-8">
        <div class="flex justify-between text-sm mb-2 text-gray-500 dark:text-gray-400">
          <span>Качество JPEG</span>
          <span>{{ Math.round(localQuality * 100) }}%</span>
        </div>
        <input 
          type="range" 
          v-model.number="localQuality" 
          min="0.1" 
          max="1" 
          step="0.01"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-800 accent-primary-500"
        >
      </div>
    </div>

    <!-- Content State -->
    <div v-else class="space-y-8 pt-6">
      <!-- Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2 sm:px-0">
        <ImageCard 
          v-for="(image, index) in images" 
          :key="image.id" 
          :image="image"
          @remove="removeImage(image.id)" 
          @click="openLightbox(index)"
        />
        
        <!-- Add more card -->
        <div 
          class="aspect-3/4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all group"
          @click="triggerFileInput"
        >
          <div class="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-950/50 transition-colors">
            <UIcon name="i-heroicons-plus" class="w-6 h-6 text-gray-400 group-hover:text-primary-500" />
          </div>
          <span class="text-sm font-medium text-gray-500 group-hover:text-primary-600">Добавить</span>
        </div>
      </div>
    </div>

    <!-- Hidden Input -->
    <input 
      id="file-input"
      type="file" 
      multiple 
      accept=".heic" 
      class="hidden" 
      @change="onFileChange"
    >

    <!-- Sticky Bottom Bar -->
    <div v-if="images.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-30">
      <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-2 flex items-center justify-between gap-2 pl-4">
        <div class="flex flex-col">
          <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">Всего</span>
          <span class="font-bold text-gray-900 dark:text-white">{{ images.length }} фото</span>
        </div>
        
        <div class="flex items-center gap-2">
           <UButton 
            icon="i-heroicons-trash"
            color="error"
            variant="soft"
            size="lg"
            class="rounded-xl"
            @click="images = []"
          />
          <UButton 
            icon="i-heroicons-arrow-down-tray"
            :label="downloadLabel"
            color="primary"
            variant="solid"
            size="lg"
            class="rounded-xl font-bold shadow-lg shadow-primary-500/20"
            :loading="isProcessing"
            @click="handleDownloadAll"
          />
        </div>
      </div>
    </div>

    <Lightbox 
      v-if="lightboxIndex !== null"
      v-model="isLightboxOpen"
      :images="images"
      :initial-index="lightboxIndex"
    />
  </UContainer>
</template>

