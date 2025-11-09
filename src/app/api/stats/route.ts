import { NextResponse } from "next/server";

type UmamiSummaryMetric = { value?: number; prev?: number } | number;
type UmamiStatsResponse = {
    pageviews?: UmamiSummaryMetric;
    visits?: UmamiSummaryMetric;
    visitors?: UmamiSummaryMetric;
    uniques?: UmamiSummaryMetric;
    bounces?: UmamiSummaryMetric;
    totaltime?: UmamiSummaryMetric; // seconds aggregate
};

type UmamiTimeseriesPoint = {
    x?: number | string; // timestamp (ms or seconds or ISO)
    t?: number | string; // some endpoints use 't'
    y: number; // value
};

type UmamiMetricItem = {
    x: string; // dimension value (e.g., url)
    y: number; // count
};

type RealtimeActive = {
    active?: number;
    x?: number;
    value?: number;
};

const getEnv = (key: string) => process.env[key];

const UMAMI_API_URL = (getEnv("UMAMI_API_URL") || "https://umami.is/api").replace(/\/$/, "");

const BASE_CANDIDATES = Array.from(
    new Set([
        UMAMI_API_URL,
        "https://api.umami.is/v1",
    ])
).map((u) => u.replace(/\/$/, ""));
const UMAMI_TOKEN = getEnv("UMAMI_TOKEN");
const UMAMI_WEBSITE_ID = getEnv("UMAMI_WEBSITE_ID");

function formatDurationFromSeconds(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts: string[] = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ");
}

