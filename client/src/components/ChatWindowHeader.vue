<script setup>
import { ref, watch } from 'vue'
import { getJson } from '../composables/useApi.js'

const props = defineProps({
  name: { type: String, default: '' },
  contactId: { type: [String, Number], default: null }
})

const isOnline = ref(false)
const checking = ref(false)

const checkOnlineStatus = async () => {
  if (!props.contactId) {
    isOnline.value = false
    return
  }
  checking.value = true
  try {
    const res = await getJson(`/api/online-status?userId=${props.contactId}`)
    isOnline.value = res.online === true
  } catch {
    isOnline.value = false
  } finally {
    checking.value = false
  }
}

watch(() => props.contactId, () => {
  checkOnlineStatus()
}, { immediate: true })

// 每 30 秒轮询一次在线状态
let intervalId = null
watch(() => props.contactId, (val) => {
  if (intervalId) clearInterval(intervalId)
  if (val) {
    intervalId = setInterval(checkOnlineStatus, 30000)
  }
}, { immediate: true })
</script>

<template>
  <div class="h-[72px] px-8 flex items-center border-b border-gray-50">
    <h3 class="font-medium text-lg text-gray-800">{{ name }}</h3>
    <span v-if="contactId" :class="['ml-3 flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full', isOnline ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-50']">
      <div :class="['w-1.5 h-1.5 rounded-full', isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300']"></div>
      {{ isOnline ? '在线' : '离线' }}
    </span>
  </div>
</template>
