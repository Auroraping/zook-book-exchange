<script setup>
import { ref, onMounted, computed } from 'vue'
import { Heart, Search, Tag, Clock, CheckCircle2, Flame, Plus, Sparkles, X, PenTool } from 'lucide-vue-next'
import WishDetailModal from '../components/WishDetailModal.vue'
import { getJson, postJson } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'

const wishes = ref([])
const searchTerm = ref('')
const isDetailOpen = ref(false)
const selectedWish = ref(null)

// 登记心愿相关响应式状态
const isCreateOpen = ref(false)
const newWishTitle = ref('')
const newWishAuthor = ref('')
const newWishPrice = ref('')
const newWishTagsText = ref('')
const selectedPresetTags = ref([])
const isSubmitting = ref(false)

const presetTags = ['专业课教材', '考研必读', '学术通识', '外语学习', '公选课教材', '技术IT', '其它']

const { user, isLoggedIn } = useAuth()

onMounted(async () => {
  await fetchWishes()
})

const fetchWishes = async () => {
  try {
    wishes.value = (await getJson('/api/wishes')).wishes
  } catch (err) {
    console.error('获取心愿失败：', err)
  }
}

const filteredWishes = computed(() => {
  if (!searchTerm.value.trim()) return wishes.value
  const q = searchTerm.value.toLowerCase()
  return wishes.value.filter((w) => 
    (w.title && w.title.toLowerCase().includes(q)) || 
    (w.author && w.author.toLowerCase().includes(q))
  )
})

const openDetail = (wish) => {
  selectedWish.value = wish
  isDetailOpen.value = true
}

const handleCoseekSuccess = (updatedWish) => {
  const idx = wishes.value.findIndex(w => w.id === updatedWish.id)
  if (idx >= 0) {
    wishes.value[idx] = updatedWish
  }
  selectedWish.value = updatedWish
}

const openCreateModal = () => {
  if (!isLoggedIn.value) {
    alert('请先登录后再登记您的心愿。')
    return
  }
  newWishTitle.value = ''
  newWishAuthor.value = ''
  newWishPrice.value = ''
  newWishTagsText.value = ''
  selectedPresetTags.value = []
  isCreateOpen.value = true
}

const togglePresetTag = (tag) => {
  const idx = selectedPresetTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedPresetTags.value.splice(idx, 1)
  } else {
    selectedPresetTags.value.push(tag)
  }
}

