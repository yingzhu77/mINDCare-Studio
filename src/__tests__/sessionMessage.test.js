import { describe, it, expect } from 'vitest'
import { stripHtml, toMessageArray, normalizeMessages, getPreferredAssistantPreview } from '../utils/sessionMessage'

describe('stripHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(stripHtml(null)).toBe('')
    expect(stripHtml(undefined)).toBe('')
    expect(stripHtml('')).toBe('')
  })

  it('strips HTML tags', () => {
    expect(stripHtml('<p>hello</p>')).toBe('hello')
  })

  it('collapses whitespace', () => {
    expect(stripHtml('a  \n  b')).toBe('a b')
  })
})

describe('toMessageArray', () => {
  it('returns array as-is', () => {
    expect(toMessageArray([1, 2])).toEqual([1, 2])
  })

  it('extracts .records from object', () => {
    expect(toMessageArray({ records: ['a'] })).toEqual(['a'])
  })

  it('extracts .list from object', () => {
    expect(toMessageArray({ list: ['b'] })).toEqual(['b'])
  })

  it('returns empty for unexpected input', () => {
    expect(toMessageArray(null)).toEqual([])
    expect(toMessageArray(42)).toEqual([])
    expect(toMessageArray('str')).toEqual([])
  })
})

describe('normalizeMessages', () => {
  it('normalizes simple messages', () => {
    const input = [{ role: 'user', content: 'hello' }]
    const result = normalizeMessages(input)
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('user')
    expect(result[0].content).toBe('hello')
  })

  it('handles empty input', () => {
    expect(normalizeMessages([])).toEqual([])
    expect(normalizeMessages(null)).toEqual([])
  })
})

describe('getPreferredAssistantPreview', () => {
  it('prefers first assistant message', () => {
    const input = [
      { role: 'user', content: 'first user message that is longer' },
      { role: 'assistant', content: 'first ai response' },
      { role: 'user', content: 'follow up' },
    ]
    expect(getPreferredAssistantPreview(input)).toContain('first ai response')
  })

  it('falls back to user message if no assistant', () => {
    const input = [
      { role: 'user', content: 'only user message' },
    ]
    expect(getPreferredAssistantPreview(input)).toContain('only user message')
  })

  it('truncates long text', () => {
    const longText = 'a'.repeat(200)
    expect(getPreferredAssistantPreview([{ role: 'user', content: longText }])).toHaveLength(163)
  })
})
