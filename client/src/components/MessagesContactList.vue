<script setup>
import { ref } from 'vue'
import { Bell, Search, X, MessageSquare } from 'lucide-vue-next'
import { getJson } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'

const props = defineProps({
  chats: { type: Array, required: true },
  activeChatId: { type: [Number, String], required: true }
})

const emit = defineEmits(['select', 'start-chat'])

const { user } = useAuth()

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)

const handleSearch = async () => {
  const q = searchQuery.value.trim()
  
  // 发送工业级原生 fetch 触发诊断，无视 getJson 本身可能被 catch 阻断的影响
  try {
    const currentUserId = user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || localStorage.getItem('zook_student_id') || 'me'
    fetch('http://localhost:3001/api/diagnose/search_trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, userId: currentUserId })
    }).catch(() => {})
  } catch {}

  if (!q) {
    searchResults.value = []
    searching.value = false
    return
  }
  searching.value = true
  try {
    const currentUserId = user.value?.studentId || user.value?.username || localStorage.getItem('zook_username') || localStorage.getItem('zook_student_id') || 'me'
    const res = await getJson(`/api/users/search?q=${encodeURIComponent(q)}&userId=${currentUserId}`)
    searchResults.value = res.users || []
  } catch (err) {
    console.error('搜索用户失败：', err)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searching.value = false
}
</script>

<template>
  <div class="w-[340px] bg-gray-50/50 border-r border-gray-100 flex flex-col shrink-0">
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100"><Bell class="w-5 h-5" /></div>
        <div>
          <h2 class="font-black text-gray-900 leading-none">消息通知</h2>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">会话与动态</p>
        </div>
      </div>
      
      <!-- 极质感搜索输入框 -->
      <div class="mt-5 relative flex items-center group">
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          @keyup.enter="handleSearch"
          placeholder="输入学号或姓名搜人..." 
          class="w-full text-xs font-bold pl-10 pr-8 py-2.5 bg-gray-150/70 border border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
        />
        <Search class="absolute left-3.5 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <button v-if="searchQuery" @click="clearSearch" class="absolute right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- 搜索结果呈献区 -->
      <div v-if="searching" class="bg-blue-50/10 border-b border-gray-100 p-4">
        <div class="flex justify-between items-center mb-3">
          <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest">搜索结果 ({{ searchResults.length }})</span>
          <button @click="clearSearch" class="text-[9px] font-bold text-gray-400 hover:text-gray-600">关闭搜索</button>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="u in searchResults" :key="u.id" class="p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div class="flex items-center gap-3 min-w-0">
              <img :src="u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.name}`" class="w-9 h-9 rounded-full border border-gray-150 bg-white object-cover" />
              <div class="min-w-0">
                <h5 class="font-bold text-xs text-gray-800 truncate leading-snug">{{ u.name }}</h5>
                <p class="text-[9px] text-gray-400 font-bold leading-normal truncate mt-0.5">{{ u.studentId || u.username }}</p>
              </div>
            </div>
            <button @click="emit('start-chat', u); clearSearch()" class="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] font-black rounded-xl shadow-sm flex items-center gap-1 transition-all active:scale-95 shrink-0">
              <MessageSquare class="w-3.5 h-3.5" /> 聊一聊
            </button>
          </div>
          <div v-if="searchResults.length === 0" class="py-6 text-center text-xs text-gray-400 font-bold">
            没有找到该同学，请核对学号
          </div>
        </div>
      </div>

      <!-- 会话列表 -->
      <button v-for="chat in chats" :key="chat.id" @click="emit('select', chat.id)" :class="['w-full text-left px-5 py-4 cursor-pointer transition-all flex gap-4 items-center border-b border-gray-100/70', activeChatId === chat.id ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50']">
        <div class="relative shrink-0">
          <div v-if="chat.type === 'system'" class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm"><Bell class="w-6 h-6" /></div>
          <img v-else :src="chat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`" class="w-12 h-12 rounded-full border border-gray-150 bg-white object-cover" />
          <span v-if="chat.unread > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">{{ chat.unread }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-1">
            <h4 class="font-bold text-gray-800 text-sm truncate leading-snug">{{ chat.name }}</h4>
            <span class="text-[10px] text-gray-400 font-bold">{{ chat.time }}</span>
          </div>
          <p class="text-xs text-gray-400 font-medium truncate mt-0.5">{{ chat.lastMsg }}</p>
        </div>
      </button>
    </div>
  </div>
</template>
