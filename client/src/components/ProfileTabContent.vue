<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ChevronRight, Heart, Sparkles, Trash2, FileText, CreditCard, Package } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth.js'
import { deleteJson, postJson, patchJson } from '../composables/useApi.js'
import { getStored } from '../composables/useSessionStore.js'

const props = defineProps({
  activeTab: { type: String, required: true },
  tabs: { type: Array, required: true },
  orders: { type: Array, required: true },
  books: { type: Array, required: true },
  wishes: { type: Array, required: true },
  notifications: { type: Array, required: true },
  favoriteBooks: { type: Array, required: true },
  notes: { type: Array, default: () => [] }
})

const emit = defineEmits(['wish-deleted', 'note-deleted', 'favorite-deleted', 'order-updated'])

const router = useRouter()
const { user } = useAuth()
const currentUserId = user.value?.realId || getStored('zook_user_uuid') || 'me'

const statusMap = {
  unpaid: { label: '待支付', class: 'bg-orange-50 text-orange-600 border border-orange-100' },
  paid_unconfirmed: { label: '已付款待收款', class: 'bg-amber-50 text-amber-600 border border-amber-100' },
  paid: { label: '卖家已收款', class: 'bg-blue-50 text-blue-600 border border-blue-100' },
  delivered: { label: '已发货待确认', class: 'bg-purple-50 text-purple-600 border border-purple-100' },
  completed: { label: '交易完成', class: 'bg-green-50 text-green-600 border border-green-100' },
  cancelled: { label: '已关闭', class: 'bg-gray-50 text-gray-400 border border-gray-100' }
}

const getStatusStyle = (status) => statusMap[status] || statusMap.cancelled

const handleOrderAction = async (order, action) => {
  try {
    const res = await patchJson(`/api/orders/${order.id}`, { action })
    if (res.success) {
      if (res.order.status === 'completed') {
        alert('🎉 交易已圆满完成！您与交易对方各获得 5 积分奖励！')
      }
      emit('order-updated')
    } else {
      alert(res.message || '操作失败，请重试')
    }
  } catch (err) {
    alert(err.message || '网络连接失败，请检查服务状态后重试。')
  }
}

const handleDeleteWish = async (wish) => {
  if (confirm(`确定要删除购书心愿《${wish.title}》吗？删除后将无法恢复。`)) {
    try {
      const res = await deleteJson(`/api/wishes/${wish.id}?userId=${currentUserId}`)
      if (res.success) {
        emit('wish-deleted', wish.id)
      } else {
        alert(res.message || '删除失败，请重试')
      }
    } catch (err) {
      alert(err.message || '网络连接异常，删除失败。')
    }
  }
}

const handleDeleteNote = async (note) => {
  if (confirm(`确定要删除您分享的考前复习资料《${note.title}》吗？此操作不可逆。`)) {
    try {
      const res = await deleteJson(`/api/notes/${note.id}?userId=${currentUserId}`)
      if (res.success) {
        emit('note-deleted', note.id)
      } else {
        alert(res.message || '删除失败，请重试')
      }
    } catch (err) {
      alert(err.message || '网络连接异常，删除失败。')
    }
  }
}

const handleRemoveFavorite = async (book) => {
  if (confirm(`确定要将《${book.title}》移出心仪书籍吗？`)) {
    try {
      const res = await postJson('/api/favorites/toggle', { userId: currentUserId, bookId: book.id })
      if (res.success) {
        emit('favorite-deleted', book.id)
      } else {
        alert(res.message || '移除失败，请重试')
      }
    } catch (err) {
      alert(err.message || '网络连接异常，移除失败。')
    }
  }
}
</script>

