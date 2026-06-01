<script setup>
import { RouterLink } from 'vue-router'
import { Download, Lock, ThumbsUp } from 'lucide-vue-next'

const props = defineProps({
  note: { type: Object, required: true }
})
const emit = defineEmits(['delete-note'])

</script>

<template>
  <RouterLink :to="`/community/note/${note.id}`" class="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl transition-all group min-h-[260px] flex flex-col relative">
    <div class="flex justify-between items-start gap-3 mb-5">
      <div class="flex flex-wrap gap-2 min-w-0">
        <span class="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100 truncate max-w-[160px]">{{ note.course }}</span>
        <span class="bg-slate-50 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-100">{{ note.type }}</span>
      </div>
      <span v-if="note.isPaid" class="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1 whitespace-nowrap"><Lock class="w-3 h-3" /> 积分兑换</span>
      <span v-else class="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-100 whitespace-nowrap">免费获取</span>
    </div>
    <h3 class="font-black text-gray-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{{ note.title }}</h3>
    <p class="text-sm text-gray-500 leading-relaxed mt-4 line-clamp-3">{{ note.desc }}</p>
    <div class="flex flex-wrap gap-2 mt-5">
      <span v-for="tag in note.tags" :key="tag" class="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500">{{ tag }}</span>
    </div>
    <div class="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center gap-4">
      <div class="flex items-center gap-2 min-w-0"><img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${note.author}`" :alt="note.author" class="w-8 h-8 rounded-full border border-gray-100 bg-gray-50" /><span class="text-xs text-gray-500 font-bold truncate max-w-[120px]">{{ note.author }}</span></div>
      <div class="flex items-center gap-3 text-gray-400 text-xs font-black whitespace-nowrap"><span>{{ note.difficulty }}</span><span class="flex items-center gap-1"><ThumbsUp class="w-4 h-4" /> {{ note.likes }}</span><span class="flex items-center gap-1"><Download class="w-4 h-4" /> {{ note.downloads }}</span></div>
    </div>
  </RouterLink>
</template>
