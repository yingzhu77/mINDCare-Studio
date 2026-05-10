import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../utils/markdown'

describe('renderMarkdown', () => {
  it('returns empty string for falsy input', () => {
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
    expect(renderMarkdown('')).toBe('')
  })

  it('renders bold text', () => {
    const result = renderMarkdown('**bold**')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('renders italic text', () => {
    const result = renderMarkdown('*italic*')
    expect(result).toContain('<em>italic</em>')
  })

  it('renders headings', () => {
    expect(renderMarkdown('# H1')).toContain('<h1>H1</h1>')
    expect(renderMarkdown('## H2')).toContain('<h2>H2</h2>')
    expect(renderMarkdown('### H3')).toContain('<h3>H3</h3>')
  })

  it('renders line breaks', () => {
    const result = renderMarkdown('line1\nline2')
    expect(result).toContain('line1')
    expect(result).toContain('line2')
  })

  it('strips script tags (XSS)', () => {
    const result = renderMarkdown('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('xss')
  })

  it('strips on* event handlers (XSS)', () => {
    const result = renderMarkdown('<img onerror="alert(1)" src=x>')
    expect(result).not.toContain('onerror')
  })

  it('renders code blocks safely', () => {
    const result = renderMarkdown('```\nconst x = 1;\n```')
    expect(result).toContain('const x = 1')
  })

  it('renders inline code safely', () => {
    const result = renderMarkdown('use `code` inline')
    expect(result).toContain('<code>code</code>')
  })

  it('sanitizes dangerous HTML tags', () => {
    const result = renderMarkdown('<iframe src="javascript:alert(1)"></iframe>')
    expect(result).not.toContain('<iframe>')
    expect(result).not.toContain('javascript')
  })
})
