import YahooFinance from "yahoo-finance2";

// v3 requires an instance. suppressNotices quiets the library's console banners.
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});

const opts = { validateResult: false } as const;

export type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  marketState: string | null;
};

type RawQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  marketState?: string;
};

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  const res = await yahooFinance.quote(symbols, {}, opts);
  const arr = (Array.isArray(res) ? res : [res]) as RawQuote[];
  return arr.map((q): Quote => ({
    symbol: q.symbol ?? "",
    name: q.shortName || q.longName || q.symbol || "",
    price: q.regularMarketPrice ?? null,
    change: q.regularMarketChange ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
    currency: q.currency ?? null,
    marketState: q.marketState ?? null,
  }));
}

export type Candle = { date: string; close: number };

const RANGE_DAYS: Record<string, number> = {
  "1mo": 31,
  "6mo": 190,
  "1y": 370,
  "2y": 740,
};

type RawCandle = { date?: Date; close?: number; adjclose?: number };

export async function getHistory(
  symbol: string,
  range: keyof typeof RANGE_DAYS = "1y",
): Promise<Candle[]> {
  const days = RANGE_DAYS[range] ?? 370;
  const period1 = new Date(Date.now() - days * 24 * 3600 * 1000);
  const res = (await yahooFinance.chart(
    symbol,
    { period1, interval: "1d" },
    opts,
  )) as { quotes?: RawCandle[] };
  const quotes = res?.quotes ?? [];
  return quotes
    .filter((q) => q.date != null && (q.adjclose ?? q.close) != null)
    .map((q) => ({
      date: new Date(q.date as Date).toISOString().slice(0, 10),
      close: (q.adjclose ?? q.close) as number,
    }));
}

/** Closes keyed by ISO date — used to align multiple tickers for optimization. */
export async function getCloseMap(
  symbol: string,
  range: keyof typeof RANGE_DAYS = "2y",
): Promise<Map<string, number>> {
  const candles = await getHistory(symbol, range);
  return new Map(candles.map((c) => [c.date, c.close]));
}

export async function getFundamentals(symbol: string) {
  try {
    return (await yahooFinance.quoteSummary(
      symbol,
      {
        modules: [
          "price",
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
          "assetProfile",
        ],
      },
      opts,
    )) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type NewsItem = {
  title: string;
  publisher: string;
  link: string;
  time: string | null;
};

type RawNews = {
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: Date | number;
};

export async function getNews(symbol: string): Promise<NewsItem[]> {
  try {
    const r = (await yahooFinance.search(symbol, { newsCount: 6 }, opts)) as {
      news?: RawNews[];
    };
    return (r?.news ?? []).map((n) => ({
      title: n.title ?? "",
      publisher: n.publisher ?? "",
      link: n.link ?? "",
      time: n.providerPublishTime
        ? new Date(n.providerPublishTime).toISOString()
        : null,
    }));
  } catch {
    return [];
  }
}
