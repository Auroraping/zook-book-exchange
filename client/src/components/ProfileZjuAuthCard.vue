<script setup>
import { ref } from 'vue'
import { Loader2, ShieldCheck } from 'lucide-vue-next'

defineProps({
  profileUser: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits({
  authenticate: (payload) => !!payload.username && !!payload.password
})

const username = ref('')
const password = ref('')

const submitAuth = () => {
  emit('authenticate', { username: username.value.trim(), password: password.value })
}
</script>

<template>
  <section class="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h4 class="text-sm font-black text-gray-800">浙大统一身份认证</h4>
        <p class="text-xs text-gray-400 mt-1">认证成功后可一键导入真实课表。</p>
      </div>
      <span :class="['px-3 py-1 rounded-full text-xs font-black border', profileUser.zjuAuthenticated ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100']">
        {{ profileUser.zjuAuthenticated ? '已认证' : '未认证' }}
      </span>
    </div>
    <p v-if="profileUser.zjuAuthenticated" class="text-xs text-gray-500">已绑定学号 {{ profileUser.studentId }}，最近同步：{{ profileUser.scheduleSyncedAt || '已完成' }}</p>
    <form class="grid md:grid-cols-[1fr_1fr_auto] gap-3" @submit.prevent="submitAuth">
      <input v-model="username" required autocomplete="username" :placeholder="profileUser.zjuAuthenticated ? '再次输入统一身份认证账号' : '统一身份认证账号'" class="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
      <input v-model="password" required type="password" autocomplete="current-password" placeholder="统一身份认证密码" class="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
      <button :disabled="loading" class="h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
        <ShieldCheck v-else class="w-4 h-4" />
        {{ profileUser.zjuAuthenticated ? '重新导入课表' : '认证并一键导入' }}
      </button>
    </form>
    <p v-if="error" class="text-xs font-bold text-red-500">{{ error }}</p>
  </section>
</template>
