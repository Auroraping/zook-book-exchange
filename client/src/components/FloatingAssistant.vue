<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ExternalLink, Loader2, Send, Sparkles, X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { getJson, streamJson } from '../composables/useApi.js'

const isOpen = ref(false)
const messages = ref([])
const input = ref('')
const stage = ref('空闲待命')
const state = ref('idle')
const messagesEnd = ref(null)
const offlineReply = ref('桃酥暂时无法连接模型服务，请稍后再试。')

const statusLabel = computed(() => {
  if (state.value === 'thinking') return stage.value || '整理问题'
  if (state.value === 'answering') return '正在流式回答'
  if (state.value === 'faq') return 'FAQ 缓存命中'
  if (state.value === 'error') return '连接异常'
  return '学习助手在线'
})

const mascotClass = computed(() => ({
  thinking: state.value === 'thinking',
  answering: state.value === 'answering',
  faq: state.value === 'faq',
  error: state.value === 'error',
}))

onMounted(async () => {
  const ui = await getJson('/api/ui').catch(() => ({}))
  messages.value = ui.floatingAssistant?.messages?.length
    ? ui.floatingAssistant.messages
    : [{ role: 'ai', content: '你好，我是学习助手桃酥。可以问我系统使用、买书流程、学习安排。' }]
  offlineReply.value = ui.floatingAssistant?.offlineReply || offlineReply.value
})

const scrollToBottom = () => {
  nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) scrollToBottom()
}

const handleSend = async () => {
  const text = input.value.trim()
  if (!text || state.value === 'thinking' || state.value === 'answering') return
  messages.value.push({ role: 'user', content: text })
  const assistant = { role: 'ai', content: '', stats: null }
  messages.value.push(assistant)
  input.value = ''
  state.value = 'thinking'
  stage.value = '检查 FAQ 缓存'
  scrollToBottom()

  let typingQueue = []
  let typingInterval = null
  let isStreamDone = false

  const startTyping = () => {
    if (typingInterval) return
    typingInterval = setInterval(() => {
      if (typingQueue.length > 0) {
        assistant.content += typingQueue.shift()
        scrollToBottom()
      } else if (isStreamDone) {
        clearInterval(typingInterval)
        typingInterval = null
      }
    }, 25)
  }

  try {
    await streamJson('/api/ai/chat/stream', {
      agent: 'general',
      message: text,
      history: messages.value.slice(0, -2),
    }, {
      stage: (data) => {
        stage.value = data.label || '处理中'
        state.value = String(data.step || '').includes('cache-hit') ? 'faq' : 'thinking'
      },
      delta: (data) => {
        const textChunk = data.text || ''
        for (const char of textChunk) {
          typingQueue.push(char)
        }
        state.value = state.value === 'faq' ? 'faq' : 'answering'
        startTyping()
      },
      done: (data) => {
        isStreamDone = true
        const checkDoneInterval = setInterval(() => {
          if (typingQueue.length === 0) {
            clearInterval(checkDoneInterval)
            if (typingInterval) {
              clearInterval(typingInterval)
              typingInterval = null
            }
            assistant.stats = data.stats || null
            state.value = data.source === 'faq' ? 'faq' : 'idle'
            stage.value = data.source === 'faq' ? 'FAQ 缓存命中' : '回答完成'
            scrollToBottom()
          }
        }, 50)
      },
    })
  } catch {
    isStreamDone = true
    if (typingInterval) {
      clearInterval(typingInterval)
      typingInterval = null
    }
    assistant.content = offlineReply.value
    state.value = 'error'
    stage.value = '连接异常'
  } finally {
    const checkFinally = setInterval(() => {
      if (isStreamDone && typingQueue.length === 0) {
        clearInterval(checkFinally)
        if (!assistant.content.trim()) assistant.content = offlineReply.value
        setTimeout(() => {
          if (state.value === 'faq' || state.value === 'error') state.value = 'idle'
        }, 1800)
        scrollToBottom()
      }
    }, 50)
  }
}
</script>

