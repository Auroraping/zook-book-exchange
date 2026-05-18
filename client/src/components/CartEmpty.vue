<script setup>
import { RouterLink } from 'vue-router'
import { ShoppingBag } from 'lucide-vue-next'
</script>

<template>
  <div class="py-32 flex flex-col items-center justify-center text-center">
    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-8">
      <ShoppingBag class="w-12 h-12" />
    </div>
    <h2 class="text-3xl font-normal text-gray-900 mb-4">您的清单目前为空</h2>
    <p class="text-gray-500 mb-12 max-w-sm text-lg">去发现更多由校友分享的优质学术资源。</p>
    <RouterLink to="/books" class="m3-btn-filled !px-10">开始探索</RouterLink>
  </div>
</template>
