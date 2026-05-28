# 智能旅游规划 Agent 平台 — 概要设计文档

## 文档信息

| 项目     | 内容                            |
| -------- | ------------------------------- |
| 文档版本 | v1.0                            |
| 创建日期 | 2026-05-27                      |
| 状态     | 草案                            |
| 关联文档 | [需求文档 (PRD)](./proposal.md) |

---

## 1. 架构总览

### 1.1 系统架构图

```
┌──────────────────────────────────────────────────────────┐
│                    客户端 (Next.js App Router)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  首页     │ │  登录/注册│ │  工作台   │ │  行程详情    │ │
│  │  /        │ │  /login  │ │ /dashboard│ │  /trips/:id │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ 新建行程  │ │  景点详情 │ │  我的订单 │ │  个人设置    │ │
│  │/trips/new│ │/attract..│ │  /orders  │ │  /settings  │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │
└────────────┬──────────────────────────────┬──────────────┘
             │ Supabase Client (直连)        │ HTTP (Edge Functions)
             ▼                              ▼
┌──────────────────────────────────────────────────────────┐
│                   Supabase 平台                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │   Auth (认证)     │  │   Edge Functions (Deno/TS)   │  │
│  │   · 邮箱注册/登录 │  │   · trips-generate           │  │
│  │   · Token 鉴权   │  │   · trips-chat (SSE 流式)     │  │
│  │   · RLS 策略     │  │   · trips-copy                │  │
│  └──────────────────┘  │   · orders-create             │  │
│                        │   · reviews-submit            │  │
│  ┌──────────────────┐  └──────────────────────────────┘  │
│  │   PostgreSQL      │                                    │
│  │   (数据存储)      │  ┌──────────────────────────────┐  │
│  │   · profiles      │  │   Storage                     │  │
│  │   · trips         │  │   · 头像                      │  │
│  │   · attractions   │  │   · 景点图片                  │  │
│  │   · orders        │  │   · 行程导出文件              │  │
│  │   · reviews       │  └──────────────────────────────┘  │
│  └──────────────────┘                                    │
└──────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────┐
│   Deepseek API   │
│   · 行程生成      │
│   · 多轮对话调整  │
└──────────────────┘
```

### 1.2 技术选型

| 层次       | 技术                                      | 说明                                           |
| ---------- | ----------------------------------------- | ---------------------------------------------- |
| 前端框架   | Next.js 14+ (App Router)                  | SSR 用于内容展示页，Client Components 用于交互 |
| 样式方案   | Tailwind CSS                              | 与 Next.js 深度集成，快速构建 UI               |
| 后端运行时 | Supabase Edge Functions (Deno/TypeScript) | 无服务器边缘计算，低延迟                       |
| 数据库     | Supabase PostgreSQL                       | 托管式关系型数据库                             |
| 认证       | Supabase Auth                             | 邮箱注册/登录，自动管理 JWT + RLS              |
| 文件存储   | Supabase Storage                          | 头像、景点图片、导出文件                       |
| AI 服务    | Deepseek API (chat/completions)           | 行程生成与多轮对话                             |
| 实时通信   | SSE (Server-Sent Events)                  | AI 流式输出到前端                              |

### 1.3 前端与后端的职责边界

```
┌─────────────────────────────────────────────────────┐
│  Next.js 前端 (直接操作)                              │
│  · 简单 CRUD (profiles, attractions 查询,            │
│    reviews 查询) — 通过 Supabase Client + RLS        │
│  · 页面渲染、路由、状态管理                            │
│  · Supabase Auth UI 集成                             │
├─────────────────────────────────────────────────────┤
│  Edge Functions 后端 (需要服务端能力时)                │
│  · AI 行程生成 (需调用 Deepseek + 服务端 Secret)       │
│  · 多轮对话 (SSE 流式代理 + 上下文管理)               │
│  · 复杂业务逻辑 (行程复制、订单创建)                    │
│  · 管理员操作 (景点 CRUD)                              │
└─────────────────────────────────────────────────────┘
```

> **设计原则**：前端能通过 Supabase Client + RLS 直接安全完成的操作不经过 Edge Function，减少不必要的网络跳转。Edge Function 仅用于需要服务端 Secret、复杂业务编排、或对外部 API 调用的场景。

