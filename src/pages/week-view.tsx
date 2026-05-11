import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/shallow";
import { buildEntryLabel } from "@/lib/entries";
import {
    todayStr,
    addDays,
    weekStart,
    formatWeekRange,
    formatDuration,
} from "@/lib/time";
import { Button } from "@/components/ui/button";
import {
    CaretLeftIcon,
    CaretRightIcon,
    CopyIcon,
    CheckIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TimeEntry } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEK_TARGET_MS = 40 * 3_600_000;
const DAY_TARGET_MS = 8 * 3_600_000;

// ── Grid computation ──────────────────────────────────────────────────────────

interface WeekRow {
    key: string;
    label: string;
    dayMs: number[]; // index 0 = Monday
    totalMs: number;
}

function entryDuration(e: TimeEntry): number {
    if (e.endTime === null) return 0;
    return Math.max(0, e.endTime - e.startTime);
}

function computeGrid(
    entries: TimeEntry[],
    days: string[],
    tasks: ReturnType<typeof useStore.getState>["tasks"],
    projects: ReturnType<typeof useStore.getState>["projects"],
    clients: ReturnType<typeof useStore.getState>["clients"],
    phases: ReturnType<typeof useStore.getState>["phases"],
): WeekRow[] {
    const rowMap = new Map<string, WeekRow>();

    for (const entry of entries) {
        if (entry.endTime === null) continue;
        const dateStr = new Date(entry.startTime).toISOString().slice(0, 10);
        const dayIdx = days.indexOf(dateStr);
        if (dayIdx === -1) continue;

        const t = entry.target;
        const key =
            "taskId" in t
                ? `task:${t.taskId}`
                : "phaseId" in t && t.phaseId
                  ? `phase:${t.phaseId}`
                  : "projectId" in t
                    ? `project:${t.projectId}`
                    : "client:unknown";

        if (!rowMap.has(key)) {
            rowMap.set(key, {
                key,
                label: buildEntryLabel(entry, tasks, projects, clients, phases),
                dayMs: [0, 0, 0, 0, 0, 0, 0],
                totalMs: 0,
            });
        }

        const row = rowMap.get(key)!;
        const dur = entryDuration(entry);
        row.dayMs[dayIdx] += dur;
        row.totalMs += dur;
    }

    return Array.from(rowMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
    );
}

function toTsv(
    rows: WeekRow[],
    colTotals: number[],
    weekTotal: number,
    days: string[],
): string {
    const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const header = [
        "Task",
        ...days.map((d, i) => `${shortDays[i]} ${d}`),
        "Total",
    ].join("\t");
    const dataRows = rows.map((r) =>
        [
            r.label,
            ...r.dayMs.map((ms) => (ms > 0 ? (ms / 3_600_000).toFixed(2) : "")),
            (r.totalMs / 3_600_000).toFixed(2),
        ].join("\t"),
    );
    const totalsRow = [
        "TOTAL",
        ...colTotals.map((ms) => (ms > 0 ? (ms / 3_600_000).toFixed(2) : "")),
        (weekTotal / 3_600_000).toFixed(2),
    ].join("\t");
    return [header, ...dataRows, totalsRow].join("\n");
}

// ── Analytics bar ─────────────────────────────────────────────────────────────

const WeekAnalytics = ({ totalMs }: { totalMs: number }) => {
    const pct = Math.min(100, (totalMs / WEEK_TARGET_MS) * 100);
    const done = totalMs >= WEEK_TARGET_MS;
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-[1.5px] bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        done ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {formatDuration(totalMs)} / 40h
            </span>
        </div>
    );
};

// ── Week View ─────────────────────────────────────────────────────────────────

