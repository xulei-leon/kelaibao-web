# 客来宝政策页友好化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将三个政策页及其全站入口改为更友好的名称，并把 `/disclaimer` 重组为“真实表达、清晰合作、尊重授权、重视长期价值”四项品牌承诺。

**Architecture:** 保持 `/privacy`、`/terms`、`/disclaimer` 路由、canonical、sitemap 与既有 `PolicyLayout` 不变；页面名称和正文继续由静态 React 页面维护。用聚焦的 SSR 内容契约测试锁定名称、入口、metadata 和品牌承诺，再以最小改动更新页面、共享页脚、表单入口及需求文档。

**Tech Stack:** Next.js 15 App Router、React 19、TypeScript 5.9、Vitest 3、Testing Library、pnpm 11。

## Global Constraints

- 客来宝是唯一主品牌，K-Link 是产品名，客来宝媒体是站内子业务。
- `/privacy` 显示名为“信息与隐私说明”，`/terms` 显示名为“合作服务说明”，`/disclaimer` 显示名为“合作与使用说明”。
- 三个 URL、canonical 和 sitemap 路径保持不变。
- `/privacy` 与 `/terms` 只修改名称、入口及必要 metadata，不改写政策正文和目录。
- `/disclaimer` 不再完整保留职业资质、机构审核、直销、保险、证券和效果边界清单。
- 不新增服务能力、结果承诺、价格、支付、账号或未经确认的商业事实。
- 所有第三方集成继续直接使用 HTTP(S) API；本任务不新增任何外部集成。
- 不修改 `/privacy`、`/terms`、`/disclaimer` 之外页面的业务正文；允许同步更新共享入口标签、页脚通用摘要和表单隐私入口。
- 完成后运行 `pnpm test && pnpm lint && pnpm build`。

---

## File Map

- `docs/1-Requirement/Mainland-Website-FR/FR-06-policy-privacy-and-claims-boundary.md`：把旧的完整行业免责要求更新为已批准的品牌承诺边界。
- `src/app/privacy/page.tsx`：只更新可见页面名称。
- `src/app/terms/page.tsx`：只更新可见页面名称。
- `src/app/disclaimer/page.tsx`：重写 lead、目录和正文为四项品牌承诺。
- `src/components/policy/policy-layout.tsx`：把共享联系操作改为“联系我们”，同步政策版本与更新时间。
- `src/components/site-footer.tsx`：更新三个政策入口名称。
- `src/components/boundary-note.tsx`：更新 `/disclaimer` 的内嵌入口名称。
- `src/components/contact/inquiry-form.tsx`：更新表单中的隐私说明入口名称。
- `src/lib/inquiry-validation.ts`：更新未同意隐私说明时的错误文本。
- `src/lib/route-metadata.ts`：更新三个政策页 metadata。
- `src/lib/site-content.ts`：把页脚硬性免责摘要改为正向合作原则。
- `tests/policy-page-copy.test.tsx`：新增政策页名称、入口、metadata 与品牌承诺的 SSR 契约。
- `tests/inquiry-form.test.tsx`：锁定表单隐私入口名称。
- `tests/inquiry-validation.test.ts`：锁定隐私同意错误文本。
- `tests/site-content.test.ts`：锁定新的页脚合作原则，保留职业页面自身边界断言。
- `tests/fixtures/m4-02-public-page-baseline.json`：更新三个政策页语义基线。

---

### Task 1: 对齐 FR-06 产品要求

**Files:**
- Modify: `docs/1-Requirement/Mainland-Website-FR/FR-06-policy-privacy-and-claims-boundary.md`

**Interfaces:**
- Consumes: 已批准设计 `docs/superpowers/specs/2026-08-02-kelaibao-cooperation-use-statement-design.md`。
- Produces: 后续页面实现和验收测试共同遵循的需求口径。

- [ ] **Step 1: 更新目标与需求描述**

将 FR-06 的目标改为：

```markdown
公开与实际服务和数据处理一致的政策页面，并以真实表达、清晰合作、尊重授权和合理成果预期建立统一、可读的合作边界。
```

将需求 3、6、7 改为：

