import service from '@/utils/request'

// 用户端 AI 聊天 - SSE 流式对话
export function chatSend(data) {
  return service.post('/chat/send', data)
}

// 获取我的聊天会话列表
export function mySessionPage(params) {
  return service.get('/psychological-chat/sessions', { params })
}

// 获取会话消息列表
export function sessionMessages(sessionId) {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

// 我的情绪日记分页
export function myDiaryPage(params) {
  return service.get('/emotion-diary/my/page', { params })
}

// 新增情绪日记
export function diaryAdd(data) {
  return service.post('/emotion-diary', data)
}

// 更新情绪日记
export function diaryUpdate(id, data) {
  return service.put(`/emotion-diary/${id}`, data)
}

// 获取情绪日记详情
export function diaryDetail(id) {
  return service.get(`/emotion-diary/${id}`)
}

// ================== 用户端文章投稿 ==================

// 我的投稿分页
export function myArticlePage(params) {
  return service.get('/client/article/page', { params })
}

// 投稿详情
export function myArticleDetail(id) {
  return service.get(`/client/article/${id}`)
}

// 创建投稿
export function myArticleAdd(data) {
  return service.post('/client/article', data)
}

// 更新投稿
export function myArticleUpdate(id, data) {
  return service.put(`/client/article/${id}`, data)
}

// 提交审核
export function myArticleSubmit(id) {
  return service.put(`/client/article/${id}/submit`)
}
