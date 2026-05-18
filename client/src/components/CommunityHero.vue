<script setup>
import { BookMarked, ChevronRight, Search } from 'lucide-vue-next'

const props = defineProps({
  keyword: { type: String, required: true }
})
const emit = defineEmits(['update:keyword'])
</script>

<template>
  <section class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-12 py-11 text-white">
      <div class="flex items-start justify-between gap-8">
        <div>
          <div class="flex items-center gap-2 mb-4"><BookMarked class="w-5 h-5 text-blue-100" /><span class="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Knowledge Community</span></div>
          <h1 class="text-4xl font-black tracking-tight mb-4">求是知识共创社区</h1>
          <p class="text-blue-100 max-w-2xl text-sm leading-relaxed">围绕微积分、线性代数、微观经济学、宏观经济学、概率论与数理统计、毛概沉淀复习资料。</p>
        </div>
      </div>
      <div class="mt-9 max-w-3xl flex bg-white rounded-2xl shadow-xl shadow-blue-900/10 overflow-hidden">
        <div class="flex-1 h-14 px-6 flex items-center gap-3">
          <Search class="w-5 h-5 text-gray-400" />
          <input :value="keyword" @input="emit('update:keyword', $event.target.value)" type="text" placeholder="搜索课程笔记、历届真题或名词解释..." class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" />
        </div>
        <button class="px-8 bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-colors flex items-center gap-2">挖掘资料 <ChevronRight class="w-4 h-4" /></button>
      </div>
    </div>
  </section>
</template>
