<script setup>
import { ref, watch } from 'vue'
import { getJson } from '../composables/useApi.js'

const props = defineProps({
  chat: { type: Object, default: null }
})

const isOnline = ref(false)

const checkOnlineStatus = async () => {
  if (!props.chat || props.chat.type === 'system' || !props.chat.id) {
    isOnline.value = false
    return
  }
  try {
    const res = await getJson(`/api/online-status?userId=${props.chat.id}`)
    isOnline.value = res.online === true
  } catch {
    isOnline.value = false
  }
}

watch(() => props.chat?.id, () => {
  checkOnlineStatus()
}, { immediate: true })

// 每 30 秒轮询一次在线状态
let intervalId = null
watch(() => props.chat?.id, (val) => {
  if (intervalId) clearInterval(intervalId)
  if (val && props.chat?.type !== 'system') {
    intervalId = setInterval(checkOnlineStatus, 30000)
  }
}, { immediate: true })
</script>

<template>
  <div class="h-[72px] px-8 flex items-center justify-between border-b border-gray-50">
    <div class="flex items-center gap-4">
      <h3 class="font-medium text-lg text-gray-800">{{ chat?.name }}</h3>
      <span v-if="chat?.type === 'system'" class="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full text-blue-600 bg-blue-50">
        <div class="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
        消息同步
      </span>
      <span v-else :class="['flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full', isOnline ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-50']">
        <div :class="['w-1.5 h-1.5 rounded-full', isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300']"></div>
        {{ isOnline ? '在线' : '离线' }}
      </span>
    </div>
  </div>
</template>
