<script setup>
import { Bell, CheckCircle2, Tag } from 'lucide-vue-next'

const props = defineProps({
  notifications: { type: Array, required: true }
})
</script>

<template>
  <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
    <div class="max-w-xl mx-auto w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bell class="w-6 h-6" /></div>
        <div><h4 class="font-black text-gray-900">系统通知已合并到会话</h4><p class="text-xs text-gray-400 font-bold">订单、心愿单、社区公告都会像聊天一样推送。</p></div>
      </div>
    </div>
    <div v-for="notice in notifications" :key="notice.id" class="flex items-start gap-4 max-w-[85%]">
      <div :class="['w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0', notice.tone === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100']">
        <CheckCircle2 v-if="notice.tone === 'green'" class="w-5 h-5" />
        <Tag v-else class="w-5 h-5" />
      </div>
      <div class="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed">
        <div class="flex items-center justify-between gap-8 mb-2"><h4 class="font-black text-gray-900">{{ notice.title }}</h4><span class="text-[10px] font-bold text-gray-400 whitespace-nowrap">{{ notice.time }}</span></div>
        <p class="text-gray-500">{{ notice.content }}</p>
      </div>
    </div>
  </div>
</template>
