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

// 注入工业级前端崩溃捕获系统
window.onerror = function (message, url, line, col, error) {
  fetch('http://localhost:3001/api/diagnose/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      url: url,
      line: line,
      col: col,
      stack: error ? error.stack : ''
    })
  }).catch(() => {})
  return false
}

let socket = null

onMounted(async () => {
  const currentUserId = user.value?.realId || localStorage.getItem('zook_user_uuid') || user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || 'me'
  const [booksData, chatData, noticesData] = await Promise.all([getJson('/api/books?status=approved'), getJson(`/api/chats?userId=${currentUserId}`), getJson('/api/notifications?userId=me')])
  books.value = booksData.books
  chats.value = [{ id: 'system', type: 'system', name: '消息通知', unread: noticesData.notifications.filter((item) => !item.isRead).length }, ...(chatData.contacts || []).map((chat) => ({ ...chat, type: 'chat' }))]
  chatMessages.value = chatData.messages || {}
  systemNotifications.value = noticesData.notifications
  updateActiveChat()
  if (activeChatId.value === 'system') {
    markNotificationsRead()
  } else {
    const chat = chats.value.find((c) => c.id === activeChatId.value)
    if (chat && chat.unread > 0) {
      chat.unread = 0
      postJson(`/api/chats/${activeChatId.value}/read`).catch(() => {})
      window.dispatchEvent(new Event('notificationsUpdated'))
    }
  }

  // 1. 初始化 Socket.IO 长连接，指向后端服务端口
  socket = io('http://localhost:3001')

  socket.on('connect', () => {
    const currentUserId = user.value?.realId || localStorage.getItem('zook_user_uuid') || user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || 'me'
    const currentUserName = user.value?.name || '浙大同学'
    // 2. 长连接建立后向后端注册身份，以便加入专属广播房间
    socket.emit('register_user', { id: currentUserId, name: currentUserName })
  })

  // 3. 监听实时收到聊天消息广播事件
  socket.on('receive_message', async (data) => {
    const myUuid = user.value?.realId || localStorage.getItem('zook_user_uuid')
    const myStudentId = user.value?.studentId || user.value?.username || localStorage.getItem('zook_username')
    
    // 【双重高可用容灾防御】：只要指定的接收者 UUID 或接收者学号中任意一个匹配当前登录用户，即认定为是发给我的
    let isForMe = false
    if (data.receiverId && myUuid && String(data.receiverId) === String(myUuid)) {
      isForMe = true
    }
    if (data.receiverStudentId && myStudentId && String(data.receiverStudentId) === String(myStudentId)) {
      isForMe = true
    }
    
    // 若两级容灾比对均匹配失败，则判定为别人的消息，直接安全静默丢弃，绝不越权显示
    if (!isForMe) {
      return
    }

    const senderId = data.chatId
    const incomingMsg = data.message

    if (!chatMessages.value[senderId]) {
      chatMessages.value[senderId] = []
    }

    // 推进对应会话的消息列表中
    chatMessages.value[senderId].push(incomingMsg)

    // 联动更新会话列表里的状态
    let chat = chats.value.find((c) => String(c.id) === String(senderId))
    if (!chat) {
      // 全新会话，拉取最新会话列表并置顶
      try {
        const currentUserId = user.value?.realId || localStorage.getItem('zook_user_uuid') || user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || 'me'
        const chatData = await getJson(`/api/chats?userId=${currentUserId}`)
        chats.value = [
          { id: 'system', type: 'system', name: '消息通知', unread: systemNotifications.value.filter((item) => !item.isRead).length },
          ...(chatData.contacts || []).map((c) => ({ ...c, type: 'chat' }))
        ]
        chatMessages.value = chatData.messages || {}
        chat = chats.value.find((c) => String(c.id) === String(senderId))
      } catch (e) {
        console.error('动态拉取会话列表失败：', e)
      }
    }

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
      postJson(`/api/chats/${chatId}/read`).catch(() => {})
      window.dispatchEvent(new Event('notificationsUpdated'))
    }
  }
}

const sendMessage = async (text) => {
  const currentUserId = user.value?.realId || localStorage.getItem('zook_user_uuid') || user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || 'me'
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

const handleStartChat = async (targetUser) => {
  if (!targetUser) return
  try {
    const currentUserId = user.value?.realId || localStorage.getItem('zook_user_uuid') || user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || 'me'
    const res = await postJson('/api/chats', {
      contactId: targetUser.id,
      contactName: targetUser.name,
      avatar: targetUser.avatar,
      initialMsg: `你好，${targetUser.name}同学！我想与你交流一下教材交易和信息沟通。`,
      bookTitle: '教材沟通',
      userId: currentUserId
    })
    
    if (res.success) {
      const chatData = await getJson(`/api/chats?userId=${currentUserId}`)
      chats.value = [
        { id: 'system', type: 'system', name: '消息通知', unread: systemNotifications.value.filter((item) => !item.isRead).length },
        ...(chatData.contacts || []).map((chat) => ({ ...chat, type: 'chat' }))
      ]
      chatMessages.value = chatData.messages || {}
      selectChat(targetUser.id)
    }
  } catch (err) {
    alert(err.message || '发起对话失败，请重试')
  }
}
</script>

<template>
  <div class="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
    <MessagesContactList :chats="chats" :active-chat-id="activeChatId" @select="selectChat" @start-chat="handleStartChat" />
    <div class="flex-1 flex flex-col bg-white">
      <MessagesHeader :chat="activeChat" />
      <MessagesSystemPanel v-if="activeChat?.type === 'system'" :notifications="systemNotifications" />
      <MessagesChatPanel v-else :books="books" :active-chat="activeChat" :messages="chatMessages[activeChatId] || []" @send="sendMessage" />
    </div>
  </div>
</template>
