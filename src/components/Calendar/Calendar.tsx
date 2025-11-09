"use client";

import styles from "./calendar.module.scss";

type CalendarCell = {
    label: number;
    inMonth: boolean;
    isToday: boolean;
    key: string;
};

const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

// keep if needed later
// const getISOWeek = (date: Date) => {
//     const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
//     const dayNum = tmp.getUTCDay() || 7;
//     tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
//     const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
//     return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
// };

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const buildMonthGrid = (date: Date): CalendarCell[] => {
    const now = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastOfMonth.getDate();
    const startDay = firstOfMonth.getDay();
    const prevMonthLast = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < startDay; i++) {
        const label = prevMonthLast - startDay + 1 + i;
        cells.push({ label, inMonth: false, isToday: false, key: `p-${label}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
        cells.push({ label: d, inMonth: true, isToday, key: `m-${d}` });
    }
    const remainder = cells.length % 7;
    const trailing = remainder === 0 ? 0 : 7 - remainder;
    for (let t = 1; t <= trailing; t++) {
        cells.push({ label: t, inMonth: false, isToday: false, key: `n-${t}` });
    }
    return cells;
};

export const Calendar = () => {
    const now = new Date();
    const monthGrid = buildMonthGrid(now);
    const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const fullDateLabel = `Today is ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    return (
        <div className={styles.calendarRoot}>
            <div className={styles.calendarHeader}>
                <div className={styles.calendarTitle}>{monthLabel}</div>
                <div className={styles.calendarInfo}>{fullDateLabel}</div>
            </div>
            <div className={styles.calendarWeekdays}>
                {["日","月","火","水","木","金","土"].map((d) => (
                    <div key={d} className={styles.calendarWeekday}>{d}</div>
                ))}
            </div>
            <div className={styles.calendarGrid}>
                {monthGrid.map((cell) => (
                    <div key={cell.key} className={`${styles.calendarCell} ${cell.inMonth ? "" : styles.calendarCellOtherMonth} ${cell.isToday ? styles.calendarCellToday : ""}`}>
                        <span>{cell.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


