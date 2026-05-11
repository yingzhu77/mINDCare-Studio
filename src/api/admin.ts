import service from '@/utils/request'
import type {
  LoginDto, RegisterDto, LoginResult, UserInfo,
  KnowledgeCategory, KnowledgeArticle, ArticleStatusUpdateDto,
  PageResult, PageParams,
  ChatSession, ChatMessage,
  EmotionDiary,
  AiAnalysisResult,
  DataOverview, EmotionTrend, SessionTrend, ArticleTrend,
  UploadResult,
  UserManagementItem,
} from './types'

// ==================== 认证 ====================

export function login(data: LoginDto): Promise<LoginResult> {
  return service.post('/user/login', data)
}

export function register(data: RegisterDto): Promise<void> {
  return service.post('/user/register', data)
}

export function getMe(): Promise<UserInfo> {
  return service.get('/user/me')
}

// ==================== 知识管理 ====================

export function categoryTree(): Promise<KnowledgeCategory[]> {
  return service.get('/knowledge/category/tree')
}

export function articlePage(params: PageParams & { title?: string; status?: string; categoryId?: string }): Promise<PageResult<KnowledgeArticle>> {
  return service.get('/knowledge/article/page', { params })
}

export function articleAdd(data: Partial<KnowledgeArticle>): Promise<void> {
  return service.post('/knowledge/article', data)
}

export function articleUpdate(data: Partial<KnowledgeArticle> & { id: number }): Promise<void> {
  return service.put('/knowledge/article', data)
}

export function articleDetail(id: number): Promise<KnowledgeArticle> {
  return service.get(`/knowledge/article/${id}`)
}

export function articleDelete(id: number): Promise<void> {
  return service.delete(`/knowledge/article/${id}`)
}

export function articleStatusUpdate(id: number, status: string, rejectReason?: string): Promise<void> {
  return service.put(`/knowledge/article/${id}/status`, { status, rejectReason })
}

// ==================== 文件上传 ====================

export function fileUpload(formData: FormData): Promise<UploadResult> {
  return service.post('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ==================== 咨询会话 ====================

export function sessionPage(params: PageParams & { userName?: string; status?: string }): Promise<PageResult<ChatSession>> {
  return service.get('/psychological-chat/sessions', { params })
}

export function sessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

export function sessionDetail(sessionId: string): Promise<ChatSession> {
  return service.get(`/psychological-chat/sessions/${sessionId}`)
}

export function sessionEmotion(sessionId: string): Promise<any> {
  return service.get(`/psychological-chat/session/${sessionId}/emotion`)
}

// ==================== 情绪日记（管理端） ====================

export function emotionDiaryPage(params: PageParams & { userName?: string; diaryDate?: string; dominantEmotion?: string }): Promise<PageResult<EmotionDiary>> {
  return service.get('/emotion-diary/admin/page', { params })
}

export function emotionDiaryDelete(id: number): Promise<void> {
  return service.delete(`/emotion-diary/admin/${id}`)
}

// ==================== 数据分析 ====================

export function dataAnalyticsOverview(): Promise<DataOverview> {
  return service.get('/data-analytics/overview')
}

export function dataAnalyticsTrends(type: 'emotion' | 'session' | 'article'): Promise<EmotionTrend[] | SessionTrend[] | ArticleTrend[]> {
  return service.get('/data-analytics/trends', { params: { type } })
}

// ==================== AI 分析 ====================

export function triggerEmotionDiaryAnalysis(id: number): Promise<AiAnalysisResult> {
  return service.post(`/analysis/emotion-diary/${id}`)
}

export function getEmotionDiaryAnalysis(id: number): Promise<AiAnalysisResult> {
  return service.get(`/analysis/emotion-diary/${id}`)
}

export function triggerChatSessionAnalysis(sessionId: string): Promise<AiAnalysisResult> {
  return service.post(`/analysis/chat-session/${sessionId}`)
}

export function getChatSessionAnalysis(sessionId: string): Promise<AiAnalysisResult> {
  return service.get(`/analysis/chat-session/${sessionId}`)
}

// ==================== 用户管理 ====================

export function userPage(params: PageParams & { username?: string }): Promise<PageResult<UserManagementItem>> {
  return service.get('/user/page', { params })
}

export function userStatusUpdate(id: number, status: string): Promise<void> {
  return service.put(`/user/${id}/status`, { status })
}
