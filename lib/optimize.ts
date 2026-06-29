/**
 * Markowitz mean-variance optimization via Monte Carlo sampling.
 *
 * Given aligned daily log returns for each asset and the current market regime,
 * we sample many long-only weight vectors (each capped per name, summing to 1),
 * score each portfolio, and keep the best.
 *
 * Objective is regime-conditioned:
 *   - "Bull"            -> maximize Sharpe ratio (chase risk-adjusted return)
 *   - "Bear"/"Volatile" -> minimize variance   (play defense)
 */

import type { Regime } from "./markov";

const TRADING_DAYS = 252;
const SAMPLES = 30000;

export type OptimizeResult = {
  weights: { symbol: string; weight: number }[];
  expectedReturn: number; // annualized, %
  expectedVol: number; // annualized, %
  sharpe: number;
  objective: "max-sharpe" | "min-variance";
};

/** Mulberry32 — small deterministic PRNG so results are reproducible. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function logReturns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) r.push(Math.log(closes[i] / closes[i - 1]));
  return r;
}

export function optimize(
  symbols: string[],
  closesBySymbol: number[][],
  regime: Regime,
): OptimizeResult {
  const n = symbols.length;
  const returns = closesBySymbol.map(logReturns);
  const len = Math.min(...returns.map((r) => r.length));
  const R = returns.map((r) => r.slice(r.length - len)); // align lengths

  // Annualized mean vector.
  const mean = R.map((r) => (r.reduce((a, b) => a + b, 0) / len) * TRADING_DAYS);

  // Annualized covariance matrix.
  const dailyMean = R.map((r) => r.reduce((a, b) => a + b, 0) / len);
  const cov: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let t = 0; t < len; t++) {
        s += (R[i][t] - dailyMean[i]) * (R[j][t] - dailyMean[j]);
      }
      const c = (s / (len - 1)) * TRADING_DAYS;
      cov[i][j] = c;
      cov[j][i] = c;
    }
  }

  const objective: OptimizeResult["objective"] =
    regime === "Bull" ? "max-sharpe" : "min-variance";

  // Per-name cap: 35%, but relaxed when there are too few assets to satisfy it.
  const cap = Math.max(0.35, 1 / n + 1e-9);

  const rng = makeRng(1337);
  let best: { w: number[]; ret: number; vol: number; sharpe: number; score: number } | null = null;

  for (let s = 0; s < SAMPLES; s++) {
    // Sample from an (approximate) Dirichlet via exponential draws.
    const raw = new Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const u = Math.max(1e-12, rng());
      raw[i] = -Math.log(u);
      sum += raw[i];
    }
    const w = raw.map((x) => x / sum);
    if (w.some((x) => x > cap)) continue; // enforce cap by rejection

    let ret = 0;
    for (let i = 0; i < n; i++) ret += w[i] * mean[i];

    let variance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) variance += w[i] * w[j] * cov[i][j];
    }
    const vol = Math.sqrt(Math.max(variance, 0));
    const sharpe = vol > 0 ? ret / vol : 0;

    const score = objective === "max-sharpe" ? sharpe : -variance;
    if (!best || score > best.score) best = { w, ret, vol, sharpe, score };
  }

  // Fallback to equal weight if every sample was rejected (very small n edge).
  const w = best?.w ?? new Array(n).fill(1 / n);
  const ret = best?.ret ?? mean.reduce((a, b) => a + b, 0) / n;
  const vol = best?.vol ?? 0;
  const sharpe = best?.sharpe ?? 0;

  return {
    weights: symbols.map((symbol, i) => ({ symbol, weight: w[i] })),
    expectedReturn: ret * 100,
    expectedVol: vol * 100,
    sharpe,
    objective,
  };
}