---

## 2. 模块划分

系统按 PRD 功能域拆分为 **6 个独立模块**，每个模块包含前端组件 + Edge Function（如需）+ 数据库表 + RLS 策略。

```
模块依赖关系 (箭头 = 依赖方向)：

  用户系统 ◄─── 行程规划
    ▲              ▲
    │              │
    ├──── 行程管理  │
    ├──── 预订     ─┤
    ├──── 评价系统 ─┘
    │
    └──── 景点库 (独立，无业务依赖)
```

各模块通过 **数据库共享表** 进行数据协作，不通过模块间函数调用，保证独立可测试。

---

## 3. 模块详细设计

### 3.1 用户系统模块 (User Module)

#### 3.1.1 职责

- 用户注册/登录（委托 Supabase Auth）
- 用户个人资料管理（profiles 表）
- 会话保持（JWT Token 自动管理）
- 为其他模块提供用户身份（通过 RLS 策略中的 `auth.uid()`）

#### 3.1.2 涉及的表

| 表名         | 来源               | 说明                       |
| ------------ | ------------------ | -------------------------- |
| `auth.users` | Supabase Auth 内置 | 邮箱、加密密码、UUID       |
| `profiles`   | 自定义             | 昵称、头像、默认城市、偏好 |

#### 3.1.3 接口

| 方式            | 端点 / 操作                          | 说明                                |
| --------------- | ------------------------------------ | ----------------------------------- |
| Supabase Client | `supabase.auth.signUp()`             | 邮箱注册                            |
| Supabase Client | `supabase.auth.signInWithPassword()` | 邮箱登录                            |
| Supabase Client | `supabase.auth.signOut()`            | 登出                                |
| Supabase Client | `profiles` 表 CRUD                   | 个人资料读写（RLS: 只能操作自己的） |
| Supabase Client | `supabase.auth.onAuthStateChange()`  | 监听登录态变化                      |

> 用户系统模块**不涉及任何 Edge Function**，全部通过 Supabase Client SDK 在客户端完成。

#### 3.1.4 RLS 策略

```sql
-- profiles 表：用户只能读写自己的 profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 3.1.5 前端页面 & 组件

| 路由        | 说明                                         |
| ----------- | -------------------------------------------- |
| `/login`    | 登录页                                       |
| `/register` | 注册页                                       |
| `/settings` | 个人设置页（昵称、头像、默认城市、出行偏好） |

#### 3.1.6 独立测试方案

- 测试 Supabase Auth 注册/登录流程
- 测试 profiles 表 CRUD 的 RLS 隔离（用户 A 无法读写用户 B 的 profile）
- 测试 Token 过期后自动刷新

---

### 3.2 行程规划模块 (Trip Planning Module)

#### 3.2.1 职责

- 结构化表单收集用户出行需求
- 调用 Deepseek API 生成每日行程
- 多轮对话调整行程（SSE 流式返回）
- 行程版本管理

#### 3.2.2 涉及的表

| 表名            | 说明                               |
| --------------- | ---------------------------------- |
| `trips`         | 行程主表（表单数据 + AI 生成结果） |
| `trip_versions` | 行程版本历史                       |
| `attractions`   | 景点库（只读，供 AI Prompt 使用）  |
| `cities`        | 城市数据（只读，供三级联动选择）   |

#### 3.2.3 Edge Functions

##### `trips-generate`

- **触发**：前端 POST 表单数据
- **输入**：`{ destination, departure, date_range, people, budget, preferences, ... }`
- **处理流程**：
  1. 验证 JWT（通过 Supabase 内置鉴权）
  2. 查询 `attractions` 表中目的城市的景点数据
  3. 组装 Prompt（系统指令 + 用户需求 + 景点上下文）
  4. 调用 Deepseek API 生成行程
  5. 解析 AI 返回的结构化 JSON
  6. 写入 `trips` 表（status: `generated`）
  7. 保存原始版本到 `trip_versions`
  8. 返回 `{ trip_id }`

- **超时**：Edge Function 最长 60s；Deepseek 调用设置 45s 超时
- **错误处理**：Deepseek 调用失败时重试 2 次（间隔 2s），仍失败则返回错误码 + 提示

##### `trips-chat`

- **触发**：前端 POST 对话消息
- **输入**：`{ trip_id, message }`
- **输出**：SSE 流式文本（`text/event-stream`）
- **处理流程**：
  1. 验证 JWT + trip 归属
  2. 从 `trips.full_content` 读取当前行程上下文
  3. 从 `trip_versions` 读取最近 N 轮对话历史
  4. 组装多轮对话 Prompt
  5. 调用 Deepseek API（`stream: true`）
  6. 将 Deepseek 的 SSE 流代理转发给前端
  7. 流结束后，解析完整结果，写入 `trips.full_content`，追加 `trip_versions`

#### 3.2.4 API 契约

```
POST /api/trips
  Request:  { destination, departure, start_date, end_date, num_adults, num_children,
              budget_level, preferences, special_requirements }
  Response: { trip_id: UUID }

