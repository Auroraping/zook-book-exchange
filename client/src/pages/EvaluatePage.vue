<script setup>
import { Star, CheckCircle2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { postJson } from '../composables/useApi.js'

const route = useRoute()
const rating = ref(5)
const content = ref('')
const submitted = ref(false)

const submitReview = async () => {
  await postJson(`/api/orders/${route.params.id}/review`, { userId: 'me', rating: rating.value, content: content.value })
  submitted.value = true
}
</script>

<template>
  <div class="max-w-xl mx-auto py-20 text-center animate-google-in">
    <div v-if="submitted">
      <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 class="w-12 h-12" /></div>
      <h1 class="text-3xl font-black text-gray-900 mb-4">评价已提交</h1>
      <p class="text-gray-500 mb-8">感谢反馈，评价已经保存到 JSON。</p>
      <button @click="$router.push('/orders')" class="m3-btn-filled !px-10">返回订单</button>
    </div>
    <div v-else>
      <h1 class="text-3xl font-black text-gray-900 mb-4">评价本次交易</h1><p class="text-gray-500 mb-12">为这次教材流转打分，帮助后续同学判断交易体验。</p>
      <div class="flex justify-center gap-2 mb-12"><button v-for="i in 5" :key="i" @click="rating = i" class="p-2 hover:scale-125 transition-transform"><Star :class="['w-10 h-10', i <= rating ? 'text-yellow-500 fill-current' : 'text-gray-200']" /></button></div>
      <textarea v-model="content" class="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-32 mb-8" placeholder="写下本次交易评价..."></textarea>
      <button @click="submitReview" class="m3-btn-filled !px-12">提交评价</button>
    </div>
  </div>
</template>
