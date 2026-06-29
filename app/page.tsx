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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">📈 Stock Monitor</h1>
        <p className="text-sm text-neutral-400">
          Live prices · Markov-regime portfolio optimizer · AI stock researcher
        </p>
      </header>

      {/* Add ticker */}
      <form onSubmit={addTicker} className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add ticker (e.g. TSLA)"
          className="w-48 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
        >
          Add
        </button>
        <span className="ml-auto self-center text-xs text-neutral-600">
          {lastUpdate ? `Updated ${lastUpdate}` : "Loading…"}
        </span>
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
                  className={`group cursor-pointer rounded-xl border p-3 transition ${
                    selected === t
                      ? "border-neutral-600 bg-neutral-900"
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-sm font-semibold">{t}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTicker(t);
                      }}
                      className="text-neutral-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    className={`mt-1 text-lg font-semibold tabular-nums ${
                      dir === 1
                        ? "text-emerald-400"
                        : dir === -1
                          ? "text-red-400"
                          : ""
                    }`}
                  >
                    {q?.price != null ? q.price.toFixed(2) : "—"}
                  </div>
                  <div
                    className={`text-xs tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {q?.changePercent != null
                      ? `${up ? "+" : ""}${q.changePercent.toFixed(2)}%`
                      : ""}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResearch(t);
                    }}
                    className="mt-2 w-full rounded bg-neutral-800 py-1 text-[11px] text-neutral-300 hover:bg-neutral-700"
                  >
                    Research
                  </button>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <PriceChart symbol={selected} />
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-4">
          <OptimizePanel tickers={tickers} />
          <p className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-[11px] leading-relaxed text-neutral-500">
            Educational tool only — not investment advice. Prices come from free
            Yahoo Finance data (delayed/unofficial) and may be inaccurate. The
            optimizer is a simplified model; do your own research.
          </p>
        </aside>
      </div>

      <ResearchDrawer ticker={research} onClose={() => setResearch(null)} />
    </main>
  );
}
