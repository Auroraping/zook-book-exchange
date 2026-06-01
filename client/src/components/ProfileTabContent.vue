<script setup>
import { RouterLink } from 'vue-router'
import { ChevronRight, Heart, Sparkles, Trash2, FileText } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth.js'
import { deleteJson } from '../composables/useApi.js'

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

const emit = defineEmits(['wish-deleted', 'note-deleted'])

const { user } = useAuth()
const currentUserId = user.value?.id || 'me'

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
</script>

<template>
  <div class="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="p-8 border-b border-gray-100"><h3 class="font-black text-gray-800 text-xl">{{ tabs.find((t) => t.id === activeTab)?.label }}</h3></div>
    <div class="p-8">
      <div v-if="activeTab === 'orders'" class="flex flex-col gap-6">
        <div v-for="order in orders" :key="order.id" class="border border-gray-100 rounded-3xl p-6 hover:border-blue-200 hover:shadow-md transition-all flex gap-6"><img :src="order.cover" class="w-20 h-28 bg-gray-50 rounded-2xl object-cover shadow-sm" /><div class="flex-1"><h4 class="font-bold text-gray-800 text-lg mb-1">{{ order.title }}</h4><p class="text-xs text-gray-400 mb-2">卖家：{{ order.seller }}</p><span class="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{{ order.status }}</span></div><div class="text-right"><p class="text-2xl font-black text-gray-800">¥ {{ order.price.toFixed(2) }}</p><p class="text-[10px] text-gray-400 mt-1 font-bold">{{ order.date }}</p></div></div>
      </div>
      <div v-else-if="activeTab === 'wishes'" class="flex flex-col gap-4">
        <div v-for="wish in wishes.filter((w) => w.userId === currentUserId)" :key="wish.id" class="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex justify-between items-center"><div><h4 class="text-xl font-black text-gray-800 mb-2">{{ wish.title }}</h4><p class="text-sm text-gray-500">作者：{{ wish.author }} | 预算：¥{{ wish.priceRange }}</p></div><button @click="handleDeleteWish(wish)" class="p-3 bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105 active:scale-95 rounded-2xl transition-all" title="删除心愿"><Trash2 class="w-5 h-5" /></button></div>
        <div v-if="wishes.filter((w) => w.userId === currentUserId).length === 0" class="py-24 text-center"><Sparkles class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">暂无心愿</p></div>
      </div>
      <div v-else-if="activeTab === 'notes'" class="flex flex-col gap-4">
        <div v-for="note in notes.filter((n) => n.userId === currentUserId || (n.userId === 'me' && currentUserId === 'u202605271552105251') || (n.userId === 'u202605271552105251' && currentUserId === 'me'))" :key="note.id" class="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex justify-between items-center">
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
        <div v-if="notes.filter((n) => n.userId === currentUserId || (n.userId === 'me' && currentUserId === 'u202605271552105251') || (n.userId === 'u202605271552105251' && currentUserId === 'me')).length === 0" class="py-24 text-center"><FileText class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">暂无社区发布</p></div>
      </div>
      <div v-else-if="activeTab === 'notifications'" class="flex flex-col gap-4">
        <div v-for="notif in notifications" :key="notif.id" class="p-6 rounded-3xl border bg-white border-blue-100 shadow-sm flex gap-6"><div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 shadow-sm"><Sparkles class="w-7 h-7" /></div><div class="flex-1"><h4 class="font-black text-gray-800 text-lg">{{ notif.title }}</h4><p class="text-sm text-gray-500 leading-relaxed mt-2 mb-4">{{ notif.content }}</p><RouterLink v-if="notif.bookId" :to="`/book/${notif.bookId}`" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-200">查看书籍<ChevronRight class="w-4 h-4" /></RouterLink></div></div>
      </div>
      <div v-else-if="activeTab === 'listings'" class="grid grid-cols-3 gap-6">
        <RouterLink v-for="book in books.filter((b) => b.sellerId === currentUserId)" :key="book.id" :to="`/book/${book.id}`" class="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group flex flex-col"><div class="h-44 overflow-hidden"><img :src="book.cover" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" /></div><div class="p-5 flex-1 flex flex-col"><h4 class="font-bold text-gray-800 text-xs mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{{ book.title }}</h4><div class="mt-auto flex justify-between items-end"><div class="text-xl font-black text-gray-800">¥ {{ book.price }}</div></div></div></RouterLink>
      </div>
      <div v-else-if="favoriteBooks.length > 0" class="grid grid-cols-2 gap-4"><RouterLink v-for="book in favoriteBooks" :key="book.id" :to="`/book/${book.id}`" class="rounded-3xl border border-gray-100 p-5 hover:border-blue-200"><h4 class="font-black text-gray-800 mb-2">{{ book.title }}</h4><p class="text-sm text-gray-500">{{ book.seller }} - ¥{{ book.price }}</p></RouterLink></div>
      <div v-else class="py-24 text-center"><Heart class="w-16 h-16 text-gray-100 mx-auto mb-4" /><p class="text-gray-400 font-black">暂无收藏</p><RouterLink to="/books" class="mt-4 text-blue-600 font-bold text-sm hover:underline inline-block">去逛广场</RouterLink></div>
    </div>
  </div>
</template>
