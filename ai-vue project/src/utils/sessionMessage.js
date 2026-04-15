export function toMessageArray(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  if (Array.isArray(payload.records)) return payload.records
  if (Array.isArray(payload.list)) return payload.list
  if (Array.isArray(payload.messages)) return payload.messages
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.data)) return payload.data

  return []
}

function pickField(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key]
    }
  }
  return ''
}

function parseMaybeJson(text) {
  if (typeof text !== 'string') return text
  const value = text.trim()
  if (!value) return ''
  if (!(value.startsWith('{') || value.startsWith('['))) return value

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function collectText(value) {
  if (value === undefined || value === null) return ''

  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    return value
      .map((item) => collectText(item))
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  if (typeof value === 'object') {
    const nested = pickField(value, ['content', 'text', 'message', 'reply', 'answer', 'output_text'])
    if (nested !== '') return collectText(nested)

    if (value.type === 'text' && value.text) return collectText(value.text)
    if (value.type === 'output_text' && value.output_text) return collectText(value.output_text)

    return JSON.stringify(value)
  }

  return ''
}

export function stripHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolveMessageContent(raw) {
  const direct = pickField(raw, [
    'content',
    'message',
    'text',
    'msgContent',
    'reply',
    'answer',
    'body',
  ])

  const parsed = parseMaybeJson(direct)
  return collectText(parsed || direct)
}

export function resolveMessageRole(raw) {
  if (raw?.isUser === true || raw?.fromUser === true) return 'user'
  if (raw?.isAi === true || raw?.fromAi === true) return 'assistant'

  const value = pickField(raw, [
    'role',
    'senderRole',
    'messageRole',
    'fromRole',
    'speakerRole',
    'senderType',
    'authorType',
    'sender',
    'speaker',
    'from',
    'type',
  ])

  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isNaN(numeric)) {
    if (numeric === 1) {
      return raw?.isAi === true || raw?.fromAi === true ? 'assistant' : 'user'
    }
    if (numeric === 2) return 'assistant'
    if (numeric === 0) {
      return raw?.isUser === true || raw?.fromUser === true ? 'user' : 'assistant'
    }
  }

  const role = String(value || '').toLowerCase()
  if (!role) return 'unknown'

  if (
    role.includes('assistant') ||
    role.includes('ai') ||
    role.includes('bot') ||
    role.includes('model') ||
    role.includes('robot') ||
    role.includes('reply') ||
    role.includes('response') ||
    role.includes('助手')
  ) {
    return 'assistant'
  }

  if (
    role.includes('user') ||
    role.includes('human') ||
    role.includes('visitor') ||
    role.includes('client') ||
    role.includes('customer') ||
    role.includes('用户')
  ) {
    return 'user'
  }

  return 'unknown'
}

export function resolveMessageTime(raw) {
  const value = pickField(raw, [
    'createTime',
    'createdAt',
    'sendTime',
    'timestamp',
    'time',
    'messageTime',
    'updatedAt',
    'updateTime',
  ])

  return value ? String(value) : ''
}

export function normalizeMessages(payload) {
  const list = toMessageArray(payload)

  return list.map((raw, index) => {
    const role = resolveMessageRole(raw)

    return {
      id: raw?.id ?? raw?.messageId ?? `${index}`,
      role: role === 'unknown' ? (index === 0 ? 'user' : 'assistant') : role,
      content: resolveMessageContent(raw),
      time: resolveMessageTime(raw),
      raw,
    }
  })
}

export function resolveMessagesTotal(payload) {
  if (Array.isArray(payload)) return payload.length
  if (!payload || typeof payload !== 'object') return 0

  const totalValue = pickField(payload, [
    'total',
    'messageCount',
    'messagesTotal',
    'count',
    'recordsTotal',
  ])

  const totalNumber = Number(totalValue)
  if (!Number.isNaN(totalNumber) && totalNumber >= 0) {
    return totalNumber
  }

  return toMessageArray(payload).length
}

export function getFirstUserMessageTime(payload) {
  const normalized = normalizeMessages(payload)
  // 会话开始时间定义为第一条用户提问时间，而不是 AI 回复时间
  const firstUserMessage = normalized.find((item) => item.role === 'user' && item.time)
  return firstUserMessage?.time || normalized[0]?.time || ''
}

export function getLastMessageTime(payload) {
  const normalized = normalizeMessages(payload)
  // 会话结束时间定义为最后一条带时间戳的消息时间
  const messagesWithTime = normalized.filter((item) => item.time)
  return messagesWithTime[messagesWithTime.length - 1]?.time || ''
}

export function getFirstAssistantSummary(payload, maxLength = 160) {
  const normalized = normalizeMessages(payload)
  const firstAssistant = normalized.find((item) => item.role === 'assistant' && stripHtml(item.content))
  const firstNonUser = normalized.find((item) => item.role !== 'user' && stripHtml(item.content))
  const secondMessage = normalized[1] && stripHtml(normalized[1].content) ? normalized[1] : null

  const target = firstAssistant || firstNonUser || secondMessage
  if (!target) return ''

  const plain = stripHtml(target.content)
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain
}
