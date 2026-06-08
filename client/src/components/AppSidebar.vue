<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { Search, Heart, CalendarDays, BookOpen, Bell, Plus, Star } from 'lucide-vue-next'
import AppLogo from './AppLogo.vue'
import { useDataLoader } from '../composables/useDataLoader.js'

const route = useRoute()
const { data: navItems } = useDataLoader('/api/ui', (json) => json.navigation || [])

const iconMap = { Search, Heart, CalendarDays, BookOpen, Bell, Star }

const colorMap = {
  blue: 'text-blue-600 bg-blue-50',
  purple: 'text-purple-600 bg-purple-50',
  red: 'text-red-600 bg-red-50',
  yellow: 'text-amber-600 bg-amber-50',
  green: 'text-emerald-600 bg-emerald-50',
  orange: 'text-orange-600 bg-orange-50',
}

const isActive = (path) => {
  const [pathname] = path.split('?')
  if (path.includes('?')) return route.fullPath === path
  return route.path === pathname || route.path.startsWith(pathname + '/')
}
</script>

<template>
  <aside class="w-24 flex flex-col items-center py-6 sticky top-0 h-screen z-50 bg-white/80 backdrop-blur-xl border-r border-gray-100/50">
    <RouterLink to="/" class="w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform mb-8">
      <AppLogo :show-text="false" class-name="h-12" />
    </RouterLink>
    <nav class="flex flex-col gap-4 flex-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['relative group flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all duration-300', isActive(item.path) ? colorMap[item.color] : 'text-gray-400 hover:text-gray-800']"
      >
        <div :class="['p-1 rounded-lg transition-transform', isActive(item.path) ? 'scale-110' : 'group-hover:scale-110']">
          <img v-if="item.icon === 'taosu'" src="/taosu.png" alt="桃酥" class="w-8 h-8 object-contain" />
          <component v-else :is="iconMap[item.icon]" class="w-6 h-6" />
        </div>
        <span class="text-[10px] font-bold tracking-tighter uppercase">{{ item.label }}</span>
      </RouterLink>
    </nav>
    <div class="flex flex-col gap-3 mt-auto">
      <RouterLink to="/publish" class="w-12 h-12 bg-gray-900 rounded-[16px] flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform active:scale-95 group">
        <Plus class="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </RouterLink>
    </div>
  </aside>
</template>
