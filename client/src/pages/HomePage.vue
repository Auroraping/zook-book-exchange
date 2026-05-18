<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ShoppingCart, Upload, FileText, Zap, ArrowRight, ChevronRight } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth.js'
import BookCard from '../components/BookCard.vue'
import HeroSection from '../components/HeroSection.vue'
import FeatureGrid from '../components/FeatureGrid.vue'

const { isLoggedIn } = useAuth()
const books = ref([])

onMounted(async () => {
  const res = await fetch('/data/books.json')
  books.value = await res.json()
})
</script>

<template>
  <div class="flex flex-col gap-24 animate-google-in">
    <HeroSection />
    <FeatureGrid />
    <!-- 正在热卖 -->
    <section class="py-20">
      <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-[2px] bg-blue-600"></div>
            <span class="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Trending Now</span>
          </div>
          <h2 class="text-6xl font-black text-gray-900 leading-none">正在热卖</h2>
        </div>
        <RouterLink to="/books" class="px-8 py-4 bg-gray-100 rounded-2xl font-bold text-gray-800 flex items-center gap-2 hover:bg-gray-200 transition-all">
          查看全部广场 <ChevronRight class="w-5 h-5" />
        </RouterLink>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <BookCard v-for="book in books.slice(0, 4)" :key="book.id" :book="book" />
      </div>
    </section>
    <!-- CTA -->
    <section v-if="!isLoggedIn" class="mb-20">
      <div class="bg-gray-900 rounded-[60px] p-24 text-center relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
        <div class="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-blue-600 opacity-20 blur-[150px] rotate-45"></div>
        <div class="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-purple-600 opacity-20 blur-[150px] -rotate-45"></div>
        <div class="relative z-10">
          <h2 class="text-7xl font-black text-white mb-8 leading-none tracking-tight">加入求是园的<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">知识文艺复兴</span></h2>
          <p class="text-gray-400 mb-16 max-w-2xl mx-auto text-xl font-medium">在这里，每一页翻过的纸张都有温度。已有数万名同学通过"浙里淘书"找到了他们的学术引路人。好书淘不尽，浙里top three。</p>
          <RouterLink to="/login" class="px-16 py-6 bg-white text-gray-900 rounded-full font-black text-2xl hover:scale-110 transition-transform shadow-2xl inline-block">立即开启寻书之旅</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
