<script setup>
import { Info } from 'lucide-vue-next'

defineProps({
  message: { type: String, default: '' }
})
</script>

<template>
  <div v-if="message" class="flex items-center gap-2 text-red-500 text-xs font-bold px-1">
    <Info class="w-4 h-4" />
    <span>{{ message }}</span>
  </div>
</template>
