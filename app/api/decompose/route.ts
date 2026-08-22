git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
import { buildLocalDecomposition, type Decomposition, type RouteFeedback } from "../../../lib/decompose";

export const runtime = "edge";

const schema = {
  name: "adhd_task_route",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["taskKind", "taskKindLabel", "creature", "species", "color", "summary", "reason", "steps", "workPack", "workPackLabel", "doneDefinition"],
    properties: {
      taskKind: { enum: ["writing", "reading", "communication", "meeting", "analysis", "admin", "waiting", "general"] },
      taskKindLabel: { type: "string" },
      creature: { type: "string" },
      species: { type: "string" },
      color: { type: "string" },
      summary: { type: "string" },
      reason: { type: "string" },
      steps: {
        type: "array", minItems: 3, maxItems: 6,
        items: {
          type: "object", additionalProperties: false,
          required: ["title", "doneWhen", "minutes"],
          properties: { title: { type: "string" }, doneWhen: { type: "string" }, minutes: { type: "integer", minimum: 1, maximum: 30 } },
        },
      },
      workPack: { anyOf: [{ enum: ["paper", "literature", "communication", "meeting"] }, { type: "null" }] },
      workPackLabel: { anyOf: [{ type: "string" }, { type: "null" }] },
      doneDefinition: { type: "string" },
    },
  },
};

function isValid(value: unknown): value is Omit<Decomposition, "source"> {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.summary === "string" && typeof item.reason === "string" && typeof item.doneDefinition === "string" && Array.isArray(item.steps) && item.steps.length >= 3;
}

export async function POST(request: Request) {
  let body: { input?: string; feedback?: RouteFeedback };
  try { body = await request.json(); } catch { return Response.json({ error: "请把气泡内容重新告诉我一次。" }, { status: 400 }); }
  const input = body.input?.trim() ?? "";
  if (input.length < 2 || input.length > 1200) return Response.json({ error: "请写下 2–1200 个字的事项。" }, { status: 400 });

  const fallback = buildLocalDecomposition(input, body.feedback);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json(fallback);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://ocean-night-adhd.chanshunlamedu.chatgpt.site",
        "X-Title": "海洋馆奇妙夜",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-5-mini",
        temperature: 0.4,
        provider: { require_parameters: true, data_collection: "deny", zdr: true },
        response_format: { type: "json_schema", json_schema: schema },
        messages: [
          {
            role: "system",
            content: "你是面向 ADHD 研究生的温柔任务拆解向导。根据用户真实事项因事制宜，不使用万能模板。给出 3–6 个按顺序的可观察动作，第一步必须在 2 分钟左右可启动，每步只有一个动作和一个清晰完成标志。不要诊断，不虚构截止日期，不使用羞耻或惩罚语言。鱼类伙伴应与任务性质有可解释联系。四种工作包仅在相关时推荐：paper、literature、communication、meeting。输出严格符合 JSON schema。",
          },
          { role: "user", content: `事项：${input}\n用户对上一版路线的反馈：${body.feedback || "无，这是第一次生成"}\n请生成一条真正针对这个事项的潜水路线。` },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty response");
    const parsed = JSON.parse(content);
    if (!isValid(parsed)) throw new Error("invalid route");
    return Response.json({ ...parsed, source: "openrouter" });
  } catch {
    return Response.json({ ...fallback, degraded: true });
  } finally {
    clearTimeout(timeout);
  }
}
