<script setup>
import { RouterLink } from 'vue-router'
import { ChevronRight, Cpu } from 'lucide-vue-next'
</script>

<template>
  <aside class="bg-white border border-gray-100 rounded-[32px] shadow-sm p-7 flex flex-col gap-6">
    <div class="flex flex-col items-center text-center">
      <div class="relative mb-5">
        <div class="absolute inset-0 bg-orange-200 blur-3xl opacity-60 rounded-full"></div>
        <img src="/taosu.png" alt="桃酥" class="relative w-32 h-32 object-contain drop-shadow-xl" />
      </div>
      <span class="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-100">桃酥对话</span>
      <h1 class="mt-3 text-3xl font-black text-gray-900 tracking-tight">桃酥</h1>
      <p class="mt-3 text-sm text-gray-500 leading-relaxed">温暖治愈的 AI 知识小助手。</p>
    </div>
    <div class="rounded-3xl bg-gray-50 border border-gray-100 p-5">
      <div class="flex items-center gap-2 mb-4">
        <Cpu class="w-5 h-5 text-blue-600" />
        <h2 class="font-black text-gray-900">模型连接</h2>
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs"><span class="text-gray-500 font-bold">运行模式</span><span class="text-blue-600 font-black">DeepSeek API</span></div>
        <div class="flex items-center justify-between text-xs"><span class="text-gray-500 font-bold">连接状态</span><span class="text-emerald-600 font-black">后端代理</span></div>
        <div class="flex items-center justify-between text-xs"><span class="text-gray-500 font-bold">知识增强</span><span class="text-emerald-600 font-black">教材上下文</span></div>
      </div>
    </div>
    <RouterLink to="/community" class="mt-auto h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center gap-2 text-sm font-black hover:bg-blue-600 transition-colors">
      去知识社区 <ChevronRight class="w-4 h-4" />
    </RouterLink>
  </aside>
</template>
