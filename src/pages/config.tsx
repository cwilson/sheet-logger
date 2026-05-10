import { useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandInput,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    useStore,
    selectClients,
    selectProjects,
    selectPhases,
    selectTasks,
} from "@/store";
import { cn } from "@/lib/utils";
import { CaretUpDown, Plus, Trash } from "@phosphor-icons/react";
import type { Client, Phase, Project, Task } from "@/types";

// ── Grid columns ──────────────────────────────────────────────────────────────

const COLS = "grid grid-cols-[140px_72px_200px_150px_1fr_32px]";

// ── Entity combobox ───────────────────────────────────────────────────────────

interface ComboOption {
    id: string;
    label: string;
    sublabel?: string;
}

function EntityCombobox({
    value,
    onChange,
    onCreate,
    options,
    placeholder,
    disabled = false,
}: {
    value: string | null;
    onChange: (id: string) => void;
    onCreate?: (name: string) => string;
    options: ComboOption[];
    placeholder: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = options.find((o) => o.id === value);
    const filtered = query
        ? options.filter(
              (o) =>
                  o.label.toLowerCase().includes(query.toLowerCase()) ||
                  o.sublabel?.toLowerCase().includes(query.toLowerCase()),
          )
        : options;

    const close = () => {
        setOpen(false);
        setQuery("");
    };

    const pick = (id: string) => {
        onChange(id);
        close();
    };

    const create = () => {
        if (!onCreate || !query.trim()) return;
        pick(onCreate(query.trim()));
    };

    return (
        <Popover
            open={open}
            onOpenChange={(o) => (o ? setOpen(true) : close())}
        >
            <PopoverTrigger asChild>
                <button
                    disabled={disabled}
                    className={cn(
                        "flex h-full w-full items-center gap-1 px-2 text-left transition-colors",
                        disabled
                            ? "cursor-not-allowed opacity-40"
                            : "hover:bg-accent/60",
                    )}
                >
                    <span className="flex-1 truncate text-xs">
                        {selected?.label ?? (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}
                    </span>
                    <CaretUpDown
                        size={10}
                        className="shrink-0 text-muted-foreground"
                    />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" sideOffset={0}>
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search…"
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {filtered.length === 0 &&
                            !(onCreate && query.trim()) && (
                                <CommandEmpty>No results.</CommandEmpty>
                            )}
                        {filtered.length > 0 && (
                            <CommandGroup>
                                {filtered.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.id}
                                        data-checked={item.id === value}
                                        onSelect={() => pick(item.id)}
                                    >
                                        <span className="flex-1 truncate">
                                            {item.label}
                                        </span>
                                        {item.sublabel && (
                                            <span className="text-muted-foreground font-mono">
                                                {item.sublabel}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {onCreate && query.trim() && (
                            <>
                                {filtered.length > 0 && <CommandSeparator />}
                                <CommandGroup>
                                    <CommandItem
                                        value={`__create__`}
                                        onSelect={create}
                                    >
                                        <Plus size={11} />
                                        Create &ldquo;{query}&rdquo;
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ── Project field: combobox + [+] popover ─────────────────────────────────────

function ProjectField({
    clientId,
    value,
    onChange,
}: {
    clientId: string | null;
    value: string | null;
    onChange: (id: string) => void;
}) {
    const allProjects = useStore(useShallow(selectProjects));
    const addProject = useStore((s) => s.addProject);
    const [popOpen, setPopOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const nameRef = useRef<HTMLInputElement>(null);

    const projects = clientId
        ? allProjects.filter((p) => p.clientId === clientId)
        : [];

    const options: ComboOption[] = projects.map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: p.code,
    }));

    const openPop = (o: boolean) => {
        setPopOpen(o);
        if (o) setTimeout(() => nameRef.current?.focus(), 0);
        else {
            setNewName("");
            setNewCode("");
        }
    };

    const create = () => {
        if (!clientId || !newName.trim()) return;
        const project = addProject(
            clientId,
            newName.trim(),
            newCode.trim() || undefined,
        );
        onChange(project.id);
        openPop(false);
    };

    return (
        <div className="flex h-full items-center">
            <div className="flex-1 h-full min-w-0">
                <EntityCombobox
                    value={value}
                    onChange={onChange}
                    options={options}
                    placeholder="Project"
                    disabled={!clientId}
                />
            </div>
            <Popover open={popOpen} onOpenChange={openPop}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={!clientId}
                        className="shrink-0 mr-0.5"
                        title="New project"
                    >
                        <Plus size={11} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3" align="end">
                    <p className="text-xs font-medium mb-2">New project</p>
                    <div className="flex flex-col gap-1.5">
                        <Input
                            ref={nameRef}
                            placeholder="Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="h-7"
                        />
                        <Input
                            placeholder="Code (optional)"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") create();
                            }}
                            className="h-7"
                        />
                        <Button
                            size="sm"
                            className="mt-0.5"
                            onClick={create}
                            disabled={!newName.trim()}
                        >
                            Create
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ── Filled task row ───────────────────────────────────────────────────────────

function FilledRow({
    task,
    project,
    client,
    phase,
}: {
    task: Task;
    project: Project;
    client: Client;
    phase: Phase | undefined;
}) {
    const removeTask = useStore((s) => s.removeTask);

    return (
        <div
            className={cn(
                COLS,
                "group/row h-9 border-b last:border-b-0 divide-x divide-border items-center",
            )}
        >
            <div className="flex items-center h-full px-2 truncate">
                <span className="text-xs truncate">{client.name}</span>
            </div>
            <div className="flex items-center h-full px-2">
                <span className="text-xs font-mono text-muted-foreground truncate">
                    {project.code ?? ""}
                </span>
            </div>
            <div className="flex items-center h-full px-2 truncate">
                <span className="text-xs truncate">{project.name}</span>
            </div>
            <div className="flex items-center h-full px-2 truncate">
                <span className="text-xs text-muted-foreground truncate">
                    {phase?.name ?? "—"}
                </span>
            </div>
            <div className="flex items-center h-full px-2 truncate">
                <span className="text-xs truncate">{task.name}</span>
            </div>
            <div className="flex items-center justify-center h-full">
                <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => removeTask(task.id)}
                >
                    <Trash size={12} />
                </Button>
            </div>
        </div>
    );
}

// ── Empty add row ─────────────────────────────────────────────────────────────

function EmptyRow() {
    const clients = useStore(useShallow(selectClients));
    const allPhases = useStore(useShallow(selectPhases));
    const allProjects = useStore(useShallow(selectProjects));
    const addClient = useStore((s) => s.addClient);
    const addPhase = useStore((s) => s.addPhase);
    const addTask = useStore((s) => s.addTask);

    const [clientId, setClientId] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [phaseId, setPhaseId] = useState<string | null>(null);
    const [taskName, setTaskName] = useState("");

    const project = projectId
        ? allProjects.find((p) => p.id === projectId)
        : null;

    const clientOptions: ComboOption[] = clients.map((c) => ({
        id: c.id,
        label: c.name,
    }));

    const phaseOptions: ComboOption[] = allPhases
        .filter((ph) => ph.projectId === projectId)
        .map((ph) => ({ id: ph.id, label: ph.name }));

    const handleClientChange = (id: string) => {
        setClientId(id);
        setProjectId(null);
        setPhaseId(null);
    };

    const handleProjectChange = (id: string) => {
        setProjectId(id);
        setPhaseId(null);
    };

    const handleCreateClient = (name: string): string => {
        const client = addClient(name);
        return client.id;
    };

    const handleCreatePhase = (name: string): string => {
        if (!projectId) return "";
        const phase = addPhase(projectId, name);
        return phase.id;
    };

    const commit = () => {
        if (!projectId || !taskName.trim()) return;
        addTask(projectId, taskName.trim(), phaseId ?? undefined);
        setClientId(null);
        setProjectId(null);
        setPhaseId(null);
        setTaskName("");
    };

    return (
        <div
            className={cn(
                COLS,
                "h-9 divide-x divide-border bg-muted/30 items-stretch",
            )}
        >
            <div className="h-full">
                <EntityCombobox
                    value={clientId}
                    onChange={handleClientChange}
                    onCreate={handleCreateClient}
                    options={clientOptions}
                    placeholder="Client"
                />
            </div>
            <div className="flex items-center px-2 h-full">
                <span className="text-xs font-mono text-muted-foreground truncate">
                    {project?.code ?? ""}
                </span>
            </div>
            <div className="h-full">
                <ProjectField
                    clientId={clientId}
                    value={projectId}
                    onChange={handleProjectChange}
                />
            </div>
            <div className="h-full">
                <EntityCombobox
                    value={phaseId}
                    onChange={(id) => setPhaseId(id)}
                    onCreate={handleCreatePhase}
                    options={phaseOptions}
                    placeholder="Phase"
                    disabled={!projectId}
                />
            </div>
            <div className="flex items-center px-2 h-full">
                <input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                    }}
                    placeholder={
                        projectId ? "Task name… ↵ to add" : "Task name…"
                    }
                    disabled={!projectId}
                    className={cn(
                        "w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground",
                        !projectId && "cursor-not-allowed opacity-40",
                    )}
                />
            </div>
            <div />
        </div>
    );
}

// ── Config page ───────────────────────────────────────────────────────────────

type TaskRow = {
    task: Task;
    project: Project;
    client: Client;
    phase: Phase | undefined;
};

export const Config = () => {
    const clients = useStore(useShallow(selectClients));
    const projects = useStore(useShallow(selectProjects));
    const phases = useStore(useShallow(selectPhases));
    const tasks = useStore(useShallow(selectTasks));

    const taskRows: TaskRow[] = tasks
        .map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const client = project
                ? clients.find((c) => c.id === project.clientId)
                : undefined;
            const phase = task.phaseId
                ? phases.find((ph) => ph.id === task.phaseId)
                : undefined;
            return project && client ? { task, project, client, phase } : null;
        })
        .filter((r): r is TaskRow => r !== null);

    return (
        <div className="p-6">
            <h1 className="text-sm font-semibold mb-4">Config</h1>

            <div className="border border-border overflow-x-auto">
                {/* Header */}
                <div
                    className={cn(
                        COLS,
                        "h-8 border-b bg-muted/50 divide-x divide-border items-center",
                    )}
                >
                    {["Client", "Code", "Project", "Phase", "Task", ""].map(
                        (col) => (
                            <div key={col} className="px-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {col}
                                </span>
                            </div>
                        ),
                    )}
                </div>

                {/* Filled rows */}
                {taskRows.map((row) => (
                    <FilledRow key={row.task.id} {...row} />
                ))}

                {/* Single empty add row */}
                <EmptyRow />
            </div>
        </div>
    );
};
