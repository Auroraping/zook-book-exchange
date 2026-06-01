<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, Info } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth.js'
import { postJson } from '../composables/useApi.js'
import AppLogo from '../components/AppLogo.vue'

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const router = useRouter()
const { login } = useAuth()

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true
  try {
    const endpoint = isLogin.value ? '/api/login' : '/api/register'
    const data = await postJson(endpoint, {
      username: username.value,
      password: password.value,
      name: username.value,
    })
    // 保存凭据用于课表拉取
    localStorage.setItem('zook_username', username.value)
    localStorage.setItem('zook_password', password.value)

    // 一键登录实名同步：如果有随登录接口自动带回的实名信息，直接一秒落盘！
    if (data.user) {
      // 将真名单独存储到 localStorage，不去覆盖网名
      if (data.user.realName) localStorage.setItem('zook_real_name', data.user.realName)
      if (data.user.studentId) localStorage.setItem('zook_student_id', data.user.studentId)
      if (data.user.college) localStorage.setItem('zook_college', data.user.college)
      if (data.user.major) localStorage.setItem('zook_major', data.user.major)
      if (data.user.class) localStorage.setItem('zook_class', data.user.class)
      
      // 极致兜底：如果后端返回的名字是默认原名且本地 LocalStorage 曾有自定义网名，静默重新回写后端激活
      const localCached = localStorage.getItem('user')
      let mergedUser = { ...data.user }
      if (localCached) {
        try {
          const prev = JSON.parse(localCached)
          if (prev.name && prev.name !== '浙大同学' && prev.name !== username.value) {
            if (!data.user.name || data.user.name === data.user.realName || data.user.name === username.value) {
              mergedUser.name = prev.name
              postJson('/api/user/update', { userId: data.user.id, name: prev.name }).catch(() => {})
            }
          }
          if (prev.avatar && prev.avatar !== '/user_avatar.png' && (!data.user.avatar || data.user.avatar.includes('identicon'))) {
            mergedUser.avatar = prev.avatar
            postJson('/api/user/update', { userId: data.user.id, avatar: prev.avatar }).catch(() => {})
          }
        } catch {}
      }
      login(mergedUser)
    } else {
      login('user', username.value)
    }
    router.push('/')
  } catch (err) {
    error.value = err.message || '无法连接到验证服务器，请确保后端已启动'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-6">
    <div class="w-full max-w-[440px] flex flex-col items-center">
      <div class="mb-8 flex flex-col items-center gap-4">
        <AppLogo class-name="h-14" />
        <h2 class="text-xl font-normal text-gray-800 mt-2">{{ isLogin ? '登录' : '创建账号' }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ isLogin ? '使用您的校园账号继续，桃酥 AI 伴你左右' : '加入浙大专属学术资源流转平台' }}</p>
      </div>
      <div class="w-full p-8 border border-gray-200 rounded-[32px] bg-white shadow-sm">
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
          <div class="relative">
            <input type="text" required v-model="username" class="peer w-full h-12 border border-gray-300 rounded-lg px-4 pt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-transparent" placeholder=" " />
            <label class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">学号 / 浙大邮箱</label>
          </div>
          <div class="relative">
            <input type="password" required v-model="password" class="peer w-full h-12 border border-gray-300 rounded-lg px-4 pt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-transparent" placeholder=" " />
            <label class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">密码</label>
          </div>
          <div v-if="error" class="flex items-center gap-2 text-red-500 text-xs font-bold px-1">
            <Info class="w-4 h-4" />{{ error }}
          </div>
          <div class="flex justify-between items-center mt-2">
            <button type="button" @click="isLogin = !isLogin" class="text-sm text-blue-600 font-medium hover:underline">{{ isLogin ? '创建账号' : '已有账号？登录' }}</button>
            <button type="submit" :disabled="isLoading" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2">
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />{{ isLogin ? '登录' : '注册' }}
            </button>
          </div>
        </form>
      </div>
      <div class="mt-12 text-center">
        <p class="text-xs text-gray-400">本系统仅限浙江大学在校师生使用<br/>登录即代表您同意《浙里淘书服务协议》</p>
      </div>
    </div>
  </div>
</template>
