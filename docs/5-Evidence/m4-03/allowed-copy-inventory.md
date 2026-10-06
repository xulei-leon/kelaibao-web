# M4-03 allowed-copy inventory

## 冻结来源

- 用户可见业务文字、导航、CTA、Section 顺序和可访问名称以基线提交 `2583ff4` 与 `tests/visual-style-contract.test.tsx` 的 M4-02 fixture 为准。
- M4-03 不把概念图中的生成文字、Logo、数据、指标、控件或产品界面作为文案来源。
- 唯一新增的可见非业务文字是 provisional 素材叠层，格式严格为 `建议尺寸 {width}×{height}`。
- 唯一新增的可访问名称是下表 17 个注册表 `alt`；图片失败态复用同一 `alt`，不新增失败文案。

## 获准素材替代文本

| ID | 获准 `alt` |
| --- | --- |
| `home-hero` | K-Link 从内容触达到持续连接的可信增长网络结构示意 |
| `home-tool-content` | 内容工具从信息整理到社群分享的结构示意 |
| `home-tool-showcase` | 展示工具连接个人信息与传播素材的结构示意 |
| `home-tool-team` | 团队工具连接品牌内容与成员协作的结构示意 |
| `home-tool-growth` | 引流工具连接资源发现与社群触达的结构示意 |
| `feature-today-hotspot` | 今日热点内容聚合与分享路径结构示意 |
| `feature-daily-health` | 每日健康内容整理与持续传播结构示意 |
| `feature-future-weekly` | 未来周报内容编排与周期触达结构示意 |
| `feature-business-insight` | 商业洞察信息组织与观点传播结构示意 |
| `feature-digital-card` | 数字名片信息呈现与连接路径结构示意 |
| `feature-promotion-poster` | 推广海报内容组合与分享路径结构示意 |
| `feature-brand-journal` | 品牌专刊统一内容与成员传播结构示意 |
| `feature-team-mini-program` | 团队小程序连接品牌、成员与访客的结构示意 |
| `feature-resource-market` | 资源集市分类发现与需求连接结构示意 |
| `feature-network-circle` | 人脉社群圈关系发现与社群连接结构示意 |
| `team-hero` | 团队内容、成员协作与品牌传播关系网络示意 |
| `media-hero` | 客来宝媒体从专业表达连接公开传播渠道的生态示意 |

## 明确禁止

- 新营销口号、指标、排名、价格、评价、客户或媒体 Logo、人物、办公室、Dashboard、结果或收益暗示。
- 复制 `docs/2-Design/assets/m4-03/concepts/` 图片内生成的文字、图标名称、数据和产品界面。
- 加载失败时显示新文案、远程兜底图片或改变相邻业务内容。

## 验证

- `tests/visual-style-contract.test.tsx` 单独排除且只排除 `.visual-asset-slot__size` 后继续冻结基线文案。
- `tests/m4-03-visual-system.test.tsx` 固定 17 个 ID、`alt`、尺寸、状态、路径和页面接线，并覆盖非法值与失败态。
