<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  nickname: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits({
  save: (name) => typeof name === 'string'
})

const name = ref(props.nickname)

watch(() => props.nickname, (value) => {
  name.value = value || ''
})
</script>

<template>
  <form class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4" @submit.prevent="emit('save', name.trim())">
    <div>
      <h4 class="text-sm font-black text-gray-800">昵称自定义</h4>
      <p class="text-xs text-gray-400 mt-1">昵称用于站内展示，不会覆盖真实教务姓名。</p>
    </div>
    <div class="flex gap-3">
      <input v-model="name" required maxlength="24" class="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
      <button :disabled="saving" class="h-11 px-5 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-60">保存昵称</button>
    </div>
    <p v-if="error" class="text-xs font-bold text-red-500">{{ error }}</p>
  </form>
</template>
