<script setup>
import { RouterLink } from 'vue-router'
import { Calendar, ShieldCheck, Star, Camera } from 'lucide-vue-next'

const props = defineProps({
  profileUser: { type: Object, required: true }
})

defineEmits(['edit-avatar'])
</script>

<template>
  <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="h-40 bg-gradient-to-r from-blue-600 to-blue-400 relative"><div class="absolute inset-0 opacity-20"></div></div>
    <div class="px-12 pb-8 relative">
      <div class="flex justify-between items-end">
        <div class="flex items-end gap-8 mt-[-60px]">
          <div class="relative group cursor-pointer" @click="$emit('edit-avatar')">
            <img :src="profileUser.avatar" class="w-40 h-40 rounded-3xl border-[6px] border-white shadow-xl bg-white object-cover" />
            <!-- 高端悬停修改遮罩 -->
            <div class="absolute inset-[6px] rounded-[18px] bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 text-white">
              <Camera class="w-6 h-6 animate-pulse" />
              <span class="text-[10px] font-black tracking-widest uppercase">修改头像</span>
            </div>
            <div v-if="profileUser.credit >= 4.8" class="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-xl shadow-lg border-2 border-white"><Star class="w-5 h-5 fill-current" /></div>
          </div>
          <div class="mb-2">
            <div class="flex items-center gap-3 mb-1"><h2 class="text-3xl font-black text-gray-800">{{ profileUser.name }}</h2><span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100">{{ profileUser.level }}</span></div>
            <p class="text-gray-500 font-medium text-sm mb-3">{{ profileUser.bio }}</p>
            <div v-if="profileUser.studentId" class="flex flex-wrap gap-2 mb-4">
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">学院：{{ profileUser.college }}</span>
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">专业：{{ profileUser.major }}</span>
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">班级：{{ profileUser.classText }}</span>
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">学号：{{ profileUser.studentId }}</span>
            </div>
            <div v-else class="mb-4">
              <RouterLink to="/schedule" class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-all shadow-sm">提示：前往「我的课表」同步教务，即可一键完成实名认证</RouterLink>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Calendar class="w-4 h-4" /> 加入时间: {{ profileUser.joinDate }}</div>
              <div class="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><ShieldCheck :class="['w-4 h-4', profileUser.studentId ? 'text-green-500' : 'text-gray-300']" /> {{ profileUser.studentId ? '已通过浙大统一身份认证' : '未完成统一身份认证' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
