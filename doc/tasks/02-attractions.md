# 景点库 — 最小可执行任务

> Phase 1 / MVP | 关联 PRD §2.5

## ATTR-01 数据库建表

- [ ] 编写 cities 表 SQL（id, name, province, slug）
- [ ] 编写 ttractions 表 SQL（id, name, city_id, category, description, ticket_price, opening_hours, suggested_duration, image_url, rating_avg）
- [ ] 配置 RLS：cities 公开读取
- [ ] 配置 RLS：ttractions 公开读取
- [ ] 在 Supabase Dashboard 执行

## ATTR-02 种子数据脚本

- [ ] 编写 supabase/seed.sql 种子数据文件
- [ ] 录入 10+ 热门旅游城市数据（北京、上海、成都、西安、杭州、重庆、昆明、厦门、广州、三亚等）
- [ ] 每个城市录入 20+ 景点数据（名称、类型、简介、门票、开放时间、建议时长）
- [ ] 景点类型覆盖：自然风光、历史文化、美食街区、购物、主题乐园、博物馆
- [ ] 执行种子数据脚本

## ATTR-03 TypeScript 类型定义

- [ ] 定义 City 类型（src/types/city.ts）
- [ ] 定义 Attraction 类型（src/types/attraction.ts）
- [ ] 定义 AttractionCategory 枚举类型

## ATTR-04 景点列表 API 层

- [ ] 创建 src/lib/supabase/queries/attractions.ts
- [ ] 实现 getAttractions({ city?, category?, search?, page?, limit? }) 查询函数（含分页）
- [ ] 实现 getAttractionById(id) 查询函数
- [ ] 实现 getCities() 查询函数
- [ ] 实现 searchAttractions(query) 全文搜索函数

## ATTR-05 自定义 Hooks

- [ ] 创建 src/hooks/useAttractions.ts
- [ ] 封装 useQuery 获取景点列表（支持 city / category / search 过滤）
- [ ] 封装 useQuery 获取单个景点详情
- [ ] 配置 staleTime 合理值（景点数据不常变）

## ATTR-06 景点列表组件

- [ ] 创建 src/components/attraction/AttractionList.tsx
- [ ] 卡片式布局展示景点（图片、名称、城市、评分、门票价格）
- [ ] 支持按城市筛选
- [ ] 支持按类别筛选
- [ ] 支持关键词搜索
- [ ] 分页/无限滚动加载更多

## ATTR-07 景点详情页 /attractions/:id

- [ ] 创建 src/app/attractions/[id]/page.tsx
- [ ] 展示景点完整信息（大图、名称、简介、门票、开放时间、建议时长）
- [ ] 展示景点所在城市的其他推荐景点（侧栏）
- [ ] SEO：动态 metadata（标题 + 描述）
- [ ] ISR / SSR 数据获取
