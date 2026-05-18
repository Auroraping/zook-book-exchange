<script setup>
import { Bot, Search, Send } from 'lucide-vue-next'

const props = defineProps({
  messages: { type: Array, required: true },
  quickPrompts: { type: Array, required: true },
  draft: { type: String, required: true },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['ask', 'update:draft'])
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
    <div class="h-20 px-7 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bot class="w-6 h-6" /></div>
        <div><h2 class="font-black text-gray-900">桃酥对话</h2><p class="text-xs font-bold text-gray-400">教材必要性判断 · 课表推荐</p></div>
      </div>
    </div>
    <div class="flex-1 bg-gray-50/50 p-7 overflow-y-auto">
      <div class="flex flex-col gap-5">
        <div v-for="msg in messages" :key="msg.id" :class="['flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          <img v-if="msg.role !== 'user'" src="/taosu.png" alt="桃酥" class="w-10 h-10 rounded-2xl bg-white object-contain border border-orange-100 shadow-sm" />
          <div :class="['max-w-[78%] rounded-[24px] px-5 py-4 shadow-sm text-sm leading-relaxed', msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-md']">{{ msg.content }}</div>
        </div>
        <div v-if="loading" class="flex items-start gap-3 justify-start">
          <img src="/taosu.png" alt="桃酥" class="w-10 h-10 rounded-2xl bg-white object-contain border border-orange-100 shadow-sm" />
          <div class="bg-white text-gray-500 border border-gray-100 rounded-[24px] rounded-tl-md px-5 py-4 shadow-sm text-sm">桃酥正在思考...</div>
        </div>
      </div>
    </div>
    <div class="p-6 border-t border-gray-100 bg-white">
      <div class="flex flex-wrap gap-2 mb-4">
        <button v-for="prompt in quickPrompts" :key="prompt.label" @click="emit('ask', prompt.question)" class="px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-xs font-black text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all">{{ prompt.label }}</button>
      </div>
      <form @submit.prevent="emit('ask', draft)" class="flex gap-3">
        <div class="flex-1 h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 flex items-center gap-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all">
          <Search class="w-5 h-5 text-gray-400" />
          <input :value="draft" @input="emit('update:draft', $event.target.value)" placeholder="问桃酥：这本教材要买吗？" class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" />
        </div>
        <button type="submit" :disabled="loading || !draft.trim()" class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"><Send class="w-5 h-5" /></button>
      </form>
    </div>
  </div>
</template>
