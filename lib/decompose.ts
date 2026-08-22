git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
export type RouteFeedback = "smaller" | "wrong" | "done";
export type TaskKind = "writing" | "reading" | "communication" | "meeting" | "analysis" | "admin" | "waiting" | "general";
export type WorkPackId = "paper" | "literature" | "communication" | "meeting" | null;

export type RouteStep = {
  title: string;
  doneWhen: string;
  minutes: number;
};

export type Decomposition = {
  taskKind: TaskKind;
  taskKindLabel: string;
  creature: string;
  species: string;
  color: string;
  summary: string;
  reason: string;
  steps: RouteStep[];
  workPack: WorkPackId;
  workPackLabel: string | null;
  doneDefinition: string;
  source: "local" | "openrouter";
  degraded?: boolean;
};

type Blueprint = Omit<Decomposition, "source">;

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

function detectKind(input: string): TaskKind {
  const text = input.toLowerCase();
  if (includesAny(text, ["等待", "等导师", "等回复", "pending", "wait for"])) return "waiting";
  if (includesAny(text, ["组会", "会议", "汇报", "答辩", "ppt", "presentation", "conference", "讲稿"])) return "meeting";
  if (includesAny(text, ["导师", "邮件", "回复", "沟通", "联系", "预约", "message", "email"])) return "communication";
  if (includesAny(text, ["文献", "阅读", "论文综述", "literature", "article", "读完", "读这篇"])) return "reading";
  if (includesAny(text, ["数据", "分析", "统计", "编码", "模型", "spss", "stata", "r语言", "回归", "清洗"])) return "analysis";
  if (includesAny(text, ["报销", "申请", "表格", "材料", "提交", "伦理", "手续", "行政", "签字"])) return "admin";
  if (includesAny(text, ["论文", "discussion", "introduction", "method", "结果", "段落", "章节", "修改", "写", "稿", "revise"])) return "writing";
  return "general";
}

