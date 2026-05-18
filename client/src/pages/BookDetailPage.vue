<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ShieldCheck, MessageSquare, Heart, Sparkles, Share2, Info, ShoppingBag, ArrowLeft, Star } from 'lucide-vue-next'

const route = useRoute()
const book = ref(null)
const isFavorited = ref(false)

onMounted(async () => {
  const res = await fetch('/data/books.json')
  const books = await res.json()
  book.value = books.find((b) => b.id === route.params.id) || books[0]
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  isFavorited.value = favorites.includes(route.params.id)
})

const addToCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  if (!cart.includes(route.params.id)) {
    localStorage.setItem('cart', JSON.stringify([...cart, route.params.id]))
    window.dispatchEvent(new Event('cartUpdated'))
  }
}
</script>

<template>
  <div v-if="book" class="max-w-6xl mx-auto animate-google-in pt-6">
    <div class="flex items-center justify-between mb-10">
      <RouterLink to="/books" class="p-3 hover:bg-gray-100 rounded-full transition-all"><ArrowLeft class="w-6 h-6 text-gray-500" /></RouterLink>
      <div class="flex gap-2">
        <button class="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-500"><Share2 class="w-5 h-5" /></button>
        <button @click="isFavorited = !isFavorited" :class="['p-3 hover:bg-gray-100 rounded-full transition-all', isFavorited ? 'text-red-500' : 'text-gray-500']"><Heart :class="['w-5 h-5', isFavorited ? 'fill-current' : '']" /></button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-16">
      <div class="md:col-span-5">
        <div class="google-card overflow-hidden !rounded-[32px] sticky top-24">
          <img :src="book.cover" class="w-full aspect-[4/5] object-cover" :alt="book.title" />
          <div class="p-8 bg-gray-50 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">推荐指数</span>
              <div class="flex items-center gap-0.5 text-yellow-500"><Star v-for="i in 5" :key="i" class="w-4 h-4 fill-current" /></div>
            </div>
            <div class="h-10 w-[1px] bg-gray-200"></div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">库存状态</span>
              <p class="text-sm font-medium text-gray-800">仅剩 {{ Math.floor(Math.random() * 5) + 1 }} 本</p>
            </div>
          </div>
        </div>
      </div>
      <div class="md:col-span-7 flex flex-col gap-12">
        <section>
          <div class="flex items-center gap-2 mb-8">
            <span class="bg-blue-50 text-blue-600 px-3 py-1 text-[10px] font-bold rounded-lg uppercase border border-blue-100">{{ book.campus }}</span>
            <span class="bg-green-50 text-green-600 px-3 py-1 text-[10px] font-bold rounded-lg uppercase border border-green-100">{{ book.condition }}</span>
          </div>
          <h1 class="text-5xl font-medium text-gray-900 mb-6 leading-tight tracking-tight">{{ book.title }}</h1>
          <p class="text-xl text-gray-500 mb-10">{{ book.author }}</p>
          <div class="flex items-baseline gap-6 mb-12">
            <span class="text-6xl font-medium text-gray-900">¥{{ book.price }}</span>
            <span class="text-xl text-gray-400 line-through">原价 ¥{{ book.originalPrice }}</span>
          </div>
          <div class="flex gap-4">
            <button @click="addToCart" class="flex-[2] m3-btn-filled !rounded-[24px] !py-5 flex items-center justify-center gap-3 text-lg"><ShoppingBag class="w-6 h-6" /> 加入购书清单</button>
            <RouterLink to="/messages" class="flex-1 bg-white border border-gray-200 text-gray-800 !rounded-[24px] flex items-center justify-center gap-3 text-lg hover:bg-gray-50 rounded-3xl py-5"><MessageSquare class="w-6 h-6" /> 聊一聊</RouterLink>
          </div>
        </section>
        <hr class="border-gray-100" />
        <section class="google-card p-6 flex items-center justify-between !rounded-[24px] !shadow-none !border-gray-100">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-full overflow-hidden border border-gray-100"><img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`" alt="seller" /></div>
            <div>
              <div class="flex items-center gap-2"><span class="font-medium text-gray-800">{{ book.seller }}</span><ShieldCheck class="w-4 h-4 text-blue-600" /></div>
              <p class="text-xs text-gray-500 mt-1 font-medium">浙大统一身份认证 · 信用优秀</p>
            </div>
          </div>
          <RouterLink to="/profile" class="m3-btn-filled !px-5 !py-2 !text-xs">查看主页</RouterLink>
        </section>
        <section class="bg-blue-50/30 rounded-[32px] p-10 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-10 opacity-[0.03]"><Sparkles class="w-40 h-40 text-blue-600" /></div>
          <div class="relative z-10">
            <h3 class="flex items-center gap-2 text-xl font-medium text-gray-800 mb-8"><Info class="w-5 h-5 text-blue-600" /> AI 选书建议</h3>
            <div class="flex items-start gap-8 mb-10">
              <div class="w-16 h-16 shrink-0 rounded-2xl bg-white flex flex-col items-center justify-center shadow-sm">
                <span class="text-[10px] font-bold text-gray-500 uppercase mb-0.5">评分</span>
                <span class="text-2xl font-bold text-blue-600">{{ book.aiScore }}</span>
              </div>
              <p class="text-lg text-gray-500 leading-relaxed italic">"{{ book.aiSummary }}"</p>
            </div>
            <div class="text-gray-500 text-sm leading-loose whitespace-pre-wrap px-1">这位校友很详细地描述了书籍情况。经过系统核验，书籍情况属实。建议私聊获取更多细节。</div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
