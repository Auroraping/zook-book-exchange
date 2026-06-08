<script setup>
import { BookOpen, ArrowUp, ArrowDown } from 'lucide-vue-next'
import BookListCard from './BookListCard.vue'

const props = defineProps({
  books: { type: Array, required: true },
  sortTabs: { type: Array, required: true },
  activeSort: { type: String, required: true },
  sortOrder: { type: String, required: true },
  favoriteIds: { type: Array, default: () => [] }
})
const emit = defineEmits(['sort-change', 'favorite-changed'])
</script>

<template>
  <div class="flex-1">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
      <div class="flex flex-wrap gap-3">
        <button 
          v-for="tab in sortTabs" 
          :key="tab" 
          @click="emit('sort-change', tab)" 
          :class="[
            'px-7 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95', 
            activeSort === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white text-gray-400 hover:text-gray-800'
          ]"
        >
          <span>{{ tab }}</span>
          <span v-if="activeSort === tab" class="animate-google-in flex items-center shrink-0">
            <ArrowUp v-slot="icon" v-if="sortOrder === 'asc'" class="w-3.5 h-3.5" />
            <ArrowDown v-slot="icon" v-else class="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
      <div class="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">找到 <span class="text-gray-900">{{ books.length }}</span> 本教材</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <BookListCard v-for="book in books" :key="book.id" :book="book" :favorite-ids="favoriteIds" @favorite-changed="emit('favorite-changed', $event)" />
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
