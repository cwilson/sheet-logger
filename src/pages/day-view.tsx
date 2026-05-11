import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/shallow";
import { selectTimeEntries } from "@/store";
import {
    todayStr,
    msToTimeStr,
    msToDateStr,
    dateTimeToMs,
    formatDuration,
    formatDateLong,
    addDays,
} from "@/lib/time";
import { TaskPicker } from "@/components/task-picker";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    PlusIcon,
    PencilSimpleIcon,
    TrashIcon,
    CaretLeftIcon,
    CaretRightIcon,
    CaretDownIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TimeEntry, TimeEntryTarget } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildEntryLabel(
    entry: TimeEntry,
    tasks: ReturnType<typeof useStore.getState>["tasks"],
    projects: ReturnType<typeof useStore.getState>["projects"],
    clients: ReturnType<typeof useStore.getState>["clients"],
    phases: ReturnType<typeof useStore.getState>["phases"],
): string {
    const t = entry.target;
    const parts: (string | undefined)[] = [];
    if ("clientId" in t) parts.push(clients[t.clientId]?.name);
    if ("projectId" in t) parts.push(projects[t.projectId]?.name);
    if ("phaseId" in t && t.phaseId) parts.push(phases[t.phaseId]?.name);
    if ("taskId" in t) parts.push(tasks[t.taskId]?.name);
    return parts.filter(Boolean).join(" › ") || "Unknown";
}

// ─── Form & group state ───────────────────────────────────────────────────────

interface TaskPreset {
    taskId: string;
    clientId: string;
    projectId: string;
    phaseId?: string;
}

interface TaskGroup {
    key: string;
    label: string;
    preset: TaskPreset;
    totalMs: number;
    entries: TimeEntry[];
}

interface EntryForm {
    taskId: string;
    clientId: string;
    projectId: string;
    phaseId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
}

interface FormErrors {
    taskId?: string;
    endTime?: string;
}

function emptyForm(date: string, preset?: TaskPreset): EntryForm {
    return {
        taskId: preset?.taskId ?? "",
        clientId: preset?.clientId ?? "",
        projectId: preset?.projectId ?? "",
        phaseId: preset?.phaseId ?? "",
        date,
        startTime: "",
        endTime: "",
        notes: "",
    };
}

function formFromEntry(entry: TimeEntry): EntryForm {
    const t = entry.target;
    return {
        taskId: "taskId" in t ? t.taskId : "",
        clientId: "clientId" in t ? t.clientId : "",
        projectId: "projectId" in t ? t.projectId : "",
        phaseId: "phaseId" in t && t.phaseId ? t.phaseId : "",
        date: msToDateStr(entry.startTime),
        startTime: msToTimeStr(entry.startTime),
        endTime: entry.endTime !== null ? msToTimeStr(entry.endTime) : "",
        notes: entry.notes ?? "",
    };
}

function groupEntries(
    entries: TimeEntry[],
    tasks: ReturnType<typeof useStore.getState>["tasks"],
    projects: ReturnType<typeof useStore.getState>["projects"],
    clients: ReturnType<typeof useStore.getState>["clients"],
    phases: ReturnType<typeof useStore.getState>["phases"],
): TaskGroup[] {
    const map = new Map<string, TaskGroup>();

    for (const entry of entries) {
        const t = entry.target;
        const key =
            t.level === "task"
                ? `task:${t.taskId}`
                : t.level === "phase"
                  ? `phase:${t.phaseId}`
                  : t.level === "project"
                    ? `project:${t.projectId}`
                    : `client:${t.clientId}`;

        if (!map.has(key)) {
            const label = buildEntryLabel(
                entry,
                tasks,
                projects,
                clients,
                phases,
            );
            const preset: TaskPreset = {
                taskId: t.level === "task" ? t.taskId : "",
                clientId: "clientId" in t ? t.clientId : "",
                projectId: "projectId" in t ? t.projectId : "",
                phaseId: "phaseId" in t && t.phaseId ? t.phaseId : undefined,
            };
            map.set(key, { key, label, preset, totalMs: 0, entries: [] });
        }

        const group = map.get(key)!;
        group.entries.push(entry);
        if (entry.endTime !== null)
            group.totalMs += entry.endTime - entry.startTime;
    }

    return Array.from(map.values());
}

// ─── Entry Dialog ─────────────────────────────────────────────────────────────

interface EntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingEntry: TimeEntry | null;
    defaultDate: string;
    preset?: TaskPreset | null;
}

