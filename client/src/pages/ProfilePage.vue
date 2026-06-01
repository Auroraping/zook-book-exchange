<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { getJson, postJson } from '../composables/useApi.js'
import { Bell, BookMarked, Heart, Package, Sparkles } from 'lucide-vue-next'
import ProfileHeaderCard from '../components/ProfileHeaderCard.vue'
import ProfileLoginPrompt from '../components/ProfileLoginPrompt.vue'
import ProfileSidebar from '../components/ProfileSidebar.vue'
import ProfileTabContent from '../components/ProfileTabContent.vue'

const route = useRoute()
const { isLoggedIn, updateUser } = useAuth()
const targetUserId = route.params.id || 'me'
const isMe = targetUserId === 'me'

const activeTab = ref(isMe ? 'orders' : 'books')
const orders = ref([])
const books = ref([])
const wishes = ref([])
const notifications = ref([])
const favoriteBooks = ref([])
const tabs = ref([])
const profileUser = ref({})
const iconMap = { Package, Heart, Sparkles, Bell, BookMarked }

// 头像修改弹窗响应式状态
const showAvatarModal = ref(false)
const newAvatarUrl = ref('')
const uploadFile = ref(null)
const savingAvatar = ref(false)
const diceRotating = ref(false)

const presetAvatars = [
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=ZJU_1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot_1',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=ZJU_Design'
]

const openAvatarModal = () => {
  newAvatarUrl.value = profileUser.value.avatar || '/user_avatar.png'
  uploadFile.value = null
  showAvatarModal.value = true
}

const rollDice = () => {
  if (diceRotating.value) return
  diceRotating.value = true
  setTimeout(() => { diceRotating.value = false }, 800) // 旋转动画持续 800ms
  
  const styles = ['avataaars', 'pixel-art', 'bottts', 'identicon', 'lorelei']
  const randomStyle = styles[Math.floor(Math.random() * styles.length)]
  const seed = Math.floor(Math.random() * 1000000)
  
  newAvatarUrl.value = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`
  uploadFile.value = null
}

const selectPreset = (url) => {
  newAvatarUrl.value = url
  uploadFile.value = null
}

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  uploadFile.value = file
  const reader = new FileReader()
  reader.onload = (event) => {
    newAvatarUrl.value = event.target.result // Base64 本地预览
  }
  reader.readAsDataURL(file)
}

const saveAvatar = async () => {
  if (savingAvatar.value) return
  savingAvatar.value = true
  try {
    let finalAvatarUrl = ''
    if (uploadFile.value) {
      // 1. 本地高清照片 Multipart/form-data 文件上传
      const formData = new FormData()
      formData.append('file', uploadFile.value)
      formData.append('userId', profileUser.value.id || 'me')
      const res = await fetch('/api/user/update', {
        method: 'POST',
        body: formData
      }).then((r) => r.json())
      if (!res.success) throw new Error(res.message)
      finalAvatarUrl = res.avatar
    } else {
      // 2. 外部 Dicebear URL 直接 JSON 提交
      const res = await postJson('/api/user/update', {
        userId: profileUser.value.id || 'me',
        avatar: newAvatarUrl.value
      })
      if (!res.success) throw new Error(res.message)
      finalAvatarUrl = res.avatar
    }
    
    // 3. 成功后更新个人中心大头像
    profileUser.value.avatar = finalAvatarUrl
    
    // 4. 同步更新本地客户端缓存与全站头像展示
    updateUser({ avatar: finalAvatarUrl })
    
    showAvatarModal.value = false
  } catch (err) {
    alert(err.message || '更新头像失败，请检查文件格式后重试。')
  } finally {
    savingAvatar.value = false
  }
}

const hydrateRealProfile = (name, sid, coll, maj, cls) => {
  profileUser.value.realName = name
  profileUser.value.studentId = sid
  profileUser.value.college = coll
  profileUser.value.major = maj
  profileUser.value.classText = cls
  profileUser.value.bio = `浙江大学${coll || ''}${maj || ''}专业本科生，已完成教务身份同步。`
}

onMounted(async () => {
  const [ordersData, booksData, wishesData, noticesData, favoritesData, uiRes] = await Promise.all([
    isMe ? getJson('/api/orders?userId=me') : { orders: [] }, 
    getJson(isMe ? '/api/books' : `/api/books?sellerId=${targetUserId}`), 
    getJson('/api/wishes'), 
    isMe ? getJson('/api/notifications?userId=me') : { notifications: [] }, 
    isMe ? getJson('/api/favorites?userId=me') : { items: [] }, 
    fetch('/data/ui.json')
  ])
  const ui = await uiRes.json()
  orders.value = ordersData.orders || []
  books.value = booksData.books || []
  wishes.value = wishesData.wishes || []
  notifications.value = noticesData.notifications || []
  favoriteBooks.value = favoritesData.items || []
  
  if (isMe) {
    profileUser.value = { ...(ui.profile?.defaultUser || {}) }
    tabs.value = ui.profile?.tabs || []
    
    const realName = localStorage.getItem('zook_real_name')
    if (realName) {
      hydrateRealProfile(realName, localStorage.getItem('zook_student_id'), localStorage.getItem('zook_college'), localStorage.getItem('zook_major'), localStorage.getItem('zook_class'))
    } else if (isLoggedIn.value) {
      const username = localStorage.getItem('zook_username')
      const password = localStorage.getItem('zook_password')
      if (username && password) {
        postJson('/api/schedule', { username, password }).then((data) => {
          const raw = data.raw || {}
          if (raw.xm) hydrateRealProfile(raw.xm, raw.xh || '', raw.xy || '', raw.zy || '', raw.xzb || '')
        }).catch(() => {})
      }
    }
    
    // 核心：如果 useAuth 缓存中已有新头像和网名，用缓存覆盖初始数据
    const cachedUser = localStorage.getItem('user')
    if (cachedUser) {
      try {
        const uObj = JSON.parse(cachedUser)
        if (uObj.avatar) {
          profileUser.value.avatar = uObj.avatar
        }
        if (uObj.name) {
          profileUser.value.name = uObj.name
        }
      } catch {}
    }
  } else {
    // 访问他人主页
    const sellerName = books.value.length > 0 ? books.value[0].seller : targetUserId
    profileUser.value = {
      id: targetUserId,
      name: sellerName,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${targetUserId}`,
      bio: `Ta在浙里淘书发布了 ${books.value.length} 本闲置书籍`,
      credit: books.value.length > 0 ? books.value[0].credit : 4.8,
      studentId: '', college: '', major: '', classText: ''
    }
    tabs.value = [
      { id: 'books', label: 'Ta 的闲置', icon: 'Package' }
    ]
  }
})

