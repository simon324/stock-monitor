import { NextRequest, NextResponse } from "next/server";
import { getQuotes, getFundamentals, getNews } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

/** Pull the first balanced JSON object out of a model response. */
function parseJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let ticker = "";
  let apiKey = "";
  let model = DEFAULT_MODEL;
  try {
    const body = await req.json();
    ticker = String(body.ticker ?? "").trim().toUpperCase();
    apiKey = String(body.apiKey ?? "").trim();
    if (body.model) model = String(body.model).trim();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!ticker) return NextResponse.json({ error: "No ticker" }, { status: 400 });

  // Bring-your-own-key: prefer the key from the request, fall back to server env.
  const key = apiKey || process.env.OPENROUTER_API_KEY || "";
  if (!key) {
    return NextResponse.json({
      available: false,
      message:
        "Add your OpenRouter API key in Settings (⚙) to enable AI research. Get one free at openrouter.ai/keys.",
    });
  }

  try {
    const [quoteArr, fundamentals, news] = await Promise.all([
      getQuotes([ticker]),
      getFundamentals(ticker),
      getNews(ticker),
    ]);
    const quote = quoteArr[0] ?? null;

    const fd = fundamentals as Record<string, unknown> | null;
    const profile = (fd?.assetProfile ?? {}) as Record<string, unknown>;
    const facts = {
      quote,
      profile: {
        sector: profile.sector ?? null,
        industry: profile.industry ?? null,
        summary: profile.longBusinessSummary ?? null,
      },
      keyStats: fd?.defaultKeyStatistics ?? null,
      financials: fd?.financialData ?? null,
      summaryDetail: fd?.summaryDetail ?? null,
      news: news.map((n) => ({ title: n.title, publisher: n.publisher })),
    };

    const system =
      "You are an equity research analyst. Respond with ONLY a valid JSON object — no prose, no markdown fences. " +
      "Schema: {verdict: 'constructive'|'neutral'|'cautious', confidence: 'low'|'medium'|'high', " +
      "summary: string (two sentences), bullCase: string[], bearCase: string[], keyRisks: string[], recentCatalysts: string[]}. " +
      "Use ONLY the supplied facts — never invent numbers or events; omit anything not present. One sentence per bullet. " +
      "This is educational analysis, not investment advice.";

    const user = `Write a research brief for ${ticker}.\n\nFACTS:\n${JSON.stringify(
      facts,
    ).slice(0, 14000)}`;

    const resp = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/simon324/stock-monitor",
          "X-Title": "Stock Monitor",
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 1200,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      },
    );

    const j = await resp.json();
    if (!resp.ok) {
      const msg =
        j?.error?.message || j?.message || `OpenRouter error (${resp.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const content: string = j?.choices?.[0]?.message?.content ?? "";
    const brief = parseJsonObject(content);
    if (!brief) {
      return NextResponse.json(
        { error: "The model did not return valid JSON. Try another model." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      available: true,
      ticker,
      model,
      brief,
      snapshot: {
        price: quote?.price ?? null,
        currency: quote?.currency ?? null,
        sector: facts.profile.sector,
        industry: facts.profile.industry,
      },
      news: news.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
