// ==================== 通用响应类型 ====================

/** 后端统一响应包装（由 TransformInterceptor 包裹） */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页返回结构 */
export interface PageResult<T = any> {
  records: T[]
  total: number
  currentPage: number
  size: number
}

/** 分页查询参数 */
export interface PageParams {
  currentPage?: number
  size?: number
}

// ==================== 用户/认证 ====================

export interface LoginDto {
  username: string
  password: string
}

export interface RegisterDto {
  username: string
  password: string
  email?: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  status?: string
  createdAt?: string
}

export interface LoginResult {
  token: string
  tokenType: string
  user: UserInfo
}

// ==================== 知识文章 ====================

export interface KnowledgeCategory {
  id: number
  categoryName: string
  parentId: number | null
  sortOrder: number
  status: string
  children?: KnowledgeCategory[]
}

export interface KnowledgeArticle {
  id: number
  title: string
  categoryId: number | null
  authorId: number
  summary: string | null
  tags: string | null
  coverImage: string | null
  content: string | null
  status: string
  readCount: number
  rejectReason: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category?: { id?: number; categoryName: string } | null
  author?: { id?: number; username: string; role?: string } | null
}

export interface ArticleStatusUpdateDto {
  status: string
  reason?: string
  rejectReason?: string
}

// ==================== 咨询会话 ====================

export interface ChatSession {
  id: number
  sessionId: string
  userId: number
  userName: string | null
  startTime: string
  endTime: string | null
  messageCount: number
  emotionTags: string[]
  aiSummary: string | null
  riskLevel: string | null
  status: string
  previewText?: string
  firstMessageTime?: string
  lastMessageTime?: string
  user?: { id: number; username: string }
}

export interface ChatMessage {
  id: number
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  messageTime: string
}

// ==================== 情绪日记 ====================

export interface EmotionDiary {
  id: number
  userId: number
  userName: string | null
  diaryDate: string
  moodScore: number | null
  sleepQuality: number | null
  stressLevel: number | null
  dominantEmotion: string | null
  emotionTriggers: string | string[] | null
  diaryContent: string | null
  createdAt: string
  analyses?: AiAnalysisResult[]
}

export interface CreateDiaryDto {
  diaryDate: string
  moodScore: number
  sleepQuality: number
  stressLevel: number
  dominantEmotion: string
  emotionTriggers: string[]
  diaryContent: string
}

// ==================== AI 分析 ====================

export interface AiAnalysisResult {
  id: number
  bizType: 'emotion_diary' | 'chat_session'
  bizId: number
  status: 'success' | 'failed' | 'pending'
  mainEmotion?: string
  emotionIntensity?: number
  emotionNature?: string
  riskLevel?: string
  riskDescription?: string
  professionalAdvice?: string
  improvementSuggestions?: string
  summary?: string
  emotionTags: string[]
  modelName?: string
  errorMessage?: string
  createdAt?: string
}

// ==================== 通知 ====================

export interface NotificationItem {
  id: number
  userId: number
  type: string
  title: string
  content: string | null
  isRead: boolean
  relatedId: number | null
  createdAt: string
}

export interface UnreadCountResult {
  count: number
}

// ==================== 用户管理 ====================

export interface UserManagementItem {
  id: number
  username: string
  email: string
  role: string
  status: string
  createdAt: string
}

// ==================== 文件上传 ====================

export interface UploadResult {
  filename: string
  url: string
  size: number
}

// ==================== 数据分析 ====================

export interface DataOverview {
  articleCount: number
  publishedArticleCount: number
  userCount: number
  sessionCount: number
  activeSessionCount: number
  diaryCount: number
  todayDiaryCount: number
  analysisCount: number
  riskDistribution: Array<{ riskLevel: string; _count: number }>
}

export interface EmotionTrend {
  month: string
  avgScore: number
  count: number
}

export interface SessionTrend {
  date: string
  count: number
}

export interface ArticleTrend {
  date: string
  cumulativeCount: number
}

// ==================== 审核 ====================

export interface ReviewArticle {
  id: number
  reviewType: 'article' | 'revision'
  reviewId: number
  articleId?: number
  title: string
  summary: string | null
  tags: string | null
  coverImage: string | null
  content: string | null
  status: string
  rejectReason: string | null
  submittedAt?: string
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  category?: { id: number; categoryName: string } | null
  author?: { id: number; username: string } | null
  article?: { id: number; title: string; status: string } | null
}

// ==================== 用户端文章投稿 ====================

export interface ClientArticle {
  id: number
  title: string
  content: string | null
  categoryId: number | null
  summary: string | null
  status: string
  rejectReason: string | null
  createdAt: string
  hasPendingRevision?: boolean
  revisionStatus?: string
}