<template>
  <div :class="['floating-ai-wrapper', { active: isOpen }]">
    <div v-if="!isOpen" class="assistant-bubble">
      <span class="bubble-dot"></span>
      <span>桃酥在这</span>
    </div>
    <button
      type="button"
      class="assistant-trigger"
      :aria-label="isOpen ? '关闭桃酥助手' : '打开桃酥助手'"
      @click="toggleOpen"
    >
      <X v-if="isOpen" class="w-7 h-7 text-orange-600" />
      <div v-else :class="['taosu-mascot', mascotClass]">
        <span class="orbit orbit-a"></span>
        <span class="orbit orbit-b"></span>
        <span class="taosu-glow"></span>
        <img src="/taosu-mascot.png" alt="学习助手桃酥" />
        <span class="mascot-shadow"></span>
      </div>
    </button>

    <section class="assistant-window" aria-label="桃酥学习助手">
      <header class="assistant-header">
        <div class="header-wash"></div>
        <div class="assistant-title">
          <div :class="['mini-mascot', mascotClass]">
            <img src="/taosu-mascot.png" alt="桃酥" />
          </div>
          <div>
            <p class="assistant-kicker">通用桃酥</p>
            <h2>学习助手</h2>
          </div>
        </div>
        <div class="assistant-actions">
          <RouterLink to="/ai-analysis" class="assistant-link" title="打开完整 AI 页面">
            <ExternalLink class="w-4 h-4" />
          </RouterLink>
          <button type="button" class="assistant-link" title="关闭" @click="isOpen = false">
            <X class="w-4 h-4" />
          </button>
        </div>
      </header>

      <div class="assistant-status">
        <div class="status-copy">
          <span :class="['status-dot', state]"></span>
          <span>{{ statusLabel }}</span>
        </div>
        <span class="status-pill">低打扰模式</span>
      </div>

      <div class="assistant-messages">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['assistant-message', msg.role]">
          <div class="message-content">{{ msg.content || (msg.role === 'ai' ? stage : '') }}</div>
          <div v-if="msg.stats" class="message-stats">
            {{ msg.stats.source === 'faq' ? 'FAQ 缓存命中 · 0 token' : `${msg.stats.totalTokens || 0} token` }}
          </div>
        </div>
        <div v-if="state === 'thinking' && messages.at(-1)?.role !== 'ai'" class="assistant-message ai">
          <Loader2 class="w-4 h-4 animate-spin text-blue-600" />
          <span>{{ stage }}</span>
        </div>
        <div ref="messagesEnd"></div>
      </div>

      <form class="assistant-input" @submit.prevent="handleSend">
        <div class="input-shell">
          <Sparkles class="w-4 h-4 text-orange-400" />
          <input v-model="input" type="text" placeholder="问桃酥：怎么买书、怎么认证、怎么复习" />
        </div>
        <button type="submit" :disabled="!input.trim() || state === 'thinking' || state === 'answering'">
          <Send class="w-4 h-4" />
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.floating-ai-wrapper {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 1000;
  font-family: "Google Sans", "Product Sans", system-ui, sans-serif;
}
.assistant-trigger {
  width: 86px;
  height: 86px;
  border: 0;
  border-radius: 32px;
  background: transparent;
  box-shadow:
    0 22px 55px rgba(249, 115, 22, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.assistant-trigger:hover {
  transform: translateY(-4px) scale(1.04);
  box-shadow:
    0 28px 70px rgba(249, 115, 22, 0.22);
}
.taosu-mascot {
  position: relative;
  width: 84px;
  height: 84px;
  animation: taosu-float 3.8s ease-in-out infinite;
}
.taosu-mascot img,
.mini-mascot img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 14px rgba(251, 146, 60, 0.24));
  z-index: 2;
}
.taosu-glow {
  position: absolute;
  inset: 12px 8px 2px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.68), rgba(251, 146, 60, 0.05) 72%);
  filter: blur(18px);
  opacity: 0.84;
  z-index: 0;
}
.orbit {
  position: absolute;
  border-radius: 999px;
  background: #fb923c;
  opacity: 0.85;
  z-index: 1;
}
.orbit-a {
  width: 9px;
  height: 9px;
  top: 6px;
  right: 8px;
  animation: orbit-a 3.4s ease-in-out infinite;
}
.orbit-b {
  width: 7px;
  height: 7px;
  left: 8px;
  bottom: 12px;
  background: #22c55e;
  animation: orbit-b 4s ease-in-out infinite;
}
.mascot-shadow {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0;
  height: 10px;
  border-radius: 999px;
  background: rgba(124, 45, 18, 0.12);
  filter: blur(5px);
  z-index: 1;
}
.taosu-mascot.thinking img,
.mini-mascot.thinking img {
  animation: taosu-think 0.72s ease-in-out infinite alternate;
}
.taosu-mascot.answering img,
.mini-mascot.answering img {
  animation: taosu-talk 0.42s ease-in-out infinite alternate;
}
.taosu-mascot.faq img,
.mini-mascot.faq img {
  animation: taosu-pop 0.5s ease both;
}
.taosu-mascot.error img,
.mini-mascot.error img {
  animation: taosu-shake 0.34s ease-in-out 2;
}
.assistant-bubble {
  position: absolute;
  right: 94px;
  bottom: 26px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #ffedd5;
  color: #9a3412;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  white-space: nowrap;
  backdrop-filter: blur(18px);
}
.assistant-bubble::after {
  content: "";
  position: absolute;
  right: -5px;
  width: 10px;
  height: 10px;
  background: white;
  border-right: 1px solid #ffedd5;
  border-bottom: 1px solid #ffedd5;
  transform: rotate(-45deg);
}
.bubble-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}
.assistant-window {
  position: absolute;
  right: 0;
  bottom: 90px;
  width: min(392px, calc(100vw - 32px));
  height: min(584px, calc(100vh - 132px));
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 237, 213, 0.9);
  border-radius: 28px;
  box-shadow:
    0 30px 90px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.7) inset;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: translateY(16px) scale(0.96);
  transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s ease;
}
.floating-ai-wrapper.active .assistant-window {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}
.assistant-header {
  position: relative;
  padding: 20px 18px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
}
.header-wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 16%, rgba(251, 146, 60, 0.16), transparent 38%),
    linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(255, 255, 255, 0.84));
  z-index: 0;
}
.assistant-title,
.assistant-actions {
  position: relative;
  z-index: 1;
}
.assistant-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mini-mascot {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 24px rgba(251, 146, 60, 0.12);
}
.assistant-kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 900;
  color: #f97316;
}
.assistant-title h2 {
  margin: 1px 0 0;
  font-size: 18px;
  font-weight: 950;
  color: #1f2937;
}
.assistant-actions {
  display: flex;
  gap: 8px;
}
.assistant-link {
  width: 35px;
  height: 35px;
  border-radius: 14px;
  border: 1px solid rgba(255, 237, 213, 0.95);
  color: #9a3412;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
.assistant-link:hover {
  color: #f97316;
  border-color: #fed7aa;
}
.assistant-status {
  min-height: 42px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  background: #fffaf5;
  border-top: 1px solid rgba(255, 237, 213, 0.75);
  border-bottom: 1px solid rgba(255, 237, 213, 0.75);
}
.status-copy {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-pill {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: white;
  border: 1px solid #ffedd5;
  color: #f97316;
  font-size: 10px;
  font-weight: 950;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
}
.status-dot.thinking,
.status-dot.answering {
  background: #3b82f6;
  animation: status-pulse 0.8s ease-in-out infinite;
}
.status-dot.faq {
  background: #f59e0b;
}
.status-dot.error {
  background: #ef4444;
}
.assistant-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background:
    linear-gradient(180deg, rgba(255, 250, 245, 0.82), rgba(248, 250, 252, 0.92)),
    radial-gradient(circle at 8% 8%, rgba(251, 191, 36, 0.12), transparent 34%);
}
.assistant-message {
  max-width: 88%;
  border-radius: 18px;
  padding: 11px 14px 12px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
}
.assistant-message.ai {
  align-self: flex-start;
  color: #334155;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(226, 232, 240, 0.82);
  border-bottom-left-radius: 6px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}
.assistant-message.user {
  align-self: flex-end;
  color: white;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-bottom-right-radius: 6px;
}
.message-stats {
  margin-top: 7px;
  font-size: 10px;
  font-weight: 900;
  color: #94a3b8;
}
.assistant-input {
  padding: 14px 16px 16px;
  border-top: 1px solid #ffedd5;
  display: flex;
  gap: 10px;
  background: white;
}
.input-shell {
  min-width: 0;
  flex: 1;
  height: 44px;
  border-radius: 17px;
  border: 1px solid #e2e8f0;
  padding: 0 13px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.input-shell:focus-within {
  background: white;
  border-color: #fdba74;
  box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.12);
}
.assistant-input input {
  min-width: 0;
  flex: 1;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  font-size: 13px;
  color: #1f2937;
}
.assistant-input input:focus {
  box-shadow: none;
}
.assistant-input button {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 16px;
  color: white;
  background: linear-gradient(135deg, #f97316, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
}
.assistant-input button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
@keyframes taosu-float {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-7px) rotate(1deg); }
}
@keyframes taosu-think {
  from { transform: rotate(-2deg) scale(0.98); }
  to { transform: rotate(2deg) scale(1.02); }
}
@keyframes taosu-talk {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-2px) scale(1.04); }
}
@keyframes taosu-pop {
  0% { transform: scale(0.92); }
  70% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes taosu-shake {
  0%, 100% { transform: translateX(0); }
  30% { transform: translateX(-3px); }
  70% { transform: translateX(3px); }
}
@keyframes status-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.45; }
}
@keyframes orbit-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-8px, 7px) scale(0.72); }
}
@keyframes orbit-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(9px, -8px) scale(1.2); }
}
@media (max-width: 640px) {
  .floating-ai-wrapper {
    right: 16px;
    bottom: 16px;
  }
  .assistant-trigger {
    width: 70px;
    height: 70px;
    border-radius: 24px;
  }
  .taosu-mascot {
    width: 62px;
    height: 62px;
  }
  .assistant-bubble {
    display: none;
  }
  .assistant-window {
    right: -2px;
    bottom: 78px;
  }
}
</style>
