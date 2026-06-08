import { computed } from 'vue'
import { useAuth } from './useAuth.js'
import { getStored } from './useSessionStore.js'

export function useCurrentAccount() {
  const { user } = useAuth()
  const accountId = computed(() => user.value?.realId || getStored('zook_user_uuid') || 'me')
  return { user, accountId }
}
