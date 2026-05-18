<script setup>
const props = defineProps({
  showText: { type: Boolean, default: true },
  className: { type: String, default: 'h-8' }
})
</script>

<template>
  <div :class="['flex items-center gap-3', className]">
    <img src="/logo.png" alt="zook logo icon" class="h-full w-auto object-contain" />
    <div v-if="showText" class="flex flex-col">
      <div class="flex items-center gap-4">
        <div class="relative flex items-center">
          <img src="/zook_text.png" alt="zook text logo" class="h-9 w-auto object-contain" />
        </div>
        <div class="h-8 w-[1px] bg-gray-200/80 mx-1"></div>
        <span class="text-[32px] font-bold text-[#3c4043] tracking-tight whitespace-nowrap leading-none">浙里淘书</span>
      </div>
      <span class="text-[10px] text-gray-400 font-bold tracking-[0.2em] mt-[2px] uppercase">浙大二手书知识流转平台</span>
    </div>
  </div>
</template>
