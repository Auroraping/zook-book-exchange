<script setup>
import { RouterLink } from 'vue-router'
import { BookOpen, MessageSquare } from 'lucide-vue-next'

defineProps({
  books: { type: Array, required: true }
})

const chatLink = (book) => {
  const sellerId = book.sellerId || 'me'
  const seller = book.seller || '浙大同学'
  return `/messages?contactId=${encodeURIComponent(sellerId)}&contactName=${encodeURIComponent(seller)}&bookId=${encodeURIComponent(book.id)}&bookTitle=${encodeURIComponent(book.title)}`
}
</script>

<template>
  <div v-if="books.length > 0">
    <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">匹配到 {{ books.length }} 本同学上架书籍</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="book in books" :key="book.id" class="flex gap-5 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
        <RouterLink :to="`/book/${book.id}`" class="shrink-0">
          <img :src="book.cover" :alt="book.title" loading="lazy" decoding="async" class="w-20 h-28 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
        </RouterLink>
        <div class="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <RouterLink :to="`/book/${book.id}`" class="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 block">{{ book.title }}</RouterLink>
            <p class="text-xs text-gray-400 mt-1">{{ book.author }} · {{ book.condition }}</p>
          </div>
          <div class="flex items-end justify-between mt-3">
            <div>
              <span class="text-2xl font-black text-gray-900">¥{{ Number(book.price || 0).toFixed(2) }}</span>
              <span v-if="Number(book.originalPrice || 0) > 0" class="text-sm text-gray-400 line-through ml-2">¥{{ Number(book.originalPrice || 0).toFixed(2) }}</span>
            </div>
            <RouterLink :to="chatLink(book)" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200">
              <MessageSquare class="w-4 h-4" /> 我想要
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-12 px-8 bg-slate-50/50 rounded-[28px] border-2 border-dashed border-slate-200/70">
    <div class="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
      <BookOpen class="w-6 h-6" />
    </div>
    <h5 class="text-sm font-extrabold text-gray-800">暂无匹配在售教材</h5>
    <p class="text-xs text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">可以发布求购心愿，或稍后再查看同学上架的书籍。</p>
  </div>
</template>
