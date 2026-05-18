<script setup>
import { RouterLink } from 'vue-router'
import { BadgeCheck, ChevronRight, ShieldAlert } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, required: true },
  badge: { type: String, required: true },
  books: { type: Array, required: true },
  variant: { type: String, default: 'strong' }
})
</script>

<template>
  <div :class="['bg-white rounded-[32px] shadow-sm p-8', variant === 'strong' ? 'border border-emerald-100' : 'border border-orange-100']">
    <div class="flex items-center justify-between mb-7">
      <div class="flex items-center gap-3">
        <BadgeCheck v-if="variant === 'strong'" class="w-6 h-6 text-emerald-600" />
        <ShieldAlert v-else class="w-6 h-6 text-orange-600" />
        <h2 class="text-2xl font-black text-gray-900">{{ title }}</h2>
      </div>
      <span :class="['px-3 py-1 rounded-full text-[10px] font-black', variant === 'strong' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600']">{{ badge }}</span>
    </div>
    <div class="flex flex-col gap-4">
      <RouterLink v-for="book in books" :key="book.id" :to="`/book/${book.id}`" class="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
        <img :src="book.cover" :alt="book.title" class="w-14 h-20 object-cover rounded-xl border border-gray-100" />
        <div class="flex-1 min-w-0">
          <h3 class="font-black text-gray-900 truncate group-hover:text-blue-600">{{ book.title }}</h3>
          <p class="text-xs text-gray-500 mt-2 line-clamp-2">{{ book.aiSummary }}</p>
          <p class="mt-3 text-[10px] font-black text-blue-600">{{ variant === 'strong' ? '查看全部在售' : '依然前去查看' }} ({{ book.aiScore }}分)</p>
        </div>
        <ChevronRight class="w-5 h-5 text-gray-300 self-center group-hover:text-blue-600" />
      </RouterLink>
    </div>
  </div>
</template>
