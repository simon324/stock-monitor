"use client";

import { useState } from "react";

const REGIMES = ["Bull", "Bear", "Volatile"] as const;
type Regime = (typeof REGIMES)[number];

type MarkovResult = {
  current: Regime;
  transition: Record<Regime, Record<Regime, number>>;
  distribution: Record<Regime, number>;
  recentVol: number;
};
type Optimization = {
  weights: { symbol: string; weight: number }[];
  expectedReturn: number;
  expectedVol: number;
  sharpe: number;
  objective: "max-sharpe" | "min-variance";
};

const regimeColor: Record<Regime, string> = {
  Bull: "text-emerald-400 bg-emerald-400/10",
  Bear: "text-red-400 bg-red-400/10",
  Volatile: "text-amber-400 bg-amber-400/10",
};

export default function OptimizePanel({ tickers }: { tickers: string[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markov, setMarkov] = useState<MarkovResult | null>(null);
  const [opt, setOpt] = useState<Optimization | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Optimization failed");
      setMarkov(j.markov);
      setOpt(j.optimization);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Markov optimizer</h3>
        <button
          onClick={run}
          disabled={loading || tickers.length < 2}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-40"
        >
          {loading ? "Running…" : "Optimize"}
        </button>
      </div>

      {tickers.length < 2 && (
        <p className="text-xs text-neutral-500">
          Add at least 2 tickers to build a portfolio.
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {markov && opt && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Current regime</span>
            <span
              className={`rounded px-2 py-0.5 text-sm font-semibold ${regimeColor[markov.current]}`}
            >
              {markov.current}
            </span>
            <span className="ml-auto text-xs text-neutral-500">
              vol {markov.recentVol.toFixed(0)}% · obj {opt.objective}
            </span>
          </div>

          <div>
            <p className="mb-1 text-xs text-neutral-400">Target weights</p>
            <div className="space-y-1.5">
              {[...opt.weights]
                .sort((a, b) => b.weight - a.weight)
                .map((w) => (
                  <div key={w.symbol} className="flex items-center gap-2 text-sm">
                    <span className="w-16 font-mono">{w.symbol}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-neutral-800">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(w.weight * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right tabular-nums text-neutral-300">
                      {(w.weight * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Exp. return" value={`${opt.expectedReturn.toFixed(1)}%`} />
            <Stat label="Exp. vol" value={`${opt.expectedVol.toFixed(1)}%`} />
            <Stat label="Sharpe" value={opt.sharpe.toFixed(2)} />
          </div>

          <details className="text-xs text-neutral-400">
            <summary className="cursor-pointer select-none">
              Transition matrix
            </summary>
            <table className="mt-2 w-full border-collapse text-center">
              <thead>
                <tr className="text-neutral-500">
                  <th className="p-1 text-left">from \ to</th>
                  {REGIMES.map((r) => (
                    <th key={r} className="p-1">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIMES.map((from) => (
                  <tr key={from}>
                    <td className="p-1 text-left text-neutral-400">{from}</td>
                    {REGIMES.map((to) => (
                      <td
                        key={to}
                        className={
                          from === markov.current ? "p-1 text-neutral-200" : "p-1"
                        }
                      >
                        {(markov.transition[from][to] * 100).toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-800/50 p-2">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  );
}
