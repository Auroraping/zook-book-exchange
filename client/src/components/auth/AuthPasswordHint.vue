<script setup>
import { computed } from 'vue'

const props = defineProps({
  password: { type: String, required: true },
  visible: { type: Boolean, default: false }
})

const rules = computed(() => [
  { label: '8位以上', ok: props.password.length >= 8 },
  { label: '字母', ok: /[A-Za-z]/.test(props.password) },
  { label: '数字', ok: /\d/.test(props.password) },
  { label: '特殊字符', ok: /[^A-Za-z0-9]/.test(props.password) }
])
</script>

<template>
  <div v-if="visible" class="grid grid-cols-2 gap-2 text-[11px]">
    <span
      v-for="rule in rules"
      :key="rule.label"
      :class="['px-2 py-1 rounded-md border', rule.ok ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100']"
    >
      {{ rule.label }}
    </span>
  </div>
</template>
