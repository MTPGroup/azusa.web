# Azusa Web Monorepo

基于 pnpm + Turborepo 的前端单仓。当前主要子应用为 `apps/community`：Nuxt 4 + Pinia 前端，后端接口由 Supabase Functions 提供。

## 环境要求
- Node.js 18+
- pnpm 10.18.2（根 `packageManager` 指定）

## 安装
```bash
pnpm install
```

## 开发
- 启动全部开发服务（由 Turborepo 协调）
  ```bash
  pnpm dev
  ```
- 仅运行社区应用
  ```bash
  pnpm dev --filter community
  ```

## 构建
- 构建全部包
  ```bash
  pnpm build
  ```
- 仅构建社区应用
  ```bash
  pnpm build --filter community
  ```

## 社区应用常用脚本
- 生成 Supabase 类型：`pnpm gen:types --filter community`
- 如需在 `apps/community` 内单独运行，可直接使用 Nuxt 命令：`pnpm dev` / `pnpm build` / `pnpm preview`

## 目录结构
- `apps/community`：Nuxt 4 + Pinia 前端（Supabase 支撑）
- `apps/community/app`：页面、组件、布局、Pinia stores 与资源
- `apps/community/public`：静态资源
- `apps/community/scripts`：开发/类型生成脚本

## 环境变量
- 复制 `apps/community/.env.example` 为 `.env` 并补齐必填项后再运行。

## 备注
- 仓库脚本委托 Turborepo；在子包中添加 `dev`/`build`/`lint` 脚本后，Turbo 会统一编排执行。
