/**
 * Simplified, transparent Markov regime model.
 *
 * Each trading day in the market proxy (e.g. SPY) is classified into one of
 * three observed states using rolling 20-day return and volatility:
 *   - "Volatile": rolling volatility above the 75th percentile of history
 *   - "Bull":     not volatile and rolling return >= 0
 *   - "Bear":     not volatile and rolling return < 0
 *
 * We then estimate the empirical transition matrix between consecutive days'
 * states (row-normalized) — a first-order Markov chain. The current regime is
 * the last day's state.
 *
 * This is intentionally rule-based rather than a fitted HMM: the states are
 * explainable and the math is verifiable. Swap in hmmlearn-style Baum-Welch
 * later if you want latent states.
 */

export const REGIMES = ["Bull", "Bear", "Volatile"] as const;
export type Regime = (typeof REGIMES)[number];

export type MarkovResult = {
  current: Regime;
  /** transition[from][to] = P(next = to | current = from) */
  transition: Record<Regime, Record<Regime, number>>;
  /** share of history spent in each state */
  distribution: Record<Regime, number>;
  /** annualized volatility (%) over the most recent window */
  recentVol: number;
  days: number;
};

function logReturns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    r.push(Math.log(closes[i] / closes[i - 1]));
  }
  return r;
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

export function detectRegimes(closes: number[], window = 20): MarkovResult {
  const rets = logReturns(closes);
  const n = rets.length;

  // Rolling mean return and rolling annualized volatility.
  const rollMean: number[] = [];
  const rollVol: number[] = [];
  for (let i = window - 1; i < n; i++) {
    const slice = rets.slice(i - window + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / window;
    const variance =
      slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (window - 1);
    rollMean.push(mean);
    rollVol.push(Math.sqrt(variance) * Math.sqrt(252)); // annualized
  }

  const volHigh = percentile(rollVol, 0.75);

  const states: Regime[] = rollMean.map((m, i) => {
    if (rollVol[i] > volHigh) return "Volatile";
    return m >= 0 ? "Bull" : "Bear";
  });

  // Empirical transition counts.
  const counts: Record<Regime, Record<Regime, number>> = {
    Bull: { Bull: 0, Bear: 0, Volatile: 0 },
    Bear: { Bull: 0, Bear: 0, Volatile: 0 },
    Volatile: { Bull: 0, Bear: 0, Volatile: 0 },
  };
  for (let i = 1; i < states.length; i++) {
    counts[states[i - 1]][states[i]] += 1;
  }

  const transition = {} as Record<Regime, Record<Regime, number>>;
  for (const from of REGIMES) {
    const total = REGIMES.reduce((a, to) => a + counts[from][to], 0);
    transition[from] = {} as Record<Regime, number>;
    for (const to of REGIMES) {
      transition[from][to] = total > 0 ? counts[from][to] / total : 0;
    }
  }

  const distribution = {} as Record<Regime, number>;
  for (const s of REGIMES) {
    distribution[s] =
      states.filter((x) => x === s).length / Math.max(1, states.length);
  }

  return {
    current: states[states.length - 1] ?? "Bull",
    transition,
    distribution,
    recentVol: rollVol[rollVol.length - 1] ?? 0,
    days: states.length,
  };
}
