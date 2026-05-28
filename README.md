# 🧳 智能旅游规划平台 (Travel Planner)

AI 驱动的个性化旅游行程生成平台。输入出行需求，一键生成完整每日行程，支持多轮对话优化，机票/酒店/门票一站式预订。

## ✨ 核心功能

- **🤖 智能行程生成** — 填写目的地、日期、预算、偏好，AI（Deepseek）自动生成高质量每日行程
- **💬 多轮对话调整** — 对行程不满意？通过 SSE 流式对话随时微调，支持版本回退
- **🛒 一站式预订** — 行程中的机票、酒店、景点门票可直接跳转预订
- **📚 历史归档** — 所有行程自动保存，可随时查看、复制、复用
- **🏙️ 景点浏览** — 按城市浏览热门景点，查看详情与用户评价
- **👤 用户系统** — 邮箱注册/登录，个人偏好设置

## 🛠️ 技术栈

| 层次 | 技术 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 后端服务 | Supabase（Auth / PostgreSQL / Edge Functions / Storage） |
| AI 服务 | Deepseek API（chat/completions） |
| 实时通信 | SSE (Server-Sent Events) |
| 状态管理 | TanStack React Query v5 |
| 表单 | React Hook Form + Zod |
| 测试 | Vitest + Testing Library |
| 代码规范 | ESLint + Prettier |

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 首页
│   ├── trips/              # 行程相关页面（新建/详情/列表）
│   ├── attractions/        # 景点浏览与详情
│   ├── orders/             # 订单管理
│   ├── login/              # 登录
│   ├── register/           # 注册
│   └── settings/           # 个人设置
├── components/             # UI 组件
│   ├── attraction/         # 景点相关组件
│   ├── auth/               # 认证相关组件
│   ├── booking/            # 预订相关组件
│   ├── layout/             # Header / Footer 等布局组件
│   ├── review/             # 评价组件
│   ├── trip/               # 行程相关组件
│   └── ui/                 # 通用 UI 组件
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具库
│   ├── ai/                 # Deepseek 客户端 & 行程生成/对话逻辑
│   ├── supabase/           # Supabase 客户端与 SSR 工具
│   ├── utils/              # 通用工具函数
│   └── validations/        # Zod 校验 Schema
├── types/                  # TypeScript 类型定义
└── test/                   # 测试配置与 Mock
supabase/
├── migrations/             # 数据库迁移脚本
├── functions/              # Supabase Edge Functions
│   ├── trips-generate/     # AI 行程生成
│   ├── trips-chat/         # AI 多轮对话 (SSE)
│   ├── trips-copy/         # 行程复制
│   ├── orders-create/      # 订单创建
│   └── reviews-submit/     # 评价提交
└── seed.sql                # 种子数据
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 1. 克隆项目
git clone <repo-url>
cd travel-planner

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local  # 或直接编辑 .env.local
```

`.env.local` 需配置以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=<你的 Supabase 项目 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 Supabase Anon Key>
SUPABASE_SERVICE_ROLE_KEY=<你的 Supabase Service Role Key>
DEEPSEEK_API_KEY=<你的 Deepseek API Key>
```

```bash
# 4. 初始化数据库（在 Supabase 项目中运行迁移）
supabase db push          # 需要 Supabase CLI
# 或手动在 Supabase SQL Editor 中执行 supabase/migrations/00001_schema.sql

# 5. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 📦 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 代码检查 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run test` | 运行测试 |
| `npm run test:coverage` | 测试覆盖率报告 |
| `npm run format` | Prettier 格式化代码 |

## 📖 相关文档

- [产品需求文档 (PRD)](./doc/proposal.md)
- [概要设计文档](./doc/high-level-design.md)
- [AI Prompt 设计](./doc/prompt.md)

## 🏗️ 架构概览

```
┌────────────────────────────────────────┐
│        Next.js 客户端 (浏览器)           │
│  首页 / 行程 / 景点 / 订单 / 设置        │
└──────────┬─────────────────────────────┘
           │ Supabase Client (直连)
           ▼
┌────────────────────────────────────────┐
│             Supabase 平台               │
│  Auth · PostgreSQL · Storage · Edge Fn │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────┐
│   Deepseek API   │
│  行程生成 / 优化   │
└──────────────────┘
```

## 📝 路线图

- [ ] 微信/手机号登录
- [ ] 行程分享功能
- [ ] 行程导出 PDF
- [ ] 多语言支持
- [ ] PWA 离线访问
