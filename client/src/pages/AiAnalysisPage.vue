<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { BadgeCheck, Bot, CheckCircle2, ChevronRight, Cpu, Search, Send, ShieldAlert } from 'lucide-vue-next'

const books = ref([])
const messages = ref([])
const draft = ref('')

onMounted(async () => {
  const res = await fetch('/data/books.json')
  books.value = await res.json()
  messages.value = [
    { id: 'hello', role: 'assistant', content: '嗨，我是桃酥。你可以问我某本教材值不值得买，也可以让我按课表、预算或期末复习目标帮你挑书。' },
    { id: 'sample', role: 'assistant', content: `今日高分样本是《${books.value[2]?.title || '数据结构与算法分析'}》，适合优先关注。` }
  ]
})

const strongBooks = computed(() => books.value.filter((b) => b.aiScore > 85).sort((a, b) => b.aiScore - a.aiScore))
const cautiousBooks = computed(() => books.value.filter((b) => b.aiScore < 70).sort((a, b) => a.aiScore - b.aiScore))

const quickPrompts = [
  { label: '这本要买吗', question: '数据结构基础这门课需要买教材吗？' },
  { label: '帮我省钱', question: '预算有限，哪些教材可以先借阅？' },
  { label: '按课表推荐', question: '按我的本学期课表给我排一个购书优先级。' },
  { label: '找带笔记的书', question: '帮我优先找带学长笔记、适合期末复习的书。' }
]

