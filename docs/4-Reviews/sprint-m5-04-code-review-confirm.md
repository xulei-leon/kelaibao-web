# Sprint M5-04 代码评审确认

日期：2026-09-24。输入为 `sprint-m5-04-code-review-by-native.md`、`sprint-m5-04-code-review-by-gpt-5.6-sol.md`，对照 FR-24、Sprint M5-04 与当前实现逐项确认。先记录本确认，再执行评审驱动修复。

| 编号 | Severity | Type | 评论 | 决策 | 依据与后续动作 |
| --- | --- | --- | --- | --- | --- |
| S1 | High | Build | Testing Library exact 属性导致类型错误 | Accept | ByRoleOptions 不接受 exact；使用完整名称匹配，重跑 lint/build。 |
| N1 | High | Correctness | 浏览器历史导航绕过离开保护 | Accept | beforeunload/click 不覆盖 App Router 同文档 traverse；新增 Navigation API 阻断，不支持的引擎在输入前保持只读，真实浏览器取消后保留路由和正文。 |
| S2 | High | Correctness | 后退/前进丢稿 | Accept | 与 N1 同一缺陷，共用修复，测试历史导航和正常保存后离开。 |
| S3 | High | Reliability | 未决 intent 未纳入离开保护 | Accept | 上传组件状态确实独立于 dirty；上报未完成的文件/说明/intent，纳入离开保护，提供显式放弃，成功后清除；增加组件及集成测试。 |
| S4 | Medium | Reliability | 自动重试不覆盖租约且忽略 Retry-After | Partial | 已确认契约明确最多三次且提供手动恢复，因此不延长全局冻结至两分钟，不增加状态接口；接受遵守 Retry-After，设置有界等待并测试丢响应→处理中→完成，超出次数继续保留 intent。租约只控制并发认领，不要求所有客户端等待整个租约。 |
| N2 | Medium | Reliability | 历史请求无截止时间冻结编辑 | Accept | 使用独立只读加载状态及 15 秒截止时间覆盖 response/body；失败保留正文，不锁住保存/会话恢复，增加挂起响应测试。 |
| N3（复核） | Medium | Correctness | 旧浏览器历史菜单可跳过 sentinel | Accept | 实测发现 popstate 哨兵补偿不能可靠阻止 Next.js 已开始的恢复，因此撤回此方案。最终使用 Navigation API；缺少该 API 的浏览器明确提示并禁用全部编辑/上传控件，只读查看，不产生无法保护的新稿。原 reviewer 最终复核接受该边界；补只读测试和真实浏览器模拟。 |

结论：以上修复已完成；76 文件 / 416 项测试、lint、build、standalone smoke 与浏览器验收通过，详情见 ../5-Evidence/m5-04/README.md。额外通过行为测试关闭旧初始化响应覆盖新输入的问题。真实 OSS/RDS/ESA 验证不由本地 fixture 代替。
