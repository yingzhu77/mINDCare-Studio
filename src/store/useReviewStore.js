import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pendingReviewCount } from '@/api/admin'

export const useReviewStore = defineStore('review', () => {
  const pendingCount = ref(0)

  const refreshPendingCount = async () => {
    try {
      const res = await pendingReviewCount()
      pendingCount.value = res?.count || 0
    } catch {
      // Sidebar badge refresh should stay silent.
    }
  }

  return {
    pendingCount,
    refreshPendingCount,
  }
})
