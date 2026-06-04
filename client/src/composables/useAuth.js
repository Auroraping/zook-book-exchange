import { ref, readonly, computed } from 'vue'
import { getJson, postJson } from './useApi.js'

const user = ref(null)
const token = ref(localStorage.getItem('auth_token') || '')
const expireDate = ref(localStorage.getItem('auth_expire_date') || '')

const isExpired = (value) => value && new Date(value).getTime() <= Date.now()

const clearStorage = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_expire_date')
  localStorage.removeItem('zook_password')
  localStorage.removeItem('zook_username')
  localStorage.removeItem('zook_real_name')
  localStorage.removeItem('zook_student_id')
  localStorage.removeItem('zook_college')
  localStorage.removeItem('zook_major')
  localStorage.removeItem('zook_class')
  sessionStorage.removeItem('zook_password')
}

const savedUser = localStorage.getItem('user')
if (isExpired(expireDate.value)) {
  clearStorage()
  token.value = ''
  expireDate.value = ''
} else if (savedUser) {
  try {
    user.value = JSON.parse(savedUser)
  } catch {
    user.value = null
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value && !!token.value && !isExpired(expireDate.value))

  const login = (roleOrUserObj = 'user', customName = '浙大同学', authData = {}) => {
    let newUser
    if (typeof roleOrUserObj === 'object' && roleOrUserObj !== null) {
      newUser = { ...roleOrUserObj, realId: roleOrUserObj.realId || roleOrUserObj.id, id: 'me' }
    } else {
      newUser = { id: 'me', name: customName, role: roleOrUserObj, realId: 'me' }
    }
    user.value = newUser
    token.value = authData.token || token.value
    expireDate.value = authData.expireDate || expireDate.value
    localStorage.setItem('user', JSON.stringify(newUser))
    if (token.value) localStorage.setItem('auth_token', token.value)
    if (expireDate.value) localStorage.setItem('auth_expire_date', expireDate.value)
  }

  const logout = async () => {
    const oldToken = token.value
    user.value = null
    token.value = ''
    expireDate.value = ''
    clearStorage()
    if (oldToken) await postJson('/api/logout', {}, oldToken).catch(() => {})
  }

  const restoreSession = async () => {
    if (!token.value || isExpired(expireDate.value)) {
      clearStorage()
      user.value = null
      token.value = ''
      expireDate.value = ''
      return false
    }
    try {
      const data = await getJson('/api/auth/session')
      if (data.user) login(data.user, '浙大同学', { token: token.value, expireDate: data.expireDate })
      return true
    } catch {
      clearStorage()
      user.value = null
      token.value = ''
      expireDate.value = ''
      return false
    }
  }

  const updateUser = (data) => {
    const newUser = { ...user.value, ...data }
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  return {
    user: readonly(user),
    token: readonly(token),
    expireDate: readonly(expireDate),
    isLoggedIn,
    login,
    logout,
    restoreSession,
    updateUser
  }
}
