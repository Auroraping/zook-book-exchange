<script setup>
import { BookOpen, Info } from 'lucide-vue-next'

const props = defineProps({
  textbook: { type: Object, default: null },
  statusMessage: { type: String, default: '' }
})
</script>

<template>
  <div v-if="textbook" class="mb-8 p-6 rounded-3xl border border-slate-200 bg-slate-50 text-slate-800">
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-2xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm"><BookOpen class="w-6 h-6" /></div>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h4 class="text-base font-extrabold flex items-center gap-2">教务官方指定教材<span class="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-800 border border-blue-200/40">{{ textbook.status || '教务预订' }}</span></h4>
          <span class="text-[10px] font-bold text-gray-400" v-if="textbook.source">数据源：{{ textbook.source }}</span>
        </div>
        <div class="mt-3 p-4 bg-white rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div class="min-w-0">
            <p class="font-extrabold text-gray-900 truncate text-sm">{{ textbook.bookName }}</p>
            <p class="text-[10px] text-gray-400 mt-1 truncate" v-if="textbook.bookName !== '无教材'">作者：{{ textbook.author }} · 出版社：{{ textbook.press }} · 版本：第 {{ textbook.version }} 版</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="mb-8 p-6 rounded-3xl border border-slate-200 bg-slate-50 text-slate-800">
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-2xl bg-white text-gray-400 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm"><Info class="w-6 h-6 text-slate-400" /></div>
      <div class="flex-1 min-w-0">
        <h4 class="text-base font-extrabold text-slate-700">官方指定教材：暂无数据</h4>
        <div class="mt-3 p-4 bg-white rounded-2xl border border-slate-100 text-xs font-bold text-slate-500 leading-relaxed">教务教材同步提示：{{ statusMessage || '当前没有从教务网同步到该课程的官方教材。' }}</div>
      </div>
    </div>
  </div>
</template>