```markdown
3. `/disclaimer` 对外名称为“合作与使用说明”，以真实表达、清晰合作、尊重授权和长期价值四项品牌承诺说明合作原则，不再按职业逐项罗列免责条款。
6. 客户信息、评价、Logo、资质或案例公开前必须具备可追溯的适当授权，并以正向合作承诺表达该要求。
7. 页面以合理预期说明成果会受到业务基础、投入程度、执行节奏、市场变化和平台环境等因素影响，不作确定结果承诺。
```

将输出与验收要点中的“全站统一简明声明”改为“全站统一的合作原则摘要”，并明确三个显示名及 URL 不变。

- [ ] **Step 2: 检查旧要求是否仍被 FR-06 保留**

Run:

```powershell
rg -n "职业资质、所属机构审核|保险/证券/投资内容|页面明确不保证好友" docs/1-Requirement/Mainland-Website-FR/FR-06-policy-privacy-and-claims-boundary.md
```

Expected: 无匹配。

- [ ] **Step 3: 检查新口径完整出现**

Run:

```powershell
rg -n "信息与隐私说明|合作服务说明|合作与使用说明|真实表达|清晰合作|尊重授权|长期价值" docs/1-Requirement/Mainland-Website-FR/FR-06-policy-privacy-and-claims-boundary.md
```

Expected: 三个页面名称和四项品牌承诺均有匹配。

- [ ] **Step 4: Commit**

```powershell
git add -- docs/1-Requirement/Mainland-Website-FR/FR-06-policy-privacy-and-claims-boundary.md
git commit -m "docs(kelaibao): align policy requirements with brand commitments"
```

---

### Task 2: 统一政策页名称与全站入口

**Files:**
- Create: `tests/policy-page-copy.test.tsx`
- Modify: `tests/inquiry-form.test.tsx`
- Modify: `tests/inquiry-validation.test.ts`
- Modify: `tests/fixtures/m4-02-public-page-baseline.json`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/components/policy/policy-layout.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/components/boundary-note.tsx`
- Modify: `src/components/contact/inquiry-form.tsx`
- Modify: `src/lib/inquiry-validation.ts`
- Modify: `src/lib/route-metadata.ts`

**Interfaces:**
- Consumes: 现有 `PolicyLayout({ title, lead, sections, children })` 接口和既有 URL。
- Produces: 三个统一显示名，以及 `/privacy`、`/terms`、`/disclaimer` 不变的入口契约。

- [ ] **Step 1: 写入失败的页面名称和入口契约**

创建 `tests/policy-page-copy.test.tsx`：

```tsx
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DisclaimerPage from "@/app/disclaimer/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { BoundaryNote } from "@/components/boundary-note";
import { SiteFooter } from "@/components/site-footer";
import { ROUTE_METADATA } from "@/lib/route-metadata";

