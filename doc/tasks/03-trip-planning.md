# 行程规划（AI 核心）— 最小可执行任务

> Phase 1 / MVP | 关联 PRD §2.2

## PLAN-01 数据库表

- [ ] 编写 rips 表 SQL（含 status 字段: draft → generating → generated → booked → completed）
- [ ] 编写 rip_days 表 SQL（day_number, date, trip_id）
- [ ] 编写 day_attractions 表 SQL（order_index, attraction_id, duration, notes）
- [ ] 编写 day_meals 表 SQL（meal_type: breakfast/lunch/dinner, restaurant_name, cuisine, price）
- [ ] 编写 day_transport 表 SQL（type: flight/train/car/bus/subway, from, to, detail）
- [ ] 编写 day_hotels 表 SQL（hotel_name, star_rating, price_range, notes）
- [ ] 编写 rip_versions 表 SQL（trip_id, version_number, full_content JSONB, created_at）
- [ ] 配置所有表的 RLS 策略（仅 owner 可操作）
- [ ] 在 Supabase Dashboard 执行

## PLAN-02 TypeScript 类型

- [ ] 定义 Trip / TripDay / DayAttraction / DayMeal / DayTransport / DayHotel / TripVersion 类型
- [ ] 定义 TripFormData 表单输入类型
- [ ] 定义 TripGenerateRequest / TripGenerateResponse API 类型
- [ ] 定义 ChatMessage 对话消息类型
- [ ] 定义 BudgetLevel 枚举（economy / comfort / luxury）

## PLAN-03 行程创建表单页 /trips/new

- [ ] 创建 src/app/trips/new/page.tsx 页面
- [ ] 创建 TripForm 表单组件（所有必填/选填字段）
- [ ] 目的地选择：城市级联选择器组件
- [ ] 出发地选择：默认取用户常驻城市
- [ ] 出行日期：日期范围选择器（开始/结束）
- [ ] 人数选择：成人 + 儿童数字输入
- [ ] 预算范围：经济/舒适/豪华 三档 Radio
- [ ] 兴趣偏好：多选标签（自然风光、历史文化、美食、购物、亲子、户外探险）
- [ ] 住宿偏好：单选
- [ ] 交通偏好：多选
- [ ] 特殊需求：自由文本输入
- [ ] React Hook Form + Zod 完整验证
- [ ] 提交后调用 Edge Function rips-generate

## PLAN-04 Deepseek API 集成层

- [ ] 创建 src/lib/ai/deepseek-client.ts 封装 Deepseek API 调用
- [ ] 实现非流式调用函数 generateTripPlan()
- [ ] 实现流式调用函数 chatStream()
- [ ] 配置 API Key 从环境变量读取
- [ ] 错误处理：重试 2 次 + 超时处理

## PLAN-05 Prompt 模板

- [ ] 创建 src/lib/ai/prompts/trip-generation.ts 行程生成 System Prompt
- [ ] 创建 src/lib/ai/prompts/trip-chat.ts 多轮对话 System Prompt
- [ ] Prompt 中包含输出格式约束（严格 JSON schema）
- [ ] Prompt 中包含景点库数据注入点位

## PLAN-06 Edge Function: rips-generate

- [ ] 创建 supabase/functions/trips-generate/index.ts
- [ ] 接收表单数据 → 查询匹配景点 → 拼接 Prompt → 调用 Deepseek
- [ ] 解析 AI 返回的 JSON → 写入 trips + trip_days + 子表
- [ ] 更新 trip.status = 'generated'
- [ ] 保存初始版本到 trip_versions
- [ ] 返回 trip_id 给前端
- [ ] 错误处理：超时/失败时 status = 'draft'，提示用户重试

## PLAN-07 行程生成 Loading 状态

- [ ] 创建行程生成等待页面/组件（Loading 动画 + 文案）
- [ ] 前端提交后跳转到 /trips/[id]?status=generating
- [ ] 轮询 trip 状态直到 status 变为 'generated'
- [ ] 超时处理（如 2 分钟后仍 generating → 提示失败）

## PLAN-08 Edge Function: rips-chat

- [ ] 创建 supabase/functions/trips-chat/index.ts
- [ ] 接收 trip_id + user_message → 获取当前行程 JSON + 历史对话
- [ ] 拼接 Prompt → 调用 Deepseek（stream: true）
- [ ] 通过 ReadableStream 转发为 SSE 格式
- [ ] 收到完整响应后：更新 trips JSONB + 创建新 trip_version
- [ ] 设置 SSE headers（Content-Type: text/event-stream）

## PLAN-09 多轮对话 UI

- [ ] 创建 src/components/trip/ChatPanel.tsx
- [ ] 聊天界面：消息列表（用户消息右对齐、AI 消息左对齐、流式逐字显示）
- [ ] 底部输入框 + 发送按钮
- [ ] 使用 etch + ReadableStream 接收 SSE 流
- [ ] 消息渲染支持 Markdown
- [ ] 新消息到达时自动滚动到底部
- [ ] 显示连接中断提示 + 重连按钮
