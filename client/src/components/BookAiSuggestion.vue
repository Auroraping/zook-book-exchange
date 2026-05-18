<script setup>
import { Info, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  book: { type: Object, required: true }
})
</script>

<template>
  <section class="bg-blue-50/30 rounded-[32px] p-10 relative overflow-hidden">
    <div class="absolute top-0 right-0 p-10 opacity-[0.03]">
      <Sparkles class="w-40 h-40 text-blue-600" />
    </div>
    <div class="relative z-10">
      <h3 class="flex items-center gap-2 text-xl font-medium text-gray-800 mb-8">
        <Info class="w-5 h-5 text-blue-600" /> AI 选书建议
      </h3>
      <div class="flex items-start gap-8 mb-10">
        <div class="w-16 h-16 shrink-0 rounded-2xl bg-white flex flex-col items-center justify-center shadow-sm">
          <span class="text-[10px] font-bold text-gray-500 uppercase mb-0.5">评分</span>
          <span class="text-2xl font-bold text-blue-600">{{ book.aiScore }}</span>
        </div>
        <p class="text-lg text-gray-500 leading-relaxed italic">"{{ book.aiSummary }}"</p>
      </div>
      <div class="text-gray-500 text-sm leading-loose whitespace-pre-wrap px-1">这位校友很详细地描述了书籍情况。经过系统核验，书籍情况属实。建议私聊获取更多细节。</div>
    </div>
  </section>
</template>
