<script setup>
import { ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  campuses: { type: Array, required: true },
  categories: { type: Array, required: true },
  selectedCampuses: { type: Array, required: true },
  selectedCategory: { type: String, required: true }
})
const emit = defineEmits(['toggleCampus', 'reset', 'wish', 'update:selectedCategory'])
</script>

<template>
  <aside class="w-[320px] shrink-0 sticky top-32">
    <div class="premium-card p-10 !rounded-[40px] shadow-2xl shadow-blue-900/5">
      <div class="flex items-center gap-4 mb-10">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg"><SlidersHorizontal class="w-6 h-6"/></div>
        <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">筛选</h2>
      </div>
      <div class="space-y-12">
        <div>
          <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><div class="w-4 h-[1px] bg-gray-200"></div> 校区分布</h4>
          <div class="flex flex-col gap-4">
            <label v-for="campus in campuses" :key="campus" class="flex items-center gap-4 cursor-pointer group">
              <div :class="['w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center', selectedCampuses.includes(campus) ? 'bg-blue-600 border-blue-600 shadow-md' : 'border-gray-200 group-hover:border-blue-400']">
                <input type="checkbox" class="hidden" :checked="selectedCampuses.includes(campus)" @change="emit('toggleCampus', campus)" />
                <svg v-if="selectedCampuses.includes(campus)" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <span :class="['text-sm font-bold transition-colors', selectedCampuses.includes(campus) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900']">{{ campus }}</span>
            </label>
          </div>
        </div>
        <div>
          <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><div class="w-4 h-[1px] bg-gray-200"></div> 学科分类</h4>
          <div class="relative group">
            <select :value="selectedCategory" @change="emit('update:selectedCategory', $event.target.value)" class="w-full bg-gray-50 border-none rounded-[18px] h-14 px-6 text-sm font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer appearance-none">
              <option v-for="opt in categories" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-blue-600 transition-colors"><ChevronRight class="w-5 h-5 rotate-90" /></div>
          </div>
        </div>
        <button @click="emit('reset')" class="w-full h-14 bg-gray-900 text-white rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">重置全部</button>
      </div>
    </div>
    <div class="mt-8 premium-card p-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-2xl relative overflow-hidden group">
      <div class="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
      <Sparkles class="w-10 h-10 mb-6 text-yellow-300" />
      <h4 class="text-xl font-black mb-3">没找到需要的书？</h4>
      <p class="text-xs text-white/70 leading-relaxed mb-8 font-medium">登记您的心愿清单，桃酥 AI 将为您全校实时监控。</p>
      <button @click="emit('wish')" class="w-full py-4 bg-white text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] transition-all active:scale-95">登记心愿</button>
    </div>
  </aside>
</template>