function shortSubject(input: string) {
  const clean = input.replace(/[。！？!?；;]/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
}

function blueprintFor(input: string, kind: TaskKind): Blueprint {
  const subject = shortSubject(input);
  const maps: Record<TaskKind, Blueprint> = {
    writing: {
      taskKind: "writing", taskKindLabel: "论文写作 / 修改", creature: "🐙", species: "椰子章鱼", color: "octopus",
      summary: `先把「${subject}」变成一个看得见的改动`,
      reason: "这件事含有多个判断点，章鱼会替你抓住后面的步骤；今天只伸出第一只触手。",
      steps: [
        { title: "打开要修改的文档，并定位到最相关的一条批注或一个段落", doneWhen: "目标段落停在屏幕中央", minutes: 2 },
        { title: "用一句话写下：这一段现在缺少什么", doneWhen: "留下一个不超过 30 字的问题句", minutes: 4 },
        { title: "先写 3 个要点，不要求组成完整句子", doneWhen: "文档里出现 3 个可继续展开的要点", minutes: 8 },
        { title: "把其中 1 个要点改成可以保留的句子", doneWhen: "至少有 1 句新文字被保存", minutes: 10 },
      ],
      workPack: "paper", workPackLabel: "论文修改包", doneDefinition: "文档里留下一个可见的新版本，而不是今天写完全部。",
    },
    reading: {
      taskKind: "reading", taskKindLabel: "文献阅读", creature: "🐡", species: "河豚", color: "puffer",
      summary: `带着一个问题靠近「${subject}」`,
      reason: "文献容易越读越膨胀；河豚会把阅读边界圈小，只带回能用的证据。",
      steps: [
        { title: "打开文献，只看标题、摘要和小标题", doneWhen: "能说出作者主要在回答什么", minutes: 4 },
        { title: "写下你读它最想解决的 1 个问题", doneWhen: "笔记顶部出现一个问号句", minutes: 3 },
        { title: "只精读最相关的 2 页或 1 个小节", doneWhen: "标出 2 处与你问题相关的内容", minutes: 12 },
        { title: "留下 1 条证据和 1 句与你研究的关系", doneWhen: "形成可回看的两行阅读卡片", minutes: 6 },
      ],
      workPack: "literature", workPackLabel: "文献阅读包", doneDefinition: "带回一张有问题、有证据、有联系的阅读卡片。",
    },
    communication: {
      taskKind: "communication", taskKindLabel: "导师沟通", creature: "🐬", species: "宽吻海豚", color: "dolphin",
      summary: `先确定「${subject}」希望对方回应什么`,
      reason: "沟通任务常卡在措辞和担忧。海豚先帮你发出清晰信号，再处理语气。",
      steps: [
        { title: "写下一句话：我希望对方看完后做什么", doneWhen: "出现一个明确动作，例如确认、选择或回复", minutes: 2 },
        { title: "列出必须让对方知道的 2 条背景", doneWhen: "背景不超过两个短句", minutes: 4 },
        { title: "按「目的—背景—请求」写出粗糙草稿", doneWhen: "草稿有称呼、正文和结尾", minutes: 8 },
        { title: "删掉一处过度解释，检查附件后发送或预约发送", doneWhen: "消息已发送，或已经设置明确发送时间", minutes: 5 },
      ],
      workPack: "communication", workPackLabel: "导师沟通包", doneDefinition: "让对方清楚知道你需要什么回应。",
    },
    meeting: {
      taskKind: "meeting", taskKindLabel: "会议 / 汇报", creature: "🦈", species: "鲸鲨", color: "whaleshark",
      summary: `为「${subject}」准备一条清楚的游线`,
      reason: "汇报看起来像一整片海。鲸鲨会先守住必须说清楚的三件事。",
      steps: [
        { title: "写下听众离开时必须记住的 1 句话", doneWhen: "有一句可以直接放在标题页后的结论", minutes: 3 },
        { title: "列出支撑这句话的 3 个要点", doneWhen: "出现三个并列短句", minutes: 6 },
        { title: "每个要点只配 1 张现有图、表或例子", doneWhen: "三页最小版结构已经建立", minutes: 15 },
        { title: "从头讲一遍，并记下最卡的 1 个地方", doneWhen: "完成一次不暂停的试讲", minutes: 10 },
      ],
      workPack: "meeting", workPackLabel: "会议准备包", doneDefinition: "有一个能讲完、能被理解的最小版本。",
    },
    analysis: {
      taskKind: "analysis", taskKindLabel: "数据分析", creature: "🦑", species: "萤火鱿", color: "squid",
      summary: `先照亮「${subject}」里的一个判断点`,
      reason: "分析任务容易同时打开很多岔路。萤火鱿一次只照亮一个可验证的问题。",
      steps: [
        { title: "打开数据或代码，并写下今天要回答的 1 个问题", doneWhen: "脚本顶部留下一句问题注释", minutes: 3 },
        { title: "确认这个问题需要的变量与样本范围", doneWhen: "变量名和筛选条件被列出来", minutes: 7 },
        { title: "只跑一个最小检查：描述统计、频数或缺失值", doneWhen: "得到一张可读的输出", minutes: 10 },
        { title: "用两句话记录结果和下一步", doneWhen: "明天重新打开时知道从哪里继续", minutes: 5 },
      ],
      workPack: null, workPackLabel: null, doneDefinition: "得到一个可读输出，并留下下一步判断。",
    },
    admin: {
      taskKind: "admin", taskKindLabel: "行政 / 提交", creature: "🦀", species: "招潮蟹", color: "crab",
      summary: `把「${subject}」需要的材料排成一列`,
      reason: "行政事项不一定难，却会不断占用记忆。招潮蟹把缺什么、找谁、交到哪儿夹牢。",
      steps: [
        { title: "打开通知或表格，找到截止时间与提交入口", doneWhen: "截止时间和入口被复制到同一处", minutes: 3 },
        { title: "列出需要的材料，并标出目前缺少的那一项", doneWhen: "形成一个可勾选清单", minutes: 6 },
        { title: "只处理最容易获得的一份材料", doneWhen: "至少一个文件已经重命名并放进提交文件夹", minutes: 8 },
        { title: "检查文件名和必填项，提交或写明唯一阻塞点", doneWhen: "已提交，或只剩一个明确等待项", minutes: 8 },
      ],
      workPack: null, workPackLabel: null, doneDefinition: "完成提交，或把未知状态变成一个明确等待项。",
    },
    waiting: {
      taskKind: "waiting", taskKindLabel: "等待 / 候潮", creature: "🪼", species: "月亮水母", color: "jelly",
      summary: `让「${subject}」暂时漂着，不再偷走氧气`,
      reason: "等待不是执行任务。水母会替你记住检查节点，今天不继续消耗注意力。",
      steps: [
        { title: "写下正在等谁、等什么，以及最晚何时再检查", doneWhen: "有一个清楚的检查日期或条件", minutes: 3 },
        { title: "把它移到候潮区，并关闭相关页面", doneWhen: "今天的工作区不再显示它", minutes: 1 },
        { title: "到检查节点仍无回复时，只发送一条简短跟进", doneWhen: "跟进模板已经准备好", minutes: 4 },
      ],
      workPack: "communication", workPackLabel: "导师沟通包", doneDefinition: "留下检查节点，然后把氧气还给今天。",
    },
    general: {
      taskKind: "general", taskKindLabel: "多步骤事项", creature: "🐢", species: "绿海龟", color: "turtle",
      summary: `先让「${subject}」出现一个可以碰到的起点`,
      reason: "这件事的信息还比较宽。海龟先找入口、边界和一个可见结果，之后再慢慢调整方向。",
      steps: [
        { title: "打开与这件事最相关的页面、文件或对话", doneWhen: "唯一入口停在眼前", minutes: 2 },
        { title: "写下完成它必须发生的 3 件事", doneWhen: "出现三个动作短句", minutes: 5 },
        { title: "圈出不依赖别人、现在就能做的一件", doneWhen: "第一步被单独放进今天", minutes: 3 },
        { title: "做出一个可以保存或发给别人看的最小结果", doneWhen: "至少留下一个文件、消息或决定", minutes: 10 },
      ],
      workPack: null, workPackLabel: null, doneDefinition: "留下一个看得见、可以继续的最小结果。",
    },
  };
  return maps[kind];
}

function applyFeedback(base: Blueprint, feedback?: RouteFeedback): Blueprint {
  if (!feedback) return base;
  if (feedback === "smaller") {
    const first = base.steps[0];
    return {
      ...base,
      summary: `再靠近一点：${base.summary}`,
      reason: "路线已经缩到不需要进入状态也能完成的动作。做完就可以停。",
      steps: [
        { title: `只做准备动作：${first.title.split(/[，,:：]/)[0]}`, doneWhen: "相关入口已经打开，手没有继续也算完成", minutes: 2 },
        { title: first.title, doneWhen: first.doneWhen, minutes: Math.min(first.minutes, 5) },
        ...base.steps.slice(1),
      ],
    };
  }
  if (feedback === "done") {
    return {
      ...base,
      summary: `已经游过第一枚浮标：${base.summary}`,
      reason: "做过的步骤已经收好，路线从下一个还没发生的动作开始。",
      steps: base.steps.slice(1).length ? base.steps.slice(1) : base.steps,
    };
  }
  return {
    ...base,
    summary: `换一条更直接的路线：${base.summary}`,
    reason: "这次不猜完整流程，先确认真正的交付物，再倒推最小动作。",
    steps: [
      { title: "写下：谁会看到这件事，以及对方最后需要收到什么", doneWhen: "有一个具体的人和一个具体交付物", minutes: 3 },
      { title: "找到一个最接近的旧文件、模板或例子", doneWhen: "参考物已经打开", minutes: 4 },
      { title: "复制参考结构，只填入最确定的那一部分", doneWhen: "新版本里出现一处真实内容", minutes: 8 },
      ...base.steps.slice(-1),
    ],
  };
}

export function buildLocalDecomposition(input: string, feedback?: RouteFeedback): Decomposition {
  const kind = detectKind(input);
  return { ...applyFeedback(blueprintFor(input, kind), feedback), source: "local" };
}
