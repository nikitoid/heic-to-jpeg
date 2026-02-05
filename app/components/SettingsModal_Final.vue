<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '~/stores/settings'

const emit = defineEmits(['close'])

const isOpen = ref(true)

watch(isOpen, (value) => {
  if (!value) {
    emit('close')
  }
})

const settingsStore = useSettingsStore()
const { quality, saveMethod, directoryHandle, isDirectorySet } = storeToRefs(settingsStore)

const saveMethodOptions = [
  { value: 'browser', label: 'Скачивание через браузер' },
  { value: 'fs', label: 'Сохранение в папку (File System API)' }
]

const folderName = computed(() => {
  return directoryHandle.value ? directoryHandle.value.name : 'Папка не выбрана'
})

const handlePickFolder = async () => {
  try {
    await settingsStore.setDirectoryHandle()
  } catch (e) {
    // User cancelled or error
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" @click="isOpen = false"></div>

    <!-- Modal Panel -->
    <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-sm sm:max-w-lg mx-4 p-6 z-10 border border-gray-200 dark:border-gray-800">
      
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Настройки
        </h3>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isOpen = false" />
      </div>

      <!-- Body -->
      <div class="space-y-6">
        <!-- Quality -->
        <div class="space-y-2">
          <div class="flex justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Качество JPEG по умолчанию</label>
            <span class="text-sm text-gray-500">{{ Math.round(quality * 100) }}%</span>
          </div>
          <input 
            type="range" 
            v-model.number="quality" 
            min="0.1" 
            max="1" 
            step="0.01"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
          >
        </div>

        <!-- Save Method -->
        <div class="space-y-4">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Метод сохранения</label>
           <div class="space-y-2">
            <div v-for="option in saveMethodOptions" :key="option.value" class="flex items-center">
              <input 
                type="radio" 
                :id="option.value" 
                :value="option.value" 
                v-model="saveMethod"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
              <label :for="option.value" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
                {{ option.label }}
              </label>
            </div>
          </div>
        </div>

        <!-- Folder Picker -->
        <div v-if="saveMethod === 'fs'" class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <UIcon name="i-heroicons-folder" class="w-5 h-5 shrink-0" />
            <span class="truncate font-medium">{{ folderName }}</span>
          </div>
          
          <UButton 
            label="Выбрать папку" 
            color="neutral" 
            icon="i-heroicons-folder-open" 
            block 
            @click="handlePickFolder" 
          />
          
          <p v-if="!isDirectorySet" class="text-xs text-orange-500">
            ⚠️ Необходимо выбрать папку для работы этого метода
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
