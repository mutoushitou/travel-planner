# 评价系统 — 最小可执行任务

> Phase 3 | 关联 PRD §2.6

## REVIEW-01 数据库表

- [ ] 编写
      eviews 表 SQL（id, user_id, attraction_id, trip_id, rating, content, created_at）
- [ ] ating CHECK 约束 1-5
- [ ] 配置 RLS：SELECT 公开，INSERT/UPDATE/DELETE 仅 owner
- [ ] 在 Supabase Dashboard 执行

## REVIEW-02 TypeScript 类型

- [ ] 定义 Review 类型（src/types/review.ts）
- [ ] 定义 CreateReviewInput 输入类型

## REVIEW-03 Edge Function:

eviews-submit

- [ ] 创建 supabase/functions/reviews-submit/index.ts
- [ ] 接收 attraction_id + trip_id + rating + content
- [ ] 校验用户是否已完成该行程
- [ ] 写入 reviews 表
- [ ] 触发 attractions 表的 rating_avg 重新计算
- [ ] 防重复评价（同一用户对同一景点只允许一次评价）

## REVIEW-04 查询层

- [ ] 创建 src/lib/supabase/queries/reviews.ts
- [ ] 实现 getReviewsByAttraction(attractionId, page, limit) 分页查询
- [ ] 实现 getReviewsByUser(userId) 查询用户的所有评价
- [ ] 实现 getAverageRating(attractionId) 从 attractions 表直接取 rating_avg

## REVIEW-05 评价表单组件

- [ ] 创建 src/components/review/ReviewForm.tsx
- [ ] 星级评分组件（1-5 星可点击）
- [ ] 评价内容 TextArea
- [ ] 提交调用
      eviews-submit Edge Function
- [ ] 提交后刷新评价列表 + Toast

## REVIEW-06 评价列表组件

- [ ] 创建 src/components/review/ReviewList.tsx
- [ ] 按时间倒序列出评价
- [ ] 每条评价：用户头像 + 昵称 + 星级 + 日期 + 内容
- [ ] 分页加载
- [ ] 嵌入景点详情页底部

## REVIEW-07 景点详情页集成

- [ ] 在 /attractions/:id 页面底部嵌入评价列表
- [ ] 显示平均评分（星级 + 数字）
- [ ] 显示评价总数
- [ ] 已登录用户可见评价表单
