import type {
  DirectSalesSituation,
  ProfessionDefinition,
  RepresentativeSample,
  ServiceDefinition,
  WorkingStandard,
  WorkflowStep,
} from "@/types/site";

export const BRAND = {
  name: "客来宝",
  productName: "K-Link",
  mediaName: "客来宝媒体",
  descriptor: "K-Link 一站式拓客工具系统",
  promise: "内容赋能 · 资源链接 · 商机互联",
  primaryAudience: "希望长期建设个人专业表达的合法直销从业者",
  secondaryAudience: "其他需要审慎表达的个人专业人士",
  positioning:
    "从个人定位、专业介绍与 FAQ，到内容主题、发布素材和复盘节奏，形成真实、一致、可持续的专业表达。",
} as const;

export const PRIMARY_NAVIGATION = [
  { label: "首页", href: "/" },
  { label: "核心工具", href: "/features" },
  { label: "团队方案", href: "/team" },
  { label: "媒体服务", href: "/media" },
  { label: "新闻动态", href: "/news" },
  { label: "关于我们", href: "/about" },
] as const;

export const GLOBAL_CTA = {
  label: "咨询媒体报道",
  href: "/about#contact",
  secondaryLabel: "查看交付样例",
  secondaryHref: "/media#samples",
} as const;

export const GLOBAL_CLAIMS_BOUNDARY =
  "客来宝坚持真实表达、清晰合作与尊重授权，并与客户共同维护合理、透明的成果预期。";

export const FEATURE_JOURNEY_STAGES = [
  "曝光",
  "获客",
  "信任",
  "成交",
  "沉淀",
] as const;

export const FEATURE_GROUPS = [
  {
    title: "内容工具",
    summary: "围绕每天可持续分享的主题，减少重复找选题和整理素材的成本。",
    tools: [
      {
        title: "今日热点",
        purpose: "从公开热点中找到适合继续核验的内容方向。",
        scenario: "准备当天社群话题或个人内容时使用。",
        boundary: "发布前仍需核验来源、时效和适用范围。",
      },
      {
        title: "每日健康",
        purpose: "按稳定栏目组织通用健康知识主题。",
        scenario: "需要长期维护健康教育内容节奏时使用。",
        boundary: "不替代医疗建议，也不宣传未经确认的产品功效。",
      },
      {
        title: "未来周报",
        purpose: "用周度结构整理值得持续观察的话题。",
        scenario: "为社群或个人主页规划一周内容时使用。",
        boundary: "内容用于信息整理，不构成结果预测或专业建议。",
      },
      {
        title: "商业洞察",
        purpose: "把行业信息整理成便于理解和转发的观察。",
        scenario: "需要说明趋势背景和个人观点时使用。",
        boundary: "观点必须与事实区分，不承诺经营或收入结果。",
      },
    ],
  },
  {
    title: "展示工具",
    summary: "把已确认的身份、内容和活动信息整理成清晰的对外展示。",
    tools: [
      {
        title: "数字名片",
        purpose: "集中说明个人身份、服务方向和已批准内容。",
        scenario: "初次认识或需要统一个人介绍时使用。",
        boundary: "官网只介绍该产品能力，不提供名片编辑或访客数据。",
      },
      {
        title: "推广海报",
        purpose: "把获批准的主题和活动信息组织成便于分享的版式。",
        scenario: "需要在社群中清晰传递单一信息时使用。",
        boundary: "素材、身份和活动信息仍由使用者确认授权与真实性。",
      },
    ],
  },
  {
    title: "团队工具",
    summary: "让已批准的团队内容和品牌表达具有可重复使用的结构。",
    tools: [
      {
        title: "品牌专刊",
        purpose: "以稳定栏目组织团队的品牌内容和经验材料。",
        scenario: "团队需要统一对外表达和内容节奏时使用。",
        boundary: "不代表所属企业背书，公开前仍需完成必要审核。",
      },
      {
        title: "团队小程序",
        purpose: "为团队提供统一的内容与体验入口。",
        scenario: "团队希望成员使用一致入口开展分享时使用。",
        boundary: "官网不提供团队登录、成员管理或业务数据页面。",
      },
    ],
  },
  {
    title: "引流工具",
    summary: "帮助用户发现可交流的资源与社群场景，后续关系由用户自行维护。",
    tools: [
      {
        title: "资源集市",
        purpose: "按主题呈现可进一步了解和交流的资源线索。",
        scenario: "需要寻找互补资源或新的沟通切入点时使用。",
        boundary: "不保证线索、客户、合作或成交结果。",
      },
      {
        title: "人脉社群圈",
        purpose: "支持在合适的社群场景中持续分享与建立联系。",
        scenario: "需要拓展交流范围并维护长期关系时使用。",
        boundary: "关系与私域数据由用户自行管理，官网不收集客户名单。",
      },
    ],
  },
] as const;

