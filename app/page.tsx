"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Decomposition, RouteFeedback, RouteStep, WorkPackId } from "../lib/decompose";
import type { IntakeEgg, IntakeResult } from "../lib/intake";

type Modal = null | "capture" | "weather" | "focus" | "rescue" | "collection" | "celebrate" | "workpack";
type Task = { id: number; title: string; creature: string; species: string; next: string; minutes: number; oxygen: number; status: "active" | "waiting" | "ready" | "done"; color: string; steps?: RouteStep[]; workPack?: WorkPackId; doneDefinition?: string };

const startingTasks: Task[] = [
  { id: 1, title: "修改论文 Discussion", creature: "🐠", species: "小丑鱼", next: "打开导师批注文档，找到第一条理论贡献意见", minutes: 10, oxygen: 2, status: "active", color: "clown" },
  { id: 2, title: "等待导师回复研究设计", creature: "🪼", species: "水母", next: "不占用今天的氧气，安心让它漂一会儿", minutes: 0, oxygen: 0, status: "waiting", color: "jelly" },
];
const weathers = [
  { name: "只想浮着", note: "今天先照顾自己", capacity: 2, icon: "﹏" },
  { name: "风浪较大", note: "少一点，也很好", capacity: 4, icon: "≋" },
  { name: "普通海况", note: "有一些力气可用", capacity: 6, icon: "≈" },
  { name: "风平浪静", note: "可以探索远一点", capacity: 8, icon: "⌁" },
];
const workPackMeta: Record<Exclude<WorkPackId, null>, { icon: string; label: string; intro: string; sections: string[] }> = {
  paper: { icon: "✍", label: "论文修改包", intro: "把导师意见、修改动作和完成标准放在同一张海图上。", sections: ["这次修改要解决的问题", "导师意见 → 我的动作", "段落的三点地图", "这轮做到哪里就停"] },
  literature: { icon: "⌕", label: "文献阅读包", intro: "带着问题阅读，只带回能进入自己研究的证据。", sections: ["我为什么读它", "理论 / 方法线索", "可引用的证据", "它与我的研究有什么关系"] },
  communication: { icon: "⌁", label: "导师沟通包", intro: "先说清目的，再照顾语气；不用在脑内排练无限次。", sections: ["我希望对方做什么", "对方必须知道的背景", "可以直接发送的草稿", "等待与跟进节点"] },
  meeting: { icon: "◫", label: "会议准备包", intro: "守住必须说清楚的三点，先做一个能讲完的版本。", sections: ["听众最后要记住的一句话", "必须讲的三个要点", "我想向大家确认的问题", "会后立刻记下什么"] },
};

