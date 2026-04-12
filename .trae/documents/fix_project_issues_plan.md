# 项目修改计划

## 任务目标
1.  **项目入口调整**：进入项目时直接进入登录页面。
2.  **导航提示优化**：移除菜单栏切换页面时显示的不必要通知。
3.  **搜索体验改进**：解决知识文章页面搜索表单布局“塌陷”问题，确保搜索后布局稳定。
4.  **接口集成**：将知识文章数据来源更换为指定的 API 接口：`https://xsl1e23zpk.apifox.cn/405512343e0`。
5.  **代码质量**：保持代码风格一致，增加详细中文注释。

## 现状分析
1.  **路由系统**：[router/index.js](file:///d:/ai-vue/ai-vue%20project/src/router/index.js) 目前将根路径 `/` 重定向至登录页。
2.  **导航通知**：目前项目中主要的消息弹窗存在于登录、注册和知识文章的增删改查操作中。未发现全局导航钩子触发通知。
3.  **搜索布局**：[TableSearch.vue](file:///d:/ai-vue/ai-vue%20project/src/components/TableSearch.vue) 中设置了 `margin-bottom: 0`，在换行显示时会导致表单项重叠/塌陷。
4.  **数据获取**：[Knowledge.vue](file:///d:/ai-vue/ai-vue%20project/src/views/Knowledge.vue) 当前使用本地配置的 `/api` 基础路径进行请求。

## 修改方案

### 1. 路由配置优化 (src/router/index.js)
-   确认根路径 `/` 始终重定向到 `/auth/login`。
-   确保路由守卫逻辑清晰。

### 2. 移除不必要的导航通知
-   检查并确保在 [BackendLayout.vue](file:///d:/ai-vue/ai-vue%20project/src/components/BackendLayout.vue) 或 [Sidebar.vue](file:///d:/ai-vue/ai-vue%20project/src/components/Sidebar.vue) 中没有在菜单点击或页面切换时触发 `ElMessage` 的逻辑。
-   如果发现任何在 `onMounted` 生命周期或 `router.afterEach` 中显示的通知，将其移除。

### 3. 搜索表单布局修复 (src/components/TableSearch.vue)
-   修改 `.search-form :deep(.el-form-item)` 的样式。
-   将 `margin-bottom: 0` 修改为 `18px` (或合适的间距)，防止在响应式换行时出现塌陷。
-   移除父组件 [Knowledge.vue](file:///d:/ai-vue/ai-vue%20project/src/views/Knowledge.vue) 中冗余的搜索样式定义。

### 4. API 接口对接 (src/views/Knowledge.vue)
-   将 `getList` 方法中的请求路径更改为指定的 API 地址。
-   鉴于提供的地址 `https://xsl1e23zpk.apifox.cn/405512343e0` 可能是一个 Apifox 预览页，我将尝试从中提取真实的 API Base URL（例如：`https://xsl1e23zpk.apifox.cn/m1/4055123-0-default`）并配合 `/knowledge/article/page` 路径。
-   更新数据结构映射（如果接口返回格式与现有格式不符）。

### 5. 代码优化与注释
-   为关键业务逻辑（如 API 调用、路由跳转）添加详细的中文注释。
-   确保代码缩进、变量命名与现有项目保持一致。

## 验证步骤
1.  启动项目，确认直接进入登录页。
2.  登录后在菜单栏切换页面，确认不再出现“操作成功”等无关弹窗。
3.  进入知识文章页面，在搜索框输入内容并查询，确认搜索栏布局不再发生“收缩/塌陷”。
4.  检查表格数据是否成功从新接口加载。