const handleWishDeleted = (wishId) => {
  wishes.value = wishes.value.filter((w) => w.id !== wishId)
}
</script>

<template>
  <ProfileLoginPrompt v-if="isMe && !isLoggedIn" />
  <div v-else-if="profileUser.id" class="max-w-[1200px] mx-auto flex flex-col gap-8">
    <ProfileHeaderCard :profile-user="profileUser" :is-me="isMe" @edit-avatar="openAvatarModal" />
    <div class="flex gap-8">
      <ProfileSidebar v-model:activeTab="activeTab" :profile-user="profileUser" :tabs="tabs" :icon-map="iconMap" />
      <ProfileTabContent :active-tab="activeTab" :tabs="tabs" :orders="orders" :books="books" :wishes="wishes" :notifications="notifications" :favorite-books="favoriteBooks" @wish-deleted="handleWishDeleted" />
    </div>
  </div>

  <!-- 精致修改头像弹窗 -->
  <transition name="fade">
    <div v-if="showAvatarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white/90 border border-slate-100/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] w-full max-w-md overflow-hidden animate-zoom-in backdrop-blur-xl relative p-8">
        
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-black text-gray-900 tracking-tight">自定义个性头像</h3>
          <button @click="showAvatarModal = false" class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- 骰子旋转在线骰出生成区 -->
        <div class="flex flex-col items-center gap-4 my-6">
          <div class="relative group select-none">
            <!-- 倾斜微调头像容器 -->
            <div class="w-32 h-32 rounded-[28px] border-4 border-white shadow-xl bg-white overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-300">
              <img :src="newAvatarUrl" class="w-full h-full object-cover" />
            </div>
            
            <!-- 极速旋转抖动骰子 -->
            <button @click="rollDice" class="absolute -bottom-2 -right-2 w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-blue-200 border-2 border-white transition-all group" title="点击在线随机生成">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5.5 w-5.5 transition-transform duration-700" :class="{ 'rotate-[360deg] scale-110': diceRotating }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M12 12h.01"/><path d="M16 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M8 8h.01"/></svg>
            </button>
          </div>
          <p class="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">点击小骰子，在线随机骰出独有个性头像</p>
        </div>

        <!-- 选项大合集 -->
        <div class="space-y-5">
          <!-- 预置精品预设 -->
          <div>
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">精选快捷预设</h4>
            <div class="flex items-center gap-3.5">
              <button v-for="(url, idx) in presetAvatars" :key="idx" @click="selectPreset(url)" class="w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105" :class="newAvatarUrl === url ? 'border-blue-600 scale-105 shadow-md shadow-blue-100' : 'border-gray-100 hover:border-gray-300'">
                <img :src="url" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- 本地高清照片拖拽上传 -->
          <div>
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">本地照片文件上传</h4>
            <label class="group border-2 border-dashed border-gray-200/80 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/10">
              <input type="file" accept="image/*" class="hidden" @change="handleFileChange" />
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg>
              <span class="text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors truncate max-w-xs">
                {{ uploadFile ? `已选：${uploadFile.name}` : '点击或将图片拖拽至此上传' }}
              </span>
            </label>
          </div>
        </div>

        <!-- 按钮面板 -->
        <div class="flex gap-4 mt-6">
          <button @click="showAvatarModal = false" class="flex-1 h-11 rounded-2xl border border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all">取消</button>
          <button @click="saveAvatar" :disabled="savingAvatar" class="flex-1 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
            <svg v-if="savingAvatar" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>{{ savingAvatar ? '保存中...' : '确认应用新头像' }}</span>
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>
