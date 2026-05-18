<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MessagesChatPanel from '../components/MessagesChatPanel.vue'
import MessagesContactList from '../components/MessagesContactList.vue'
import MessagesHeader from '../components/MessagesHeader.vue'
import MessagesSystemPanel from '../components/MessagesSystemPanel.vue'

const route = useRoute()
const books = ref([])
const activeChatId = ref(route.path === '/notifications' ? 'system' : 1)
const systemNotifications = ref([])
const chats = ref([])
const activeChat = ref(null)

onMounted(async () => {
  const [booksRes, uiRes] = await Promise.all([fetch('/data/books.json'), fetch('/data/ui.json')])
  const ui = await uiRes.json()
  books.value = await booksRes.json()
  chats.value = ui.messages?.contacts || []
  systemNotifications.value = ui.messages?.systemNotifications || []
  updateActiveChat()
})
const updateActiveChat = () => {
  activeChat.value = chats.value.find((c) => c.id === activeChatId.value) || chats.value[0]
}
</script>

<template>
  <div class="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
    <MessagesContactList :chats="chats" :active-chat-id="activeChatId" @select="activeChatId = $event; updateActiveChat()" />
    <div class="flex-1 flex flex-col bg-white">
      <MessagesHeader :chat="activeChat" />
      <MessagesSystemPanel v-if="activeChat?.type === 'system'" :notifications="systemNotifications" />
      <MessagesChatPanel v-else :books="books" :active-chat="activeChat" />
    </div>
  </div>
</template>
