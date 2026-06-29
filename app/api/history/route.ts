import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGES = ["1mo", "6mo", "1y", "2y"] as const;
type Range = (typeof RANGES)[number];

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "1y";
  const range: Range = (RANGES as readonly string[]).includes(rangeParam)
    ? (rangeParam as Range)
    : "1y";
  if (!symbol) return NextResponse.json({ candles: [] });
  try {
    const candles = await getHistory(symbol, range);
    return NextResponse.json({ symbol, range, candles });
  } catch (e) {
    return NextResponse.json(
      { candles: [], error: (e as Error).message },
      { status: 502 },
    );
  }
}