const submitWish = async () => {
  const title = newWishTitle.value.trim()
  if (!title) {
    alert('请填写您想要的心愿书名！')
    return
  }
  isSubmitting.value = true
  try {
    // 聚合预设标签与自定义标签
    const tags = [...selectedPresetTags.value]
    if (newWishTagsText.value.trim()) {
      const customTags = newWishTagsText.value.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
      tags.push(...customTags)
    }
    
    // 如果没有选择任何标签，默认为“求购”
    if (tags.length === 0) {
      tags.push('求购')
    }
    
    const res = await postJson('/api/wishes', {
      userId: user.value?.id || 'me',
      title: title,
      author: newWishAuthor.value.trim() || '待补充',
      priceRange: newWishPrice.value.trim() || '面议',
      tags: Array.from(new Set(tags)) // 去重
    })
    
    if (res.success) {
      isCreateOpen.value = false
      // 重新拉取最新的心愿列表
      await fetchWishes()
    } else {
      throw new Error(res.message || '发布失败')
    }
  } catch (err) {
    console.error('发布心愿失败：', err)
    alert(err.message || '网络连接异常，发布失败。')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-10 animate-google-in">
    <div class="text-center">
      <div class="flex items-center justify-center gap-3 mb-4"><div class="w-10 h-[2px] bg-purple-500"></div><span class="text-[10px] font-black text-purple-650 uppercase tracking-[0.3em]">求购广场</span><div class="w-10 h-[2px] bg-purple-500"></div></div>
      <h1 class="text-5xl font-black text-gray-900 tracking-tight mb-4">心愿广场</h1>
      <p class="text-lg text-gray-550 max-w-2xl mx-auto">在这里登记你想买的书，桃酥 AI 会在全校范围内帮你实时追踪。一旦有人上架，你将第一时间收到通知。</p>
    </div>
    
    <!-- 搜索与高颜值心愿登记按钮 -->
    <div class="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-3xl mx-auto w-full px-4 sm:px-0">
      <div class="flex-1 w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-6 h-14 flex items-center gap-4">
        <Search class="w-5 h-5 text-gray-400" />
        <input v-model="searchTerm" type="text" placeholder="搜索心愿中的书名或作者..." class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" />
      </div>
      <button @click="openCreateModal" class="h-14 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto group">
        <Plus class="w-4.5 h-4.5 group-hover:rotate-90 transition-transform duration-300" />
        <span>登记购书心愿</span>
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article v-for="wish in filteredWishes" :key="wish.id" @click="openDetail(wish)" class="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden">
        <!-- 侧边热度条装饰 -->
        <div v-if="wish.coSeekers && wish.coSeekers.length > 0" class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
        
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <img :src="wish.avatar" :alt="wish.userName" class="w-10 h-10 rounded-full border border-gray-100 object-cover" />
            <div>
              <h4 class="font-bold text-gray-800 text-sm">{{ wish.userName }}</h4>
              <p class="text-[10px] text-gray-400 flex items-center gap-1"><Clock class="w-3 h-3" /> {{ wish.timestamp }}</p>
            </div>
          </div>
          <span :class="['flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full', wish.status === 'seeking' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-green-50 text-green-600 border border-green-100']">
            <Heart v-if="wish.status === 'seeking'" class="w-3 h-3" /><CheckCircle2 v-else class="w-3 h-3" /> {{ wish.status === 'seeking' ? '求购中' : '已达成' }}
          </span>
        </div>
        <h3 class="text-xl font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{{ wish.title }}</h3>
        
        <div class="flex justify-between items-center mb-4">
          <p class="text-sm text-gray-500">作者: {{ wish.author }} · 期望价: <span class="text-red-500 font-bold">¥{{ wish.priceRange }}</span></p>
          <!-- 列表卡片上同求热度气泡 -->
          <span v-if="wish.coSeekers && wish.coSeekers.length > 0" class="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-0.5">
            <Flame class="w-3 h-3 text-purple-500 fill-purple-200" /> 
            {{ 1 + wish.coSeekers.filter(s => s !== wish.userId).length }}人同求
          </span>
          <span v-else class="text-[9px] font-black bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-0.5">
            <Flame class="w-3 h-3 text-slate-400" /> 1人求购
          </span>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in wish.tags" :key="tag" class="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] fo    <!-- 登记心愿 Glassmorphism 弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="isCreateOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-fade-in">
          <!-- 遮罩 -->
          <div class="fixed inset-0 transition-opacity" @click="isCreateOpen = false"></div>
          
          <!-- 表单主体 -->
          <div class="relative w-full max-w-lg bg-white border border-slate-105 rounded-[32px] shadow-2xl overflow-hidden transform transition-all z-10 animate-google-in p-8 backdrop-blur-xl my-8">
            <button @click="isCreateOpen = false" class="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-650 rounded-full hover:bg-gray-50 transition-colors">
              <X class="w-5 h-5" />
            </button>
            
            <div class="flex items-center gap-2.5 mb-6 pb-5 border-b border-gray-100">
              <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-650 flex items-center justify-center shadow-sm">
                <PenTool class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 class="text-xl font-black text-gray-900 tracking-tight">登记购书心愿</h3>
                <p class="text-[10px] text-gray-405 font-bold uppercase tracking-wider mt-0.5">桃酥 AI 帮你全校实时匹配追踪</p>
              </div>
            </div>
            
            <form @submit.prevent="submitWish" class="space-y-5">
              <!-- 书名 -->
              <div>
                <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">想要的书名 <span class="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  v-model="newWishTitle" 
                  placeholder="例如：深入理解计算机系统 (CSAPP)" 
                  class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
                />
              </div>
              
              <!-- 作者与期望价格 -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">作者</label>
                  <input 
                    type="text" 
                    v-model="newWishAuthor" 
                    placeholder="例如：Randal E. Bryant" 
                    class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
                  />
                </div>
                <div>
                  <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">期望入手价 (¥)</label>
                  <input 
                    type="text" 
                    v-model="newWishPrice" 
                    placeholder="例如：50 或 面议" 
                    class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
                  />
                </div>
              </div>
              
              <!-- 标签选择 (预设胶囊) -->
              <div>
                <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2.5">快捷选择分类标签</label>
                <div class="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    v-for="tag in presetTags" 
                    :key="tag" 
                    @click="togglePresetTag(tag)"
                    :class="[
                      'px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95 select-none',
                      selectedPresetTags.includes(tag)
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-100'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    ]"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
              
              <!-- 自定义标签 -->
              <div>
                <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">自定义其它标签 (用逗号/空格分隔)</label>
                <input 
                  type="text" 
                  v-model="newWishTagsText" 
                  placeholder="引导标签：考研, 计算机系, 辅导书" 
                  class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-850 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
                />
              </div>
              
              <!-- 提交按钮 -->
              <div class="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  @click="isCreateOpen = false" 
                  class="flex-1 h-12 rounded-2xl border border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  :disabled="isSubmitting" 
                  class="flex-1 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-750 hover:to-indigo-750 text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <Sparkles v-else class="w-4 h-4" />
                  <span>{{ isSubmitting ? '正在匹配中...' : '确认发布求购心愿' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>
