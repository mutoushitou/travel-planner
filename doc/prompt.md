# 智能旅游规划 Agent 平台 — Vibe Coding Prompt

> **目标**：从零构建"智能旅游规划 Agent 平台"，全程由多 Agent 协作完成，零人工干预。
>
> **角色设定**：你需要同时扮演**主 Agent（Master Agent）**和按需创建**子 Agent（Module Agent）**来完成整个工程。

---

## 0. 角色架构

### 主 Agent（你本身的角色）

你是整个项目的总指挥。你的职责：

1. **全局规划**：阅读需求文档（PRD）和概要设计，理解项目全貌
2. **任务编排**：按照正确的依赖顺序调度各模块的实施
3. **子 Agent 创建与管理**：为每个模块创建独立的子 Agent，下发明确的任务指令
4. **进度跟踪**：维护 `doc/tasks/progress.md`，实时更新每个模块的状态
5. **集成验证**：在各模块完成后进行集成检查，确保跨模块协作正常
6. **质量守门**：确认所有代码通过 vitest 单元测试、tsc 类型检查、eslint 检查，以及 Edge Functions 的 Deno 测试

**禁止事项**：

- 主 Agent 不直接编写业务代码，只做调度和集成
- 主 Agent 不跳过验证步骤，每个模块完成后必须验证
- 主 Agent 不在未经确认的情况下修改子 Agent 的输出文件

### 子 Agent（按模块创建）

每次创建一个子 Agent 时，需要给出一份独立指令，包含：

- 该模块的所有任务清单（从 `doc/tasks/` 中的对应文件提取）
- 代码规范与测试要求
- 输入/输出文件清单
- 与其他模块的接口约定

子 Agent 完成工作后，主 Agent 验证其输出，然后标记模块为完成。

---

## 1. 项目概述

构建一个面向个人用户的**智能旅游规划 Agent 平台**。用户通过结构化表单输入出行需求（目的地、日期、人数、预算、偏好），由 AI（Deepseek）自动生成完整的每日行程方案，并支持多轮对话调整优化。平台同时提供机票、酒店、景点门票的预订能力，用户可保存历史行程。

### 核心功能闭环

```
用户注册/登录 → 填写出行表单 → AI生成行程 → 查看每日日程
                                        ↓
                              多轮对话微调 ⇄ 版本回退
                                        ↓
                              机票/酒店/门票预订（跳转第三方）
                                        ↓
                              历史行程管理（搜索/复制/删除）
```

---

## 2. 技术栈

| 层次        | 技术                                      | 版本要求    |
| ----------- | ----------------------------------------- | ----------- |
| 前端框架    | Next.js (App Router)                      | 14+         |
| 语言        | TypeScript                                | strict 模式 |
| 样式        | Tailwind CSS                              | 3.x         |
| 后端/数据库 | Supabase                                  | 最新        |
| 后端运行时  | Supabase Edge Functions (Deno/TypeScript) | —           |
| AI 服务     | Deepseek API (chat/completions)           | —           |
| 表单验证    | React Hook Form + Zod                     | 最新        |
| 状态管理    | @tanstack/react-query                     | v5          |
| 日期处理    | date-fns                                  | 最新        |

### 代码质量工具

| 工具           | 用途                          | 目标                          |
| -------------- | ----------------------------- | ----------------------------- |
| `vitest`       | Next.js 前端/工具函数单元测试 | 覆盖率 ≥ 80%                  |
| `tsc --noEmit` | 全量 TypeScript 类型检查      | 零类型错误                    |
| `eslint`       | 代码规范检查                  | 零 error                      |
| `prettier`     | 代码格式化                    | 统一格式                      |
| `deno test`    | Supabase Edge Functions 测试  | 所有 Edge Function 有对应测试 |

---

## 3. 数据库设计（全量建表 SQL）

所有表必须在 Supabase PostgreSQL 中创建。以下为核心建表 SQL，子 Agent 在各模块中按需执行。

