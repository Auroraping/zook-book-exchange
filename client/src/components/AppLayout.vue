<script setup>
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="min-h-screen flex bg-[#fbfcfd] bg-grid-pattern selection:bg-purple-100 selection:text-purple-600">
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>
    <AppSidebar />
    <div class="flex-1 flex flex-col relative z-10">
      <AppHeader />
      <main class="px-16 py-12">
        <div class="max-w-7xl mx-auto">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
