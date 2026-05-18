<script setup>
import { Star } from 'lucide-vue-next'

const props = defineProps({
  book: { type: Object, required: true },
  stockCount: { type: Number, required: true }
})
</script>

<template>
  <div class="md:col-span-5">
    <div class="google-card overflow-hidden !rounded-[32px] sticky top-24">
      <img :src="book.cover" class="w-full aspect-[4/5] object-cover" :alt="book.title" />
      <div class="p-8 bg-gray-50 flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">推荐指数</span>
          <div class="flex items-center gap-0.5 text-yellow-500">
            <Star v-for="i in 5" :key="i" class="w-4 h-4 fill-current" />
          </div>
        </div>
        <div class="h-10 w-[1px] bg-gray-200"></div>
        <div class="text-right">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">库存状态</span>
          <p class="text-sm font-medium text-gray-800">仅剩 {{ stockCount }} 本</p>
        </div>
      </div>
    </div>
  </div>
</template>
