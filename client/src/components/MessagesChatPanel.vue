<script setup>
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'

const props = defineProps({
  books: { type: Array, required: true },
  activeChat: { type: Object, default: null },
  messages: { type: Array, required: true }
})
const emit = defineEmits(['send'])
const draft = ref('')

const send = () => {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  emit('send', text)
}
</script>

<template>
  <template v-if="activeChat">
    <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
      <div v-if="books.length > 0 && activeChat.bookIdx !== undefined" class="bg-white google-card !p-4 flex gap-4 w-full max-w-md mx-auto mb-4 border-gray-100 !rounded-2xl"><img :src="books[activeChat.bookIdx]?.cover" class="w-14 h-20 object-cover rounded-lg shadow-sm" /><div class="flex-1 min-w-0"><h5 class="font-medium text-sm text-gray-800 truncate mb-1">{{ books[activeChat.bookIdx]?.title }}</h5><div class="text-[11px] text-gray-400 mb-3 italic">正在沟通这本书</div><div class="flex justify-between items-center"><span class="text-red-500 font-medium text-lg">¥{{ books[activeChat.bookIdx]?.price }}</span></div></div></div>
      <template v-for="message in messages" :key="message.id">
        <div v-if="message.role === 'other'" class="flex items-start gap-4 max-w-[85%]"><img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat.name}`" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm" /><div class="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">{{ message.content }}</div></div>
        <div v-else class="flex items-start justify-end gap-4 max-w-[85%] self-end"><div class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed">{{ message.content }}</div><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white" /></div>
      </template>
    </div>
    <div class="p-6 bg-white border-t border-gray-50 flex gap-4"><textarea v-model="draft" class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-24" placeholder="发送消息..." @keydown.enter.exact.prevent="send"></textarea><button @click="send" class="w-14 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:shadow-lg transition-all active:scale-95"><Send class="w-6 h-6" /></button></div>
  </template>
</template>
