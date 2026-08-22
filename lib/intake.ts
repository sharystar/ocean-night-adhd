git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
export type IntakeKind = "assigned" | "communication" | "writing" | "reading" | "meeting" | "analysis" | "admin" | "emotion" | "general";

export type IntakeEgg = {
  id: string;
  title: string;
  kind: IntakeKind;
  kindLabel: string;
  creature: string;
  species: string;
  color: string;
  reason: string;
  firstStep: string;
  doneDefinition: string;
  estimatedMinutes: number;
};

export type IntakeResult = {
  summary: string;
  careNote: string;
  eggs: IntakeEgg[];
  source: "local" | "openrouter";
  degraded?: boolean;
};

const has = (text: string, words: string[]) => words.some((word) => text.includes(word));

const profiles: Record<IntakeKind, Omit<IntakeEgg, "id" | "title">> = {
  assigned: { kind: "assigned", kindLabel: "外来委托", creature: "🐟", species: "鹦鹉鱼", color: "parrotfish", reason: "先把别人交来的工作圈出边界，避免它吃掉整片海。", firstStep: "把原始要求、交付格式和截止节点放在同一处", doneDefinition: "形成一个符合要求、可以交出去的版本", estimatedMinutes: 90 },
  communication: { kind: "communication", kindLabel: "关系与沟通", creature: "🐬", species: "宽吻海豚", color: "dolphin", reason: "海豚负责把脑内反复排练，变成一条清楚而有边界的信号。", firstStep: "写下希望对方看完后给你的唯一回应", doneDefinition: "消息已发出，或已经确定发送时间", estimatedMinutes: 20 },
  writing: { kind: "writing", kindLabel: "自己的研究", creature: "🐙", species: "椰子章鱼", color: "octopus", reason: "章鱼替你抓住文章里同时伸出来的许多线头。", firstStep: "打开自己的文章，标出今天最想推进的一处", doneDefinition: "文章留下一个可见的新版本", estimatedMinutes: 60 },
  reading: { kind: "reading", kindLabel: "文献阅读", creature: "🐡", species: "河豚", color: "puffer", reason: "河豚会圈小阅读边界，不要求你吞下整片文献海。", firstStep: "写下这次阅读最想回答的一个问题", doneDefinition: "留下包含问题、证据和研究联系的阅读卡片", estimatedMinutes: 45 },
  meeting: { kind: "meeting", kindLabel: "汇报与会议", creature: "🦈", species: "鲸鲨", color: "whaleshark", reason: "鲸鲨守住汇报里真正需要被听见的主线。", firstStep: "写下听众最后必须记住的一句话", doneDefinition: "有一个可以完整讲完的最小版本", estimatedMinutes: 75 },
  analysis: { kind: "analysis", kindLabel: "数据分析", creature: "🦑", species: "萤火鱿", color: "squid", reason: "萤火鱿一次照亮一个可验证的问题，不同时追所有岔路。", firstStep: "写下今天的数据工作要回答的一个问题", doneDefinition: "得到一个可读输出，并记录下一步判断", estimatedMinutes: 60 },
  admin: { kind: "admin", kindLabel: "行政杂务", creature: "🦀", species: "招潮蟹", color: "crab", reason: "招潮蟹把材料、入口和缺失项夹在一起，免得它们一直占记忆。", firstStep: "找到通知、截止节点和提交入口", doneDefinition: "完成提交，或只剩一个明确等待项", estimatedMinutes: 30 },
  emotion: { kind: "emotion", kindLabel: "情绪照护", creature: "🦦", species: "海獭", color: "otter", reason: "这不是额外作业。海獭先替你抱住今天已经消耗掉的心力。", firstStep: "用一句不责怪自己的话，写下今天最难受的是什么", doneDefinition: "情绪被看见，并选好一个能恢复一点点的动作", estimatedMinutes: 15 },
  general: { kind: "general", kindLabel: "需要再靠近", creature: "🐢", species: "绿海龟", color: "turtle", reason: "海龟先找一个可以碰到的入口，不要求现在看清全部路线。", firstStep: "打开与它最相关的入口，并写下唯一交付物", doneDefinition: "留下一个可以继续的最小结果", estimatedMinutes: 30 },
};

