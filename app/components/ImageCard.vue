<script setup lang="ts">
import type { ConvertedImage } from '~/types'

defineProps<{
  image: ConvertedImage
}>()

const emit = defineEmits(['remove', 'click'])

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="group relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-800 transition-all hover:ring-primary-400 dark:hover:ring-primary-600" @click="emit('click')">
    <div class="aspect-3/4 flex items-center justify-center relative w-full h-full">
      <!-- Thumbnail -->
      <img 
        v-if="image.url" 
        :src="image.url" 
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
      />
      
      <!-- Loading State -->
      <div v-if="image.status === 'processing'" class="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
        <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 text-white animate-spin drop-shadow-md" />
      </div>

      <!-- Pending State -->
      <div v-if="image.status === 'pending'" class="absolute inset-0 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-[1px]">
        <UIcon name="i-heroicons-clock" class="w-8 h-8 text-gray-400" />
      </div>

      <!-- Error State -->
      <div v-if="image.status === 'error'" class="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px]">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-10 h-10 text-red-500 drop-shadow-sm" />
      </div>

      <!-- Success Indicator -->
      <div v-if="image.status === 'done'" class="absolute top-2 left-2 w-5 h-5 flex items-center justify-center bg-green-500 text-white rounded-full shadow-sm z-10">
        <UIcon name="i-heroicons-check" class="w-3 h-3" />
      </div>
      
      <!-- Remove button (Always visible on mobile/touch, nice hover effect on desktop) -->
      <button 
        class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-500 hover:text-red-500 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors z-20"
        @click.stop="emit('remove')"
      >
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
      </button>

      <!-- Info Overlay (Always visible gradient for text readability) -->
      <div class="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/80 via-black/40 to-transparent text-white pt-8">
        <p class="text-xs truncate font-medium text-shadow-sm">{{ image.originalName }}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
           <span class="text-[10px] text-gray-300 font-medium tracking-wide">{{ formatSize(image.originalSize) }}</span>
           <template v-if="image.convertedSize">
             <UIcon name="i-heroicons-arrow-right" class="w-2.5 h-2.5 text-gray-400" />
             <span class="text-[10px] text-green-300 font-bold tracking-wide">{{ formatSize(image.convertedSize) }}</span>
           </template>
        </div>
      </div>
    </div>
  </div>
</template>