```sql
-- ============================================================
-- 1. profiles（用户扩展信息，关联 Supabase Auth）
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  default_city TEXT,
  preferences JSONB DEFAULT '"{}"'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. cities（城市）
-- ============================================================
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. attractions（景点库）
-- ============================================================
CREATE TABLE public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,  -- nature / history / food / shopping / theme_park / museum / outdoor
  description TEXT,
  ticket_price DECIMAL(10, 2),
  opening_hours TEXT,
  suggested_duration INT,  -- 分钟
  image_url TEXT,
  rating_avg DECIMAL(2, 1) DEFAULT 0.0,
  rating_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. trips（行程）
-- ============================================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_adults INT DEFAULT 1,
  num_children INT DEFAULT 0,
  budget_level TEXT CHECK (budget_level IN ("economy", "comfort", "luxury")),
  preferences JSONB DEFAULT '"{}"'::jsonb,
  special_requirements TEXT,
  status TEXT DEFAULT "draft"
    CHECK (status IN ("draft", "generating", "generated", "booked", "completed")),
  full_content JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. trip_days（每日行程）
-- ============================================================
CREATE TABLE public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number INT NOT NULL,
  date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. day_attractions（每日景点安排）
-- ============================================================
CREATE TABLE public.day_attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE NOT NULL,
  attraction_id UUID REFERENCES public.attractions(id) ON DELETE SET NULL,
  order_index INT DEFAULT 0,
  name TEXT,
  description TEXT,
  duration INT,
  ticket_price DECIMAL(10, 2)
);

-- ============================================================
-- 7. day_meals（每日餐饮）
-- ============================================================
CREATE TABLE public.day_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ("breakfast", "lunch", "dinner", "snack")),
  restaurant_name TEXT,
  cuisine TEXT,
  price_per_person DECIMAL(10, 2),
  notes TEXT
);

-- ============================================================
-- 8. day_transport（每日交通）
-- ============================================================
CREATE TABLE public.day_transport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE NOT NULL,
  transport_type TEXT CHECK (transport_type IN ("flight", "train", "car", "bus", "subway", "taxi", "walk")),
  from_location TEXT,
  to_location TEXT,
  detail TEXT,
  price DECIMAL(10, 2)
);

-- ============================================================
-- 9. day_hotels（每日住宿）
-- ============================================================
CREATE TABLE public.day_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE NOT NULL,
  hotel_name TEXT,
  star_rating INT,
  price_range TEXT,
  notes TEXT
);

-- ============================================================
-- 10. trip_versions（行程版本历史）
-- ============================================================
CREATE TABLE public.trip_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL,
  full_content JSONB NOT NULL,
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. orders（订单）
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  order_type TEXT CHECK (order_type IN ("flight", "hotel", "ticket")),
  status TEXT DEFAULT "pending"
    CHECK (status IN ("pending", "confirmed", "cancelled", "completed")),
  total_price DECIMAL(10, 2),
  paid_at TIMESTAMPTZ,
  detail JSONB DEFAULT '"{}"'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. reviews（评价）
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  attraction_id UUID REFERENCES public.attractions(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, attraction_id)
);
```

### RLS 策略总览

| 表              | SELECT           | INSERT | UPDATE | DELETE              |
| --------------- | ---------------- | ------ | ------ | ------------------- |
| profiles        | owner            | owner  | owner  | —                   |
| cities          | public           | —      | —      | —                   |
| attractions     | public           | —      | —      | —                   |
| trips           | owner            | owner  | owner  | owner (soft-delete) |
| trip_days       | owner (via trip) | owner  | owner  | owner               |
| day_attractions | owner (via trip) | owner  | owner  | owner               |
| day_meals       | owner (via trip) | owner  | owner  | owner               |
| day_transport   | owner (via trip) | owner  | owner  | owner               |
| day_hotels      | owner (via trip) | owner  | owner  | owner               |
| trip_versions   | owner (via trip) | owner  | —      | —                   |
| orders          | owner            | owner  | owner  | owner               |
| reviews         | public           | owner  | owner  | owner               |

---

## 4. 项目目录结构

