export interface Client {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface Project {
    id: string;
    clientId: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface Phase {
    id: string;
    projectId: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface Task {
    id: string;
    projectId: string;
    phaseId?: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

// Discriminated union tracking which level a TimeEntry is logged against.
// Always resolves to the most specific level provided.
export type TimeEntryTarget =
    | { level: "client"; clientId: string }
    | { level: "project"; clientId: string; projectId: string }
    | { level: "phase"; clientId: string; projectId: string; phaseId: string }
    | {
          level: "task";
          clientId: string;
          projectId: string;
          phaseId?: string;
          taskId: string;
      };

export interface TimeEntry {
    id: string;
    target: TimeEntryTarget;
    startTime: number; // Unix ms timestamp
    endTime: number | null; // null while timer is running
    notes?: string;
    createdAt: number;
    updatedAt: number;
}
