export type IntakeKind = "assigned" | "communication" | "writing" | "reading" | "meeting" | "analysis" | "admin" | "health" | "life" | "emotion" | "general";

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
const emotionWords = ["内耗", "痛苦", "心力交瘁", "焦虑", "难受", "崩溃", "委屈", "害怕", "不敢", "情绪", "很累", "太累", "烦躁", "沮丧", "自责"];
const actionStart = /^(?:我(?:还|也|自己|得|要|想|需要|打算|必须)?|导师|老师|老板|同事|师兄|师姐)?\s*(?:要|得|想|需要|打算|必须|帮忙|写|改|修改|做|读|看|跑|分析|整理|提交|回复|回|发|联系|准备|预约|购买|买|打印|翻译|申请|报销|缴|交|开|参加|处理|打扫|洗|拿|取|寄|补|加|完成|推进|检查|确认|催|约)/i;
const weakOpeners = /^(?:还有|还要|还得|另外|然后|同时|与此同时|顺便|除此之外|接着|以及|并且|再|我还|我也)\s*/;

const profiles: Record<IntakeKind, Omit<IntakeEgg, "id" | "title">> = {
  assigned: { kind: "assigned", kindLabel: "外来委托", creature: "🐟", species: "鹦鹉鱼", color: "parrotfish", reason: "先把别人交来的工作圈出边界，避免它吃掉整片海。", firstStep: "把原始要求、交付格式和截止节点放在同一处", doneDefinition: "形成一个符合要求、可以交出去的版本", estimatedMinutes: 90 },
  communication: { kind: "communication", kindLabel: "关系与沟通", creature: "🐬", species: "宽吻海豚", color: "dolphin", reason: "海豚负责把脑内反复排练，变成一条清楚而有边界的信号。", firstStep: "写下希望对方看完后给你的唯一回应", doneDefinition: "消息已发出，或已经确定发送时间", estimatedMinutes: 20 },
  writing: { kind: "writing", kindLabel: "自己的研究", creature: "🐙", species: "椰子章鱼", color: "octopus", reason: "章鱼替你抓住文章里同时伸出来的许多线头。", firstStep: "打开自己的文章，标出今天最想推进的一处", doneDefinition: "文章留下一个可见的新版本", estimatedMinutes: 60 },
  reading: { kind: "reading", kindLabel: "文献阅读", creature: "🐡", species: "河豚", color: "puffer", reason: "河豚会圈小阅读边界，不要求你吞下整片文献海。", firstStep: "写下这次阅读最想回答的一个问题", doneDefinition: "留下包含问题、证据和研究联系的阅读卡片", estimatedMinutes: 45 },
  meeting: { kind: "meeting", kindLabel: "汇报与会议", creature: "🦈", species: "鲸鲨", color: "whaleshark", reason: "鲸鲨守住汇报里真正需要被听见的主线。", firstStep: "写下听众最后必须记住的一句话", doneDefinition: "有一个可以完整讲完的最小版本", estimatedMinutes: 75 },
  analysis: { kind: "analysis", kindLabel: "数据分析", creature: "🦑", species: "萤火鱿", color: "squid", reason: "萤火鱿一次照亮一个可验证的问题，不同时追所有岔路。", firstStep: "写下今天的数据工作要回答的一个问题", doneDefinition: "得到一个可读输出，并记录下一步判断", estimatedMinutes: 60 },
  admin: { kind: "admin", kindLabel: "行政杂务", creature: "🦀", species: "招潮蟹", color: "crab", reason: "招潮蟹把材料、入口和缺失项夹在一起，免得它们一直占记忆。", firstStep: "找到通知、截止节点和提交入口", doneDefinition: "完成提交，或只剩一个明确等待项", estimatedMinutes: 30 },
  health: { kind: "health", kindLabel: "身体照料", creature: "🦭", species: "港海豹", color: "dolphin", reason: "海豹提醒你：身体的预约、吃药和休息，也是今天真正要照顾的事。", firstStep: "确认时间、地点或现在最小的照料动作", doneDefinition: "预约或照料动作已经完成，并留下下一次提醒", estimatedMinutes: 30 },
  life: { kind: "life", kindLabel: "生活杂务", creature: "⭐", species: "太阳海星", color: "crab", reason: "海星收起散落在生活里的小事项，让它们不用一直挂在工作记忆里。", firstStep: "找到完成它所需的入口、物品或地点", doneDefinition: "这件生活事项已经处理，或只剩清楚的等待节点", estimatedMinutes: 25 },
  emotion: { kind: "emotion", kindLabel: "情绪照护", creature: "🦦", species: "海獭", color: "otter", reason: "这不是额外作业。海獭先替你抱住今天已经消耗掉的心力。", firstStep: "用一句不责怪自己的话，写下今天最难受的是什么", doneDefinition: "情绪被看见，并选好一个能恢复一点点的动作", estimatedMinutes: 15 },
  general: { kind: "general", kindLabel: "需要再靠近", creature: "🐢", species: "绿海龟", color: "turtle", reason: "海龟先找一个可以碰到的入口，不要求现在看清全部路线。", firstStep: "打开与它最相关的入口，并写下唯一交付物", doneDefinition: "留下一个可以继续的最小结果", estimatedMinutes: 30 },
};

