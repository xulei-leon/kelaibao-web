# M4-04 产品负责人官网修改意见图片归档

## 1. 来源与用途

本目录中的图片全部从 `var/20260804-kelaibao-website-review.docx` 原样提取。该 Word 文档是对 `products/kelaibao/` 当前网站内容、布局、样式和交互的修改意见，不是独立站点设计，也不构成第二套品牌或第二应用。

提取日期：`2026-08-04`

使用规则：

- `review-concepts/`：页面布局、样式、文案位置和模块调整的设计概念/批注参考，用于 M4-04 实现与四视口验收。
- `provided-assets/`：产品负责人提供的 Logo、图标、办公室场景和到访指引候选素材。它们不是仅供构图参考的概念图；接入 Production 前必须完成来源、授权、事实、隐私、联系方式和二维码核验。
- 图片中的红框、箭头、删除字样和示例文字只表达修改意图，不得作为最终页面像素或图片化正文直接上线。
- 最终页面优先使用真实 HTML/CSS、语义标题、列表、按钮、表单和可访问 Dialog；只有纯视觉内容才作为图片呈现。

## 2. 设计概念图

| 文件 | 原嵌入文件 | 对应意见 | 用途 |
| --- | --- | --- | --- |
| `review-concepts/header-navigation-annotation.jpeg` | `image2.jpeg` | C02～C04 | Header Logo、描述与“媒体中心”导航标注 |
| `review-concepts/home-hero-copy-and-hierarchy-annotation.jpeg` | `image3.jpeg` | C06～C08 | 首页 Hero 层级、替换文案和位置参考 |
| `review-concepts/home-five-step-flow-full-concept.jpeg` | `image4.jpeg` | C10 | 五步流程完整桌面构图参考 |
| `review-concepts/home-five-step-flow-compact-concept.jpeg` | `image5.jpeg` | C10 | 五步流程紧凑箭头样式参考 |
| `review-concepts/home-four-modules-copy-annotation.jpeg` | `image6.jpeg` | C12 | 四大模块副标题修改位置 |
| `review-concepts/home-four-modules-icon-placement.jpeg` | `image7.jpeg` | C15 | 四大模块图标区域与卡片位置参考 |
| `review-concepts/home-boundary-section-removal-annotation.png` | `image9.png` | C19 | 首页独立边界模块删除标注 |
| `review-concepts/footer-policy-navigation-reference.png` | `image10.png` | C23 | Footer 政策入口结构参考 |
| `review-concepts/mini-program-dialog-copy-annotation.png` | `image11.png` | C28～C29 | 小程序 Dialog 文案删除/替换标注 |
| `review-concepts/mini-program-trial-section-copy-annotation.png` | `image12.png` | C28～C29 | 小程序体验区文案删除标注 |
| `review-concepts/contact-media-consultation-copy-reference.png` | `image13.png` | C31～C32 | 联系页媒体咨询模块现状参考 |
| `review-concepts/features-boundary-section-removal-annotation.png` | `image14.png` | C36 | 功能页边界模块删除标注 |
| `review-concepts/team-capability-two-column-layout-concept.png` | `image15.png` | C40～C43 | 团队能力双栏布局与标题层级参考 |
| `review-concepts/team-boundary-section-removal-annotation.png` | `image16.png` | C44 | 团队页边界模块删除标注 |
| `review-concepts/media-consultation-dialog-annotation.jpeg` | `image17.jpeg` | C46 | 媒体咨询 Dialog 标题/正文修改标注 |
| `review-concepts/media-coverage-module-concept.png` | `image18.png` | C49 | 媒体覆盖新增模块的内容构图参考 |

## 3. 产品负责人提供的候选素材

| 文件 | 原嵌入文件 | 对应意见 | 当前状态 |
| --- | --- | --- | --- |
| `provided-assets/kelaibao-k-link-logo-candidate.png` | `image1.png` | C02 | 候选；待品牌授权、尺寸和透明背景核验 |
| `provided-assets/module-icon-candidate.png` | `image8.png` | C15/C18 | 候选；待语义适配和风格统一 |
| `provided-assets/office-scenes-candidate.png` | `image19.png` | C55 | 候选；待人物、Logo、屏幕信息和使用授权核验 |
| `provided-assets/arrival-guide-candidate.jpeg` | `image20.jpeg` | C56 | 候选；待地址、电话、二维码、路线和公开授权核验 |

## 4. 实现验收

- 每张概念图必须映射到 FR-22、M4-04 工作包和最终 before/after 证据。
- 不要求逐像素复刻红色批注；要求修改意图、层级、位置、响应式和可访问性一致。
- `320×568`、`390×844`、`768×1024`、`1440×900` 均需检查，无横向溢出、遮挡或图片化交互。
- 候选素材没有完成授权/事实核验时，M4-04 可以保持 Local 实现或占位状态，但 Production 必须继续 `BLOCKED`。

