<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { getJson, postJson } from '../composables/useApi.js'
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
const favoriteBooks = ref([])
const tabs = ref([])
const profileUser = ref({})
const iconMap = { Package, Heart, Sparkles, Bell, BookMarked }

const hydrateRealProfile = (name, sid, coll, maj, cls) => {
  profileUser.value.name = name
  profileUser.value.studentId = sid
  profileUser.value.college = coll
  profileUser.value.major = maj
  profileUser.value.classText = cls
  profileUser.value.bio = `浙江大学${coll || ''}${maj || ''}专业本科生，已完成教务身份同步。`
}

onMounted(async () => {
  const [ordersData, booksData, wishesData, noticesData, favoritesData, uiRes] = await Promise.all([
    getJson('/api/orders?userId=me'), getJson('/api/books'), getJson('/api/wishes'), getJson('/api/notifications?userId=me'), getJson('/api/favorites?userId=me'), fetch('/data/ui.json')
  ])
  const ui = await uiRes.json()
  orders.value = ordersData.orders
  books.value = booksData.books
  wishes.value = wishesData.wishes
  notifications.value = noticesData.notifications
  favoriteBooks.value = favoritesData.items
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
})
</script>

<template>
  <ProfileLoginPrompt v-if="!isLoggedIn" />
  <div v-else-if="profileUser.id" class="max-w-[1200px] mx-auto flex flex-col gap-8">
    <ProfileHeaderCard :profile-user="profileUser" />
    <div class="flex gap-8">
      <ProfileSidebar v-model:activeTab="activeTab" :profile-user="profileUser" :tabs="tabs" :icon-map="iconMap" />
      <ProfileTabContent :active-tab="activeTab" :tabs="tabs" :orders="orders" :books="books" :wishes="wishes" :notifications="notifications" :favorite-books="favoriteBooks" />
    </div>
  </div>
</template>
