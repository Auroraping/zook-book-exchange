<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { Bot, BookOpen, FileText, Loader2, Search, Send, Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const props = defineProps({
  messages: { type: Array, required: true },
  quickPrompts: { type: Array, required: true },
  draft: { type: String, required: true },
  loading: { type: Boolean, default: false },
  thinkingStage: { type: String, default: '' },
  agents: { type: Array, default: () => [] },
  activeAgent: { type: String, default: 'general' }
})
const emit = defineEmits(['ask', 'update:draft', 'select-agent'])

const referenceIcon = (type) => type === 'book' ? BookOpen : FileText
const statLabel = (stats) => {
  if (!stats) return ''
  if (stats.source === 'faq') {
    return `${stats.matchType === 'similar' ? '相似 FAQ 缓存命中' : 'FAQ 缓存命中'} · 0 token`
  }
  const hit = stats.cacheHitTokens || 0
  const miss = stats.cacheMissTokens || 0
  return `${stats.model || 'model'} · ${stats.totalTokens || 0} token · 缓存 ${hit}/${hit + miss}`
}

const loadingLabel = computed(() => props.thinkingStage || '桃酥正在思考')
const isCacheStage = computed(() => loadingLabel.value.includes('缓存'))
const isGeneratingStage = computed(() => loadingLabel.value.includes('生成') || loadingLabel.value.includes('模型'))

const messageContainer = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

watch(
  () => props.activeAgent,
  () => {
    scrollToBottom()
  }
)
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
    <div class="h-20 px-7 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bot class="w-6 h-6" /></div>
        <div><h2 class="font-black text-gray-900">桃酥对话</h2><p class="text-xs font-bold text-gray-400">多角色上下文助手</p></div>
      </div>
    </div>
    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          v-for="agent in agents"
          :key="agent.id"
          type="button"
          @click="emit('select-agent', agent.id)"
          :class="['text-left rounded-2xl border px-4 py-3 transition-all', activeAgent === agent.id ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:bg-white']"
        >
          <p class="text-sm font-black text-gray-900">{{ agent.name }}</p>
          <p class="text-[11px] font-bold text-gray-400 mt-1 truncate">{{ agent.scope }}</p>
        </button>
      </div>
    </div>
    <div ref="messageContainer" class="flex-1 bg-gray-50/50 p-7 overflow-y-auto">
      <div class="flex flex-col gap-5">
        <div v-for="msg in messages" :key="msg.id" :class="['flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          <img v-if="msg.role !== 'user'" src="/taosu.png" alt="桃酥" class="w-10 h-10 rounded-2xl bg-white object-contain border border-orange-100 shadow-sm" />
          <div :class="['max-w-[78%] rounded-[24px] px-5 py-4 shadow-sm text-sm leading-relaxed', msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-md']">
            <div class="whitespace-pre-wrap">
              <template v-if="msg.content">{{ msg.content }}</template>
              <div v-else-if="msg.role === 'assistant' && loading" class="min-w-[220px]">
                <div class="flex items-center gap-3 text-gray-600">
                  <span :class="['w-9 h-9 rounded-2xl flex items-center justify-center', isCacheStage ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600']">
                    <Sparkles v-if="isCacheStage" class="w-4 h-4" />
                    <Loader2 v-else class="w-4 h-4 animate-spin" />
                  </span>
                  <div>
                    <p class="text-sm font-black text-gray-800">{{ loadingLabel }}</p>
                    <p class="text-[11px] font-bold text-gray-400">{{ isGeneratingStage ? '正在流式生成，内容会实时显示' : '正在减少重复请求并整理上下文' }}</p>
                  </div>
                </div>
                <div class="mt-4 flex items-center gap-1.5">
                  <span class="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <span class="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse [animation-delay:120ms]"></span>
                  <span class="h-1.5 w-1.5 rounded-full bg-blue-200 animate-pulse [animation-delay:240ms]"></span>
                </div>
              </div>
            </div>
            <div v-if="msg.stats" class="mt-3 text-[11px] font-bold text-gray-400">
              {{ statLabel(msg.stats) }}
            </div>
            <div v-if="msg.references?.length" class="mt-4 flex flex-col gap-2">
              <RouterLink
                v-for="ref in msg.references"
                :key="`${ref.type}-${ref.id}`"
                :to="ref.path"
                class="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 hover:bg-blue-50 hover:border-blue-100 transition-colors"
              >
                <component :is="referenceIcon(ref.type)" class="w-4 h-4 text-blue-600" />
                <span class="truncate text-xs font-black text-gray-700">{{ ref.title }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
        <div v-if="loading && !messages.some((msg) => msg.role === 'assistant' && !msg.content)" class="flex items-start gap-3 justify-start">
          <img src="/taosu.png" alt="桃酥" class="w-10 h-10 rounded-2xl bg-white object-contain border border-orange-100 shadow-sm" />
          <div class="bg-white text-gray-500 border border-gray-100 rounded-[24px] rounded-tl-md px-5 py-4 shadow-sm text-sm flex items-center gap-3">
            <Loader2 class="w-4 h-4 animate-spin text-blue-600" />
            <span class="font-bold">{{ loadingLabel }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="p-6 border-t border-gray-100 bg-white">
      <div class="flex flex-wrap gap-2 mb-4">
        <button v-for="prompt in quickPrompts" :key="prompt.label" @click="emit('ask', prompt.question)" class="px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-xs font-black text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all">{{ prompt.label }}</button>
      </div>
      <form @submit.prevent="emit('ask', draft)" class="flex gap-3">
        <div class="flex-1 h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 flex items-center gap-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all">
          <Search class="w-5 h-5 text-gray-400" />
          <input :value="draft" @input="emit('update:draft', $event.target.value)" placeholder="问桃酥：查资料、选教材或系统使用问题" class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400" />
        </div>
        <button type="submit" :disabled="loading || !draft.trim()" class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"><Send class="w-5 h-5" /></button>
      </form>
    </div>
  </div>
</template>
