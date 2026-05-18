<script setup>
import { ref, onMounted, computed } from 'vue'
import CartEmpty from '../components/CartEmpty.vue'
import CartItemList from '../components/CartItemList.vue'
import CartSuccess from '../components/CartSuccess.vue'
import CartSummary from '../components/CartSummary.vue'

const cartItems = ref([])
const isSuccess = ref(false)

onMounted(async () => {
  const res = await fetch('/data/books.json')
  const allBooks = await res.json()
  const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
  cartItems.value = savedCart.map((id) => allBooks.find((b) => b.id === id)).filter(Boolean)
})

const removeFromCart = (id) => {
  cartItems.value = cartItems.value.filter((item) => item.id !== id)
  localStorage.setItem('cart', JSON.stringify(cartItems.value.map((i) => i.id)))
  window.dispatchEvent(new Event('cartUpdated'))
}

const totalPrice = computed(() => cartItems.value.reduce((sum, item) => sum + item.price, 0))

const submitOrder = () => {
  isSuccess.value = true
  localStorage.setItem('cart', '[]')
  window.dispatchEvent(new Event('cartUpdated'))
}
</script>

<template>
  <CartSuccess v-if="isSuccess" />
  <div v-else class="max-w-6xl mx-auto py-12 animate-google-in">
    <div class="flex items-baseline gap-4 mb-12">
      <h1 class="text-5xl font-normal text-gray-900 tracking-tight">购书清单</h1>
      <span class="text-xl text-gray-400 font-normal">{{ cartItems.length }} 个项目</span>
    </div>
    <div v-if="cartItems.length > 0" class="grid grid-cols-12 gap-12">
      <CartItemList :items="cartItems" @remove="removeFromCart" />
      <CartSummary :total-price="totalPrice" @submit="submitOrder" />
    </div>
    <CartEmpty v-else />
  </div>
</template>
