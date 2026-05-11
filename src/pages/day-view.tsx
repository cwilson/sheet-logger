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

// ─── Form state ───────────────────────────────────────────────────────────────

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

function emptyForm(date: string): EntryForm {
    return {
        taskId: "",
        clientId: "",
        projectId: "",
        phaseId: "",
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

// ─── Entry Dialog ─────────────────────────────────────────────────────────────

interface EntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingEntry: TimeEntry | null;
    defaultDate: string;
}

// Mounted fresh via `key` on each open — no useEffect reset needed.
const EntryDialog = ({
    open,
    onOpenChange,
    editingEntry,
    defaultDate,
}: EntryDialogProps) => {
    const addTimeEntry = useStore((s) => s.addTimeEntry);
    const updateTimeEntry = useStore((s) => s.updateTimeEntry);

    const [form, setForm] = useState<EntryForm>(() =>
        editingEntry ? formFromEntry(editingEntry) : emptyForm(defaultDate),
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
    label: string;
    onEdit: () => void;
    onDelete: () => void;
}

const EntryRow = ({ entry, label, onEdit, onDelete }: EntryRowProps) => {
    const duration =
        entry.endTime !== null
            ? formatDuration(entry.endTime - entry.startTime)
            : null;

    return (
        <div className="group px-6 py-2.5 hover:bg-muted/40">
            <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                    {msToTimeStr(entry.startTime)}
                    {" – "}
                    {entry.endTime !== null
                        ? msToTimeStr(entry.endTime)
                        : "running"}
                </span>
                <span
                    className={cn(
                        "w-12 shrink-0 text-right text-xs font-medium",
                        !duration && "text-muted-foreground",
                    )}
                >
                    {duration ?? "—"}
                </span>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onEdit}
                        title="Edit"
                    >
                        <PencilSimpleIcon />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onDelete}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                    >
                        <TrashIcon />
                    </Button>
                </div>
            </div>
            {entry.notes && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {entry.notes}
                </p>
            )}
        </div>
    );
};

// ─── Day View ─────────────────────────────────────────────────────────────────

export const DayView = () => {
    const [viewDate, setViewDate] = useState(todayStr);
    const [dialogKey, setDialogKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

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

    const isToday = viewDate === todayStr();

    const openAdd = () => {
        setEditingEntry(null);
        setDialogKey((k) => k + 1);
        setDialogOpen(true);
    };

    const openEdit = (entry: TimeEntry) => {
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
                <Button size="sm" onClick={openAdd}>
                    <PlusIcon />
                    Add entry
                </Button>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto">
                {todayEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-sm text-muted-foreground">
                            No entries for this day.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={openAdd}
                        >
                            <PlusIcon />
                            Add entry
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {todayEntries.map((entry) => (
                            <EntryRow
                                key={entry.id}
                                entry={entry}
                                label={buildEntryLabel(
                                    entry,
                                    tasks,
                                    projects,
                                    clients,
                                    phases,
                                )}
                                onEdit={() => openEdit(entry)}
                                onDelete={() => removeTimeEntry(entry.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <EntryDialog
                key={dialogKey}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editingEntry={editingEntry}
                defaultDate={viewDate}
            />
        </div>
    );
};
