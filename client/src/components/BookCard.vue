<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Bookmark } from 'lucide-vue-next'
import { getJson, postJson } from '../composables/useApi.js'

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
})

const isBookmarked = ref(false)

onMounted(async () => {
  const data = await getJson('/api/favorites?userId=me').catch(() => ({ bookIds: [] }))
  isBookmarked.value = data.bookIds.includes(props.book.id)
})

const toggleBookmark = async () => {
  const data = await postJson('/api/favorites/toggle', { userId: 'me', bookId: props.book.id })
  isBookmarked.value = data.favorited
}
</script>

<template>
  <RouterLink :to="`/book/${book.id}`" custom v-slot="{ navigate }">
    <div class="premium-card !p-0 overflow-hidden !rounded-[40px] h-full flex flex-col group cursor-pointer" role="link" tabindex="0" @click="navigate" @keydown.enter="navigate">
      <div class="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img :src="book.cover" :alt="book.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        <div class="absolute top-6 left-6 flex flex-col gap-2">
          <span class="px-3 py-1 bg-white/90 backdrop-blur text-[10px] font-black text-gray-900 rounded-full shadow-sm">{{ book.condition }}</span>
          <span v-if="book.aiScore > 90" class="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg">高分推荐</span>
        </div>
        <button type="button" @click.stop="toggleBookmark" :class="['absolute top-6 right-6 p-2 backdrop-blur-md rounded-full transition-opacity', isBookmarked ? 'bg-white text-blue-600 opacity-100' : 'bg-white/20 text-white opacity-0 group-hover:opacity-100']" title="收藏">
          <Bookmark :class="['w-5 h-5', isBookmarked ? 'fill-current' : '']" />
        </button>
      </div>
      <div class="p-8">
        <h3 class="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-blue-600 transition-colors">{{ book.title }}</h3>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden">
            <img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`" alt="seller" />
          </div>
          <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">{{ book.campus }}</span>
        </div>
        <div class="flex justify-between items-end">
          <div>
            <p class="text-[10px] text-gray-400 font-black uppercase mb-1">价格</p>
            <span class="text-3xl font-black text-gray-900 tracking-tight">¥{{ book.price }}</span>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            <ArrowRight class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
