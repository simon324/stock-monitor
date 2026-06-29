"use client";

import { useEffect, useState } from "react";

type Brief = {
  verdict: "constructive" | "neutral" | "cautious";
  confidence: "low" | "medium" | "high";
  summary: string;
  bullCase: string[];
  bearCase: string[];
  keyRisks: string[];
  recentCatalysts?: string[];
};
type ResearchResponse = {
  available?: boolean;
  message?: string;
  error?: string;
  ticker?: string;
  brief?: Brief;
  snapshot?: {
    price: number | null;
    currency: string | null;
    sector: string | null;
    industry: string | null;
  };
  news?: { title: string; publisher: string; link: string }[];
};

const verdictColor: Record<Brief["verdict"], string> = {
  constructive: "bg-emerald-500/15 text-emerald-400",
  neutral: "bg-neutral-500/15 text-neutral-300",
  cautious: "bg-amber-500/15 text-amber-400",
};

export default function ResearchDrawer({
  ticker,
  onClose,
}: {
  ticker: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    fetch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker }),
    })
      .then((r) => r.json())
      .then((j) => !cancelled && setData(j))
      .catch((e) => !cancelled && setData({ error: String(e) }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (!ticker) return null;
  const brief = data?.brief;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{ticker} research</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-sm text-neutral-400">Researching with AI…</p>
        )}

        {data?.available === false && (
          <div className="rounded-lg border border-amber-700/40 bg-amber-500/10 p-3 text-sm text-amber-300">
            {data.message}
          </div>
        )}
        {data?.error && (
          <p className="text-sm text-red-400">Error: {data.error}</p>
        )}

        {brief && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-sm font-semibold capitalize ${verdictColor[brief.verdict]}`}
              >
                {brief.verdict}
              </span>
              <span className="text-xs text-neutral-500">
                confidence: {brief.confidence}
              </span>
              {data?.snapshot?.sector && (
                <span className="ml-auto text-xs text-neutral-500">
                  {data.snapshot.sector}
                </span>
              )}
            </div>

            <p className="text-sm text-neutral-200">{brief.summary}</p>

            <Section title="Bull case" items={brief.bullCase} accent="text-emerald-400" />
            <Section title="Bear case" items={brief.bearCase} accent="text-red-400" />
            <Section title="Key risks" items={brief.keyRisks} accent="text-amber-400" />
            {brief.recentCatalysts && brief.recentCatalysts.length > 0 && (
              <Section
                title="Recent catalysts"
                items={brief.recentCatalysts}
                accent="text-blue-400"
              />
            )}

            {data?.news && data.news.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-neutral-300">
                  Headlines used
                </h3>
                <ul className="space-y-1">
                  {data.news.map((n, i) => (
                    <li key={i} className="text-xs text-neutral-500">
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-300"
                      >
                        {n.title} — {n.publisher}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="border-t border-neutral-800 pt-3 text-[11px] text-neutral-600">
              AI-generated from fetched data. Educational only — not investment
              advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className={`mb-1 text-sm font-semibold ${accent}`}>{title}</h3>
      <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-300">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
