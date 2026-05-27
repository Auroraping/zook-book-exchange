<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { X, Heart, MessageSquare, Sparkles, CheckCircle2, User, Clock, Tag } from 'lucide-vue-next'
import { postJson } from '../composables/useApi.js'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  wish: { type: Object, default: null }
})
const emit = defineEmits(['close', 'coseek'])

const router = useRouter()
const isConnecting = ref(false)
const isCoseeking = ref(false)

// 检查当前用户 "me" 是否已经同求过
const hasCoseeked = computed(() => {
  if (!props.wish) return false
  const seekers = props.wish.coSeekers || []
  return seekers.includes('me')
})

// 计算当前总同求人数（基础 1 人，即发起人自己，加 coSeekers 数量）
const seekerCount = computed(() => {
  if (!props.wish) return 1
  const seekers = props.wish.coSeekers || []
  // 去除发起人 me 的重复计数
  const uniqueSeekers = seekers.filter(s => s !== props.wish.userId)
  return 1 + uniqueSeekers.length
})

// “我有这本，去沟通”
const startChat = async () => {
  if (!props.wish) return
  isConnecting.value = true
  try {
    const initialMsg = `同学你好！我看到你求购《${props.wish.title}》这本教材，我手头正好有一本闲置的，成色非常不错，想要转给你！我们可以沟通一下交易详情吗？`
    
    await postJson('/api/chats', {
      contactId: props.wish.userId || 'u1', // 默认防空
      contactName: props.wish.userName || '浙大同学',
      avatar: props.wish.avatar,
      initialMsg: initialMsg,
      bookTitle: props.wish.title
    })
    
    emit('close')
    // 带有 activeId 跳转到聊天页面，ChatPage.vue 会读取该参数并自动聚焦
    router.push({ path: '/chat', query: { activeId: props.wish.userId } })
  } catch (err) {
    console.error('建立会话失败：', err)
    alert(err.message || '沟通建立失败，请重试')
  } finally {
    isConnecting.value = false
  }
}

// “同求此书”
const coseekWish = async () => {
  if (!props.w<template>
  <Teleport to="body">
    <div v-if="isOpen && wish" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <!-- 遮罩 -->
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" @click="emit('close')"></div>

      <!-- 卡片主体 -->
      <div class="relative w-full max-w-lg bg-white border border-gray-100 rounded-[32px] shadow-2xl overflow-hidden transform transition-all z-10 animate-google-in p-8">
        <!-- 头部关闭 -->
        <button @click="emit('close')" class="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
          <X class="w-5 h-5" />
        </button>

        <!-- 心愿发起人 -->
        <div class="flex items-center gap-3.5 mb-6 pb-5 border-b border-gray-100">
          <img :src="wish.avatar" :alt="wish.userName" class="w-12 h-12 rounded-full border border-purple-100 shadow-sm bg-purple-50 object-cover" />
          <div>
            <div class="flex items-center gap-2">
              <span class="font-black text-gray-800 text-sm">{{ wish.userName }}</span>
              <span class="bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-0.5">
                <Sparkles class="w-2.5 h-2.5" /> 发起求购
              </span>
            </div>
            <span class="text-[10px] text-gray-400 flex items-center gap-1 mt-1"><Clock class="w-3 h-3" /> 发布于 {{ wish.timestamp }}</span>
          </div>
        </div>

        <!-- 书籍核心详情 -->
        <div class="mb-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
          <div class="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Heart class="w-3 h-3 text-purple-500 fill-purple-200" /> 心愿求购单
          </div>
          <h3 class="text-2xl font-black text-gray-900 leading-tight mb-2 tracking-tight">{{ wish.title }}</h3>
          <p class="text-sm font-bold text-gray-500">作者：{{ wish.author }}</p>
          
          <!-- 期望价格与热度 -->
          <div class="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <div>
              <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block">期望入手价</span>
              <span class="text-xl font-black text-red-500">¥ {{ wish.priceRange }}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block">当前同求热度</span>
              <span class="text-lg font-black text-purple-600 flex items-center gap-1.5 justify-end">
                <span class="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                {{ seekerCount }} 人同求
              </span>
            </div>
          </div>
        </div>

        <!-- 标签与简要描述 -->
        <div class="mb-8">
          <label class="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2.5">关联标签</label>
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in wish.tags" :key="tag" class="px-3 py-1.5 bg-white text-gray-500 text-[10px] font-bold rounded-full border border-gray-150 flex items-center gap-1 shadow-sm">
              <Tag class="w-3 h-3 text-gray-400" /> {{ tag }}
            </span>
          </div>
        </div>

        <!-- 底部交互操作 -->
        <div class="flex flex-col gap-3">
          <!-- 同求此书按钮 -->
          <button 
            @click="coseekWish" 
            :disabled="hasCoseeked || isCoseeking"
            :class="[
              'w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm',
              hasCoseeked 
                ? 'bg-purple-50 text-purple-500 border border-purple-200 cursor-not-allowed' 
                : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50/50'
            ]"
          >
            <CheckCircle2 v-if="hasCoseeked" class="w-4.5 h-4.5" />
            <Heart v-else class="w-4.5 h-4.5" />
            <span>{{ hasCoseeked ? '已同求此书（静候佳音）' : isCoseeking ? '同求提交中...' : '同求此书（我也要）' }}</span>
          </button>

          <!-- 去沟通按钮 -->
          <button 
            @click="startChat" 
            :disabled="isConnecting"
            class="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:bg-purple-300 disabled:cursor-not-allowed"
          >
            <span v-if="isConnecting" class="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <MessageSquare v-else class="w-4.5 h-4.5" />
            <span>我有这本书，去联系求购者</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
