<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { X, Send, Sparkles } from 'lucide-vue-next'
import { postJson } from '../composables/useApi.js'

const isOpen = ref(false)
const messages = ref([])
const input = ref('')
const isTyping = ref(false)
const messagesEnd = ref(null)
const offlineReply = ref('')

onMounted(async () => {
  const res = await fetch('/data/ui.json')
  const ui = await res.json()
  messages.value = ui.floatingAssistant?.messages || []
  offlineReply.value = ui.floatingAssistant?.offlineReply || ''
})

const scrollToBottom = () => {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

const handleSend = async () => {
  if (!input.value.trim()) return
  const userMsg = { role: 'user', content: input.value }
  messages.value.push(userMsg)
  const msg = input.value
  input.value = ''
  isTyping.value = true
  scrollToBottom()

  try {
    const data = await postJson('/api/ai/chat', { message: msg, history: messages.value.slice(0, -1) })
    messages.value.push({ role: 'ai', content: data.reply })
  } catch {
    messages.value.push({ role: 'ai', content: offlineReply.value })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div :class="['floating-ai-wrapper', { active: isOpen }]">
    <button class="ai-trigger" @click="isOpen = !isOpen">
      <X v-if="isOpen" :size="28" />
      <div v-else class="trigger-inner">
        <Sparkles :size="24" class="sparkle-icon" />
        <span>桃酥</span>
      </div>
    </button>
    <div class="ai-chat-window">
      <div class="ai-chat-header">
        <div class="header-main">
          <div class="ai-avatar">酥</div>
          <div>
            <h4>桃酥 AI 助手</h4>
            <p class="status">在线 · 浙大知识库已加载</p>
          </div>
        </div>
      </div>
      <div class="ai-message-list">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['ai-message', msg.role]">
          <div class="msg-content">{{ msg.content }}</div>
        </div>
        <div v-if="isTyping" class="ai-message ai typing">
          <div class="dot-flashing"></div>
        </div>
        <div ref="messagesEnd"></div>
      </div>
      <form class="ai-input-form" @submit.prevent="handleSend">
        <input type="text" placeholder="问问桃酥：高数书怎么选？" v-model="input" />
        <button type="submit" :disabled="!input.trim() || isTyping">
          <Send :size="20" />
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.floating-ai-wrapper { position: fixed; bottom: 30px; right: 30px; z-index: 1000; font-family: 'Inter', system-ui, sans-serif; }
.ai-trigger { width: 64px; height: 64px; border-radius: 32px; background: linear-gradient(135deg, #1a73e8 0%, #8ab4f8 100%); border: none; color: white; box-shadow: 0 8px 32px rgba(26,115,232,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
.ai-trigger:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 12px 40px rgba(26,115,232,0.5); }
.trigger-inner { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.trigger-inner span { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.sparkle-icon { animation: sparkle 2s infinite ease-in-out; }
@keyframes sparkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.8); } }
.ai-chat-window { position: absolute; bottom: 80px; right: 0; width: 360px; height: 500px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.95); transition: all 0.4s cubic-bezier(0.165,0.84,0.44,1); overflow: hidden; }
.floating-ai-wrapper.active .ai-chat-window { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
.ai-chat-header { padding: 20px 24px; background: rgba(255,255,255,0.5); border-bottom: 1px solid rgba(0,0,0,0.05); }
.header-main { display: flex; align-items: center; gap: 12px; }
.ai-avatar { width: 40px; height: 40px; background: #1a73e8; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
.ai-chat-header h4 { margin: 0; font-size: 16px; color: #1a0dab; }
.ai-chat-header .status { margin: 0; font-size: 11px; color: #34a853; font-weight: 500; }
.ai-message-list { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: rgba(248,249,250,0.5); }
.ai-message { max-width: 85%; padding: 10px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; }
.ai-message.ai { align-self: flex-start; background: white; color: #3c4043; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.ai-message.user { align-self: flex-end; background: #1a73e8; color: white; border-bottom-right-radius: 4px; }
.dot-flashing { position: relative; width: 6px; height: 6px; border-radius: 3px; background-color: #1a73e8; animation: dotFlashing 1s infinite linear alternate; animation-delay: .5s; }
.dot-flashing::before, .dot-flashing::after { content: ''; display: inline-block; position: absolute; top: 0; }
.dot-flashing::before { left: -12px; width: 6px; height: 6px; border-radius: 3px; background-color: #1a73e8; animation: dotFlashing 1s infinite linear alternate; animation-delay: 0s; }
.dot-flashing::after { left: 12px; width: 6px; height: 6px; border-radius: 3px; background-color: #1a73e8; animation: dotFlashing 1s infinite linear alternate; animation-delay: 1s; }
@keyframes dotFlashing { 0% { background-color: #1a73e8; } 50%, 100% { background-color: #ebebeb; } }
.ai-input-form { padding: 16px; background: white; display: flex; gap: 8px; border-top: 1px solid rgba(0,0,0,0.05); }
.ai-input-form input { flex: 1; border: 1px solid #e0e0e0; padding: 10px 16px; border-radius: 20px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.ai-input-form input:focus { border-color: #1a73e8; }
.ai-input-form button { background: #1a73e8; color: white; border: none; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
.ai-input-form button:hover { transform: scale(1.1); }
.ai-input-form button:disabled { background: #ccc; cursor: not-allowed; }
</style>