```
project-root/
├── src/
│   ├── app/                      # Next.js App Router 页面
│   │   ├── layout.tsx            # Root Layout（AuthProvider + QueryProvider + Toast）
│   │   ├── page.tsx              # 首页 /
│   │   ├── loading.tsx           # 全局 Loading
│   │   ├── not-found.tsx         # 404
│   │   ├── error.tsx             # 全局 Error Boundary
│   │   ├── login/
│   │   │   └── page.tsx          # 登录页
│   │   ├── register/
│   │   │   └── page.tsx          # 注册页
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 工作台（行程列表）
│   │   ├── trips/
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # 新建行程表单
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 行程详情
│   │   ├── attractions/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 景点详情
│   │   ├── orders/
│   │   │   └── page.tsx          # 我的订单
│   │   └── settings/
│   │       └── page.tsx          # 个人设置
│   ├── components/
│   │   ├── ui/                   # 通用 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── CitySelect.tsx
│   │   │   ├── TagSelect.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── trip/
│   │   │   ├── TripForm.tsx
│   │   │   ├── TripCard.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── BudgetSummary.tsx
│   │   │   └── VersionHistory.tsx
│   │   ├── attraction/
│   │   │   └── AttractionList.tsx
│   │   ├── booking/
│   │   │   └── OrderCard.tsx
│   │   └── review/
│   │       ├── ReviewForm.tsx
│   │       └── ReviewList.tsx
│   ├── hooks/
│   │   ├── useAttractions.ts
│   │   ├── useTrips.ts
│   │   ├── useOrders.ts
│   │   └── useReviews.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # 浏览器端 Supabase Client
│   │   │   ├── server.ts          # 服务端 Supabase Client（SSR）
│   │   │   ├── middleware.ts      # 中间件（Session 续期 + 路由守卫）
│   │   │   └── queries/
│   │   │       ├── attractions.ts
│   │   │       ├── trips.ts
│   │   │       ├── orders.ts
│   │   │       └── reviews.ts
│   │   ├── ai/
│   │   │   ├── deepseek-client.ts # Deepseek API 封装
│   │   │   └── prompts/
│   │   │       ├── trip-generation.ts
│   │   │       └── trip-chat.ts
│   │   ├── utils/
│   │   │   ├── cn.ts              # classnames 合并
│   │   │   └── format.ts          # 日期/货币格式化
│   │   └── validations/
│   │       ├── auth.ts            # Zod schemas for auth forms
│   │       ├── trip.ts            # Zod schemas for trip form
│   │       └── review.ts          # Zod schemas for review form
│   ├── types/
│   │   ├── database.ts            # Supabase 数据库类型（自动生成或手写）
│   │   ├── city.ts
│   │   ├── attraction.ts
│   │   ├── trip.ts
│   │   ├── order.ts
│   │   ├── review.ts
│   │   └── chat.ts
│   └── middleware.ts              # Next.js Middleware 入口
├── supabase/
│   ├── functions/                 # Edge Functions（Deno/TypeScript）
│   │   ├── trips-generate/
│   │   │   ├── index.ts
│   │   │   └── index_test.ts      # Deno 原生测试
│   │   ├── trips-chat/
│   │   │   ├── index.ts
│   │   │   └── index_test.ts
│   │   ├── trips-copy/
│   │   │   ├── index.ts
│   │   │   └── index_test.ts
│   │   ├── orders-create/
│   │   │   ├── index.ts
│   │   │   └── index_test.ts
│   │   └── reviews-submit/
│   │       ├── index.ts
│   │       └── index_test.ts
│   └── seed.sql                   # 种子数据
├── __tests__/                     # Next.js 前端单元测试
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── validations/
├── .env.local                     # 环境变量（SUPABASE_URL 等）
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
├── .prettierrc
└── package.json
```

---

## 5. 模块划分与实施顺序

### 实施顺序（严格按此依赖顺序）

```
Phase 1 — MVP 核心闭环
=========================
1. 基础设施 (INFRA)       ← 最先，所有模块的基础
2. 用户系统 (USER)        ← 依赖 INFRA
3. 景点库 (ATTR)          ← 依赖 INFRA，无其它依赖
4. 行程规划 (PLAN)        ← 依赖 USER + ATTR
5. 行程管理 (MGMT)        ← 依赖 PLAN
6. 预订系统 (BOOK Phase 1)← 依赖 USER，仅建表
7. 前端页面 (PAGE)        ← 贯穿始终，在以上模块完成后收尾集成

Phase 2 — 体验增强
=========================
8. 预订系统 (BOOK Phase 2)← 实现功能
9. 行程管理增强            ← 复制/版本回退 UI

Phase 3 — 生态完善
=========================
10. 评价系统 (REVIEW)      ← 依赖 USER + ATTR + TRIP
```

---

## 6. 各模块详细说明

### M0 — 基础设施 (INFRA)

**子 Agent 创建指令**：

