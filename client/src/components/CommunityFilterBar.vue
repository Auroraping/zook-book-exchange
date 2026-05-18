<script setup>
import { FileText } from 'lucide-vue-next'

const props = defineProps({
  filters: { type: Array, required: true },
  activeFilter: { type: String, required: true },
  counts: { type: Object, required: true }
})
const emit = defineEmits(['update:activeFilter'])
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
    <div>
      <div class="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] mb-3">
        <FileText class="w-4 h-4" /> Course Library
      </div>
      <h2 class="text-3xl font-black text-gray-900">六门课程资料库</h2>
    </div>
    <div class="flex flex-wrap gap-2">
      <button v-for="filter in filters" :key="filter" @click="emit('update:activeFilter', filter)" :class="['px-5 h-11 rounded-full text-xs font-black transition-all', activeFilter === filter ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-800']">
        {{ filter }} <span class="opacity-70">({{ counts[filter] || 0 }})</span>
      </button>
    </div>
  </div>
</template>
