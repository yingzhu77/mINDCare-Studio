import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMe } from '@/api/admin'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref(localStorage.getItem('token') || '')
    const user = ref(null)

    const isLoggedIn = computed(() => !!token.value)
    const role = computed(() => user.value?.role || '')
    const isAdmin = computed(() => role.value === 'admin')
    const username = computed(() => user.value?.username || '')

    const setToken = (newToken) => {
      token.value = newToken
      localStorage.setItem('token', newToken)
    }

    const setUser = (userInfo) => {
      user.value = userInfo
    }

    const fetchUserInfo = async () => {
      if (!token.value) return null
      try {
        const data = await getMe()
        user.value = data
        return data
      } catch {
        return null
      }
    }

    const logout = () => {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
    }

    return {
      token,
      user,
      isLoggedIn,
      role,
      isAdmin,
      username,
      setToken,
      setUser,
      fetchUserInfo,
      logout,
    }
  },
  {
    persist: true,
  },
)
