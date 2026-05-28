# 智能旅游规划 Agent 平台 — 产品需求文档 (PRD)

## 文档信息

| 项目     | 内容       |
| -------- | ---------- |
| 文档版本 | v1.0       |
| 创建日期 | 2026-05-27 |
| 状态     | 草案       |

---

## 1. 产品概述

### 1.1 产品定位

面向个人用户的智能旅游规划平台。用户通过结构化表单输入出行需求，由 AI（Deepseek）自动生成完整的每日行程方案，并支持多轮对话调整优化。平台同时提供机票、酒店、景点门票的实际预订能力。用户可保存历史行程以便查看和复用。

### 1.2 目标用户

- **主要用户**：有国内旅行规划需求的个人用户
- **用户画像**：希望省去手动规划时间、获得个性化行程建议的自由行旅客

### 1.3 核心价值

- **智能生成**：输入目的地、时间、预算、偏好，AI 一键生成高质量每日行程
- **灵活调整**：通过多轮对话对行程进行微调（"第三天太赶了"、"换一家川菜馆"）
- **一体预订**：行程中的机票、酒店、门票可直接预订
- **历史沉淀**：所有行程保存可查，支持复制复用

---

## 2. 功能需求

### 2.1 用户系统

| 功能点       | 描述                                      | 优先级 |
| ------------ | ----------------------------------------- | ------ |
| 注册/登录    | 支持邮箱注册登录（后续可扩展微信/手机号） | P0     |
| 个人信息管理 | 昵称、头像、出行偏好（默认设置）          | P1     |
| 会话保持     | Token 鉴权，登录态持久化                  | P0     |

### 2.2 行程规划（核心）

#### 2.2.1 结构化输入表单

用户填写以下信息发起规划：

| 字段     | 类型               | 必填 | 说明                                             |
| -------- | ------------------ | ---- | ------------------------------------------------ |
| 目的地   | 城市选择（可多选） | 是   | 支持省/市/区三级联动                             |
| 出发地   | 城市选择           | 是   | 默认取用户常驻城市                               |
| 出行日期 | 日期范围           | 是   | 开始日期 + 结束日期                              |
| 出行人数 | 数字               | 是   | 成人/儿童分开                                    |
| 预算范围 | 区间选择           | 是   | 经济/舒适/豪华 三档，或自定义金额                |
| 兴趣偏好 | 多选标签           | 否   | 自然风光、历史文化、美食、购物、亲子、户外探险等 |
| 住宿偏好 | 单选               | 否   | 经济型/舒适型/豪华型                             |
| 交通偏好 | 多选               | 否   | 飞机、高铁、自驾                                 |
| 特殊需求 | 自由文本           | 否   | 如"需要无障碍设施"、"携带宠物"                   |

#### 2.2.2 AI 行程生成

- 调用 Deepseek API，将表单数据 + 景点库数据作为上下文 Prompt
- 输出结构化每日行程，包含：

| 行程要素 | 说明                                                  |
| -------- | ----------------------------------------------------- |
| 景点     | 每日 2-4 个景点，含名称、简介、建议游玩时长、门票价格 |
| 餐饮推荐 | 早/中/晚各 1-2 个推荐，含餐厅名、菜系、人均消费       |
| 交通方式 | 城市间交通（飞机/高铁）及市内交通建议                 |
| 住宿     | 每日推荐酒店，含名称、星级、价格区间                  |
| 预算估算 | 按交通/住宿/餐饮/门票/其他 分类汇总                   |
| 天气提醒 | 根据出行日期显示历史平均天气（后续接入实时 API）      |
| 地图路线 | 景点间路线规划（后续接入地图 API）                    |

- 输出格式：Markdown 渲染展示 + 时间轴可视化

#### 2.2.3 多轮对话调整

- 行程生成后，用户在对话面板中提出修改意见
- 系统将当前行程上下文 + 用户新需求发送给 Deepseek，重新生成或局部调整
- 支持的操作示例：
  - "第三天太累了，少安排一个景点"
  - "把第二天午餐换成湘菜"
  - "预算超了，降到 5000 以内"
  - "增加一个适合小孩的景点"
