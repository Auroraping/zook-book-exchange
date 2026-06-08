<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageSquare, Star } from 'lucide-vue-next'

const props = defineProps({
  book: { type: Object, required: true },
  isFavorited: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle-favorite'])

const isAvailable = computed(() => props.book.status === 'approved')
const price = computed(() => Number(props.book.price || 0).toFixed(2))
const originalPrice = computed(() => Number(props.book.originalPrice || 0))
const chatLink = computed(() => {
  const sellerId = props.book.sellerId || 'me'
  const seller = props.book.seller || '浙大同学'
  return `/messages?contactId=${encodeURIComponent(sellerId)}&contactName=${encodeURIComponent(seller)}&bookId=${encodeURIComponent(props.book.id)}&bookTitle=${encodeURIComponent(props.book.title)}`
})
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
      <span class="text-6xl font-medium text-gray-900">¥{{ price }}</span>
      <span v-if="originalPrice > 0" class="text-xl text-gray-400 line-through">原价 ¥{{ originalPrice.toFixed(2) }}</span>
    </div>
    <div class="flex gap-4">
      <RouterLink
        v-if="isAvailable"
        :to="chatLink"
        class="m3-btn-filled !rounded-[24px] !py-5 flex-1 flex items-center justify-center gap-3 text-lg"
      >
        <MessageSquare class="w-6 h-6" /> 聊一聊
      </RouterLink>
      <button v-else disabled class="m3-btn-filled !rounded-[24px] !py-5 flex-1 flex items-center justify-center gap-3 text-lg opacity-50 cursor-not-allowed">
        <MessageSquare class="w-6 h-6" /> 暂不可聊
      </button>
      <button
        type="button"
        @click="emit('toggle-favorite')"
        :class="['w-20 rounded-[24px] border flex items-center justify-center transition-all active:scale-95', isFavorited ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-white text-gray-400 border-gray-100 hover:text-amber-500 hover:border-amber-200']"
        title="收藏"
      >
        <Star :class="['w-7 h-7', isFavorited ? 'fill-current' : '']" />
      </button>
    </div>
  </section>
</template>
