<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, Star, Trash2 } from 'lucide-vue-next'
import { getJson, postJson } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const favoriteBooks = ref([])
const favoriteIds = ref([])
const keyword = ref('')
const loading = ref(true)
const { accountId } = useCurrentAccount()

const fetchFavorites = async () => {
  loading.value = true
  try {
    const data = await getJson(`/api/favorites?userId=${accountId.value}`)
    favoriteBooks.value = data.items || []
    favoriteIds.value = data.bookIds || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchFavorites)

const filteredBooks = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return favoriteBooks.value
  return favoriteBooks.value.filter((book) => {
    const text = `${book.title}${book.author}${book.seller}${book.courseName || ''}`.toLowerCase()
    return text.includes(q)
  })
})

const removeFavorite = async (book) => {
  if (!confirm(`确定将《${book.title}》移出收藏吗？`)) return
  const data = await postJson('/api/favorites/toggle', { userId: accountId.value, bookId: book.id })
  favoriteIds.value = data.bookIds || []
  favoriteBooks.value = favoriteBooks.value.filter((item) => item.id !== book.id)
}
</script>

<template>
  <div class="max-w-6xl mx-auto flex flex-col gap-8 animate-google-in">
    <section class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <div class="inline-flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full text-[10px] font-black mb-4">
          <Star class="w-3.5 h-3.5 fill-current" /> 我的收藏
        </div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">全部收藏书籍</h1>
        <p class="text-sm text-gray-500 mt-3 font-bold">共收藏 {{ favoriteBooks.length }} 本书籍</p>
      </div>
      <div class="w-full md:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 h-12 flex items-center gap-3">
        <Search class="w-4 h-4 text-gray-400" />
        <input v-model="keyword" type="text" placeholder="搜索收藏书名、作者或卖家" class="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400" />
      </div>
    </section>

    <section v-if="loading" class="py-24 text-center text-sm font-bold text-gray-400">正在加载收藏...</section>

    <section v-else-if="filteredBooks.length > 0" class="grid grid-cols-1 gap-4">
      <article v-for="book in filteredBooks" :key="book.id" class="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-amber-100 transition-all flex gap-5 items-center">
        <RouterLink :to="`/book/${book.id}`" class="w-24 h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
          <img :src="book.cover" :alt="book.title" loading="lazy" decoding="async" class="w-full h-full object-cover" />
        </RouterLink>
        <RouterLink :to="`/book/${book.id}`" class="flex-1 min-w-0 group">
          <div class="flex items-center gap-2 mb-2">
            <Star class="w-4 h-4 text-amber-500 fill-current shrink-0" />
            <span class="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">已收藏</span>
          </div>
          <h2 class="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">{{ book.title }}</h2>
          <p class="text-xs text-gray-400 font-bold mt-2 truncate">作者：{{ book.author || '待补充' }} · 卖家：{{ book.seller || '浙大同学' }}</p>
          <p class="text-xs text-gray-400 font-bold mt-1 truncate">{{ book.campus || '校内交易' }}</p>
        </RouterLink>
        <div class="shrink-0 flex flex-col items-end gap-5">
          <span class="text-2xl font-black text-gray-900">¥{{ Number(book.price || 0).toFixed(2) }}</span>
          <button @click="removeFavorite(book)" class="w-11 h-11 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center" title="移出收藏">
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </article>
    </section>

    <section v-else class="py-24 text-center bg-white border border-gray-100 rounded-3xl">
      <Star class="w-16 h-16 text-amber-100 mx-auto mb-4" />
      <p class="text-gray-400 font-black">{{ keyword.trim() ? '没有匹配的收藏书籍' : '暂无收藏书籍' }}</p>
      <RouterLink to="/books" class="inline-flex mt-5 px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-black">去逛广场</RouterLink>
    </section>
  </div>
</template>