- 每次调整保留历史版本，支持版本回退

### 2.3 行程管理

| 功能     | 描述                                      | 优先级 |
| -------- | ----------------------------------------- | ------ |
| 行程列表 | 按时间倒序展示所有历史行程，支持搜索/筛选 | P0     |
| 行程详情 | 查看完整日程、预算明细                    | P0     |
| 复制行程 | 一键复制历史行程作为新规划起点            | P1     |
| 删除行程 | 软删除，可恢复                            | P2     |
| 导出行程 | 导出为 PDF / 图片                         | P2     |
| 分享行程 | 生成分享链接（只读）                      | P2     |

### 2.4 预订功能

| 功能     | 描述                                     | 优先级 |
| -------- | ---------------------------------------- | ------ |
| 机票预订 | 根据行程中的航班信息，跳转或内嵌预订流程 | P1     |
| 酒店预订 | 根据行程中推荐的酒店，预订指定日期       | P1     |
| 景点门票 | 根据行程中的景点，预订门票               | P1     |
| 订单管理 | 查看所有预订订单，支持取消               | P2     |

> 注：预订功能初期可跳转第三方平台（携程/飞猪），后续考虑自建或 API 对接。

### 2.5 景点库

| 功能     | 描述                                                   | 优先级 |
| -------- | ------------------------------------------------------ | ------ |
| 景点数据 | 名称、城市、类型、简介、门票、开放时间、建议时长、图片 | P0     |
| 数据来源 | 初期手动构建种子数据，后续可爬取或接入第三方 API       | P0     |
| 管理后台 | 景点 CRUD（管理员操作）                                | P1     |

### 2.6 评价系统

| 功能     | 描述                                     | 优先级 |
| -------- | ---------------------------------------- | ------ |
| 景点评价 | 用户对已游览景点打分（1-5 星）+ 文字评论 | P2     |
| 行程评价 | 对 AI 生成的行程质量打分                 | P2     |
| 评价展示 | 景点详情页展示用户评价聚合               | P2     |

---

## 3. 非功能需求

| 需求     | 说明                                                |
| -------- | --------------------------------------------------- |
| 响应时间 | 行程生成接口 < 30s（含 LLM 调用），普通接口 < 500ms |
| 并发支持 | 初期支持 100 并发用户                               |
| 安全性   | API Key 服务端存储，用户密码加密，接口鉴权          |
| 可用性   | 99.5% uptime                                        |
| 可扩展性 | 预留天气 API、地图 API、第三方预订 API 接入接口     |
| 移动适配 | Web 端响应式布局，移动端友好                        |

---

## 4. 技术方案

### 4.1 技术选型

| 层级     | 技术                            | 说明                         |
| -------- | ------------------------------- | ---------------------------- |
| 前端     | React + Next.js                 | SSR 提升首屏速度，App Router |
| UI 框架  | Tailwind CSS + shadcn/ui        | 快速构建现代 UI              |
| 状态管理 | Zustand / React Context         | 轻量级状态管理               |
| 后端     | Python FastAPI                  | 高性能异步框架，生态丰富     |
| ORM      | SQLAlchemy + Alembic            | 数据库迁移管理               |
| 数据库   | Supabase (PostgreSQL)           | 提供数据库 + Auth + Storage  |
| 认证     | Supabase Auth                   | 开箱即用的用户认证           |
| AI 服务  | Deepseek API                    | 行程生成、对话、推荐         |
| 部署     | Vercel (前端) + 云服务器 (后端) | —                            |

### 4.2 系统架构

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js    │────▶│  FastAPI     │────▶│  Supabase   │
│  (前端)     │◀────│  (后端 API)  │◀────│  (PG + Auth)│
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Deepseek    │
                    │  API         │
                    └──────────────┘
```

### 4.3 API 设计概要

```
POST   /api/auth/register          # 注册
POST   /api/auth/login             # 登录

POST   /api/trips                  # 创建行程（表单提交 → AI 生成）
GET    /api/trips                  # 行程列表
GET    /api/trips/:id              # 行程详情
DELETE /api/trips/:id              # 删除行程
POST   /api/trips/:id/copy         # 复制行程

