<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Search, ArrowRight, Bell, LogOut } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth.js'
import { getJson } from '../composables/useApi.js'
import { getStored } from '../composables/useSessionStore.js'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, logout, user } = useAuth()

const searchTerm = ref(new URLSearchParams(route.query).get('q') || '')
const unreadNotifications = ref(0)

const currentAccountId = () => {
  return user.value?.realId || getStored('zook_user_uuid') || 'me'
}

watch(() => route.fullPath, () => {
  searchTerm.value = new URLSearchParams(route.query).get('q') || ''
})

const submitSearch = () => {
  const query = searchTerm.value.trim()
  router.push(query ? `/books?q=${encodeURIComponent(query)}` : '/books')
}

const refreshNotifications = async () => {
  if (!isLoggedIn.value) {
    unreadNotifications.value = 0
    return
  }
  try {
    const currentUserId = currentAccountId()
    const [noticesData, chatData] = await Promise.all([
      getJson(`/api/notifications?userId=${currentUserId}`).catch(() => ({ notifications: [] })),
      getJson(`/api/chats?userId=${currentUserId}`).catch(() => ({ contacts: [] }))
    ])
    const systemUnread = (noticesData.notifications || []).filter((item) => !item.isRead).length
    const chatUnread = (chatData.contacts || []).reduce((sum, item) => sum + (parseInt(item.unread) || 0), 0)
    unreadNotifications.value = systemUnread + chatUnread
  } catch (err) {
    unreadNotifications.value = 0
  }
}

watch(isLoggedIn, refreshNotifications)

onMounted(() => {
  refreshNotifications()
  window.addEventListener('notificationsUpdated', refreshNotifications)
})

onUnmounted(() => {
  window.removeEventListener('notificationsUpdated', refreshNotifications)
})
</script>

<template>
  <header class="h-24 px-16 flex items-center justify-between sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/20">
    <div class="flex-1 max-w-3xl">
      <form @submit.prevent="submitSearch" class="group h-16 bg-white/85 border border-gray-100 rounded-[24px] px-5 flex items-center gap-4 shadow-[0_12px_40px_rgba(60,64,67,0.08)] backdrop-blur-xl focus-within:bg-white focus-within:border-blue-100 focus-within:shadow-[0_16px_48px_rgba(26,115,232,0.12)] transition-all">
        <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
          <Search class="w-5 h-5" />
        </div>
        <input type="search" v-model="searchTerm" placeholder="搜索书名、作者、ISBN 或课程关键词" class="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-base text-gray-800 placeholder-gray-400 font-medium" />
        <div class="flex items-center gap-3 pl-3 border-l border-gray-100">
          <span class="hidden lg:inline text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">全站搜索</span>
          <button type="submit" class="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all" title="搜索">
            <ArrowRight class="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
    <div class="flex items-center gap-8 ml-12">
      <RouterLink v-if="!isLoggedIn" to="/login" class="btn-premium whitespace-nowrap shadow-2xl">立即开启淘书之旅</RouterLink>
      <div v-else class="flex items-center gap-4">
        <RouterLink to="/messages" :class="['relative w-12 h-12 rounded-[16px] border flex items-center justify-center transition-all shadow-sm', (route.path === '/messages' || route.path === '/notifications') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-gray-400 border-gray-100 hover:text-blue-600 hover:bg-blue-50']" title="消息通知">
          <Bell class="w-5 h-5" />
          <span v-if="unreadNotifications > 0" class="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] leading-4 text-center ring-2 ring-white font-black">{{ unreadNotifications > 9 ? '9+' : unreadNotifications }}</span>
        </RouterLink>
        <div class="text-right hidden xl:block">
          <p class="text-sm font-bold text-gray-800">你好，求是校友</p>
        </div>
        <RouterLink to="/profile" class="w-14 h-14 rounded-[20px] border-4 border-white shadow-2xl overflow-hidden hover:scale-110 transition-all rotate-3">
          <img :src="user?.avatar || '/user_avatar.png'" class="w-full h-full object-cover" />
        </RouterLink>
        <button @click="logout" class="w-12 h-12 bg-white border border-gray-100 rounded-[16px] flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-sm" title="退出登录">
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
</template>
