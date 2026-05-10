import { describe, it, expect } from 'vitest'
import { logger } from '../utils/logger'

describe('logger', () => {
  it('has info, warn, error methods', () => {
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('calls console.info for logger.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('test message', 'extra')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('calls console.warn for logger.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('test warning')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('calls console.error for logger.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('test error')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
