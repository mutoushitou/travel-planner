# 前端页面 — 最小可执行任务

> 贯穿 Phase 1-3 | 关联 PRD §6

## PAGE-01 全局布局

- [ ] 创建 `src/app/layout.tsx` Root Layout
- [ ] 引入全局字体（如 Inter / Noto Sans SC）
- [ ] 引入 `globals.css` + Tailwind 指令
- [ ] 包裹 AuthProvider
- [ ] 包裹 React Query Provider
- [ ] 添加全局 Toast 容器

## PAGE-02 导航栏

- [ ] 创建 `src/components/layout/Header.tsx`
- [ ] Logo + 品牌名（链接到首页）
- [ ] 导航链接：首页 / 景点 / 工作台（登录后显示）
- [ ] 右侧用户区域（参见 USER-08）
- [ ] 移动端汉堡菜单

## PAGE-03 页脚

- [ ] 创建 `src/components/layout/Footer.tsx`
- [ ] 版权信息
- [ ] 基础链接

## PAGE-04 首页 `/`

- [ ] 创建 `src/app/page.tsx`
- [ ] Hero 区域：标题 + 副标题 + 醒目的 CTA 按钮
- [ ] 功能亮点区域（3-4 个卡片：智能生成、灵活调整、一体预订、历史沉淀）
- [ ] 精选目的地展示（热门城市卡片，点击跳转景点列表）
- [ ] SEO 优化：metadata（title、description）

## PAGE-05 通用 UI 组件

- [ ] 创建 `src/components/ui/Button.tsx`（primary / secondary / outline / ghost + loading）
- [ ] 创建 `src/components/ui/Input.tsx` + `TextArea.tsx`
- [ ] 创建 `src/components/ui/Card.tsx`
- [ ] 创建 `src/components/ui/Modal.tsx`（确认弹窗、表单弹窗）
- [ ] 创建 `src/components/ui/Toast.tsx`（成功/错误/信息提示）
- [ ] 创建 `src/components/ui/Loading.tsx`（Spinner + 骨架屏）
- [ ] 创建 `src/components/ui/Badge.tsx`（状态标签）
- [ ] 创建 `src/components/ui/EmptyState.tsx`（空数据占位）

## PAGE-06 表单通用组件

- [ ] 创建 `src/components/ui/DateRangePicker.tsx`
- [ ] 创建 `src/components/ui/CitySelect.tsx`（级联选择）
- [ ] 创建 `src/components/ui/TagSelect.tsx`（多选标签组）
- [ ] 创建 `src/components/ui/StarRating.tsx`（星级评分组件）
- [ ] 创建 `src/components/ui/Pagination.tsx`

## PAGE-07 Markdown 渲染

- [ ] 安装 `react-markdown` + `remark-gfm`
- [ ] 创建 `src/components/ui/MarkdownRenderer.tsx`
- [ ] 支持渲染 AI 返回的行程内容
- [ ] 支持渲染对话消息中的 Markdown

## PAGE-08 404 / 错误页面

- [ ] 创建 `src/app/not-found.tsx` 自定义 404 页面
- [ ] 创建 `src/app/error.tsx` 全局错误边界

## PAGE-09 Loading 页面

- [ ] 创建 `src/app/loading.tsx` 全局 Loading 状态
- [ ] 为关键路由创建各自的 `loading.tsx`
