<script setup>
import { ref, computed, onMounted } from 'vue'
import AiAssistantSidebar from '../components/AiAssistantSidebar.vue'
import AiBookRecommendationSection from '../components/AiBookRecommendationSection.vue'
import AiChatPanel from '../components/AiChatPanel.vue'
import AiDecisionCards from '../components/AiDecisionCards.vue'
import { getJson, postJson } from '../composables/useApi.js'

const books = ref([])
const messages = ref([])
const draft = ref('')
const quickPrompts = ref([])
const decisionCards = ref([])
const isThinking = ref(false)

const apiKey = ref('')
const apiUrl = ref('')
const modelName = ref('')
const aiConfig = ref({ configured: false, model: 'deepseek-v4-pro', apiUrl: 'https://api.deepseek.com/chat/completions' })
const configMessage = ref('')
const savingConfig = ref(false)
const configSuccess = ref(false)

onMounted(async () => {
  const [booksData, uiRes, configData] = await Promise.all([
    getJson('/api/books?status=approved'),
    getJson('/api/ui'),
    getJson('/api/ai/config'),
  ])
  const ui = uiRes
  books.value = booksData.books
  aiConfig.value = configData
  apiUrl.value = configData.apiUrl || 'https://api.deepseek.com/chat/completions'
  modelName.value = configData.model || 'deepseek-v4-pro'
  quickPrompts.value = ui.aiAnalysis?.quickPrompts || []
  decisionCards.value = ui.aiAnalysis?.decisionCards || []
  messages.value = (ui.aiAnalysis?.messages || []).map((msg) => ({
    ...msg,
    content: msg.content.replace('{{bookTitle}}', books.value[2]?.title || '')
  }))
})

const strongBooks = computed(() => books.value.filter((b) => b.aiScore > 85).sort((a, b) => b.aiScore - a.aiScore))
const cautiousBooks = computed(() => books.value.filter((b) => b.aiScore < 70).sort((a, b) => a.aiScore - b.aiScore))

const askTaosu = async (question) => {
  if (!question.trim() || isThinking.value) return
  const userMessage = { id: `user-${Date.now()}`, role: 'user', content: question }
  messages.value.push(userMessage)
  draft.value = ''
  isThinking.value = true
  try {
    const data = await postJson('/api/ai/chat', {
      message: question,
      history: messages.value.slice(0, -1),
      context: {
        books: books.value.map((book) => ({
          title: book.title,
          price: book.price,
          aiScore: book.aiScore,
          aiSummary: book.aiSummary,
        })),
      },
    })
    messages.value.push({ id: `ai-${Date.now()}`, role: 'assistant', content: data.reply })
  } catch (err) {
    messages.value.push({
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: err.message || '桃酥暂时无法连接模型服务，请稍后再试。',
    })
  } finally {
    isThinking.value = false
  }
}