function egg(kind: IntakeKind, title: string, index: number, overrides: Partial<IntakeEgg> = {}): IntakeEgg {
  return { id: `${kind}-${index}`, title, ...profiles[kind], ...overrides };
}

function sentenceFor(text: string, words: string[]) {
  return text.split(/[。！？!?；;\n]/).map((part) => part.trim()).find((part) => has(part.toLowerCase(), words));
}

export function buildLocalIntake(input: string): IntakeResult {
  const text = input.toLowerCase();
  const eggs: IntakeEgg[] = [];
  const add = (kind: IntakeKind, title: string, overrides?: Partial<IntakeEgg>) => {
    if (kind === "general" || !eggs.some((item) => item.kind === kind)) eggs.push(egg(kind, title, eggs.length + 1, overrides));
  };

  const assignedCue = has(text, ["导师让我", "导师叫我", "导师又给", "派了", "交代", "帮他", "帮她"]);
  const pptCue = has(text, ["ppt", "幻灯", "翻译", "presentation"]);
  if (assignedCue || (pptCue && has(text, ["导师", "老师"]))) {
    const extras = has(text, ["evidence", "证据", "有意思的内容", "补充内容"]);
    add("assigned", extras ? "完成导师交代的 PPT、翻译与证据补充" : "完成导师交代的 PPT / 翻译工作", { estimatedMinutes: extras ? 120 : 90 });
  } else if (pptCue) {
    add("meeting", "准备 PPT、翻译或汇报材料");
  }

  if (has(text, ["发消息", "发个消息", "邮件", "催催", "催他", "催她", "沟通", "联系导师", "不敢催"])) {
    add("communication", has(text, ["文章", "论文", "稿"] ) ? "给导师发送一条关于自己文章进度的消息" : "发出那条需要沟通的消息");
  }
  if (has(text, ["自己的文章", "自己文章", "手上正在写", "推进文章", "推进论文", "写这篇文章", "我的文章", "我的论文"])) {
    add("writing", "自驱推进目前正在写的文章");
  }
  if (has(text, ["文献", "阅读", "读完", "读一篇", "读三篇", "literature", "article"])) {
    const sentence = sentenceFor(input, ["文献", "阅读", "读", "literature", "article"]);
    add("reading", sentence && sentence.length <= 42 ? sentence : "阅读并整理今天提到的文献");
  }
  if (has(text, ["数据", "分析", "统计", "模型", "回归", "编码", "清洗", "spss", "stata", "r语言"])) add("analysis", "推进今天的数据分析工作");
  if (has(text, ["组会", "会议", "汇报", "答辩", "conference"]) && !eggs.some((item) => item.kind === "meeting")) add("meeting", "准备接下来的会议或汇报");
  if (has(text, ["报销", "申请", "表格", "提交材料", "伦理", "手续", "签字"])) add("admin", "处理今天必须完成的行政事项");
  if (has(text, ["内耗", "痛苦", "心力交瘁", "焦虑", "难受", "崩溃", "委屈", "害怕", "不敢", "情绪", "很累", "太累"])) {
    add("emotion", "照顾今天被消耗、痛苦和害怕的自己");
  }

  if (!eggs.length) {
    const parts = input.split(/[。！？!?；;\n]|(?:还要)|(?:然后)|(?:另外)|(?:与此同时)/).map((part) => part.trim()).filter((part) => part.length >= 2).slice(0, 5);
    parts.forEach((part) => add("general", part.length > 34 ? `${part.slice(0, 34)}…` : part));
  }
  if (!eggs.length) add("general", input.slice(0, 40));

  return {
    summary: `我在这颗大泡泡里听见了 ${eggs.length} 股不同的水流。`,
    careNote: eggs.some((item) => item.kind === "emotion") ? "其中有一件不是生产任务，而是照顾已经很辛苦的你。它不会被当成偷懒。" : "你不需要今天把每一枚鱼卵都孵化；先看清它们，已经在减轻大脑的负担。",
    eggs,
    source: "local",
  };
}
