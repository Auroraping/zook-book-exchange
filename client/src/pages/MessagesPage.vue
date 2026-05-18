<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Send, Bell, CheckCircle2, Tag } from 'lucide-vue-next'

const route = useRoute()
const books = ref([])
const activeChatId = ref(route.path === '/notifications' ? 'system' : 1)

const systemNotifications = [
  { id: 'wish', title: '心仪教材降价', content: '你求购的《离散数学》刚刚有同学大幅降价上架，建议尽快查看。', tone: 'red', time: '刚刚' },
  { id: 'order', title: '交易成功', content: '系统已确认买家签收了你的书籍，本次流转记录已计入信誉评分。', tone: 'green', time: '20分钟前' }
]

onMounted(async () => {
  const res = await fetch('/data/books.json')
  books.value = await res.json()
})

const chats = ref([
  { id: 'system', type: 'system', name: '消息通知', lastMsg: '心仪教材降价、订单动态和社区公告都在这里。', time: '刚刚', unread: 2 },
  { id: 1, type: 'chat', name: '计科王学长', lastMsg: '这本高数我确实笔记拉满了，可以再给你便宜 2 块钱。', time: '10分钟前', unread: 1, bookIdx: 0 },
  { id: 2, type: 'chat', name: '管院小张', lastMsg: '还在吗？你要的话我就下楼了，紫金港二餐见。', time: '1小时前', unread: 0, bookIdx: 3 },
])

const activeChat = ref(null)
const updateActiveChat = () => {
  activeChat.value = chats.value.find((c) => c.id === activeChatId.value) || chats.value[0]
}
updateActiveChat()
</script>

<template>
  <div class="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
    <div class="w-[340px] bg-gray-50/50 border-r border-gray-100 flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bell class="w-5 h-5" /></div>
          <div><h2 class="font-black text-gray-900">消息通知</h2><p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chats & Updates</p></div>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <button v-for="chat in chats" :key="chat.id" @click="activeChatId = chat.id; updateActiveChat()" :class="['w-full text-left px-5 py-4 cursor-pointer transition-all flex gap-4 items-center border-b border-gray-100/70', activeChatId === chat.id ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50']">
          <div class="relative shrink-0">
            <div v-if="chat.type === 'system'" class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center"><Bell class="w-6 h-6" /></div>
            <img v-else :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`" class="w-12 h-12 rounded-full border border-gray-100 bg-white" />
            <span v-if="chat.unread > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">{{ chat.unread }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center mb-1"><h4 class="font-medium text-gray-800 text-sm truncate">{{ chat.name }}</h4><span class="text-[10px] text-gray-400">{{ chat.time }}</span></div>
            <p class="text-xs text-gray-400 truncate">{{ chat.lastMsg }}</p>
          </div>
        </button>
      </div>
    </div>
    <div class="flex-1 flex flex-col bg-white">
      <div class="h-[72px] px-8 flex items-center justify-between border-b border-gray-50">
        <div class="flex items-center gap-4">
          <h3 class="font-medium text-lg text-gray-800">{{ activeChat?.name }}</h3>
          <span :class="['flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full', activeChat?.type === 'system' ? 'text-blue-600 bg-blue-50' : 'text-green-500 bg-green-50']">
            <div :class="['w-1.5 h-1.5 rounded-full', activeChat?.type === 'system' ? 'bg-blue-600' : 'bg-green-500 animate-pulse']"></div>
            {{ activeChat?.type === 'system' ? '消息同步' : '在线' }}
          </span>
        </div>
      </div>
      <!-- 系统通知视图 -->
      <div v-if="activeChat?.type === 'system'" class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
        <div class="max-w-xl mx-auto w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div class="flex items-center gap-3"><div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bell class="w-6 h-6" /></div><div><h4 class="font-black text-gray-900">系统通知已合并到会话</h4><p class="text-xs text-gray-400 font-bold">订单、心愿单、社区公告都会像聊天一样推送。</p></div></div>
        </div>
        <div v-for="notice in systemNotifications" :key="notice.id" class="flex items-start gap-4 max-w-[85%]">
          <div :class="['w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0', notice.tone === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100']">
            <CheckCircle2 v-if="notice.tone === 'green'" class="w-5 h-5" /><Tag v-else class="w-5 h-5" />
          </div>
          <div class="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">
            <div class="flex items-center justify-between gap-8 mb-2"><h4 class="font-black text-gray-900">{{ notice.title }}</h4><span class="text-[10px] font-bold text-gray-400 whitespace-nowrap">{{ notice.time }}</span></div>
            <p class="text-gray-500">{{ notice.content }}</p>
          </div>
        </div>
      </div>
      <!-- 聊天视图 -->
      <template v-else>
        <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
          <div v-if="books.length > 0 && activeChat?.bookIdx !== undefined" class="bg-white google-card !p-4 flex gap-4 w-full max-w-md mx-auto mb-4 border-gray-100 !rounded-2xl">
            <img :src="books[activeChat.bookIdx]?.cover" class="w-14 h-20 object-cover rounded-lg shadow-sm" />
            <div class="flex-1 min-w-0">
              <h5 class="font-medium text-sm text-gray-800 truncate mb-1">{{ books[activeChat.bookIdx]?.title }}</h5>
              <div class="text-[11px] text-gray-400 mb-3 italic">正在协商此商品</div>
              <div class="flex justify-between items-center">
                <span class="text-red-500 font-medium text-lg">¥{{ books[activeChat.bookIdx]?.price }}</span>
                <button class="m3-btn-filled !px-4 !py-1.5 !text-[11px]">立即支付</button>
              </div>
            </div>
          </div>
          <div class="flex items-start gap-4 max-w-[85%]">
            <img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat?.name}`" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm" />
            <div class="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">我已经把重点题目都勾在旁边了。如果不考研的话，这个书基本当字典查。</div>
          </div>
          <div class="flex items-start justify-end gap-4 max-w-[85%] self-end">
            <div class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed">太感谢了学长！我现在在西区食堂，方便当面买吗？</div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white" />
          </div>
        </div>
        <div class="p-6 bg-white border-t border-gray-50 flex flex-col gap-4">
          <div class="flex gap-4">
            <textarea class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-24" placeholder="发送消息..."></textarea>
            <button class="w-14 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:shadow-lg transition-all active:scale-95"><Send class="w-6 h-6" /></button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
