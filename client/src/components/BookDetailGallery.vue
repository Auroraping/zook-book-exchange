<script setup>
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp, Star } from 'lucide-vue-next'

const props = defineProps({
  book: { type: Object, required: true }
})

const expanded = ref(false)
const images = computed(() => {
  const list = props.book.images?.length ? props.book.images : [props.book.cover]
  return list.filter(Boolean)
})
const visibleImages = computed(() => expanded.value ? images.value : images.value.slice(0, 1))
</script>

<template>
  <div class="md:col-span-5">
    <div class="google-card overflow-hidden !rounded-[32px] sticky top-24">
      <div class="flex flex-col bg-gray-100">
        <img
          v-for="(image, index) in visibleImages"
          :key="image"
          :src="image"
          loading="lazy"
          decoding="async"
          class="w-full aspect-[4/5] object-cover border-b border-gray-100 last:border-b-0"
          :alt="`${book.title} ${index + 1}`"
        />
      </div>
      <button
        v-if="images.length > 1"
        type="button"
        @click="expanded = !expanded"
        class="w-full h-12 bg-white border-t border-gray-100 text-sm font-black text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
      >
        <ChevronUp v-if="expanded" class="w-4 h-4" />
        <ChevronDown v-else class="w-4 h-4" />
        {{ expanded ? '收起图片' : `展开 ${images.length} 张图片` }}
      </button>
      <div class="p-8 bg-gray-50 flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">推荐指数</span>
          <div class="flex items-center gap-0.5 text-yellow-500">
            <Star v-for="i in 5" :key="i" class="w-4 h-4 fill-current" />
          </div>
        </div>
        <div class="h-10 w-[1px] bg-gray-200"></div>
        <div class="text-right">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">图片来源</span>
          <p class="text-sm font-medium text-gray-800">卖家实拍</p>
        </div>
      </div>
    </div>
  </div>
</template>
