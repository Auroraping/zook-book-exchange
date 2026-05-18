<script setup>
import { RouterLink } from 'vue-router'
import { ShoppingCart, Upload, FileText, Zap } from 'lucide-vue-next'

const features = [
  { icon: 'ShoppingCart', title: '购书广场', desc: '智能课程匹配，精准锁定下期教材', color: 'from-blue-500 to-indigo-600', path: '/books' },
  { icon: 'Upload', title: '极速发布', desc: '拍照即识别，3秒上架您的闲置', color: 'from-emerald-500 to-teal-600', path: '/publish' },
  { icon: 'FileText', title: '笔记社区', desc: '学霸笔记加持，高分从未如此简单', color: 'from-orange-500 to-rose-600', path: '/community' },
  { icon: 'Zap', title: 'AI 分析', desc: '桃酥 AI 助你分析价格趋势，买卖不亏', color: 'from-purple-500 to-violet-600', path: '/ai-analysis' }
]
const iconMap = { ShoppingCart, Upload, FileText, Zap }
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