POST /api/trips/:id/chat
  Request:  { message: string }
  Response: SSE stream (text/event-stream)
    event: delta
    data: {"content": "..."}

    event: done
    data: {"trip_id": "...", "version": N}
```

#### 3.2.5 前端页面 & 组件

| 路由         | 说明                                             |
| ------------ | ------------------------------------------------ |
| `/trips/new` | 结构化表单（城市三级联动、日期范围、预算档位等） |
| `/trips/:id` | 行程详情（时间轴 + Markdown 渲染 + 对话面板）    |

关键组件：

- `TripForm` — 结构化输入表单
- `TripTimeline` — 每日行程时间轴可视化
- `TripContent` — AI 生成的 Markdown 渲染
- `ChatPanel` — 多轮对话面板（SSE 流式接收）

#### 3.2.6 独立测试方案

- Mock Deepseek API 响应，测试 `trips-generate` 的 Prompt 组装和结果解析
- 模拟 SSE 流，测试前端 `ChatPanel` 的流式渲染
- 测试版本历史的保存与回退逻辑

---

### 3.3 行程管理模块 (Trip Management Module)

#### 3.3.1 职责

- 行程列表展示（搜索、筛选、分页）
- 行程详情查看
- 行程复制
- 行程软删除
- 行程度量（后续：PDF/图片导出、分享链接）

#### 3.3.2 涉及的表

| 表名    | 说明                           |
| ------- | ------------------------------ |
| `trips` | 行程主表（查询、更新、软删除） |

#### 3.3.3 数据访问策略

行程管理模块以**前端直连 Supabase**为主，仅在复制等需要服务端编排的场景使用 Edge Function。

| 操作     | 方式                 | 说明                             |
| -------- | -------------------- | -------------------------------- |
| 列表查询 | Supabase Client 直连 | RLS 保证只返回当前用户的行程     |
| 详情查询 | Supabase Client 直连 | 同上                             |
| 软删除   | Supabase Client 直连 | 更新 `deleted_at` 字段           |
| 复制行程 | Edge Function        | 读取旧行程 → 清理数据 → 新建行程 |

##### Edge Function: `trips-copy`

- **触发**：前端 POST
- **输入**：`{ trip_id }`
- **处理流程**：
  1. 验证 JWT + trip 归属
  2. 读取 `trips` 行数据
  3. 清除 AI 生成内容（`full_content`），保留表单参数
  4. 插入新 trip（status: `draft`），复制版本记录
  5. 返回新 `trip_id`

#### 3.3.4 API 契约

```
GET    /api/trips               # 行程列表（前端直连，非 Edge Function）
GET    /api/trips/:id           # 行程详情（前端直连）
DELETE /api/trips/:id           # 软删除（前端直连）
POST   /api/trips/:id/copy      # 复制行程 → Edge Function
```

#### 3.3.5 前端页面 & 组件

| 路由         | 说明                                          |
| ------------ | --------------------------------------------- |
| `/dashboard` | 工作台 = 行程列表（搜索栏 + 状态筛选 + 分页） |

关键组件：

- `TripList` — 卡片式行程列表
- `TripCard` — 单张行程卡片（封面图、标题、日期、状态标签）
- `TripSearchBar` — 搜索 & 筛选栏

#### 3.3.6 独立测试方案

- 创建多个测试行程，验证列表分页、搜索、筛选功能
- 测试软删除后数据仍存在、列表不显示
- 测试复制行程后新行程的表单参数与原行程一致

---

### 3.4 预订模块 (Booking Module)

#### 3.4.1 职责

- 订单创建（机票/酒店/门票）
- 订单列表 & 详情
- 订单取消
- 跳转第三方平台完成实际支付

#### 3.4.2 涉及的表

| 表名     | 说明                                                  |
| -------- | ----------------------------------------------------- |
| `orders` | 订单主表（类型、状态、关联 trip、金额、第三方订单号） |

新增表结构：

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  trip_id UUID REFERENCES trips(id),
  order_type TEXT CHECK (order_type IN ('flight', 'hotel', 'ticket')),
  order_status TEXT CHECK (order_status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  title TEXT NOT NULL,           -- 航班号 / 酒店名 / 景点名
  amount DECIMAL NOT NULL,
  third_party_url TEXT,          -- 跳转链接
  third_party_order_id TEXT,     -- 第三方订单号（预留）
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.4.3 数据访问策略

| 操作          | 方式                 | 说明                            |
| ------------- | -------------------- | ------------------------------- |
| 创建订单      | Edge Function        | 服务端校验 + 生成第三方跳转链接 |
| 订单列表/详情 | Supabase Client 直连 | RLS 保证隔离                    |
| 取消订单      | Supabase Client 直连 | 仅允许取消 `pending` 状态       |

##### Edge Function: `orders-create`

- **输入**：`{ trip_id, order_type, title, amount, detail }`
- **处理流程**：
  1. 验证 JWT + trip 归属
  2. 创建订单记录（status: `pending`）
  3. 组装第三方平台跳转 URL（初期用固定模板拼接）
  4. 返回 `{ order_id, redirect_url }`

#### 3.4.4 API 契约

```
POST /api/orders    # 创建订单 → Edge Function
GET  /api/orders    # 订单列表（前端直连）
```

#### 3.4.5 前端页面 & 组件

| 路由      | 说明         |
| --------- | ------------ |
| `/orders` | 我的订单列表 |

关键组件：

- `OrderList` — 订单列表
- `OrderCard` — 订单卡片（类型图标 + 状态标签 + 金额）
- `BookingButton` — 预订按钮（组件内包含跳转逻辑）

#### 3.4.6 独立测试方案

- Mock 第三方跳转 URL 生成逻辑
- 测试订单状态流转（pending → confirmed/cancelled）
- 测试取消订单的权限校验

---

### 3.5 景点库模块 (Attraction Module)

#### 3.5.1 职责

- 景点数据存储与查询
- 为 AI 行程生成提供上下文数据
- 为前端城市选择提供三级联动数据
- 管理后台景点 CRUD（管理员）

#### 3.5.2 涉及的表

| 表名          | 说明                 |
| ------------- | -------------------- |
| `attractions` | 景点数据             |
| `cities`      | 省/市/区三级城市数据 |

新增表结构：

```sql
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('province', 'city', 'district')),
  parent_id UUID REFERENCES cities(id),
  pinyin TEXT          -- 拼音，便于搜索
);
```

#### 3.5.3 数据访问策略

| 操作              | 方式                 | 说明         |
| ----------------- | -------------------- | ------------ |
| 景点查询、搜索    | Supabase Client 直连 | 公开可读     |
| 城市三级数据查询  | Supabase Client 直连 | 公开可读     |
| 景点 CRUD（管理） | Edge Function        | 需管理员鉴权 |

##### Edge Function: `attractions-admin`

- **鉴权**：检查 `profiles` 表中 `role = 'admin'`
- **操作**：景点 & 城市的创建、更新、删除
- Phase 1 阶段可先通过 Supabase Dashboard 直接管理种子数据，Edge Function 在 Phase 2 实现

#### 3.5.4 RLS 策略

```sql
-- attractions: 公开可读，仅管理员可写
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read attractions"
  ON attractions FOR SELECT
  USING (true);