// Mounted fresh via `key` on each open — no useEffect reset needed.
const EntryDialog = ({
    open,
    onOpenChange,
    editingEntry,
    defaultDate,
    preset,
}: EntryDialogProps) => {
    const addTimeEntry = useStore((s) => s.addTimeEntry);
    const updateTimeEntry = useStore((s) => s.updateTimeEntry);

    const [form, setForm] = useState<EntryForm>(() =>
        editingEntry
            ? formFromEntry(editingEntry)
            : emptyForm(defaultDate, preset ?? undefined),
    );
    const [errors, setErrors] = useState<FormErrors>({});

    const patch = <K extends keyof EntryForm>(key: K, val: EntryForm[K]) =>
        setForm((f) => ({ ...f, [key]: val }));

    const duration = useMemo(() => {
        if (!form.startTime || !form.endTime) return null;
        const start = dateTimeToMs(form.date, form.startTime);
        const end = dateTimeToMs(form.date, form.endTime);
        return end > start ? end - start : null;
    }, [form.date, form.startTime, form.endTime]);

    const handleSave = () => {
        const errs: FormErrors = {};
        if (!form.taskId) errs.taskId = "Please select a task.";
        if (!form.startTime || !form.endTime) {
            errs.endTime = "Start and end time are required.";
        } else {
            const start = dateTimeToMs(form.date, form.startTime);
            const end = dateTimeToMs(form.date, form.endTime);
            if (end <= start)
                errs.endTime = "End time must be after start time.";
        }
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        const startMs = dateTimeToMs(form.date, form.startTime);
        const endMs = dateTimeToMs(form.date, form.endTime);

        const target: TimeEntryTarget = {
            level: "task",
            clientId: form.clientId,
            projectId: form.projectId,
            ...(form.phaseId ? { phaseId: form.phaseId } : {}),
            taskId: form.taskId,
        };

        if (editingEntry) {
            updateTimeEntry(editingEntry.id, {
                target,
                startTime: startMs,
                endTime: endMs,
                notes: form.notes || undefined,
            });
        } else {
            addTimeEntry({
                target,
                startTime: startMs,
                endTime: endMs,
                notes: form.notes || undefined,
            });
        }

        onOpenChange(false);
    };

    const handleTaskChange = (
        taskId: string,
        clientId: string,
        projectId: string,
        phaseId?: string,
    ) => {
        setForm((f) => ({
            ...f,
            taskId,
            clientId,
            projectId,
            phaseId: phaseId ?? "",
        }));
        if (errors.taskId) setErrors((e) => ({ ...e, taskId: undefined }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editingEntry ? "Edit time entry" : "New time entry"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            Task
                        </label>
                        <TaskPicker
                            value={form.taskId}
                            onChange={handleTaskChange}
                        />
                        {errors.taskId && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.taskId}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                                Date
                            </label>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(e) => patch("date", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                                Start
                            </label>
                            <Input
                                type="time"
                                value={form.startTime}
                                onChange={(e) =>
                                    patch("startTime", e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                                End
                            </label>
                            <Input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => {
                                    patch("endTime", e.target.value);
                                    if (errors.endTime)
                                        setErrors((er) => ({
                                            ...er,
                                            endTime: undefined,
                                        }));
                                }}
                            />
                        </div>
                    </div>

                    {errors.endTime && (
                        <p className="text-xs text-destructive">
                            {errors.endTime}
                        </p>
                    )}

                    {duration !== null && !errors.endTime && (
                        <p className="text-xs text-muted-foreground">
                            Duration:{" "}
                            <span className="font-medium text-foreground">
                                {formatDuration(duration)}
                            </span>
                        </p>
                    )}

                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            Notes (optional)
                        </label>
                        <Textarea
                            value={form.notes}
                            onChange={(e) => patch("notes", e.target.value)}
                            placeholder="What did you work on?"
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        {editingEntry ? "Save changes" : "Add entry"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Entry Row ────────────────────────────────────────────────────────────────

interface EntryRowProps {
    entry: TimeEntry;
    onEdit: () => void;
    onDelete: () => void;
}

const EntryRow = ({ entry, onEdit, onDelete }: EntryRowProps) => {
    const duration =
        entry.endTime !== null
            ? formatDuration(entry.endTime - entry.startTime)
            : null;

    return (
        <div className="group flex items-center gap-3 py-1.5 pl-10 pr-4 hover:bg-muted/30">
            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                {msToTimeStr(entry.startTime)}
                {" – "}
                {entry.endTime !== null
                    ? msToTimeStr(entry.endTime)
                    : "running"}
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-xs text-muted-foreground">
                {duration ?? "—"}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs italic text-muted-foreground/60">
                {entry.notes}
            </span>
            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onEdit}
                    title="Edit"
                >
                    <PencilSimpleIcon />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onDelete}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                >
                    <TrashIcon />
                </Button>
            </div>
        </div>
    );
};

// ─── Task Group Row ───────────────────────────────────────────────────────────

interface TaskGroupRowProps {
    group: TaskGroup;
    onEdit: (entry: TimeEntry) => void;
    onDelete: (id: string) => void;
    onAdd: (preset: TaskPreset) => void;
}

const TaskGroupRow = ({
    group,
    onEdit,
    onDelete,
    onAdd,
}: TaskGroupRowProps) => {
    const [open, setOpen] = useState(true);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="border-b border-border"
        >
            <div className="group flex items-center gap-1.5 px-4 py-2 hover:bg-muted/40">
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground"
                    >
                        {open ? <CaretDownIcon /> : <CaretRightIcon />}
                    </Button>
                </CollapsibleTrigger>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {group.label}
                </span>
                {group.totalMs > 0 && (
                    <span className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground">
                        {formatDuration(group.totalMs)}
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onAdd(group.preset)}
                    title="Add entry for this task"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                    <PlusIcon />
                </Button>
            </div>
            <CollapsibleContent>
                {group.entries.map((entry) => (
                    <EntryRow
                        key={entry.id}
                        entry={entry}
                        onEdit={() => onEdit(entry)}
                        onDelete={() => onDelete(entry.id)}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};

// ─── Day Analytics ────────────────────────────────────────────────────────────

const TARGET_MS = 8 * 60 * 60 * 1000;

interface DayAnalyticsProps {
    entries: TimeEntry[];
}

const DayAnalytics = ({ entries }: DayAnalyticsProps) => {
    const loggedMs = entries.reduce(
        (sum, e) => sum + (e.endTime !== null ? e.endTime - e.startTime : 0),
        0,
    );
    const pct = Math.min(loggedMs / TARGET_MS, 1);
    const remainingMs = Math.max(TARGET_MS - loggedMs, 0);
    const done = loggedMs >= TARGET_MS;

    return (
        <div className="flex items-center gap-3 border-b border-border px-6 py-2">
            <div className="relative h-1.5 flex-1 overflow-hidden bg-muted">
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 transition-all",
                        done ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${pct * 100}%` }}
                />
            </div>
            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                {done ? (
                    <span className="text-emerald-500">
                        {formatDuration(loggedMs)} logged
                    </span>
                ) : (
                    <>
                        {formatDuration(loggedMs)}{" "}
                        <span className="text-muted-foreground/50">/ 8h</span>
                        <span className="ml-2 text-muted-foreground/50">
                            {formatDuration(remainingMs)} left
                        </span>
                    </>
                )}
            </span>
        </div>
    );
};

// ─── Day View ─────────────────────────────────────────────────────────────────

export const DayView = () => {
    const [viewDate, setViewDate] = useState(todayStr);
    const [dialogKey, setDialogKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [addPreset, setAddPreset] = useState<TaskPreset | null>(null);

    const allEntries = useStore(useShallow(selectTimeEntries));
    const tasks = useStore((s) => s.tasks);
    const projects = useStore((s) => s.projects);
    const clients = useStore((s) => s.clients);
    const phases = useStore((s) => s.phases);
    const removeTimeEntry = useStore((s) => s.removeTimeEntry);

    const todayEntries = useMemo(
        () =>
            allEntries
                .filter((e) => msToDateStr(e.startTime) === viewDate)
                .sort((a, b) => a.startTime - b.startTime),
        [allEntries, viewDate],
    );

    const grouped = useMemo(
        () => groupEntries(todayEntries, tasks, projects, clients, phases),
        [todayEntries, tasks, projects, clients, phases],
    );

    const isToday = viewDate === todayStr();

    const openAdd = (preset?: TaskPreset) => {
        setAddPreset(preset ?? null);
        setEditingEntry(null);
        setDialogKey((k) => k + 1);
        setDialogOpen(true);
    };

    const openEdit = (entry: TimeEntry) => {
        setAddPreset(null);
        setEditingEntry(entry);
        setDialogKey((k) => k + 1);
        setDialogOpen(true);
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-6 py-3">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewDate((d) => addDays(d, -1))}
                    title="Previous day"
                >
                    <CaretLeftIcon />
                </Button>
                <span className="min-w-0 flex-1 text-sm font-medium">
                    {formatDateLong(viewDate)}
                </span>
                {!isToday && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewDate(todayStr())}
                    >
                        Today
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewDate((d) => addDays(d, 1))}
                    title="Next day"
                >
                    <CaretRightIcon />
                </Button>
                <Button size="sm" onClick={() => openAdd()}>
                    <PlusIcon />
                    Add entry
                </Button>
            </div>

            <DayAnalytics entries={todayEntries} />

            {/* Grouped entry list */}
            <div className="flex-1 overflow-y-auto">
                {grouped.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-sm text-muted-foreground">
                            No entries for this day.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => openAdd()}
                        >
                            <PlusIcon />
                            Add entry
                        </Button>
                    </div>
                ) : (
                    grouped.map((group) => (
                        <TaskGroupRow
                            key={group.key}
                            group={group}
                            onEdit={openEdit}
                            onDelete={removeTimeEntry}
                            onAdd={openAdd}
                        />
                    ))
                )}
            </div>

            <EntryDialog
                key={dialogKey}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editingEntry={editingEntry}
                defaultDate={viewDate}
                preset={addPreset}
            />
        </div>
    );
};