function egg(kind: IntakeKind, title: string, index: number, overrides: Partial<IntakeEgg> = {}): IntakeEgg {
  return { id: `${kind}-${index}`, title, ...profiles[kind], ...overrides };
}

function cleanMatter(value: string) {
  return value.replace(weakOpeners, "").replace(/^(?:今天|明天|这周|待会儿)\s*(?:我)?\s*/, "").replace(/^[，,：:、\s]+|[，,：:、\s]+$/g, "").trim();
}

function isFiller(value: string) {
  const text = cleanMatter(value);
  if (text.length < 2) return true;
  return /^(?:事情|任务)?(?:真的)?(?:太多|好多|很多)(?:了|啦)?$/.test(text) || /^(?:不知道从哪里开始|脑子很乱|先说这些)$/.test(text);
}

function commaMatters(block: string) {
  const parts = block.split(/[，,]/).map(cleanMatter).filter(Boolean);
  if (parts.length < 2) return [block];
  const actionable = parts.filter((part) => actionStart.test(part) || /^(?:给|去|把|将)/.test(part)).length;
  if (actionable < 2) return [block];
  return parts;
}

function sameWorkstream(previous: string, current: string) {
  if (has(current, emotionWords)) return false;
  const sharedTopics = [
    ["ppt", "幻灯", "presentation"],
    ["论文", "文章", "稿子", "稿件"],
    ["文献", "阅读", "article", "paper"],
    ["数据", "模型", "分析", "代码"],
  ];
  const sharesTopic = sharedTopics.some((group) => has(previous.toLowerCase(), group) && has(current.toLowerCase(), group));
  const refinement = has(current.toLowerCase(), ["翻译", "补", "加", "证据", "evidence", "完善", "润色", "格式"]);
  const impliedSameObject = has(current.toLowerCase(), ["往里面", "在里面", "这份", "这个", "其中"]);
  return (sharesTopic && refinement) || (refinement && (current.length <= 12 || impliedSameObject) && has(previous.toLowerCase(), ["ppt", "幻灯", "文章", "论文", "材料"]));
}

/** Split a brain dump into independently finishable matters before assigning any creature. */
export function splitIntakeMatters(input: string) {
  const strongBlocks = input
    .replace(/\r/g, "")
    .replace(/(?:^|\n)\s*(?:[-*•]|\d+[.、）)])\s*/g, "\n")
    .replace(/(?:另外|然后|同时|与此同时|顺便|除此之外|接着)(?=(?:我|导师|老师|老板|同事|要|得|写|改|做|读|跑|发|回|报销|申请|预约|联系|处理))/g, "\n$&")
    .replace(/还(?:要|得|需要)(?=(?:写|改|做|读|跑|发|回|报销|申请|预约|联系|处理|翻译|补|加))/g, "\n$&")
    .split(/[。！？!?；;\n]+/)
    .flatMap(commaMatters)
    .map(cleanMatter)
    .filter((part) => !isFiller(part));

  const matters: string[] = [];
  for (const part of strongBlocks) {
    if (matters.length && sameWorkstream(matters.at(-1)!, part)) matters[matters.length - 1] += `，${part}`;
    else matters.push(part);
  }
  return matters.slice(0, 12);
}