-- cities: 公开可读
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cities"
  ON cities FOR SELECT
  USING (true);
```

#### 3.5.5 前端页面 & 组件

| 路由               | 说明                     |
| ------------------ | ------------------------ |
| `/attractions/:id` | 景点详情页（含评价列表） |

关键组件：

- `CityCascader` — 省/市/区三级联动选择器
- `AttractionCard` — 景点卡片（图片、名称、评分、标签）
- `AttractionDetail` — 景点详情（简介、门票、开放时间、地图位置）

#### 3.5.6 独立测试方案

- 插入种子数据后验证城市三级联动查询
- 测试景点全文搜索（按名称、城市、分类）
- 验证公开读取 RLS 策略（未登录用户也能查看景点）

---

### 3.6 评价系统模块 (Review Module)

#### 3.6.1 职责

- 用户对景点/行程提交评价和评分
- 评价列表展示
- 自动更新景点平均评分

#### 3.6.2 涉及的表

| 表名      | 说明     |
| --------- | -------- |
| `reviews` | 评价数据 |

#### 3.6.3 数据访问策略

| 操作         | 方式                 | 说明                                           |
| ------------ | -------------------- | ---------------------------------------------- |
| 查询评价列表 | Supabase Client 直连 | 公开可读                                       |
| 提交评价     | Edge Function        | 需登录 + 评分写入后更新 attractions.rating_avg |

##### Edge Function: `reviews-submit`

- **输入**：`{ attraction_id, trip_id, rating, content }`
- **处理流程**：
  1. 验证 JWT
  2. 校验 rating 范围 (1-5)
  3. 插入 `reviews` 表
  4. 重新计算 `attractions.rating_avg`（聚合该景点的所有评分取平均）
  5. 返回 `{ review_id }`

#### 3.6.4 API 契约

```
POST /api/reviews    # 提交评价 → Edge Function
GET  /api/reviews    # 评价列表（前端直连，支持 ?attraction_id= 筛选）
```

#### 3.6.5 前端组件

关键组件：

- `ReviewForm` — 评分 + 文本提交表单
- `ReviewList` — 评价列表（用户头像 + 评分星标 + 内容）
- `StarRating` — 五星评分交互组件

#### 3.6.6 独立测试方案

- 测试评分写入和平均值重新计算
- 测试同一用户对同一景点重复评价的限制
- 测试未登录用户无法提交评价

---

## 4. 数据库设计汇总

### 4.1 完整 ER 图

```
auth.users (Supabase 内置)
  └── profiles (1:1 扩展)
        ├── trips (1:N)
        │     └── trip_versions (1:N)
        ├── orders (1:N)
        └── reviews (1:N)

