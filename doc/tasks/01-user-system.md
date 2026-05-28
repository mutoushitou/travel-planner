# 用户系统 — 最小可执行任务

> Phase 1 / MVP | 关联 PRD §2.1

## USER-01 Supabase Auth 集成

- [ ] 配置 Supabase Auth Provider（邮箱注册/登录）
- [ ] 创建 src/lib/supabase/client.ts 浏览器端 Supabase Client
- [ ] 创建 src/lib/supabase/server.ts 服务端 Supabase Client（用于 SSR）
- [ ] 创建 src/lib/supabase/middleware.ts 中间件（Session 续期 + 路由守卫）
- [ ] 在 src/middleware.ts 中引入 Supabase 中间件

## USER-02 profiles 表 + 触发器

- [ ] 编写 profiles 表创建 SQL（关联 uth.users.id）
- [ ] 编写 handle_new_user 触发器：auth.users 插入时自动创建 profile 行
- [ ] 编写 profiles RLS 策略：自己可读写
- [ ] 在 Supabase Dashboard 执行 SQL

## USER-03 注册页面 /register

- [ ] 创建 src/app/register/page.tsx 页面组件
- [ ] 编写注册表单组件 RegisterForm（邮箱 + 密码 + 确认密码）
- [ ] 使用 React Hook Form + Zod 做表单验证
- [ ] 调用 supabase.auth.signUp() 完成注册
- [ ] 注册成功后跳转 /dashboard 或显示"验证邮箱"提示
- [ ] 错误处理：邮箱已存在、密码太弱等

## USER-04 登录页面 /login

- [ ] 创建 src/app/login/page.tsx 页面组件
- [ ] 编写登录表单组件 LoginForm（邮箱 + 密码）
- [ ] 使用 React Hook Form + Zod 做表单验证
- [ ] 调用 supabase.auth.signInWithPassword() 完成登录
- [ ] 登录成功后跳转 /dashboard
- [ ] 错误处理：邮箱不存在、密码错误等

## USER-05 AuthProvider 全局状态

- [ ] 创建 src/components/auth/AuthProvider.tsx
- [ ] 监听 supabase.auth.onAuthStateChange() 维护全局登录态
- [ ] 在 Root Layout 中包裹 AuthProvider
- [ ] 暴露 user / loading / signOut 给子组件

## USER-06 路由守卫

- [ ] 配置 /dashboard 需登录，未登录重定向 /login
- [ ] 配置 /trips/\* 需登录
- [ ] 配置 /orders 需登录
- [ ] 配置 /settings 需登录
- [ ] 配置 /login /register 已登录则重定向 /dashboard
- [ ] 配置 / /attractions/:id 公开访问

## USER-07 个人设置页面 /settings

- [ ] 创建 src/app/settings/page.tsx 页面组件
- [ ] 编辑昵称（调用 profile UPDATE）
- [ ] 上传头像（Supabase Storage + 更新 vatar_url）
- [ ] 设置默认出发城市 + 出行偏好（JSONB）
- [ ] 保存成功 Toast 提示

## USER-08 导航栏用户状态

- [ ] 创建 src/components/layout/Header.tsx（导航栏组件）
- [ ] 未登录：显示"登录"/"注册"链接
- [ ] 已登录：显示用户头像/昵称 + 下拉菜单（工作台、设置、退出）
- [ ] 退出登录调用 supabase.auth.signOut() + 跳转首页
