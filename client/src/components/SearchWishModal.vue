<script setup>
import { ref } from 'vue'
import { Search as SearchIcon } from 'lucide-vue-next'
import { postJson } from '../composables/useApi.js'

const props = defineProps({
  show: { type: Boolean, required: true }
})
const emit = defineEmits(['close'])
const title = ref('')
const author = ref('')
const priceRange = ref('')
const submitting = ref(false)

const submitWish = async () => {
  if (!title.value.trim() || submitting.value) return
  submitting.value = true
  await postJson('/api/wishes', { userId: 'me', title: title.value, author: author.value, priceRange: priceRange.value })
  title.value = ''
  author.value = ''
  priceRange.value = ''
  submitting.value = false
  emit('close')
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-8">
    <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" @click="emit('close')"></div>
    <div class="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-16 animate-google-in border border-white/20">
      <h2 class="text-4xl font-black text-gray-900 mb-4 tracking-tighter">登记求购心愿</h2>
      <p class="text-lg text-gray-500 mb-12 font-medium">提交想买的书，匹配书籍审核通过后会收到通知。</p>
      <div class="space-y-8">
        <div>
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">书名</label>
          <div class="h-16 bg-gray-50 rounded-[20px] px-8 flex items-center gap-4 focus-within:bg-white focus-within:ring-4 focus:ring-blue-100 transition-all border border-transparent">
            <SearchIcon class="w-6 h-6 text-gray-400" />
            <input v-model="title" type="text" class="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-gray-900" placeholder="书名或 ISBN" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4"><input v-model="author" type="text" placeholder="作者" class="h-14 bg-gray-50 rounded-2xl px-5 text-sm font-bold text-gray-900 border-none" /><input v-model="priceRange" type="text" placeholder="预算 20-40" class="h-14 bg-gray-50 rounded-2xl px-5 text-sm font-bold text-gray-900 border-none" /></div>
        <button @click="submitWish" :disabled="!title.trim() || submitting" class="w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50">{{ submitting ? '提交中' : '提交心愿' }}</button>
      </div>
    </div>
  </div>
</template>
