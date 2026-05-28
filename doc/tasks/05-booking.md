# 预订系统 — 最小可执行任务

> Phase 1 / MVP（建表 + 基础结构） | Phase 2 实现功能 | 关联 PRD §2.4

## BOOK-01 数据库表（Phase 1）

- [ ] 编写 orders 表 SQL（id, user_id, trip_id, order_type, status, total_price, paid_at, detail JSONB）
- [ ] order_type 枚举：flight / hotel / ticket
- [ ] status 枚举：pending / confirmed / cancelled / completed
- [ ] detail JSONB 存储预订详情（航班号、酒店名、门票信息等）
- [ ] 配置 RLS：仅 owner 可操作
- [ ] 在 Supabase Dashboard 执行

## BOOK-02 TypeScript 类型

- [ ] 定义 Order 类型（src/types/order.ts）
- [ ] 定义 OrderType / OrderStatus 枚举
- [ ] 定义 FlightDetail / HotelDetail / TicketDetail 详情类型

## BOOK-03 Edge Function: orders-create（Phase 2）

- [ ] 创建 supabase/functions/orders-create/index.ts
- [ ] 接收 trip_id + order_type + detail
- [ ] 创建订单记录（status: pending）
- [ ] 返回订单详情 + 第三方预订跳转 URL
- [ ] 如果是机票/酒店/门票，分别生成对应的跳转链接（携程/飞猪）

## BOOK-04 预订触发入口（Phase 2）

- [ ] 在行程详情页的机票信息旁添加"预订"按钮
- [ ] 在行程详情页的酒店信息旁添加"预订"按钮
- [ ] 在行程详情页的景点信息旁添加"购票"按钮
- [ ] 点击后调用 orders-create → 新窗口打开第三方预订链接

## BOOK-05 订单列表页 /orders（Phase 2）

- [ ] 创建 src/app/orders/page.tsx 页面
- [ ] 创建 OrderCard 组件
- [ ] 按时间倒序列出所有订单
- [ ] 显示订单类型图标 + 详情摘要 + 状态标签
- [ ] 取消按钮（仅 pending 状态）
- [ ] 空状态提示

## BOOK-06 订单管理（Phase 2）

- [ ] 创建 src/lib/supabase/queries/orders.ts
- [ ] 实现 getOrdersByUser(userId) 查询
- [ ] 实现 cancelOrder(orderId) 更新状态为 cancelled
