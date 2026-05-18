<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <section class="relative py-20">
    <div class="flex flex-col items-center text-center relative z-10">
      <h1 class="text-8xl font-black mb-10 tracking-tight leading-tight">
        <span class="premium-gradient-text">好书淘不尽</span><br/>
        <span class="premium-gradient-text uppercase">浙里top three</span>
      </h1>
      <p class="text-2xl text-gray-500 mb-16 max-w-3xl leading-relaxed font-medium">
        告别昂贵的新书，拥抱传承的智慧。<br/>在"浙里淘书"，每一本教材都是学长留给你的通关秘籍。
      </p>
      <div class="flex items-center gap-6">
        <RouterLink to="/books" class="btn-premium !px-12 !py-6 text-xl flex items-center gap-3">
          立即探索广场 <ArrowRight class="w-6 h-6" />
        </RouterLink>
        <RouterLink to="/publish" class="px-10 py-5 rounded-full border-2 border-gray-900 font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all text-xl">我要出书</RouterLink>
      </div>
      <!-- IP形象：桃酥 -->
      <RouterLink to="/ai-analysis" class="mt-20 flex flex-col items-center group/taosu">
        <div class="relative group">
          <div class="absolute inset-0 bg-orange-400 blur-2xl opacity-20 group-hover/taosu:opacity-40 transition-opacity rounded-full"></div>
          <img src="/taosu.png" alt="桃酥 Taosu" class="w-48 h-48 object-contain relative z-10 mix-blend-multiply group-hover/taosu:scale-105 transition-transform" />
          <div class="absolute -top-4 -right-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-float">
            <p class="text-xs font-bold text-gray-800 whitespace-nowrap">嗨！我是桃酥~ <br/><span class="text-orange-500">点我进入 AI 助手</span></p>
            <div class="absolute bottom-[-6px] left-4 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45"></div>
          </div>
        </div>
      </RouterLink>
    </div>
    <div class="absolute top-20 right-[15%] w-32 h-32 bg-blue-100 rounded-[30px] rotate-12 blur-sm -z-10 animate-pulse"></div>
    <div class="absolute bottom-20 left-[15%] w-24 h-24 bg-rose-100 rounded-[20px] -rotate-12 blur-sm -z-10 animate-float"></div>
  </section>
</template>
