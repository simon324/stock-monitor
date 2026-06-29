"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
      <div className="flex h-72 items-center justify-center text-sm text-neutral-400">
        Select a ticker to see its chart.
      </div>
    );
  }

  const up = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const color = up ? "#059669" : "#dc2626";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          {symbol}
        </h2>
        <div className="flex gap-0.5 rounded-lg bg-neutral-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                r === range
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : loading && data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#f0f1f3"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) => Number(v).toFixed(0)}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
                labelStyle={{ color: "#6b7280" }}
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
