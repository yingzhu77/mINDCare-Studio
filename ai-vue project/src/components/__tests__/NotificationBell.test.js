import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationBell from '../NotificationBell.vue'

// mock API 模块
vi.mock('@/api/client', () => ({
  notificationPage: vi.fn().mockResolvedValue({ records: [] }),
  unreadNotificationCount: vi.fn().mockResolvedValue({ count: 5 }),
  notificationRead: vi.fn().mockResolvedValue({}),
  notificationReadAll: vi.fn().mockResolvedValue({}),
}))

import { unreadNotificationCount } from '@/api/client'

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('挂载时调用未读数接口', () => {
    mount(NotificationBell)
    expect(unreadNotificationCount).toHaveBeenCalledTimes(1)
  })

  it('formatTime 返回相对时间', () => {
    const wrapper = mount(NotificationBell)
    const vm = wrapper.vm
    expect(vm.formatTime(null)).toBe('')
    expect(vm.formatTime(undefined)).toBe('')
    expect(vm.formatTime(new Date().toISOString())).toBe('刚刚')
  })
})
