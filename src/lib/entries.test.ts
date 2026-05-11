import { buildEntryLabel } from "./entries";
import type { TimeEntry, Client, Project, Phase, Task } from "@/types";

const client: Client = {
    id: "c1",
    name: "Acme",
    createdAt: 0,
    updatedAt: 0,
};
const project: Project = {
    id: "p1",
    clientId: "c1",
    name: "Website",
    code: "WEB",
    createdAt: 0,
    updatedAt: 0,
};
const phase: Phase = {
    id: "ph1",
    projectId: "p1",
    name: "Design",
    createdAt: 0,
    updatedAt: 0,
};
const task: Task = {
    id: "t1",
    projectId: "p1",
    name: "Wireframes",
    createdAt: 0,
    updatedAt: 0,
};

const clients = { c1: client };
const projects = { p1: project };
const phases = { ph1: phase };
const tasks = { t1: task };

function makeEntry(target: TimeEntry["target"]): TimeEntry {
    return {
        id: "e1",
        target,
        startTime: 0,
        endTime: null,
        createdAt: 0,
        updatedAt: 0,
    };
}

describe("buildEntryLabel", () => {
    it("full task path includes client › project › task", () => {
        const entry = makeEntry({
            level: "task",
            clientId: "c1",
            projectId: "p1",
            taskId: "t1",
        });
        expect(buildEntryLabel(entry, tasks, projects, clients, phases)).toBe(
            "Acme › Website › Wireframes",
        );
    });

    it("task with phase includes phase segment", () => {
        const entry = makeEntry({
            level: "task",
            clientId: "c1",
            projectId: "p1",
            phaseId: "ph1",
            taskId: "t1",
        });
        expect(buildEntryLabel(entry, tasks, projects, clients, phases)).toBe(
            "Acme › Website › Design › Wireframes",
        );
    });

    it("project-level entry omits phase and task", () => {
        const entry = makeEntry({
            level: "project",
            clientId: "c1",
            projectId: "p1",
        });
        expect(buildEntryLabel(entry, tasks, projects, clients, phases)).toBe(
            "Acme › Website",
        );
    });

    it("client-level entry shows only client", () => {
        const entry = makeEntry({ level: "client", clientId: "c1" });
        expect(buildEntryLabel(entry, tasks, projects, clients, phases)).toBe(
            "Acme",
        );
    });

    it('returns "Unknown" when all lookups miss', () => {
        const entry = makeEntry({
            level: "task",
            clientId: "missing",
            projectId: "missing",
            taskId: "missing",
        });
        expect(buildEntryLabel(entry, tasks, projects, clients, phases)).toBe(
            "Unknown",
        );
    });

    it("skips missing intermediate segments gracefully", () => {
        const entry = makeEntry({
            level: "task",
            clientId: "c1",
            projectId: "missing",
            taskId: "t1",
        });
        // client and task resolve; project is missing → omitted
        const label = buildEntryLabel(entry, tasks, projects, clients, phases);
        expect(label).toContain("Acme");
        expect(label).toContain("Wireframes");
        expect(label).not.toContain("Website");
    });
});