```
你是基础设施子 Agent。请完成以下任务：

1. 使用 npx create-next-app@latest 初始化 Next.js 14+ App Router 项目
   - TypeScript strict 模式
   - Tailwind CSS
   - ESLint
   - App Router
   - src/ 目录

2. 安装依赖：
   - @supabase/supabase-js @supabase/ssr
   - @tanstack/react-query
   - react-hook-form zod @hookform/resolvers
   - date-fns
   - react-markdown remark-gfm
   - 开发依赖：vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react

3. 配置环境变量 .env.local：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DEEPSEEK_API_KEY

4. 创建 src/lib/supabase/client.ts（浏览器端 Client，使用 createBrowserClient）
5. 创建 src/lib/supabase/server.ts（服务端 Client，使用 createServerClient + cookies()）
6. 创建 src/lib/supabase/middleware.ts（Session 续期）
7. 创建 src/middleware.ts（引入 Supabase 中间件）
8. 配置 tailwind.config.ts（主题色、中文字体 Noto Sans SC）
9. 创建 globals.css（Tailwind 指令 + CSS 变量）
10. 配置 vitest.config.ts
11. 配置 eslint.config.mjs + .prettierrc
12. 创建完整目录结构骨架（见第 4 节目录结构）
13. 创建 src/types/ 下所有类型文件的基础定义

**测试要求**：为 supabase client 工具函数编写 vitest 单元测试。
**质量要求**：通过 tsc --noEmit、eslint、prettier 检查。
```

### M1 — 用户系统 (USER)

**子 Agent 创建指令**：

```
你是用户系统子 Agent。请完成以下任务：

1. 创建 Supabase Auth Provider（邮箱注册/登录已在 Supabase Dashboard 开启）
2. 在 Supabase Dashboard 执行 profiles 表 SQL + handle_new_user 触发器
3. 配置 profiles 的 RLS 策略（自己可读写）

4. 创建 src/components/auth/RegisterForm.tsx：
   - 邮箱 + 密码 + 确认密码
   - React Hook Form + Zod 验证
   - 调用 supabase.auth.signUp()
   - 注册成功 → 跳转 /dashboard
   - 错误处理：邮箱已存在、密码太弱

5. 创建 src/app/register/page.tsx（引用 RegisterForm）

6. 创建 src/components/auth/LoginForm.tsx：
   - 邮箱 + 密码
   - React Hook Form + Zod 验证
   - 调用 supabase.auth.signInWithPassword()
   - 登录成功 → 跳转 /dashboard
   - 错误处理

7. 创建 src/app/login/page.tsx（引用 LoginForm）

8. 创建 src/components/auth/AuthProvider.tsx：
   - 监听 onAuthStateChange 维护全局登录态
   - 暴露 user / loading / signOut
   - 在 Root Layout 中包裹

9. 配置路由守卫（在现有 middleware.ts 中）：
   - /dashboard, /trips/*, /orders, /settings → 需登录，否则重定向 /login
   - /login, /register → 已登录则重定向 /dashboard
   - /, /attractions/:id → 公开

10. 创建 src/app/settings/page.tsx 个人设置页：
    - 编辑昵称（UPDATE profiles）
    - 上传头像（Supabase Storage + 更新 avatar_url）
    - 设置默认出发城市 + 出行偏好
    - 保存成功 Toast

11. 创建 src/components/layout/Header.tsx：
    - 未登录：登录/注册链接
    - 已登录：头像 + 昵称 + 下拉菜单（工作台/设置/退出）
    - 退出 → signOut() + 跳转首页

12. 创建 Zod 验证 schema：src/lib/validations/auth.ts

**测试要求**：为 AuthProvider、LoginForm、RegisterForm、表单验证 schema 编写 vitest 单元测试。
**质量要求**：通过 tsc --noEmit、eslint、prettier 检查。
```

### M2 — 景点库 (ATTR)

**子 Agent 创建指令**：

