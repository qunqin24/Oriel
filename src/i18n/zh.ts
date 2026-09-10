/**
 * 中文文案，同时也是字典的形状定义（en.ts 必须与它逐键对齐，由 TS 强制）。
 *
 * 数据本身（模型名、厂商名）一律不翻译——它们是专有名词，翻了反而查不到。
 * 这里只翻界面。
 */
export const zh = {
  site: {
    name: "Oriel",
    tagline: "机器智能的观察窗口",
    description:
      "独立追踪 586 款语言模型与 11 个媒体竞技场的能力、价格与速度，每日快照，记录变化。",
  },

  nav: {
    home: "观测台",
    models: "语言模型",
    changes: "变化",
    media: "媒体",
    catBoard: "猫榜",
    compare: "对比",
    about: "方法",
  },

  rail: {
    snapshot: "快照",
    models: "模型",
    vendors: "厂商",
    indexVersion: "指数版本",
    source: "数据来源",
    sourceName: "Artificial Analysis",
    theme: "切换深浅",
    trend: "近期收录量",
  },

  home: {
    frontierTitle: "能力前沿",
    frontierAxis: "智能指数 × 发布日期",
    frontierNote: "每个点是一个模型，金线是当时的能力上界",
    frontierEmpty: "没有足够的模型数据画出前沿",
    recentChanges: "近期变化",
    allChanges: "全部变化",
    topBoard: "智能指数",
    fullBoard: "完整榜单",
    mediaTitle: "媒体竞技场",
    mediaNote: "图像、视频、语音与音乐，按 Elo 排名",
    viewAll: "查看全部",
  },

  models: {
    title: "语言模型",
    lead: "按智能、编程、智能体、性价比与速度筛选，全部条件写进网址，可直接分享。",
    search: "搜索模型或厂商",
    searchLabel: "搜索",
    vendor: "厂商",
    clearFilters: "清除筛选",
    ofTotal: "共",
    empty: "没有模型符合当前条件",
    emptyHint: "试着放宽厂商筛选或换个关键词。",
    coverage: "有此项数据",
    coverageHint: "该维度只有部分模型被评测，未评测的模型不参与排名。",
    dims: {
      overview: "总览",
      intelligence: "智能",
      coding: "编程",
      agentic: "智能体",
      value: "性价比",
      speed: "速度",
    },
    cols: {
      name: "模型",
      creator: "厂商",
      intelligence: "智能",
      coding: "编程",
      agentic: "智能体",
      value: "性价比",
      priceIn: "输入价",
      priceOut: "输出价",
      speed: "吞吐",
      ttft: "首字延迟",
      release: "发布",
    },
    units: {
      perMillion: "每百万 token",
      tokensPerSecond: "token/秒",
    },
  },

  model: {
    released: "发布于",
    firstSeen: "Oriel 收录于",
    rankAmong: "在 {total} 个有此项数据的模型中排第 {rank}",
    noData: "未评测",
    noDataHint: "Artificial Analysis 尚未发布该模型的这项数据。",
    radarTitle: "能力画像",
    radarNote: "五维对比全站均值",
    radarAverage: "全站均值",
    radarPartial: "部分维度暂无评测数据，已在图上标出",
    intelligence: "智能指数",
    coding: "编程指数",
    agentic: "智能体指数",
    pricing: "价格",
    performance: "性能",
    priceIn: "输入",
    priceOut: "输出",
    cacheHit: "缓存命中",
    cacheWrite: "缓存写入",
    throughput: "输出吞吐",
    ttft: "首字延迟",
    ttfat: "首个答案 token",
    e2e: "端到端响应",
    trajectory: "历史轨迹",
    trajectoryThin: "历史积累中——需要更多天数才能画出趋势",
    trajectoryFlat: "{days} 天记录内无变化",
    trajectoryRange: "{days} 天记录",
    alternatives: "更省的同级选择",
    alternativesNote: "智能指数接近但输出价更低的模型",
    alternativesEmpty: "没有找到更省的同级模型",
    backToBoard: "返回榜单",
  },

  changes: {
    title: "变化",
    lead: "每天与前一日快照对比，记录新增、下架、分数与价格的变动。",
    empty: "还没有记录到变化",
    emptyHint: "历史从第二个快照开始才有对比对象。",
    types: {
      added: "新增",
      removed: "下架",
      score: "分数",
      price: "价格",
    },
    metrics: {
      intelligence: "智能指数",
      coding: "编程指数",
      agentic: "智能体指数",
      priceIn: "输入价",
      priceOut: "输出价",
      throughput: "输出吞吐",
      latency: "首字延迟",
    },
    firstScore: "首次评测",
    withdrawn: "指标撤下",
    eventCount: "条变化",
  },

  media: {
    title: "媒体竞技场",
    lead: "图像、视频、语音与音乐模型的人类偏好排名。Elo 带 95% 置信区间，区间重叠即代表名次差异不显著。",
    elo: "Elo",
    ci: "95% 置信区间",
    ciNote: "误差条重叠的模型，排名先后没有统计意义",
    score: "得分",
    wer: "词错误率指数",
    werNote: "越低越好",
    tieCaveat: "有 {count} 个模型在已发布的精度下并列最优，这份榜单区分不了它们的先后。",
    expand: "展开全部 {count} 个",
    collapse: "收起",
    boards: {
      textToImage: "文生图",
      imageEditing: "图像编辑",
      textToVideo: "文生视频",
      imageToVideo: "图生视频",
      textToVideoAudio: "文生视频（含声）",
      imageToVideoAudio: "图生视频（含声）",
      textToSpeech: "文本转语音",
      speechToSpeech: "语音对话",
      speechToText: "语音转文本",
      musicInstrumental: "纯音乐",
      musicWithVocals: "带人声音乐",
    },
  },

  compare: {
    title: "对比",
    lead: "最多并排四个模型。每行的最优值以金色标出。",
    empty: "还没有选择模型",
    emptyHint: "在榜单或模型页点「加入对比」。",
    browse: "去榜单选择",
    add: "加入对比",
    added: "已加入",
    remove: "移除",
    clear: "全部清除",
    full: "最多对比 4 个模型",
    tray: "对比栏",
    open: "查看对比",
    radarTitle: "能力画像",
    radarNote: "五维叠加对比",
    radarAverage: "全站均值",
    radarHint: "收缩到圆心的顶点表示该模型未测这一项",
  },

  about: {
    title: "方法",
    lead: "Oriel 不做评测，只做记录与呈现。所有数据来自 Artificial Analysis，下面说明这些数字是什么、以及哪些地方需要谨慎解读。",

    sourceTitle: "数据来源",
    sourceBody:
      "全部数据来自 Artificial Analysis 的公开 API，每天北京时间凌晨 5 点抓取一次，直接提交进本站仓库。Oriel 自己不跑任何评测，也不对分数做加权、修正或重新标定——你在这里看到的数字和上游发布的一致。",

    indexTitle: "智能指数",
    indexBody:
      "智能指数是 Artificial Analysis 把多项基准测试合成的单一分数，当前为 v{version}。关键的一点：**不同版本的分数不可比较**。上游换版时会重新标定全部模型，所以本站的趋势线在版本边界会断开，而不是连成一条看起来平滑但没有意义的曲线；同理，跨版本的分数变动也不会计入变化流。",

    valueTitle: "性价比怎么算",
    valueFormula: "性价比 = 可用评测分的平均值 ÷ 每百万输出 token 价格",
    valueBody:
      "这是 Oriel 自己的推导，不是上游数据。只有当模型至少有两项评测分、且有输出价时才计算——只有一项分数时这个比值噪音太大，一个只测过智能指数的便宜小模型会凭空登顶。它衡量的是「每块钱买到多少分」，不代表这个模型适合你的场景。",

    coverageTitle: "覆盖率",
    coverageBody:
      "{total} 款语言模型里，只有一部分被测过每一项。智能指数 {intelligence}、编程 {coding}、智能体 {agentic}、价格 {price}、性能 {performance}。破折号的意思是「没测」，不是「测得差」——这两件事完全不同，所以本站在选定某个维度时会把没有该项数据的模型移出榜单，而不是让你对着几百行破折号猜。",

    historyTitle: "历史",
    historyBody:
      "每日快照从 {first} 开始积累，目前 {days} 天。更早的数据是从本仓库的 git 历史里回填的——在此之前每天的抓取都直接覆盖了前一天。历史还很短，趋势图和变化流需要几周才会真正有料；数据点不足时它们会明说，而不是画一条误导性的线。",

    arenaTitle: "竞技场排名",
    arenaBody:
      "媒体榜单是人类两两对比投票算出的 Elo，附带 95% 置信区间。**误差条重叠的模型之间，名次先后没有统计意义**——第 3 名和第 7 名可能根本分不出高下。本站把误差条画出来就是为了让这件事看得见，而不是只给一列干净的名次。",

    limitsTitle: "已知局限",
    limitsBody:
      "语音转文本榜的词错误率指数只发布到 1 位小数，大量模型并列在同一个值上，那份榜单实际排不出先后，本站会在页面上标出并列数量。性能数据（吞吐、延迟）是特定时间从特定线路测得的中位数，会随服务商的负载和你的地理位置变化。价格只算基础 token 计费，不含批量折扣、承诺用量或缓存策略带来的实际差异。",
  },

  catBoard: {
    title: "猫榜",
    lead: "民间自费评测，个人独立维护、非官方、非 Oriel 自测。题库不公开且每月滚动更新，仅从一个侧面观察模型的长期变化趋势，不够权威全面，不可盲信。",
    sourceNote: "数据来源",
    sourceLinkLabel: "llm2014/llm_benchmark",
    siteLinkLabel: "原站查询",
    reportDate: "本期",
    tabs: {
      logic: "逻辑",
      code: "编程",
      vision: "视觉",
    },
    unavailable: "数据暂时不可用",
    unavailableHint: "抓取第三方源数据失败或尚未运行过，站点其余部分不受影响。",
    codeNote: "编程测试方法已改版至 v3：不再是打分制，而是逐项目 Pass / Skip / Pending / Failed，外加「修正轮数 / 最终评级」。",
    codeStatus: {
      pass: "通过",
      skip: "未测",
      pending: "结果未定",
      failed: "失败",
    },
    monthCaveat: "题库每月滚动更新，只展示最新一期——跨月分数不可比较，本站不做历史趋势。",
    think: { on: "开启", off: "常规" },
    thinkHint: "该次测试是否开启了模型的思考/推理模式，同一模型常有推理开/关两行。",
    staleWarning: "该类目已 {months} 个月未更新",
    rangeTitle: "极限 × 中位",
    rangePeak: "极限",
    rangeMedian: "中位",
    rangeGap: "落差",
    rangeNote: "按极限分数取前 {shown} / 共 {total}",
    rangeAria: "{name}，极限 {peak}，中位 {median}",
  },

  common: {
    models: "模型",
    vendors: "厂商",
    noValue: "—",
    skipToContent: "跳到主要内容",
    menu: "菜单",
    dataTable: "数据表格",
    notFoundTitle: "这个地址没有内容",
    notFoundBody: "模型可能已经改名或从上游数据里下架了。去榜单里搜一下。",
  },
} as const;
