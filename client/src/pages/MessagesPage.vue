<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { io } from 'socket.io-client'
import { useAuth } from '../composables/useAuth.js'
import MessagesChatPanel from '../components/MessagesChatPanel.vue'
import MessagesContactList from '../components/MessagesContactList.vue'
import MessagesHeader from '../components/MessagesHeader.vue'
import MessagesSystemPanel from '../components/MessagesSystemPanel.vue'
import { getJson, patchJson, postJson } from '../composables/useApi.js'

const route = useRoute()
const { user } = useAuth()
const books = ref([])
const activeChatId = ref(route.path === '/notifications' ? 'system' : 1)
const systemNotifications = ref([])
const chats = ref([])
const chatMessages = ref({})
const activeChat = ref(null)

let socket = null

onMounted(async () => {
  const [booksData, chatData, noticesData] = await Promise.all([getJson('/api/books?status=approved'), getJson('/api/chats'), getJson('/api/notifications?userId=me')])
  books.value = booksData.books
  chats.value = [{ id: 'system', type: 'system', name: '消息通知', unread: noticesData.notifications.filter((item) => !item.isRead).length }, ...(chatData.contacts || []).map((chat) => ({ ...chat, type: 'chat' }))]
  chatMessages.value = chatData.messages || {}
  systemNotifications.value = noticesData.notifications
  updateActiveChat()
  if (activeChatId.value === 'system') markNotificationsRead()

  // 1. 初始化 Socket.IO 长连接，指向后端服务端口
  socket = io('http://localhost:3001')

  socket.on('connect', () => {
    const currentUserId = user.value?.id || 'me'
    const currentUserName = user.value?.name || '浙大同学'
    // 2. 长连接建立后向后端注册身份，以便加入专属广播房间
    socket.emit('register_user', { id: currentUserId, name: currentUserName })
  })

  // 3. 监听实时收到聊天消息广播事件
  socket.on('receive_message', (data) => {
    const senderId = data.chatId
    const incomingMsg = data.message

    if (!chatMessages.value[senderId]) {
      chatMessages.value[senderId] = []
    }

    // 推进对应会话的消息列表中
    chatMessages.value[senderId].push(incomingMsg)

    // 联动更新会话列表里的状态
    const chat = chats.value.find((c) => String(c.id) === String(senderId))
    if (chat) {
      chat.lastMsg = incomingMsg.content
      chat.time = '刚刚'

      // 若用户当前没有开着此人对话框，进行红点提示，并唤醒右上角全局未读数
      if (String(activeChatId.value) !== String(senderId)) {
        chat.unread = (chat.unread || 0) + 1
        window.dispatchEvent(new Event('notificationsUpdated'))
      } else {
        chat.unread = 0
      }
    }
  })
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})

const updateActiveChat = () => {
  activeChat.value = chats.value.find((chat) => chat.id === activeChatId.value) || chats.value[0]
}

const markNotificationsRead = async () => {
  await patchJson('/api/notifications/read', { userId: 'me' })
  systemNotifications.value = systemNotifications.value.map((item) => ({ ...item, isRead: true }))
  const systemChat = chats.value.find((chat) => chat.id === 'system')
  if (systemChat) systemChat.unread = 0
  window.dispatchEvent(new Event('notificationsUpdated'))
}

const selectChat = (chatId) => {
  activeChatId.value = chatId
  updateActiveChat()
  if (chatId === 'system') {
    markNotificationsRead()
  } else {
    const chat = chats.value.find((c) => c.id === chatId)
    if (chat && chat.unread > 0) {
      chat.unread = 0
      window.dispatchEvent(new Event('notificationsUpdated'))
    }
  }
}

const sendMessage = async (text) => {
  const currentUserId = user.value?.id || 'me'
  const data = await postJson(`/api/chats/${activeChatId.value}/messages`, { text, userId: currentUserId })
  
  if (!chatMessages.value[activeChatId.value]) chatMessages.value[activeChatId.value] = []
  
  // 推进自己发送的消息气泡
  chatMessages.value[activeChatId.value].push(data.message)
  
  // 如果是离线自动回复降级，则推入机器人回复气泡
  if (data.reply) {
    chatMessages.value[activeChatId.value].push(data.reply)
  }

  // 同步更新侧边会话最后消息
  const chat = chats.value.find((c) => c.id === activeChatId.value)
  if (chat) {
    chat.lastMsg = text
    chat.time = '刚刚'
  }
}

</script>

<template>
  <div class="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
    <MessagesContactList :chats="chats" :active-chat-id="activeChatId" @select="selectChat" />
    <div class="flex-1 flex flex-col bg-white">
      <MessagesHeader :chat="activeChat" />
      <MessagesSystemPanel v-if="activeChat?.type === 'system'" :notifications="systemNotifications" />
      <MessagesChatPanel v-else :books="books" :active-chat="activeChat" :messages="chatMessages[activeChatId] || []" @send="sendMessage" />
    </div>
  </div>
</template>
