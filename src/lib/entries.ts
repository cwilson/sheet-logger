import type { Client, Phase, Project, Task, TimeEntry } from "@/types";

export function buildEntryLabel(
    entry: TimeEntry,
    tasks: Record<string, Task>,
    projects: Record<string, Project>,
    clients: Record<string, Client>,
    phases: Record<string, Phase>,
): string {
    const t = entry.target;
    const parts: (string | undefined)[] = [];
    if ("clientId" in t) parts.push(clients[t.clientId]?.name);
    if ("projectId" in t) parts.push(projects[t.projectId]?.name);
    if ("phaseId" in t && t.phaseId) parts.push(phases[t.phaseId]?.name);
    if ("taskId" in t) parts.push(tasks[t.taskId]?.name);
    return parts.filter(Boolean).join(" › ") || "Unknown";
}
