# M4-03 concept-to-browser fidelity ledger

## 判定范围

仅比较构图、区域比例、字体层级、配色、素材语言、留白、响应式和交互。概念图中的生成文字、Logo、数据、指标、人物和未实现控件不参与像素一致性判断；内容与声明由 allowed-copy fixture 独立验收。

| 页面 / 视口 | 概念图 | before | after | Section / 素材 | 检查维度与差异 | Severity | 可修复 | 处理决定 | 确认来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` / `1440×900` | `../../2-Design/assets/m4-03/concepts/home-desktop.png` | `screenshots/before/home-1440x900.png` | `screenshots/after/home-1440x900.png` | Hero、问题卡、`home-hero` | 已形成三列首屏、深蓝层级、产品蓝 CTA、白色问题卡和浅色网络画布；正式 K-Link 标志未复制，provisional 叠层为 FR 强制差异 | Low | 否（冻结/状态契约） | 接受；不复制生成 Logo，保留尺寸叠层 | FR-21 §1、§7；document review-confirm |
| `/features` / `1440×900` | `../../2-Design/assets/m4-03/concepts/features-desktop.png` | `screenshots/before/features-1440x900.png` | `screenshots/after/features-1440x900.png` | Hero、Journey、`feature-*` | Hero 高度已收紧，首屏可预览五步 Journey；十项纵向结构图在后续既有 Section 中交替出现。概念图手机 UI、微信图标和生成数据被忽略 | Low | 是（已关闭） | 修正高特异性/高度规则后关闭 | FR-21 §6；本轮 IAB 图像检查 |
| `/media` / `1440×900` | `../../2-Design/assets/m4-03/concepts/media-desktop.png` | `screenshots/before/media-1440x900.png` | `screenshots/after/media-1440x900.png` | 深色 Hero、`media-hero` | 深蓝/媒体绿、双栏横向生态视觉和边界说明均匹配；素材用抽象内容网络替代概念图人物/地图节点 | Low | 是（已关闭） | 修正旧 CSS 把视觉压成单列的问题；保留抽象素材 | FR-21 §2、§6；本轮 IAB 图像检查 |
| `/` / `390×844` | `../../2-Design/assets/m4-03/concepts/mobile-revised.png` | `screenshots/before/home-390x844.png` | `screenshots/after/home-390x844.png` | 移动 Header、Hero、`home-hero` | 单列阅读顺序、40px 级 H1、全宽 CTA、48px 菜单和稳定素材裁切匹配；素材卡与尺寸叠层来自 FR 固定槽位契约 | Low | 否（固定槽位契约） | 接受；菜单打开/Escape 另有交互证据 | FR-21 §7、§8；IAB interaction QA |
| `/team` / `1440×900` | `../../2-Design/assets/m4-03/concepts/team-revised.png` | `screenshots/before/team-1440x900.png` | `screenshots/after/team-1440x900.png` | Hero、`team-hero` | 浅色网络画布、金色弱强调、左右双栏与抽象协作网络匹配；标题因冻结文字和 1200px 容器为三行，概念图人物/成员卡被排除 | Low | 是（已关闭） | 扩大文案列并缩小间距；不引入人物或虚构团队 | FR-21 §4、§6；本轮 IAB 图像检查 |

没有未关闭的 Critical、High 或 Medium 可修复差异。两个初版概念图已由修订版明确取代。