attractions (独立)
  └── reviews (1:N)

cities (独立, 自引用树形)
```

### 4.2 表清单

| 表名            | 所属模块            | 读写策略                               |
| --------------- | ------------------- | -------------------------------------- |
| `auth.users`    | 用户系统            | Supabase Auth 管理，应用只读           |
| `profiles`      | 用户系统            | 用户直连 RLS（只能读写自己的）         |
| `cities`        | 景点库              | 公开可读，管理员可写                   |
| `attractions`   | 景点库              | 公开可读，管理员可写                   |
| `trips`         | 行程规划 + 行程管理 | 用户直连 RLS                           |
| `trip_versions` | 行程规划            | 用户直连 RLS（只读自己的）             |
| `orders`        | 预订                | 用户直连 RLS（只能读写自己的）         |
| `reviews`       | 评价系统            | 公开可读，用户直连 RLS（只能写自己的） |

### 4.3 RLS 策略汇总

| 表              | SELECT                    | INSERT               | UPDATE                            | DELETE                        |
| --------------- | ------------------------- | -------------------- | --------------------------------- | ----------------------------- |
| `profiles`      | auth.uid() = id           | auth.uid() = id      | auth.uid() = id                   | 禁止                          |
| `cities`        | 所有人                    | 管理员               | 管理员                            | 管理员                        |
| `attractions`   | 所有人                    | 管理员               | 管理员                            | 管理员                        |
| `trips`         | auth.uid() = user_id      | auth.uid() = user_id | auth.uid() = user_id              | auth.uid() = user_id (软删除) |
| `trip_versions` | 通过 trip 的 user_id 间接 | 服务端写入           | 禁止                              | 禁止                          |
| `orders`        | auth.uid() = user_id      | auth.uid() = user_id | auth.uid() = user_id (仅 pending) | 禁止                          |
| `reviews`       | 所有人                    | auth.uid() = user_id | auth.uid() = user_id              | 禁止                          |

---

## 5. Edge Functions 清单

| 函数名              | 所属模块 | 触发方式        | 超时 | 说明                       |
| ------------------- | -------- | --------------- | ---- | -------------------------- |
| `trips-generate`    | 行程规划 | HTTP POST       | 60s  | 调用 Deepseek API 生成行程 |
| `trips-chat`        | 行程规划 | HTTP POST (SSE) | 120s | 多轮对话，SSE 流式代理     |
| `trips-copy`        | 行程管理 | HTTP POST       | 10s  | 复制行程                   |
| `orders-create`     | 预订     | HTTP POST       | 10s  | 创建订单 + 生成跳转链接    |
| `reviews-submit`    | 评价系统 | HTTP POST       | 5s   | 提交评价 + 更新景点均分    |
| `attractions-admin` | 景点库   | HTTP POST       | 10s  | 管理员景点 CRUD（Phase 2） |

> 所有 Edge Function 通过 Supabase 内置的 JWT 验证进行鉴权，无需额外实现认证逻辑。

---

## 6. 前端架构

### 6.1 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局（AuthProvider + 导航栏）
│   ├── page.tsx                  # 首页 /
│   ├── login/page.tsx            # /login
│   ├── register/page.tsx         # /register
│   ├── dashboard/page.tsx        # /dashboard (行程列表)
│   ├── trips/
│   │   ├── new/page.tsx          # /trips/new (新建行程表单)
│   │   └── [id]/page.tsx         # /trips/:id (行程详情 + 对话)
│   ├── attractions/
│   │   └── [id]/page.tsx         # /attractions/:id (景点详情)
│   ├── orders/page.tsx           # /orders (我的订单)
│   └── settings/page.tsx         # /settings (个人设置)
├── components/
│   ├── ui/                       # 通用 UI 组件 (Button, Card, Modal...)
│   ├── auth/                     # 用户系统模块
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── trip-planner/             # 行程规划模块
│   │   ├── TripForm.tsx
│   │   ├── TripTimeline.tsx
│   │   ├── TripContent.tsx
│   │   └── ChatPanel.tsx
│   ├── trip-manager/             # 行程管理模块
│   │   ├── TripList.tsx
│   │   ├── TripCard.tsx
│   │   └── TripSearchBar.tsx
│   ├── booking/                  # 预订模块
│   │   ├── OrderList.tsx
│   │   ├── OrderCard.tsx
│   │   └── BookingButton.tsx
│   ├── attraction/               # 景点库模块
│   │   ├── CityCascader.tsx
│   │   ├── AttractionCard.tsx
│   │   └── AttractionDetail.tsx
│   └── review/                   # 评价系统模块
│       ├── ReviewForm.tsx
│       ├── ReviewList.tsx
│       └── StarRating.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 浏览器端 Supabase Client
│   │   ├── server.ts             # 服务端 Supabase Client
│   │   └── middleware.ts         # Auth 中间件
│   └── utils.ts                  # 通用工具函数
└── types/
    └── index.ts                  # 全局 TypeScript 类型定义
```