<template>
  <div class="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="p-8 border-b border-gray-100"><h3 class="font-black text-gray-800 text-xl">{{ tabs.find((t) => t.id === activeTab)?.label }}</h3></div>
    <div class="p-8">
      <div v-if="activeTab === 'orders'" class="flex flex-col gap-6">
        <div v-for="order in orders" :key="order.id" class="border border-gray-100 rounded-[28px] p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row gap-6 bg-white relative overflow-hidden">
          <img :src="order.cover" class="w-20 h-28 bg-gray-50 rounded-2xl object-cover shadow-sm shrink-0" />
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <h4 class="font-black text-gray-800 text-lg mb-1 leading-snug">{{ order.title }}</h4>
              <p class="text-xs text-gray-400 font-bold mb-3">卖家：<span class="text-gray-600">{{ order.seller }}</span></p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <span :class="['text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm', getStatusStyle(order.status).class]">
                {{ getStatusStyle(order.status).label }}
              </span>
              <!-- 买家视图：未支付时显示支付按钮，点击跳转至订单中心待支付选项卡 -->
              <button v-if="order.status === 'unpaid' && order.userId === currentUserId" @click="router.push('/orders?tab=unpaid')" class="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all active:scale-95">
                <CreditCard class="w-3.5 h-3.5" /> 去支付
              </button>
              <button v-if="order.status === 'paid_unconfirmed' && order.sellerId === currentUserId" @click="handleOrderAction(order, 'confirm_receipt')" class="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all active:scale-95">
                <CreditCard class="w-3.5 h-3.5" /> 我已收款
              </button>
              <button v-if="order.status === 'paid' && order.sellerId === currentUserId" @click="handleOrderAction(order, 'deliver')" class="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all active:scale-95">
                <Package class="w-3.5 h-3.5" /> 我已发货
              </button>
            </div>
          </div>
          <div class="text-right flex flex-col justify-between shrink-0">
            <p class="text-2xl font-black text-gray-800">¥ {{ order.price.toFixed(2) }}</p>
            <p class="text-[10px] text-gray-400 font-bold">{{ order.date }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="activeTab === 'wishes'" class="flex flex-col gap-4">
        <div v-for="wish in wishes.filter((w) => w.userId === currentUserId || (w.coSeekers && w.coSeekers.includes(currentUserId)))" :key="wish.id" class="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex justify-between items-center">
          <div>
            <h4 class="text-xl font-black text-gray-800 mb-2">{{ wish.title }}</h4>
            <p class="text-sm text-gray-500">
              作者：{{ wish.author }} | 期望价：¥{{ wish.priceRange }}
              <span v-if="wish.userId !== currentUserId" class="ml-2 px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded border border-purple-100 shadow-sm">我已同求</span>
            </p>
          </div>
          <button @click="handleDeleteWish(wish)" class="p-3 bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105 active:scale-95 rounded-2xl transition-all" :title="wish.userId === currentUserId ? '删除求购心愿' : '取消同求此书'"><Trash2 class="w-5 h-5" /></button>
        </div>
        <div v-if="wishes.filter((w) => w.userId === currentUserId || (w.coSeekers && w.coSeekers.includes(currentUserId))).length === 0" class="py-24 text-center"><Sparkles class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">暂无心愿</p></div>
      </div>
      <div v-else-if="activeTab === 'notes'" class="flex flex-col gap-4">
        <div v-for="note in notes.filter((n) => n.userId === currentUserId)" :key="note.id" class="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex justify-between items-center">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="bg-blue-50 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded border border-blue-100">{{ note.course }}</span>
              <span class="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded border border-slate-200">{{ note.type }}</span>
            </div>
            <RouterLink :to="`/community/note/${note.id}`" class="text-xl font-black text-gray-800 hover:text-blue-600 transition-colors mb-2 block leading-snug">{{ note.title }}</RouterLink>
            <p class="text-xs text-gray-400 font-bold">作者：{{ note.author }} · 👍 点赞 {{ note.likes }} · 📥 下载 {{ note.downloads }} · 更新：{{ note.updatedAt }}</p>
          </div>
          <button @click="handleDeleteNote(note)" class="p-3 bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105 active:scale-95 rounded-2xl transition-all" title="删除笔记"><Trash2 class="w-5 h-5" /></button>
        </div>
        <div v-if="notes.filter((n) => n.userId === currentUserId).length === 0" class="py-24 text-center"><FileText class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">暂无社区发布</p></div>
      </div>
      <div v-else-if="activeTab === 'notifications'" class="flex flex-col gap-4">
        <div v-for="notif in notifications" :key="notif.id" class="p-6 rounded-3xl border bg-white border-blue-100 shadow-sm flex gap-6"><div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 shadow-sm"><Sparkles class="w-7 h-7" /></div><div class="flex-1"><h4 class="font-black text-gray-800 text-lg">{{ notif.title }}</h4><p class="text-sm text-gray-500 leading-relaxed mt-2 mb-4">{{ notif.content }}</p><RouterLink v-if="notif.bookId" :to="`/book/${notif.bookId}`" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-200">查看书籍<ChevronRight class="w-4 h-4" /></RouterLink></div></div>
      </div>
      <div v-else-if="activeTab === 'listings'" class="grid grid-cols-3 gap-6">
        <RouterLink v-for="book in books.filter((b) => b.sellerId === currentUserId)" :key="book.id" :to="`/book/${book.id}`" class="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group flex flex-col"><div class="h-44 overflow-hidden"><img :src="book.cover" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" /></div><div class="p-5 flex-1 flex flex-col"><h4 class="font-bold text-gray-800 text-xs mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{{ book.title }}</h4><div class="mt-auto flex justify-between items-end"><div class="text-xl font-black text-gray-800">¥ {{ book.price }}</div></div></div></RouterLink>
      </div>
      <div v-else-if="activeTab === 'favorites'" class="flex flex-col gap-4">
        <div v-for="book in favoriteBooks" :key="book.id" class="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex justify-between items-center">
          <div>
            <RouterLink :to="`/book/${book.id}`" class="text-xl font-black text-gray-800 hover:text-blue-600 transition-colors mb-2 block leading-snug">{{ book.title }}</RouterLink>
            <p class="text-xs text-gray-400 font-bold">卖家：{{ book.seller }} · 价格：¥{{ book.price.toFixed(2) }}</p>
          </div>
          <button @click="handleRemoveFavorite(book)" class="p-3 bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105 active:scale-95 rounded-2xl transition-all" title="移出心仪书籍"><Trash2 class="w-5 h-5" /></button>
        </div>
        <div v-if="favoriteBooks.length === 0" class="py-24 text-center"><Heart class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">暂无收藏的心仪书籍</p><RouterLink to="/books" class="mt-4 text-blue-600 font-bold text-sm hover:underline inline-block">去逛广场</RouterLink></div>
      </div>
    </div>
  </div>
</template>
