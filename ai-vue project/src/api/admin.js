import service from '@/utils/request'

export function login(data) {
  return service.post('/user/login', data)
}
// 获取分类树
export function categoryTree() {
  return service.get('/knowledge/category/tree')
}

// 分页查询文章列表
export function articlePage(params) {
  return service.get('/knowledge/article/page', { params })
}

// 文章新增
export function articleAdd(data) {
  return service.post('/knowledge/article', data)
}

// 更新知识文章
export function articleUpdate(data) {
  return service.put('/knowledge/article', data)
}

// 获取知识文章详情
export function articleDetail(id) {
  return service.get(`/knowledge/article/${id}`)
}

// 删除知识文章
export function articleDelete(id) {
  return service.delete(`/knowledge/article/${id}`)
}

// 更新文章状态 (1 发布 2 下线)
export function articleStatusUpdate(id, status) {
  return service.put(`/knowledge/article/${id}/status`, { status })
}

// 文件上传
export function fileUpload(formData) {
  return service.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 分页查询咨询会话
export function sessionPage(params) {
  return service.get('/psychological-chat/sessions', { params })
}

// 获取会话消息列表
export function sessionMessages(sessionId) {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

// 获取会话详情 (基于用户要求，推测此接口用于拉取基础会话信息)
export function sessionDetail(sessionId) {
  return service.get(`/psychological-chat/sessions/${sessionId}`)
}

// 分页查询情绪日记（管理端）
export function emotionDiaryPage(params) {
  return service.get('/emotion-diary/admin/page', { params })
}

// 删除情绪日记（管理端）
export function emotionDiaryDelete(id) {
  return service.delete(`/emotion-diary/admin/${id}`)
}

// 获取综合数据分析（管理端）
export function dataAnalyticsOverview() {
  return service.get('/data-analytics/overview')
}
