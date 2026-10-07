# CMS 仅 HTML 编辑 Review Confirm

日期：2026-10-07。方式：实施者静态复核已确认用户要求、FR-24/11/12、M5-04 历史文档及当前调用图；不声称独立代码评审。

确认：新建/编辑共享同一组件，彻底删除可视化需同步改为 HTML；五个 Tiptap 依赖及 htmlparser2 直接使用仅属于可视化模块，可移除。imageHtml 为仍保留的上传能力服务，不删上传/封面/服务端 sanitizer；专用可视化测试删除，既有安全、事务、会话和保存行为测试继续有效。textarea 不执行原始 HTML，避免活动 DOM；保持 Navigation API 与防丢稿契约。

APPROVED_FOR_IMPLEMENTATION：目标 FR、当前设计与补充计划已写回本次 HTML-only 规则，用户已经明确授权清理代码及测试，可实施。保留历史验收记录并使用新记录报告当前能力。

## 实施后复核

实施者已静态复核最终差异及检索，既有安全/状态机边界保持有效。实际测试、类型、构建、四视口及生命周期结果见 `docs/5-Evidence/cms-html-only-editor/README.md`。不声称独立代码评审，未执行生产部署。
