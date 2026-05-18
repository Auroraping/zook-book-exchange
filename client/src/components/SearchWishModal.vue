<script setup>
import { Search as SearchIcon } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, required: true }
})
const emit = defineEmits(['close'])
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-8">
    <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" @click="emit('close')"></div>
    <div class="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-16 animate-google-in border border-white/20">
      <h2 class="text-4xl font-black text-gray-900 mb-4 tracking-tighter">MAKE A WISH</h2>
      <p class="text-lg text-gray-500 mb-12 font-medium">我们将为您在全校范围内实时监控每一个知识的脉动。</p>
      <div class="space-y-8">
        <div>
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Book Title</label>
          <div class="h-16 bg-gray-50 rounded-[20px] px-8 flex items-center gap-4 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 transition-all border border-transparent">
            <SearchIcon class="w-6 h-6 text-gray-400" />
            <input type="text" class="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-gray-900" placeholder="书名、作者、ISBN..." />
          </div>
        </div>
        <button @click="emit('close')" class="w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] transition-transform active:scale-95">Submit Wish</button>
      </div>
    </div>
  </div>
</template>
