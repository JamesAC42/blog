import { NextResponse } from "next/server";

type StockQuote = {
  symbol: string;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: string | null;
  latestTradingDay: string | null;
  volume: number | null;
  marketCap: number | null;
};

type StockError = {
  symbol: string;
  message: string;
};

type StocksPayload = {
  symbols: string[];
  quotes: StockQuote[];
  errors: StockError[];
  lastUpdated: string;
};

const DEFAULT_SYMBOLS = ["GOOG", "TSLA", "PLTR", "NVDA", "AAPL", "MSFT", "AMZN", "META", "NFLX", "AMD", "AVGO", "SMCI"];
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
const MARKET_CAP_OVERRIDES: Record<string, number> = {
  GOOG: 1_800_000_000_000,
  GOOGL: 1_800_000_000_000,
  TSLA: 850_000_000_000,
  PLTR: 70_000_000_000,
  NVDA: 3_200_000_000_000,
  AAPL: 2_900_000_000_000,
  MSFT: 3_400_000_000_000,
  AMZN: 1_900_000_000_000,
  META: 1_300_000_000_000,
  NFLX: 250_000_000_000,
  AMD: 300_000_000_000,
  AVGO: 800_000_000_000,
  SMCI: 60_000_000_000,
};

const PLACEHOLDER_QUOTES: StockQuote[] = [
  {
    symbol: "GOOG",
    price: 186.42,
    open: 184.1,
    high: 187.96,
    low: 183.54,
    previousClose: 184.51,
    change: 1.91,
    changePercent: "1.03%",
    latestTradingDay: "2025-02-24",
    volume: 21345678,
    marketCap: MARKET_CAP_OVERRIDES.GOOG,
  },
  {
    symbol: "TSLA",
    price: 202.13,
    open: 199.42,
    high: 205.31,
    low: 198.74,
    previousClose: 203.88,
    change: -1.75,
    changePercent: "-0.86%",
    latestTradingDay: "2025-02-24",
    volume: 31234567,
    marketCap: MARKET_CAP_OVERRIDES.TSLA,
  },
  {
    symbol: "PLTR",
    price: 41.77,
    open: 41.01,
    high: 42.38,
    low: 40.92,
    previousClose: 42.23,
    change: -0.46,
    changePercent: "-1.09%",
    latestTradingDay: "2025-02-24",
    volume: 14567890,
    marketCap: MARKET_CAP_OVERRIDES.PLTR,
  },
  {
    symbol: "NVDA",
    price: 124.91,
    open: 123.22,
    high: 126.44,
    low: 122.98,
    previousClose: 125.41,
    change: -0.50,
    changePercent: "-0.40%",
    latestTradingDay: "2025-02-24",
    volume: 54321987,
    marketCap: MARKET_CAP_OVERRIDES.NVDA,
  },
  {
    symbol: "AAPL",
    price: 238.55,
    open: 236.4,
    high: 239.98,
    low: 235.77,
    previousClose: 236.88,
    change: 1.67,
    changePercent: "0.71%",
    latestTradingDay: "2025-02-24",
    volume: 41234567,
    marketCap: MARKET_CAP_OVERRIDES.AAPL,
  },
  {
    symbol: "MSFT",
    price: 452.66,
    open: 448.21,
    high: 454.12,
    low: 447.83,
    previousClose: 454.00,
    change: -1.34,
    changePercent: "-0.30%",
    latestTradingDay: "2025-02-24",
    volume: 28765432,
    marketCap: MARKET_CAP_OVERRIDES.MSFT,
  },
  {
    symbol: "AMZN",
    price: 226.04,
    open: 223.92,
    high: 227.53,
    low: 222.51,
    previousClose: 227.17,
    change: -1.13,
    changePercent: "-0.50%",
    latestTradingDay: "2025-02-24",
    volume: 33445566,
    marketCap: MARKET_CAP_OVERRIDES.AMZN,
  },
  {
    symbol: "META",
    price: 541.88,
    open: 536.12,
    high: 545.31,
    low: 533.08,
    previousClose: 538.01,
    change: 3.87,
    changePercent: "0.72%",
    latestTradingDay: "2025-02-24",
    volume: 17890123,
    marketCap: MARKET_CAP_OVERRIDES.META,
  },
  {
    symbol: "NFLX",
    price: 692.44,
    open: 684.92,
    high: 697.11,
    low: 682.55,
    previousClose: 695.00,
    change: -2.56,
    changePercent: "-0.37%",
    latestTradingDay: "2025-02-24",
    volume: 10987654,
    marketCap: MARKET_CAP_OVERRIDES.NFLX,
  },
  {
    symbol: "AMD",
    price: 192.11,
    open: 189.01,
    high: 193.54,
    low: 188.42,
    previousClose: 189.77,
    change: 2.34,
    changePercent: "1.23%",
    latestTradingDay: "2025-02-24",
    volume: 25436789,
    marketCap: MARKET_CAP_OVERRIDES.AMD,
  },
  {
    symbol: "AVGO",
    price: 1788.32,
    open: 1769.35,
    high: 1796.92,
    low: 1761.14,
    previousClose: 1794.55,
    change: -6.23,
    changePercent: "-0.35%",
    latestTradingDay: "2025-02-24",
    volume: 4567123,
    marketCap: MARKET_CAP_OVERRIDES.AVGO,
  },
  {
    symbol: "SMCI",
    price: 882.67,
    open: 874.1,
    high: 894.55,
    low: 869.22,
    previousClose: 873.77,
    change: 8.9,
    changePercent: "1.02%",
    latestTradingDay: "2025-02-24",
    volume: 2987654,
    marketCap: MARKET_CAP_OVERRIDES.SMCI,
  },
];