export const TEAM_CHALLENGES = [
  {
    title: "团队经验难复制",
    description: "优秀成员的做法分散在个人经验中，新成员很难获得一致、可执行的参考。",
  },
  {
    title: "品牌传播乱",
    description: "成员各自准备介绍和素材，对外信息容易出现版本、重点与视觉不一致。",
  },
  {
    title: "成员留存低",
    description: "缺少持续可用的内容和启动节奏，成员加入后难以建立稳定行动习惯。",
  },
  {
    title: "管理缺数据",
    description: "团队需要理解分享反馈，但不能以虚构看板或未经授权的数据代替真实观察。",
  },
] as const;

export const TEAM_PRODUCT_CAPABILITIES = [
  {
    title: "品牌专刊",
    description: "沉淀经确认的团队主题、品牌内容与经验材料，形成统一表达入口。",
  },
  {
    title: "团队小程序",
    description: "为团队成员提供一致的内容入口和使用路径，降低重复准备成本。",
  },
  {
    title: "成员分享归属",
    description: "在产品规则内说明分享来源，让团队能够理解内容如何被成员使用。",
  },
  {
    title: "访客反馈",
    description: "在产品能力范围内提供反馈线索，帮助团队调整内容与启动方式。",
  },
] as const;

export const TEAM_DELIVERY_GUARANTEES = [
  {
    title: "需求诊断",
    description: "先确认团队规模、现有内容、使用场景和审核要求，再确定适合的启动范围。",
  },
  {
    title: "内容策划",
    description: "围绕真实材料建立首批主题、栏目和使用说明，不用虚构案例填充内容。",
  },
  {
    title: "团队启动",
    description: "通过明确的角色、步骤和检查点帮助成员开始使用，并留下后续复盘方法。",
  },
] as const;

export const ABOUT_SECURITY_PRINCIPLES = [
  {
    title: "服务端处理",
    description: "后台、询盘和内容发布由服务端处理，浏览器不持有数据库或云服务长期凭据。",
  },
  {
    title: "最小信息",
    description: "联系信息只用于回应当前需求，不进入 URL、浏览器持久存储或公开内容。",
  },
  {
    title: "清晰边界",
    description: "K-Link 产品说明、客来宝媒体咨询和官网管理能力保持独立语义与权限边界。",
  },
] as const;

export const DIRECT_SALES_SITUATIONS = [
  {
    number: "01",
    title: "个人介绍总在变化",
    problem:
      "身份、经历、服务方式和产品信息混在一起，不同场合使用不同说法，别人仍说不清您的专业重点。",
    outcome:
      "形成一套以真实经历和服务对象为基础的定位底稿，让主页、微信介绍和沟通资料保持一致。",
  },
  {
    number: "02",
    title: "内容长期围绕产品",
    problem:
      "有持续分享的意愿，却缺少能体现个人经验、服务过程和长期价值的稳定内容主题。",
    outcome:
      "建立知识、服务过程与常见问题组成的内容结构，让表达不依赖单一产品或短期活动。",
  },
  {
    number: "03",
    title: "发布前缺少检查方法",
    problem:
      "素材来源、功效表述、客户反馈和所属企业规则没有统一检查节点，内容反复修改。",
    outcome:
      "把事实核验、授权和企业审核写进工作流程，形成可重复使用的发布前检查表。",
  },
] as const satisfies readonly DirectSalesSituation[];

export const REPRESENTATIVE_SAMPLES = [
  {
    id: "positioning-brief",
    number: "01",
    title: "个人定位摘要",
    summary:
      "把服务对象、真实经历、专业主题与表达边界整理成一页可复用底稿。",
    previewItems: ["服务对象", "真实经历", "专业主题", "表达边界"],
    useCases: ["个人主页", "微信自我介绍", "活动简介"],
    isIllustrative: true,
    disclaimer: "示例结构，不代表真实客户案例或效果证明。",
  },
  {
    id: "content-map",
    number: "02",
    title: "90 天内容主题图",
    summary:
      "围绕长期主题、常见问题和内容形式安排阶段重点，并预留复盘节点。",
    previewItems: ["核心主题", "FAQ", "图文与短视频", "复盘节点"],
    useCases: ["选题规划", "素材准备", "阶段复盘"],
    isIllustrative: true,
    disclaimer: "示例结构，不代表真实客户案例或效果证明。",
  },
  {
    id: "review-checklist",
    number: "03",
    title: "FAQ 与发布前检查表",
    summary:
      "在发布前核对事实来源、适用范围、敏感表述、授权和必要审核。",
    previewItems: ["事实来源", "适用范围", "敏感表述", "企业审核"],
    useCases: ["FAQ", "社交内容", "介绍资料"],
    isIllustrative: true,
    disclaimer: "示例结构，不代表真实客户案例或效果证明。",
  },
] as const satisfies readonly RepresentativeSample[];

