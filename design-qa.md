# Mainland Website Design QA

## Comparison target

- Source visual truth:
  - `D:\code\tokengate\.codex-audit\mainland-website-2026-07-26\01-home-desktop-top.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-2026-07-26\07-home-mobile-top.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-2026-07-26\03b-services-detail-desktop.png`
  - The approved direct-sales-first business-site redesign plan in the implementation request.
- Rendered implementation:
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\01-home-desktop.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\04-home-mobile-390x844.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\03-services-samples-desktop.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\11-services-samples-mobile-390x844.png`
- Normalized comparison evidence:
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\compare-home-desktop-before-after.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\compare-home-mobile-before-after.png`
  - `D:\code\tokengate\.codex-audit\mainland-website-implemented-2026-07-26\compare-services-before-after.png`

## Viewport and normalization

- Desktop source: 1168 × 730 px. Desktop implementation: 1428 × 893 px captured from a 1440 × 900 CSS viewport at device pixel ratio 1.22. The implementation was normalized to 1168 × 730 for the side-by-side comparison.
- Mobile source: 308 × 666 px. Mobile implementation: 378 × 818 px captured from a 390 × 844 CSS viewport at device pixel ratio 1.22. The implementation was normalized to 308 × 666 for the side-by-side comparison.
- Services focused source: 1168 × 730 px. Services focused implementation: 1428 × 893 px from the same 1440 × 900 CSS viewport and normalized to the source dimensions.
- Additional layout checks used 320 × 844, 768 × 900, and a 720 × 450 CSS viewport as the reflow equivalent of 200% zoom from 1440 × 900.
- State: public, unauthenticated pages using the intentionally non-production WeCom QR placeholder and preview-only fallback-form gate.

## Full-view comparison evidence

- The navy, ivory, champagne, and emerald visual system remains intact.
- The homepage now makes direct sales the primary audience in the eyebrow, headline, navigation, sample content, and first downstream section.
- The abstract “定位—内容—信任” diagram is replaced by three recognizable deliverable structures, each visibly identified as illustrative rather than a client case.
- Desktop composition preserves the existing restrained editorial character while improving specificity and above-the-fold proof.
- Mobile preserves the original CTA visibility and readable hierarchy; the revised headline, lead, and sample preview fit without horizontal scrolling at 320 and 390 widths.

## Focused region comparison evidence

- The services comparison shows the former specification-like “适合谁 / 工作内容 / 交付 / 限制” block beside the new deliverable-document treatment.
- The final desktop sample grid uses a balanced 5/7 first row followed by a full-width FAQ checklist, eliminating the earlier stretched card and unused blank area.
- At 390 px the same samples become a single readable column with 338 px cards inside the visible content width.

## Required fidelity surfaces

- Fonts and typography: the existing Chinese system font stack is preserved. Display headings use the established navy, heavy weight, compact line height, and responsive wrapping; body copy remains readable at 16 px with a 1.75 line height. No truncation was found.
- Spacing and layout rhythm: the revised hero, sample documents, service cards, standards, and editorial sections maintain the existing square-cornered, fine-border system. Horizontal overflow was checked at 320, 390, 768, and 1440 widths and is no longer scrollable.
- Colors and visual tokens: existing tokens remain the source of truth. Sample WCAG contrast checks returned 14.81:1 for navy body/title text on ivory, 5.19:1 for the gold eyebrow, and 6.19:1 for the primary WeCom button text.
- Image quality and asset fidelity: the redesign does not invent client imagery, logos, portraits, or case-study assets. Lucide icons remain consistent. The temporary QR asset is explicitly marked “测试二维码 / 不可用于正式联系” and is not represented as production-ready.
- Copy and content: the copy now answers audience, problem, deliverable, and next step within the first screen. Insurance and securities remain available but no longer compete in the primary navigation. Samples repeat an explicit illustrative disclaimer.
- States and interactions: mobile navigation opens and closes through its semantic button. The WeCom dialog traps focus, closes with Escape, restores focus to the originating link, and leaves body scrolling restored. A fresh browser tab reported no console warnings or errors.

