<script setup>
import { RouterLink } from 'vue-router'
import { Search, Upload, FileText, Zap } from 'lucide-vue-next'
import { useDataLoader } from '../composables/useDataLoader.js'

const { data: features } = useDataLoader('/api/ui', (json) => json.featureCards || [])
const iconMap = { Search, Upload, FileText, Zap }
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <RouterLink v-for="(item, idx) in features" :key="idx" :to="item.path" class="premium-card p-10 group relative overflow-hidden block transition-all hover:scale-[1.02] active:scale-95">
      <div :class="`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-[100px]`"></div>
      <div :class="`w-20 h-20 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-8 shadow-lg group-hover:rotate-12 transition-transform duration-500`">
        <component :is="iconMap[item.icon]" class="w-10 h-10" />
      </div>
      <h3 class="text-2xl font-bold text-gray-800 mb-4">{{ item.title }}</h3>
      <p class="text-sm text-gray-500 leading-relaxed font-medium">{{ item.desc }}</p>
    </RouterLink>
  </section>
</template>