export const WORKING_STANDARDS = [
  {
    number: "01",
    title: "从真实材料开始",
    description:
      "以可核验的经历、公开信息和已获授权材料为基础，信息不足时先补事实。",
  },
  {
    number: "02",
    title: "关键口径书面确认",
    description:
      "定位、服务范围、内容主题和公开表述在进入下一阶段前留有清晰确认记录。",
  },
  {
    number: "03",
    title: "把边界写进过程",
    description:
      "提前标明事实来源、适用范围、授权与所属企业审核节点，减少发布前反复。",
  },
  {
    number: "04",
    title: "交付能够继续维护",
    description:
      "不只给一次文案，同时说明结构、复用方式与后续复盘方法。",
  },
] as const satisfies readonly WorkingStandard[];

export const SERVICES = [
  {
    id: "positioning",
    number: "01",
    name: "专业定位与个人形象",
    summary:
      "把经历、服务对象与专业价值整理成一套可核验、能长期复用的表达底稿。",
    clientSituation:
      "个人介绍经常变化，团队内外口径不一致，别人仍说不清您能提供什么帮助。",
    outcome:
      "形成可供主页、社交介绍和沟通资料共同使用的个人定位系统。",
    scope: [
      "梳理服务对象、职业场景与专业标签",
      "整理个人介绍、经验表达与信任信息",
      "建立适合长期使用的核心表达框架",
      "提供资料组织与基础视觉方向建议",
    ],
    deliverables: ["定位摘要", "个人简介", "核心表达框架", "资料使用建议"],
    clientInputs: [
      "真实从业经历与当前身份信息",
      "现有简介、主页或常用沟通材料",
      "所属企业或机构的公开表达规则",
    ],
    useCases: ["个人主页", "微信自我介绍", "活动简介", "内容账号简介"],
    limitations: [
      "不虚构经历、资质、客户关系或机构背书",
      "最终公开信息需由客户确认真实性与适用性",
    ],
  },
  {
    id: "content-assets",
    number: "02",
    name: "内容资产建设",
    summary:
      "把零散想法变成有来源、有边界、能持续维护的主题与内容结构。",
    clientSituation:
      "选题依赖临时灵感，介绍资料、FAQ、图文和短视频之间缺少统一口径。",
    outcome:
      "形成能持续复用的主题体系、内容结构和发布前检查方式。",
    scope: [
      "建立专业主题与常见问题结构",
      "规划图文、短视频与介绍资料的内容口径",
      "整理基础素材清单与复用方式",
      "明确需由客户或所属机构审核的内容",
    ],
    deliverables: ["内容主题库", "示例内容", "FAQ", "发布素材结构", "维护说明"],
    clientInputs: [
      "常见客户问题与日常沟通记录",
      "已有文章、视频、演示或介绍资料",
      "可引用的信息来源与审核要求",
    ],
    useCases: ["内容选题", "FAQ", "图文与短视频", "介绍资料"],
    limitations: [
      "公开内容仍需客户及所属机构按适用规则审核",
      "不替代产品、金融、保险或法律专业审查",
    ],
  },
  {
    id: "ongoing-advisory",
    number: "03",
    name: "持续推广顾问",
    summary:
      "围绕渠道、节奏与复盘建立稳定表达方式，让已有内容持续发挥作用。",
    clientSituation:
      "已有基础资料和内容，但发布节奏不稳定，也缺少判断下一阶段重点的方法。",
    outcome:
      "形成阶段计划、执行节奏和可回看的复盘记录，持续改善表达清晰度。",
    scope: [
      "梳理适合当前阶段的渠道与内容节奏",
      "建立阶段计划与内容日历建议",
      "观察公开数据并进行人工复盘",
      "提出下一阶段的内容与推广调整建议",
    ],
    deliverables: ["阶段计划", "内容日历建议", "复盘记录", "下一阶段建议"],
    clientInputs: [
      "当前使用的公开渠道与更新节奏",
      "可用时间、素材和协作资源",
      "公开内容表现与真实反馈",
    ],
    useCases: ["阶段计划", "内容日历", "执行协作", "复盘记录"],
    limitations: [
      "不代替客户或所属机构发布全部内容",
      "不保证平台分发、流量、好友数量、客户数量、成交或收入",
    ],
  },
] as const satisfies readonly ServiceDefinition[];