let cache:
  | {
      key: string;
      timestamp: number;
      dateKey: string;
      payload: StocksPayload;
    }
  | null = null;

const getDateKey = () => new Date().toISOString().slice(0, 10);

const toNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchQuote = async (symbol: string, apiKey: string): Promise<StockQuote | null> => {
  const params = new URLSearchParams({
    function: "GLOBAL_QUOTE",
    symbol,
    apikey: apiKey,
  });
  const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Alpha Vantage responded with ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.Note) {
    throw new Error(payload.Note);
  }
  if (payload?.["Error Message"]) {
    throw new Error(payload["Error Message"]);
  }
  const quote = payload?.["Global Quote"];
  if (!quote || Object.keys(quote).length === 0) {
    return null;
  }

  return {
    symbol: (quote["01. symbol"] as string) || symbol,
    price: toNumber(quote["05. price"]),
    open: toNumber(quote["02. open"]),
    high: toNumber(quote["03. high"]),
    low: toNumber(quote["04. low"]),
    previousClose: toNumber(quote["08. previous close"]),
    change: toNumber(quote["09. change"]),
    changePercent: (quote["10. change percent"] as string) ?? null,
    latestTradingDay: (quote["07. latest trading day"] as string) ?? null,
    volume: toNumber(quote["06. volume"]),
    marketCap: MARKET_CAP_OVERRIDES[symbol] ?? null,
  };
};

export async function GET(request: Request) {
  const usePlaceholder = process.env.USE_PLACEHOLDER_STOCKS === "true";
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!usePlaceholder && !apiKey) {
    return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const requestedSymbols = searchParams.get("symbols");
  const symbols = requestedSymbols
    ? requestedSymbols
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    : DEFAULT_SYMBOLS;
  if (symbols.length === 0) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  const cacheKey = symbols.join(",");
  const todayKey = getDateKey();
  if (!usePlaceholder && cache && cache.key === cacheKey && cache.dateKey === todayKey && Date.now() - cache.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cache.payload);
  }

  if (usePlaceholder) {
    const placeholderQuotes = PLACEHOLDER_QUOTES.filter((quote) => symbols.includes(quote.symbol));
    const payload: StocksPayload = {
      symbols,
      quotes: placeholderQuotes,
      errors: [],
      lastUpdated: new Date().toISOString(),
    };
    cache = {
      key: cacheKey,
      timestamp: Date.now(),
      dateKey: todayKey,
      payload,
    };
    return NextResponse.json(payload);
  }

  const quotes: StockQuote[] = [];
  const errors: StockError[] = [];

  for (const symbol of symbols) {
    try {
      const quote = await fetchQuote(symbol, apiKey ?? "");
      if (quote) {
        quotes.push(quote);
      } else {
        errors.push({ symbol, message: "No quote data returned" });
      }
    } catch (error) {
      errors.push({
        symbol,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const payload: StocksPayload = {
    symbols,
    quotes,
    errors,
    lastUpdated: new Date().toISOString(),
  };

  cache = {
    key: cacheKey,
    timestamp: Date.now(),
    dateKey: todayKey,
    payload,
  };

  return NextResponse.json(payload);
}
