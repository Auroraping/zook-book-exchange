<script setup>
import { ref, onMounted, computed } from 'vue'
import CartEmpty from '../components/CartEmpty.vue'
import CartItemList from '../components/CartItemList.vue'
import CartSuccess from '../components/CartSuccess.vue'
import CartSummary from '../components/CartSummary.vue'
import { deleteJson, getJson, postJson } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const cartItems = ref([])
const isSuccess = ref(false)
const { accountId } = useCurrentAccount()

onMounted(async () => {
  const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
  let data = await getJson(`/api/cart?userId=${accountId.value}`)
  if (data.bookIds.length === 0 && savedCart.length > 0) {
    await Promise.all(savedCart.map((bookId) => postJson('/api/cart', { userId: accountId.value, bookId })))
    data = await getJson(`/api/cart?userId=${accountId.value}`)
  }
  cartItems.value = data.items
  localStorage.setItem('cart', JSON.stringify(data.bookIds))
})

const removeFromCart = async (id) => {
  const data = await deleteJson(`/api/cart/${id}?userId=${accountId.value}`)
  cartItems.value = cartItems.value.filter((item) => item.id !== id)
  localStorage.setItem('cart', JSON.stringify(data.bookIds))
  window.dispatchEvent(new Event('cartUpdated'))
}

const totalPrice = computed(() => cartItems.value.reduce((sum, item) => sum + item.price, 0))

const submitOrder = async () => {
  await postJson('/api/cart/checkout', { userId: accountId.value })
  isSuccess.value = true
  cartItems.value = []
  localStorage.setItem('cart', '[]')
  window.dispatchEvent(new Event('cartUpdated'))
}
</script>

<template>
  <CartSuccess v-if="isSuccess" />
  <div v-else class="max-w-6xl mx-auto py-12 animate-google-in">
    <div class="flex items-baseline gap-4 mb-12">
      <h1 class="text-5xl font-normal text-gray-900 tracking-tight">购书清单</h1>
      <span class="text-xl text-gray-400 font-normal">{{ cartItems.length }} 件</span>
    </div>
    <div v-if="cartItems.length > 0" class="grid grid-cols-12 gap-12">
      <CartItemList :items="cartItems" @remove="removeFromCart" />
      <CartSummary :total-price="totalPrice" @submit="submitOrder" />
    </div>
    <CartEmpty v-else />
  </div>
</template>
