<script setup>
defineProps({
  modelValue: { type: Boolean, required: true }
})

defineEmits({
  'update:modelValue': (value) => typeof value === 'boolean'
})
</script>

<template>
  <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
    <input
      type="checkbox"
      :checked="modelValue"
      class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span>14天内免登录</span>
  </label>
</template>
