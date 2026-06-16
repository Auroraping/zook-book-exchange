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
import { getStored } from '../composables/useSessionStore.js'

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

const currentAccountId = () => {
  return user.value?.realId || getStored('zook_user_uuid') || 'me'
}

onMounted(async () => {
  const currentUserId = currentAccountId()
  const [booksData, chatData, noticesData] = await Promise.all([getJson('/api/books'), getJson(`/api/chats?userId=${currentUserId}`), getJson(`/api/notifications?userId=${currentUserId}`)])
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

  const reportSocketDiagnose = (event, details) => {
    const currentUserId = currentAccountId()
    const currentUserName = user.value?.name || '浙大同学'
    fetch('http://localhost:3001/api/diagnose/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        userName: currentUserName,
        event: event,
        details: details
      })
    }).catch(() => {})
  }

  socket.on('connect', () => {
    const currentUserId = currentAccountId()
    const currentUserName = user.value?.name || '浙大同学'
    console.log(`%c[Socket.IO] 长连接连接成功！注册 ID: ${currentUserId}`, 'color: #10b981; font-weight: bold;');
    // 2. 长连接建立后向后端注册身份，以便加入专属广播房间
    socket.emit('register_user', { id: currentUserId, name: currentUserName })
    reportSocketDiagnose('CONNECT_SUCCESS', { socketId: socket.id, registeredId: currentUserId })
  })

  socket.on('connect_error', (error) => {
    console.error('%c[Socket.IO] 长连接发生连接错误！', 'color: #ef4444; font-weight: bold;', error);
    reportSocketDiagnose('CONNECT_ERROR', { errorMessage: error.message, errorStack: error.stack })
  })

  socket.on('disconnect', (reason) => {
    console.warn('%c[Socket.IO] 长连接已断开！原因:', 'color: #f59e0b; font-weight: bold;', reason);
    reportSocketDiagnose('DISCONNECT', { reason: reason })
  })

  // 3. 监听实时收到聊天消息广播事件
  socket.on('receive_message', async (data) => {
    const myUuid = currentAccountId()
    const isForMe = data.receiverId && myUuid && String(data.receiverId) === String(myUuid)
    
    reportSocketDiagnose('RECEIVE_MESSAGE_MATCH_DIAGNOSE', {
      incomingReceiverId: data.receiverId,
      myUuid: myUuid,
      isForMe: isForMe,
      messageContent: data.message?.content
    })
    
    console.log(`[Socket.IO] 收到实时广播，主账号匹配结果为: ${isForMe}`, data);
    
    if (!isForMe) {
      return
    }

    const senderId = data.chatId
    const incomingMsg = data.message

    if (!chatMessages.value[senderId]) {
      chatMessages.value[senderId] = []
    }

    // 【唯一消息 ID 工业级去重防御】：防止多维容灾或网络瞬间重试带来的并发消息多包投递，保证界面上气泡仅绘制一次
    const isDuplicate = chatMessages.value[senderId].some(m => String(m.id) === String(incomingMsg.id))
    if (isDuplicate) {
      console.log(`%c[Socket.IO] 捕获到重复消息包，已安全执行去重抛弃，ID: ${incomingMsg.id}`, 'color: #94a3b8;');
      return
    }

    // 1. 使用高可用解构重赋值并彻底突变嵌套字典的根引用，100% 强行驱动 Vue 3 依赖重绘聊天气泡！
    chatMessages.value[senderId] = [...chatMessages.value[senderId], incomingMsg]
    chatMessages.value = { ...chatMessages.value }

    // 联动更新会话列表里的状态
    let chat = chats.value.find((c) => String(c.id) === String(senderId))
    if (!chat) {
      // 全新会话，拉取最新会话列表并置顶
      try {
        const chatData = await getJson(`/api/chats?userId=${myUuid}`)
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
      // 图片消息显示 [图片]，否则显示文本内容
      chat.lastMsg = incomingMsg.imageUrl ? '[图片]' : (incomingMsg.content || '')
      chat.time = '刚刚'
      
      // 2. 强行刷新 chats 的引用，百分之百驱动 Vue 3 同步重绘侧边栏最后一条消息与红点状态！
      chats.value = [...chats.value]

      // 若用户当前没有开着此人对话框，进行红点提示，并唤醒右上角全局未读数
      if (String(activeChatId.value) !== String(senderId)) {
        chat.unread = (chat.unread || 0) + 1
        window.dispatchEvent(new Event('notificationsUpdated'))
      } else {
        chat.unread = 0
      }
    }
  })

  socket.on('proposal_accepted', (data) => {
    const { chatId, msgId } = data
    const room = chatMessages.value[chatId] || []
    const msg = room.find((item) => String(item.id) === String(msgId))
    if (msg?.proposalData) {
      msg.proposalData.status = 'accepted'
      chatMessages.value = { ...chatMessages.value }
    }
  })

  const queryContactId = route.query.contactId || route.query.activeId
  const queryContactName = route.query.contactName || (route.query.activeId ? '浙大同学' : null)
  if (queryContactId && queryContactName) {
    setTimeout(async () => {
      const existingChat = chats.value.find((c) => String(c.id) === String(queryContactId))
      const queryBookId = route.query.bookId
      
      if (!existingChat || (queryBookId && String(existingChat.bookId) !== String(queryBookId))) {
        await handleStartChat({
          id: queryContactId,
          name: queryContactName,
          bookId: queryBookId,
          bookTitle: route.query.bookTitle || '教材沟通',
          initialMsg: route.query.initialMsg
        })
      } else {
        selectChat(queryContactId)
      }
    }, 300)
  }
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
  await patchJson('/api/notifications/read', { userId: currentAccountId() })
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
      postJson(`/api/chats/${chatId}/read`, { userId: currentAccountId() }).catch(() => {})
      window.dispatchEvent(new Event('notificationsUpdated'))
    }
  }
}

