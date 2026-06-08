<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageSquare, ShoppingBag } from 'lucide-vue-next'

const props = defineProps({
  book: { type: Object, required: true }
})
const emit = defineEmits(['addToCart'])
const isAvailable = computed(() => props.book.status === 'approved')
</script>

<template>
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
      <button @click="emit('addToCart')" :disabled="!isAvailable" :class="['flex-[2] m3-btn-filled !rounded-[24px] !py-5 flex items-center justify-center gap-3 text-lg', !isAvailable ? 'opacity-50 cursor-not-allowed' : '']">
        <ShoppingBag class="w-6 h-6" /> {{ isAvailable ? '加入购书清单' : '暂不可购买' }}
      </button>
      <RouterLink :to="`/messages?contactId=${encodeURIComponent(book.sellerId || 'me')}&contactName=${encodeURIComponent(book.seller || '浙大同学')}&bookId=${encodeURIComponent(book.id)}&bookTitle=${encodeURIComponent(book.title)}`" class="flex-1 bg-white border border-gray-200 text-gray-800 !rounded-[24px] flex items-center justify-center gap-3 text-lg hover:bg-gray-50 rounded-3xl py-5">
        <MessageSquare class="w-6 h-6" /> 聊一聊
      </RouterLink>
    </div>
  </section>
</template>
