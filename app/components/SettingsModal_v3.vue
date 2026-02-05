<script setup lang="ts">
// Minimal script
const isOpen = ref(true)
const emit = defineEmits(['close'])

watch(isOpen, (val) => {
  if (!val) emit('close')
})

const quality = ref(0.8)
const saveMethod = ref('browser')
</script>

<template>
  <UModal v-model:open="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            STATIC MODAL V3
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-6">
        <p>This is a static modal to test UModal rendering.</p>
        <input type="range" v-model="quality" min="0.1" max="1" step="0.1" class="w-full">
      </div>
    </UCard>
  </UModal>
</template>
