import {
    todayStr,
    msToDateStr,
    msToTimeStr,
    dateTimeToMs,
    formatDuration,
    formatDateLong,
    weekStart,
    formatWeekRange,
    formatElapsed,
    addDays,
} from "./time";

// Fixed reference: 2024-03-15 09:05:03 UTC (Friday)
const REF_MS = Date.UTC(2024, 2, 15, 9, 5, 3);

describe("msToDateStr", () => {
    it("formats a UTC midnight timestamp correctly in local time", () => {
        // Use a timestamp we construct from local date parts to avoid TZ drift.
        const ms = new Date("2024-03-15T00:00:00").getTime();
        expect(msToDateStr(ms)).toBe("2024-03-15");
    });

    it("zero-pads month and day", () => {
        const ms = new Date("2001-01-07T00:00:00").getTime();
        expect(msToDateStr(ms)).toBe("2001-01-07");
    });
});

describe("msToTimeStr", () => {
    it("formats hours and minutes with zero-padding", () => {
        const ms = new Date("2024-03-15T09:05:00").getTime();
        expect(msToTimeStr(ms)).toBe("09:05");
    });

    it("handles midnight", () => {
        const ms = new Date("2024-03-15T00:00:00").getTime();
        expect(msToTimeStr(ms)).toBe("00:00");
    });
});

describe("dateTimeToMs", () => {
    it("round-trips with msToDateStr and msToTimeStr", () => {
        const ms = new Date("2024-06-20T14:30:00").getTime();
        const dateStr = msToDateStr(ms);
        const timeStr = msToTimeStr(ms);
        expect(dateTimeToMs(dateStr, timeStr)).toBe(ms);
    });
});

describe("formatDuration", () => {
    it("shows minutes only for < 1 hour", () => {
        expect(formatDuration(45 * 60_000)).toBe("45m");
    });

    it("shows hours only when no remainder", () => {
        expect(formatDuration(3 * 3_600_000)).toBe("3h");
    });

    it("shows hours and minutes", () => {
        expect(formatDuration(2 * 3_600_000 + 30 * 60_000)).toBe("2h 30m");
    });

    it("rounds to nearest minute", () => {
        expect(formatDuration(90_500)).toBe("2m"); // 90.5 seconds → 2 min
    });

    it("handles zero", () => {
        expect(formatDuration(0)).toBe("0m");
    });
});

describe("formatElapsed", () => {
    it("formats HH:MM:SS", () => {
        expect(formatElapsed(3_661_000)).toBe("01:01:01");
    });

    it("pads all fields to two digits", () => {
        expect(formatElapsed(0)).toBe("00:00:00");
    });

    it("clamps negative values to zero", () => {
        expect(formatElapsed(-5000)).toBe("00:00:00");
    });

    it("handles more than 10 hours", () => {
        expect(formatElapsed(10 * 3_600_000 + 5_000)).toBe("10:00:05");
    });
});

describe("addDays", () => {
    it("adds positive days", () => {
        expect(addDays("2024-03-15", 3)).toBe("2024-03-18");
    });

    it("subtracts days with negative delta", () => {
        expect(addDays("2024-03-15", -7)).toBe("2024-03-08");
    });

    it("crosses month boundary", () => {
        expect(addDays("2024-01-30", 3)).toBe("2024-02-02");
    });

    it("crosses year boundary", () => {
        expect(addDays("2023-12-30", 4)).toBe("2024-01-03");
    });

    it("zero delta returns same date", () => {
        expect(addDays("2024-06-15", 0)).toBe("2024-06-15");
    });
});

describe("weekStart", () => {
    it("returns Monday for a Friday input", () => {
        expect(weekStart("2024-03-15")).toBe("2024-03-11"); // 2024-03-15 is Friday
    });

    it("returns Monday for a Monday input unchanged", () => {
        expect(weekStart("2024-03-11")).toBe("2024-03-11");
    });

    it("returns previous Monday for a Sunday input", () => {
        expect(weekStart("2024-03-17")).toBe("2024-03-11"); // Sunday → prior Monday
    });

    it("crosses month boundary", () => {
        expect(weekStart("2024-03-03")).toBe("2024-02-26"); // Sunday March 3 → Mon Feb 26
    });
});

describe("formatWeekRange", () => {
    it("includes start and end with year on end only", () => {
        const result = formatWeekRange("2024-03-11");
        // "March 11 – March 17, 2024" (locale-dependent, check structure)
        expect(result).toContain("2024");
        expect(result).toContain("–");
    });
});

describe("todayStr", () => {
    it("returns a string matching YYYY-MM-DD format", () => {
        expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe("formatDateLong", () => {
    it("returns a non-empty string", () => {
        expect(formatDateLong("2024-03-15").length).toBeGreaterThan(0);
    });
});

// Suppress unused warning for REF_MS which anchors the TZ-sensitive tests above.
void REF_MS;
