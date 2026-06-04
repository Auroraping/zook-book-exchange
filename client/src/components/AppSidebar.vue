<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { Search, Heart, ShoppingCart, CalendarDays, BookOpen, Bell, Plus } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted } from 'vue'
import AppLogo from './AppLogo.vue'
import { useDataLoader } from '../composables/useDataLoader.js'
import { getJson } from '../composables/useApi.js'

const route = useRoute()
const cartCount = ref(0)
const { data: navItems } = useDataLoader('/api/ui', (json) => json.navigation || [])

const updateCart = async () => {
  const cart = await getJson('/api/cart?userId=me').catch(() => ({ bookIds: JSON.parse(localStorage.getItem('cart') || '[]') }))
  cartCount.value = cart.bookIds.length
  localStorage.setItem('cart', JSON.stringify(cart.bookIds))
}

onMounted(() => {
  updateCart()
  window.addEventListener('cartUpdated', updateCart)
})
onUnmounted(() => {
  window.removeEventListener('cartUpdated', updateCart)
})

const iconMap = { Search, Heart, ShoppingCart, CalendarDays, BookOpen, Bell }

const colorMap = {
  blue: 'text-blue-600 bg-blue-50',
  purple: 'text-purple-600 bg-purple-50',
  yellow: 'text-amber-600 bg-amber-50',
  green: 'text-emerald-600 bg-emerald-50',
  orange: 'text-orange-600 bg-orange-50',
}

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
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
        <span v-if="item.hasCount && cartCount > 0" class="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">
          {{ cartCount }}
        </span>
      </RouterLink>
    </nav>
    <div class="flex flex-col gap-3 mt-auto">
      <RouterLink to="/publish" class="w-12 h-12 bg-gray-900 rounded-[16px] flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform active:scale-95 group">
        <Plus class="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </RouterLink>
    </div>
  </aside>
</template>
