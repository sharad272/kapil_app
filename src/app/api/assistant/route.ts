import { NextResponse } from "next/server";
import { rulesFilter } from "@/lib/assistant-rules";
import { buildKpis, riskLabel } from "@/lib/kpis";
import { chatJson, hasLlm, llmProvider } from "@/lib/llm";
import { loadTL } from "@/lib/load";
import { getSession } from "@/lib/session";
import type { AssistantMatch, AssistantResult, RmKpi } from "@/lib/types";

export const maxDuration = 60;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const provider = llmProvider();
  return NextResponse.json({
    enabled: provider !== "off",
    provider: provider === "off" ? "rules" : provider,
  });
}

type ModelOut = {
  interpretation?: string;
  brief?: string;
  matches?: { id?: string; reason?: string; message?: string }[];
};

function pack(
  matches: AssistantMatch[],
  interpretation: string,
  brief: string,
  source: AssistantResult["source"],
): AssistantResult {
  return { interpretation, brief, source, matches };
}

function tidyReason(raw: string | undefined, kpis: RmKpi) {
  const fallback = kpis.flags.map(riskLabel).join(" · ") || "Matched";
  if (!raw?.trim()) return fallback;
  if (/flag|achievementPct|submitted_at|certAvg|quality_score/i.test(raw)) return fallback;
  return raw.trim();
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.profile.role !== "tl") {
    return NextResponse.json({ error: "Team lead only" }, { status: 403 });
  }

  const body = (await request.json()) as { query?: string; monthId?: string };
  const query = body.query?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ error: "Ask in a short sentence — who should we notify?" }, { status: 400 });
  }

  const payload = await loadTL(session);
  const monthId = body.monthId || payload.months.at(-1)?.id;
  if (!monthId) return NextResponse.json({ error: "No reporting month is open" }, { status: 400 });

  const roster: RmKpi[] = buildKpis({
    team: payload.team,
    months: payload.months,
    submissions: payload.submissions,
    assignments: payload.assignments,
    certs: payload.certs,
    monthId,
  });

  if (!hasLlm()) {
    const matches = rulesFilter(query, roster);
    return NextResponse.json(
      pack(matches, query, `Desk rules on ${roster.length} RMs. ${matches.length} match.`, "rules"),
    );
  }

  try {
    const { data, provider } = await chatJson<ModelOut>([
      {
        role: "system",
        content: `You are an operations assistant for a life-insurance team lead.
KRAs/KPIs you may use: APE vs target (achievementPct), FRP, policies issued, quality score, MoM APE growth, certification scores (ULIP, endowment, term), submission status, flags.
Return JSON only:
{"interpretation":"...", "brief":"one paragraph for the TL", "matches":[{"id":"exactly from roster","reason":"why this RM","message":"short in-app note the RM will read"}]}
Rules:
- Only use ids from the roster. Never invent people.
- If nobody matches, matches is [].
- message is plain English, specific, no jargon dump.
- reason is a short human phrase such as "Not submitted" or "APE 65% of target". Never raw field names or "flag is false".
- Do not mention that you are a model.`,
      },
      {
        role: "user",
        content: `Month ${monthId}. Request: ${query}\nRoster:\n${JSON.stringify(roster)}`,
      },
    ]);

    const byId = new Map(roster.map((r) => [r.id, r]));
    const matches: AssistantMatch[] = (data.matches ?? [])
      .map((m) => {
        const kpis = m.id ? byId.get(m.id) : undefined;
        if (!kpis) return null;
        return {
          id: kpis.id,
          name: kpis.name,
          email: kpis.email,
          reason: tidyReason(m.reason, kpis),
          message: m.message?.trim() || `${kpis.name.split(" ")[0]}, please review your ${kpis.month} numbers.`,
          kpis,
        };
      })
      .filter((m): m is AssistantMatch => Boolean(m));

    return NextResponse.json(
      pack(matches, data.interpretation?.trim() || query, data.brief?.trim() || "", provider),
    );
  } catch {
    const matches = rulesFilter(query, roster);
    return NextResponse.json(
      pack(matches, query, "Model unavailable — used the desk rules so you can still notify.", "rules"),
    );
  }
}