```
supabase/
├── functions/                    # Edge Functions
│   ├── trips-generate/index.ts
│   ├── trips-chat/index.ts
│   ├── trips-copy/index.ts
│   ├── orders-create/index.ts
│   ├── reviews-submit/index.ts
│   └── attractions-admin/index.ts
├── migrations/                   # 数据库迁移文件
│   ├── 001_profiles.sql
│   ├── 002_cities.sql
│   ├── 003_attractions.sql
│   ├── 004_trips.sql
│   ├── 005_trip_versions.sql
│   ├── 006_orders.sql
│   └── 007_reviews.sql
└── seed.sql                      # 种子数据 (城市 + 景点)
```

### 6.2 状态管理

| 数据范围     | 管理方式                           | 说明                     |
| ------------ | ---------------------------------- | ------------------------ |
| 用户认证状态 | Supabase Auth Context              | 全局 Auth Provider       |
| 服务器数据   | Supabase Client 直连 + React Query | 缓存、重新验证、乐观更新 |
| 表单状态     | React Hook Form                    | 结构化表单验证           |
| 对话消息     | 组件内 useState                    | ChatPanel 局部状态       |
| 城市级联数据 | React Query (staleTime: Infinity)  | 几乎不变的数据长期缓存   |

### 6.3 路由守卫