```
你是景点库子 Agent。请完成以下任务：

1. 在 Supabase Dashboard 执行 cities 表 SQL
2. 在 Supabase Dashboard 执行 attractions 表 SQL
3. 配置 RLS：cities SELECT 公开、attractions SELECT 公开

4. 编写 supabase/seed.sql 种子数据：
   - 录入 10+ 热门城市：北京、上海、成都、西安、杭州、重庆、昆明、厦门、广州、三亚
   - 每个城市 20+ 景点，类型覆盖：自然风光、历史文化、美食街区、购物、主题乐园、博物馆
   - 每个景点包含：name, city_id, category, description, ticket_price, opening_hours, suggested_duration
   - 执行种子数据

5. 定义 TypeScript 类型：
   - src/types/city.ts — City 类型
   - src/types/attraction.ts — Attraction 类型 + AttractionCategory 枚举

6. 创建 src/lib/supabase/queries/attractions.ts：
   - getAttractions({ city?, category?, search?, page?, limit? }) 分页查询
   - getAttractionById(id) 单条查询
   - getCities() 所有城市
   - searchAttractions(query) 全文搜索

7. 创建 src/hooks/useAttractions.ts：
   - useAttractions(filters) — useQuery 封装
   - useAttraction(id) — useQuery 封装
   - staleTime 合理配置（景点数据不常变）

8. 创建 src/components/attraction/AttractionList.tsx：
   - 卡片式布局（图片、名称、城市、评分、门票）
   - 城市筛选下拉框
   - 类别筛选标签
   - 关键词搜索框
   - 分页加载

9. 创建 src/app/attractions/[id]/page.tsx：
   - 景点完整信息
   - 所在城市其他推荐
   - 动态 metadata
   - 服务端数据获取

**测试要求**：为 queries/attractions.ts 中的函数、useAttractions hooks 编写 vitest 单元测试（mock Supabase client）。
**质量要求**：通过 tsc --noEmit、eslint、prettier 检查。
```

### M3 — 行程规划 (PLAN)

**子 Agent 创建指令**：

```
你是行程规划子 Agent。请完成以下任务：

1. 在 Supabase Dashboard 执行以下表的 SQL：
   - trips, trip_days, day_attractions, day_meals, day_transport, day_hotels, trip_versions
2. 配置所有表的 RLS 策略（仅 owner 可操作）

3. 定义 TypeScript 类型（src/types/trip.ts, src/types/chat.ts）：
   - Trip, TripDay, DayAttraction, DayMeal, DayTransport, DayHotel, TripVersion
   - TripFormData, TripGenerateRequest, TripGenerateResponse
   - ChatMessage
   - BudgetLevel 枚举

4. 创建 src/lib/ai/deepseek-client.ts：
   - generateTripPlan(systemPrompt, userPrompt) — 非流式调用
   - chatStream(systemPrompt, messages) — 流式调用
   - API Key 从环境变量读取
   - 重试 2 次 + 超时 60s

5. 创建 src/lib/ai/prompts/trip-generation.ts：
   - System Prompt（专业旅游规划助手角色）
   - 输出格式约束：严格 JSON，含 daily_plans 数组
   - 景点数据注入点位

6. 创建 src/lib/ai/prompts/trip-chat.ts：
   - 多轮对话 System Prompt
   - 上下文管理指令

7. 创建 src/lib/validations/trip.ts — Zod schema

8. 创建 supabase/functions/trips-generate/index.ts（Edge Function）：
   - 接收表单数据
   - 查询匹配景点
   - 拼接 Prompt → Deepseek
   - 解析 JSON → 写入 trips + trip_days + 子表
   - 更新 status = "generated"
   - 保存 trip_versions
   - 返回 trip_id

9. 创建 supabase/functions/trips-generate/index_test.ts（Deno 测试）

10. 创建 supabase/functions/trips-chat/index.ts（Edge Function）：
    - 接收 trip_id + user_message
    - 获取当前行程 JSON + 历史对话
    - 拼接 Prompt → Deepseek stream:true
    - ReadableStream → SSE 转发
    - 收到完整响应后更新 trips JSONB + trip_versions
    - SSE headers: Content-Type text/event-stream

11. 创建 supabase/functions/trips-chat/index_test.ts（Deno 测试）

12. 创建 src/app/trips/new/page.tsx + src/components/trip/TripForm.tsx：
    - 目的地城市级联选择
    - 出发地（默认常驻城市）
    - 日期范围选择器
    - 成人/儿童人数
    - 预算三档 Radio
    - 兴趣偏好多选标签
    - 住宿/交通偏好
    - 特殊需求自由文本
    - React Hook Form + Zod 验证
    - 提交 → 调用 trips-generate → 跳转 /trips/[id]

13. 创建行程生成 Loading 页面：
    - Loading 动画 + 文案
    - 轮询 trip.status 直到 "generated"
    - 2 分钟超时提示

14. 创建 src/components/trip/ChatPanel.tsx：
    - 消息列表（用户右对齐 / AI 左对齐）
    - 流式逐字显示（fetch + ReadableStream）
    - Markdown 渲染（react-markdown）
    - 自动滚动到底部
    - 断连提示 + 重连按钮

**测试要求**：
- vitest：TripForm 表单验证、工具函数
- deno test：trips-generate 和 trips-chat 的 Edge Function 测试（mock Deepseek API）
**质量要求**：通过 tsc --noEmit、eslint、prettier、deno test 检查。
```

