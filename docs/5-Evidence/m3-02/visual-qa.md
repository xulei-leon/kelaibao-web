# M3-02 Visual QA Evidence

## Context

- Date: 2026-07-31 (Asia/Shanghai)
- Local origin: `http://127.0.0.1:33102`
- Routes: `/features`, `/team`, `/about`, `/contact`
- Required viewports: `320x800`, `390x844`, `768x1024`, `1440x1000`
- Motion preference: `prefers-reduced-motion: reduce`
- Browser: bundled Playwright Chromium, headless

The `agent-browser` executable referenced by the verification skill was not installed in this workspace. The same load, overlay, content, layout, interaction, screenshot, console, and viewport checks were therefore executed with the bundled Playwright Chromium runtime. No external service was used.

## Automated Browser Result

All 16 route/viewport combinations passed:

| Check | Result |
| --- | --- |
| HTTP response | Every route returned `200`. |
| Meaningful render | Every page rendered its expected H1 and more than 100 characters of body content. |
| Framework error overlay | No Next.js/Vite error overlay was present. |
| Browser errors | No console error or uncaught page error was observed. |
| Horizontal overflow | `documentElement.scrollWidth <= clientWidth + 1` at all four viewports; observed widths were exactly `320`, `390`, `768`, and `1440`. |
| Reduced motion | `matchMedia('(prefers-reduced-motion: reduce)').matches` was true for every run. |
| Product CTA semantics | The K-Link trial CTA computed to action blue `rgb(37, 99, 235)` at every viewport and did not reuse the enterprise-WeChat CTA class. |

## Dialog Result

The K-Link trial Dialog was opened from `/features` at every required viewport. All four runs passed:

- `aria-modal="true"` and the expected accessible name were present.
- The close button received initial focus.
- The page background carried `inert` while the Dialog was open.
- The Dialog stayed inside the CSS viewport and did not create horizontal overflow.
- The Preview-only QR label was visible and did not claim Production readiness.

The automated Vitest interaction suite separately passed Escape close, focus restoration, forward/reverse Tab containment, backdrop-only close, background interaction blocking, image-error fallback, and the `/contact#klink-trial` degradation path.

## 200% Zoom and Reflow

- Chromium DevTools page scale was set to `2`; `window.visualViewport.scale` reported `2` while the Dialog remained rendered and its close button retained focus.
- The corresponding narrow reflow condition was exercised at `390px` and `320px`: Dialog content stacked vertically, remained horizontally contained, and the page did not overflow.
- Screenshot inspection confirmed that the zoomed Dialog remains readable; browser pan/scroll remains available under page-scale magnification.

## Manual Screenshot Inspection

The screenshots were visually inspected for clipping, overlap, broken hierarchy, unreadable contrast, accidental unsupported claims, and modal occlusion. No blocking visual defect was found.

Representative evidence:

- `screenshots/features-320.png`
- `screenshots/features-390.png`
- `screenshots/features-768.png`
- `screenshots/features-1440.png`
- `screenshots/team-1440.png`
- `screenshots/about-1440.png`
- `screenshots/contact-390.png`
- `screenshots/dialog-320.png`
- `screenshots/dialog-390.png`
- `screenshots/dialog-768.png`
- `screenshots/dialog-1440.png`
- `screenshots/dialog-200-percent.png`

## Conclusion

`PASS` for the M3-02 visual and interaction acceptance gate. Production remains independently blocked by the formal mini-program resource and other external release gates.
