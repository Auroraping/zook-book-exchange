<script setup>
import { ref, onMounted, computed } from 'vue'
import { Heart, Search, Tag, Clock, CheckCircle2, Flame } from 'lucide-vue-next'
import WishDetailModal from '../components/WishDetailModal.vue'
import { getJson } from '../composables/useApi.js'

const wishes = ref([])
const searchTerm = ref('')
const isDetailOpen = ref(false)
const selectedWish = ref(null)

onMounted(async () => {
  wishes.value = (await getJson('/api/wishes')).wishes
})

const filteredWishes = computed(() => {
  if (!searchTerm.value.trim()) return wishes.value
  const q = searchTerm.value.toLowerCase()
  return wishes.value.filter((w) => w.title.toLowerCase().includes(q) || w.author.toLowerCase().includes(q))
})

const openDetail = (wish) => {
  selectedWish.value = wish
  isDetailOpen.value = true
}

const handleCoseekSuccess = (updatedWish) => {
  const idx = wishes.value.findIndex(w => w.id === updatedWish.id)
  if (idx >= 0) {
    wishes.value[idx] = updatedWish
  }
  selectedWish.value = updatedWish
}
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-10 animate-google-in">
    <div class="text-center">
      <div class="flex items-center justify-center gap-3 mb-4"><div class="w-10 h-[2px] bg-purple-500"></div><span class="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">求购广场</span><div class="w-10 h-[2px] bg-purple-500"></div></div>
      <h1 class="text-5xl font-black text-gray-900 tracking-tight mb-4">心愿广场</h1>
      <p class="text-lg text-gray-500 max-w-2xl mx-auto">在这里登记你想买的书，桃酥 AI 会在全校范围内帮你实时追踪。一旦有人上架，你将第一时间收到通知。</p>
    </div>
    <div class="flex justify-center">
      <div class="w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-sm px-6 h-14 flex items-center gap-4">
        <Search class="w-5 h-5 text-gray-400" />
        <input v-model="searchTerm" type="text" placeholder="搜索心愿中的书名或作者..." class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article v-for="wish in filteredWishes" :key="wish.id" @click="openDetail(wish)" class="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden">
        <!-- 侧边热度条装饰 -->
        <div v-if="wish.coSeekers && wish.coSeekers.length > 0" class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
        
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <img :src="wish.avatar" :alt="wish.userName" class="w-10 h-10 rounded-full border border-gray-100 object-cover" />
            <div>
              <h4 class="font-bold text-gray-800 text-sm">{{ wish.userName }}</h4>
              <p class="text-[10px] text-gray-400 flex items-center gap-1"><Clock class="w-3 h-3" /> {{ wish.timestamp }}</p>
            </div>
          </div>
          <span :class="['flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full', wish.status === 'seeking' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-green-50 text-green-600 border border-green-100']">
            <Heart v-if="wish.status === 'seeking'" class="w-3 h-3" /><CheckCircle2 v-else class="w-3 h-3" /> {{ wish.status === 'seeking' ? '求购中' : '已达成' }}
          </span>
        </div>
        <h3 class="text-xl font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{{ wish.title }}</h3>
        
        <div class="flex justify-between items-center mb-4">
          <p class="text-sm text-gray-500">作者: {{ wish.author }} · 期望价: <span class="text-red-500 font-bold">¥{{ wish.priceRange }}</span></p>
          <!-- 列表卡片上同求热度气泡 -->
          <span v-if="wish.coSeekers && wish.coSeekers.length > 0" class="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-0.5">
            <Flame class="w-3 h-3 text-purple-500 fill-purple-200" /> {{ 1 + wish.coSeekers.filter(s => s !== wish.userId).length }}人同求
          </span>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in wish.tags" :key="tag" class="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-full border border-gray-100 flex items-center gap-1"><Tag class="w-3 h-3" /> {{ tag }}</span>
        </div>
      </article>
    </div>
    <div v-if="filteredWishes.length === 0" class="py-20 text-center">
      <Heart class="w-16 h-16 text-gray-200 mx-auto mb-4" />
      <p class="text-gray-400 font-bold text-lg">没有找到匹配的心愿</p>
    </div>
    
    <!-- 详情互动弹窗 -->
    <WishDetailModal :isOpen="isDetailOpen" :wish="selectedWish" @close="isDetailOpen = false" @coseek="handleCoseekSuccess" />
  </div>
</template>
