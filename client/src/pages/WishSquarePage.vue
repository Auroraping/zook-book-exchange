<script setup>
import { ref, onMounted, computed } from 'vue'
import { Heart, Search, Tag, Clock, CheckCircle2 } from 'lucide-vue-next'

const wishes = ref([])
const searchTerm = ref('')

onMounted(async () => {
  const res = await fetch('/data/wishes.json')
  wishes.value = await res.json()
})

const filteredWishes = computed(() => {
  if (!searchTerm.value.trim()) return wishes.value
  const q = searchTerm.value.toLowerCase()
  return wishes.value.filter((w) => w.title.toLowerCase().includes(q) || w.author.toLowerCase().includes(q))
})
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-10 animate-google-in">
    <div class="text-center">
      <div class="flex items-center justify-center gap-3 mb-4"><div class="w-10 h-[2px] bg-purple-500"></div><span class="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Wish Square</span><div class="w-10 h-[2px] bg-purple-500"></div></div>
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
      <article v-for="wish in filteredWishes" :key="wish.id" class="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:-translate-y-1 transition-all group">
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <img :src="wish.avatar" :alt="wish.userName" class="w-10 h-10 rounded-full border border-gray-100" />
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
        <p class="text-sm text-gray-500 mb-4">作者: {{ wish.author }} · 期望价: ¥{{ wish.priceRange }}</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in wish.tags" :key="tag" class="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-full border border-gray-100 flex items-center gap-1"><Tag class="w-3 h-3" /> {{ tag }}</span>
        </div>
      </article>
    </div>
    <div v-if="filteredWishes.length === 0" class="py-20 text-center">
      <Heart class="w-16 h-16 text-gray-200 mx-auto mb-4" />
      <p class="text-gray-400 font-bold text-lg">没有找到匹配的心愿</p>
    </div>
  </div>
</template>
