<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { BookMarked, Lock, Search, Sparkles, ThumbsUp, ChevronRight, FileText } from 'lucide-vue-next'

const notes = ref([])
const activeFilter = ref('全部领域')
const keyword = ref('')
const filters = ['全部领域', '公共基础', '硬核理工', '经管社科']

const publicCourses = ['高等数学', '大学物理', '思想政治', '概率论', '线性代数']
const techCourses = ['数据结构', '计算机', '操作系统']
const econCourses = ['经济', '管理']

onMounted(async () => {
  const res = await fetch('/data/notes.json')
  const raw = await res.json()
  notes.value = raw.map((note, index) => ({ ...note, listId: `${note.id}-${index}` }))
})

const filteredNotes = computed(() => {
  return notes.value.filter((note) => {
    const haystack = `${note.title}${note.course}${note.author}`.toLowerCase()
    if (keyword.value.trim() && !haystack.includes(keyword.value.trim().toLowerCase())) return false
    if (activeFilter.value === '全部领域') return true
    if (activeFilter.value === '公共基础') return publicCourses.some((c) => note.course.includes(c))
    if (activeFilter.value === '硬核理工') return techCourses.some((c) => note.course.includes(c))
    if (activeFilter.value === '经管社科') return econCourses.some((c) => note.course.includes(c))
    return true
  })
})
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <section class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-12 py-11 text-white">
        <div class="flex items-start justify-between gap-8">
          <div>
            <div class="flex items-center gap-2 mb-4"><BookMarked class="w-5 h-5 text-blue-100" /><span class="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Knowledge Community</span></div>
            <h1 class="text-4xl font-black tracking-tight mb-4">求是知识共创社区</h1>
            <p class="text-blue-100 max-w-2xl text-sm leading-relaxed">课程笔记、历年真题、复习提纲和名词解释集中沉淀。</p>
          </div>
        </div>
        <div class="mt-9 max-w-3xl flex bg-white rounded-2xl shadow-xl shadow-blue-900/10 overflow-hidden">
          <div class="flex-1 h-14 px-6 flex items-center gap-3">
            <Search class="w-5 h-5 text-gray-400" />
            <input v-model="keyword" type="text" placeholder="搜索课程笔记、历届真题或名词解释..." class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" />
          </div>
          <button class="px-8 bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-colors flex items-center gap-2">挖掘资料 <ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </section>
    <section class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div><div class="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] mb-3"><FileText class="w-4 h-4" /> Campus Picks</div><h2 class="text-3xl font-black text-gray-900">本周校园热载榜</h2></div>
        <div class="flex flex-wrap gap-2">
          <button v-for="filter in filters" :key="filter" @click="activeFilter = filter" :class="['px-5 h-11 rounded-full text-xs font-black transition-all', activeFilter === filter ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-800']">{{ filter }}</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <article v-for="note in filteredNotes" :key="note.listId" class="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl transition-all group min-h-[220px] flex flex-col">
          <div class="flex justify-between items-start gap-3 mb-5">
            <span class="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100 truncate max-w-[160px]">{{ note.course }}</span>
            <span v-if="note.isPaid" class="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1 whitespace-nowrap"><Lock class="w-3 h-3" /> 积分兑换</span>
            <span v-else class="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-100 whitespace-nowrap">免费获取</span>
          </div>
          <h3 class="font-black text-gray-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{{ note.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed mt-4 line-clamp-2">{{ note.desc || '桃酥已自动关联课程与教材，可作为买书前后的复习资料补充。' }}</p>
          <div class="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center">
            <div class="flex items-center gap-2 min-w-0"><img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${note.author}`" :alt="note.author" class="w-8 h-8 rounded-full border border-gray-100 bg-gray-50" /><span class="text-xs text-gray-500 font-bold truncate max-w-[120px]">{{ note.author }}</span></div>
            <div class="flex items-center gap-1 text-gray-400 text-xs font-black"><ThumbsUp class="w-4 h-4" /> {{ note.likes }}</div>
          </div>
        </article>
      </div>
      <div v-if="filteredNotes.length === 0" class="bg-white border border-gray-100 rounded-[28px] py-24 text-center">
        <Sparkles class="w-12 h-12 text-gray-200 mx-auto mb-4" /><p class="text-gray-400 font-black">暂时没有匹配资料，换个关键词试试。</p>
      </div>
    </section>
  </div>
</template>
