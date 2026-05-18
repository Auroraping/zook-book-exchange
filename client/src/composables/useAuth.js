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

  const login = (role = 'user', customName = '浙大同学') => {
    const newUser = { id: 'me', name: customName, role }
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
