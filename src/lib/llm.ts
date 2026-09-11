export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

class LlmError extends Error {
  constructor(
    message: string,
    readonly code: "rate_limit" | "auth" | "credits" | "unavailable" = "unavailable",
  ) {
    super(message);
    this.name = "LlmError";
  }
}

type Cfg = { provider: "huggingface" | "groq"; apiKey: string; baseUrl: string; model: string };

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function configs(): Cfg[] {
  const list: Cfg[] = [];
  const hf = env("HF_TOKEN") || env("HUGGINGFACE_API_KEY");
  if (hf) {
    list.push({
      provider: "huggingface",
      apiKey: hf,
      baseUrl: (env("HF_BASE_URL") || "https://router.huggingface.co/v1").replace(/\/$/, ""),
      model: env("LLM_MODEL") || "openai/gpt-oss-120b",
    });
  }
  const groq = env("GROQ_API_KEY");
  if (groq) {
    list.push({
      provider: "groq",
      apiKey: groq,
      baseUrl: (env("GROQ_BASE_URL") || "https://api.groq.com/openai/v1").replace(/\/$/, ""),
      model: env("GROQ_MODEL") || env("LLM_MODEL") || "openai/gpt-oss-120b",
    });
  }
  return list;
}

export function hasLlm() {
  return configs().length > 0;
}

export function llmProvider(): "huggingface" | "groq" | "off" {
  const list = configs();
  if (list.some((c) => c.provider === "huggingface")) return "huggingface";
  if (list.some((c) => c.provider === "groq")) return "groq";
  return "off";
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function contentOf(data: {
  choices?: { message?: { content?: string | { text?: string }[] }; finish_reason?: string }[];
}) {
  const raw = data.choices?.[0]?.message?.content;
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) return raw.map((p) => (typeof p === "string" ? p : p.text ?? "")).join("").trim();
  return "";
}

function modelsFor(cfg: Cfg) {
  if (cfg.provider === "huggingface" && !cfg.model.includes(":")) return [cfg.model, `${cfg.model}:fastest`];
  return [cfg.model];
}

async function postChat(cfg: Cfg, model: string, messages: ChatMessage[], extras: Record<string, unknown>) {
  return fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
      ...extras,
    }),
    cache: "no-store",
  });
}

async function complete(messages: ChatMessage[]): Promise<{ text: string; provider: Cfg["provider"] }> {
  const list = configs();
  if (!list.length) throw new LlmError("No Hugging Face token is configured.", "auth");

  let last = "";
  providerLoop: for (const cfg of list) {
    for (const model of modelsFor(cfg)) {
      const extrasList: Record<string, unknown>[] =
        cfg.provider === "huggingface"
          ? [{ reasoning_effort: "low", response_format: { type: "json_object" } }, { response_format: { type: "json_object" } }, {}]
          : [{ response_format: { type: "json_object" } }, {}];

      for (const extras of extrasList) {
        const res = await postChat(cfg, model, messages, extras);
        if (res.ok) {
          return { text: contentOf(await res.json()), provider: cfg.provider };
        }
        const text = await res.text().catch(() => "");
        last = `${cfg.provider} ${res.status}: ${text.slice(0, 240)}`;
        if (res.status === 401 || res.status === 402 || res.status === 429) continue providerLoop;
        if (res.status === 400 || res.status === 404 || res.status === 422) continue;
        continue providerLoop;
      }
    }
  }
  if (/429/.test(last)) throw new LlmError("The model is rate-limited. Try again in a moment.", "rate_limit");
  if (/402/.test(last)) throw new LlmError("Inference credits are used up.", "credits");
  throw new LlmError(last || "Model did not return a completion.", "unavailable");
}

export async function chatJson<T>(messages: ChatMessage[]): Promise<{ data: T; provider: Cfg["provider"] }> {
  const { text, provider } = await complete(messages);
  const raw = text || "";
  try {
    return { data: JSON.parse(raw) as T, provider };
  } catch {
    const extracted = extractJsonObject(raw);
    if (!extracted) throw new LlmError("Model did not return JSON.", "unavailable");
    return { data: JSON.parse(extracted) as T, provider };
  }
}