function normalizeToMsTimestamp(input: number | string): number | null {
    if (typeof input === "number") {
        if (!Number.isFinite(input)) return null;
        // Heuristic: seconds vs ms
        return input > 1e12 ? input : input * 1000;
    }
    const parsed = Date.parse(input);
    return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${UMAMI_TOKEN}`,
        },
        cache: "no-store",
        next: { revalidate: 0 },
    });
    if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        const message = `GET ${url} -> ${res.status} ${res.statusText}${errorText ? ` | ${errorText}` : ""}`;
        console.error("Umami API error:", message);
        throw new Error(message);
    }
    return res.json();
}

export async function GET() {
    try {
        if (!UMAMI_TOKEN || !UMAMI_WEBSITE_ID) {
            return NextResponse.json(
                { error: "Missing UMAMI_TOKEN or UMAMI_WEBSITE_ID environment variables" },
                { status: 500 }
            );
        }

        const endAt = Date.now();
        const startAtMonth = endAt - 30 * 24 * 60 * 60 * 1000; // last 30 days
        const startAtWeek = endAt - 7 * 24 * 60 * 60 * 1000; // last 7 days
        const startAtDay = endAt - 24 * 60 * 60 * 1000; // last 24 hours
        const startAtAllTime = Date.parse("2024-01-01T00:00:00Z");

        let lastError: unknown = null;

        for (const base of BASE_CANDIDATES) {
            try {
                const statsUrlAll = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAtAllTime}&endAt=${endAt}`;
                const statsUrlMonth = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAtMonth}&endAt=${endAt}`;
                const statsUrlWeek = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAtWeek}&endAt=${endAt}`;
                const statsUrlDay = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAtDay}&endAt=${endAt}`;
                const pageviewsSeriesUrl = `${base}/websites/${UMAMI_WEBSITE_ID}/pageviews?startAt=${startAtMonth}&endAt=${endAt}&unit=hour`;
                const topPagesUrl = `${base}/websites/${UMAMI_WEBSITE_ID}/metrics?startAt=${startAtMonth}&endAt=${endAt}&type=url&limit=5`;

                // Attempt known realtime endpoints, prefer global realtime first per docs
                const realtimeActiveUrlPrimary = `${base}/realtime/${UMAMI_WEBSITE_ID}`;
                const realtimeActiveUrlFallback = `${base}/websites/${UMAMI_WEBSITE_ID}/active`;

                const [statsAll, statsMonth, statsWeek, statsDay, pageviewsSeries, topPages, realtimePrimary, topReferrers, topCountries, topLanguages] = await Promise.all([
                    fetchJson<UmamiStatsResponse>(statsUrlAll),
                    fetchJson<UmamiStatsResponse>(statsUrlMonth),
                    fetchJson<UmamiStatsResponse>(statsUrlWeek),
                    fetchJson<UmamiStatsResponse>(statsUrlDay),
                    fetchJson<{ pageviews: UmamiTimeseriesPoint[] }>(pageviewsSeriesUrl).catch(() => ({ pageviews: [] })),
                    fetchJson<UmamiMetricItem[]>(topPagesUrl).catch(() => ([])),
                    fetchJson<Partial<RealtimeActive>>(realtimeActiveUrlPrimary).catch(
                        () => ({} as Partial<RealtimeActive>)
                    ),
                    fetchJson<UmamiMetricItem[]>(`${topPagesUrl.replace('type=url','type=referrer')}`).catch(() => ([])),
                    fetchJson<UmamiMetricItem[]>(`${topPagesUrl.replace('type=url','type=country')}`).catch(() => ([])),
                    fetchJson<UmamiMetricItem[]>(`${topPagesUrl.replace('type=url','type=language')}`).catch(() => ([])),
                ]);

                let onlineNow =
                    (realtimePrimary.active ?? realtimePrimary.x ?? realtimePrimary.value) as
                        | number
                        | undefined;

                if (onlineNow === undefined) {
                    const fallback = await fetchJson<Partial<RealtimeActive>>(
                        realtimeActiveUrlFallback
                    ).catch(() => ({} as Partial<RealtimeActive>));
                    onlineNow = (fallback.active ?? fallback.x ?? fallback.value) as number | undefined;
                }

                const toValue = (m?: UmamiSummaryMetric) => {
                    if (m == null) return 0;
                    if (typeof m === "number") return m;
                    return m.value ?? 0;
                };
                const totalPageviews = toValue(statsAll.pageviews);
                const totalVisits = toValue(statsAll.visits) || toValue(statsAll.visitors) || toValue(statsAll.uniques) || toValue(statsAll.pageviews);
                const totalTime = toValue(statsAll.totaltime);
                const averageVisitDurationSeconds = totalTime && totalVisits
                    ? totalTime / totalVisits
                    : 0;

                const mostActivePoint = (pageviewsSeries.pageviews || []).reduce<UmamiTimeseriesPoint | null>(
                    (max, cur) => (max === null || cur.y > max.y ? cur : max),
                    null
                );

                const mostActiveHour = mostActivePoint
                    ? (() => {
                        const rawTs = mostActivePoint.x ?? mostActivePoint.t ?? null;
                        const ts = rawTs != null ? normalizeToMsTimestamp(rawTs) : null;
                        return ts ? new Date(ts).toLocaleString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                      }) : "N/A";
                    })()
                    : "N/A";

                const mostVisitedPage = topPages[0]?.x || "";

                const visitsMonth = toValue(statsMonth.visits) || toValue(statsMonth.visitors) || toValue(statsMonth.uniques);
                const pageviewsMonth = toValue(statsMonth.pageviews);
                const visitsWeek = toValue(statsWeek.visits) || toValue(statsWeek.visitors) || toValue(statsWeek.uniques);
                const pageviewsWeek = toValue(statsWeek.pageviews);
                const visitsDay = toValue(statsDay.visits) || toValue(statsDay.visitors) || toValue(statsDay.uniques);
                const pageviewsDay = toValue(statsDay.pageviews);

                // Success with this base
                return NextResponse.json({
                    totalVisits,
                    totalPageviews,
                    visitsMonth,
                    pageviewsMonth,
                    visitsWeek,
                    pageviewsWeek,
                    visitsDay,
                    pageviewsDay,
                    onlineNow: typeof onlineNow === "number" ? onlineNow : 0,
                    mostVisitedPage,
                    mostActiveHour,
                    averageVisitDuration: formatDurationFromSeconds(averageVisitDurationSeconds),
                    topPages,
                    topReferrers,
                    topCountries,
                    topLanguages,
                });
            } catch (err) {
                lastError = err;
                console.error(`[stats] Base failed ${base}:`, (err as Error)?.message || err);
                // try next base
            }
        }

        throw lastError ?? new Error("All Umami base URLs failed");
    } catch (error) {
        const message = (error as Error)?.message || "Failed to load stats";
        // Surface error in server logs for easier diagnosis
        console.error("/api/stats error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


