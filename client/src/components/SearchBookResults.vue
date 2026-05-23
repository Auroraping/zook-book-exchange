<script setup>
import { BookOpen } from 'lucide-vue-next'
import BookListCard from './BookListCard.vue'

const props = defineProps({
  books: { type: Array, required: true },
  sortTabs: { type: Array, required: true },
  activeSort: { type: String, required: true }
})
const emit = defineEmits(['update:activeSort'])
</script>

<template>
  <div class="flex-1">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
      <div class="flex flex-wrap gap-3">
        <button v-for="tab in sortTabs" :key="tab" @click="emit('update:activeSort', tab)" :class="['px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all', activeSort === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white text-gray-400 hover:text-gray-800']">{{ tab }}</button>
      </div>
      <div class="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">找到 <span class="text-gray-900">{{ books.length }}</span> 本教材</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <BookListCard v-for="book in books" :key="book.id" :book="book" />
    </div>
    <div v-if="books.length === 0" class="py-40 text-center">
      <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <BookOpen class="w-12 h-12 text-gray-200" />
      </div>
      <h3 class="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">没有找到</h3>
      <p class="text-gray-400 font-medium text-lg">尝试调整您的过滤器，或者开启一个心愿单。</p>
    </div>
  </div>
</template>
