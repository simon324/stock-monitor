# Adoption & ROI Playbook

How to turn this open-source repo into real return — adoption, contributors, and (optionally)
sponsorship. The principle throughout: **engineers discover tools; they hate being sold to.**
Advertise the *problem and the demo*, never the "product."

This is adapted for *this* repo's audience — indie hackers, fintech/quant hobbyists, and
Next.js / TypeScript developers — not enterprise buyers.

---

## What "ROI" means here

You're not selling a SaaS. Realistic returns for a project like this:

| Return | How it shows up |
| --- | --- |
| **Reputation / portfolio** | A polished, real, working repo you can point employers/clients to |
| **Contributors** | PRs that add features (websocket prices, more optimizers, broker read-only) |
| **Users** | Devs who fork it as a starter for their own finance app |
| **Sponsorship** | GitHub Sponsors, once there's sustained usage and issues |
| **Lead-in** | A credible artifact that drives traffic to a blog, newsletter, or paid hosted version |

Pick the one you actually want — it changes where you spend effort.

---

## 1. Make the repo legible in 30 seconds

Developers decide fast. The README must answer, above the fold:

- **What problem does it solve?** ✅ (live prices + a regime-aware optimizer + AI research, free)
- **Who is it for?** ✅ (indie devs / quant hobbyists / Next.js builders)
- **How fast can I try it?** ✅ (`git clone … && npm install && npm run dev`)
- **A real screenshot, not a mockup.** ✅ ([`docs/screenshot.png`](screenshot.png))
- **When *not* to use it.** ✅ (it's educational, free data, not a production risk system)

That credibility — honest limitations + real output — is what converts skeptical engineers.

## 2. Win GitHub search (most people skip this)

GitHub search is keyword-primitive but predictable. Set a sharp description and topics so the
phrases people actually type match:

```bash
gh repo edit simon324/stock-monitor \
  --description "Open-source finance dashboard: live stock watchlist, a Markov-regime portfolio optimizer, and a bring-your-own-key AI stock researcher. Next.js + TypeScript." \
  --add-topic nextjs --add-topic typescript --add-topic finance --add-topic stocks \
  --add-topic portfolio-optimization --add-topic markowitz --add-topic markov-chain \
  --add-topic yahoo-finance --add-topic openrouter --add-topic fintech \
  --add-topic ai --add-topic tailwindcss --add-topic dashboard
```

Use the exact phrases the audience searches: *"stock dashboard nextjs"*, *"portfolio optimizer
typescript"*, *"yahoo finance api javascript"*, *"openrouter app example"*.

## 3. Drive time-to-value to near zero

The repo already nails this — **the monitor and optimizer run with no API key**. Keep it that
way. Never gate the first run behind a signup or key. "I see value before I configure
anything" is the whole game. A 1-click deploy button is worth adding:

```md
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simon324/stock-monitor)
```

## 4. Use issues, releases, and discussions as growth surfaces

- **Seed 3–5 `good first issue`s** (e.g. "add Finnhub websocket for true streaming",
  "add a min-correlation optimizer", "dark mode toggle"). Each one is a contributor on-ramp.
- **Tag releases** (`v0.1.0`, …) with short notes: what changed, who it's for. Even tiny
  releases signal the project is alive — stale repos die fast.
- **Open a Discussion** like "How would you extend the optimizer?" — people discover repos
  through threads as much as through stars.

## 5. Earn attention *off*-repo (where growth actually happens)

One good external spike converts far more than grinding for stars. Best fits for this project:

| Channel | How to do it without getting roasted |
| --- | --- |
| **Show HN** | "Show HN: Open-source stock dashboard with a Markov-regime portfolio optimizer". Link the repo, lead with the demo + the honest "not advice / free data" caveat. |
| **r/algotrading, r/quant, r/webdev, r/nextjs** | Lead with a learning or the screenshot + code. Link GitHub, never a pricing page. Disclose you built it. |
| **A technical blog post** | "Building a regime-switching portfolio optimizer in TypeScript" → link the repo. Benchmarks/visuals beat marketing. |
| **awesome-* lists** | Submit to `awesome-nextjs`, `awesome-quant`, `awesome-react`. Curated lists are durable trust signals. |
| **A 90-second YouTube/Loom demo** | CLI-to-dashboard walkthrough; pair with the Reddit/HN post for discovery. |

Post that works: *"I built an open-source stock dashboard that detects the market regime and
suggests portfolio weights — no signup, bring your own AI key. Feedback welcome."*
Post that gets downvoted: *"Check out my finance platform 🚀"*.

## 6. Make it fork- and hack-friendly

Developers adopt what they can bend. You already have a clean file map and one-line edit table
in the README. Add a short `CONTRIBUTING.md` (how to run, how to submit a PR) and keep the
dependency list tiny. Consider an `/examples` folder (e.g. a crypto watchlist variant).

## 7. Sponsorship — only after real usage

Enable **GitHub Sponsors** once there's sustained traffic and open issues; it signals
long-term commitment more than it earns money early. Transparency ("sponsorship funds
maintenance and data costs") beats perks. Don't put upsell banners in the README, don't
paywall basic features, don't treat users as sales leads — DevOps and indie devs spot it
instantly and it destroys trust.

---

## A lightweight 30-day plan

| Week | Do |
| --- | --- |
| **1** | Set description + topics (§2). Add the Vercel deploy button + `CONTRIBUTING.md`. Cut `v0.1.0`. |
| **2** | Seed 4 `good first issue`s. Write one technical blog post. Record a 90-sec demo. |
| **3** | Show HN + one well-targeted subreddit post (problem-first). Submit to 2–3 awesome-lists. |
| **4** | Respond to every issue/PR fast. Cut `v0.2.0` from whatever landed. Open a Discussion. Enable Sponsors if traffic warrants. |

## What to avoid (kills trust fast)

- Generic display / Facebook / Instagram ads — wrong audience, erodes credibility.
- Buying stars or influencer shoutouts.
- Gating the first run behind signup or an API key.
- Upsell banners or "Pro" paywalls on basic features in an "open-source" repo.
- Marketing language where honest limitations should be.

**The golden rule:** advertise the problem, not the product. Trust > reach, every time.