describe("friendly policy page copy", () => {
  it.each([
    [PrivacyPage, "信息与隐私说明"],
    [TermsPage, "合作服务说明"],
    [DisclaimerPage, "合作与使用说明"],
  ])("renders the approved policy page name", (Page, title) => {
    const html = renderToStaticMarkup(createElement(Page));
    expect(html).toContain(`<h1>${title}</h1>`);
  });

  it("uses the approved names without changing policy URLs", () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    expect(footer).toContain('href="/privacy">信息与隐私说明</a>');
    expect(footer).toContain('href="/terms">合作服务说明</a>');
    expect(footer).toContain('href="/disclaimer">合作与使用说明</a>');

    const note = renderToStaticMarkup(
      <BoundaryNote>请在合作前确认相关信息。</BoundaryNote>,
    );
    expect(note).toContain('href="/disclaimer">查看合作与使用说明</a>');
  });

  it("uses matching metadata titles and unchanged canonicals", () => {
    expect(ROUTE_METADATA["/privacy"]).toEqual(expect.objectContaining({
      title: "信息与隐私说明｜客来宝",
      canonical: "/privacy",
    }));
    expect(ROUTE_METADATA["/terms"]).toEqual(expect.objectContaining({
      title: "合作服务说明｜客来宝",
      canonical: "/terms",
    }));
    expect(ROUTE_METADATA["/disclaimer"]).toEqual(expect.objectContaining({
      title: "合作与使用说明｜客来宝",
      canonical: "/disclaimer",
    }));
  });
});
```

在 `tests/inquiry-form.test.tsx` 添加：

```tsx
it("links to the friendly privacy notice name", () => {
  render(<InquiryForm />);
  expect(screen.getByRole("link", { name: "信息与隐私说明" }))
    .toHaveAttribute("href", "/privacy");
});
```

在 `tests/inquiry-validation.test.ts` 添加：

```ts
it("uses the friendly privacy notice name in consent errors", () => {
  const result = validateInquiry({ ...validInput, privacyConsent: false });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.privacyConsent).toBe("提交前请阅读并同意信息与隐私说明。");
});
```

- [ ] **Step 2: 运行测试并确认因旧名称失败**

Run:

```powershell
pnpm exec vitest run tests/policy-page-copy.test.tsx tests/inquiry-form.test.tsx tests/inquiry-validation.test.ts
```

Expected: FAIL；输出包含旧名称“隐私政策”“服务条款”“免责声明”或“普通联系入口”。

- [ ] **Step 3: 实现页面名称与入口名称**

进行以下精确替换：

```text
src/app/privacy/page.tsx:       title="信息与隐私说明"
src/app/terms/page.tsx:         title="合作服务说明"
src/components/site-footer.tsx: 信息与隐私说明 / 合作服务说明 / 合作与使用说明
src/components/boundary-note.tsx: 查看合作与使用说明
src/components/contact/inquiry-form.tsx: 信息与隐私说明
src/lib/inquiry-validation.ts: 提交前请阅读并同意信息与隐私说明。
src/components/policy/policy-layout.tsx: 普通联系入口 -> 联系我们
```

在 `src/components/policy/policy-layout.tsx` 同步政策版本：

```tsx
<span>版本：v0.3</span>
<span>更新：2026 年 8 月 2 日</span>
```

在 `src/lib/route-metadata.ts` 使用：

```ts
"/privacy": {
  title: "信息与隐私说明｜客来宝",
  description: "了解客来宝备用询盘表单收集的最小字段、处理目的、共享边界和待确认事项。",
  canonical: "/privacy",
},
"/terms": {
  title: "合作服务说明｜客来宝",
  description: "了解人工评估、定制范围、报价、站外合同与付款、第三方平台及客户责任。",
  canonical: "/terms",
},
"/disclaimer": {
  title: "合作与使用说明｜客来宝",
  description: "了解客来宝关于真实表达、清晰合作、尊重授权与长期价值的合作原则。",
  canonical: "/disclaimer",
},
```

- [ ] **Step 4: 更新语义基线中的三个 H1**

在 `tests/fixtures/m4-02-public-page-baseline.json` 精确修改：

```json
"/privacy": { "h1": "信息与隐私说明" }
"/terms": { "h1": "合作服务说明" }
"/disclaimer": { "h1": "合作与使用说明" }
```

保留每个对象的其他既有字段，Task 3 再更新 `/disclaimer` 的章节基线。

- [ ] **Step 5: 运行聚焦测试并确认通过**

Run:

```powershell
pnpm exec vitest run tests/policy-page-copy.test.tsx tests/inquiry-form.test.tsx tests/inquiry-validation.test.ts tests/visual-style-contract.test.tsx
```

Expected: PASS；`tests/visual-style-contract.test.tsx` 使用更新后的语义 fixture。

- [ ] **Step 6: Commit**

```powershell
git add -- tests/policy-page-copy.test.tsx tests/inquiry-form.test.tsx tests/inquiry-validation.test.ts tests/fixtures/m4-02-public-page-baseline.json src/app/privacy/page.tsx src/app/terms/page.tsx src/components/policy/policy-layout.tsx src/components/site-footer.tsx src/components/boundary-note.tsx src/components/contact/inquiry-form.tsx src/lib/inquiry-validation.ts src/lib/route-metadata.ts
git commit -m "feat(kelaibao): rename policy pages and shared entry labels"
```

---

### Task 3: 将 `/disclaimer` 重组为四项品牌承诺

**Files:**
- Modify: `tests/policy-page-copy.test.tsx`
- Modify: `tests/site-content.test.ts`
- Modify: `tests/fixtures/m4-02-public-page-baseline.json`
- Modify: `src/app/disclaimer/page.tsx`
- Modify: `src/lib/site-content.ts`

**Interfaces:**
- Consumes: Task 2 产生的“合作与使用说明”标题、metadata 和 `/disclaimer` URL。
- Produces: 四个稳定锚点 `authenticity`、`collaboration`、`authorization`、`long-term-value`，以及正向页脚合作原则。

- [ ] **Step 1: 扩展失败的品牌承诺契约**

在 `tests/policy-page-copy.test.tsx` 添加：

```tsx
it("presents four brand commitments instead of the old industry checklist", () => {
  const html = renderToStaticMarkup(<DisclaimerPage />);

  for (const heading of [
    "1. 真实表达",
    "2. 清晰合作",
    "3. 尊重授权",
    "4. 重视长期价值",
  ]) {
    expect(html).toContain(`<h2>${heading}</h2>`);
  }

  for (const id of [
    "authenticity",
    "collaboration",
    "authorization",
    "long-term-value",
  ]) {
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain(`href="#${id}"`);
  }

  expect(html).toContain("好的合作，从真实、清晰和彼此信任开始");
  expect(html).toContain('href="/contact"');
  expect(html).toContain("联系我们");

  expect(html).not.toMatch(/职业资质与机构审核|直销相关表达|保险相关内容|证券、投资与金融内容|服务效果不保证/u);
});
```

在 `tests/site-content.test.ts` 将 `GLOBAL_CLAIMS_BOUNDARY` 断言替换为：

```ts
expect(GLOBAL_CLAIMS_BOUNDARY).toBe(
  "客来宝坚持真实表达、清晰合作与尊重授权，并与客户共同维护合理、透明的成果预期。",
);
```

保留 `PROFESSIONS` 的三个既有边界断言；本任务只取消 `/disclaimer` 的完整行业清单，不删除其他页面的已确认边界。

- [ ] **Step 2: 运行测试并确认旧正文导致失败**

Run:

```powershell
pnpm exec vitest run tests/policy-page-copy.test.tsx tests/site-content.test.ts
```

Expected: FAIL；缺少四个新 H2/锚点，且页脚摘要仍含旧的连续否定文案。

- [ ] **Step 3: 用四项承诺替换 `/disclaimer` 正文**

将 `src/app/disclaimer/page.tsx` 的 `sections` 改为：

```ts
const sections = [
  { id: "authenticity", label: "真实表达" },
  { id: "collaboration", label: "清晰合作" },
  { id: "authorization", label: "尊重授权" },
  { id: "long-term-value", label: "重视长期价值" },
] as const;
```

使用以下 lead：

```tsx
lead="客来宝相信，持续有效的合作建立在真实、清晰和彼此信任之上。以下原则适用于客来宝官网、K-Link 产品介绍与客来宝媒体服务，说明我们如何使用客户提供的信息、如何推进内容与服务，以及双方共同维护的合作基础。"
```

使用以下四个 section：

```tsx
<section id="authenticity">
  <h2>1. 真实表达</h2>
  <p>我们以真实业务、真实经验和已经确认的材料为基础开展工作，不通过夸大、虚构或容易引起误解的表达制造吸引力。客户应确保提供的信息准确、合法，并与实际业务保持一致。</p>
