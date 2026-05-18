<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Send } from 'lucide-vue-next'
import ChatContactList from '../components/ChatContactList.vue'
import ChatWindowHeader from '../components/ChatWindowHeader.vue'

const books = ref([])
const activeChatId = ref(1)
const draft = ref('')
const messagesEnd = ref(null)
const chats = ref([])
const chatMessages = ref({})
const activeChat = ref(null)
const autoReplies = ref([])

onMounted(async () => {
  const [booksRes, uiRes] = await Promise.all([fetch('/data/books.json'), fetch('/data/ui.json')])
  const ui = await uiRes.json()
  books.value = await booksRes.json()
  chats.value = ui.chat?.contacts || []
  chatMessages.value = ui.chat?.messages || {}
  autoReplies.value = ui.chat?.autoReplies || []
  activeChat.value = chats.value[0] || null
})

const selectChat = (chat) => {
  activeChatId.value = chat.id
  activeChat.value = chat
  chat.unread = 0
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

const sendMessage = () => {
  const text = draft.value.trim()
  if (!text) return
  const chatId = activeChatId.value
  if (!chatMessages.value[chatId]) chatMessages.value[chatId] = []
  chatMessages.value[chatId].push({ id: `m-${Date.now()}`, role: 'me', content: text })
  draft.value = ''
  scrollToBottom()
  // 模拟自动回复
  setTimeout(() => {
    const reply = autoReplies.value[Math.floor(Math.random() * autoReplies.value.length)]
    chatMessages.value[chatId].push({ id: `m-${Date.now() + 1}`, role: 'other', content: reply })
    scrollToBottom()
  }, 1200)
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
    <!-- 联系人列表 -->
    <ChatContactList
      :chats="chats"
      :active-chat-id="activeChatId"
      @select="selectChat"
    />
    <!-- 聊天主区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <ChatWindowHeader :name="activeChat?.name" />
      <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
        <!-- 关联书籍卡 -->
        <div v-if="books.length > 0 && activeChat?.bookIdx !== undefined" class="bg-white google-card !p-4 flex gap-4 w-full max-w-md mx-auto mb-4 border-gray-100 !rounded-2xl">
          <img :src="books[activeChat.bookIdx]?.cover" class="w-14 h-20 object-cover rounded-lg shadow-sm" />
          <div class="flex-1 min-w-0">
            <h5 class="font-medium text-sm text-gray-800 truncate mb-1">{{ books[activeChat.bookIdx]?.title }}</h5>
            <span class="text-red-500 font-medium text-lg">¥{{ books[activeChat.bookIdx]?.price }}</span>
          </div>
        </div>
        <!-- 消息列表 -->
        <template v-for="msg in (chatMessages[activeChatId] || [])" :key="msg.id">
          <div v-if="msg.role === 'other'" class="flex items-start gap-4 max-w-[85%]">
            <img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat?.name}`" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm" />
            <div class="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">{{ msg.content }}</div>
          </div>
          <div v-else class="flex items-start justify-end gap-4 max-w-[85%] self-end">
            <div class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed">{{ msg.content }}</div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white" />
          </div>
        </template>
        <div ref="messagesEnd"></div>
      </div>
      <!-- 输入区 -->
      <div class="p-6 bg-white border-t border-gray-50 flex gap-4">
        <textarea
          v-model="draft"
          class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-20"
          placeholder="发送消息..."
          @keydown="handleKeydown"
        ></textarea>
        <button
          @click="sendMessage"
          :class="['w-14 h-20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95', draft.trim() ? 'bg-blue-600 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed']"
          :disabled="!draft.trim()"
        >
          <Send class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
</template>
