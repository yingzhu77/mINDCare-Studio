import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardCharts from '../DashboardCharts.vue'

// mock API
vi.mock('@/api/admin', () => ({
  dataAnalyticsTrends: vi.fn()
    .mockResolvedValueOnce([{ month: '2026-01', avgScore: 7.5, count: 10 }])
    .mockResolvedValueOnce([{ date: '2026-01-01', count: 5 }])
    .mockResolvedValueOnce([{ date: '2026-01-01', cumulativeCount: 3 }]),
}))

// mock ECharts（组件内使用 import * as echarts，所以 export 在顶层）
vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  })),
  graphic: {
    LinearGradient: vi.fn(() => ({})),
  },
}))

describe('DashboardCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染三个图表卡片', () => {
    const wrapper = mount(DashboardCharts)
    expect(wrapper.find('.dashboard-charts').exists()).toBe(true)
    const cards = wrapper.findAll('.chart-card')
    expect(cards).toHaveLength(3)
  })

  it('卡片标题正确', () => {
    const wrapper = mount(DashboardCharts)
    expect(wrapper.text()).toContain('情绪趋势（月均评分）')
    expect(wrapper.text()).toContain('咨询量趋势（每日会话数）')
    expect(wrapper.text()).toContain('文章发布趋势（累计）')
  })

  it('挂载后调用 trend API', async () => {
    const { dataAnalyticsTrends } = await import('@/api/admin')
    mount(DashboardCharts)
    // 等待 nextTick 让 onMounted 中的异步调用执行
    await new Promise(r => setTimeout(r, 0))
    expect(dataAnalyticsTrends).toHaveBeenCalledTimes(3)
    expect(dataAnalyticsTrends).toHaveBeenCalledWith('emotion')
    expect(dataAnalyticsTrends).toHaveBeenCalledWith('session')
    expect(dataAnalyticsTrends).toHaveBeenCalledWith('article')
  })
})
