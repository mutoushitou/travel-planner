# 行程管理 — 最小可执行任务

> Phase 1 / MVP | 关联 PRD §2.3

## MGMT-01 数据库查询层

- [ ] 创建 src/lib/supabase/queries/trips.ts
- [ ] 实现 getTripsByUser(userId) 按时间倒序获取行程列表
- [ ] 实现 getTripById(tripId) 获取行程完整详情（含所有关联子表 JOIN）
- [ ] 实现 deleteTrip(tripId) 软删除（is_deleted = true）
- [ ] 实现 getTripVersions(tripId) 获取版本历史
- [ ] 实现
      estoreTripVersion(tripId, versionNumber) 回退到指定版本

## MGMT-02 行程列表页 /dashboard

- [ ] 创建 src/app/dashboard/page.tsx 页面
- [ ] 创建 TripCard 组件（卡片式展示：目的地、日期、天数、状态标签）
- [ ] 按时间倒序排列
- [ ] 搜索功能（按目的地名称/标题搜索）
- [ ] 筛选功能（按状态筛选：draft/generated/booked/completed）
- [ ] 空状态提示（无行程时引导创建）
- [ ] "新建行程"按钮 → 跳转 /trips/new

## MGMT-03 行程详情页 /trips/:id

- [ ] 创建 src/app/trips/[id]/page.tsx 页面
- [ ] 顶部：行程标题 + 目的地 + 日期范围 + 人数 + 预算等级
- [ ] 时间轴组件：按天展示每日行程（景点、餐饮、交通、住宿）
- [ ] 景点展示：顺序编号 + 名称 + 简介 + 建议时长 + 门票价格
- [ ] 餐饮展示：早/中/晚各时段推荐
- [ ] 交通展示：城市间 + 市内交通
- [ ] 住宿展示：推荐酒店
- [ ] 预算汇总卡片（按交通/住宿/餐饮/门票/其他 分类）
- [ ] 右侧/底部 对话面板 ChatPanel

## MGMT-04 行程删除

- [ ] 在行程列表页添加删除按钮（每个卡片）
- [ ] 删除确认弹窗（"确定删除此行程？可恢复"）
- [ ] 调用 deleteTrip() 软删除
- [ ] 删除后从列表移除 + Toast 提示

## MGMT-05 行程操作菜单

- [ ] 在行程详情页添加操作按钮组
- [ ] 复制行程按钮 → 调用 Edge Function rips-copy
- [ ] 删除行程按钮
- [ ] （Phase 2）导出 PDF 按钮
- [ ] （Phase 2）分享链接按钮

## MGMT-06 Edge Function: rips-copy

- [ ] 创建 supabase/functions/trips-copy/index.ts
- [ ] 接收 trip_id → 深拷贝所有关联数据 → 创建新 trip
- [ ] 新 trip 状态设为 'draft'，标题添加 "(副本)" 后缀
- [ ] 返回新 trip_id

## MGMT-07 版本历史与回退

- [ ] 在行程详情页添加"版本历史"入口
- [ ] 创建 VersionHistory 组件（侧面板/弹窗）
- [ ] 按时间倒序列出所有版本
- [ ] 点击某版本可预览该版本行程
- [ ] 回退按钮 → 调用
      estoreTripVersion() → 刷新页面
