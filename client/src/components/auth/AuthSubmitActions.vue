<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  isLogin: { type: Boolean, required: true },
  isLoading: { type: Boolean, default: false }
})

defineEmits({
  toggleMode: null
})
</script>

<template>
  <div class="flex justify-between items-center pt-1">
    <button type="button" class="text-sm text-blue-600 font-medium hover:underline" @click="$emit('toggleMode')">
      {{ isLogin ? '创建账号' : '已有账号？登录' }}
    </button>
    <button type="submit" :disabled="isLoading" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2">
      <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
      {{ isLogin ? '登录' : '注册' }}
    </button>
  </div>
</template>
