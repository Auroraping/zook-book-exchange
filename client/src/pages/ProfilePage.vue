<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { getJson, postJson } from '../composables/useApi.js'
import { getStored, removeStoredMany, setStored } from '../composables/useSessionStore.js'
import { Bell, BookMarked, Heart, Package, Sparkles, FileText, Star } from 'lucide-vue-next'
import ProfileHeaderCard from '../components/ProfileHeaderCard.vue'
import ProfileLoginPrompt from '../components/ProfileLoginPrompt.vue'
import ProfileNicknameForm from '../components/ProfileNicknameForm.vue'
import ProfileSidebar from '../components/ProfileSidebar.vue'
import ProfileTabContent from '../components/ProfileTabContent.vue'
import ProfileZjuAuthCard from '../components/ProfileZjuAuthCard.vue'

const route = useRoute()
const { isLoggedIn, updateUser } = useAuth()
const targetUserId = route.params.id || 'me'
const isMe = targetUserId === 'me'
const currentAccountId = () => getStored('zook_user_uuid') || 'me'

const initialTab = () => (isMe && typeof route.query.tab === 'string' ? route.query.tab : (isMe ? 'orders' : 'books'))
const activeTab = ref(initialTab())
const orders = ref([])
const books = ref([])
const wishes = ref([])
const notifications = ref([])
const favoriteBooks = ref([])
const notes = ref([])
const tabs = ref([])
const profileUser = ref({})
const nicknameSaving = ref(false)
const nicknameError = ref('')
const zjuAuthLoading = ref(false)
const zjuUnbindLoading = ref(false)
const zjuAuthError = ref('')
const showAvatarModal = ref(false)
const newAvatarUrl = ref('')
const uploadFile = ref(null)
const savingAvatar = ref(false)
const diceRotating = ref(false)
const iconMap = { Package, Heart, Sparkles, Bell, BookMarked, FileText, Star }

const presetAvatars = [
  '/user_avatar.png',
  '/avatar_user_1776602211333.png'
]

const openAvatarModal = () => {
  newAvatarUrl.value = profileUser.value.avatar || '/user_avatar.png'
  uploadFile.value = null
  showAvatarModal.value = true
}

const rollDice = () => {
  if (diceRotating.value) return
  diceRotating.value = true
  setTimeout(() => { diceRotating.value = false }, 800)
  const pool = ['/user_avatar.png', '/avatar_user_1776602211333.png']
  newAvatarUrl.value = pool[Math.floor(Math.random() * pool.length)]
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
    newAvatarUrl.value = event.target.result
  }
  reader.readAsDataURL(file)
}

