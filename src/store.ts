import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    Client,
    Phase,
    Project,
    Task,
    TimeEntry,
    TimeEntryTarget,
} from "@/types";

// ── Entity maps ─────────────────────────────────────────────────────────────

interface EntityMaps {
    clients: Record<string, Client>;
    projects: Record<string, Project>;
    phases: Record<string, Phase>;
    tasks: Record<string, Task>;
    timeEntries: Record<string, TimeEntry>;
}

// ── Timer state ──────────────────────────────────────────────────────────────

interface TimerState {
    activeEntryId: string | null;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface Actions {
    // Clients
    addClient: (name: string) => Client;
    updateClient: (id: string, patch: Partial<Pick<Client, "name">>) => void;
    removeClient: (id: string) => void;
    removeClientCascade: (id: string) => void;

    // Projects
    addProject: (clientId: string, name: string, code?: string) => Project;
    updateProject: (
        id: string,
        patch: Partial<Pick<Project, "name" | "code">>,
    ) => void;
    removeProject: (id: string) => void;
    removeProjectCascade: (id: string) => void;

    // Phases
    addPhase: (projectId: string, name: string) => Phase;
    updatePhase: (id: string, patch: Partial<Pick<Phase, "name">>) => void;
    removePhase: (id: string) => void;
    removePhaseCascade: (id: string) => void;

    // Tasks
    addTask: (projectId: string, name: string, phaseId?: string) => Task;
    updateTask: (
        id: string,
        patch: Partial<Pick<Task, "name" | "phaseId">>,
    ) => void;
    removeTask: (id: string) => void;

    // Time entries
    addTimeEntry: (
        entry: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">,
    ) => TimeEntry;
    updateTimeEntry: (
        id: string,
        patch: Partial<Pick<TimeEntry, "startTime" | "endTime" | "notes">>,
    ) => void;
    removeTimeEntry: (id: string) => void;

    // Timer controls
    startTimer: (target: TimeEntryTarget) => void;
    stopTimer: () => void;
    cancelTimer: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

type StoreState = EntityMaps & TimerState & Actions;

function now() {
    return Date.now();
}

function uid() {
    return crypto.randomUUID();
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            // ── Initial state ──────────────────────────────────────────────
            clients: {},
            projects: {},
            phases: {},
            tasks: {},
            timeEntries: {},
            activeEntryId: null,

            // ── Clients ────────────────────────────────────────────────────
            addClient(name) {
                const client: Client = {
                    id: uid(),
                    name,
                    createdAt: now(),
                    updatedAt: now(),
                };
                set((s) => ({
                    clients: { ...s.clients, [client.id]: client },
                }));
                return client;
            },
            updateClient(id, patch) {
                set((s) => {
                    const existing = s.clients[id];
                    if (!existing) return {};
                    return {
                        clients: {
                            ...s.clients,
                            [id]: { ...existing, ...patch, updatedAt: now() },
                        },
                    };
                });
            },
            removeClient(id) {
                set((s) => {
                    const clients = { ...s.clients };
                    delete clients[id];
                    return { clients };
                });
            },
            removeClientCascade(clientId) {
                set((s) => {
                    const projectIds = Object.values(s.projects)
                        .filter((p) => p.clientId === clientId)
                        .map((p) => p.id);
                    const phaseIds = Object.values(s.phases)
                        .filter((ph) => projectIds.includes(ph.projectId))
                        .map((ph) => ph.id);
                    const clients = { ...s.clients };
                    delete clients[clientId];
                    const projects = Object.fromEntries(
                        Object.entries(s.projects).filter(
                            ([, p]) => p.clientId !== clientId,
                        ),
                    );
                    const phases = Object.fromEntries(
                        Object.entries(s.phases).filter(
                            ([id]) => !phaseIds.includes(id),
                        ),
                    );
                    const tasks = Object.fromEntries(
                        Object.entries(s.tasks).filter(
                            ([, t]) => !projectIds.includes(t.projectId),
                        ),
                    );
                    return { clients, projects, phases, tasks };
                });
            },

            // ── Projects ───────────────────────────────────────────────────
            addProject(clientId, name, code) {
                const project: Project = {
                    id: uid(),
                    clientId,
                    name,
                    ...(code ? { code } : {}),
                    createdAt: now(),
                    updatedAt: now(),
                };
                set((s) => ({
                    projects: { ...s.projects, [project.id]: project },
                }));
                return project;
            },
            updateProject(id, patch) {
                set((s) => {
                    const existing = s.projects[id];
                    if (!existing) return {};
                    return {
                        projects: {
                            ...s.projects,
                            [id]: { ...existing, ...patch, updatedAt: now() },
                        },
                    };
                });
            },
            removeProject(id) {
                set((s) => {
                    const projects = { ...s.projects };
                    delete projects[id];
                    return { projects };
                });
            },
            removeProjectCascade(projectId) {
                set((s) => {
                    const phaseIds = Object.values(s.phases)
                        .filter((ph) => ph.projectId === projectId)
                        .map((ph) => ph.id);
                    const projects = { ...s.projects };
                    delete projects[projectId];
                    const phases = Object.fromEntries(
                        Object.entries(s.phases).filter(
                            ([id]) => !phaseIds.includes(id),
                        ),
                    );
                    const tasks = Object.fromEntries(
                        Object.entries(s.tasks).filter(
                            ([, t]) => t.projectId !== projectId,
                        ),
                    );
                    return { projects, phases, tasks };
                });
            },

            // ── Phases ─────────────────────────────────────────────────────
            addPhase(projectId, name) {
                const phase: Phase = {
                    id: uid(),
                    projectId,
                    name,
                    createdAt: now(),
                    updatedAt: now(),
                };
                set((s) => ({ phases: { ...s.phases, [phase.id]: phase } }));
                return phase;
            },
            updatePhase(id, patch) {
                set((s) => {
                    const existing = s.phases[id];
                    if (!existing) return {};
                    return {
                        phases: {
                            ...s.phases,
                            [id]: { ...existing, ...patch, updatedAt: now() },
                        },
                    };
                });
            },
            removePhase(id) {
                set((s) => {
                    const phases = { ...s.phases };
                    delete phases[id];
                    return { phases };
                });
            },
            removePhaseCascade(phaseId) {
                set((s) => {
                    const phases = { ...s.phases };
                    delete phases[phaseId];
                    const tasks = Object.fromEntries(
                        Object.entries(s.tasks).filter(
                            ([, t]) => t.phaseId !== phaseId,
                        ),
                    );
                    return { phases, tasks };
                });
            },

            // ── Tasks ──────────────────────────────────────────────────────
            addTask(projectId, name, phaseId) {
                const task: Task = {
                    id: uid(),
                    projectId,
                    name,
                    ...(phaseId ? { phaseId } : {}),
                    createdAt: now(),
                    updatedAt: now(),
                };
                set((s) => ({ tasks: { ...s.tasks, [task.id]: task } }));
                return task;
            },
            updateTask(id, patch) {
                set((s) => {
                    const existing = s.tasks[id];
                    if (!existing) return {};
                    return {
                        tasks: {
                            ...s.tasks,
                            [id]: { ...existing, ...patch, updatedAt: now() },
                        },
                    };
                });
            },
            removeTask(id) {
                set((s) => {
                    const tasks = { ...s.tasks };
                    delete tasks[id];
                    return { tasks };
                });
            },

            // ── Time entries ───────────────────────────────────────────────
            addTimeEntry(entry) {
                const te: TimeEntry = {
                    ...entry,
                    id: uid(),
                    createdAt: now(),
                    updatedAt: now(),
                };
                set((s) => ({
                    timeEntries: { ...s.timeEntries, [te.id]: te },
                }));
                return te;
            },
            updateTimeEntry(id, patch) {
                set((s) => {
                    const existing = s.timeEntries[id];
                    if (!existing) return {};
                    return {
                        timeEntries: {
                            ...s.timeEntries,
                            [id]: { ...existing, ...patch, updatedAt: now() },
                        },
                    };
                });
            },
            removeTimeEntry(id) {
                set((s) => {
                    const timeEntries = { ...s.timeEntries };
                    delete timeEntries[id];
                    return { timeEntries };
                });
            },

            // ── Timer ──────────────────────────────────────────────────────
            startTimer(target) {
                // Stop any running timer first
                get().stopTimer();
                const entry = get().addTimeEntry({
                    target,
                    startTime: now(),
                    endTime: null,
                });
                set({ activeEntryId: entry.id });
            },
            stopTimer() {
                const { activeEntryId } = get();
                if (!activeEntryId) return;
                get().updateTimeEntry(activeEntryId, { endTime: now() });
                set({ activeEntryId: null });
            },
            cancelTimer() {
                const { activeEntryId } = get();
                if (!activeEntryId) return;
                get().removeTimeEntry(activeEntryId);
                set({ activeEntryId: null });
            },
        }),
        { name: "sheet-logger" },
    ),
);

// ── Derived selectors ────────────────────────────────────────────────────────

export const selectClients = (s: StoreState) => Object.values(s.clients);
export const selectProjects = (s: StoreState) => Object.values(s.projects);
export const selectPhases = (s: StoreState) => Object.values(s.phases);
export const selectTasks = (s: StoreState) => Object.values(s.tasks);
export const selectTimeEntries = (s: StoreState) =>
    Object.values(s.timeEntries);

export const selectProjectsByClient = (clientId: string) => (s: StoreState) =>
    Object.values(s.projects).filter((p) => p.clientId === clientId);

export const selectPhasesByProject = (projectId: string) => (s: StoreState) =>
    Object.values(s.phases).filter((p) => p.projectId === projectId);

export const selectTasksByProject = (projectId: string) => (s: StoreState) =>
    Object.values(s.tasks).filter((t) => t.projectId === projectId);

export const selectActiveEntry = (s: StoreState) =>
    s.activeEntryId ? (s.timeEntries[s.activeEntryId] ?? null) : null;
