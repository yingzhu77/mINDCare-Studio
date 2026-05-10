import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TableSearch from '../TableSearch.vue'

describe('TableSearch', () => {
  const form = { keyword: '', status: '' }
  const config = [
    { prop: 'keyword', label: '关键词', comp: 'input', placeholder: '请输入关键词搜索' },
    { prop: 'status', label: '状态', comp: 'select', options: [{ value: '1', label: '启用' }, { value: '0', label: '禁用' }] },
  ]

  it('根据 config 渲染表单项', () => {
    const wrapper = mount(TableSearch, { props: { form, config } })
    expect(wrapper.findAll('.el-form-item').length).toBe(config.length + 1) // +1 操作按钮
    expect(wrapper.text()).toContain('关键词')
    expect(wrapper.text()).toContain('状态')
  })

  it('点击查询按钮触发 search 事件', async () => {
    const wrapper = mount(TableSearch, { props: { form, config } })
    await wrapper.find('button.el-button--primary').trigger('click')
    expect(wrapper.emitted('search')).toHaveLength(1)
  })

  it('点击重置按钮触发 reset 事件', async () => {
    const wrapper = mount(TableSearch, { props: { form, config } })
    const buttons = wrapper.findAll('.el-button')
    const resetBtn = buttons.find(b => b.text().includes('重置'))
    await resetBtn.trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
