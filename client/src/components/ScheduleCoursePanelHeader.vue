<script setup>
import { BookOpen, MapPin, User, X } from 'lucide-vue-next'

const props = defineProps({
  course: { type: Object, required: true }
})
const emit = defineEmits(['close'])
</script>

<template>
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <BookOpen class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-2xl font-black text-gray-900">{{ course.name }}</h3>
        <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span class="flex items-center gap-1"><User class="w-4 h-4" /> {{ course.teacher }}</span>
          <span class="flex items-center gap-1"><MapPin class="w-4 h-4" /> {{ course.location }}</span>
        </div>
      </div>
    </div>
    <button @click="emit('close')" class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
      <X class="w-5 h-5" />
    </button>
  </div>
</template>
