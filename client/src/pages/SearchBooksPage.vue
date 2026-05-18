<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { BookOpen, ChevronRight, SlidersHorizontal, Sparkles, Search as SearchIcon } from 'lucide-vue-next'
import BookListCard from '../components/BookListCard.vue'

const activeSort = ref('综合')
const showWishModal = ref(false)
const selectedCampuses = ref([])
const selectedCategory = ref('全部院系')
const route = useRoute()
const books = ref([])

onMounted(async () => {
  const res = await fetch('/data/books.json')
  books.value = await res.json()
})

const query = computed(() => route.query.q || '')

const toggleCampus = (campus) => {
  const idx = selectedCampuses.value.indexOf(campus)
  if (idx >= 0) selectedCampuses.value.splice(idx, 1)
  else selectedCampuses.value.push(campus)
}

const resetFilters = () => {
  selectedCampuses.value = []
  selectedCategory.value = '全部院系'
  activeSort.value = '综合'
}

const filteredBooks = computed(() => {
  let list = books.value.filter((b) => b.status === 'approved')
  const q = query.value.trim().toLowerCase()
  if (q) list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
  if (selectedCampuses.value.length > 0) list = list.filter((b) => selectedCampuses.value.some((c) => c.includes(b.campus)))
  if (selectedCategory.value !== '全部院系') list = list.filter((b) => b.category === selectedCategory.value)
  if (activeSort.value === '价格') list = [...list].sort((a, b) => a.price - b.price)
  else if (activeSort.value === '最新') list = [...list].sort((a, b) => (b.id > a.id ? 1 : -1))
  return list
})

const campuses = ['紫金港校区', '玉泉校区', '西溪校区', '华家池校区']
const sortTabs = ['综合', '价格', '最新', '成色']
</script>

<template>
  <div class="flex gap-16 items-start animate-google-in pt-4">
    <!-- 侧边筛选器 -->
    <aside class="w-[320px] shrink-0 sticky top-32">
      <div class="premium-card p-10 !rounded-[40px] shadow-2xl shadow-blue-900/5">
        <div class="flex items-center gap-4 mb-10">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg"><SlidersHorizontal class="w-6 h-6"/></div>
          <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Filters</h2>
        </div>
        <div class="space-y-12">
          <div>
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><div class="w-4 h-[1px] bg-gray-200"></div> 校区分布</h4>
            <div class="flex flex-col gap-4">
              <label v-for="campus in campuses" :key="campus" class="flex items-center gap-4 cursor-pointer group">
                <div :class="['w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center', selectedCampuses.includes(campus) ? 'bg-blue-600 border-blue-600 shadow-md' : 'border-gray-200 group-hover:border-blue-400']">
                  <input type="checkbox" class="hidden" :checked="selectedCampuses.includes(campus)" @change="toggleCampus(campus)" />
                  <svg v-if="selectedCampuses.includes(campus)" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <span :class="['text-sm font-bold transition-colors', selectedCampuses.includes(campus) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900']">{{ campus }}</span>
              </label>
            </div>
          </div>
          <div>
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><div class="w-4 h-[1px] bg-gray-200"></div> 学科分类</h4>
            <div class="relative group">
              <select v-model="selectedCategory" class="w-full bg-gray-50 border-none rounded-[18px] h-14 px-6 text-sm font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer appearance-none">
                <option v-for="opt in ['全部院系','公共必修与思政类','计算机科学与技术','经济与管理','外语学习']" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-blue-600 transition-colors"><ChevronRight class="w-5 h-5 rotate-90" /></div>
            </div>
          </div>
          <div class="pt-6">
            <button @click="resetFilters" class="w-full h-14 bg-gray-900 text-white rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">Reset All</button>
          </div>
        </div>
      </div>
      <div class="mt-8 premium-card p-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-2xl relative overflow-hidden group">
        <div class="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
        <Sparkles class="w-10 h-10 mb-6 text-yellow-300" />
        <h4 class="text-xl font-black mb-3">没找到需要的书？</h4>
        <p class="text-xs text-white/70 leading-relaxed mb-8 font-medium">登记您的心愿清单，桃酥 AI 将为您全校实时监控。</p>
        <button @click="showWishModal = true" class="w-full py-4 bg-white text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] transition-all active:scale-95">Make a Wish</button>
      </div>
    </aside>
    <!-- 右侧商品流 -->
    <div class="flex-1">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div class="flex flex-wrap gap-3">
          <button v-for="tab in sortTabs" :key="tab" @click="activeSort = tab" :class="['px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all', activeSort === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white text-gray-400 hover:text-gray-800']">{{ tab }}</button>
        </div>
        <div class="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Found <span class="text-gray-900">{{ filteredBooks.length }}</span> Masterpieces</div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <BookListCard v-for="book in filteredBooks" :key="book.id" :book="book" />
      </div>
      <div v-if="filteredBooks.length === 0" class="py-40 text-center">
        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8"><BookOpen class="w-12 h-12 text-gray-200" /></div>
        <h3 class="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">Nothing Found</h3>
        <p class="text-gray-400 font-medium text-lg">尝试调整您的过滤器，或者开启一个心愿单。</p>
      </div>
    </div>
    <!-- 心愿模态框 -->
    <div v-if="showWishModal" class="fixed inset-0 z-[100] flex items-center justify-center p-8">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" @click="showWishModal = false"></div>
      <div class="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-16 animate-google-in border border-white/20">
        <h2 class="text-4xl font-black text-gray-900 mb-4 tracking-tighter">MAKE A WISH</h2>
        <p class="text-lg text-gray-500 mb-12 font-medium">我们将为您在全校范围内实时监控每一个知识的脉动。</p>
        <div class="space-y-8">
          <div>
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Book Title</label>
            <div class="h-16 bg-gray-50 rounded-[20px] px-8 flex items-center gap-4 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 transition-all border border-transparent">
              <SearchIcon class="w-6 h-6 text-gray-400" />
              <input type="text" class="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-gray-900" placeholder="书名、作者、ISBN..." />
            </div>
          </div>
          <button @click="showWishModal = false" class="w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] transition-transform active:scale-95">Submit Wish</button>
        </div>
      </div>
    </div>
  </div>
</template>
