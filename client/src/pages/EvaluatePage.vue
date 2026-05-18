<script setup>
import { Star, CheckCircle2 } from 'lucide-vue-next'
import { ref } from 'vue'

const rating = ref(5)
const submitted = ref(false)
</script>

<template>
  <div class="max-w-xl mx-auto py-20 text-center animate-google-in">
    <div v-if="submitted">
      <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 class="w-12 h-12" /></div>
      <h1 class="text-3xl font-black text-gray-900 mb-4">评价已提交</h1>
      <p class="text-gray-500 mb-8">感谢您的反馈，您已获得 +20 积分。</p>
      <button @click="$router.push('/orders')" class="m3-btn-filled !px-10">返回订单</button>
    </div>
    <div v-else>
      <h1 class="text-3xl font-black text-gray-900 mb-4">评价交易体验</h1>
      <p class="text-gray-500 mb-12">为本次交易打分，帮助校友们做出更好的选择。</p>
      <div class="flex justify-center gap-2 mb-12">
        <button v-for="i in 5" :key="i" @click="rating = i" class="p-2 hover:scale-125 transition-transform"><Star :class="['w-10 h-10', i <= rating ? 'text-yellow-500 fill-current' : 'text-gray-200']" /></button>
      </div>
      <textarea class="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-32 mb-8" placeholder="留下一些交易感想..."></textarea>
      <button @click="submitted = true" class="m3-btn-filled !px-12">提交评价</button>
    </div>
  </div>
</template>
