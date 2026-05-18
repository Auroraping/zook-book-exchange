<script setup>
import { BookOpen, CalendarDays } from 'lucide-vue-next'

const props = defineProps({
  tabs: { type: Array, required: true },
  selectedMiniSemester: { type: String, required: true },
  currentView: { type: String, required: true },
  courseCount: { type: Number, required: true }
})
const emit = defineEmits(['update:selectedMiniSemester', 'update:currentView'])
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-100 p-3 rounded-[24px] shadow-sm">
    <div class="flex items-center gap-2">
      <button v-for="tab in tabs" :key="tab.id" @click="emit('update:selectedMiniSemester', tab.id)" :class="['px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200', selectedMiniSemester === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50']">{{ tab.name }}</button>
    </div>
    <div class="flex items-center gap-4">
      <div class="text-xs font-bold text-gray-400 hidden md:block">当前学期已加载 <span class="text-blue-600 font-black text-sm">{{ courseCount }}</span> 门课程</div>
      <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/40">
        <button @click="emit('update:currentView', 'grid')" :class="['px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 duration-300', currentView === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"><CalendarDays class="w-4 h-4" /> 课表网格视图</button>
        <button @click="emit('update:currentView', 'list')" :class="['px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 duration-300', currentView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"><BookOpen class="w-4 h-4" /> 教材指定清单</button>
      </div>
    </div>
  </div>
</template>