const askTaosu = (question) => {
  if (!question.trim()) return
  const answer = `桃酥已收到你的问题。基于当前教材库的 ${books.value.length} 本书进行分析... 建议优先关注 AI 必要性评分高的专业硬课教材。`
  messages.value.push({ id: `user-${Date.now()}`, role: 'user', content: question })
  messages.value.push({ id: `ai-${Date.now()}`, role: 'assistant', content: answer })
  draft.value = ''
}
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <section class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 min-h-[720px]">
      <!-- 侧边 -->
      <aside class="bg-white border border-gray-100 rounded-[32px] shadow-sm p-7 flex flex-col gap-6">
        <div class="flex flex-col items-center text-center">
          <div class="relative mb-5"><div class="absolute inset-0 bg-orange-200 blur-3xl opacity-60 rounded-full"></div><img src="/taosu.png" alt="桃酥" class="relative w-32 h-32 object-contain drop-shadow-xl" /></div>
          <span class="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-100">Taosu Chat</span>
          <h1 class="mt-3 text-3xl font-black text-gray-900 tracking-tight">桃酥</h1>
          <p class="mt-3 text-sm text-gray-500 leading-relaxed">温暖治愈的 AI 知识小助手。</p>
        </div>
        <div class="rounded-3xl bg-gray-50 border border-gray-100 p-5">
          <div class="flex items-center gap-2 mb-4"><Cpu class="w-5 h-5 text-blue-600" /><h2 class="font-black text-gray-900">本地模型舱</h2></div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs"><span class="text-gray-500 font-bold">运行模式</span><span class="text-blue-600 font-black">Local LLM</span></div>
            <div class="flex items-center justify-between text-xs"><span class="text-gray-500 font-bold">连接状态</span><span class="text-amber-600 font-black">原型模拟</span></div>
            <div class="flex items-center justify-between text-xs"><span class="text-gray-500 font-bold">知识增强</span><span class="text-emerald-600 font-black">RAG Ready</span></div>
          </div>
        </div>
        <RouterLink to="/community" class="mt-auto h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center gap-2 text-sm font-black hover:bg-blue-600 transition-colors">去知识社区 <ChevronRight class="w-4 h-4" /></RouterLink>
      </aside>
      <!-- 对话主区 -->
      <div class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        <div class="h-20 px-7 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur">
          <div class="flex items-center gap-4"><div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bot class="w-6 h-6" /></div><div><h2 class="font-black text-gray-900">桃酥对话</h2><p class="text-xs font-bold text-gray-400">教材必要性判断 · 课表推荐</p></div></div>
        </div>
        <div class="flex-1 bg-gray-50/50 p-7 overflow-y-auto">
          <div class="flex flex-col gap-5">
            <div v-for="msg in messages" :key="msg.id" :class="['flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <img v-if="msg.role !== 'user'" src="/taosu.png" alt="桃酥" class="w-10 h-10 rounded-2xl bg-white object-contain border border-orange-100 shadow-sm" />
              <div :class="['max-w-[78%] rounded-[24px] px-5 py-4 shadow-sm text-sm leading-relaxed', msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-md']">{{ msg.content }}</div>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 bg-white">
          <div class="flex flex-wrap gap-2 mb-4">
            <button v-for="prompt in quickPrompts" :key="prompt.label" @click="askTaosu(prompt.question)" class="px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-xs font-black text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all">{{ prompt.label }}</button>
          </div>
          <form @submit.prevent="askTaosu(draft)" class="flex gap-3">
            <div class="flex-1 h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 flex items-center gap-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all"><Search class="w-5 h-5 text-gray-400" /><input v-model="draft" placeholder="问桃酥：这本教材要买吗？" class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" /></div>
            <button type="submit" class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"><Send class="w-5 h-5" /></button>
          </form>
        </div>
      </div>
    </section>
    <!-- 推荐区 -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white border border-emerald-100 rounded-[32px] shadow-sm p-8">
        <div class="flex items-center justify-between mb-7"><div class="flex items-center gap-3"><BadgeCheck class="w-6 h-6 text-emerald-600" /><h2 class="text-2xl font-black text-gray-900">强烈推荐区</h2></div><span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">建议优先买</span></div>
        <div class="flex flex-col gap-4">
          <RouterLink v-for="book in strongBooks.slice(0, 5)" :key="book.id" :to="`/book/${book.id}`" class="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
            <img :src="book.cover" :alt="book.title" class="w-14 h-20 object-cover rounded-xl border border-gray-100" />
            <div class="flex-1 min-w-0"><h3 class="font-black text-gray-900 truncate group-hover:text-blue-600">{{ book.title }}</h3><p class="text-xs text-gray-500 mt-2 line-clamp-2">{{ book.aiSummary }}</p><p class="mt-3 text-[10px] font-black text-blue-600">查看全部在售 ({{ book.aiScore }}分)</p></div>
            <ChevronRight class="w-5 h-5 text-gray-300 self-center group-hover:text-blue-600" />
          </RouterLink>
        </div>
      </div>
      <div class="bg-white border border-orange-100 rounded-[32px] shadow-sm p-8">
        <div class="flex items-center justify-between mb-7"><div class="flex items-center gap-3"><ShieldAlert class="w-6 h-6 text-orange-600" /><h2 class="text-2xl font-black text-gray-900">不建议盲买区</h2></div><span class="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black">先借阅观望</span></div>
        <div class="flex flex-col gap-4">
          <RouterLink v-for="book in cautiousBooks" :key="book.id" :to="`/book/${book.id}`" class="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
            <img :src="book.cover" :alt="book.title" class="w-14 h-20 object-cover rounded-xl border border-gray-100" />
            <div class="flex-1 min-w-0"><h3 class="font-black text-gray-900 truncate group-hover:text-blue-600">{{ book.title }}</h3><p class="text-xs text-gray-500 mt-2 line-clamp-2">{{ book.aiSummary }}</p><p class="mt-3 text-[10px] font-black text-blue-600">依然前去查看 ({{ book.aiScore }}分)</p></div>
            <ChevronRight class="w-5 h-5 text-gray-300 self-center group-hover:text-blue-600" />
          </RouterLink>
        </div>
      </div>
    </section>
    <section class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div v-for="[title, desc] in [['优先买', 'AI 分数高、专业硬课、带笔记'], ['先观望', '公共课、PPT 依赖高、评分中等'], ['可借阅', '评分偏低、替代资料充足']]" :key="title" class="bg-white border border-gray-100 rounded-[24px] p-6 flex items-start gap-4">
        <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><CheckCircle2 class="w-5 h-5" /></div>
        <div><h3 class="font-black text-gray-900">{{ title }}</h3><p class="text-sm text-gray-500 mt-1">{{ desc }}</p></div>
      </div>
    </section>
  </div>
</template>
