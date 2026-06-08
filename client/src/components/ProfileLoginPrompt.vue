<script setup>
import { RouterLink } from 'vue-router'
import { Lock } from 'lucide-vue-next'
</script>

<template>
  <div class="max-w-[1000px] mx-auto py-12 flex flex-col items-center justify-center text-center">
    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
      <Lock class="w-12 h-12" />
    </div>
    <h2 class="text-2xl font-black text-gray-800 mb-2">欢迎来到求书个人中心</h2>
    <p class="text-gray-500 mb-8 max-w-md">登录后即可查看您的买卖订单、学期省钱指数以及收藏书籍。</p>
    <RouterLink to="/login" class="bg-blue-600 text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all hover:-translate-y-1">立即极速登录</RouterLink>
  </div>
</template>
