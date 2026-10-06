# FR-21 文档评审报告

> 评审对象：`D:\code\tokengate\products\kelaibao\docs\1-Requirement\Mainland-Website-FR\FR-21-public-site-complete-visual-system-and-replaceable-assets.md`

## 结论

共识别 2 项可改进问题（均为非阻塞）。

| Severity | Type | Location | Issue | Evidence | Recommendation |
|---|---|---|---|---|---|
| Medium | Consistency | 文档头部“前置依赖/门禁”与“高层要求”段落 | 流程门禁存在双重命名（`FR-19` 与 `M4-01`）且未说明等价或层级关系，可能引发排期/验收边界误判。 | 头部写明“前置依赖... `FR-19` / `sprint-m4-01`”；高层要求写“`M4-01` 是强制流程门禁...”。 | 在同一处统一门禁标识（统一为 FR 或 M4 标识），并补充一行映射说明（如“FR-19 即 M4-01”）以便评审一致。 |
| Low | Requirement | 第三部分“字体系统” | 文档要求“使用稳定的系统中文字体栈”，但该段只列出字号/行高/字重，未给出明确 `font-family` 套件，实施时可能出现字体选择分歧。 | “不引入远程 WebFont，使用稳定的中文字体栈。”与该段字体表仅包含 H1/H2/H3/... 规格。 | 增补统一字体栈定义（如 `-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', ...`）及适用作用域（全局/标题/正文变量），确保跨页面一致性。 |

### Checks

| Check | Result |
|---|---|
| 关键交叉引用与图片资源路径存在性 | 已检查 10 个关键引用，均可定位到 `D:\code\tokengate\products\kelaibao\docs\2-Design` 下对应文件与图片 |
| 文档一致性扫描（范围/范围外约束、文字不变、路由稳定、替换素材机制） | 存在完整闭环，无互斥条件冲突 |
