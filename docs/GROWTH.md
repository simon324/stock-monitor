# Repo Optimization Guide

A concrete, do-this-now checklist to optimize **this repo** (`simon324/stock-monitor`) for
discovery and adoption. Not generic theory — every item below is copy-paste ready and specific
to this project. The principle: developers discover tools and hate being sold to, so lead with
the **problem + the demo**, never a pitch.

Track progress with the checkboxes.

---

## 0. Status

- [x] Public + MIT licensed
- [x] Real screenshot in the README (`docs/screenshot.png`)
- [x] Description + 13 topics set
- [ ] `v0.1.0` release tagged
- [ ] Vercel deploy button in README
- [ ] `CONTRIBUTING.md`
- [ ] `good first issue`s seeded
- [ ] One launch post (Show HN / Reddit)
- [ ] Submitted to 1–2 awesome-lists

---

## 1. Repo settings (done — keep current)

Description and topics are already set to match what people search for. If you ever reset them:

```bash
gh repo edit simon324/stock-monitor \
  --description "Open-source finance dashboard: live stock watchlist, a Markov-regime portfolio optimizer, and a bring-your-own-key AI stock researcher. Next.js + TypeScript." \
  --add-topic nextjs --add-topic typescript --add-topic finance --add-topic stocks \
  --add-topic portfolio-optimization --add-topic markowitz --add-topic markov-chain \
  --add-topic yahoo-finance --add-topic openrouter --add-topic fintech \
  --add-topic ai --add-topic tailwindcss --add-topic dashboard
```

Also set the repo's **website** field to the live demo once deployed:

```bash
gh repo edit simon324/stock-monitor --homepage "https://<your-vercel-url>.vercel.app"
```

## 2. Add a one-click deploy button (lowers time-to-value to zero)

Paste under the Quick start in the README:

```md
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simon324/stock-monitor)
```

## 3. Cut the first release

A tagged release signals the project is alive (stale repos die fast):

```bash
gh release create v0.1.0 --title "v0.1.0 — first public release" --notes "$(cat <<'EOF'
Open-source finance dashboard:
- Live stock watchlist (yahoo-finance2, no key needed)
- Markov-regime detector + Markowitz portfolio optimizer
- Bring-your-own-key AI stock researcher (OpenRouter, any model)

Educational tool, not investment advice.
EOF
)"
```

## 4. Seed contributor on-ramps

Create these as issues labelled `good first issue` — each one is a ready scope:

```bash
gh issue create --title "Add Finnhub websocket for true real-time prices" \
  --label "good first issue,enhancement" \
  --body "Today prices are polled every 8s in app/page.tsx (POLL_MS). Add an optional Finnhub websocket client so tiles update on every trade. Fall back to polling when no key is set."

gh issue create --title "Add a min-correlation / risk-parity optimizer option" \
  --label "good first issue,enhancement" \
  --body "lib/optimize.ts only does Monte Carlo Markowitz (max-Sharpe / min-variance). Add a third objective (e.g. risk parity) selectable from the OptimizePanel."

gh issue create --title "Add a 1-click 'Deploy to Vercel' button + screenshot to README" \
  --label "good first issue,docs" \
  --body "See docs/GROWTH.md §2. Add the Vercel deploy button under Quick start."

gh issue create --title "Persist the optimizer result and show 'as of' time" \
  --label "good first issue,enhancement" \
  --body "OptimizePanel recomputes on each click. Cache the last result in localStorage and show when it was computed."
```

## 5. Launch assets (copy-paste, problem-first)

### Show HN

> **Title:** Show HN: Open-source stock dashboard with a Markov-regime portfolio optimizer
>
> **Body:** I built a small Next.js dashboard that (1) tracks a live stock watchlist, (2)
> detects the current market regime — bull / bear / volatile — with a first-order Markov chain
> on SPY and runs a Markowitz optimizer conditioned on that regime, and (3) writes an AI
> research brief per ticker using your own OpenRouter key. No signup, no key needed for the
> monitor or optimizer. It's educational — free/unofficial Yahoo data, not investment advice.
> Code + math write-up in the README. Feedback welcome. <repo link>

### Reddit (lead with the build, link GitHub — never a pricing page)

- **r/algotrading / r/quant** — "I open-sourced a regime-switching portfolio optimizer (Markov
  + Markowitz) with a live dashboard — would love feedback on the regime model."
- **r/nextjs / r/webdev** — "Built an open-source finance dashboard in Next.js 16 — live
  prices, a portfolio optimizer, and a bring-your-own-key AI researcher. No signup."
- **r/reactjs** — focus on the clean component structure + recharts.

Disclose you built it. One message per post. Link the repo.

### Blog post (drives durable traffic → repo)

Title: *"Building a regime-switching portfolio optimizer in TypeScript"*. Walk through
`lib/markov.ts` (states + transition matrix) and `lib/optimize.ts` (Monte Carlo Markowitz),
with the screenshot and a couple of charts. End by linking the repo.

## 6. Get listed (durable trust signals)

Submit a PR adding this repo to:

- `awesome-nextjs` → https://github.com/unicodeveloper/awesome-nextjs
- `awesome-quant` → https://github.com/wilsonfreitas/awesome-quant
- `awesome-react` → https://github.com/enaqx/awesome-react

One-line entry, problem-first: *"Stock Monitor — live watchlist + Markov-regime portfolio
optimizer + BYO-key AI research (Next.js)."*

## 7. Add `CONTRIBUTING.md`

A short file lowers the barrier to PRs:

```md
# Contributing

1. `npm install` then `npm run dev`.
2. Make your change; run `npm run build` to type-check.
3. Keep the existing style (Tailwind utilities, light fintech theme, small deps).
4. Open a PR describing the change and linking any related issue.

See the README's "Editing the project" section for the file map.
```

---

## What NOT to do (kills trust)

- Don't gate the first run behind a signup or API key (the monitor/optimizer must stay key-free).
- Don't add upsell banners or a "Pro" paywall to an open-source repo.
- Don't buy stars, run display/social ads, or pay for shoutouts — wrong audience, erodes trust.
- Don't replace honest limitations with marketing language.

**Golden rule:** advertise the problem, not the product. Trust > reach, every time.
