<script setup>
import { RouterLink } from 'vue-router'
import { ShieldAlert, ShieldCheck } from 'lucide-vue-next'

defineProps({
  book: { type: Object, required: true }
})
</script>

<template>
  <section class="google-card p-6 flex items-center justify-between !rounded-[24px] !shadow-none !border-gray-100">
    <div class="flex items-center gap-5 min-w-0">
      <div class="w-14 h-14 rounded-full overflow-hidden border border-gray-100 shrink-0">
        <img :src="book.sellerAvatar || book.sellerProfile?.avatar || '/user_avatar.png'" alt="seller" class="w-full h-full object-cover" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-800 truncate">{{ book.seller }}</span>
          <ShieldCheck v-if="book.sellerProfile?.zjuAuthenticated" class="w-4 h-4 text-blue-600 shrink-0" />
          <ShieldAlert v-else class="w-4 h-4 text-amber-500 shrink-0" />
        </div>
        <p class="text-xs text-gray-500 mt-1 font-medium truncate">
          {{ book.sellerProfile?.zjuAuthenticated ? `${book.sellerProfile?.studentId || '已认证'} · ${book.sellerProfile?.major || book.sellerProfile?.college || '浙大身份'}` : '未认证浙大身份' }}
        </p>
      </div>
    </div>
    <RouterLink :to="`/profile/${book.sellerId || book.seller || 'me'}`" class="m3-btn-filled !px-5 !py-2 !text-xs shrink-0">查看主页</RouterLink>
  </section>
</template>
