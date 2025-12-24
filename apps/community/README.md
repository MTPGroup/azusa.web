# Azusa Community

一个基于 Nuxt 4 与 Pinia 的社区前端，集成 Supabase Functions 作为后端 API，并以 TypeScript 构建。支持角色管理、知识库关联与向量检索等功能。

## 环境要求
- Node.js 18+
- pnpm 8+

## 快速开始
在仓库根目录执行：

```bash
pnpm install
pnpm dev --filter community
```

或仅针对该应用：

```bash
cd apps/community
pnpm install
pnpm dev
```

## 常用脚本
- 开发：`pnpm dev --filter community`
- 构建：`pnpm build --filter community`
- 生成类型（Supabase）：`pnpm gen:types`

## 主要目录
- `app/pages`：页面路由（角色、知识库等）
- `app/components`：通用组件（如用户资料、角色弹窗）
- `app/stores`：Pinia 状态管理（用户、角色、知识库）
- `public`：静态资源
- `scripts`：开发辅助脚本

## 开发提示
- Supabase 函数调用位于 `app/stores`，更新接口时同步调整类型。
- 提交前建议运行构建，确保类型与路由正常。