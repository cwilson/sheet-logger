export function todayStr(): string {
    const d = new Date();
    return (
        String(d.getFullYear()) +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
    );
}

export function msToDateStr(ms: number): string {
    const d = new Date(ms);
    return (
        String(d.getFullYear()) +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
    );
}

export function msToTimeStr(ms: number): string {
    const d = new Date(ms);
    return (
        String(d.getHours()).padStart(2, "0") +
        ":" +
        String(d.getMinutes()).padStart(2, "0")
    );
}

export function dateTimeToMs(dateStr: string, timeStr: string): number {
    return new Date(`${dateStr}T${timeStr}:00`).getTime();
}

export function formatDuration(ms: number): string {
    const totalMins = Math.round(ms / 60_000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export function formatDateLong(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

export function weekStart(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const dow = d.getDay(); // 0=Sun, 1=Mon
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
    return msToDateStr(d.getTime());
}

export function formatWeekRange(mondayStr: string): string {
    const start = new Date(mondayStr + "T00:00:00");
    const end = new Date(mondayStr + "T00:00:00");
    end.setDate(end.getDate() + 6);
    const mo: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
    return (
        start.toLocaleDateString(undefined, mo) +
        " – " +
        end.toLocaleDateString(undefined, { ...mo, year: "numeric" })
    );
}

export function formatElapsed(ms: number): string {
    const totalS = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalS / 3600);
    const m = Math.floor((totalS % 3600) / 60);
    const s = totalS % 60;
    return (
        String(h).padStart(2, "0") +
        ":" +
        String(m).padStart(2, "0") +
        ":" +
        String(s).padStart(2, "0")
    );
}

export function addDays(dateStr: string, delta: number): string {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return msToDateStr(d.getTime());
}