</section>
<section id="collaboration">
  <h2>2. 清晰合作</h2>
  <p>合作开始前，我们会共同确认目标、服务范围、交付方式和必要的配合事项；执行过程中保持沟通，并以双方确认的信息推进。客户负责其业务决策以及最终对外使用和发布的内容。</p>
</section>
<section id="authorization">
  <h2>3. 尊重授权</h2>
  <p>姓名、照片、评价、品牌标识、案例及合作信息，仅在来源清楚并获得适当授权后使用。我们尊重客户、合作伙伴及相关权利人的合法权益，不以虚构身份或未经许可的材料替代真实证明。</p>
</section>
<section id="long-term-value">
  <h2>4. 重视长期价值</h2>
  <p>我们关注持续拓客能力和可信品牌资产的积累，不以短期数字制造不切实际的预期。实际成果会受到业务基础、投入程度、执行节奏、市场变化和平台环境等因素影响，我们会在约定范围内持续沟通和优化。</p>
  <p>好的合作，从真实、清晰和彼此信任开始。如果你希望了解客来宝如何结合具体业务提供支持，欢迎与我们沟通。</p>
</section>
```

- [ ] **Step 4: 更新公共页脚摘要**

在 `src/lib/site-content.ts` 使用：

```ts
export const GLOBAL_CLAIMS_BOUNDARY =
  "客来宝坚持真实表达、清晰合作与尊重授权，并与客户共同维护合理、透明的成果预期。";
