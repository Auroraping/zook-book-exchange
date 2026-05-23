<script setup>
const props = defineProps({
  chats: { type: Array, required: true },
  activeChatId: { type: [Number, String], required: true }
})
const emit = defineEmits(['select'])
</script>

<template>
  <div class="w-[340px] bg-gray-50/50 border-r border-gray-100 flex flex-col">
    <div class="p-6 border-b border-gray-100">
      <h2 class="font-black text-gray-900">即时通讯</h2>
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">私信会话</p>
    </div>
    <div class="flex-1 overflow-y-auto">
      <button
        v-for="chat in chats"
        :key="chat.id"
        @click="emit('select', chat)"
        :class="['w-full text-left px-5 py-4 cursor-pointer transition-all flex gap-4 items-center border-b border-gray-100/70', activeChatId === chat.id ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50']"
      >
        <div class="relative shrink-0">
          <img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`" class="w-12 h-12 rounded-full border border-gray-100 bg-white" />
          <span v-if="chat.unread > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">{{ chat.unread }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-1">
            <h4 class="font-medium text-gray-800 text-sm truncate">{{ chat.name }}</h4>
            <span class="text-[10px] text-gray-400">{{ chat.time }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
