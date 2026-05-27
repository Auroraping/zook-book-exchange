<script setup>
import { RouterLink } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'

const props = defineProps({
  book: { type: Object, required: true }
})
</script>

<template>
  <section class="google-card p-6 flex items-center justify-between !rounded-[24px] !shadow-none !border-gray-100">
    <div class="flex items-center gap-5">
      <div class="w-14 h-14 rounded-full overflow-hidden border border-gray-100">
        <img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`" alt="seller" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-800">{{ book.seller }}</span>
          <ShieldCheck class="w-4 h-4 text-blue-600" />
        </div>
        <p class="text-xs text-gray-500 mt-1 font-medium">浙大统一身份认证 · 信用优秀</p>
      </div>
    </div>
    <RouterLink :to="`/profile/${book.sellerId || book.seller || 'me'}`" class="m3-btn-filled !px-5 !py-2 !text-xs">查看主页</RouterLink>
  </section>
</template>
