import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 菜单状态管理 Store
 * 使用 Pinia 进行状态管理，支持响应式更新和持久化
 */
export const useMenuStore = defineStore(
  'menu',
  () => {
    // 菜单是否折叠的状态，默认为不折叠 (false)
    const isCollapsed = ref(false)

    // 切换菜单折叠/展开状态的方法
    const toggleMenu = () => {
      isCollapsed.value = !isCollapsed.value
    }

    // 手动设置菜单折叠状态的方法
    const setMenuCollapsed = (status) => {
      isCollapsed.value = status
    }

    return {
      isCollapsed,
      toggleMenu,
      setMenuCollapsed,
    }
  },
  {
    // 开启持久化配置，将状态保存到 localStorage 中
    persist: true,
  },
)