## Comparison history

### Iteration 1

- P2: the placeholder QR visibly contained `PREVIEW ONLY`, conflicting with the public-copy rule.
  - Fix: replaced internal wording and metadata with customer-facing test-asset language.
  - Post-fix evidence: `05-contact-mobile-wechat-390x844.png`; the QR and its explanatory text are visible within the mobile contact viewport and no public Preview/Sprint/M1-05 text remains.
- P2: `body { min-width: 320px; }` allowed a classic-scrollbar viewport at 320 px to move horizontally.
  - Fix: removed the fixed minimum width and retained `overflow-x: clip`.
  - Post-fix evidence: the 320 px browser check returned `scrollX: 0` after a horizontal-scroll attempt, and the root scroll width equals the client width.

### Iteration 2

- P2: the first representative sample spanned two grid rows, producing a visibly stretched card and a large empty region; small-screen overrides were also ordered before the new base styles.
  - Fix: changed the desktop grid to 5/7 plus a full-width third sample and added final 860/640 responsive overrides.
  - Post-fix evidence: `03-services-samples-desktop.png`, `11-services-samples-mobile-390x844.png`, and `compare-services-before-after.png`.

## Findings

- No actionable P0, P1, or P2 design differences remain.

## Residual test gaps

- The in-app browser did not expose a browser-chrome zoom control. Reflow at the equivalent 720 × 450 CSS viewport passed with the primary CTA still visible and no horizontal overflow; an actual 200% browser-zoom spot check remains appropriate before production launch.
- The real WeCom QR, public identity/privacy responsibility, HTTPS form endpoint, and WeChat embedded-browser validation remain production gates rather than design-QA failures.

## Final result

passed

---

# 2026-08-06 public image replacement design QA

## Comparison target

- Source visual truth: `D:\code\tokengate\var\2026.08.06-web-image\` (22 supplied PNG/JPG files: five page banners, a separate news banner, four homepage illustrations, ten feature screenshots, the arrival guide, and the office-scene image).
- Rendered implementation: `http://127.0.0.1:4173/` from the production standalone build.
- Primary implementation evidence:
  - `D:\code\tokengate\products\kelaibao\docs\5-Evidence\2026-08-06-image-replacement\feature-02-comparison.png`
  - `D:\code\tokengate\products\kelaibao\docs\5-Evidence\2026-08-06-image-replacement\media-1440.png`
  - `D:\code\tokengate\products\kelaibao\docs\5-Evidence\2026-08-06-image-replacement\news-1440.png`
  - `D:\code\tokengate\products\kelaibao\docs\5-Evidence\2026-08-06-image-replacement\arrival-guide-lightbox-1440.png`
- State: public, unauthenticated pages; feature screenshot visible, media/news hero visible, and arrival-guide lightbox open.

## Viewport and normalization

- Desktop checks requested a 1440 × 900 browser viewport. The in-app browser capture surface produced 1037 × 583 screenshots; the feature focused crop measured 274 × 432 CSS px.
- Responsive overrides requested 320 × 568, 390 × 844, and 768 × 1024. The in-app surface exposed content widths of 250, 307, and 617 CSS px respectively, which are stricter than the named breakpoints. No horizontal overflow was found on `/features`, `/media`, `/news`, or `/about` at any checked width.
- Source feature screenshots are 1242 × 2208 px. Browser natural-image checks returned the same 1242 × 2208 px for all ten rendered feature files.
- Hero sources and rendered natural dimensions are 2400 × 1000 px. The arrival guide source and rendered natural dimensions are 1500 × 5584 px.
- Density normalization: `feature-02-comparison.png` contains the supplied source and the rendered feature card side by side at the same 274 × 432 comparison size.

## Full-view comparison evidence

