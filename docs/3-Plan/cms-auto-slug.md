# CMS Slug 自动生成补充计划

日期：2026-10-07。来源：用户明确确认的实施计划；关联 FR-12、FR-24 与 M5-04，不重开已完成 Sprint。

## 目标与接口

- 新闻/案例编辑器移除 Slug 输入、必填检查、dirty 状态与提交字段；新建显示“链接将在保存草稿后自动生成”，已保存页面只读展示路径。
- service 层请求输入 slug 可选；domain 与数据库 ContentDraftFields.slug 仍必填。POST 省略时使用 randomBytes(8).toString("hex")，前缀 news-/case-。只有 undefined 触发自动行为，显式 null/空串按原校验拒绝。
- 自动创建发生 duplicate_slug 时在 repository 回滚后重新生成，最多 3 次完整尝试；非重复错误及旧调用显式 slug 不重试。失败不产生成功 revision/audit。
- PUT 省略时在 repository.mutate 的 plan 回调内使用 item.slug，避免事务外读取和并发覆盖。expectedVersion、显式 slug 校验、首次发布冻结规则继续生效。
- 不迁移 schema/历史数据，不改变响应 slug、公开路由、SSR/SEO/purge 契约；不新增依赖或部署。

## 实施与验收

文档与 review-confirm → service/编辑器 → 行为测试与数据库集成测试 → pnpm test、pnpm lint、pnpm build → 独立 local-test SQLite 浏览器生命周期及四视口 → 记录证据。

覆盖中文/同名标题新闻与案例、自动冲突重试上限与回滚、非重复错误不重试、显式非法/旧 slug、无 slug 预览/保存、标题修改/重开/发布/下线/重发保持链接、版本冲突与首次发布不可变。MySQL repository 事务回滚原测试与 SQLite 真实事务均验证。320/390/768/1440px 检查路径折行、控件与页面溢出。

验收区分自动测试、本地浏览器/SQLite 与真实云。生产 FC/RDS/OSS/ESA 本次不部署，未验证事项如实记录。

## 交付结果

2026-10-07 已完成上述实现与本地验收。记录见 `docs/5-Evidence/cms-auto-slug/README.md`；真实云与生产发布未纳入本次。