const saveAvatar = async () => {
  if (savingAvatar.value) return
  savingAvatar.value = true
  try {
    let finalAvatarUrl = ''
    if (uploadFile.value) {
      const formData = new FormData()
      formData.append('file', uploadFile.value)
      formData.append('userId', profileUser.value.realId || profileUser.value.id || 'me')
      const res = await fetch('/api/user/update', { method: 'POST', body: formData }).then((r) => r.json())
      if (!res.success) throw new Error(res.message)
      finalAvatarUrl = res.avatar
    } else {
      const res = await postJson('/api/user/update', {
        userId: profileUser.value.realId || profileUser.value.id || 'me',
        avatar: newAvatarUrl.value
      })
      if (!res.success) throw new Error(res.message)
      finalAvatarUrl = res.avatar
    }
    profileUser.value.avatar = finalAvatarUrl
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
  profileUser.value.zjuAuthenticated = true
  profileUser.value.bio = `浙江大学${coll || ''}${maj || ''}专业用户，已完成教务身份同步。`
}

const cacheZjuProfile = (raw) => {
  setStored('zook_real_name', raw.xm)
  setStored('zook_student_id', raw.xh)
  setStored('zook_college', raw.xy)
  setStored('zook_major', raw.zy)
  setStored('zook_class', raw.xzb)
}

const clearZjuProfile = () => {
  removeStoredMany(['zook_real_name', 'zook_student_id', 'zook_college', 'zook_major', 'zook_class'])
}

const zjuClearedUser = (baseUser) => ({
  ...baseUser,
  realName: '',
  studentId: '',
  college: '',
  major: '',
  class: '',
  classText: '',
  zjuUsername: '',
  zjuAuthenticated: false,
  scheduleSyncedAt: '',
  scheduleData: {},
  bio: '邮箱注册用户。'
})

onMounted(async () => {
  const accountId = currentAccountId()
  const [ordersData, booksData, wishesData, noticesData, favoritesData, uiRes, notesData, publicUserData] = await Promise.all([
    isMe ? getJson(`/api/orders?userId=${accountId}`) : { orders: [] },
    getJson(isMe ? '/api/books' : `/api/books?sellerId=${targetUserId}`),
    getJson('/api/wishes'),
    isMe ? getJson(`/api/notifications?userId=${accountId}`) : { notifications: [] },
    isMe ? getJson(`/api/favorites?userId=${accountId}`) : { items: [] },
    getJson('/api/ui'),
    getJson('/api/notes'),
    isMe ? { user: null } : getJson(`/api/users/${encodeURIComponent(targetUserId)}`)
  ])
  orders.value = ordersData.orders || []
  books.value = booksData.books || []
  wishes.value = wishesData.wishes || []
  notifications.value = noticesData.notifications || []
  favoriteBooks.value = favoritesData.items || []
  notes.value = notesData.notes || []

  if (isMe) {
    let cachedInfo = {}
    const cachedUser = getStored('user')
    if (cachedUser) {
      try {
        cachedInfo = JSON.parse(cachedUser) || {}
      } catch {}
    }
    profileUser.value = {
      ...(uiRes.profile?.defaultUser || {}),
      ...cachedInfo,
      zjuAuthenticated: !!cachedInfo.zjuAuthenticated
    }
    tabs.value = uiRes.profile?.tabs || []
    if (cachedInfo.zjuAuthenticated && cachedInfo.realName) {
      hydrateRealProfile(cachedInfo.realName, cachedInfo.studentId, cachedInfo.college, cachedInfo.major, cachedInfo.class)
    }
  } else {
    const seller = publicUserData.user || books.value[0]?.sellerProfile || {}
    const sellerName = seller.name || books.value[0]?.seller || targetUserId
    profileUser.value = {
      ...seller,
      id: targetUserId,
      name: sellerName,
      avatar: seller.avatar || '/user_avatar.png',
      bio: seller.bio || `Ta 在浙里淘书发布了 ${books.value.length} 本闲置书籍`,
      credit: books.value.length > 0 ? books.value[0].credit : (seller.credit || 5.0),
      classText: seller.classText || seller.class || '',
      zjuAuthenticated: !!seller.zjuAuthenticated
    }
    tabs.value = [{ id: 'books', label: 'Ta 的闲置', icon: 'Package' }]
  }

  if (isMe && ordersData.points !== undefined) {
    profileUser.value.points = ordersData.points
    updateUser({ points: ordersData.points })
  }
})

watch(
  () => route.query.tab,
  (tab) => {
    if (isMe && typeof tab === 'string') activeTab.value = tab
  }
)

const handleWishDeleted = (wishId) => {
  wishes.value = wishes.value.filter((w) => w.id !== wishId)
}

const handleNoteDeleted = (noteId) => {
  notes.value = notes.value.filter((n) => n.id !== noteId)
}

const handleFavoriteDeleted = (bookId) => {
  favoriteBooks.value = favoriteBooks.value.filter((b) => b.id !== bookId)
}

const handleOrderUpdated = async () => {
  const accountId = currentAccountId()
  const [ordersData, favoritesData] = await Promise.all([
    isMe ? getJson(`/api/orders?userId=${accountId}`) : { orders: [] },
    isMe ? getJson(`/api/favorites?userId=${accountId}`) : { items: [] }
  ])
  orders.value = ordersData.orders || []
  favoriteBooks.value = favoritesData.items || []
  if (ordersData.points !== undefined) {
    profileUser.value.points = ordersData.points
    updateUser({ points: ordersData.points })
  }
}

const saveNickname = async (name) => {
  nicknameError.value = ''
  if (!name) {
    nicknameError.value = '昵称不能为空'
    return
  }
  nicknameSaving.value = true
  try {
    const res = await postJson('/api/user/update', { userId: profileUser.value.realId || profileUser.value.id || 'me', name })
    profileUser.value.name = name
    updateUser({ name })
    if (!res.success) nicknameError.value = res.message || ''
  } catch (err) {
    nicknameError.value = err.message || '昵称保存失败'
  } finally {
    nicknameSaving.value = false
  }
}

const authenticateZju = async (payload) => {
  zjuAuthError.value = ''
  zjuAuthLoading.value = true
  try {
    const data = await postJson('/api/auth/zju', payload)
    const nextUser = { ...data.user, id: 'me', realId: data.user.id, classText: data.user.class || '' }
    profileUser.value = { ...profileUser.value, ...nextUser }
    cacheZjuProfile(data.raw || {})
    updateUser(nextUser)
  } catch (err) {
    zjuAuthError.value = err.message || '浙大统一身份认证失败'
  } finally {
    zjuAuthLoading.value = false
  }
}

const unbindZju = async () => {
  if (!confirm('确定取消浙大统一身份认证吗？取消后该账号将显示为未认证，课表会回到模拟课表。')) return
  zjuAuthError.value = ''
  zjuUnbindLoading.value = true
  try {
    const data = await postJson('/api/auth/zju/unbind', {})
    const nextUser = zjuClearedUser({ ...data.user, id: 'me', realId: data.user.id })
    profileUser.value = { ...profileUser.value, ...nextUser }
    clearZjuProfile()
    updateUser(nextUser)
  } catch (err) {
    zjuAuthError.value = err.message || '取消认证失败'
  } finally {
    zjuUnbindLoading.value = false
  }
}
</script>

<template>
  <ProfileLoginPrompt v-if="isMe && !isLoggedIn" />
  <div v-else-if="profileUser.id" class="max-w-[1200px] mx-auto flex flex-col gap-8">
    <ProfileHeaderCard :profile-user="profileUser" :is-me="isMe" @edit-avatar="openAvatarModal" />
    <div v-if="isMe" class="grid md:grid-cols-2 gap-6">
      <ProfileNicknameForm :nickname="profileUser.name" :saving="nicknameSaving" :error="nicknameError" @save="saveNickname" />
      <ProfileZjuAuthCard :profile-user="profileUser" :loading="zjuAuthLoading" :unbinding="zjuUnbindLoading" :error="zjuAuthError" @authenticate="authenticateZju" @unbind="unbindZju" />
    </div>
    <div class="flex gap-8">
      <ProfileSidebar v-model:activeTab="activeTab" :profile-user="profileUser" :tabs="tabs" :icon-map="iconMap" />
      <ProfileTabContent :active-tab="activeTab" :tabs="tabs" :orders="orders" :books="books" :wishes="wishes" :notifications="notifications" :favorite-books="favoriteBooks" :notes="notes" @wish-deleted="handleWishDeleted" @note-deleted="handleNoteDeleted" @favorite-deleted="handleFavoriteDeleted" @order-updated="handleOrderUpdated" />
    </div>
  </div>

  <transition name="fade">
    <div v-if="showAvatarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white/90 border border-slate-100/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] w-full max-w-md overflow-hidden animate-zoom-in backdrop-blur-xl relative p-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-black text-gray-900 tracking-tight">自定义头像</h3>
          <button @click="showAvatarModal = false" class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="flex flex-col items-center gap-4 my-6">
          <div class="relative group select-none">
            <div class="w-32 h-32 rounded-[28px] border-4 border-white shadow-xl bg-white overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-300">
              <img :src="newAvatarUrl" class="w-full h-full object-cover" />
            </div>
            <button @click="rollDice" class="absolute -bottom-2 -right-2 w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-blue-200 border-2 border-white transition-all group" title="点击在线随机生成">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5.5 w-5.5 transition-transform duration-700" :class="{ 'rotate-[360deg] scale-110': diceRotating }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M12 12h.01"/><path d="M16 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M8 8h.01"/></svg>
            </button>
          </div>
          <p class="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">点击按钮随机生成头像</p>
        </div>

        <div class="space-y-5">
          <div>
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">精选头像</h4>
            <div class="flex items-center gap-3.5">
              <button v-for="(url, idx) in presetAvatars" :key="idx" @click="selectPreset(url)" class="w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105" :class="newAvatarUrl === url ? 'border-blue-600 scale-105 shadow-md shadow-blue-100' : 'border-gray-100 hover:border-gray-300'">
                <img :src="url" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <div>
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">本地照片文件上传</h4>
            <label class="group border-2 border-dashed border-gray-200/80 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/10">
              <input type="file" accept="image/*" class="hidden" @change="handleFileChange" />
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg>
              <span class="text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors truncate max-w-xs">
                {{ uploadFile ? `已选择：${uploadFile.name}` : '点击或将图片拖拽至此上传' }}
              </span>
            </label>
          </div>
        </div>

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
