<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Image, Send, X } from 'lucide-vue-next'
import ChatContactList from '../components/ChatContactList.vue'
import ChatWindowHeader from '../components/ChatWindowHeader.vue'
import { getJson, postJson, uploadFile } from '../composables/useApi.js'
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
  const [booksData, chatData] = await Promise.all([getJson('/api/books'), getJson(`/api/chats?userId=${currentUserId}`)])
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
  // 更新侧边栏最后消息
  const chat = chats.value.find((c) => String(c.id) === String(activeChatId.value))
  if (chat) {
    chat.lastMsg = text
    chat.time = '刚刚'
  }
  scrollToBottom()
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 图片发送相关
const fileInput = ref(null)
const uploading = ref(false)
const previewImageUrl = ref('')

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelected = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过 10MB')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadFile('/api/chats/upload-image', formData)
    if (res.success && res.url) {
      if (!chatMessages.value[activeChatId.value]) chatMessages.value[activeChatId.value] = []
      const data = await postJson(`/api/chats/${activeChatId.value}/messages`, {
        text: '',
        imageUrl: res.url,
        userId: currentAccountId()
      })
      chatMessages.value[activeChatId.value].push(...[data.message, data.reply].filter(Boolean))
      // 更新侧边栏最后消息为 [图片]
      const chat = chats.value.find((c) => String(c.id) === String(activeChatId.value))
      if (chat) {
        chat.lastMsg = '[图片]'
        chat.time = '刚刚'
      }
      scrollToBottom()
    }
  } catch (err) {
    alert(err.message || '图片上传失败')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
    <ChatContactList :chats="chats" :active-chat-id="activeChatId" @select="selectChat" />
    <div class="flex-1 flex flex-col bg-white">
      <ChatWindowHeader :name="activeChat?.name" :contact-id="activeChat?.id" />
      <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
        <div v-if="books.length > 0 && activeChat?.bookIdx !== undefined" class="bg-white google-card !p-4 flex gap-4 w-full max-w-md mx-auto mb-4 border-gray-100 !rounded-2xl"><img :src="books[activeChat.bookIdx]?.cover" class="w-14 h-20 object-cover rounded-lg shadow-sm" /><div class="flex-1 min-w-0"><h5 class="font-medium text-sm text-gray-800 truncate mb-1">{{ books[activeChat.bookIdx]?.title }}</h5><span class="text-red-500 font-medium text-lg">¥{{ books[activeChat.bookIdx]?.price }}</span></div></div>
        <template v-for="msg in (chatMessages[activeChatId] || [])" :key="msg.id">
          <div v-if="msg.role === 'other'" class="flex items-start gap-4 max-w-[85%]">
            <img src="/user_avatar.png" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm" />
            <div v-if="msg.msgType === 'image'" class="bg-white border border-gray-100 rounded-2xl rounded-tl-none overflow-hidden shadow-sm">
              <img :src="msg.imageUrl" class="max-w-[260px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" @click="previewImageUrl = msg.imageUrl" />
              <p v-if="msg.content" class="text-sm text-gray-800 px-3 pb-3 leading-relaxed">{{ msg.content }}</p>
            </div>
            <div v-else class="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">{{ msg.content }}</div>
          </div>
          <div v-else class="flex items-start justify-end gap-4 max-w-[85%] self-end">
            <div v-if="msg.msgType === 'image'" class="bg-blue-600 rounded-2xl rounded-tr-none overflow-hidden shadow">
              <img :src="msg.imageUrl" class="max-w-[260px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" @click="previewImageUrl = msg.imageUrl" />
              <p v-if="msg.content" class="text-sm text-white px-3 pb-3 leading-relaxed">{{ msg.content }}</p>
            </div>
            <div v-else class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed">{{ msg.content }}</div>
            <img src="/user_avatar.png" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white" />
          </div>
        </template>
        <div ref="messagesEnd"></div>
      </div>
      <div class="p-6 bg-white border-t border-gray-50 flex gap-3 items-end">
        <button @click="triggerFileSelect" :disabled="uploading" :class="['w-14 h-20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 shrink-0', uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:shadow-lg']" title="发送图片">
          <Image class="w-6 h-6" />
        </button>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelected" />
        <textarea v-model="draft" class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-20" placeholder="发送消息..." @keydown="handleKeydown"></textarea>
        <button @click="sendMessage" :class="['w-14 h-20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 shrink-0', draft.trim() ? 'bg-blue-600 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed']" :disabled="!draft.trim()"><Send class="w-6 h-6" /></button>
      </div>
      <!-- 图片预览模态框 -->
      <div v-if="previewImageUrl" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="previewImageUrl = ''">
        <div class="relative max-w-[90vw] max-h-[90vh]">
          <button @click="previewImageUrl = ''" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors z-10">
            <X class="w-4 h-4" />
          </button>
          <img :src="previewImageUrl" class="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      </div>
    </div>
  </div>
</template>
