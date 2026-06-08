<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Star } from 'lucide-vue-next'
import { postJson } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const props = defineProps({
  book: { type: Object, required: true },
  favoriteIds: { type: Array, default: () => [] }
})
const emit = defineEmits(['favorite-changed'])

const isBookmarked = ref(false)
const { accountId } = useCurrentAccount()
const price = computed(() => Number(props.book.price || 0).toFixed(2))

watch(
  () => [props.favoriteIds, props.book.id],
  () => {
    isBookmarked.value = props.favoriteIds.includes(props.book.id)
  },
  { immediate: true }
)

const toggleBookmark = async () => {
  const data = await postJson('/api/favorites/toggle', { userId: accountId.value, bookId: props.book.id })
  isBookmarked.value = data.favorited
  emit('favorite-changed', data.bookIds || [])
}
</script>

<template>
  <RouterLink :to="`/book/${book.id}`" class="group">
    <div class="premium-card !p-0 overflow-hidden !rounded-[40px] h-full flex flex-col">
      <div class="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img :src="book.cover" :alt="book.title" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        <div class="absolute top-6 left-6">
          <span class="px-4 py-1.5 bg-white/90 backdrop-blur text-[10px] font-black text-gray-900 rounded-full shadow-lg border border-white/50">{{ book.condition }}</span>
        </div>
        <button type="button" @click.prevent.stop="toggleBookmark" :class="['absolute top-6 right-6 p-2 rounded-full backdrop-blur-md transition-all', isBookmarked ? 'bg-white text-amber-500 opacity-100' : 'bg-white/20 text-white opacity-0 group-hover:opacity-100']" title="收藏">
          <Star :class="['w-5 h-5', isBookmarked ? 'fill-current' : '']" />
        </button>
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      <div class="p-8 flex-1 flex flex-col">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{{ book.title }}</h3>
          <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">{{ book.campus }} · {{ book.author }}</p>
        </div>
        <div class="flex justify-between items-end border-t border-gray-50 pt-6 mt-auto">
          <div>
            <p class="text-[10px] text-gray-400 font-black uppercase mb-1">转让价</p>
            <span class="text-3xl font-black text-gray-900">¥{{ price }}</span>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl shadow-blue-500/40">
            <ChevronRight class="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