### M4 — 行程管理 (MGMT)

**子 Agent 创建指令**：

```
你是行程管理子 Agent。请完成以下任务：

1. 创建 src/lib/supabase/queries/trips.ts：
   - getTripsByUser(userId, { search?, status?, page? }) — 分页+搜索+筛选
   - getTripById(tripId) — 完整 JOIN 查询（含所有子表）
   - deleteTrip(tripId) — 软删除（is_deleted = true）
   - getTripVersions(tripId)
   - restoreTripVersion(tripId, versionNumber)

2. 创建 src/hooks/useTrips.ts — React Query hooks

3. 创建 src/app/dashboard/page.tsx 工作台：
   - 行程卡片列表（时间倒序）
   - 搜索（目的地/标题）
   - 状态筛选（draft/generated/booked/completed）
   - 空状态引导
   - "新建行程"按钮

4. 创建 src/components/trip/TripCard.tsx：
   - 目的地、日期、天数、状态 Badge
   - 删除按钮 + 确认弹窗

5. 创建 src/app/trips/[id]/page.tsx 行程详情页：
   - 行程概要（标题、目的地、日期、人数、预算）
   - Timeline 时间轴组件（src/components/trip/Timeline.tsx）
   - 每日景点（顺序编号 + 名称 + 简介 + 时长 + 门票）
   - 每日餐饮（早/中/晚）
   - 每日交通
   - 每日住宿
   - BudgetSummary 预算汇总卡片
   - 右侧 ChatPanel 嵌入

6. 行程删除功能：
   - 确认弹窗
   - 软删除 + Toast

7. 创建 src/components/trip/VersionHistory.tsx：
   - 版本历史侧面板
   - 按时间倒序
   - 预览版本
   - 回退按钮

8. 创建 supabase/functions/trips-copy/index.ts：
   - 深拷贝 trip 所有关联数据
   - 新 trip 状态 "draft"，标题加 "(副本)"
   - 返回新 trip_id

9. 创建 supabase/functions/trips-copy/index_test.ts（Deno 测试）
10. 行程详情页操作按钮组（复制/删除 + Phase 2 的导出/分享占位）

**测试要求**：vitest 测试 queries/trips.ts、TripCard、Timeline 组件；deno test 测试 trips-copy。
**质量要求**：通过 tsc --noEmit、eslint、prettier、deno test 检查。
```

### M5 — 预订系统 (BOOK)

**Phase 1 子 Agent 创建指令**：

```
你是预订系统子 Agent（Phase 1）。请完成以下任务：

1. 在 Supabase Dashboard 执行 orders 表 SQL
2. 配置 RLS 策略（仅 owner 可操作）
3. 定义 src/types/order.ts — Order, OrderType, OrderStatus, 详情类型
4. 创建 src/lib/supabase/queries/orders.ts — getOrdersByUser, cancelOrder
5. 创建 src/hooks/useOrders.ts
6. 创建 src/app/orders/page.tsx 订单列表页 + src/components/booking/OrderCard.tsx
7. 订单状态标签 + 取消按钮（仅 pending 状态）
8. 空状态提示

**测试要求**：vitest 测试 queries/orders.ts。
```

**Phase 2 子 Agent 创建指令**（仅当 M0-M7 全部完成后才创建）：

```
你是预订系统子 Agent（Phase 2）。请完成以下任务：

1. 创建 supabase/functions/orders-create/index.ts：
   - 接收 trip_id + order_type + detail
   - 创建订单（status: pending）
   - 返回订单详情 + 第三方跳转 URL
2. 创建 deno 测试
3. 在行程详情页的机票/酒店/景点旁添加"预订"按钮
4. 点击 → 调用 orders-create → 新窗口打开第三方链接
```

### M6 — 评价系统 (REVIEW)

**子 Agent 创建指令**：

