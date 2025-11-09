"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./statspanel.module.scss";

type StatValue = string | number;
type StatsResponse = Record<string, StatValue>;

export const StatsPanel = () => {
    
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const fetchedRef = useRef(false);
        useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/stats", { cache: "no-store" });
                if (!res.ok) return;
                const json: StatsResponse = await res.json();
                setStats(json);
            } catch {
                // Silently ignore; keep layout unchanged
            }
        };
        fetchStats();
    }, []);

    const addCommas = (value: number | string) => {
        if (typeof value === "string") return value;
        return value.toLocaleString();
    }

    return (
        <div className={`windowContent`}>
            <div className={styles.statsContainer}>
                {stats && (() => {
                    const labels: Record<string, string> = {
                        totalVisits: "Total Visits",
                        totalPageviews: "Total Pageviews",
                        visitsMonth: "Visits (30d)",
                        pageviewsMonth: "Pageviews (30d)",
                        visitsWeek: "Visits (7d)",
                        pageviewsWeek: "Pageviews (7d)",
                        visitsDay: "Visits (24h)",
                        pageviewsDay: "Pageviews (24h)",
                        onlineNow: "Online Now",
                        mostVisitedPage: "Most Visited Page",
                        mostActiveHour: "Most Active Hour",
                        averageVisitDuration: "Avg Visit Duration",
                    };
                    const order = [
                        "totalVisits",
                        "totalPageviews",
                        "visitsMonth",
                        "pageviewsMonth",
                        "visitsWeek",
                        "pageviewsWeek",
                        "visitsDay",
                        "pageviewsDay",
                        "onlineNow",
                        "mostVisitedPage",
                        "mostActiveHour",
                        "averageVisitDuration",
                    ];
                    return (
                        <>
                        {order.filter((key) => key in stats).map((key) => (
                            <p key={key}><span className={styles.statTitle}>{labels[key] || key}:</span> {addCommas(stats[key])}</p>
                        ))}
                        </>
                    );
                })()}
            </div>

            {
                stats && (() => {
                    const labels: Record<string, string> = {
                        topPages: "Top Pages",
                        topReferrers: "Top Referrers",
                        topCountries: "Top Countries",
                        topLanguages: "Top Languages",
                    }
                    const order = [
                        "topPages",
                        "topReferrers",
                        "topCountries",
                        "topLanguages",
                    ];
                    return (
                        <div className={styles.metricsContainer}>
                        {order.filter((key) => key in stats).map((key) => (
                            <div className={styles.metricsItem} key={key}>
                            <h3 key={key}>{labels[key] || key}</h3>
                            {
                                stats[key] && Array.isArray(stats[key]) && stats[key].map((item) => (
                                    <p key={item.x}><span className={styles.statTitle}>{item.x || "None"}:</span> <span className={styles.statValue}>{addCommas(Number(item.y)) || "N/A"}</span></p>
                                ))
                            }
                            </div>
                        ))}
                        </div>
                    );
                })()
            }
        </div>
    )
};