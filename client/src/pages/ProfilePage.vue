<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { Package, Heart, BookMarked, Settings, ShieldCheck, Lock, Calendar, Star, Sparkles, Bell, ChevronRight } from 'lucide-vue-next'

const { user, isLoggedIn, updateUser } = useAuth()
const activeTab = ref('orders')
const orders = ref([])
const books = ref([])
const wishes = ref([])
const notifications = ref([])

const profileUser = ref({
  id: 'me', name: '张同学', credit: 4.9, tradeCount: 15,
  level: 'V4 铂金买家', avatar: '/user_avatar.png',
  bio: '浙大19级老学长，求购各种经管类书籍。', joinDate: '2023-10-01',
  studentId: '', college: '', major: '', classText: ''
})

onMounted(async () => {
  const [ordersRes, booksRes, wishesRes, notifsRes] = await Promise.all([
    fetch('/data/orders.json'), fetch('/data/books.json'), fetch('/data/wishes.json'), fetch('/data/notifications.json')
  ])
  orders.value = await ordersRes.json()
  books.value = await booksRes.json()
  wishes.value = await wishesRes.json()
  notifications.value = await notifsRes.json()

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
      fetch('http://localhost:3001/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      .then(res => res.json())
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

const tabs = [
  { id: 'orders', label: '我的买卖订单', icon: Package },
  { id: 'favorites', label: '我收藏的心仪书籍', icon: Heart },
  { id: 'wishes', label: '购书心愿单', icon: Sparkles },
  { id: 'notifications', label: '消息通知中心', icon: Bell },
  { id: 'listings', label: '我发布的书籍', icon: BookMarked },
]
</script>

<template>
  <div v-if="!isLoggedIn" class="max-w-[1000px] mx-auto py-12 flex flex-col items-center justify-center text-center">
    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300"><Lock class="w-12 h-12" /></div>
    <h2 class="text-2xl font-black text-gray-800 mb-2">欢迎来到求书个人中心</h2>
    <p class="text-gray-500 mb-8 max-w-md">登录后即可查看您的买卖订单、学期省钱指数以及您收藏的心仪书籍。</p>
    <RouterLink to="/login" class="bg-blue-600 text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all hover:-translate-y-1">立即极速登录</RouterLink>
  </div>
  <div v-else class="max-w-[1200px] mx-auto flex flex-col gap-8">
    <!-- 头部卡片 -->
    <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="h-40 bg-gradient-to-r from-blue-600 to-blue-400 relative"><div class="absolute inset-0 opacity-20"></div></div>
      <div class="px-12 pb-8 relative">
        <div class="flex justify-between items-end">
          <div class="flex items-end gap-8 mt-[-60px]">
            <div class="relative"><img :src="profileUser.avatar" class="w-40 h-40 rounded-3xl border-[6px] border-white shadow-xl bg-white object-cover" /><div v-if="profileUser.credit >= 4.8" class="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-xl shadow-lg border-2 border-white"><Star class="w-5 h-5 fill-current" /></div></div>
            <div class="mb-2">
              <div class="flex items-center gap-3 mb-1"><h2 class="text-3xl font-black text-gray-800">{{ profileUser.name }}</h2><span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100">{{ profileUser.level }}</span></div>
              <p class="text-gray-500 font-medium text-sm mb-3">{{ profileUser.bio }}</p>
              
              <!-- 浙大教务系统真实同步信息徽章 -->
              <div v-if="profileUser.studentId" class="flex flex-wrap gap-2 mb-4">
                <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">学院：{{ profileUser.college }}</span>
                <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">专业：{{ profileUser.major }}</span>
                <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">班级：{{ profileUser.classText }}</span>
                <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">学号：{{ profileUser.studentId }}</span>
              </div>
              <div v-else class="mb-4">
                <RouterLink to="/schedule" class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-all shadow-sm">
                  <span>💡 提示：前往「我的课表」同步教务，即可一键完成实名认证</span>
                </RouterLink>
              </div>

              <div class="flex items-center gap-6">
                <div class="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Calendar class="w-4 h-4" /> 加入时间: {{ profileUser.joinDate }}</div>
                <div class="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <ShieldCheck :class="['w-4 h-4', profileUser.studentId ? 'text-green-500' : 'text-gray-300']" /> 
                  {{ profileUser.studentId ? '已通过浙大统一身份认证' : '未完成统一身份认证' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-8">
      <!-- 左侧菜单 -->
      <div class="w-[320px] shrink-0 flex flex-col gap-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">求书信誉体系</h4>
          <div class="flex items-center justify-between mb-2"><span class="text-sm font-bold text-gray-600">社区信誉评分</span><div class="flex items-center gap-1"><Star class="w-4 h-4 text-yellow-500 fill-current" /><span class="text-lg font-black text-gray-800">{{ profileUser.credit }}</span><span class="text-xs text-gray-400">/ 5.0</span></div></div>
          <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full" :style="{ width: `${profileUser.credit * 20}%` }"></div></div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="['w-full flex items-center justify-between p-3 rounded-xl transition-colors group', activeTab === tab.id ? 'bg-blue-50' : 'hover:bg-gray-50']">
            <div :class="['flex items-center gap-3 text-sm font-semibold', activeTab === tab.id ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600']"><component :is="tab.icon" :class="['w-5 h-5', activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600']" /> {{ tab.label }}</div>
            <ChevronRight :class="['w-4 h-4', activeTab === tab.id ? 'text-blue-600' : 'text-gray-300']" />
          </button>
        </div>
      </div>
      <!-- 右侧内容 -->
      <div class="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-gray-100"><h3 class="font-black text-gray-800 text-xl">{{ tabs.find((t) => t.id === activeTab)?.label }}</h3></div>
        <div class="p-8">
          <!-- 订单 -->
          <div v-if="activeTab === 'orders'" class="flex flex-col gap-6">
            <div v-for="order in orders" :key="order.id" class="border border-gray-100 rounded-3xl p-6 hover:border-blue-200 hover:shadow-md transition-all flex gap-6">
              <img :src="order.cover" class="w-20 h-28 bg-gray-50 rounded-2xl object-cover shadow-sm" />
              <div class="flex-1"><h4 class="font-bold text-gray-800 text-lg mb-1">{{ order.title }}</h4><p class="text-xs text-gray-400 mb-2">卖家: {{ order.seller }}</p><span class="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{{ order.status }}</span></div>
              <div class="text-right"><p class="text-2xl font-black text-gray-800">¥ {{ order.price.toFixed(2) }}</p><p class="text-[10px] text-gray-400 mt-1 font-bold">{{ order.date }}</p></div>
            </div>
          </div>
          <!-- 心愿单 -->
          <div v-else-if="activeTab === 'wishes'" class="flex flex-col gap-4">
            <div v-for="wish in wishes.filter((w) => w.userId === 'u1')" :key="wish.id" class="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <h4 class="text-xl font-black text-gray-800 mb-2">{{ wish.title }}</h4>
              <p class="text-sm text-gray-500">作者: {{ wish.author }} | 期望价格: ¥{{ wish.priceRange }}</p>
            </div>
            <div v-if="wishes.filter((w) => w.userId === 'u1').length === 0" class="py-24 text-center"><Sparkles class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">还没有登记任何心愿</p></div>
          </div>
          <!-- 通知 -->
          <div v-else-if="activeTab === 'notifications'" class="flex flex-col gap-4">
            <div v-for="notif in notifications" :key="notif.id" class="p-6 rounded-3xl border bg-white border-blue-100 shadow-sm flex gap-6">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 shadow-sm"><Sparkles class="w-7 h-7" /></div>
              <div class="flex-1"><h4 class="font-black text-gray-800 text-lg">{{ notif.title }}</h4><p class="text-sm text-gray-500 leading-relaxed mt-2 mb-4">{{ notif.content }}</p>
                <RouterLink v-if="notif.bookId" :to="`/book/${notif.bookId}`" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-200">立即去看看 <ChevronRight class="w-4 h-4" /></RouterLink>
              </div>
            </div>
          </div>
          <!-- 在售书籍 -->
          <div v-else-if="activeTab === 'listings'" class="grid grid-cols-3 gap-6">
            <RouterLink v-for="book in books.filter((b) => b.sellerId === 'u1' && b.status === 'approved')" :key="book.id" :to="`/book/${book.id}`" class="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group flex flex-col">
              <div class="h-44 overflow-hidden"><img :src="book.cover" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" /></div>
              <div class="p-5 flex-1 flex flex-col"><h4 class="font-bold text-gray-800 text-xs mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{{ book.title }}</h4><div class="mt-auto flex justify-between items-end"><div class="text-xl font-black text-gray-800">¥ {{ book.price }}</div></div></div>
            </RouterLink>
          </div>
          <!-- 收藏 -->
          <div v-else class="py-24 text-center"><Heart class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">你的收藏夹空空如也</p><RouterLink to="/books" class="mt-4 text-blue-600 font-bold text-sm hover:underline inline-block">去发现好书</RouterLink></div>
        </div>
      </div>
    </div>
  </div>
</template>
