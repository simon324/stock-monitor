"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PriceChart from "@/components/PriceChart";
import OptimizePanel from "@/components/OptimizePanel";
import ResearchDrawer from "@/components/ResearchDrawer";

type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  marketState: string | null;
};

const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"];
const POLL_MS = 8000;

export default function Home() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [research, setResearch] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const flash = useRef<Record<string, number>>({});

  // Load / persist watchlist.
  useEffect(() => {
    const saved =
      typeof window !== "undefined" && localStorage.getItem("watchlist");
    const list = saved ? (JSON.parse(saved) as string[]) : DEFAULT_WATCHLIST;
    setTickers(list);
    setSelected(list[0] ?? null);
  }, []);

  useEffect(() => {
    if (tickers.length > 0)
      localStorage.setItem("watchlist", JSON.stringify(tickers));
  }, [tickers]);

  const poll = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    try {
      const r = await fetch(`/api/quote?symbols=${symbols.join(",")}`);
      const j = await r.json();
      setQuotes((prev) => {
        const next = { ...prev };
        for (const q of j.quotes as Quote[]) {
          if (prev[q.symbol]?.price != null && q.price !== prev[q.symbol].price) {
            flash.current[q.symbol] =
              (q.price ?? 0) >= (prev[q.symbol].price ?? 0) ? 1 : -1;
          }
          next[q.symbol] = q;
        }
        return next;
      });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      /* keep last quotes on transient failure */
    }
  }, []);

  // Poll quotes on an interval.
  useEffect(() => {
    if (tickers.length === 0) return;
    poll(tickers);
    const id = setInterval(() => poll(tickers), POLL_MS);
    return () => clearInterval(id);
  }, [tickers, poll]);

  function addTicker(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t)) {
      setInput("");
      return;
    }
    setTickers((prev) => [...prev, t]);
    setSelected(t);
    setInput("");
  }

  function removeTicker(t: string) {
    setTickers((prev) => prev.filter((x) => x !== t));
    if (selected === t) setSelected(tickers.find((x) => x !== t) ?? null);
  }

  return (
    <div className="flex-1">
      {/* Top bar */}
      <header className="border-b border-neutral-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm text-white">
              ↗
            </span>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight tracking-tight">
                Stock Monitor
              </h1>
              <p className="text-xs text-neutral-500">
                Live prices · Markov optimizer · AI research
              </p>
            </div>
          </div>
          <span className="text-xs text-neutral-400">
            {lastUpdate ? `Updated ${lastUpdate}` : "Loading…"}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* Add ticker */}
        <form onSubmit={addTicker} className="mb-6 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add ticker — e.g. TSLA"
            className="w-56 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Add
          </button>
        </form>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* Price tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tickers.map((t) => {
                const q = quotes[t];
                const up = (q?.changePercent ?? 0) >= 0;
                const dir = flash.current[t];
                return (
                  <div
                    key={t}
                    onClick={() => setSelected(t)}
                    className={`group cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                      selected === t
                        ? "border-neutral-900 ring-1 ring-neutral-900"
                        : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[13px] font-semibold tracking-tight text-neutral-700">
                        {t}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTicker(t);
                        }}
                        className="text-neutral-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      className={`mt-2 text-xl font-semibold tabular-nums tracking-tight transition-colors ${
                        dir === 1
                          ? "text-emerald-600"
                          : dir === -1
                            ? "text-red-600"
                            : "text-neutral-900"
                      }`}
                    >
                      {q?.price != null ? q.price.toFixed(2) : "—"}
                    </div>
                    <div
                      className={`mt-0.5 text-xs font-medium tabular-nums ${
                        up ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {q?.changePercent != null
                        ? `${up ? "▲" : "▼"} ${Math.abs(q.changePercent).toFixed(2)}%`
                        : ""}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResearch(t);
                      }}
                      className="mt-3 w-full rounded-lg border border-neutral-200 py-1.5 text-[11px] font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
                    >
                      Research
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <PriceChart symbol={selected} />
            </div>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <OptimizePanel tickers={tickers} />
            <p className="rounded-xl border border-neutral-200 bg-white p-4 text-[11px] leading-relaxed text-neutral-500 shadow-sm">
              Educational tool only — not investment advice. Prices come from free
              Yahoo Finance data (delayed / unofficial) and may be inaccurate. The
              optimizer is a simplified model; do your own research.
            </p>
          </aside>
        </div>
      </main>

      <ResearchDrawer ticker={research} onClose={() => setResearch(null)} />
    </div>
  );
}
