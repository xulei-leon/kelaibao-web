# M5-02 Responsive and Link Check

## Environment

- Date: 2026-08-09
- URL: `http://127.0.0.1:3102`
- Runtime: Next.js development server
- Browser: installed Google Chrome, driven by bundled Playwright
- Viewports: 320x900, 390x900, 768x900, 1440x900
- Accessibility follow-up viewports: 390x900 and 1440x900
- Browser fallback: the Browser plugin was available, but its required browser-control entry was not exposed in this session. No dependency was installed; the bundled Playwright runtime used the already installed Chrome executable.

## Flow

`/` -> click `查看内容工具` -> `/features#daily-trends` -> verify the target remains below the sticky Header.

Additional checks covered `/team#team-mini-program` and the five legacy `/media` fragments.

## Results

| Check | 320 | 390 | 768 | 1440 |
| --- | ---: | ---: | ---: | ---: |
| Core routes have exactly one approved H1 | PASS | PASS | PASS | PASS |
| Document horizontal overflow | 0 px | 0 px | 0 px | 0 px |
| Context-link minimum height | 44 px | 44 px | 44 px | 44 px |
| `/features#daily-trends` visible gap below Header | 109.05 px | 108.89 px | 109.22 px | 107.75 px |
| `/team#team-mini-program` visible gap below Header | 95.58 px | 95.67 px | 95.78 px | 92.36 px |
| Console errors/warnings | 0 | 0 | 0 | 0 |

All measured anchor gaps exceed the Sprint minimum of 8px. Each of these legacy media targets existed exactly once at every viewport:

- `/media#services`
- `/media#method`
- `/media#direct-sales`
- `/media#insurance`
- `/media#securities`

## Visual Evidence

Temporary screenshots were captured outside the repository:

- `%TEMP%/codex-kelaibao-m5-02/home-320.png`
- `%TEMP%/codex-kelaibao-m5-02/home-390.png`
- `%TEMP%/codex-kelaibao-m5-02/home-768.png`
- `%TEMP%/codex-kelaibao-m5-02/home-1440.png`

Manual inspection of the 390px and 1440px captures found no error overlay, clipped H1, unreadable wrapping, link overlap or horizontal overflow. The small Next.js development indicator is expected in development mode and is not a framework error overlay.

## Code Review Accessibility Follow-up

The accepted code-review finding required explicit 200% zoom and keyboard/focus evidence. A follow-up run used installed Chrome through bundled Playwright on 390px and 1440px viewports.

Chrome DevTools Protocol `Emulation.setPageScaleFactor` set the page scale to `2`; `window.visualViewport.scale` reported `2` on every checked route.

| 200% scale check | 390 | 1440 |
| --- | ---: | ---: |
| `/`, `/features`, `/team`, `/media` H1 has visible geometry | PASS | PASS |
| Footer has visible geometry on all four routes | PASS | PASS |
| Document horizontal overflow on all four routes | 0 px | 0 px |
| Home and features context-link minimum height | 44 px | 44 px |

Keyboard traversal used real `Tab` input from the page body. Every new `.context-link` was reached in DOM order at both widths:

- Home: 5 of 5 links reached.
- Features: 2 of 2 links reached, including the two separately rendered links that share the same team target.
- Focus outline: `solid 3px rgb(37, 99, 235)` on every focused link.
- Focused link height: 44px for every link.

The first keyboard script incorrectly deduplicated the two features links by matching their identical href and label. The corrected run identified links by DOM index and passed with no product-code change.
