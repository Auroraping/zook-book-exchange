<script setup>
import { Clock, ShieldCheck, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  items: { type: Array, required: true }
})
const emit = defineEmits(['remove'])
</script>

<template>
  <div class="col-span-8 flex flex-col gap-6">
    <div v-for="item in items" :key="item.id" class="bg-white rounded-[28px] p-6 flex gap-8 items-center border border-gray-100 hover:shadow-sm transition-all group">
      <div class="w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm">
        <img :src="item.cover" :alt="item.title" class="w-full h-full object-cover" />
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{{ item.campus }}</span>
          <span class="text-[10px] font-bold text-gray-400">· {{ item.condition }}</span>
        </div>
        <h3 class="text-xl font-medium text-gray-900 mb-2">{{ item.title }}</h3>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5 text-xs text-gray-400"><ShieldCheck class="w-4 h-4 text-green-500" /> 担保交易</div>
          <div class="flex items-center gap-1.5 text-xs text-gray-400"><Clock class="w-4 h-4" /> 预计今日交付</div>
        </div>
      </div>
      <div class="text-right flex flex-col items-end gap-8">
        <span class="text-2xl font-normal text-gray-900">¥{{ item.price }}</span>
        <button @click="emit('remove', item.id)" class="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
          <Trash2 class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
