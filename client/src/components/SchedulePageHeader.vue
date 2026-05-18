<script setup>
import { Loader2, RefreshCw } from 'lucide-vue-next'

const props = defineProps({
  isReal: { type: Boolean, required: true },
  loading: { type: Boolean, required: true },
  termInfo: { type: Object, default: null }
})
const emit = defineEmits(['reload'])
</script>

<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
    <div>
      <div class="flex items-center gap-3 mb-3"><div class="w-12 h-[2px] bg-blue-600"></div><span class="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Schedule Sync</span></div>
      <h1 class="text-5xl font-black text-gray-900 tracking-tight">课表智能选书</h1>
      <p class="text-gray-500 mt-3 text-lg">绑定本学期课表，同步所需教材。</p>
    </div>
    <div class="flex items-center gap-4">
      <div :class="['rounded-2xl border px-5 py-3 flex items-center gap-3 text-sm font-bold', isReal ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700']">
        <div :class="['w-2 h-2 rounded-full', isReal ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500']"></div>
        {{ isReal ? '教务系统实时数据' : '本地模拟数据' }}
        <span v-if="termInfo" class="text-xs opacity-70">{{ termInfo.year }} {{ termInfo.semester }}</span>
      </div>
      <button @click="emit('reload')" :disabled="loading" class="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50">
        <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
        <RefreshCw v-else class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
