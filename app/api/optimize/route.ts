import { NextRequest, NextResponse } from "next/server";
import { getCloseMap } from "@/lib/finance";
import { detectRegimes } from "@/lib/markov";
import { optimize } from "@/lib/optimize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROXY = "SPY"; // market proxy for regime detection

export async function POST(req: NextRequest) {
  let tickers: string[] = [];
  try {
    const body = await req.json();
    tickers = (body.tickers ?? [])
      .map((t: string) => String(t).trim().toUpperCase())
      .filter(Boolean);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (tickers.length < 2) {
    return NextResponse.json(
      { error: "Add at least 2 tickers to optimize a portfolio." },
      { status: 400 },
    );
  }

  try {
    const symbols = Array.from(new Set([...tickers, PROXY]));
    const maps = await Promise.all(symbols.map((s) => getCloseMap(s, "2y")));
    const bySymbol = new Map(symbols.map((s, i) => [s, maps[i]]));

    // Align tickers on their common set of dates.
    const proxyMap = bySymbol.get(PROXY)!;
    const tickerMaps = tickers.map((t) => bySymbol.get(t)!);
    const commonDates = [...tickerMaps[0].keys()]
      .filter((d) => tickerMaps.every((m) => m.has(d)))
      .sort();

    if (commonDates.length < 60) {
      return NextResponse.json(
        { error: "Not enough overlapping price history for these tickers." },
        { status: 422 },
      );
    }

    const closesBySymbol = tickerMaps.map((m) =>
      commonDates.map((d) => m.get(d)!),
    );
    const proxyCloses = [...proxyMap.keys()].sort().map((d) => proxyMap.get(d)!);

    const markov = detectRegimes(proxyCloses);
    const result = optimize(tickers, closesBySymbol, markov.current);

    return NextResponse.json({ markov, optimization: result, proxy: PROXY });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
