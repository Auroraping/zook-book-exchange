<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Send } from 'lucide-vue-next'
import ChatContactList from '../components/ChatContactList.vue'
import ChatWindowHeader from '../components/ChatWindowHeader.vue'
import { getJson, postJson } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'
import { getStored } from '../composables/useSessionStore.js'

const route = useRoute()
const { user } = useAuth()
const books = ref([])
const activeChatId = ref(1)
const draft = ref('')
const messagesEnd = ref(null)
const chats = ref([])
const chatMessages = ref({})
const activeChat = ref(null)

const currentAccountId = () => {
  return user.value?.realId || getStored('zook_user_uuid') || 'me'
}

onMounted(async () => {
  const currentUserId = currentAccountId()
  const [booksData, chatData] = await Promise.all([getJson('/api/books?status=approved'), getJson(`/api/chats?userId=${currentUserId}`)])
  books.value = booksData.books
  chats.value = chatData.contacts || []
  chatMessages.value = chatData.messages || {}
  
  const targetId = route.query.activeId
  if (targetId) {
    activeChat.value = chats.value.find((c) => String(c.id) === String(targetId)) || chats.value[0] || null
    activeChatId.value = activeChat.value?.id || ''
  } else {
    activeChat.value = chats.value[0] || null
    activeChatId.value = activeChat.value?.id || ''
  }
  if (activeChat.value && activeChat.value.unread > 0) {
    activeChat.value.unread = 0
    postJson(`/api/chats/${activeChat.value.id}/read`, { userId: currentUserId }).catch(() => {})
    window.dispatchEvent(new Event('notificationsUpdated'))
  }
  scrollToBottom()
})

const selectChat = (chat) => {
  activeChatId.value = chat.id
  activeChat.value = chat
  if (chat.unread > 0) {
    chat.unread = 0
    postJson(`/api/chats/${chat.id}/read`, { userId: currentAccountId() }).catch(() => {})
    window.dispatchEvent(new Event('notificationsUpdated'))
  }
  scrollToBottom()
}

const scrollToBottom = () => nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' }))

const sendMessage = async () => {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  if (!chatMessages.value[activeChatId.value]) chatMessages.value[activeChatId.value] = []
  const data = await postJson(`/api/chats/${activeChatId.value}/messages`, { text, userId: currentAccountId() })
  chatMessages.value[activeChatId.value].push(...[data.message, data.reply].filter(Boolean))
  scrollToBottom()
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
    <ChatContactList :chats="chats" :active-chat-id="activeChatId" @select="selectChat" />
    <div class="flex-1 flex flex-col bg-white">
      <ChatWindowHeader :name="activeChat?.name" />
      <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
        <div v-if="books.length > 0 && activeChat?.bookIdx !== undefined" class="bg-white google-card !p-4 flex gap-4 w-full max-w-md mx-auto mb-4 border-gray-100 !rounded-2xl"><img :src="books[activeChat.bookIdx]?.cover" class="w-14 h-20 object-cover rounded-lg shadow-sm" /><div class="flex-1 min-w-0"><h5 class="font-medium text-sm text-gray-800 truncate mb-1">{{ books[activeChat.bookIdx]?.title }}</h5><span class="text-red-500 font-medium text-lg">¥{{ books[activeChat.bookIdx]?.price }}</span></div></div>
        <template v-for="msg in (chatMessages[activeChatId] || [])" :key="msg.id">
          <div v-if="msg.role === 'other'" class="flex items-start gap-4 max-w-[85%]"><img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat?.name}`" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm" /><div class="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">{{ msg.content }}</div></div>
          <div v-else class="flex items-start justify-end gap-4 max-w-[85%] self-end"><div class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed">{{ msg.content }}</div><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white" /></div>
        </template>
        <div ref="messagesEnd"></div>
      </div>
      <div class="p-6 bg-white border-t border-gray-50 flex gap-4"><textarea v-model="draft" class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-20" placeholder="发送消息..." @keydown="handleKeydown"></textarea><button @click="sendMessage" :class="['w-14 h-20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95', draft.trim() ? 'bg-blue-600 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed']" :disabled="!draft.trim()"><Send class="w-6 h-6" /></button></div>
    </div>
  </div>
</template>
