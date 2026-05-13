import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import NotificationBell from '../NotificationBell.vue'

// mock API 模块
vi.mock('@/api/client', () => ({
  notificationPage: vi.fn().mockResolvedValue({ records: [] }),
  unreadNotificationCount: vi.fn().mockResolvedValue({ count: 5 }),
  notificationRead: vi.fn().mockResolvedValue({}),
  notificationReadAll: vi.fn().mockResolvedValue({}),
}))

// mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    connected: false,
  })),
}))

import { unreadNotificationCount } from '@/api/client'

function mountWithSetup() {
  return mount(NotificationBell, {
    global: {
      plugins: [createPinia()],
    },
  })
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('挂载时调用未读数接口', () => {
    mountWithSetup()
    expect(unreadNotificationCount).toHaveBeenCalledTimes(1)
  })

  it('formatTime 返回相对时间', () => {
    const wrapper = mountWithSetup()
    const vm = wrapper.vm
    expect(vm.formatTime(null)).toBe('')
    expect(vm.formatTime(undefined)).toBe('')
    expect(vm.formatTime(new Date().toISOString())).toBe('刚刚')
  })
})
