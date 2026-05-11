import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('useMenuStore', () => {
  let useMenuStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    const mod = await import('../useMenuStore')
    useMenuStore = mod.useMenuStore
  })

  it('初始状态 isCollapsed 应为 false', () => {
    const store = useMenuStore()
    expect(store.isCollapsed).toBe(false)
  })

  it('toggleMenu 应翻转 isCollapsed', () => {
    const store = useMenuStore()
    expect(store.isCollapsed).toBe(false)
    store.toggleMenu()
    expect(store.isCollapsed).toBe(true)
    store.toggleMenu()
    expect(store.isCollapsed).toBe(false)
  })

  it('setMenuCollapsed 应直接设置状态', () => {
    const store = useMenuStore()
    store.setMenuCollapsed(true)
    expect(store.isCollapsed).toBe(true)
    store.setMenuCollapsed(false)
    expect(store.isCollapsed).toBe(false)
  })
})
