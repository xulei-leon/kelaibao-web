# Sprint M5-03 客来宝官网 V3.3 内容与媒体套餐

## 状态

- 需求：FR-23
- 文档门禁：产品负责人明确跳过（2026-09-14）
- 实现状态：完成 / Local Code Ready
- 发布状态：不得因本 Sprint 自动解除其他 Production blocker

## Goal

在不改变客来宝单应用、咨询转化和阿里云全栈边界的前提下，完整交付 V3.3 公开内容、独立媒体套餐页、发现契约和可到期的宣传口径证据。

## Architecture

- 继续使用 Next.js App Router 静态页面、`PageHero`、`Section`、二维码组件和统一站点外壳。
- 固定页面内容继续由代码维护；不进入 CMS。
- 新路由 `/media/packages` 是 `/media` 下的普通公开页面，不是第二产品、第二应用或支付页面。
- `PUBLIC_ROUTES` 继续作为 metadata、sitemap、`llms.txt` 和静态结构化数据的共享来源。
- V3.3 DOCX 归档为不可变证据，claims register 通过既有 release validator 执行 90 天有效期。

## Work Packages

### WP0 文档与证据门禁

1. 归档原始 DOCX 并记录哈希、页数、修改人和修改时间。
2. 记录产品负责人明确跳过文档与代码 review-confirm 的工作流覆盖。
3. 直接按 V3.3 定稿实施代码与测试。
4. 更新 SRS、内容布局规范、视觉规范、FR/Sprint 索引，明确 V3.3 覆盖旧文案和咨询型价格展示禁令。

### WP1 外壳与发现

1. 更新六项导航标签和页脚团队链接。
2. 为 route metadata 增加可选 keywords，并写入 V3.3 首页 SEO 内容。
3. 新增 `/media/packages` 路由契约；更新 `/team` metadata。
4. 验证 sitemap、`llms.txt`、canonical、Open Graph 和 WebPage JSON-LD。

### WP2 首页与核心工具

1. 按 V3.3 更新首页 Hero、右侧四行文案、四类工具、轻社交、展业效率、媒体和最终 CTA。
2. 四类工具改为内容、展示、效率、团队，删除十项工具列表；保留四张现有视觉素材，统一链接 `/features`。
3. `/features` 删除 `FEATURES` 长列表和十张功能图渲染，保留五阶段路径。
4. 新增小程序二维码、九项会员权益语义表和页面收尾。
5. 清理只服务于已删除结构的常量、imports 和 CSS；不删除仍可能复用的静态素材文件。

### WP3 团队、媒体与关于

1. `/team` 仅更新 Banner 文案和 CTA，保留其余 DOM、锚点和行为。
2. `/media` 替换 Hero 和价值区，删除指定两区块，增加套餐入口并更新 CTA。
3. 新增 `/media/packages` 四套套餐数据与响应式卡片/定义列表；标准价与会员价同时可读，企业微信为唯一 CTA。
4. `/about` 更新 Hero、公司介绍、三项指标和文化文案，保留其他模块。

### WP4 Claims 与发布

1. 现有 V3.3 相关 claims 转为 `approved`，新增四个套餐价格记录和一个 50% 补贴记录。
2. 每条记录使用归档 DOCX、2026-09-14 as-of、徐磊双角色、90 天 max age 和 2026-12-13 expiry。
3. 更新 claims validator 固定期测试与 release validator 证据预期；不弱化其他外部门禁。
4. 更新 Production blocker 报告，区分“本次内容授权解除”和“仍未解除的运行/备案/二维码门禁”。

### WP5 验证与评审

1. 先更新 SSR、路由、metadata、claims 测试并确认旧实现失败，再实施页面与配置。
2. 运行 `pnpm test && pnpm lint && pnpm build`。
3. 启动本地站点，检查六条目标路由在 320、390、768、1440px 的内容、换行、表格、二维码、导航、键盘和横向溢出。
4. 保存必要的视觉验证记录，不把本地截图冒充正式素材。
5. 不执行代码 review；保留全量验证和差异检查。

## Test Matrix

- Header/Footer：六项标签、精确 href、移动菜单和当前页状态。
- Home：V3.3 顺序、四类工具、保留五痛点/四媒体块、旧文案缺失、安全承诺。
- Features：五阶段、二维码、九项权益、收尾、十项长介绍缺失。
- Team：只变 Banner，原有团队锚点和后续内容仍存在。
- Media：保留/替换/删除区块准确，套餐入口和最终 CTA 正确。
- Packages：四套方案、全部价格、50% 补贴、咨询 CTA、无 checkout/payment/account/API。
- About：新介绍、指标、文化；安全、实景、新闻和联系模块仍存在。
- Discovery：公开路由、metadata、keywords、canonical、Open Graph、JSON-LD、sitemap、`llms.txt`。
- Claims：字段完整、source hash 可追溯、授权通过、2026-12-13 后过期失败。

## Done Definition

- 产品负责人跳过 review-confirm 的覆盖已记录。
- 代码、测试、规范和证据一致，无未解释的 V3.3 差异。
- 全量测试、类型检查、构建和六路由四视口验证通过。
- `git diff --check` 通过，且未引入范围外能力。

## 验证结果（2026-09-14）

- `pnpm test`：PASS，68 个文件、378 项测试通过。
- `pnpm lint`：PASS，`tsc --noEmit` 通过。
- `pnpm build`：PASS，Next.js 生产构建及 standalone 打包完成，`/media/packages` 静态生成。
- Browser：六条目标路由在 320、390、768、1440px 共 24 组检查均无页面横向溢出、破损图片或 H1 缺失；`/features` 九行权益和 `/media/packages` 四套套餐均完整。
- 键盘：320px 移动导航可打开，Escape 关闭后焦点恢复到菜单按钮；控制台无相关 error/warn。
- release：默认校验为 `localReady=true`、`productionReady=false`、18 项既有 Production blocker；`--require-production-live` 按预期退出 1。
- `git diff --check`：PASS。
