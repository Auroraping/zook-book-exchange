<script setup>
import { ChevronRight, Star } from 'lucide-vue-next'

const props = defineProps({
  profileUser: { type: Object, required: true },
  tabs: { type: Array, required: true },
  activeTab: { type: String, required: true },
  iconMap: { type: Object, required: true }
})
const emit = defineEmits(['update:activeTab'])
</script>

<template>
  <div class="w-[320px] shrink-0 flex flex-col gap-6">
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">求书信誉体系</h4>
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-bold text-gray-600">社区信誉评分</span>
        <div class="flex items-center gap-1"><Star class="w-4 h-4 text-yellow-500 fill-current" /><span class="text-lg font-black text-gray-800">{{ profileUser.credit }}</span><span class="text-xs text-gray-400">/ 5.0</span></div>
      </div>
      <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full" :style="{ width: `${profileUser.credit * 20}%` }"></div></div>
    </div>
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
      <button v-for="tab in tabs" :key="tab.id" @click="emit('update:activeTab', tab.id)" :class="['w-full flex items-center justify-between p-3 rounded-xl transition-colors group', activeTab === tab.id ? 'bg-blue-50' : 'hover:bg-gray-50']">
        <div :class="['flex items-center gap-3 text-sm font-semibold', activeTab === tab.id ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600']">
          <component :is="iconMap[tab.icon]" :class="['w-5 h-5', activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600']" /> {{ tab.label }}
        </div>
        <ChevronRight :class="['w-4 h-4', activeTab === tab.id ? 'text-blue-600' : 'text-gray-300']" />
      </button>
    </div>
  </div>
</template>
