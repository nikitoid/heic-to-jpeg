<script setup lang="ts">
import { useSwipe, onKeyStroke } from '@vueuse/core'
import type { ConvertedImage } from '~/types'
import { useSettingsStore } from '~/stores/settings'
import { useConverter } from '~/composables/useConverter'

const props = defineProps<{
  modelValue: boolean
  images: ConvertedImage[]
  initialIndex: number
}>()

const emit = defineEmits(['update:modelValue'])

const currentIndex = ref(props.initialIndex)
const container = ref<HTMLElement | null>(null)

// Ensure current index is valid
watch(() => props.initialIndex, (val) => {
  currentIndex.value = val
})

const currentImage = computed(() => props.images[currentIndex.value])

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const settingsStore = useSettingsStore()
const { saveSingleImage } = useConverter()

const downloadLabel = computed(() => {
  return settingsStore.saveMethod === 'fs' ? 'Сохранить' : 'Скачать'
})

const downloadImage = () => {
  const img = currentImage.value
  if (img) {
    saveSingleImage(img)
  }
}

const next = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const close = () => {
  emit('update:modelValue', false)
}

// Swipe support
const { lengthX, isSwiping } = useSwipe(container, {
  threshold: 10,
  passive: true
})

// UI State for animations
const isAnimating = ref(false)
const manualOffset = ref(0) // Used during the "snap" animation

// Combined offset: Drag offset (while swiping) OR Manual offset (while animating snap)
const swipeOffset = computed(() => {
  if (isSwiping.value) return -lengthX.value
  return manualOffset.value
})

const prevImage = computed(() => currentIndex.value > 0 ? props.images[currentIndex.value - 1] : null)
const nextImage = computed(() => currentIndex.value < props.images.length - 1 ? props.images[currentIndex.value + 1] : null)

watch(isSwiping, (swiping) => {
  if (swiping) {
    // Start of swipe
    manualOffset.value = 0
    isAnimating.value = false
  } else {
    // End of swipe
    const threshold = 50
    const screenWidth = container.value?.offsetWidth || window.innerWidth
    
    // Determine target
    let target = 'stay' as 'next' | 'prev' | 'stay'
    if (lengthX.value > threshold && nextImage.value) target = 'next'
    else if (lengthX.value < -threshold && prevImage.value) target = 'prev'
    
    // Animate
    isAnimating.value = true
    
    if (target === 'next') {
      manualOffset.value = -screenWidth // Animate to left (next image comes in)
      setTimeout(() => {
        next()
        resetAnimation()
      }, 300)
    } else if (target === 'prev') {
      manualOffset.value = screenWidth // Animate to right (prev image comes in)
      setTimeout(() => {
        prev()
        resetAnimation()
      }, 300)
    } else {
      manualOffset.value = 0 // Snap back
      setTimeout(() => {
        resetAnimation()
      }, 300)
    }
  }
})

const resetAnimation = () => {
    isAnimating.value = false
    manualOffset.value = 0
}

// Keyboard support
onKeyStroke('ArrowRight', (e) => {
  e.preventDefault()
  next()
})
onKeyStroke('ArrowLeft', (e) => {
  e.preventDefault()
  prev()
})
onKeyStroke('Escape', (e) => {
  e.preventDefault()
  close()
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
    <!-- Close button -->
    <button 
      class="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/20 hover:bg-white/10 text-white backdrop-blur-md transition-colors"
      @click.stop="close"
    >
      <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
    </button>

    <!-- Main Image Container -->
    <div 
      ref="container" 
      class="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
      :class="{ 'pointer-events-none': isAnimating }"
    >
      <!-- Previous Image -->
      <div 
        v-if="prevImage"
        class="absolute inset-0 flex items-center justify-center will-change-transform"
        :class="{ 'transition-transform duration-300 ease-out': isAnimating }"
        :style="{ transform: `translateX(calc(-100% + ${swipeOffset}px))` }"
      >
        <img :src="prevImage.url" class="max-w-full max-h-full object-contain select-none pointer-events-none" />
      </div>

      <!-- Current Image -->
      <div 
        v-if="currentImage"
        class="absolute inset-0 flex items-center justify-center will-change-transform"
        :class="{ 'transition-transform duration-300 ease-out': isAnimating }"
        :style="{ transform: `translateX(${swipeOffset}px)` }"
      >
        <img :src="currentImage.url" class="max-w-full max-h-full object-contain select-none pointer-events-none" />
      </div>

      <!-- Next Image -->
      <div 
        v-if="nextImage"
        class="absolute inset-0 flex items-center justify-center will-change-transform"
        :class="{ 'transition-transform duration-300 ease-out': isAnimating }"
        :style="{ transform: `translateX(calc(100% + ${swipeOffset}px))` }"
      >
        <img :src="nextImage.url" class="max-w-full max-h-full object-contain select-none pointer-events-none" />
      </div>
    </div>

    <!-- Navigation Buttons (Desktop) -->
    <button
      v-if="currentIndex > 0"
      class="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex p-4 rounded-full bg-black/20 hover:bg-white/10 text-white backdrop-blur-md transition-all active:scale-95"
      @click.stop="prev"
    >
      <UIcon name="i-heroicons-chevron-left" class="w-8 h-8" />
    </button>

    <button
      v-if="currentIndex < images.length - 1"
      class="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex p-4 rounded-full bg-black/20 hover:bg-white/10 text-white backdrop-blur-md transition-all active:scale-95"
      @click.stop="next"
    >
      <UIcon name="i-heroicons-chevron-right" class="w-8 h-8" />
    </button>

    <!-- Info Bar -->
    <div class="absolute bottom-6 inset-x-0 mx-auto w-[90%] max-w-lg bg-black/60 backdrop-blur-xl rounded-2xl p-4 text-white flex justify-between items-center shadow-2xl ring-1 ring-white/10">
      <div class="flex flex-col min-w-0 pr-4">
        <span class="font-medium truncate text-sm sm:text-base">{{ currentImage?.originalName }}</span>
        <div class="flex items-center gap-2 text-xs text-gray-300">
           <span>{{ formatSize(currentImage?.originalSize || 0) }}</span>
           <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-gray-500" />
           <span class="text-green-400 font-bold">{{ formatSize(currentImage?.convertedSize || 0) }}</span>
        </div>
      </div>
      
      <UButton 
        icon="i-heroicons-arrow-down-tray"
        color="primary"
        variant="solid"
        size="md"
        class="shrink-0 rounded-lg font-bold"
        :label="downloadLabel"
        @click="downloadImage"
      />
    </div>
  </div>
</template>