export const WeekView = () => {
    const [viewWeek, setViewWeek] = useState(() => weekStart(todayStr()));
    const [copied, setCopied] = useState(false);

    const tasks = useStore(useShallow((s) => s.tasks));
    const projects = useStore(useShallow((s) => s.projects));
    const clients = useStore(useShallow((s) => s.clients));
    const phases = useStore(useShallow((s) => s.phases));
    const allEntries = useStore(
        useShallow((s) => Object.values(s.timeEntries)),
    );

    const days = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(viewWeek, i)),
        [viewWeek],
    );

    const weekEntries = useMemo(
        () =>
            allEntries.filter((e) => {
                const d = new Date(e.startTime).toISOString().slice(0, 10);
                return days.includes(d);
            }),
        [allEntries, days],
    );

    const rows = useMemo(
        () => computeGrid(weekEntries, days, tasks, projects, clients, phases),
        [weekEntries, days, tasks, projects, clients, phases],
    );

    const colTotals = useMemo(
        () => days.map((_, i) => rows.reduce((sum, r) => sum + r.dayMs[i], 0)),
        [rows, days],
    );

    const weekTotal = useMemo(
        () => rows.reduce((sum, r) => sum + r.totalMs, 0),
        [rows],
    );

    const handleCopy = () => {
        navigator.clipboard.writeText(toTsv(rows, colTotals, weekTotal, days));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewWeek((w) => addDays(w, -7))}
                    title="Previous week"
                >
                    <CaretLeftIcon />
                </Button>
                <h1 className="text-sm font-semibold flex-1">
                    {formatWeekRange(viewWeek)}
                </h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewWeek(weekStart(todayStr()))}
                >
                    This week
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewWeek((w) => addDays(w, 7))}
                    title="Next week"
                >
                    <CaretRightIcon />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={rows.length === 0}
                    className="ml-2"
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied!" : "Copy"}
                </Button>
            </div>

            {/* Analytics */}
            <WeekAnalytics totalMs={weekTotal} />

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-xs">
                    <colgroup>
                        <col className="w-48" />
                        {days.map((d) => (
                            <col key={d} className="w-20" />
                        ))}
                        <col className="w-20" />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-2 pr-3 text-left font-medium text-muted-foreground">
                                Task
                            </th>
                            {days.map((d, i) => {
                                const isWeekend = i >= 5;
                                return (
                                    <th
                                        key={d}
                                        className={cn(
                                            "py-2 px-1 text-right font-medium",
                                            isWeekend
                                                ? "text-muted-foreground/40"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        <div>{shortDays[i]}</div>
                                        <div className="font-normal">
                                            {d.slice(5)}
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="py-2 pl-1 text-right font-medium text-muted-foreground">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    No entries logged this week.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr
                                    key={row.key}
                                    className="border-b border-border/50 hover:bg-muted/30"
                                >
                                    <td
                                        className="py-2 pr-3 truncate font-medium"
                                        title={row.label}
                                    >
                                        {row.label}
                                    </td>
                                    {row.dayMs.map((ms, i) => (
                                        <td
                                            key={days[i]}
                                            className={cn(
                                                "py-2 px-1 text-right tabular-nums",
                                                ms === 0
                                                    ? "text-muted-foreground/30"
                                                    : "",
                                            )}
                                        >
                                            {ms > 0 ? formatDuration(ms) : "—"}
                                        </td>
                                    ))}
                                    <td className="py-2 pl-1 text-right tabular-nums font-medium">
                                        {formatDuration(row.totalMs)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-border">
                            <td className="py-2 pr-3 font-semibold text-muted-foreground">
                                Total
                            </td>
                            {colTotals.map((ms, i) => (
                                <td
                                    key={days[i]}
                                    className={cn(
                                        "py-2 px-1 text-right tabular-nums font-semibold",
                                        ms === 0
                                            ? "text-muted-foreground/30"
                                            : ms >= DAY_TARGET_MS
                                              ? "text-emerald-500"
                                              : "",
                                    )}
                                >
                                    {ms > 0 ? formatDuration(ms) : "—"}
                                </td>
                            ))}
                            <td
                                className={cn(
                                    "py-2 pl-1 text-right tabular-nums font-semibold",
                                    weekTotal >= WEEK_TARGET_MS
                                        ? "text-emerald-500"
                                        : "",
                                )}
                            >
                                {weekTotal > 0
                                    ? formatDuration(weekTotal)
                                    : "—"}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
