# 基础设施 — 最小可执行任务

> Phase 1 / MVP

## INFRA-01 项目初始化

- [ ] 使用
      px create-next-app@latest 初始化 Next.js 14+ App Router 项目
- [ ] 配置 TypeScript strict 模式
- [ ] 安装 Tailwind CSS 并初始化配置文件
- [ ] 安装 Supabase JS Client (@supabase/supabase-js, @supabase/ssr)
- [ ] 安装 React Hook Form + Zod（表单验证）
- [ ] 安装 React Query (@tanstack/react-query)
- [ ] 安装日期处理库 (date-fns)

## INFRA-02 Supabase 项目配置

- [ ] 在 Supabase Cloud 创建项目
- [ ] 配置 .env.local 文件（SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY）
- [ ] 配置 DEEPSEEK_API_KEY 环境变量
- [ ] 在 src/lib/supabase/ 创建 Supabase Client（server/client 双端）
- [ ] 创建 src/types/database.ts 数据库类型定义（从 Supabase 导出或手写）

## INFRA-03 数据库迁移

- [ ] 编写 profiles 表迁移 SQL（关联 auth.users）
- [ ] 编写 cities 表迁移 SQL
- [ ] 编写 ttractions 表迁移 SQL
- [ ] 编写 rips 表迁移 SQL
- [ ] 编写 rip_days 表迁移 SQL
- [ ] 编写 day_attractions / day_meals / day_transport / day_hotels 表迁移 SQL
- [ ] 编写 rip_versions 表迁移 SQL（存历史版本 JSONB）
- [ ] 编写 orders 表迁移 SQL
- [ ] 编写
      eviews 表迁移 SQL
- [ ] 在 Supabase Dashboard 执行所有迁移

## INFRA-04 RLS 策略

- [ ] 配置 profiles 的 SELECT（自己可读）、INSERT/UPDATE（自己可写）策略
- [ ] 配置 rips 的 CRUD 策略（仅 owner 可操作）
- [ ] 配置 ttractions 的 SELECT（公开读取）策略
- [ ] 配置 orders 的 CRUD 策略（仅 owner 可操作）
- [ ] 配置
      eviews 的 SELECT（公开）、INSERT/UPDATE/DELETE（仅 owner）策略
- [ ] 在每个策略上添加验证测试 SQL

## INFRA-05 项目目录结构

- [ ] 创建 src/app/ 下所有路由目录骨架
- [ ] 创建 src/components/ 目录（ui / layout / trip / auth / booking / review）
- [ ] 创建 src/lib/ 目录（supabase / ai / utils / validations）
- [ ] 创建 src/types/ 共享类型文件
- [ ] 创建 src/hooks/ 自定义 Hooks
- [ ] 创建 supabase/functions/ Edge Functions 目录

## INFRA-06 基础配置

- [ ] 配置 ailwind.config.ts（主题色、字体、断点）
- [ ] 创建全局 CSS 变量（globals.css）
- [ ] 配置
      ext.config.js（图片域名白名单等）
- [ ] 配置 ESLint + Prettier