- `/features` uses the supplied hero and ten phone screenshots without the former filename, recommended-size, “功能结构示意”, sequence-number, or repeated feature-title overlays.
- `/media` renders `media-01.webp`, converted from `media-01-媒体中心.png`; the cityscape crop remains sharp and supports the existing hero copy.
- `/news` renders the separate `news-01.webp`, converted from `media-01-新闻动态.png`; the center glow and corner light trails remain unobstructed behind the news heading.
- `/about` opens `arrival-guide.webp` in the existing lightbox at its true 1500 × 5584 dimensions. The office-scene PNG is byte-identical to the supplied source.

## Focused region comparison evidence

- `feature-02-comparison.png` places the source `features-02.png` beside the rendered `/features` card. Subject, crop, phone frame, screen content, color, and sharpness match; only the existing card border/shadow remains around the image.
- `arrival-guide-lightbox-1440.png` confirms the tall WebP renders without stretching and retains the supplied map and instruction typography.
- Focused comparison was not repeated for every feature screenshot because all ten share the same component, exact source dimensions, lossless WebP conversion, and successful browser natural-dimension checks.

## Required fidelity surfaces

- Fonts and typography: page typography is unchanged. Text contained inside supplied screenshots remains part of the raster source and is not recreated or overlaid by HTML.
- Spacing and layout rhythm: existing hero and feature-card dimensions are retained. Removing labels eliminates extra vertical padding around feature screenshots; no overflow appears at the checked desktop or responsive widths.
- Colors and visual tokens: source color is preserved by direct conversion. Existing navy, white, and product-blue page tokens remain unchanged.
- Image quality and asset fidelity: feature screenshots use lossless WebP; banners/home illustrations use quality-92 WebP; the arrival guide uses quality-95 WebP. Natural dimensions match the supplied sources, and browser console checks reported no image errors.
- Copy and content: all page-owned filename/dimension and feature-image labels are removed. Business copy, image-internal text, alt text, and interaction labels remain intact.
- States and interactions: the arrival-guide lightbox opens and closes through its semantic controls; `/features`, `/media`, `/news`, and `/about` load without console warnings/errors in the checked states.

## Comparison history

### Iteration 1

- P2: approved images were still marked `provisional`, causing filename/dimension captions to render over or below them; features also repeated labels around screenshots, and CSS pseudo-elements added file labels to news/contact/policy surfaces.
  - Fix: marked the 19 registered visual assets `final`, removed feature-image topline/title markup and its stale CSS, and deleted the pseudo-element file-label rules.
  - Post-fix evidence: browser DOM checks return `markerText: false` for `/features`, `/media`, `/news`, and `/about` at all checked widths.
- P2: one shared `media-01.webp` could not represent both the media center and news visual supplied by the owner.
  - Fix: retained `media-01.webp` for `/media`, added `news-01.webp` for news list/detail headers, and scoped the CSS background by content type.
  - Post-fix evidence: `media-1440.png` and `news-1440.png`, plus computed CSS resolving to `/visual/image/hero-banner/news-01.webp` on `/news`.
- P2: office and arrival-guide lightboxes declared dimensions that did not match the supplied files.
  - Fix: updated them to 1435 × 1456 and 1500 × 5584; converted the arrival guide from the supplied JPG to `arrival-guide.webp`.
  - Post-fix evidence: browser natural dimensions are 1500 × 5584 and the visible lightbox is not stretched.

## Findings

- No actionable P0, P1, or P2 visual differences remain.

## Follow-up polish

- P3: the ten lossless feature WebPs prioritize small-screen text fidelity and are larger than the former provisional files; CDN compression/caching should be retained in production.

## Final result

passed

---

# Homepage light-social section design QA

## Comparison target

