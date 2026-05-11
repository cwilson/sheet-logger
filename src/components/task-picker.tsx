import { useState } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/shallow";
import { selectTasks } from "@/store";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TaskOption {
    taskId: string;
    label: string;
    clientId: string;
    projectId: string;
    phaseId?: string;
}

interface TaskPickerProps {
    value: string;
    onChange: (
        taskId: string,
        clientId: string,
        projectId: string,
        phaseId?: string,
    ) => void;
    placeholder?: string;
    className?: string;
}

export const TaskPicker = ({
    value,
    onChange,
    placeholder = "Select task…",
    className,
}: TaskPickerProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const tasks = useStore(useShallow(selectTasks));
    const projects = useStore((s) => s.projects);
    const clients = useStore((s) => s.clients);
    const phases = useStore((s) => s.phases);

    const options: TaskOption[] = tasks.map((task) => {
        const project = projects[task.projectId];
        const client = project ? clients[project.clientId] : undefined;
        const phase = task.phaseId ? phases[task.phaseId] : undefined;
        const parts = [
            client?.name ?? "?",
            project?.name ?? "?",
            ...(phase ? [phase.name] : []),
            task.name,
        ];
        return {
            taskId: task.id,
            label: parts.join(" › "),
            clientId: project?.clientId ?? "",
            projectId: task.projectId,
            phaseId: task.phaseId,
        };
    });

    const filtered = search
        ? options.filter((o) =>
              o.label.toLowerCase().includes(search.toLowerCase()),
          )
        : options;

    const selected = options.find((o) => o.taskId === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-between font-normal",
                        !selected && "text-muted-foreground",
                        className,
                    )}
                >
                    <span className="truncate">
                        {selected?.label ?? placeholder}
                    </span>
                    <CaretDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search tasks…"
                    />
                    <CommandList>
                        {options.length === 0 ? (
                            <CommandEmpty>
                                No tasks. Add tasks in Config first.
                            </CommandEmpty>
                        ) : filtered.length === 0 ? (
                            <CommandEmpty>No matching tasks.</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filtered.map((opt) => (
                                    <CommandItem
                                        key={opt.taskId}
                                        value={opt.taskId}
                                        data-checked={opt.taskId === value}
                                        onSelect={() => {
                                            onChange(
                                                opt.taskId,
                                                opt.clientId,
                                                opt.projectId,
                                                opt.phaseId,
                                            );
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        {opt.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
