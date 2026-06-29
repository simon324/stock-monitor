import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (symbols.length === 0) return NextResponse.json({ quotes: [] });
  try {
    const quotes = await getQuotes(symbols);
    return NextResponse.json({ quotes });
  } catch (e) {
    return NextResponse.json(
      { quotes: [], error: (e as Error).message },
      { status: 502 },
    );
  }
}
