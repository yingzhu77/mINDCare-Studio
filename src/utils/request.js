import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 基础路径，已经在 vite.config.js 中配置了代理
  timeout: 10000, // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里可以添加 token 等请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['token'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器：服务器返回数据后的统一处理
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 关键修复：使用 != (非严格等于) 或者将 res.code 转为数字判断
    // 接口返回的 code 可能是字符串 "200" 或数字 200，统一视为成功
    if (res.code != 200 && res.code != 0) {
      // 如果不是成功状态码，弹出错误提示
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      // 如果成功，直接返回数据部分，过滤掉 code 和 msg 等包装信息
      return res.data
    }
  },
  (error) => {
    // 处理网络超时、404、500 等系统级错误
    // 不在此处弹窗，由各调用方按需处理，避免路由守卫/轮询等静默场景产生噪音弹窗
    const msg = error.response?.data?.message || error.message || '网络请求失败'
    console.error('[请求失败]', error.config?.url, msg)
    return Promise.reject(error)
  },
)

export default service
