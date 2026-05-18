<script setup>
import { RouterLink } from 'vue-router'
import { CheckCircle2 } from 'lucide-vue-next'
</script>

<template>
  <div class="max-w-2xl mx-auto py-32 text-center animate-google-in">
    <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
      <CheckCircle2 class="w-12 h-12" />
    </div>
    <h1 class="text-4xl font-normal text-gray-900 mb-4">订单已极速同步</h1>
    <p class="text-gray-500 mb-12 text-lg">系统已通知卖家，请在"消息"中查看后续交付约定。</p>
    <RouterLink to="/books" class="m3-btn-filled !px-12">继续探索</RouterLink>
  </div>
</template>
