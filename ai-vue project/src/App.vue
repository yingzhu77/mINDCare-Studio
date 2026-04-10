<template>
  <!-- 这里是项目的入口模板 -->
   <h1>我是电视机边框</h1>
  <div id="app-container">
    <!-- 路由占位符：当访问不同的 URL 时，对应的路由组件（比如 BackendLayout）会渲染在这里 -->
    <router-view></router-view>
  </div>
  <el-button type="primary">Primary Button</el-button>
</template>

<style>
#app-container {
  padding: 20px;
}
</style>
