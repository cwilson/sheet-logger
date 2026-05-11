import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { selectActiveEntry } from "@/store";
import { buildEntryLabel } from "@/lib/entries";
import { formatElapsed, formatDuration } from "@/lib/time";
import {
    fireNotification,
    playBeep,
    requestNotificationPermission,
} from "@/lib/notify";
import { TaskPicker } from "@/components/task-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    TimerIcon,
    PlayIcon,
    PauseIcon,
    SquareIcon,
    XIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TimeEntryTarget } from "@/types";

// ─── Start Timer Dialog ───────────────────────────────────────────────────────

interface StartDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const StartDialog = ({ open, onOpenChange }: StartDialogProps) => {
    const startTimer = useStore((s) => s.startTimer);

    const [taskId, setTaskId] = useState("");
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [phaseId, setPhaseId] = useState<string | undefined>();
    const [notes, setNotes] = useState("");
    const [estimateH, setEstimateH] = useState("");
    const [estimateM, setEstimateM] = useState("");
    const [taskError, setTaskError] = useState(false);

    const handleStart = async () => {
        if (!taskId) {
            setTaskError(true);
            return;
        }
        const target: TimeEntryTarget = {
            level: "task",
            clientId,
            projectId,
            ...(phaseId ? { phaseId } : {}),
            taskId,
        };

        const h = parseInt(estimateH || "0", 10);
        const m = parseInt(estimateM || "0", 10);
        const estimateMs = (h * 60 + m) * 60_000;

        if (estimateMs > 0) {
            await requestNotificationPermission();
        }

        startTimer(
            target,
            notes || undefined,
            estimateMs > 0 ? estimateMs : undefined,
        );
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Start timer</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            Task
                        </label>
                        <TaskPicker
                            value={taskId}
                            onChange={(tid, cid, pid, phid) => {
                                setTaskId(tid);
                                setClientId(cid);
                                setProjectId(pid);
                                setPhaseId(phid);
                                setTaskError(false);
                            }}
                        />
                        {taskError && (
                            <p className="mt-1 text-xs text-destructive">
                                Please select a task.
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            Estimate (optional)
                        </label>
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="number"
                                min={0}
                                max={23}
                                placeholder="0"
                                value={estimateH}
                                onChange={(e) => setEstimateH(e.target.value)}
                                className="w-16"
                            />
                            <span className="text-xs text-muted-foreground">
                                h
                            </span>
                            <Input
                                type="number"
                                min={0}
                                max={59}
                                placeholder="0"
                                value={estimateM}
                                onChange={(e) => setEstimateM(e.target.value)}
                                className="w-16"
                            />
                            <span className="text-xs text-muted-foreground">
                                m
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            Notes (optional)
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="What are you working on?"
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
                    <Button onClick={handleStart}>
                        <PlayIcon />
                        Start
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Timer Widget ─────────────────────────────────────────────────────────────

const THRESHOLD = 0.8;

export const TimerWidget = () => {
    const activeEntry = useStore(selectActiveEntry);
    const timerPausedAt = useStore((s) => s.timerPausedAt);
    const timerPausedMs = useStore((s) => s.timerPausedMs);
    const timerEstimateMs = useStore((s) => s.timerEstimateMs);
    const timerNotifiedThreshold = useStore((s) => s.timerNotifiedThreshold);
    const timerNotifiedEstimate = useStore((s) => s.timerNotifiedEstimate);
    const pauseTimer = useStore((s) => s.pauseTimer);
    const resumeTimer = useStore((s) => s.resumeTimer);
    const stopTimer = useStore((s) => s.stopTimer);
    const cancelTimer = useStore((s) => s.cancelTimer);
    const markThresholdNotified = useStore((s) => s.markThresholdNotified);
    const markEstimateNotified = useStore((s) => s.markEstimateNotified);

    const tasks = useStore((s) => s.tasks);
    const projects = useStore((s) => s.projects);
    const clients = useStore((s) => s.clients);
    const phases = useStore((s) => s.phases);

    const [dialogKey, setDialogKey] = useState(0);
    const [startOpen, setStartOpen] = useState(false);

    const [now, setNow] = useState(Date.now);
    const activeEntryId = activeEntry?.id;
    const isPaused = timerPausedAt !== null;

    useEffect(() => {
        if (!activeEntryId || isPaused) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [activeEntryId, isPaused]);

    // Threshold and estimate notifications.
    useEffect(() => {
        if (!activeEntry || !timerEstimateMs || isPaused) return;
        const elapsed = now - activeEntry.startTime - timerPausedMs;

        if (!timerNotifiedThreshold && elapsed >= timerEstimateMs * THRESHOLD) {
            markThresholdNotified();
            const remaining = timerEstimateMs - elapsed;
            fireNotification(
                "Running low on time",
                `${formatDuration(Math.max(0, remaining))} left on your estimate.`,
            );
            playBeep(660);
        }

        if (!timerNotifiedEstimate && elapsed >= timerEstimateMs) {
            markEstimateNotified();
            fireNotification(
                "Time's up",
                `You've used your full estimate of ${formatDuration(timerEstimateMs)}.`,
            );
            playBeep(880);
        }
    }, [
        now,
        activeEntry,
        timerEstimateMs,
        timerPausedMs,
        isPaused,
        timerNotifiedThreshold,
        timerNotifiedEstimate,
        markThresholdNotified,
        markEstimateNotified,
    ]);

    const openStart = () => {
        setDialogKey((k) => k + 1);
        setStartOpen(true);
    };

    if (!activeEntry) {
        return (
            <>
                <Button variant="ghost" size="sm" onClick={openStart}>
                    <TimerIcon />
                    Start timer
                </Button>
                <StartDialog
                    key={dialogKey}
                    open={startOpen}
                    onOpenChange={setStartOpen}
                />
            </>
        );
    }

    const elapsedMs =
        (isPaused ? timerPausedAt! : now) -
        activeEntry.startTime -
        timerPausedMs;

    const overBudget = timerEstimateMs !== null && elapsedMs > timerEstimateMs;

    const label = buildEntryLabel(
        activeEntry,
        tasks,
        projects,
        clients,
        phases,
    );

    return (
        <div className="flex items-center gap-1.5">
            <span
                className="max-w-40 truncate text-xs text-muted-foreground"
                title={label}
            >
                {label}
            </span>
            <span
                className={cn(
                    "tabular-nums text-xs font-medium",
                    isPaused && "text-muted-foreground/60",
                    overBudget && !isPaused && "text-amber-500",
                )}
            >
                {formatElapsed(elapsedMs)}
                {timerEstimateMs !== null && (
                    <span className="ml-1 font-normal text-muted-foreground/60">
                        / {formatDuration(timerEstimateMs)}
                    </span>
                )}
                {isPaused && " · paused"}
            </span>
            {isPaused ? (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={resumeTimer}
                    title="Resume"
                >
                    <PlayIcon />
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={pauseTimer}
                    title="Pause"
                >
                    <PauseIcon />
                </Button>
            )}
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={stopTimer}
                title="Stop and save"
            >
                <SquareIcon weight="fill" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={cancelTimer}
                title="Cancel and discard"
                className="text-muted-foreground/60 hover:text-destructive"
            >
                <XIcon />
            </Button>
        </div>
    );
};
