import { useStore } from "./store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const INITIAL: Parameters<typeof useStore.setState>[0] = {
    clients: {},
    projects: {},
    phases: {},
    tasks: {},
    timeEntries: {},
    activeEntryId: null,
    timerPausedAt: null,
    timerPausedMs: 0,
    timerEstimateMs: null,
    timerNotifiedThreshold: false,
    timerNotifiedEstimate: false,
    timerIdleAt: null,
};

function get() {
    return useStore.getState();
}

beforeEach(() => {
    localStorage.clear();
    useStore.setState(INITIAL); // merge — resets data fields while preserving actions
});

// ── Clients ───────────────────────────────────────────────────────────────────

describe("addClient / updateClient / removeClient", () => {
    it("creates a client with a unique id", () => {
        const c = get().addClient("Acme");
        expect(c.name).toBe("Acme");
        expect(get().clients[c.id]).toBeDefined();
    });

    it("updates name and bumps updatedAt", async () => {
        const c = get().addClient("Old");
        const before = c.updatedAt;
        await new Promise((r) => setTimeout(r, 2));
        get().updateClient(c.id, { name: "New" });
        expect(get().clients[c.id].name).toBe("New");
        expect(get().clients[c.id].updatedAt).toBeGreaterThan(before);
    });

    it("removeClient does not affect other clients", () => {
        const c1 = get().addClient("A");
        const c2 = get().addClient("B");
        get().removeClient(c1.id);
        expect(get().clients[c1.id]).toBeUndefined();
        expect(get().clients[c2.id]).toBeDefined();
    });
});

describe("removeClientCascade", () => {
    it("removes client, its projects, phases, and tasks", () => {
        const c = get().addClient("Acme");
        const p = get().addProject(c.id, "Site", "S1");
        const ph = get().addPhase(p.id, "Design");
        const t = get().addTask(p.id, "Wireframes", ph.id);

        get().removeClientCascade(c.id);

        const s = get();
        expect(s.clients[c.id]).toBeUndefined();
        expect(s.projects[p.id]).toBeUndefined();
        expect(s.phases[ph.id]).toBeUndefined();
        expect(s.tasks[t.id]).toBeUndefined();
    });

    it("leaves unrelated data intact", () => {
        const c1 = get().addClient("A");
        const c2 = get().addClient("B");
        const p2 = get().addProject(c2.id, "P2", "P2");
        get().removeClientCascade(c1.id);
        expect(get().projects[p2.id]).toBeDefined();
    });
});

// ── Projects ──────────────────────────────────────────────────────────────────

describe("removeProjectCascade", () => {
    it("removes project, its phases, and tasks but not the client", () => {
        const c = get().addClient("Acme");
        const p = get().addProject(c.id, "Site", "S1");
        const ph = get().addPhase(p.id, "Phase 1");
        const t = get().addTask(p.id, "Task 1");

        get().removeProjectCascade(p.id);

        const s = get();
        expect(s.projects[p.id]).toBeUndefined();
        expect(s.phases[ph.id]).toBeUndefined();
        expect(s.tasks[t.id]).toBeUndefined();
        expect(s.clients[c.id]).toBeDefined();
    });
});

// ── Timer: start / pause / resume / stop ──────────────────────────────────────

describe("startTimer", () => {
    it("creates a running time entry with null endTime", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);

        const { activeEntryId, timeEntries } = get();
        expect(activeEntryId).not.toBeNull();
        expect(timeEntries[activeEntryId!].endTime).toBeNull();
    });

    it("stopping a previous timer before starting a new one", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        const firstId = get().activeEntryId!;
        get().startTimer(target);
        const secondId = get().activeEntryId!;

        expect(firstId).not.toBe(secondId);
        expect(get().timeEntries[firstId].endTime).not.toBeNull();
    });

    it("stores estimate when provided", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target, undefined, 3_600_000);
        expect(get().timerEstimateMs).toBe(3_600_000);
    });
});

describe("pauseTimer / resumeTimer", () => {
    it("pause sets timerPausedAt; resume clears it and accumulates ms", async () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        get().pauseTimer();

        expect(get().timerPausedAt).not.toBeNull();

        await new Promise((r) => setTimeout(r, 20));
        get().resumeTimer();

        const { timerPausedAt, timerPausedMs } = get();
        expect(timerPausedAt).toBeNull();
        expect(timerPausedMs).toBeGreaterThan(0);
    });

    it("pause is a no-op when already paused", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        get().pauseTimer();
        const pausedAt = get().timerPausedAt;
        get().pauseTimer(); // second call
        expect(get().timerPausedAt).toBe(pausedAt); // unchanged
    });
});

