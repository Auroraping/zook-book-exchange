<script setup>
import { Trophy, BookOpen, Star, Flame } from 'lucide-vue-next'

const achievements = [
  { title: '初出茅庐', desc: '完成第一笔交易', icon: 'Star', unlocked: true },
  { title: '淘书达人', desc: '累计交易 5 本书籍', icon: 'BookOpen', unlocked: true },
  { title: '知识传灯人', desc: '累计出售 10 本书籍', icon: 'Flame', unlocked: false },
  { title: '桃酥好友', desc: '使用 AI 助手 10 次', icon: 'Star', unlocked: false },
]
const iconMap = { Star, BookOpen, Flame, Trophy }
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
