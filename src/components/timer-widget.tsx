import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
    ArrowSquareOutIcon,
    ArrowSquareInIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TimeEntryTarget } from "@/types";

// ─── Document PiP type declaration ───────────────────────────────────────────

declare global {
    interface Window {
        documentPictureInPicture?: {
            requestWindow(options?: {
                width?: number;
                height?: number;
            }): Promise<Window & typeof globalThis>;
        };
    }
}

// ─── Style cloning helper ─────────────────────────────────────────────────────

function cloneStylesTo(target: Document) {
    target.documentElement.className = document.documentElement.className;
    document.querySelectorAll("style").forEach((s) => {
        const clone = target.createElement("style");
        clone.textContent = s.textContent;
        target.head.appendChild(clone);
    });
    document
        .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
        .forEach((l) => {
            const clone = target.createElement("link");
            clone.rel = "stylesheet";
            clone.href = l.href;
            target.head.appendChild(clone);
        });
    target.body.style.margin = "0";
    target.body.style.padding = "0";
}

// ─── Popout Timer ─────────────────────────────────────────────────────────────

const PopoutTimer = ({ onDock }: { onDock: () => void }) => {
    const activeEntry = useStore(selectActiveEntry);
    const timerPausedAt = useStore((s) => s.timerPausedAt);
    const timerPausedMs = useStore((s) => s.timerPausedMs);
    const timerEstimateMs = useStore((s) => s.timerEstimateMs);
    const pauseTimer = useStore((s) => s.pauseTimer);
    const resumeTimer = useStore((s) => s.resumeTimer);
    const stopTimer = useStore((s) => s.stopTimer);
    const cancelTimer = useStore((s) => s.cancelTimer);
    const tasks = useStore((s) => s.tasks);
    const projects = useStore((s) => s.projects);
    const clients = useStore((s) => s.clients);
    const phases = useStore((s) => s.phases);

    const [now, setNow] = useState(Date.now);
    const activeEntryId = activeEntry?.id;
    const isPaused = timerPausedAt !== null;

    useEffect(() => {
        if (!activeEntryId || isPaused) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [activeEntryId, isPaused]);

    if (!activeEntry) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background p-4">
                <p className="text-xs text-muted-foreground">
                    No active timer.
                </p>
                <Button variant="outline" size="sm" onClick={onDock}>
                    <ArrowSquareInIcon />
                    Dock
                </Button>
            </div>
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
        <div className="flex h-screen flex-col justify-center gap-1.5 bg-background px-3 py-2">
            <div className="flex min-w-0 items-center gap-1">
                <span
                    className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                    title={label}
                >
                    {label}
                </span>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onDock}
                    title="Dock"
                >
                    <ArrowSquareInIcon />
                </Button>
            </div>
            <div className="flex items-center gap-1">
                <span
                    className={cn(
                        "flex-1 font-mono text-xl font-semibold tabular-nums",
                        isPaused && "text-muted-foreground",
                        overBudget && !isPaused && "text-amber-500",
                    )}
                >
                    {formatElapsed(elapsedMs)}
                    {timerEstimateMs !== null && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground/60">
                            / {formatDuration(timerEstimateMs)}
                        </span>
                    )}
                    {isPaused && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground/60">
                            · paused
                        </span>
                    )}
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
        </div>
    );
};

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
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

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

    // Listen for pip window being closed by the user.
    useEffect(() => {
        if (!pipWindow) return;
        const handleClose = () => setPipWindow(null);
        pipWindow.addEventListener("pagehide", handleClose);
        return () => pipWindow.removeEventListener("pagehide", handleClose);
    }, [pipWindow]);

    const openStart = () => {
        setDialogKey((k) => k + 1);
        setStartOpen(true);
    };

    const openPopout = async () => {
        if (window.documentPictureInPicture) {
            try {
                const pw = await window.documentPictureInPicture.requestWindow({
                    width: 320,
                    height: 100,
                });
                cloneStylesTo(pw.document);
                setPipWindow(pw);
                return;
            } catch {
                // user dismissed or API error — fall through to popup
            }
        }
        const pw = window.open(
            "",
            "timer-popout",
            "width=340,height=110,resizable=yes,menubar=no,toolbar=no,location=no,status=no",
        );
        if (pw) {
            pw.document.title = "Timer";
            cloneStylesTo(pw.document);
            setPipWindow(pw);
        }
    };

    const handleDock = () => {
        if (pipWindow && !pipWindow.closed) pipWindow.close();
        setPipWindow(null);
    };

    const pipPortal =
        pipWindow && !pipWindow.closed
            ? createPortal(
                  <PopoutTimer onDock={handleDock} />,
                  pipWindow.document.body,
              )
            : null;

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
                {pipPortal}
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

    // When popped out, show a compact indicator in the nav.
    if (pipWindow && !pipWindow.closed) {
        return (
            <>
                <div className="flex items-center gap-1.5">
                    <TimerIcon
                        size={14}
                        className="shrink-0 text-primary"
                        aria-hidden
                    />
                    <span
                        className={cn(
                            "tabular-nums text-xs font-medium",
                            isPaused && "text-muted-foreground/60",
                            overBudget && !isPaused && "text-amber-500",
                        )}
                    >
                        {formatElapsed(elapsedMs)}
                        {isPaused && " · paused"}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDock}
                        title="Dock timer"
                    >
                        <ArrowSquareInIcon />
                    </Button>
                </div>
                {pipPortal}
            </>
        );
    }

    return (
        <>
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
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={openPopout}
                    title="Pop out"
                >
                    <ArrowSquareOutIcon />
                </Button>
            </div>
            {pipPortal}
        </>
    );
};
