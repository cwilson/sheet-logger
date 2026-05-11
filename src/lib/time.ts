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

export function addDays(dateStr: string, delta: number): string {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return msToDateStr(d.getTime());
}
