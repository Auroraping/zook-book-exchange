<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { postJson } from '../composables/useApi.js'
import { removeStored, setStored } from '../composables/useSessionStore.js'
import AppLogo from '../components/AppLogo.vue'
import AuthErrorMessage from '../components/auth/AuthErrorMessage.vue'
import AuthSubmitActions from '../components/auth/AuthSubmitActions.vue'
import AuthTextField from '../components/auth/AuthTextField.vue'

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const remember = ref(true)
const isLoading = ref(false)
const error = ref('')
const router = useRouter()
const { login } = useAuth()

const cacheRealInfo = (userData) => {
  setStored('zook_username', userData.username || userData.email || email.value)
  if (userData.id) setStored('zook_user_uuid', userData.id)
  if (!userData.zjuAuthenticated) {
    removeStored('zook_real_name')
    removeStored('zook_student_id')
    removeStored('zook_college')
    removeStored('zook_major')
    removeStored('zook_class')
    return
  }
  setStored('zook_real_name', userData.realName)
  setStored('zook_student_id', userData.studentId)
  setStored('zook_college', userData.college)
  setStored('zook_major', userData.major)
  setStored('zook_class', userData.class)
}

const validateBeforeSubmit = () => {
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.value)) return '邮箱格式不正确'
  if (!password.value) return '请输入密码'
  if (!isLogin.value && password.value !== confirmPassword.value) return '两次输入的密码不一致'
  return ''
}

const handleSubmit = async () => {
  error.value = validateBeforeSubmit()
  if (error.value) return
  isLoading.value = true
  try {
    const endpoint = isLogin.value ? '/api/login' : '/api/register'
    const data = await postJson(endpoint, {
      email: email.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      name: email.value.trim().split('@')[0],
      remember: remember.value
    })
    if (data.user) {
      cacheRealInfo(data.user)
      login(data.user, '浙大同学', data)
    } else {
      login('user', email.value.trim(), data)
    }
    router.push('/')
  } catch (err) {
    error.value = err.message || '无法连接到认证服务器，请确认后端已启动'
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
        <p class="text-sm text-gray-500 mt-1">{{ isLogin ? '使用账号登录，进入浙里淘书' : '使用邮箱注册平台账号' }}</p>
      </div>
      <div class="w-full p-8 border border-gray-200 rounded-[32px] bg-white shadow-sm">
        <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
          <AuthTextField v-model="email" autocomplete="email" label="邮箱" />
          <AuthTextField v-model="password" type="password" autocomplete="current-password" label="密码" />
          <AuthTextField v-if="!isLogin" v-model="confirmPassword" type="password" autocomplete="new-password" label="确认密码" />
          
          <div class="flex items-center justify-between -mt-2">
            <label class="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input v-model="remember" type="checkbox" class="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span>3天免登录</span>
            </label>
          </div>

          <AuthErrorMessage :message="error" />
          <AuthSubmitActions :is-login="isLogin" :is-loading="isLoading" @toggle-mode="isLogin = !isLogin" />
        </form>
      </div>
      <div class="mt-12 text-center">
        <p class="text-xs text-gray-400">本系统仅限浙江大学在校师生使用<br/>登录即代表您同意《浙里淘书服务协议》</p>
      </div>
    </div>
  </div>
</template>
