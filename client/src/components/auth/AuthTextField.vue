<script setup>
defineProps({
  modelValue: { type: String, required: true },
  type: { type: String, default: 'text' },
  label: { type: String, required: true },
  autocomplete: { type: String, default: '' },
  required: { type: Boolean, default: true }
})

defineEmits({
  'update:modelValue': (value) => typeof value === 'string'
})
</script>

<template>
  <div class="relative">
    <input
      :type="type"
      :required="required"
      :autocomplete="autocomplete"
      :value="modelValue"
      class="peer w-full h-12 border border-gray-300 rounded-lg px-4 pt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-transparent"
      placeholder=" "
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <label class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
      {{ label }}
    </label>
  </div>
</template>
