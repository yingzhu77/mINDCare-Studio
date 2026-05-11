import { describe, it, expect } from 'vitest'
import { formatDate } from '../utils/date'

describe('formatDate', () => {
  it('returns "-" for falsy input', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
  })

  it('returns the raw string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('formats as datetime by default', () => {
    const result = formatDate('2026-05-10T14:30:00Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('formats as date type', () => {
    const result = formatDate('2026-05-10T14:30:00Z', 'date')
    expect(result).toBe('2026-05-10')
  })

  it('formats as time type', () => {
    const result = formatDate('2026-05-10T14:30:00Z', 'time')
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('formats as slash type', () => {
    const result = formatDate('2026-05-10T14:30:00Z', 'slash')
    expect(result).toMatch(/^\d{4}\/\d{1,2}\/\d{1,2} \d{2}:\d{2}:\d{2}$/)
  })

  it('handles Date objects', () => {
    const d = new Date('2026-01-01T00:00:00Z')
    expect(formatDate(d, 'date')).toBe('2026-01-01')
  })
})