- Source visual truth: `C:\Users\whchen\AppData\Local\Temp\codex-clipboard-4213dd68-db38-49f0-a4e6-d91dbfd3f97b.png` (552 × 459 px).
- Desktop implementation: `docs/5-Evidence/m4-04/screenshots/home-story-redesign/design-qa-home-story-1440.png` (1425 × 1100 px), captured from a 1440 × 1100 CSS viewport at device pixel ratio 1.
- Mobile implementation: `docs/5-Evidence/m4-04/screenshots/home-story-redesign/design-qa-home-story-390.png` (375 × 812 px), captured from a 390 × 844 CSS viewport at device pixel ratio 1.
- Normalized comparison: `docs/5-Evidence/m4-04/screenshots/home-story-redesign/design-qa-home-story-comparison.png`.
- State: public homepage, unauthenticated, `#light-social-system` anchor, no interactive state required by this informational section.

## Full-view comparison evidence

- The implementation preserves the source hierarchy: centered title and subtitle, five problem cards, five blue icon steps with directional connectors, five two-tone action/result cards, and the closing five-step value chain.
- The existing brand navy and product blue replace the lower-resolution source sampling without changing its visual intent.
- The 1440 px version uses the site's established 1200 px content container; the normalized comparison therefore appears wider and slightly less vertically dense than the supplied downscaled reference, while retaining the same grouping and reading order.
- At 390 px the five columns become five stacked, self-contained steps. All copy remains readable and horizontal overflow is zero.

## Focused region comparison evidence

- `docs/5-Evidence/m4-04/screenshots/home-story-redesign/design-qa-home-story-comparison.png` places the source and final desktop implementation in one image for direct inspection of typography, spacing, surfaces, icons, and content order.
- Five Lucide icons replace the former numeric labels and match the source semantics: search, send, shield-check, target, and users. No handcrafted SVG, CSS icon, placeholder image, or generated asset is used.
- A focused mobile capture confirms the problem, icon, action, and blue result surfaces stay in the intended order without clipping.

## Required fidelity surfaces

- Fonts and typography: existing Chinese system fonts are retained. Heading weight, centered hierarchy, body line height, and blue step labels match the source intent; desktop text does not truncate and mobile wraps naturally.
- Spacing and layout rhythm: desktop uses five equal columns and consistent 14 px gaps; 16 px card radii, circular icon wells, two-tone lower cards, and the centered closing chain reproduce the source structure. Mobile collapses to one column at 600 px.
- Colors and visual tokens: pale blue section and flow surfaces, neutral gray cards, navy headings, and saturated blue result panels map directly to the source palette with stronger production contrast.
- Image quality and asset fidelity: the target contains only standard interface icons. Matching icons come from the installed Lucide library and render sharply at both checked viewports.
- Copy and content: all five existing problem, action, result, and value-chain texts are preserved; only visual number labels were removed because the source uses icons instead.
- Accessibility and responsiveness: semantic ordered lists remain, decorative icons and arrows are hidden from assistive technology, and no horizontal overflow occurs at 390 or 1440 px.
- States and interactions: the redesigned area is informational and contains no controls. The surrounding homepage remains functional. Browser console inspection found no errors; one pre-existing Next.js LCP warning refers to `/visual/image/home/home-03.webp` outside this section.

## Comparison history

### Iteration 1

- P2: the first flow cell inherited a legacy navy background while the other four were transparent; all icons also inherited a low-contrast muted color.
  - Fix: raised selector specificity for the redesigned section and explicitly set the icon color.
  - Post-fix evidence: `docs/5-Evidence/m4-04/screenshots/home-story-redesign/design-qa-home-story-1440.png`; all five flow cells and icons now use one consistent treatment.

### Iteration 2

- P2: the icon wells were visually smaller than the reference and the middle flow row lacked its pale blue surface.
  - Fix: increased icon wells to 76 px, icons to 38 px, and applied the pale blue flow background through the column surface.
  - Post-fix evidence: `docs/5-Evidence/m4-04/screenshots/home-story-redesign/design-qa-home-story-comparison.png`; icon emphasis and row grouping now match the source hierarchy.

## Findings

- No actionable P0, P1, or P2 differences remain.

## Follow-up polish

- P3: the desktop implementation intentionally uses the site's wider container, so it is less vertically dense than the downscaled source image.

## Final result

passed