export default function Home() {
  const [stage, setStage] = useState<"intake" | "eggs" | "tank">("intake");
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState("");
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [eggs, setEggs] = useState<IntakeEgg[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [mode, setMode] = useState<"shallow" | "deep">("shallow");
  const [tasks, setTasks] = useState<Task[]>(startingTasks);
  const [weather, setWeather] = useState(weathers[2]);
  const [capture, setCapture] = useState("");
  const [route, setRoute] = useState<Decomposition | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [selectedId, setSelectedId] = useState(1);
  const [seconds, setSeconds] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [rescueReason, setRescueReason] = useState("");
  const [rescued, setRescued] = useState(false);
  const [signalVisible, setSignalVisible] = useState(false);
  const [signalQuiet, setSignalQuiet] = useState(false);
  const [packId, setPackId] = useState<Exclude<WorkPackId, null>>("paper");

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? tasks[0];
  const usedOxygen = tasks.filter((task) => task.status !== "waiting" && task.status !== "done").reduce((sum, task) => sum + task.oxygen, 0);
  const oxygenDots = useMemo(() => Array.from({ length: weather.capacity }, (_, i) => i < usedOxygen), [weather.capacity, usedOxygen]);
  const pack = workPackMeta[packId];

  useEffect(() => { const timer = window.setTimeout(() => setSignalVisible(true), 1400); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (!running || modal !== "focus" || seconds <= 0) return; const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [running, modal, seconds]);

  function openCapture(prefill = "") { if (prefill) setCapture(prefill); setRoute(null); setRouteError(""); setModal("capture"); }
  function openFocus(task: Task) { if (task.status === "waiting") return; setSelectedId(task.id); setSeconds(Math.max(task.minutes, 2) * 60); setRunning(false); setModal("focus"); }
  async function requestRoute(feedback?: RouteFeedback) {
    if (!capture.trim()) return;
    setRouteLoading(true); setRouteError("");
    try {
      const response = await fetch("/api/decompose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: capture, feedback }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "路线暂时没有浮上来。");
      setRoute(result);
    } catch (error) { setRouteError(error instanceof Error ? error.message : "路线暂时没有浮上来，请再试一次。"); }
    finally { setRouteLoading(false); }
  }
  function prepareRoute(event: FormEvent) { event.preventDefault(); void requestRoute(); }
  function addTask() {
    if (!route) return;
    const id = Date.now(); const first = route.steps[0];
    const task: Task = { id, title: capture.trim(), creature: route.creature, species: route.species, next: first.title, minutes: first.minutes, oxygen: route.taskKind === "waiting" ? 0 : Math.min(3, Math.max(1, Math.ceil(first.minutes / 5))), status: route.taskKind === "waiting" ? "waiting" : "ready", color: route.color, steps: route.steps, workPack: route.workPack, doneDefinition: route.doneDefinition };
    setTasks((current) => [...current, task]); setSelectedId(id); setCapture(""); setRoute(null); setModal(null);
  }
  function openPack(id: Exclude<WorkPackId, null>) { setPackId(id); setModal("workpack"); }
  function completeStep() { setTasks((current) => current.map((task) => task.id === selectedId ? { ...task, status: "done" } : task)); setRunning(false); setModal("celebrate"); }
  async function sortIntake(event: FormEvent) {
    event.preventDefault();
    if (capture.trim().length < 2) return;
    setIntakeLoading(true); setIntakeError("");
    try {
      const response = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: capture }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "泡泡暂时没有分开，请再试一次。");
      setIntakeResult(result); setEggs(result.eggs); setStage("eggs");
    } catch (error) { setIntakeError(error instanceof Error ? error.message : "泡泡暂时没有分开，请再试一次。"); }
    finally { setIntakeLoading(false); }
  }
  function updateEgg(id: string, patch: Partial<IntakeEgg>) { setEggs((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function addEggsToTank() {
    const nextTasks: Task[] = eggs.map((item, index) => ({ id: Date.now() + index, title: item.title, creature: item.creature, species: item.species, next: item.firstStep, minutes: item.estimatedMinutes, oxygen: item.kind === "emotion" ? 0 : Math.min(3, Math.max(1, Math.ceil(item.estimatedMinutes / 45))), status: "ready", color: item.color, doneDefinition: item.doneDefinition }));
    setTasks(nextTasks); if (nextTasks[0]) setSelectedId(nextTasks[0].id); setStage("tank"); setCapture(""); setIntakeResult(null);
  }
  function restartIntake() { setCapture(""); setIntakeResult(null); setEggs([]); setIntakeError(""); setStage("intake"); }
  function changeSelectedMinutes(value: number) {
    const minutes = Math.min(600, Math.max(5, Number.isFinite(value) ? value : 5));
    setTasks((current) => current.map((task) => task.id === selectedId ? { ...task, minutes } : task)); setSeconds(minutes * 60);
  }
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  if (stage === "intake") return <main className="intake-shell">
    <header className="intake-brand"><span className="brand-mark">◌</span><span><strong>海洋馆奇妙夜</strong><small>今天不用先整理好自己</small></span></header>
    <section className="intake-stage">
      <div className="hungry-bubble" aria-label="一颗正在等待长大的泡泡"><i /><span>◉</span><small>嗷嗷待哺</small></div>
      <div className="intake-copy"><p className="eyebrow">OCEAN INBOX · 一次说完</p><h1>今天脑子里有什么，<br />都可以倒进这颗泡泡。</h1><p>任务、抱怨、犹豫和情绪可以混在一起。海洋会替你慢慢分开。</p></div>
      <form className="ocean-chat" onSubmit={sortIntake}>
        <textarea autoFocus value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="比如：导师临时让我做 PPT，还要翻译；我想补一些 evidence；自己的文章也要推进，可是他一直不看，我又不敢催……" />
        {intakeError && <p className="intake-error">{intakeError}</p>}
        <div><span>{intakeLoading ? "海洋正在辨认混在一起的水流…" : "不用列清单，想到哪里说到哪里。"}</span><button type="submit" disabled={capture.trim().length < 2 || intakeLoading}>{intakeLoading ? "泡泡正在长大…" : "把泡泡送进海里 →"}</button></div>
      </form>
    </section>
  </main>;

  if (stage === "eggs") return <main className="eggs-shell">
    <header className="eggs-topbar"><button className="brand" onClick={restartIntake}><span className="brand-mark">◌</span><span><strong>海洋馆奇妙夜</strong><small>这一大颗泡泡，已经慢慢分开了</small></span></button><span>V3.2 · 不漏掉任何事</span></header>
    <section className="eggs-hero"><p className="eyebrow">THE OCEAN HEARD YOU · 海洋听见了</p><h1>{intakeResult?.summary}</h1><p>{intakeResult?.careNote}</p></section>
    <section className="eggs-grid">{eggs.map((item, index) => <article className={`egg-card ${item.color}`} key={item.id}>
      <div className="egg-visual"><span className="egg-shell">◉</span><span className="egg-creature">{item.creature}</span><i>{String(index + 1).padStart(2, "0")}</i></div>
      <div className="egg-kind"><span>{item.kindLabel}</span><em>{item.species}正在里面等你</em></div>
      <label className="egg-title"><span className="sr-only">鱼卵任务名称</span><input value={item.title} onChange={(event) => updateEgg(item.id, { title: event.target.value })} /></label>
      <p>{item.reason}</p><div className="egg-first"><small>孵化后先从这里靠近</small><strong>{item.firstStep}</strong></div>
      <label className="time-estimate"><span>你觉得整件事大约需要</span><span><input type="number" min="5" max="600" step="5" value={item.estimatedMinutes} onChange={(event) => updateEgg(item.id, { estimatedMinutes: Math.min(600, Math.max(5, Number(event.target.value) || 5)) })} /> 分钟</span></label>
      <small className="time-note">这是你的估计，不是系统规定；之后仍然可以修改。</small>
    </article>)}</section>
    <footer className="eggs-actions"><button onClick={restartIntake}>← 回去再说一点</button><div><span>{eggs.length} 枚鱼卵 · 时间由你决定</span><button className="primary-action" onClick={addEggsToTank}>把它们放进今日生态缸 →</button></div></footer>
  </main>;

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setMode("shallow")} aria-label="返回浅海首页"><span className="brand-mark">◌</span><span><strong>海洋馆奇妙夜</strong><small>让重要的事，轻轻向前游</small></span></button>
      <nav aria-label="主要导航"><span className="version-chip">V3.2 · 不漏掉任何事</span><button className={`nav-pill ${mode === "shallow" ? "active" : ""}`} onClick={() => setMode("shallow")}>浅海 · 今天</button><button className={`nav-pill ${mode === "deep" ? "active deep-active" : ""}`} onClick={() => setMode("deep")}>深海 · 长期</button><button className="icon-button" onClick={() => setModal("collection")} aria-label="打开海洋图鉴">✦</button></nav>
    </header>
    <section className="welcome-row"><div><p className="eyebrow">SATURDAY · 8月22日</p><h1>{mode === "shallow" ? <>晚上好，Shary<br />今天想和哪条鱼一起游？</> : <>欢迎来到深海<br />那些遥远的事，也在缓慢发光</>}</h1></div><button className="weather-card" onClick={() => setModal("weather")}><span className="weather-icon">{weather.icon}</span><span><small>今日海况</small><strong>{weather.name} · {weather.capacity}枚氧气</strong></span><span>⌄</span></button></section>

    {mode === "shallow" ? <>
      {signalVisible && !signalQuiet && <section className="ocean-signal"><span className="signal-orb">◉</span><div><p className="eyebrow">OCEAN SIGNAL · 海洋主动来找你</p><strong>论文鱼看起来有点大。要不要只陪它游两分钟？</strong><small>我会把其余步骤暂时放到看不见的地方。</small></div><button onClick={() => { setSelectedId(1); setSeconds(2 * 60); setModal("focus"); }}>好，带我去</button><button className="quiet-signal" onClick={() => setSignalQuiet(true)}>今天少说一点</button></section>}
      <section className="dashboard-grid"><div className="left-column">
        <article className="capture-card"><div className="capture-icon">✧</div><div><span className="mini-ai">一次说完 · 自动分流</span><h2>脑子里又挤进很多事情？</h2><p>回到海洋收件箱，不必先把它们整理成清单。</p></div><button onClick={restartIntake}>说给我听 <span>→</span></button></article>
        <article className="task-panel"><div className="section-heading"><div><p className="eyebrow">TODAY&apos;S TANK</p><h2>今日生态缸</h2></div><div className="oxygen"><span>{oxygenDots.map((full, index) => <i key={index} className={full ? "full" : ""}>●</i>)}</span><small>{usedOxygen} / {weather.capacity} 氧气</small></div></div>
          {tasks.filter((task) => task.status !== "done").map((task) => <button key={task.id} className={`task-card ${task.id === selectedId ? "selected" : ""}`} onClick={() => openFocus(task)}><span className={`fish-avatar ${task.color}`}>{task.creature}</span><span className="task-copy"><small>{task.species} · {task.status === "waiting" ? "候潮中" : task.id === selectedId ? "正在跟随" : "准备下潜"}</small><strong>{task.title}</strong><span>{task.status === "waiting" ? task.next : `下一步：${task.next}`}</span>{task.status !== "waiting" && <span className="task-meta"><b>约 {task.minutes} 分钟</b><i>{task.oxygen} 枚氧气</i></span>}</span><span className={task.status === "waiting" ? "more" : "play"}>{task.status === "waiting" ? "•••" : "▶"}</span></button>)}
          <button className="add-small" onClick={restartIntake}>＋ 再说一颗混着很多事情的大泡泡</button></article>
      </div><aside className="aquarium-card"><div className="aquarium-top"><div><p className="eyebrow">YOUR LITTLE OCEAN</p><h2>你的浅海</h2></div><span>水质清澈 · 生态舒适</span></div><div className="tank" aria-label="夜光浅海生态缸">{["b1","b2","b3","b4","b5"].map((name) => <span className={`bubble ${name}`} key={name} />)}<span className="swim-fish fish-one">🐠</span><span className="swim-fish fish-two">🐟</span><span className="swim-fish fish-three">🪼</span>{tasks.length > 2 && <span className="swim-fish fish-four">{tasks.at(-1)?.creature}</span>}<div className="light-ray one" /><div className="light-ray two" /><div className="plant plant-one">〽</div><div className="plant plant-two">♒</div><div className="sand" /><div className="coral">♨</div></div><div className="tank-footer"><div><span className="egg">◉</span><span><small>正在孵化</small><strong>完成下一小步，让鱼卵裂开</strong></span></div><button onClick={() => openFocus(selectedTask)}>去跟随这条鱼</button></div></aside></section>
    </> : <section className="deep-panel"><div className="deep-water"><div className="deep-glow glow-one" /><div className="deep-glow glow-two" /><span className="whale">🐋</span><span className="deep-jelly">🪼</span><div className="migration-card"><p className="eyebrow">MIGRATION 01</p><span>鲸鲨 · 长期迁徙</span><h2>完成博士论文</h2><p>不需要今天抵达。每一次靠近，都会让它穿过一小片海。</p><div className="migration-line"><i /><i /><i className="current" /><i /><i /></div><button onClick={() => { setCapture("我今天想为博士论文推进一点，但脑子里还有很多别的事情"); setStage("intake"); }}>把今天想到的都说出来</button></div></div><div className="deep-notes"><p className="eyebrow">DEEP SEA NOTES</p><h2>暂时不执行，也不必忘记</h2><div className="idea-chips"><span>毕业后的研究方向</span><span>想读但还没空读的书</span><span>未来可以合作的课题</span><button>＋ 放入一个深海想法</button></div></div></section>}

    <button className="rescue-button" onClick={() => { setRescued(false); setRescueReason(""); setModal("rescue"); }}><span>↟</span><span><strong>我现在动不了</strong><small>带我回到水面</small></span></button>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}><section className={`modal-card ${modal === "focus" ? "focus-modal" : ""} ${modal === "celebrate" ? "celebrate-modal" : ""}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="close-modal" onClick={() => setModal(null)} aria-label="关闭">×</button>
      {modal === "capture" && <form onSubmit={prepareRoute}><p className="eyebrow">BRAIN DROP · 脑内倾倒</p><div className="v2-heading"><h2>把它先交给海洋</h2><span>V2</span></div><p className="modal-lead">想到什么就写什么。向导会根据具体事项决定步骤，不再给每件事同一套答案。</p>
        {!route && !routeLoading ? <><label className="sr-only" htmlFor="capture">记录想到的事情</label><textarea id="capture" autoFocus value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="例如：我要读完一篇关于家长学业社会化的文献，并判断能不能放进理论框架……" /><div className="example-chips"><button type="button" onClick={() => setCapture("修改论文 Discussion：回应导师关于理论贡献不清楚的批注")}>论文修改</button><button type="button" onClick={() => setCapture("读一篇关于家长学业社会化的文献，判断能不能放进理论框架")}>读文献</button><button type="button" onClick={() => setCapture("给导师发邮件，确认下周组会要汇报哪些分析")}>导师沟通</button></div>{routeError && <p className="route-error">{routeError}</p>}<div className="prompt-row"><small>不用先想清楚，写得乱也可以。</small><button className="primary-action" type="submit" disabled={capture.trim().length < 2}>生成这件事的潜水路线 →</button></div></> : routeLoading ? <div className="route-loading"><div><i /><i /><i /></div><strong>正在辨认这件事需要怎样的帮助…</strong><span>先找任务类型，再找最小的可靠入口。</span></div> : route && <div className="route-result"><div className={`route-species ${route.color}`}><span>{route.creature}</span><div><small>{route.taskKindLabel} · 为这件事匹配的伙伴</small><strong>{route.species}</strong><p>{route.reason}</p></div><em>{route.source === "openrouter" ? "AI 向导" : "本地智能向导"}</em></div><h3>{route.summary}</h3><ol>{route.steps.map((step, index) => <li key={`${step.title}-${index}`}><span>{index + 1}</span><div><small>{index === 0 ? "先靠近，不要求进入状态" : `抵达第 ${index + 1} 枚浮标 · ${step.minutes} 分钟`}</small><strong>{step.title}</strong><em>看见这个就算完成：{step.doneWhen}</em></div></li>)}</ol><div className="route-feedback"><span>这条路线合身吗？</span><button type="button" disabled={routeLoading} onClick={() => void requestRoute("smaller")}>还是太大</button><button type="button" disabled={routeLoading} onClick={() => void requestRoute("wrong")}>方向不对</button><button type="button" disabled={routeLoading} onClick={() => void requestRoute("done")}>第一步做过了</button></div>{route.workPack && <button type="button" className="pack-recommendation" onClick={() => openPack(route.workPack as Exclude<WorkPackId, null>)}><span>{workPackMeta[route.workPack].icon}</span><div><small>为这件事推荐</small><strong>{route.workPackLabel}</strong><p>{workPackMeta[route.workPack].intro}</p></div><b>打开看看 →</b></button>}<p className="gentle-note">今天只把第一步放进鱼缸。完成标准是：{route.doneDefinition}</p><button className="primary-action full" type="button" onClick={addTask}>孵化这枚鱼卵</button></div>}
      </form>}
      {modal === "workpack" && <><p className="eyebrow">DYNAMIC WORK PACK · 动态工作包</p><div className="pack-title"><span>{pack.icon}</span><div><h2>{pack.label}</h2><p>{pack.intro}</p></div></div><div className="pack-document">{pack.sections.map((section, index) => <label key={section}><span><b>{String(index + 1).padStart(2, "0")}</b>{section}</span><textarea defaultValue={index === 0 && capture ? `围绕「${capture}」，我这一次最想解决的是：` : ""} placeholder="可以现在写，也可以先留空……" /></label>)}</div><p className="gentle-note">工作包会跟着气泡内容生成；它是思考扶手，不是另一份必须填完的表格。</p><button className="primary-action full" onClick={() => setModal("capture")}>带着工作包回到潜水路线</button></>}
      {modal === "weather" && <><p className="eyebrow">CHECK THE TIDE · 感受海况</p><h2>今天的你，有多少氧气？</h2><p className="modal-lead">这不是能力测试，只是为今天选择一个舒服的鱼缸大小。</p><div className="weather-list">{weathers.map((item) => <button key={item.capacity} className={weather.capacity === item.capacity ? "chosen" : ""} onClick={() => { setWeather(item); setModal(null); }}><span>{item.icon}</span><span><strong>{item.name}</strong><small>{item.note}</small></span><b>{item.capacity} 枚</b></button>)}</div></>}
      {modal === "focus" && <><p className="eyebrow">FOLLOW ONE FISH · 只跟一条鱼</p><div className={`focus-creature ${selectedTask.color}`}>{selectedTask.creature}</div><h2>{selectedTask.title}</h2><p className="focus-next">可以先从这里靠近：<strong>{selectedTask.next}</strong></p><label className="focus-time-editor"><span>我现在估计整件事需要</span><span><input type="number" min="5" max="600" step="5" value={selectedTask.minutes} onChange={(event) => changeSelectedMinutes(Number(event.target.value))} /> 分钟</span></label><div className={`timer ${running ? "ticking" : ""}`}>{clock}</div><p className="timer-note">这是你给自己的时间参考，不是完成任务的资格线。提前或晚一点都可以直接点完成。</p><div className="focus-actions"><button className="secondary-action" onClick={() => setRunning((value) => !value)}>{running ? "暂停一下" : "开始计时"}</button><button className="primary-action" onClick={completeStep}>这件事完成了，孵化伙伴 ✓</button></div><button className="shrink-link" onClick={() => { setModal("rescue"); setRescueReason("觉得太大"); }}>现在还是太难，先缩成一个靠近动作</button></>}
      {modal === "rescue" && <><p className="eyebrow">SURFACE MODE · 回到水面</p><div className="rescue-symbol">↟</div><h2>{rescued ? "好，我们只做两分钟" : "没关系，先告诉我卡在哪里"}</h2>{!rescued ? <><p className="modal-lead">你不需要解释得很完整，点一个最接近的就好。</p><div className="reason-grid">{["不知道怎么开始","觉得太大","害怕做不好","太累了","被别的想法吸走","环境不合适"].map((reason) => <button className={rescueReason === reason ? "chosen" : ""} key={reason} onClick={() => setRescueReason(reason)}>{reason}</button>)}</div><button disabled={!rescueReason} className="primary-action full" onClick={() => setRescued(true)}>帮我缩到两分钟</button></> : <><div className="two-minute-card"><small>你的安全靠近动作</small><strong>只打开相关入口，什么都不用改。</strong><span>做完可以立刻回来摸鱼。</span></div><p className="gentle-note">其他提醒已经暂时沉到水下。此刻只需要看见这一件事。</p><button className="primary-action full" onClick={() => { setSeconds(2 * 60); setRunning(false); setModal("focus"); }}>好，陪它游两分钟</button></>}</>}
      {modal === "collection" && <><p className="eyebrow">OCEAN FIELD GUIDE · 海洋图鉴</p><h2>你真正孵化出的伙伴</h2><p className="modal-lead">每位伙伴都会从鱼卵一直陪你游到这里，保持它原来的样子。</p>{tasks.some((task) => task.status === "done") ? <div className="collection-grid">{tasks.filter((task) => task.status === "done").map((task, index) => <article key={task.id}><span>{task.creature}</span><small>No. {String(index + 1).padStart(3, "0")} · 已入住</small><strong>{task.species}</strong><p>{task.title}</p></article>)}</div> : <div className="empty-collection"><span>◌</span><strong>图鉴还在等第一位伙伴</strong><p>完成任意一件任务后，它会带着原来的样子住进这里。</p></div>}</>}
      {modal === "celebrate" && <><div className={`celebrate-water ${selectedTask.color}`}><span className="hatch-ring" /><span className="new-fish">{selectedTask.creature}</span><i className="spark s1">✦</i><i className="spark s2">·</i><i className="spark s3">✧</i></div><p className="eyebrow">A NEW LIFE · 成功孵化</p><h2>{selectedTask.species}来到你的海洋了</h2><p className="modal-lead">你完成的是「{selectedTask.title}」。时间只是你自己的估计，真正让伙伴孵化的是你确认这件事已经完成。</p><div className="reward-card"><span>{selectedTask.creature}</span><div><small>图鉴新增伙伴</small><strong>{selectedTask.species} · 会保持原来的样子</strong></div></div><button className="primary-action full" onClick={() => setModal("collection")}>去图鉴看看它</button></>}
    </section></div>}
  </main>;
}