POST   /api/trips/:id/chat         # 多轮对话调整（SSE 流式返回）

GET    /api/attractions            # 景点列表/搜索
GET    /api/attractions/:id        # 景点详情

POST   /api/orders                 # 创建预订订单
GET    /api/orders                 # 订单列表

POST   /api/reviews                # 提交评价
GET    /api/reviews                # 评价列表

# 预留接口（后续接入）
GET    /api/weather?city=&date=    # 天气查询
GET    /api/routes?from=&to=       # 地图路线
GET    /api/flights?from=&to=&date= # 航班查询
GET    /api/hotels?city=&date=     # 酒店查询
```

---

## 5. 数据模型

### 5.1 ER 概要

```
users (用户)
  ├── trips (行程)
  │     ├── trip_days (每日行程)
  │     │     ├── day_attractions (景点安排)
  │     │     ├── day_meals (餐饮安排)
  │     │     ├── day_transport (交通)
  │     │     └── day_hotels (住宿)
  │     └── trip_versions (版本历史)
  ├── orders (订单)
  │     ├── flights / hotels / tickets
  └── reviews (评价)

attractions (景点库)
cities (城市)
```

### 5.2 核心表结构

```sql
-- 用户表 (由 Supabase Auth 管理，扩展 profile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  nickname TEXT,
  avatar_url TEXT,
  default_city TEXT,
  preferences JSONB DEFAULT ''{}''::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 行程表
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_adults INT DEFAULT 1,
  num_children INT DEFAULT 0,
  budget_level TEXT CHECK (budget_level IN (''economy'', ''comfort'', ''luxury'')),
  preferences JSONB DEFAULT ''{}''::jsonb,
  status TEXT DEFAULT ''draft'',  -- draft, generated, booked, completed
  full_content JSONB,             -- AI 生成的完整行程 JSON
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 景点库
CREATE TABLE attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT,
  description TEXT,
  ticket_price DECIMAL,
  opening_hours TEXT,
  suggested_duration INT,  -- 分钟
  image_url TEXT,
  rating_avg DECIMAL(2,1) DEFAULT 0.0
);

-- 评价表
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  attraction_id UUID REFERENCES attractions(id),
  trip_id UUID REFERENCES trips(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. 页面结构

| 路由               | 页面     | 说明                |
| ------------------ | -------- | ------------------- |
| `/`                | 首页     | 产品介绍 + CTA      |
| `/login`           | 登录     | —                   |
| `/register`        | 注册     | —                   |
| `/dashboard`       | 工作台   | 行程列表总览        |
| `/trips/new`       | 新建行程 | 结构化表单          |
| `/trips/:id`       | 行程详情 | 日程展示 + 对话面板 |
| `/trips/:id/chat`  | 对话调整 | 多轮对话界面        |
| `/attractions/:id` | 景点详情 | 含评价列表          |
| `/orders`          | 我的订单 | —                   |
| `/settings`        | 个人设置 | —                   |

---

## 7. 开发计划（建议分期）

### Phase 1 — MVP（核心闭环）

- 用户注册/登录
- 结构化表单 → AI 行程生成（Deepseek）
- 每日行程展示
- 行程列表 + 详情
- 景点库（种子数据）
- 基础多轮对话

### Phase 2 — 体验增强

- 多轮对话优化（上下文管理 + 版本回退）
- 行程复制/编辑
- 预订功能（跳转第三方）
- 地图 + 天气预留接口

### Phase 3 — 生态完善

- 评价系统
- 行程导出（PDF/图片）
- 行程分享
- 管理后台
- 移动端适配优化

---

## 8. 风险与依赖

| 风险                               | 影响           | 缓解措施                   |
| ---------------------------------- | -------------- | -------------------------- |
| Deepseek API 不稳定                | 行程生成失败   | 重试机制 + 降级提示        |
| 景点数据不足                       | 生成质量低     | 人工构建种子数据，逐步扩充 |
| 预订接口依赖第三方                 | 预订体验不可控 | 初期跳转方式，后续自建     |
| 国内机票/酒店实时价格 API 获取困难 | 预订功能受限   | 优先做跳转方案             |
