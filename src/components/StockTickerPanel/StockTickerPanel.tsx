"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./stocktickerpanel.module.scss";

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

type StocksResponse = {
  quotes: StockQuote[];
  errors?: { symbol: string; message: string }[];
  lastUpdated?: string;
};

export const StockTickerPanel = () => {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<StocksResponse["errors"]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = useCallback(
    async () => {
      setPanelError(null);
      setIsLoading(true);
      try {
        const response = await fetch("/api/stocks", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load stock data");
        }
        const data: StocksResponse = await response.json();
        setQuotes(data.quotes ?? []);
        setWarnings(data.errors ?? []);
        setLastUpdated(data.lastUpdated ?? null);
      } catch (error) {
        setPanelError(error instanceof Error ? error.message : "Failed to load quotes");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    []
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }),
    []
  );

  const formatCurrency = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return "—";
    return currencyFormatter.format(value);
  };

  const formatChange = (quote: StockQuote) => {
    if (quote.change === null && !quote.changePercent) return "—";
    const changePart = quote.change === null ? "" : currencyFormatter.format(quote.change);
    const percentPart = quote.changePercent ? ` (${quote.changePercent})` : "";
    return `${changePart}${percentPart}`.trim();
  };

  const formatRange = (low: number | null, high: number | null) => {
    if (low === null || high === null) return "—";
    return `${currencyFormatter.format(low)} • ${currencyFormatter.format(high)}`;
  };

  const formatVolume = (volume: number | null) => {
    if (volume === null) return "—";
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(1)}M`;
    }
    if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(0)}K`;
    }
    return numberFormatter.format(volume);
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    const date = new Date(lastUpdated);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }, [lastUpdated]);

  const marketCapStats = useMemo(() => {
    const withCap = quotes.filter((quote) => typeof quote.marketCap === "number" && quote.marketCap !== null && quote.marketCap > 0);
    const total = withCap.reduce((acc, quote) => acc + (quote.marketCap ?? 0), 0);
    const max = withCap.reduce((acc, quote) => Math.max(acc, quote.marketCap ?? 0), 0);
    return { list: withCap, total, max };
  }, [quotes]);

  const formatMarketCap = (value: number | null) => {
    if (!value) return "—";
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(1)}T`;
    }
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    return `${(value / 1_000_000).toFixed(1)}M`;
  };

  return (
    <div className={`windowContent`}>
      <div className={styles.header}>
        <div>
          {lastUpdatedLabel && <p className={styles.subtitle}>Updated {lastUpdatedLabel} • Alpha Vantage</p>}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.stateMessage}>
          <p>Loading market data…</p>
        </div>
      ) : panelError ? (
        <div className={styles.stateMessage}>
          <p>{panelError}</p>
        </div>
      ) : (
        <>
          <div className={styles.tickerGrid}>
            <div className={`${styles.row} ${styles.headerRow}`}>
              <span>Ticker</span>
              <span>Price</span>
              <span>Change</span>
              <span>Day Range</span>
              <span>Volume</span>
            </div>
            {quotes.map((quote) => {
              const changeClass =
                quote.change === null
                  ? ""
                  : quote.change > 0
                  ? styles.positive
                  : quote.change < 0
                  ? styles.negative
                  : styles.flat;
              return (
                <div className={styles.row} key={quote.symbol}>
                  <span className={styles.tickerSymbol}>{quote.symbol}</span>
                  <span className={styles.price}>{formatCurrency(quote.price)}</span>
                  <span className={`${styles.change} ${changeClass}`}>{formatChange(quote)}</span>
                  <span className={styles.range}>{formatRange(quote.low, quote.high)}</span>
                  <span className={styles.volume}>{formatVolume(quote.volume)}</span>
                </div>
              );
            })}
          </div>
          {warnings && warnings.length > 0 && (
            <div className={styles.warning}>
              {warnings.map((warning) => (
                <p key={warning.symbol}>
                  {warning.symbol}: {warning.message}
                </p>
              ))}
            </div>
          )}
          {marketCapStats.list.length > 0 && (
            <div className={styles.heatmapContainer}>
              <div className={styles.heatmapHeader}>
                <p>Market Cap Heatmap</p>
                <p className={styles.heatmapSubtitle}>Block size ∝ market cap • color = intraday change</p>
              </div>
              <div className={styles.heatmapGrid}>
                {marketCapStats.list.map((quote) => {
                  const ratio = marketCapStats.max > 0 ? (quote.marketCap ?? 0) / marketCapStats.max : 0;
                  const flexGrow = Math.max(0.5, ratio * 6);
                  const minHeight = 2.5 + ratio * 4;
                  const change = quote.change ?? 0;
                  const changeClass =
                    change > 0 ? styles.heatPositive : change < 0 ? styles.heatNegative : styles.heatFlat;
                  return (
                    <div
                      key={`heat-${quote.symbol}`}
                      className={`${styles.heatmapBox} ${changeClass}`}
                      style={{ flexGrow, minHeight: `${minHeight}rem` }}
                    >
                      <div className={styles.heatmapSymbol}>{quote.symbol}</div>
                      <div className={styles.heatmapPrice}>{formatCurrency(quote.price)}</div>
                      <div className={styles.heatmapMeta}>
                        <span>{formatChange(quote)}</span>
                        <span>{formatMarketCap(quote.marketCap)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
