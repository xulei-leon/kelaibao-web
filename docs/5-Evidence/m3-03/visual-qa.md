# M3-03 Visual QA Evidence

## Context

- Date: 2026-07-31 (Asia/Shanghai)
- Build under test: packaged Next.js standalone output from `pnpm build`
- URL: `http://127.0.0.1:3013/media`
- Target flow: `/media` loads -> user opens “咨询客来宝媒体” -> the media Dialog is accessible and isolated -> close restores focus -> “直销解决方案” lands at `#direct-sales` below the sticky header.
- Primary browser path: Codex in-app Browser.
- Exact-width fallback: bundled local Playwright with installed Chrome. The in-app Browser completed page, console, screenshot, and interaction checks, but its desktop window capped the content viewport at about 1318px; exact `1440px` validation therefore used the approved local-browser fallback. No dependency was installed.

## Responsive Results

| Viewport | Rendered result | Overflow | Anchors | Console |
| --- | --- | --- | --- | --- |
| `320 × 900` | PASS — mobile header, hero copy, CTA, boundary copy, and next section remain readable and correctly wrapped | `scrollWidth = clientWidth = 320` | all five IDs occur exactly once | no warning/error |
| `390 × 900` | PASS — media Dialog fits the viewport; QR, close control, copy, and fallback semantics remain readable | `scrollWidth = clientWidth = 390` | `#direct-sales` lands at `88.19px`, below the `72px` sticky header | no warning/error |
| `768 × 900` | PASS — tablet layout retains readable hero and service hierarchy without clipping | `scrollWidth = clientWidth = 768` | all five IDs occur exactly once | no warning/error |
| `1440 × 900` | PASS — desktop header, hero measure, CTA, and section spacing render as designed | `scrollWidth = clientWidth = 1440` | all five IDs occur exactly once | no warning/error |

The five unique redirect targets verified in every exact-width run were `services`, `direct-sales`, `insurance`, `securities`, and `method`.

## Interaction and Accessibility Results

| Check | Result |
| --- | --- |
| Page identity | PASS — URL `/media`; title `客来宝媒体｜专业表达与内容顾问`; meaningful SSR `h1` present |
| Framework overlay / blank page | PASS — no overlay and the complete media content is present |
| Open media consultation | PASS — the hero CTA opens the uniquely named `咨询客来宝媒体` Dialog |
| Modal isolation | PASS — the background receives `inert`; focus starts inside the Dialog on `关闭客来宝媒体咨询窗口` |
| Close and focus restoration | PASS — the close control removes the Dialog and restores focus to the opening CTA |
| Stable anchor placement | PASS — `#direct-sales` remains visible below the sticky header |
| Reduced motion | PASS — at `390px`, emulated `prefers-reduced-motion: reduce` matches and computed root `scroll-behavior` changes from `smooth` to `auto` |
| Console health | PASS — no relevant warning, error, or page error at any viewport |

## Screenshot Inspection

Viewport screenshots were generated outside the repository and visually inspected for `320px`, the `390px` open-Dialog state, `768px`, and `1440px`. They confirm:

- no horizontal clipping or overlapping controls;
- the mobile CTA remains full-width with adequate padding;
- the Dialog stays within the mobile viewport and keeps the close control visible;
- the desktop line length and content hierarchy remain consistent with the shared Kelaibao shell.

The screenshots are QA artifacts only and are intentionally not committed. This document is the reproducible evidence summary required by the Sprint.
