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
  constructive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  cautious: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function ResearchDrawer({
  ticker,
  apiKey,
  model,
  onClose,
}: {
  ticker: string | null;
  apiKey: string;
  model: string;
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
      body: JSON.stringify({ ticker, apiKey, model }),
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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-neutral-900/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            {ticker} research
          </h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-sm text-neutral-500">Researching with AI…</p>
        )}

        {data?.available === false && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {data.message}
          </div>
        )}
        {data?.error && (
          <p className="text-sm text-red-500">Error: {data.error}</p>
        )}

        {brief && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ring-1 ${verdictColor[brief.verdict]}`}
              >
                {brief.verdict}
              </span>
              <span className="text-xs text-neutral-400">
                confidence: {brief.confidence}
              </span>
              {data?.snapshot?.sector && (
                <span className="ml-auto text-xs text-neutral-400">
                  {data.snapshot.sector}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-neutral-700">
              {brief.summary}
            </p>

            <Section title="Bull case" items={brief.bullCase} accent="text-emerald-700" />
            <Section title="Bear case" items={brief.bearCase} accent="text-red-700" />
            <Section title="Key risks" items={brief.keyRisks} accent="text-amber-700" />
            {brief.recentCatalysts && brief.recentCatalysts.length > 0 && (
              <Section
                title="Recent catalysts"
                items={brief.recentCatalysts}
                accent="text-blue-700"
              />
            )}

            {data?.news && data.news.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Headlines used
                </h3>
                <ul className="space-y-1.5">
                  {data.news.map((n, i) => (
                    <li key={i} className="text-xs text-neutral-500">
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-800 hover:underline"
                      >
                        {n.title} — {n.publisher}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="border-t border-neutral-100 pt-3 text-[11px] text-neutral-400">
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
      <h3
        className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${accent}`}
      >
        {title}
      </h3>
      <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-neutral-700">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
