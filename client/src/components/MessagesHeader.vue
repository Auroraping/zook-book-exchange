<script setup>
const props = defineProps({
  chat: { type: Object, default: null }
})
</script>

<template>
  <div class="h-[72px] px-8 flex items-center justify-between border-b border-gray-50">
    <div class="flex items-center gap-4">
      <h3 class="font-medium text-lg text-gray-800">{{ chat?.name }}</h3>
      <span :class="['flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full', chat?.type === 'system' ? 'text-blue-600 bg-blue-50' : 'text-green-500 bg-green-50']">
        <div :class="['w-1.5 h-1.5 rounded-full', chat?.type === 'system' ? 'bg-blue-600' : 'bg-green-500 animate-pulse']"></div>
        {{ chat?.type === 'system' ? '消息同步' : '在线' }}
      </span>
    </div>
  </div>
</template>