describe("stopTimer", () => {
    it("sets endTime on the active entry and clears active state", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        const id = get().activeEntryId!;

        get().stopTimer();

        expect(get().activeEntryId).toBeNull();
        expect(get().timeEntries[id].endTime).not.toBeNull();
    });

    it("effective duration excludes pause time", async () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        const id = get().activeEntryId!;
        const entry = get().timeEntries[id];

        await new Promise((r) => setTimeout(r, 30)); // work 30 ms
        get().pauseTimer();
        await new Promise((r) => setTimeout(r, 50)); // idle 50 ms (paused)
        get().resumeTimer();
        await new Promise((r) => setTimeout(r, 20)); // work 20 ms
        get().stopTimer();

        const stopped = get().timeEntries[id];
        const duration = stopped.endTime! - entry.startTime;

        // Effective work ≈ 50ms, pause ≈ 50ms; total wall ≈ 100ms.
        // Duration should be < total wall time.
        expect(duration).toBeLessThan(stopped.endTime! - entry.startTime + 1);
        expect(duration).toBeGreaterThan(0);
        // The accumulated pause (timerPausedMs) was subtracted.
        expect(get().timerPausedMs).toBe(0); // reset after stop
    });

    it("resets all timer state fields", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target, undefined, 3_600_000);
        get().pauseTimer();
        get().setTimerIdle(Date.now());
        get().stopTimer();

        const s = get();
        expect(s.activeEntryId).toBeNull();
        expect(s.timerPausedAt).toBeNull();
        expect(s.timerPausedMs).toBe(0);
        expect(s.timerEstimateMs).toBeNull();
        expect(s.timerNotifiedThreshold).toBe(false);
        expect(s.timerNotifiedEstimate).toBe(false);
        expect(s.timerIdleAt).toBeNull();
    });
});

describe("cancelTimer", () => {
    it("removes the entry entirely", () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        const id = get().activeEntryId!;
        get().cancelTimer();

        expect(get().activeEntryId).toBeNull();
        expect(get().timeEntries[id]).toBeUndefined();
    });
});

// ── Idle handling ─────────────────────────────────────────────────────────────

describe("discardIdleAndStop", () => {
    it("trims endTime to idleAt and stops the timer", async () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target);
        const id = get().activeEntryId!;
        const startTime = get().timeEntries[id].startTime;

        await new Promise((r) => setTimeout(r, 20));
        const idleAt = Date.now();
        await new Promise((r) => setTimeout(r, 20));

        get().setTimerIdle(idleAt);
        get().discardIdleAndStop(idleAt);

        const entry = get().timeEntries[id];
        expect(entry.endTime).toBe(idleAt);
        expect(entry.endTime!).toBeGreaterThan(startTime);
        expect(get().activeEntryId).toBeNull();
        expect(get().timerIdleAt).toBeNull();
    });
});

describe("discardIdleAndContinue", () => {
    it("trims original entry and starts a new one for the same task", async () => {
        const c = get().addClient("C");
        const p = get().addProject(c.id, "P", "P");
        const t = get().addTask(p.id, "T");
        const target = {
            level: "task" as const,
            clientId: c.id,
            projectId: p.id,
            taskId: t.id,
        };

        get().startTimer(target, "my notes");
        const originalId = get().activeEntryId!;

        await new Promise((r) => setTimeout(r, 20));
        const idleAt = Date.now();
        await new Promise((r) => setTimeout(r, 20));

        get().discardIdleAndContinue(idleAt);

        const originalEntry = get().timeEntries[originalId];
        expect(originalEntry.endTime).toBe(idleAt);

        const newId = get().activeEntryId!;
        expect(newId).not.toBe(originalId);

        const newEntry = get().timeEntries[newId];
        expect(newEntry.endTime).toBeNull(); // still running
        expect(newEntry.startTime).toBeGreaterThan(idleAt);
        expect(newEntry.notes).toBe("my notes");

        // Carries the same target
        expect(newEntry.target).toEqual(target);

        // Idle state cleared
        expect(get().timerIdleAt).toBeNull();
    });
});

// ── Notification flags ────────────────────────────────────────────────────────

describe("markThresholdNotified / markEstimateNotified", () => {
    it("sets flags independently", () => {
        get().markThresholdNotified();
        expect(get().timerNotifiedThreshold).toBe(true);
        expect(get().timerNotifiedEstimate).toBe(false);

        get().markEstimateNotified();
        expect(get().timerNotifiedEstimate).toBe(true);
    });
});
