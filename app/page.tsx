"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Modal = null | "capture" | "weather" | "focus" | "rescue" | "collection" | "celebrate";
type Task = { id: number; title: string; creature: string; species: string; next: string; minutes: number; oxygen: number; status: "active" | "waiting" | "ready" | "done"; color: string };

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

const routeSteps = [
  "打开相关文件，把所有要求放在眼前",
  "只标出一个最需要处理的地方",
  "用 10 分钟完成一个看得见的小产出",
];

export default function Home() {
  const [modal, setModal] = useState<Modal>(null);
  const [mode, setMode] = useState<"shallow" | "deep">("shallow");
  const [tasks, setTasks] = useState<Task[]>(startingTasks);
  const [weather, setWeather] = useState(weathers[2]);
  const [capture, setCapture] = useState("");
  const [routeReady, setRouteReady] = useState(false);
  const [selectedId, setSelectedId] = useState(1);
  const [seconds, setSeconds] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [rescueReason, setRescueReason] = useState("");
  const [rescued, setRescued] = useState(false);

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? tasks[0];
  const usedOxygen = tasks.filter((task) => task.status !== "waiting" && task.status !== "done").reduce((sum, task) => sum + task.oxygen, 0);
  const oxygenDots = useMemo(() => Array.from({ length: weather.capacity }, (_, i) => i < usedOxygen), [weather.capacity, usedOxygen]);

  useEffect(() => {
    if (!running || modal !== "focus" || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, modal, seconds]);

  function openFocus(task: Task) {
    if (task.status === "waiting") return;
    setSelectedId(task.id);
    setSeconds(task.minutes * 60);
    setRunning(false);
    setModal("focus");
  }

  function prepareRoute(event: FormEvent) {
    event.preventDefault();
    if (!capture.trim()) return;
    setRouteReady(true);
  }

  function addTask() {
    const id = Date.now();
    const task: Task = { id, title: capture.trim(), creature: "🐙", species: "章鱼", next: routeSteps[0], minutes: 10, oxygen: 2, status: "ready", color: "octopus" };
    setTasks((current) => [...current, task]);
    setSelectedId(id);
    setCapture("");
    setRouteReady(false);
    setModal(null);
  }

  function completeStep() {
    setTasks((current) => current.map((task) => task.id === selectedId ? { ...task, status: "done" } : task));
    setRunning(false);
    setModal("celebrate");
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setMode("shallow")} aria-label="返回浅海首页">
          <span className="brand-mark">◌</span><span><strong>海洋馆奇妙夜</strong><small>让重要的事，轻轻向前游</small></span>
        </button>
        <nav aria-label="主要导航">
          <button className={`nav-pill ${mode === "shallow" ? "active" : ""}`} onClick={() => setMode("shallow")}>浅海 · 今天</button>
          <button className={`nav-pill ${mode === "deep" ? "active deep-active" : ""}`} onClick={() => setMode("deep")}>深海 · 长期</button>
          <button className="icon-button" onClick={() => setModal("collection")} aria-label="打开海洋图鉴">✦</button>
        </nav>
      </header>

      <section className="welcome-row">
        <div><p className="eyebrow">SATURDAY · 8月22日</p><h1>{mode === "shallow" ? <>晚上好，Shary<br />今天想和哪条鱼一起游？</> : <>欢迎来到深海<br />那些遥远的事，也在缓慢发光</>}</h1></div>
        <button className="weather-card" onClick={() => setModal("weather")}>
          <span className="weather-icon">{weather.icon}</span><span><small>今日海况</small><strong>{weather.name} · {weather.capacity}枚氧气</strong></span><span>⌄</span>
        </button>
      </section>

      {mode === "shallow" ? (
        <section className="dashboard-grid">
          <div className="left-column">
            <article className="capture-card">
              <div className="capture-icon">✧</div><div><h2>脑子里突然冒出来了？</h2><p>先放进这里。你不需要现在就想清楚。</p></div><button onClick={() => setModal("capture")}>说给我听 <span>→</span></button>
            </article>
            <article className="task-panel">
              <div className="section-heading"><div><p className="eyebrow">TODAY&apos;S TANK</p><h2>今日生态缸</h2></div><div className="oxygen"><span>{oxygenDots.map((full, index) => <i key={index} className={full ? "full" : ""}>●</i>)}</span><small>{usedOxygen} / {weather.capacity} 氧气</small></div></div>
              {tasks.filter((task) => task.status !== "done").map((task) => (
                <button key={task.id} className={`task-card ${task.id === selectedId ? "selected" : ""}`} onClick={() => openFocus(task)}>
                  <span className={`fish-avatar ${task.color}`}>{task.creature}</span><span className="task-copy"><small>{task.species} · {task.status === "waiting" ? "候潮中" : task.id === selectedId ? "正在跟随" : "准备下潜"}</small><strong>{task.title}</strong><span>{task.status === "waiting" ? task.next : `下一步：${task.next}`}</span>{task.status !== "waiting" && <span className="task-meta"><b>约 {task.minutes} 分钟</b><i>{task.oxygen} 枚氧气</i></span>}</span><span className={task.status === "waiting" ? "more" : "play"}>{task.status === "waiting" ? "•••" : "▶"}</span>
                </button>
              ))}
              <button className="add-small" onClick={() => setModal("capture")}>＋ 放进一枚新的鱼卵</button>
            </article>
          </div>
          <aside className="aquarium-card">
            <div className="aquarium-top"><div><p className="eyebrow">YOUR LITTLE OCEAN</p><h2>你的浅海</h2></div><span>水质清澈 · 生态舒适</span></div>
            <div className="tank" aria-label="夜光浅海生态缸">
              {["b1","b2","b3","b4","b5"].map((name) => <span className={`bubble ${name}`} key={name} />)}
              <span className="swim-fish fish-one">🐠</span><span className="swim-fish fish-two">🐟</span><span className="swim-fish fish-three">🪼</span>{tasks.some((task) => task.creature === "🐙") && <span className="swim-fish fish-four">🐙</span>}
              <div className="light-ray one" /><div className="light-ray two" /><div className="plant plant-one">〽</div><div className="plant plant-two">♒</div><div className="sand" /><div className="coral">♨</div>
            </div>
            <div className="tank-footer"><div><span className="egg">◉</span><span><small>正在孵化</small><strong>完成下一小步，让鱼卵裂开</strong></span></div><button onClick={() => openFocus(selectedTask)}>去跟随这条鱼</button></div>
          </aside>
        </section>
      ) : (
        <section className="deep-panel">
          <div className="deep-water">
            <div className="deep-glow glow-one" /><div className="deep-glow glow-two" /><span className="whale">🐋</span><span className="deep-jelly">🪼</span>
            <div className="migration-card"><p className="eyebrow">MIGRATION 01</p><span>鲸鲨 · 长期迁徙</span><h2>完成博士论文</h2><p>不需要今天抵达。每一次十分钟，都会让它穿过一小片海。</p><div className="migration-line"><i /><i /><i className="current" /><i /><i /></div><button onClick={() => { setMode("shallow"); setModal("capture"); setCapture("为博士论文推进一个十分钟的小步骤"); }}>今天陪它游十分钟</button></div>
          </div>
          <div className="deep-notes"><p className="eyebrow">DEEP SEA NOTES</p><h2>暂时不执行，也不必忘记</h2><div className="idea-chips"><span>毕业后的研究方向</span><span>想读但还没空读的书</span><span>未来可以合作的课题</span><button>＋ 放入一个深海想法</button></div></div>
        </section>
      )}

      <button className="rescue-button" onClick={() => { setRescued(false); setRescueReason(""); setModal("rescue"); }}><span>↟</span><span><strong>我现在动不了</strong><small>带我回到水面</small></span></button>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
          <section className={`modal-card ${modal === "focus" ? "focus-modal" : ""} ${modal === "celebrate" ? "celebrate-modal" : ""}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-modal" onClick={() => setModal(null)} aria-label="关闭">×</button>

            {modal === "capture" && <form onSubmit={prepareRoute}>
              <p className="eyebrow">BRAIN DROP · 脑内倾倒</p><h2>把它先交给海洋</h2><p className="modal-lead">想到什么就写什么。不用分类，不用判断它重不重要。</p>
              {!routeReady ? <><label className="sr-only" htmlFor="capture">记录想到的事情</label><textarea id="capture" autoFocus value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="例如：下周要交报销、导师让我改 Discussion、数据好像有点问题……" /><div className="prompt-row"><button type="button" onClick={() => setCapture("下周要完成论文 Discussion 的修改，但我不知道怎么开始")}>试试这个例子</button><button className="primary-action" type="submit">帮我规划潜水路线 →</button></div></> : <div className="route-result"><div className="route-species"><span>🐙</span><div><small>系统为它找到了一位伙伴</small><strong>章鱼 · 适合多步骤任务</strong></div></div><h3>{capture}</h3><ol>{routeSteps.map((step, index) => <li key={step}><span>{index + 1}</span><div><small>{index === 0 ? "两分钟启动动作" : index === 1 ? "抵达第一枚浮标" : "获得一个可见成果"}</small><strong>{step}</strong></div></li>)}</ol><p className="gentle-note">今天只把第一步放进鱼缸，其他步骤由章鱼替你记住。</p><button className="primary-action full" type="button" onClick={addTask}>孵化这枚鱼卵</button></div>}
            </form>}

            {modal === "weather" && <><p className="eyebrow">CHECK THE TIDE · 感受海况</p><h2>今天的你，有多少氧气？</h2><p className="modal-lead">这不是能力测试，只是为今天选择一个舒服的鱼缸大小。</p><div className="weather-list">{weathers.map((item) => <button key={item.capacity} className={weather.capacity === item.capacity ? "chosen" : ""} onClick={() => { setWeather(item); setModal(null); }}><span>{item.icon}</span><span><strong>{item.name}</strong><small>{item.note}</small></span><b>{item.capacity} 枚</b></button>)}</div></>}

            {modal === "focus" && <><p className="eyebrow">FOLLOW ONE FISH · 只跟一条鱼</p><div className="focus-creature">{selectedTask.creature}</div><h2>{selectedTask.title}</h2><p className="focus-next">现在只做这一件事：<strong>{selectedTask.next}</strong></p><div className={`timer ${running ? "ticking" : ""}`}>{clock}</div><p className="timer-note">不用做完论文，只陪它游完这一小段。</p><div className="focus-actions"><button className="secondary-action" onClick={() => setRunning((value) => !value)}>{running ? "暂停一下" : "开始计时"}</button><button className="primary-action" onClick={completeStep}>我完成这一小步了 ✓</button></div><button className="shrink-link" onClick={() => { setModal("rescue"); setRescueReason("觉得太大"); }}>还是太难了，帮我再缩小</button></>}

            {modal === "rescue" && <><p className="eyebrow">SURFACE MODE · 回到水面</p><div className="rescue-symbol">↟</div><h2>{rescued ? "好，我们只做两分钟" : "没关系，先告诉我卡在哪里"}</h2>{!rescued ? <><p className="modal-lead">你不需要解释得很完整，点一个最接近的就好。</p><div className="reason-grid">{["不知道怎么开始","觉得太大","害怕做不好","太累了","被别的想法吸走","环境不合适"].map((reason) => <button className={rescueReason === reason ? "chosen" : ""} key={reason} onClick={() => setRescueReason(reason)}>{reason}</button>)}</div><button disabled={!rescueReason} className="primary-action full" onClick={() => setRescued(true)}>帮我缩到两分钟</button></> : <><div className="two-minute-card"><small>你的安全靠近动作</small><strong>只打开文件，什么都不用改。</strong><span>做完可以立刻回来摸鱼。</span></div><p className="gentle-note">其他逾期和提醒已经暂时沉到水下。此刻你只需要看见这一件事。</p><button className="primary-action full" onClick={() => { setSeconds(2 * 60); setRunning(false); setModal("focus"); }}>好，陪它游两分钟</button></>}</>}

            {modal === "collection" && <><p className="eyebrow">OCEAN FIELD GUIDE · 海洋图鉴</p><h2>你已经陪这些生命来到这里</h2><p className="modal-lead">这里收藏的不是“自律”，而是你一次次愿意重新开始的证据。</p><div className="collection-grid"><article><span>🐠</span><small>No. 001 · 已入住</small><strong>珊瑚小丑鱼</strong><p>在不想打开论文时，仍然找到了第一条批注。</p></article><article><span>🪼</span><small>No. 002 · 已发现</small><strong>月亮水母</strong><p>学会了等待别人回复时，不继续消耗氧气。</p></article><article className="locked"><span>◌</span><small>No. 003 · 孵化中</small><strong>神秘的新朋友</strong><p>再完成一个小步骤，就能看见它。</p></article></div></>}

            {modal === "celebrate" && <><div className="celebrate-water"><span className="hatch-ring" /><span className="new-fish">🐠</span><i className="spark s1">✦</i><i className="spark s2">·</i><i className="spark s3">✧</i></div><p className="eyebrow">A NEW LIFE · 成功孵化</p><h2>你让一件重要的事，向前游了一小段</h2><p className="modal-lead">这不只是“打了一个勾”。你克服了启动、注意力和不确定性，完成了一个真实的前进。</p><div className="reward-card"><span>＋ 1</span><div><small>获得新记录</small><strong>今晚，我愿意先开始两分钟。</strong></div></div><button className="primary-action full" onClick={() => setModal("collection")}>把它放进我的海洋图鉴</button></>}
          </section>
        </div>
      )}
    </main>
  );
}