export const WORKFLOW_STEPS = [
  {
    id: "understand",
    number: "01",
    title: "了解现状",
    description: "人工了解职业背景、服务对象、已有资料、机构规则与当前难题。",
    deliverable: "现状与资料清单",
  },
  {
    id: "position",
    number: "02",
    title: "确定定位",
    description: "确认可以真实支持的专业方向、表达重点与边界，再明确合作范围。",
    deliverable: "定位与范围摘要",
  },
  {
    id: "build",
    number: "03",
    title: "建设内容",
    description: "围绕个人介绍、主题、FAQ、图文与视频结构形成可持续维护的资产。",
    deliverable: "内容与素材结构",
  },
  {
    id: "promote",
    number: "04",
    title: "规划推广",
    description: "根据实际渠道和资源安排节奏、发布建议与必要的审核节点。",
    deliverable: "阶段行动建议",
  },
  {
    id: "review",
    number: "05",
    title: "阶段复盘",
    description: "结合真实反馈回看表达是否清晰、内容是否可执行，并提出下一步调整。",
    deliverable: "复盘与调整记录",
  },
] as const satisfies readonly WorkflowStep[];

export const PROFESSIONS = [
  {
    id: "direct-sales",
    name: "直销从业者",
    shortName: "直销",
    heroTitle: "把真实从业经验，整理成长期可用的专业表达",
    lead: "从个人介绍、服务方式和常见问题开始，逐步建设能持续维护的内容资产，并把事实核验、授权与所属企业审核写进过程。",
    scenarios: [
      "已有真实从业经历，但个人介绍缺少统一重点",
      "希望持续分享知识与服务过程，又担心表达越界",
      "资料分散，团队内外使用的个人口径不一致",
    ],
    commonProblems: [
      "把身份、经验和服务方式一次塞进简介，读者仍不知道你能帮助什么",
      "内容长期围绕产品或机会，缺少可验证的个人专业价值",
      "缺少发布前的素材真实性与规则检查清单",
    ],
    serviceFit: [
      { serviceId: "positioning", description: "梳理真实经历、服务对象和专业标签，建立一致的个人介绍。" },
      { serviceId: "content-assets", description: "建设以知识、服务过程和常见问题为核心的内容主题与素材结构。" },
      { serviceId: "ongoing-advisory", description: "在机构与适用规则内规划发布节奏，定期回看表达质量。" },
    ],
    contentAssets: ["个人介绍与服务说明", "常见问题与沟通素材", "知识型图文主题", "短视频表达框架", "发布前检查清单"],
    boundaries: [
      "不宣传未经确认的产品功效",
      "不宣传收入机会、团队收益或发展下线结果",
      "不使用快速致富、轻松成功等结果暗示",
    ],
    responsibilities: [
      "确认自身从业身份与对外表达符合适用规则",
      "保证经历、素材、产品信息与客户反馈真实且已获授权",
      "按照所属企业或机构要求完成最终发布审核",
    ],
    disclaimer: "本页仅说明个人专业表达与内容服务，不构成对任何直销产品、功效、收入机会或团队发展的推荐或保证。",
  },
  {
    id: "insurance",
    name: "保险经纪人与保险从业者",
    shortName: "保险",
    heroTitle: "围绕服务过程与专业教育，建设清晰一致的个人表达",
    lead: "把专业背景、服务过程与教育型内容整理成可持续维护的结构，同时保留产品比较、投保建议、收益演示与机构审核的必要边界。",
    scenarios: [
      "希望说明自己的专业方法，却不想把主页变成产品目录",
      "积累了客户常见问题，但缺少适合公开表达的教育型结构",
      "需要统一个人内容与所属机构审核要求之间的协作方式",
    ],
    commonProblems: [
      "个人介绍只剩机构和职位，缺少服务对象、过程与专业特点",
      "教育内容与个性化投保建议混在一起，读者难以识别边界",
      "资料缺少来源、适用范围和审核责任说明",
    ],
    serviceFit: [
      { serviceId: "positioning", description: "围绕专业背景、服务对象和服务过程建立可信且可核验的个人表达。" },
      { serviceId: "content-assets", description: "建设保险教育主题、FAQ 与服务流程资料，明确何处需要机构审核。" },
      { serviceId: "ongoing-advisory", description: "规划持续教育内容的节奏与复盘，不触碰个性化方案和结果承诺。" },
    ],
    contentAssets: ["专业介绍与服务流程", "保险教育主题库", "常见问题与边界说明", "图文/视频结构", "机构审核清单"],
    boundaries: [
      "不提供具体保险产品比较或投保建议",
      "不进行收益演示或保险结果保证",
      "不替代持牌机构、保险公司或所属机构审核",
    ],
    responsibilities: [
      "确认自身资质、所属机构规则与允许使用的身份表述",
      "保证产品、条款、案例和客户素材真实且已获授权",
      "由本人及所属机构完成最终内容与销售行为审核",
    ],
    disclaimer: "本页内容不构成保险产品推荐、投保建议、利益演示或法律意见，具体保险事项应由具备相应资格的主体按适用规则处理。",
  },
  {
    id: "securities",
    name: "证券经纪人与证券从业者",
    shortName: "证券",
    heroTitle: "把专业背景与投资者教育内容，整理成长期表达体系",
    lead: "围绕专业背景、服务流程与通用投资者教育建设可维护的内容资产，并明确证券推荐、交易时点、收益预测与个性化投资建议的边界。",
    scenarios: [
      "希望长期开展投资者教育，但个人内容缺少稳定主题和边界",
      "专业经历丰富，却难以用公众可理解的语言说明服务方式",
      "需要把内容规划、来源检查和机构审核形成固定流程",
    ],
    commonProblems: [
      "用行情结论替代专业方法，容易让内容被理解为交易建议",
      "教育内容没有说明适用范围、信息来源与时效",
      "个人主页与机构允许的身份、业务和材料口径不一致",
    ],
    serviceFit: [
      { serviceId: "positioning", description: "梳理专业背景、投资者教育方向与服务边界，形成一致个人介绍。" },
      { serviceId: "content-assets", description: "建设通用教育主题、FAQ、材料来源和审核说明，不输出个性化结论。" },
      { serviceId: "ongoing-advisory", description: "规划教育内容节奏和复盘机制，持续检查信息时效与表达边界。" },
    ],
    contentAssets: ["专业介绍与教育方向", "投资者教育主题库", "信息来源与时效说明", "图文/视频结构", "发布审核清单"],
    boundaries: [
      "不提供证券推荐或具体买卖时点",
      "不提供收益预测、投资组合或个性化投资建议",
      "不代表证券公司、持牌机构或监管机构作出判断",
    ],
    responsibilities: [
      "确认自身资质、业务范围与所属机构对外表达规则",
      "核验公开信息来源、时效、授权和适用范围",
      "由本人及所属机构完成最终内容和发布审核",
    ],
    disclaimer: "本页内容仅涉及个人专业表达与通用投资者教育内容建设，不构成证券推荐、交易建议、收益预测、投资组合或个性化投资建议。",
  },
] as const satisfies readonly ProfessionDefinition[];

