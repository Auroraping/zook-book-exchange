<script setup>
import { CheckCircle2, Info, ShoppingBag, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  courses: { type: Array, required: true },
  getOfficialBook: { type: Function, required: true },
  getSecondhandBooks: { type: Function, required: true },
  textbookStatusMessage: { type: String, default: '' }
})
const emit = defineEmits(['addToCart'])
</script>

<template>
  <div class="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col gap-6 mt-4">
    <div class="flex items-center justify-between pb-4 border-b border-gray-100">
      <h3 class="text-base font-black text-gray-900 flex items-center gap-2"><Sparkles class="w-5 h-5 text-blue-600" /> 本学期全部课程教材对照表</h3>
      <span class="text-xs font-bold text-gray-400">教务官方教材与在售情况</span>
    </div>
    <div class="divide-y divide-gray-100">
      <div v-for="course in courses" :key="course.id" class="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/40 px-4 -mx-4 rounded-2xl transition-colors group">
        <div class="flex items-start gap-4 md:w-1/4 shrink-0">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform duration-300">{{ course.name.slice(0, 2) }}</div>
          <div><h4 class="font-extrabold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{{ course.name }}</h4><p class="text-[10px] text-gray-400 mt-1 font-bold">教师: {{ course.teacher }} · {{ course.type || '专业课' }}</p></div>
        </div>
        <div class="flex-1 min-w-0 md:px-4">
          <div v-if="getOfficialBook(course) && getOfficialBook(course).bookName !== '无教材'" class="flex items-center gap-3">
            <div class="min-w-0"><span class="text-xs font-extrabold text-gray-400">官方指定：</span><span class="text-xs font-extrabold text-gray-900">《{{ getOfficialBook(course).bookName }}》</span><p class="text-[10px] text-gray-400 mt-0.5 truncate" v-if="getOfficialBook(course).author !== '暂无' && getOfficialBook(course).author !== '无'">作者: {{ getOfficialBook(course).author }} · 第 {{ getOfficialBook(course).version }} 版</p></div>
          </div>
          <div v-else-if="getOfficialBook(course) && getOfficialBook(course).bookName === '无教材'" class="flex items-center gap-2 text-slate-400"><CheckCircle2 class="w-4 h-4 text-emerald-500" /><span class="text-xs font-extrabold text-slate-500">官方提示：本课程无需使用教材</span></div>
          <div v-else class="flex items-center gap-2 text-slate-400"><Info class="w-4 h-4 text-slate-400" /><span class="text-xs font-extrabold text-slate-400">{{ textbookStatusMessage || '当前未同步到官方教材信息' }}</span></div>
        </div>
        <div class="md:w-1/3 shrink-0 flex items-center justify-between md:justify-end gap-6">
          <div class="text-left md:text-right min-w-[120px]">
            <template v-if="getOfficialBook(course) && getOfficialBook(course).bookName !== '无教材'"><div v-if="getSecondhandBooks(course).length > 0"><span class="text-xs font-bold text-emerald-600">二手最低</span><span class="text-lg font-black text-emerald-600">¥{{ Math.min(...getSecondhandBooks(course).map(b => b.price)) }}</span></div><span v-else class="text-xs font-extrabold text-slate-400 block">暂无二手在售</span></template>
            <template v-else-if="getOfficialBook(course) && getOfficialBook(course).bookName === '无教材'"><span class="text-xs font-extrabold text-slate-500 block">无需教材</span></template>
            <template v-else><span class="text-xs font-extrabold text-slate-400 block">教务无数据</span></template>
          </div>
          <div class="shrink-0">
            <button v-if="getOfficialBook(course) && getOfficialBook(course).bookName !== '无教材' && getSecondhandBooks(course).length > 0" @click="emit('addToCart', getSecondhandBooks(course).sort((a,b) => a.price - b.price)[0].id)" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 active:scale-95 transition-all flex items-center gap-1 duration-300"><ShoppingBag class="w-3.5 h-3.5" /> 一键淘书</button>
            <span v-else-if="getOfficialBook(course) && getOfficialBook(course).bookName === '无教材'" class="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl block">无需教材</span>
            <span v-else class="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl block">{{ getOfficialBook(course) ? '暂无二手' : '无法爬取' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
