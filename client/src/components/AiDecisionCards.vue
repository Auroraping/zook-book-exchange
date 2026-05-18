<script setup>
import { CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  cards: { type: Array, required: true }
})
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-3 gap-5">
    <div v-for="card in cards" :key="card.title" class="bg-white border border-gray-100 rounded-[24px] p-6 flex items-start gap-4">
      <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <CheckCircle2 class="w-5 h-5" />
      </div>
      <div>
        <h3 class="font-black text-gray-900">{{ card.title }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ card.desc }}</p>
      </div>
    </div>
  </section>
</template>
