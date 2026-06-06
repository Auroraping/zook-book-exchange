import { ref, readonly, computed } from 'vue'
import { getJson, postJson } from './useApi.js'

const user = ref(null)
const token = ref(sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || '')
const expireDate = ref(sessionStorage.getItem('auth_expire_date') || localStorage.getItem('auth_expire_date') || '')

const isExpired = (value) => value && new Date(value).getTime() <= Date.now()
const readStored = (key) => sessionStorage.getItem(key) || localStorage.getItem(key)

const authKeys = [
  'user', 'auth_token', 'auth_expire_date', 'zook_password',
  'zook_username', 'zook_user_uuid', 'zook_real_name',
  'zook_student_id', 'zook_college', 'zook_major', 'zook_class'
]

const clearStorage = (all = false) => {
  authKeys.forEach((key) => sessionStorage.removeItem(key))
  if (all) authKeys.forEach((key) => localStorage.removeItem(key))
}

const clearLocalIfToken = (value) => {
  if (value && localStorage.getItem('auth_token') === value) {
    authKeys.forEach((key) => localStorage.removeItem(key))
  }
}

const persistSession = (newUser) => {
  sessionStorage.setItem('user', JSON.stringify(newUser))
  if (token.value) sessionStorage.setItem('auth_token', token.value)
  if (expireDate.value) sessionStorage.setItem('auth_expire_date', expireDate.value)
}

const savedUser = readStored('user')
if (isExpired(expireDate.value)) {
  clearStorage(true)
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
    persistSession(newUser)
    if (authData.remember !== false) {
      localStorage.setItem('user', JSON.stringify(newUser))
      if (token.value) localStorage.setItem('auth_token', token.value)
      if (expireDate.value) localStorage.setItem('auth_expire_date', expireDate.value)
    }
  }

  const logout = async () => {
    const oldToken = token.value
    user.value = null
    token.value = ''
    expireDate.value = ''
    clearStorage()
    clearLocalIfToken(oldToken)
    if (oldToken) await postJson('/api/logout', {}, oldToken).catch(() => {})
  }

  const restoreSession = async () => {
    const hasTabSession = !!sessionStorage.getItem('auth_token')
    if (!token.value || isExpired(expireDate.value)) {
      const staleToken = token.value
      clearStorage(isExpired(expireDate.value))
      clearLocalIfToken(staleToken)
      user.value = null
      token.value = ''
      expireDate.value = ''
      return false
    }
    try {
      const data = await getJson('/api/auth/session')
      if (data.user) {
        const sameRememberedToken = localStorage.getItem('auth_token') === token.value
        login(data.user, '浙大同学', {
          token: token.value,
          expireDate: data.expireDate,
          remember: !hasTabSession || sameRememberedToken
        })
      }
      return true
    } catch {
      const staleToken = token.value
      clearStorage()
      clearLocalIfToken(staleToken)
      user.value = null
      token.value = ''
      expireDate.value = ''
      return false
    }
  }

  const updateUser = (data) => {
    const newUser = { ...user.value, ...data }
    user.value = newUser
    sessionStorage.setItem('user', JSON.stringify(newUser))
    if (localStorage.getItem('auth_token') === token.value) {
      localStorage.setItem('user', JSON.stringify(newUser))
    }
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
