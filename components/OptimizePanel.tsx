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
  Bull: "text-emerald-700 bg-emerald-50 ring-emerald-200",
  Bear: "text-red-700 bg-red-50 ring-red-200",
  Volatile: "text-amber-700 bg-amber-50 ring-amber-200",
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
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
          Markov optimizer
        </h3>
        <button
          onClick={run}
          disabled={loading || tickers.length < 2}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
        >
          {loading ? "Running…" : "Optimize"}
        </button>
      </div>

      {tickers.length < 2 && (
        <p className="text-xs text-neutral-400">
          Add at least 2 tickers to build a portfolio.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {markov && opt && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Current regime</span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${regimeColor[markov.current]}`}
            >
              {markov.current}
            </span>
            <span className="ml-auto text-[11px] text-neutral-400">
              vol {(markov.recentVol * 100).toFixed(0)}% · {opt.objective}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Target weights
            </p>
            <div className="space-y-2">
              {[...opt.weights]
                .sort((a, b) => b.weight - a.weight)
                .map((w) => (
                  <div key={w.symbol} className="flex items-center gap-2.5 text-xs">
                    <span className="w-14 font-mono font-medium text-neutral-600">
                      {w.symbol}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${(w.weight * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums font-medium text-neutral-700">
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

          <details className="text-xs text-neutral-500">
            <summary className="cursor-pointer select-none font-medium text-neutral-600 hover:text-neutral-900">
              Transition matrix
            </summary>
            <table className="mt-2 w-full border-collapse text-center">
              <thead>
                <tr className="text-neutral-400">
                  <th className="p-1 text-left font-normal">from \ to</th>
                  {REGIMES.map((r) => (
                    <th key={r} className="p-1 font-normal">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIMES.map((from) => (
                  <tr key={from}>
                    <td className="p-1 text-left text-neutral-500">{from}</td>
                    {REGIMES.map((to) => (
                      <td
                        key={to}
                        className={
                          from === markov.current
                            ? "p-1 font-medium text-neutral-900"
                            : "p-1 text-neutral-500"
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
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2.5">
      <div className="text-sm font-semibold tabular-nums text-neutral-900">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
        {label}
      </div>
    </div>
  );
}