```
你是评价系统子 Agent。请完成以下任务：

1. 在 Supabase Dashboard 执行 reviews 表 SQL
2. 配置 RLS：SELECT 公开，INSERT/UPDATE/DELETE 仅 owner
3. 定义 src/types/review.ts — Review, CreateReviewInput
4. 创建 src/lib/supabase/queries/reviews.ts：
   - getReviewsByAttraction(attractionId, page, limit)
   - getReviewsByUser(userId)
   - getAverageRating(attractionId)
5. 创建 src/hooks/useReviews.ts
6. 创建 src/lib/validations/review.ts — Zod schema
7. 创建 supabase/functions/reviews-submit/index.ts：
   - 接收 attraction_id + trip_id + rating + content
   - 防重复评价
   - 写入 reviews → 更新 attractions.rating_avg + rating_count
8. 创建 deno 测试
9. 创建 src/components/review/StarRating.tsx（已列在 ui 组件中，此处对接）
10. 创建 src/components/review/ReviewForm.tsx — 星级评分 + TextArea
11. 创建 src/components/review/ReviewList.tsx — 评价列表 + 分页
12. 集成到 /attractions/:id 页面底部

**测试要求**：vitest 测试 queries/reviews.ts、ReviewForm、ReviewList；deno test 测试 reviews-submit。
**质量要求**：通过 tsc --noEmit、eslint、prettier、deno test 检查。
```

### M7 — 前端页面 (PAGE)

**子 Agent 创建指令**：

```
你是前端页面子 Agent。请完成以下任务：

1. 创建所有通用 UI 组件（src/components/ui/）：
   - Button（primary/secondary/outline/ghost + loading + disabled 状态）
   - Input + TextArea（带 label + error 显示）
   - Card（可配置 padding、hover 效果）
   - Modal（确认弹窗、表单弹窗，支持 title/body/footer）
   - Toast（success/error/info/warning，自动消失，动画）
   - Loading（Spinner + Skeleton 骨架屏）
   - Badge（状态标签，多种颜色）
   - EmptyState（空数据占位，图标 + 文案 + 可选 CTA）
   - DateRangePicker（开始/结束日期，基于 date-fns）
   - CitySelect（省/市/区级联选择）
   - TagSelect（多选标签组）
   - StarRating（1-5 星可交互/只读两种模式）
   - Pagination（上一页/下一页/页码）
   - MarkdownRenderer（基于 react-markdown + remark-gfm）

2. 每个 UI 组件必须编写 vitest 单元测试

3. 创建 src/components/layout/Footer.tsx（版权信息 + 基础链接）

4. 创建 src/app/page.tsx 首页：
   - Hero 区域（标题 + 副标题 + CTA "开始规划你的旅行"）
   - 功能亮点 4 卡片（智能生成 / 灵活调整 / 一体预订 / 历史沉淀）
   - 热门目的地展示（城市卡片网格，点击跳转景点列表）
   - SEO metadata

5. 创建 src/app/not-found.tsx — 自定义 404

6. 创建 src/app/error.tsx — 全局 Error Boundary

7. 创建 src/app/loading.tsx — 全局 Loading

8. 为关键路由创建各自的 loading.tsx

9. 创建 src/lib/utils/cn.ts — clsx + tailwind-merge 合并工具

10. 创建 src/lib/utils/format.ts — 日期/货币/数字格式化

**测试要求**：为所有 UI 组件编写 vitest 单元测试。
**质量要求**：通过 tsc --noEmit、eslint、prettier 检查。
```

---

## 7. 测试规范

### 7.1 vitest（Next.js 前端代码）

配置文件 `vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

测试命名规则：

- `__tests__/components/Button.test.tsx` — 组件测试
- `__tests__/hooks/useTrips.test.ts` — Hook 测试
- `__tests__/lib/queries/attractions.test.ts` — 查询函数测试
- `__tests__/validations/trip.test.ts` — 验证 Schema 测试

### 7.2 Deno 原生测试（Edge Functions）

每个 Edge Function 必须搭配 `index_test.ts`，位于同目录下。

示例 `index_test.ts` 结构：

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("trips-generate: returns 400 without form data", async () => {
  // mock request/response
});

Deno.test("trips-generate: returns trip_id on success", async () => {
  // mock Deepseek API response
});
```

运行命令：`deno test supabase/functions/*/index_test.ts --allow-net --allow-env`

### 7.3 质量门禁

每个模块完成后的验证命令：

```bash
# Next.js 代码
npx tsc --noEmit          # 类型检查，0 错误
npx eslint .              # 代码规范，0 error
npx prettier --check .    # 格式检查
npx vitest run --coverage # 单元测试 + 覆盖率

# Edge Functions
deno test supabase/functions/*/index_test.ts --allow-net --allow-env
```

---

## 8. 环境变量

