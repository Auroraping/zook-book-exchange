<script setup>
const props = defineProps({
  name: { type: String, default: '' }
})
</script>

<template>
  <div class="h-[72px] px-8 flex items-center border-b border-gray-50">
    <h3 class="font-medium text-lg text-gray-800">{{ name }}</h3>
    <span class="ml-3 flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full text-green-500 bg-green-50">
      <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> 在线
    </span>
  </div>
</template>
