<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { postJson } from '../composables/useApi.js'
import { Bell, BookMarked, Heart, Package, Sparkles } from 'lucide-vue-next'
import ProfileHeaderCard from '../components/ProfileHeaderCard.vue'
import ProfileLoginPrompt from '../components/ProfileLoginPrompt.vue'
import ProfileSidebar from '../components/ProfileSidebar.vue'
import ProfileTabContent from '../components/ProfileTabContent.vue'

const { isLoggedIn } = useAuth()
const activeTab = ref('orders')
const orders = ref([])
const books = ref([])
const wishes = ref([])
const notifications = ref([])
const tabs = ref([])

const profileUser = ref({})
const iconMap = { Package, Heart, Sparkles, Bell, BookMarked }

onMounted(async () => {
  const [ordersRes, booksRes, wishesRes, notifsRes, uiRes] = await Promise.all([
    fetch('/data/orders.json'), fetch('/data/books.json'), fetch('/data/wishes.json'), fetch('/data/notifications.json'), fetch('/data/ui.json')
  ])
  const ui = await uiRes.json()
  orders.value = await ordersRes.json()
  books.value = await booksRes.json()
  wishes.value = await wishesRes.json()
  notifications.value = await notifsRes.json()
  profileUser.value = { ...(ui.profile?.defaultUser || {}) }
  tabs.value = ui.profile?.tabs || []

  // 动态同步课表拿到的真实浙大身份信息
  let realName = localStorage.getItem('zook_real_name')
  let studentId = localStorage.getItem('zook_student_id')
  let college = localStorage.getItem('zook_college')
  let major = localStorage.getItem('zook_major')
  let classText = localStorage.getItem('zook_class')

  const updateProfileData = (name, sid, coll, maj, cls) => {
    profileUser.value.name = name
    profileUser.value.studentId = sid
    profileUser.value.college = coll
    profileUser.value.major = maj
    profileUser.value.classText = cls
    profileUser.value.bio = `浙江大学${coll || ''}${maj || ''}专业本科生，已完成教务处统一身份认证及信息同步。`
  }

  if (realName) {
    updateProfileData(realName, studentId, college, major, classText)
  } else if (isLoggedIn.value) {
    // 核心智能静默同步：如果用户已登录但本地尚未缓存实名信息，我们在后台静默发起一次同步请求
    const username = localStorage.getItem('zook_username')
    const password = localStorage.getItem('zook_password')
    if (username && password) {
      postJson('/api/schedule', { username, password })
      .then(data => {
        if (data.success && data.raw) {
          const raw = data.raw
          if (raw.xm) localStorage.setItem('zook_real_name', raw.xm)
          if (raw.xh) localStorage.setItem('zook_student_id', raw.xh)
          if (raw.xy) localStorage.setItem('zook_college', raw.xy)
          if (raw.zy) localStorage.setItem('zook_major', raw.zy)
          if (raw.xzb) localStorage.setItem('zook_class', raw.xzb)
          
          updateProfileData(
            raw.xm || '王磊', 
            raw.xh || raw.studentId || '', 
            raw.xy || raw.college || '', 
            raw.zy || raw.major || '', 
            raw.xzb || raw.classText || ''
          )
        }
      })
      .catch(err => {
        console.warn('[Profile] 静默同步真实身份失败:', err)
      })
    }
  }
})

</script>

<template>
  <ProfileLoginPrompt v-if="!isLoggedIn" />
  <div v-else-if="profileUser.id" class="max-w-[1200px] mx-auto flex flex-col gap-8">
    <ProfileHeaderCard :profile-user="profileUser" />
    <div class="flex gap-8">
      <ProfileSidebar v-model:activeTab="activeTab" :profile-user="profileUser" :tabs="tabs" :icon-map="iconMap" />
      <ProfileTabContent :active-tab="activeTab" :tabs="tabs" :orders="orders" :books="books" :wishes="wishes" :notifications="notifications" />
    </div>
  </div>
</template>