function titleFor(segment: string) {
  const title = cleanMatter(segment).replace(/^(?:我(?:自己)?(?:还|也|得|要|想|需要|打算)?\s*)/, "");
  return title.length > 42 ? `${title.slice(0, 42)}…` : title;
}

function classifyMatter(segment: string): IntakeKind {
  const text = segment.toLowerCase();
  const assigned = has(text, ["导师让我", "导师叫我", "导师又给", "老师让我", "老板让我", "派了", "交代", "帮他", "帮她"]);
  if (assigned) return "assigned";
  if (has(text, emotionWords) && !actionStart.test(cleanMatter(segment))) return "emotion";
  if (has(text, ["审稿意见", "审稿回复", "rebuttal", "response letter"])) return "writing";
  if (has(text, ["发消息", "发个消息", "回消息", "回邮件", "邮件", "催催", "催他", "催她", "沟通", "联系", "回复", "不敢催", "问导师"])) return "communication";
  if (has(text, ["打电话", "回电话", "电话给", "给妈妈", "给爸爸", "给家里", "给朋友"])) return "communication";
  if (has(text, ["文献", "阅读", "读完", "读一篇", "读几篇", "literature", "article", "看论文"])) return "reading";
  if (has(text, ["数据", "分析", "统计", "模型", "回归", "编码", "清洗", "代码", "spss", "stata", "r语言", "跑一遍"])) return "analysis";
  if (has(text, ["组会", "会议", "汇报", "答辩", "conference", "演讲", "讲稿", "ppt", "幻灯"])) return "meeting";
  if (has(text, ["报销", "申请", "表格", "提交材料", "伦理", "手续", "签字", "缴费", "打印", "上传", "注册"])) return "admin";
  if (has(text, ["牙医", "医生", "医院", "体检", "复诊", "挂号", "吃药", "用药", "运动", "锻炼", "睡觉", "休息", "心理咨询"])) return "health";
  if (has(text, ["买菜", "买牛奶", "购物", "取快递", "拿快递", "寄快递", "做饭", "洗衣", "打扫", "收拾房间", "倒垃圾", "缴水电", "家务"])) return "life";
  if (has(text, ["论文", "文章", "摘要", "引言", "discussion", "method", "方法部分", "审稿", "稿子", "稿件", "写作", "润色"]) || /(?:写|修改|改)\S{0,8}(?:段|部分|章节|稿)/.test(text)) return "writing";
  return "general";
}

export function stabilizeIntakeEggs(items: IntakeEgg[]) {
  return items.slice(0, 12).map((item, index) => {
    const kind = profiles[item.kind] ? item.kind : "general";
    return egg(kind, item.title, index + 1, {
      reason: item.reason || profiles[kind].reason,
      firstStep: item.firstStep || profiles[kind].firstStep,
      doneDefinition: item.doneDefinition || profiles[kind].doneDefinition,
      estimatedMinutes: Math.min(600, Math.max(5, Math.round(item.estimatedMinutes || profiles[kind].estimatedMinutes))),
    });
  });
}

export function buildLocalIntake(input: string): IntakeResult {
  const matters = splitIntakeMatters(input);
  const eggs: IntakeEgg[] = [];
  const seen = new Set<string>();
  const add = (kind: IntakeKind, title: string, overrides?: Partial<IntakeEgg>) => {
    const key = title.replace(/[\s，,。.!！?？]/g, "").toLowerCase();
    if (!key || seen.has(key) || eggs.length >= 12) return;
    seen.add(key);
    eggs.push(egg(kind, title, eggs.length + 1, overrides));
  };

  for (const matter of matters) add(classifyMatter(matter), titleFor(matter));
  if (has(input.toLowerCase(), emotionWords) && !eggs.some((item) => item.kind === "emotion")) {
    add("emotion", "照顾今天已经被消耗的情绪与心力");
  }
  if (!eggs.length) add("general", titleFor(input.slice(0, 42)) || "先看清这件还很模糊的事");

  return {
    summary: `我在这颗大泡泡里听见了 ${eggs.length} 股不同的水流。`,
    careNote: eggs.some((item) => item.kind === "emotion") ? "其中有一件不是生产任务，而是照顾已经很辛苦的你。它不会被当成偷懒。" : "每件独立的事都有自己的鱼卵；即使它们属于同一类，也不会被合并掉。",
    eggs,
    source: "local",
  };
}
