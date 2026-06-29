import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getQuotes, getFundamentals, getNews } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.STOCK_RESEARCH_MODEL || "claude-sonnet-4-6";

const briefTool: Anthropic.Tool = {
  name: "emit_brief",
  description: "Emit the structured stock research brief.",
  input_schema: {
    type: "object",
    properties: {
      verdict: {
        type: "string",
        enum: ["constructive", "neutral", "cautious"],
      },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      summary: { type: "string", description: "Two-sentence plain-English take." },
      bullCase: { type: "array", items: { type: "string" } },
      bearCase: { type: "array", items: { type: "string" } },
      keyRisks: { type: "array", items: { type: "string" } },
      recentCatalysts: { type: "array", items: { type: "string" } },
    },
    required: ["verdict", "confidence", "summary", "bullCase", "bearCase", "keyRisks"],
  },
};

export async function POST(req: NextRequest) {
  let ticker = "";
  try {
    const body = await req.json();
    ticker = String(body.ticker ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!ticker) return NextResponse.json({ error: "No ticker" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      available: false,
      message:
        "AI research is disabled. Set ANTHROPIC_API_KEY in your environment to enable it.",
    });
  }

  try {
    const [quoteArr, fundamentals, news] = await Promise.all([
      getQuotes([ticker]),
      getFundamentals(ticker),
      getNews(ticker),
    ]);
    const quote = quoteArr[0] ?? null;

    // Compact fact pack so the model only reasons over fetched data.
    const fd = fundamentals as Record<string, unknown> | null;
    const facts = {
      quote,
      profile: {
        sector: (fd?.assetProfile as Record<string, unknown>)?.sector ?? null,
        industry: (fd?.assetProfile as Record<string, unknown>)?.industry ?? null,
        summary:
          (fd?.assetProfile as Record<string, unknown>)?.longBusinessSummary ??
          null,
      },
      keyStats: fd?.defaultKeyStatistics ?? null,
      financials: fd?.financialData ?? null,
      summaryDetail: fd?.summaryDetail ?? null,
      news: news.map((n) => ({ title: n.title, publisher: n.publisher })),
    };

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      tools: [briefTool],
      tool_choice: { type: "tool", name: "emit_brief" },
      messages: [
        {
          role: "user",
          content: [
            `You are an equity research analyst. Write a concise research brief for ${ticker}.`,
            `Use ONLY the JSON facts below — do not invent numbers or events. If something is missing, omit it rather than guessing.`,
            `Keep each bullet to one sentence. This is educational analysis, not investment advice.`,
            ``,
            `FACTS:`,
            JSON.stringify(facts).slice(0, 14000),
          ].join("\n"),
        },
      ],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const brief = block && block.type === "tool_use" ? block.input : null;

    return NextResponse.json({
      available: true,
      ticker,
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