```

- [ ] **Step 5: 更新 `/disclaimer` 语义基线**

在 `tests/fixtures/m4-02-public-page-baseline.json` 的 `/disclaimer` 对象中使用：

```json
{
  "h1": "合作与使用说明",
  "markers": ["1. 真实表达", "3. 尊重授权", "4. 重视长期价值"],
  "h2": ["1. 真实表达", "2. 清晰合作", "3. 尊重授权", "4. 重视长期价值"],
  "sectionLabels": ["1. 真实表达", "2. 清晰合作", "3. 尊重授权", "4. 重视长期价值"]
}
```

保留该对象的 `moduleId`、链接和其他未列出的既有字段。

- [ ] **Step 6: 运行政策页及共享内容测试**

Run:

```powershell
pnpm exec vitest run tests/policy-page-copy.test.tsx tests/site-content.test.ts tests/m3-brand-release-contract.test.ts tests/home-and-global-shell.test.tsx
```

Expected: PASS；三个政策页仍包含客来宝统一品牌且 `/disclaimer` 不出现旧的五个章节标题。

- [ ] **Step 7: Commit**

```powershell
git add -- tests/policy-page-copy.test.tsx tests/site-content.test.ts tests/fixtures/m4-02-public-page-baseline.json src/app/disclaimer/page.tsx src/lib/site-content.ts
git commit -m "feat(kelaibao): recast disclaimer as brand commitments"
```

---

### Task 4: 完整验证与页面检查

**Files:**
- Verify only: all files changed in Tasks 1–3

**Interfaces:**
- Consumes: 完整的政策页名称、正文、入口和 metadata 变更。
- Produces: 可交付的测试、类型、构建和响应式页面验证结论。

- [ ] **Step 1: 扫描旧的公开入口名称**

Run:

```powershell
rg -n --glob '*.{ts,tsx}' '查看完整免责声明|>隐私政策<|>服务条款<|>免责声明<|普通联系入口' src
```

Expected: 无匹配。内部邮件或历史文档中的“隐私政策”不属于公开入口名称，不做机械替换。

- [ ] **Step 2: 运行完整自动化验证**

Run:

```powershell
pnpm test
pnpm lint
pnpm build
```

Expected: 三条命令均以 exit code 0 完成。

- [ ] **Step 3: 检查本地页面内容与链接**

在开发服务器运行时检查：

```text
http://localhost:3000/privacy
http://localhost:3000/terms
http://localhost:3000/disclaimer
```

确认：

- 三个 H1 和页脚入口使用批准的新名称。
- `/privacy` 与 `/terms` 的目录及正文未改变。
- `/disclaimer` 只显示四项品牌承诺，目录锚点可到达对应章节。
- “联系我们”指向 `/contact`，“返回首页”指向 `/`。
- canonical 仍分别为 `/privacy`、`/terms`、`/disclaimer`。

- [ ] **Step 4: 检查关键视口**

依次以 320px、390px、768px 和 1440px 宽度检查三个页面，确认：

```text
无横向溢出；H1/H2 不截断；目录不重叠；四个锚点可见；底部操作可点击；页脚入口完整换行。
```

- [ ] **Step 5: 检查最终差异**

Run:

```powershell
git diff --check
git status --short
git log -4 --oneline
```

Expected: `git diff --check` 无输出；工作区干净，最近提交包含需求对齐、入口改名和品牌承诺正文三个独立提交。
