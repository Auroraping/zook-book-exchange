<script setup>
import { ref, onMounted } from 'vue'
import { Trophy, BookOpen, Star, Flame } from 'lucide-vue-next'

const achievements = ref([])
const iconMap = { Star, BookOpen, Flame, Trophy }

onMounted(async () => {
  const res = await fetch('/data/ui.json')
  const ui = await res.json()
  achievements.value = ui.achievements || []
})
</script>

<template>
  <div class="max-w-3xl mx-auto py-12 animate-google-in">
    <div class="text-center mb-12">
      <Trophy class="w-16 h-16 text-yellow-500 mx-auto mb-6" />
      <h1 class="text-4xl font-black text-gray-900 mb-4">成就勋章</h1>
      <p class="text-gray-500">记录你在浙大书海中的每一步成长。</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="(ach, idx) in achievements" :key="idx" :class="['bg-white rounded-3xl border p-8 flex gap-6 items-center transition-all', ach.unlocked ? 'border-yellow-200 shadow-sm' : 'border-gray-100 opacity-50']">
        <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center', ach.unlocked ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-300']">
          <component :is="iconMap[ach.icon]" class="w-8 h-8" />
        </div>
        <div>
          <h3 :class="['font-bold text-lg', ach.unlocked ? 'text-gray-900' : 'text-gray-400']">{{ ach.title }}</h3>
          <p class="text-sm text-gray-500">{{ ach.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