export const ABOUT_PRINCIPLES = [
  {
    title: "真实材料",
    description: "围绕可核验的经历、公开信息和已授权材料建立表达，信息不足时先补充事实。",
  },
  {
    title: "清晰确认",
    description: "定位、服务范围和公开口径在进入下一阶段前形成清晰、可回看的确认记录。",
  },
  {
    title: "共同完成",
    description: "通过访谈、资料梳理和逐步确认形成内容，不把关键判断交给自动模板。",
  },
  {
    title: "长期维护",
    description: "交付的不只是一次文案，同时包含能继续使用的结构、说明和复盘方式。",
  },
] as const;

export const ABOUT_FIT = [
  "希望把真实从业经历整理成清晰、统一的个人介绍",
  "需要建立稳定的内容主题、FAQ 与发布素材结构",
  "愿意提供事实材料并完成所属企业或机构要求的审核",
  "希望通过长期维护改善表达，而不是追求一次性包装",
] as const;

export const ABOUT_NOT_FIT = [
  "希望虚构经历、资质、客户关系或机构背书",
  "要求保证流量、客户、成交、收入或其他职业结果",
  "要求代替本人或所属企业承担最终发布与专业审核责任",
  "寻找固定模板、自动代运营、金融建议或产品销售方案",
] as const;

export function getProfession(id: string) {
  return PROFESSIONS.find((profession) => profession.id === id);
}

export function getService(id: string) {
  return SERVICES.find((service) => service.id === id);
}