`.env.local` 文件结构：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DEEPSEEK_API_KEY=sk-...
```

Supabase Edge Functions 需要在 Supabase Dashboard 中配置同样的环境变量（`DEEPSEEK_API_KEY`）。

---

## 9. 页面路由与路由守卫

| 路由                | 页面               | 访问控制              |
| ------------------- | ------------------ | --------------------- |
| `/`                 | 首页               | 公开                  |
| `/login`            | 登录               | 已登录 → `/dashboard` |
| `/register`         | 注册               | 已登录 → `/dashboard` |
| `/dashboard`        | 工作台（行程列表） | 需登录                |
| `/trips/new`        | 新建行程           | 需登录                |
| `/trips/[id]`       | 行程详情           | 需登录                |
| `/attractions/[id]` | 景点详情           | 公开                  |
| `/orders`           | 我的订单           | 需登录                |
| `/settings`         | 个人设置           | 需登录                |

---

## 10. API 设计（Edge Functions）

| Method | Endpoint              | Edge Function    | 说明                 |
| ------ | --------------------- | ---------------- | -------------------- |
| POST   | `/api/trips-generate` | `trips-generate` | 创建行程 + AI 生成   |
| POST   | `/api/trips-chat`     | `trips-chat`     | 多轮对话（SSE 流式） |
| POST   | `/api/trips-copy`     | `trips-copy`     | 复制行程             |
| POST   | `/api/orders-create`  | `orders-create`  | 创建订单             |
| POST   | `/api/reviews-submit` | `reviews-submit` | 提交评价             |

---

## 11. 主 Agent 工作流程

主 Agent 按以下步骤推进项目：

```
Step 0: 验证环境 — Node.js、npm、Supabase CLI 已安装
Step 1: 创建子 Agent → 执行 M0（基础设施）
Step 2: 验证 M0 — tsc/eslint/vitest 齐过
Step 3: 创建子 Agent → 执行 M1（用户系统）
Step 4: 验证 M1 — tsc/eslint/vitest 齐过
Step 5: 创建子 Agent → 执行 M2（景点库） → 验证
Step 6: 创建子 Agent → 执行 M3（行程规划）→ 验证（含 deno test）
Step 7: 创建子 Agent → 执行 M4（行程管理）→ 验证
Step 8: 创建子 Agent → 执行 M5 Phase 1（预订建表）→ 验证
Step 9: 创建子 Agent → 执行 M7（前端页面收尾）→ 验证
Step 10: 全量集成验证 — 所有测试通过
Step 11: 创建子 Agent → 执行 M5 Phase 2 + M6（按需）
Step 12: 更新 progress.md 标记项目完成
```

每完成一个模块，立即更新 `doc/tasks/progress.md` 中对应模块的状态。

---

## 12. 集成检查清单

在项目最终交付前，主 Agent 必须确认：

- [ ] `npx tsc --noEmit` 零错误
- [ ] `npx eslint .` 零 error
- [ ] `npx prettier --check .` 通过
- [ ] `npx vitest run --coverage` 覆盖率 ≥ 80%
- [ ] `deno test supabase/functions/*/index_test.ts --allow-net --allow-env` 全部通过
- [ ] 所有数据库表已创建（12 张表）
- [ ] 所有 RLS 策略已配置
- [ ] 种子数据已执行（10+ 城市 × 20+ 景点）
- [ ] 所有页面路由可访问
- [ ] 路由守卫工作正常
- [ ] Edge Functions 已部署到 Supabase
- [ ] `doc/tasks/progress.md` 已更新为全部完成

---

## 附：子 Agent 通用规范（每次创建子 Agent 时前置）

1. **代码规范**：
   - 使用 TypeScript strict 模式，所有函数参数和返回值必须有类型标注
   - React 组件使用函数组件 + Hooks，禁止 class 组件
   - 文件命名：组件 PascalCase（`TripForm.tsx`），工具 camelCase（`deepseek-client.ts`）
   - 禁止使用 `any` 类型（除非确有必要且已注释说明）
   - 导出使用 named export（`export function X`），禁止 default export

2. **测试规范**：
   - 每个模块的测试文件放在 `__tests__/` 对应目录
   - 组件测试覆盖：渲染、交互、边界状态（loading/empty/error）
   - 工具函数测试覆盖：正常路径、异常路径、边界值
   - Mock 外部依赖（Supabase Client、Deepseek API、next/navigation 等）

3. **输出格式**：
   - 子 Agent 完成后，输出一份简短的"完成报告"：已创建文件清单、测试结果摘要、已知问题（如有）
   - 主 Agent 验证后更新 `doc/tasks/progress.md`
