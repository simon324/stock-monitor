# 📈 Stock Monitor

A personal finance dashboard with three features:

1. **Live monitor** — a watchlist of tickers with prices that refresh on an interval.
2. **Markov-regime optimizer** — detects the current market regime (Bull / Bear / Volatile)
   with a first-order Markov chain, then runs a Markowitz mean-variance optimization to
   suggest portfolio weights.
3. **AI stock researcher** — an LLM (Claude) reads fetched fundamentals + news and writes a
   structured brief (bull case, bear case, risks, verdict).

> ⚠️ **Educational tool, not investment advice.** Price data comes from the free, unofficial
> Yahoo Finance endpoints (via `yahoo-finance2`) and may be delayed or wrong. It does not
> place trades or connect to a broker.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS**
- **yahoo-finance2** — quotes, history, fundamentals, news (no API key required)
- **recharts** — price chart
- **OpenRouter** — the AI researcher, bring-your-own-key (any model)

No database — the watchlist and your OpenRouter key live in the browser's `localStorage`.

## Running locally

```bash
npm install
npm run dev   # http://localhost:3000
```

The price monitor and optimizer work with **no keys**. For the AI researcher, click the
**⚙ Settings** button in the header, paste an [OpenRouter API key](https://openrouter.ai/keys),
and pick a model (GPT-4o mini, Claude 3.5 Sonnet, Gemini, Llama, or any custom model ID).
The key is stored only in your browser and sent per-request — nothing is committed.

> Prefer a shared server key instead of per-user keys? Set `OPENROUTER_API_KEY` in
> `.env.local` (see `.env.example`); it's used as a fallback when a request has no key.

## How the Markov optimizer works

Implemented in [`lib/markov.ts`](lib/markov.ts) and [`lib/optimize.ts`](lib/optimize.ts).

1. **Regime detection.** Each day in a market proxy (`SPY`) is labelled using its rolling
   20-day return and annualized volatility:
   - `Volatile` if volatility is above the 75th percentile of history
   - `Bull` if not volatile and rolling return ≥ 0
   - `Bear` if not volatile and rolling return < 0

   We estimate the **empirical transition matrix** between consecutive days' states — a
   first-order Markov chain. The current regime is the latest day's state.

   > This is a deliberately transparent, rule-based model rather than a fitted Hidden Markov
   > Model. The states are explainable and the math is verifiable. Swap in a Baum-Welch HMM
   > (e.g. `hmmlearn` via a Python service) if you want latent states.

2. **Portfolio optimization.** We compute the annualized mean-return vector and covariance
   matrix from daily log returns, then run a **Monte Carlo Markowitz** search over long-only
   weight vectors (capped per name, summing to 1). The objective is regime-conditioned:
   - `Bull` → maximize the Sharpe ratio
   - `Bear` / `Volatile` → minimize variance (defensive)

   The PRNG is seeded, so results are reproducible.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/quote?symbols=AAPL,MSFT` | GET | Latest quotes for the watchlist |
| `/api/history?symbol=AAPL&range=6mo` | GET | OHLC closes for the chart |
| `/api/optimize` | POST `{ tickers }` | Regime + optimized weights |
| `/api/research` | POST `{ ticker }` | AI research brief |

## Deploying

Works out of the box on **Vercel**: import the repo and deploy. AI research is
bring-your-own-key from the in-app Settings, so no environment variables are required
(optionally set `OPENROUTER_API_KEY` for a shared fallback key). `npm run build` must pass first.

## License

[MIT](LICENSE) — free to use, modify, and distribute. Contributions welcome.
Educational software, not financial advice.

## Limitations

- Free Yahoo Finance data is unofficial and can rate-limit or break without notice.
- "Live" prices are polled every ~8s, not streamed. For true streaming, wire up a Finnhub
  or Twelve Data websocket on the client.
- The optimizer is a simplified teaching model — not a production risk system.
