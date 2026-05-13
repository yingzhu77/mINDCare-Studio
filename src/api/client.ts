import service from '@/utils/request'
import type {
  PageResult, PageParams,
  ChatSession, ChatMessage,
  EmotionDiary, CreateDiaryDto,
  NotificationItem, UnreadCountResult,
  AiAnalysisResult,
  ClientArticle,
  KnowledgeCategory, KnowledgeArticle,
} from './types'

// ==================== 会话管理（用户端） ====================

export function mySessionPage(params: PageParams): Promise<PageResult<ChatSession>> {
  return service.get('/chat/sessions/my', { params })
}

export function deleteSession(sessionId: string): Promise<void> {
  return service.delete(`/chat/session/${sessionId}`)
}

export function exportSession(sessionId: string): Promise<{
  session: { sessionId: string; startTime: string; endTime: string | null; messageCount: number }
  messages: Array<{ role: string; content: string; messageTime: string }>
  exportedAt: string
}> {
  return service.get(`/chat/session/${sessionId}/export`)
}

export function sessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return service.get(`/chat/session/${sessionId}/messages`)
}

// ==================== 情绪日记（用户端） ====================

export function myDiaryPage(params: PageParams & { diaryDate?: string }): Promise<PageResult<EmotionDiary>> {
  return service.get('/emotion-diary/my/page', { params })
}

export function diaryAdd(data: CreateDiaryDto): Promise<void> {
  return service.post('/emotion-diary', data)
}

export function diaryUpdate(id: number, data: Partial<CreateDiaryDto>): Promise<void> {
  return service.put(`/emotion-diary/${id}`, data)
}

export function diaryDetail(id: number): Promise<EmotionDiary> {
  return service.get(`/emotion-diary/${id}`)
}

export function diaryDelete(id: number): Promise<void> {
  return service.delete(`/emotion-diary/${id}`)
}

// ==================== 文章投稿（用户端） ====================

export function myArticlePage(params: PageParams): Promise<PageResult<ClientArticle>> {
  return service.get('/client/article/page', { params })
}

export function myArticleDetail(id: number): Promise<ClientArticle> {
  return service.get(`/client/article/${id}`)
}

export function myArticleAdd(data: { title: string; content?: string; categoryId?: number; summary?: string }): Promise<void> {
  return service.post('/client/article', data)
}

export function myArticleUpdate(id: number, data: { title?: string; content?: string; categoryId?: number; summary?: string }): Promise<void> {
  return service.put(`/client/article/${id}`, data)
}

export function myArticleSubmit(id: number): Promise<void> {
  return service.put(`/client/article/${id}/submit`)
}

// ==================== 公开文章浏览 ====================

export function publishedCategories(): Promise<KnowledgeCategory[]> {
  return service.get('/client/article/categories')
}

export function publishedArticlePage(params: PageParams & { title?: string; categoryId?: number }): Promise<PageResult<KnowledgeArticle>> {
  return service.get('/client/article/published', { params })
}

export function publishedArticleDetail(id: number): Promise<KnowledgeArticle> {
  return service.get(`/client/article/published/${id}`)
}

// ==================== 情绪洞察统计 ====================

export interface EmotionStatistics {
  overview: {
    totalCount: number
    thisMonthCount: number
    averageMoodScore: number | null
    averageSleepQuality: number | null
    averageStressLevel: number | null
  }
  moodTrend: Array<{ month: string; avgScore: number; count: number }>
  emotionDistribution: Array<{ emotion: string; count: number }>
  stressSleepData: Array<{ date: string; stressLevel: number; sleepQuality: number }>
  triggerAnalysis: Array<{ trigger: string; count: number }>
}

export function myDiaryStatistics(): Promise<EmotionStatistics> {
  return service.get('/emotion-diary/my/statistics')
}

// ==================== AI 分析结果（用户端只读） ====================

export function getMyDiaryAnalysis(id: number): Promise<AiAnalysisResult | null> {
  return service.get(`/analysis/emotion-diary/${id}`)
}

export function getMyChatSessionAnalysis(sessionId: string): Promise<AiAnalysisResult | null> {
  return service.get(`/analysis/chat-session/${sessionId}`)
}

// ==================== 通知 ====================

export function notificationPage(params: PageParams): Promise<PageResult<NotificationItem>> {
  return service.get('/notification/page', { params })
}

export function unreadNotificationCount(): Promise<UnreadCountResult> {
  return service.get('/notification/unread-count')
}

export function notificationRead(id: number): Promise<void> {
  return service.put(`/notification/read/${id}`)
}

export function notificationReadAll(): Promise<void> {
  return service.put('/notification/read-all')
}
