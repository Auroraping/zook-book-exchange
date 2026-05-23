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
const aiConfig = ref({ configured: false, model: 'deepseek-v4-pro' })
const configMessage = ref('')
const savingConfig = ref(false)

onMounted(async () => {
  const [booksData, uiRes, configData] = await Promise.all([
    getJson('/api/books?status=approved'),
    fetch('/data/ui.json'),
    getJson('/api/ai/config'),
  ])
  const ui = await uiRes.json()
  books.value = booksData.books
  aiConfig.value = configData
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

const saveDeepSeekKey = async () => {
  if (!apiKey.value.trim() || savingConfig.value) return
  savingConfig.value = true
  configMessage.value = ''
  try {
    aiConfig.value = await postJson('/api/ai/config', { apiKey: apiKey.value })
    apiKey.value = ''
    configMessage.value = '配置文件已生成，当前后端可直接调用 DeepSeek。'
  } catch (err) {
    configMessage.value = err.message || '保存配置失败'
  } finally {
    savingConfig.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <section class="bg-white border border-gray-100 rounded-[32px] p-6 flex flex-col lg:flex-row lg:items-center gap-5">
      <div class="flex-1"><h2 class="font-black text-gray-900">DeepSeek 密钥配置</h2><p class="mt-1 text-sm text-gray-500">{{ aiConfig.configured ? `已配置 ${aiConfig.maskedKey}，当前模型 ${aiConfig.model}` : '输入 API 密钥后，后端会自动生成 server/.env.local 配置文件。' }}</p></div>
      <form class="flex flex-col md:flex-row gap-3 md:items-center" @submit.prevent="saveDeepSeekKey">
        <input v-model="apiKey" type="password" autocomplete="off" placeholder="请输入 DeepSeek API 密钥" class="h-12 md:w-[360px] bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200" />
        <button type="submit" :disabled="!apiKey.trim() || savingConfig" class="h-12 px-6 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-50">{{ savingConfig ? '保存中' : '生成配置' }}</button>
      </form>
      <p v-if="configMessage" class="text-sm font-bold text-blue-600">{{ configMessage }}</p>
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
