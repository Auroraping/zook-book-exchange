<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MessagesChatPanel from '../components/MessagesChatPanel.vue'
import MessagesContactList from '../components/MessagesContactList.vue'
import MessagesHeader from '../components/MessagesHeader.vue'
import MessagesSystemPanel from '../components/MessagesSystemPanel.vue'
import { getJson, patchJson, postJson } from '../composables/useApi.js'

const route = useRoute()
const books = ref([])
const activeChatId = ref(route.path === '/notifications' ? 'system' : 1)
const systemNotifications = ref([])
const chats = ref([])
const chatMessages = ref({})
const activeChat = ref(null)

onMounted(async () => {
  const [booksData, chatData, noticesData] = await Promise.all([getJson('/api/books?status=approved'), getJson('/api/chats'), getJson('/api/notifications?userId=me')])
  books.value = booksData.books
  chats.value = [{ id: 'system', type: 'system', name: '消息通知', unread: noticesData.notifications.filter((item) => !item.isRead).length }, ...(chatData.contacts || []).map((chat) => ({ ...chat, type: 'chat' }))]
  chatMessages.value = chatData.messages || {}
  systemNotifications.value = noticesData.notifications
  updateActiveChat()
  if (activeChatId.value === 'system') markNotificationsRead()
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
  const data = await postJson(`/api/chats/${activeChatId.value}/messages`, { text })
  if (!chatMessages.value[activeChatId.value]) chatMessages.value[activeChatId.value] = []
  chatMessages.value[activeChatId.value].push(data.message, data.reply)
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