const saveAiConfig = async () => {
  if (savingConfig.value) return
  savingConfig.value = true
  configMessage.value = ''
  configSuccess.value = false
  try {
    const res = await postJson('/api/ai/config', {
      apiKey: apiKey.value.trim(),
      apiUrl: apiUrl.value.trim(),
      model: modelName.value.trim()
    })
    aiConfig.value = res
    apiKey.value = ''
    configSuccess.value = true
    configMessage.value = 'AI 引擎自定义配置已成功应用并即刻生效！'
  } catch (err) {
    configSuccess.value = false
    configMessage.value = err.message || '应用配置失败，请检查参数后重试'
  } finally {
    savingConfig.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <section class="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border border-slate-100 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <!-- 炫光背景点缀 -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      
      <div class="flex flex-col xl:flex-row gap-8 items-stretch">
        <!-- 左侧：标题与状态显示 -->
        <div class="flex-1 flex flex-col justify-between gap-6">
          <div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21L14.907 18m4.917-4.917a9.079 9.079 0 00-3.069-3.069M19.824 5.176a9.08 9.08 0 00-11.583 0m0 11.583a9.08 9.08 0 010-11.583m4.917 4.917a9.079 9.079 0 01-3.069-3.069m3.069 3.069L9.813 15.904M14.907 18l3.069-3.069" /></svg>
              </div>
              <h2 class="text-xl font-black text-gray-900 tracking-tight">AI 大模型自定义配置中心</h2>
            </div>
            <p class="mt-2 text-sm text-gray-500 leading-relaxed">
              支持配置任意兼容 OpenAI 协议的大模型接口（如 DeepSeek 官方、硅基流动等）。保存后，AI 助手小酥将立即调用您的专属配置。
            </p>
          </div>

          <!-- 引擎状态看板 -->
          <div class="p-5 rounded-2xl border transition-all duration-300" :class="aiConfig.configured ? 'bg-emerald-50/40 border-emerald-100/80 shadow-[0_4px_20px_rgba(16,185,129,0.04)]' : 'bg-slate-50 border-slate-100'">
            <div class="flex items-center gap-3">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="aiConfig.configured ? 'bg-emerald-400' : 'bg-slate-400'"></span>
                <span class="relative inline-flex rounded-full h-3 w-3" :class="aiConfig.configured ? 'bg-emerald-500' : 'bg-slate-400'"></span>
              </span>
              <span class="text-sm font-black" :class="aiConfig.configured ? 'text-emerald-800' : 'text-slate-600'">
                AI 服务状态：{{ aiConfig.configured ? '已启用自定义 AI 引擎' : '待配置' }}
              </span>
            </div>
            
            <div v-if="aiConfig.configured" class="mt-3 space-y-1.5 text-xs text-emerald-700/90 font-medium">
              <div class="flex items-center gap-2">
                <span class="opacity-70">激活模型:</span>
                <code class="px-1.5 py-0.5 rounded bg-emerald-100/50 font-bold font-mono text-emerald-800">{{ aiConfig.model }}</code>
              </div>
              <div class="flex items-center gap-2 overflow-hidden">
                <span class="opacity-70 flex-shrink-0">接口地址:</span>
                <span class="truncate font-mono" :title="aiConfig.apiUrl">{{ aiConfig.apiUrl }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="opacity-70">密钥指纹:</span>
                <code class="font-mono">{{ aiConfig.maskedKey }}</code>
              </div>
            </div>
            <p v-else class="mt-2 text-xs text-slate-400">配置自定义 API Key 与接口地址后解锁小酥的完整对话与智能分析功能。</p>
          </div>
        </div>

        <!-- 右侧：表单配置区域 -->
        <form class="flex-1 flex flex-col justify-between gap-5" @submit.prevent="saveAiConfig">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 接口地址 (URL) -->
            <div class="md:col-span-2 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>API 接口地址 (Base URL)</span>
                <span class="text-[10px] text-gray-400 font-normal">(必须以 https:// 开头)</span>
              </label>
              <div class="relative flex items-center">
                <div class="absolute left-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" /></svg>
                </div>
                <input v-model="apiUrl" type="url" required placeholder="https://api.deepseek.com/chat/completions" class="w-full h-11 pl-11 pr-5 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm text-gray-900 font-mono focus:bg-white focus:ring-4 focus:ring-blue-50/80 focus:border-blue-400 focus:outline-none transition-all" />
              </div>
            </div>

            <!-- 模型名称 -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-gray-700">模型名称 (Model Name)</label>
              <div class="relative flex items-center">
                <div class="absolute left-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm12 2a1 1 0 100-2 1 1 0 000 2zM4 7a1 1 0 000 2h12a1 1 0 100-2H4zm0 4a1 1 0 000 2h6a1 1 0 100-2H4z" clip-rule="evenodd" /></svg>
                </div>
                <input v-model="modelName" type="text" required placeholder="deepseek-v4-pro" class="w-full h-11 pl-11 pr-5 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm text-gray-900 font-mono focus:bg-white focus:ring-4 focus:ring-blue-50/80 focus:border-blue-400 focus:outline-none transition-all" />
              </div>
            </div>

            <!-- API 密钥 -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-gray-700">API 密钥 (API Key)</label>
              <div class="relative flex items-center">
                <div class="absolute left-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>
                </div>
                <input v-model="apiKey" type="password" autocomplete="off" :placeholder="aiConfig.configured ? '•••••••••••• （已保存，输入可更新）' : '请输入 API 密钥'" class="w-full h-11 pl-11 pr-5 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-50/80 focus:border-blue-400 focus:outline-none transition-all" />
              </div>
            </div>
          </div>

          <!-- 保存按钮与提示消息 -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mt-2">
            <!-- 提示消息反馈 -->
            <div class="flex-1 min-h-[24px] flex items-center">
              <transition name="fade">
                <div v-if="configMessage" class="flex items-center gap-2 text-xs font-bold transition-all duration-300" :class="configSuccess ? 'text-emerald-600' : 'text-rose-500'">
                  <!-- 成功图标 -->
                  <svg v-if="configSuccess" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                  <!-- 错误图标 -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                  <span>{{ configMessage }}</span>
                </div>
              </transition>
            </div>
            
            <!-- 保存按钮 -->
            <button type="submit" :disabled="savingConfig" class="h-11 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-w-[140px]">
              <!-- Loading 转圈 -->
              <svg v-if="savingConfig" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ savingConfig ? '保存并测试中...' : '应用大模型配置' }}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
    <section class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 min-h-[720px]">
      <AiAssistantSidebar />
      <AiChatPanel v-model:draft="draft" :messages="messages" :quick-prompts="quickPrompts" :loading="isThinking" @ask="askTaosu" />
    </section>
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <AiBookRecommendationSection title="强烈推荐区" badge="建议优先买" :books="strongBooks.slice(0, 5)" variant="strong" />
      <AiBookRecommendationSection title="不建议盲买区" badge="先借阅观望" :books="cautiousBooks" variant="cautious" />
    </section>
    <AiDecisionCards :cards="decisionCards" />
  </div>
</template>
