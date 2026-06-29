"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Candle = { date: string; close: number };
const RANGES = ["1mo", "6mo", "1y", "2y"] as const;
type Range = (typeof RANGES)[number];

export default function PriceChart({ symbol }: { symbol: string | null }) {
  const [range, setRange] = useState<Range>("6mo");
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/history?symbol=${symbol}&range=${range}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) setError(j.error);
        setData(j.candles ?? []);
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  if (!symbol) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-neutral-500">
        Select a ticker to see its chart.
      </div>
    );
  }

  const up =
    data.length > 1 && data[data.length - 1].close >= data[0].close;
  const color = up ? "#34d399" : "#f87171";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{symbol}</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2 py-1 text-xs ${
                r === range
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            {error}
          </div>
        ) : loading && data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#888" }}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#888" }}
                width={55}
                tickFormatter={(v) => Number(v).toFixed(0)}
              />
              <Tooltip
                contentStyle={{
                  background: "#15171c",
                  border: "1px solid #2a2d35",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#aaa" }}
                formatter={(v) => [Number(v).toFixed(2), "Close"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#g)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
