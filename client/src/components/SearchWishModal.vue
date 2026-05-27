<script setup>
import { ref } from 'vue'
import { X, PenTool, Sparkles } from 'lucide-vue-next'
import { postJson } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'

const props = defineProps({
  show: { type: Boolean, required: true }
})
const emit = defineEmits(['close'])

const title = ref('')
const author = ref('')
const priceRange = ref('')
const tagText = ref('')
const submitting = ref(false)

const { user } = useAuth()

const submitWish = async () => {
  if (!title.value.trim() || submitting.value) return
  submitting.value = true
  
  // 处理标签
  const tags = ['二手广场']
  if (tagText.value.trim()) {
    const customTags = tagText.value
      .replace(/，/g, ',')
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
    tags.push(...customTags)
  }
  
  try {
    const currentUserId = user.value?.id || 'me'
    await postJson('/api/wishes', {
      userId: currentUserId,
      title: title.value,
      author: author.value,
      priceRange: priceRange.value || '面议',
      tags: tags
    })
    
    title.value = ''
    author.value = ''
    priceRange.value = ''
    tagText.value = ''
    emit('close')
  } catch (err) {
    console.error('登记心愿失败：', err)
    alert(err.message || '登记失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-fade-in">
        <!-- 遮罩 -->
        <div class="fixed inset-0 transition-opacity" @click="emit('close')"></div>

        <!-- 表单主体 -->
        <div class="relative w-full max-w-lg bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden transform transition-all z-10 animate-google-in p-8 backdrop-blur-xl my-8">
          <button @click="emit('close')" class="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <X class="w-5 h-5" />
          </button>

          <div class="flex items-center gap-2.5 mb-6 pb-5 border-b border-gray-100">
            <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
              <PenTool class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 tracking-tight">登记购书心愿</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">桃酥 AI 帮你全校实时匹配追踪</p>
            </div>
          </div>

          <form @submit.prevent="submitWish" class="space-y-5">
            <!-- 书名 -->
            <div>
              <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">想要的书名 <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                v-model="title" 
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
                  v-model="author" 
                  placeholder="例如：Randal" 
                  class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
                />
              </div>
              <div>
                <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">期望价格 (¥)</label>
                <input 
                  type="text" 
                  v-model="priceRange" 
                  placeholder="例如：50 或 面议" 
                  class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
                />
              </div>
            </div>

            <!-- 标签 -->
            <div>
              <label class="text-xs font-black text-gray-450 uppercase tracking-widest block mb-2">分类标签 (用逗号或空格分隔)</label>
              <input 
                type="text" 
                v-model="tagText" 
                placeholder="例如：考研, 专业课, 计算机" 
                class="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
              />
            </div>

            <!-- 提示卡片 -->
            <div class="bg-purple-50/40 border border-purple-100 rounded-2xl p-4 flex gap-3 items-start">
              <Sparkles class="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div class="text-xs text-purple-950/80 leading-relaxed font-semibold">
                一旦有同学在二手广场上架《{{ title || '您登记的书籍' }}》，系统会立刻通过服务通知您。
              </div>
            </div>

            <!-- 提交按钮 -->
            <div class="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                @click="emit('close')" 
                class="flex-1 h-12 rounded-2xl border border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
              >
                取消
              </button>
              <button 
                type="submit" 
                :disabled="!title.trim() || submitting" 
                class="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 disabled:bg-purple-300 disabled:scale-100 transition-all"
              >
                <span v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ submitting ? '提交中...' : '提交登记' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