const sendMessage = async (payload) => {
  if (typeof payload === 'object' && payload.type === 'special_proposal') {
    if (!chatMessages.value[activeChatId.value]) {
      chatMessages.value[activeChatId.value] = []
    }
    chatMessages.value[activeChatId.value] = [...chatMessages.value[activeChatId.value], payload.message]
    chatMessages.value = { ...chatMessages.value }
    const chat = chats.value.find((c) => c.id === activeChatId.value)
    if (chat) {
      chat.lastMsg = '[交易报价]'
      chat.time = '刚刚'
    }
    return
  }

  // 处理图片消息
  if (typeof payload === 'object' && payload.type === 'image') {
    const currentUserId = currentAccountId()
    const data = await postJson(`/api/chats/${activeChatId.value}/messages`, {
      text: payload.text || '',
      imageUrl: payload.imageUrl,
      userId: currentUserId
    })
    
    if (!chatMessages.value[activeChatId.value]) {
      chatMessages.value[activeChatId.value] = []
    }
    
    let updatedList = [...chatMessages.value[activeChatId.value], data.message]
    if (data.reply) {
      updatedList = [...updatedList, data.reply]
    }
    chatMessages.value[activeChatId.value] = updatedList
    chatMessages.value = { ...chatMessages.value }

    const chat = chats.value.find((c) => c.id === activeChatId.value)
    if (chat) {
      chat.lastMsg = '[图片]'
      chat.time = '刚刚'
    }
    return
  }

  const text = payload
  const currentUserId = currentAccountId()
  const data = await postJson(`/api/chats/${activeChatId.value}/messages`, { text, userId: currentUserId })
  
  if (!chatMessages.value[activeChatId.value]) {
    chatMessages.value[activeChatId.value] = []
  }
  
  // 1. 推进自己发送的消息气泡，采用强解构与根引用强制刷新，物理规避 Vue 3 依赖追踪盲区！
  let updatedList = [...chatMessages.value[activeChatId.value], data.message]
  
  // 如果是离线自动回复降级，则推入机器人回复气泡
  if (data.reply) {
    updatedList = [...updatedList, data.reply]
  }
  chatMessages.value[activeChatId.value] = updatedList
  chatMessages.value = { ...chatMessages.value }

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
    const currentUserId = currentAccountId()
    const res = await postJson('/api/chats', {
      contactId: targetUser.id,
      contactName: targetUser.name,
      avatar: targetUser.avatar,
      initialMsg: targetUser.initialMsg || `你好，${targetUser.name}同学！我想与你交流一下${targetUser.bookTitle ? `《${targetUser.bookTitle}》` : '教材'}的交易事宜。`,
      bookTitle: targetUser.bookTitle || '教材沟通',
      bookId: targetUser.bookId,
      userId: currentUserId
    })
    
    if (res.success) {
      const chatData = await getJson(`/api/chats?userId=${currentUserId}`)
      chats.value = [
        { id: 'system', type: 'system', name: '消息通知', unread: systemNotifications.value.filter((item) => !item.isRead).length },
        ...(chatData.contacts || []).map((chat) => ({ ...chat, type: 'chat' }))
      ]
      chatMessages.value = chatData.messages || {}
      selectChat(res.contactId || targetUser.id)
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
