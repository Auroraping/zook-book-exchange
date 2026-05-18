<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, Heart, Share2 } from 'lucide-vue-next'
import BookAiSuggestion from '../components/BookAiSuggestion.vue'
import BookDetailGallery from '../components/BookDetailGallery.vue'
import BookPurchaseInfo from '../components/BookPurchaseInfo.vue'
import BookSellerSummary from '../components/BookSellerSummary.vue'

const route = useRoute()
const book = ref(null)
const isFavorited = ref(false)
const stockCount = ref(1)

onMounted(async () => {
  const res = await fetch('/data/books.json')
  const books = await res.json()
  book.value = books.find((b) => b.id === route.params.id) || books[0]
  stockCount.value = (book.value.id.charCodeAt(book.value.id.length - 1) % 5) + 1
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
      <BookDetailGallery :book="book" :stock-count="stockCount" />
      <div class="md:col-span-7 flex flex-col gap-12">
        <BookPurchaseInfo :book="book" @add-to-cart="addToCart" />
        <hr class="border-gray-100" />
        <BookSellerSummary :book="book" />
        <BookAiSuggestion :book="book" />
      </div>
    </div>
  </div>
</template>
