<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, Share2 } from 'lucide-vue-next'
import BookAiSuggestion from '../components/BookAiSuggestion.vue'
import BookDetailGallery from '../components/BookDetailGallery.vue'
import BookPurchaseInfo from '../components/BookPurchaseInfo.vue'
import BookSellerSummary from '../components/BookSellerSummary.vue'
import { getJson, postJson } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const route = useRoute()
const { accountId } = useCurrentAccount()
const book = ref(null)
const isFavorited = ref(false)

onMounted(async () => {
  const [bookData, favorites] = await Promise.all([
    getJson(`/api/books/${route.params.id}`),
    getJson(`/api/favorites?userId=${accountId.value}`).catch(() => ({ bookIds: [] }))
  ])
  book.value = bookData.book
  isFavorited.value = (favorites.bookIds || []).includes(route.params.id)
})

const toggleFavorite = async () => {
  const data = await postJson('/api/favorites/toggle', { userId: accountId.value, bookId: route.params.id })
  isFavorited.value = data.favorited
}

const shareBook = async () => {
  const shareData = { title: book.value.title, text: `浙里淘书：${book.value.title}`, url: window.location.href }
  if (navigator.share) return navigator.share(shareData)
  await navigator.clipboard?.writeText(window.location.href)
}
</script>

<template>
  <div v-if="book" class="max-w-6xl mx-auto animate-google-in pt-6">
    <div class="flex items-center justify-between mb-10">
      <RouterLink to="/books" class="p-3 hover:bg-gray-100 rounded-full transition-all"><ArrowLeft class="w-6 h-6 text-gray-500" /></RouterLink>
      <button @click="shareBook" class="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-500"><Share2 class="w-5 h-5" /></button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-16">
      <BookDetailGallery :book="book" />
      <div class="md:col-span-7 flex flex-col gap-12">
        <BookPurchaseInfo :book="book" :is-favorited="isFavorited" @toggle-favorite="toggleFavorite" />
        <hr class="border-gray-100" />
        <BookSellerSummary :book="book" />
        <BookAiSuggestion :book="book" />
      </div>
    </div>
  </div>
</template>
