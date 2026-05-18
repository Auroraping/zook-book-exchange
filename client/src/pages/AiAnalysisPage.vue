<script setup>
import { ref, computed, onMounted } from 'vue'
import AiAssistantSidebar from '../components/AiAssistantSidebar.vue'
import AiBookRecommendationSection from '../components/AiBookRecommendationSection.vue'
import AiChatPanel from '../components/AiChatPanel.vue'
import AiDecisionCards from '../components/AiDecisionCards.vue'
import { postJson } from '../composables/useApi.js'

const books = ref([])
const messages = ref([])
const draft = ref('')
const quickPrompts = ref([])
const decisionCards = ref([])
const isThinking = ref(false)

onMounted(async () => {
  const [booksRes, uiRes] = await Promise.all([fetch('/data/books.json'), fetch('/data/ui.json')])
  const ui = await uiRes.json()
  books.value = await booksRes.json()
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
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
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
