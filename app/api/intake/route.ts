git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
import { buildLocalIntake, type IntakeEgg, type IntakeResult } from "../../../lib/intake";

export const runtime = "edge";

const schema = {
  name: "ocean_intake",
  strict: true,
  schema: {
    type: "object", additionalProperties: false,
    required: ["summary", "careNote", "eggs"],
    properties: {
      summary: { type: "string" }, careNote: { type: "string" },
      eggs: { type: "array", minItems: 1, maxItems: 8, items: { type: "object", additionalProperties: false, required: ["id", "title", "kind", "kindLabel", "creature", "species", "color", "reason", "firstStep", "doneDefinition", "estimatedMinutes"], properties: {
        id: { type: "string" }, title: { type: "string" }, kind: { enum: ["assigned", "communication", "writing", "reading", "meeting", "analysis", "admin", "emotion", "general"] }, kindLabel: { type: "string" }, creature: { type: "string" }, species: { type: "string" }, color: { type: "string" }, reason: { type: "string" }, firstStep: { type: "string" }, doneDefinition: { type: "string" }, estimatedMinutes: { type: "integer", minimum: 5, maximum: 600 },
      } } },
    },
  },
};

function valid(value: unknown): value is Omit<IntakeResult, "source"> {
  const item = value as { summary?: unknown; eggs?: IntakeEgg[] } | null;
  return !!item && typeof item.summary === "string" && Array.isArray(item.eggs) && item.eggs.length > 0 && item.eggs.every((entry) => entry.title && entry.species && entry.firstStep && Number.isFinite(entry.estimatedMinutes));
}

export async function POST(request: Request) {
  let body: { input?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "这颗泡泡没有听清，请再说一次。" }, { status: 400 }); }
  const input = body.input?.trim() || "";
  if (input.length < 2 || input.length > 4000) return Response.json({ error: "请写下 2–4000 个字，想到哪里说到哪里。" }, { status: 400 });
  const fallback = buildLocalIntake(input);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json(fallback);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": process.env.SITE_URL || "https://ocean-night-adhd.chanshunlamedu.chatgpt.site", "X-Title": "海洋馆奇妙夜" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-5-mini", temperature: 0.35,
        provider: { require_parameters: true, data_collection: "deny", zdr: true },
        response_format: { type: "json_schema", json_schema: schema },
        messages: [
          { role: "system", content: "你是 ADHD 研究生的海洋收件箱。用户会一次倾倒混在一起的任务、关系困扰和情绪。先识别彼此独立、可单独完成的事情，每件生成一枚鱼卵，通常 1–6 枚。外来委托、与导师沟通、自己的研究推进、情绪照护必须在确实同时存在时分成不同鱼卵，不能把情绪当作写作步骤。estimatedMinutes 是整件事的现实时间，由你给出初始建议但用户会修改；不要把两分钟启动动作误写成整件事耗时。海洋伙伴在任务卡、完成庆祝和图鉴中必须保持一致。情绪照护不能诊断，不能羞辱，也不能承诺治疗。输出严格 JSON。" },
          { role: "user", content: input },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty");
    const parsed = JSON.parse(content);
    if (!valid(parsed)) throw new Error("invalid");
    return Response.json({ ...parsed, source: "openrouter" });
  } catch { return Response.json({ ...fallback, degraded: true }); }
  finally { clearTimeout(timeout); }
}