通过 Next.js Middleware (`src/lib/supabase/middleware.ts`) 实现：

- `/dashboard`, `/trips/*`, `/orders`, `/settings` — 需登录，未登录重定向到 `/login`
- `/login`, `/register` — 已登录用户重定向到 `/dashboard`
- `/`, `/attractions/:id` — 公开访问

---

## 7. AI 交互设计

### 7.1 行程生成 Prompt 结构

```
System: 你是一个专业的旅游规划助手。根据用户提供的出行需求...
        输出格式：严格的 JSON，包含 daily_plans 数组...

Context: 目的地景点数据：{ attraction_list }

User: 目的地：{destination}，日期：{start} 至 {end}，人数：{adults}成人{children}儿童，
      预算：{budget_level}，偏好：{preferences}，特殊需求：{special}
```

### 7.2 多轮对话 Prompt 结构

```
System: (同上 + 上下文管理指令)

Context:
  当前行程：{current_trip_json}
  历史对话：{conversation_history}

User: {user_message}
```

### 7.3 流式代理

Edge Function `trips-chat` 使用 `fetch` 调用 Deepseek API（`stream: true`），逐块读取响应并通过 `ReadableStream` 转发为 SSE 格式给前端。前端使用 `EventSource` 或 `fetch` + `ReadableStream` 接收。

---

## 8. 部署架构

```
┌─────────────────────────────────────────┐
│  Vercel / 自托管                          │
│  ┌─────────────────────────────────┐    │
│  │  Next.js (静态 + SSR)            │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
              │                │
              ▼                ▼
┌─────────────────────────────────────────┐
│  Supabase Cloud (免费层 / Pro)           │
│  · Auth · PostgreSQL · Storage           │
│  · Edge Functions                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Deepseek API                            │
└─────────────────────────────────────────┘
```

| 组件         | 部署方式                  | 说明                    |
| ------------ | ------------------------- | ----------------------- |
| Next.js      | Vercel / Cloudflare Pages | 支持 SSR 的平台即可     |
| Supabase     | Supabase Cloud            | 托管服务，免运维        |
| Deepseek API | 直接调用                  | 通过 Edge Function 代理 |

---

## 9. 分期实现计划

### Phase 1 — MVP

| 模块     | 交付物                                                 |
| -------- | ------------------------------------------------------ |
| 用户系统 | 注册/登录/个人设置（完整）                             |
| 景点库   | `cities` + `attractions` 建表 + 种子数据               |
| 行程规划 | 结构化表单 + `trips-generate` + `trips-chat`（基础版） |
| 行程管理 | 行程列表 + 详情 + 软删除                               |
| 预订     | `orders` 建表（功能 Phase 2 实现）                     |
| 评价系统 | `reviews` 建表（功能 Phase 3 实现）                    |

### Phase 2 — 体验增强

| 模块     | 交付物                                   |
| -------- | ---------------------------------------- |
| 行程规划 | 多轮对话优化（版本回退 UI）              |
| 行程管理 | 行程复制 `trips-copy`                    |
| 预订     | 订单创建 + 跳转第三方（`orders-create`） |

### Phase 3 — 生态完善

| 模块     | 交付物                                      |
| -------- | ------------------------------------------- |
| 评价系统 | 评价提交 + 景点均分更新（`reviews-submit`） |
| 行程管理 | PDF/图片导出、分享链接                      |
| 景点库   | 管理后台（`attractions-admin`）             |

---

## 10. 风险与缓解

| 风险                     | 模块     | 缓解措施                                                                   |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| Deepseek API 不稳定/超时 | 行程规划 | `trips-generate` 内重试 2 次；`trips-chat` 前端显示连接中断提示 + 重连按钮 |
| Edge Function 60s 限制   | 行程规划 | 行程生成拆分：先返回 trip_id，前端轮询状态                                 |
| 景点种子数据不足         | 景点库   | 先收集 10+ 热门城市各 20+ 景点，后续批量导入                               |
| Supabase 免费层限流      | 全局     | Phase 1 验证可行性，Phase 2 前评估升级                                     |
| RLS 策略遗漏导致数据泄露 | 全局     | 每个 PR 必须附带 RLS 测试用例                                              |
