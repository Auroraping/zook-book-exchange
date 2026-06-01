import { ref, readonly, computed } from 'vue'

const user = ref(null)

const savedUser = localStorage.getItem('user')
if (savedUser) {
  try {
    user.value = JSON.parse(savedUser)
  } catch {
    user.value = null
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)

  const login = (roleOrUserObj = 'user', customName = '浙大同学') => {
    let newUser
    if (typeof roleOrUserObj === 'object' && roleOrUserObj !== null) {
      // 新签名：传入完整用户对象，id 强制为 'me' 保持全站一致
      newUser = { ...roleOrUserObj, id: 'me' }
    } else {
      // 旧签名兼容：login('user', '浙大同学')
      newUser = { id: 'me', name: customName, role: roleOrUserObj }
    }
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('zook_username')
    localStorage.removeItem('zook_password')
    localStorage.removeItem('zook_real_name')
    localStorage.removeItem('zook_student_id')
    localStorage.removeItem('zook_college')
    localStorage.removeItem('zook_major')
    localStorage.removeItem('zook_class')
  }

  const updateUser = (data) => {
    const newUser = { ...user.value, ...data }
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  return {
    user: readonly(user),
    isLoggedIn,
    login,
    logout,
    updateUser
  }
}
