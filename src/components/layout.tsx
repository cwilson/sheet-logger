import { NavLink, Outlet } from "react-router-dom";
import { Sun, CalendarBlank, Gear } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { TimerWidget } from "@/components/timer-widget";

const navItems = [
    { to: "/", label: "Day", icon: Sun, end: true },
    { to: "/week", label: "Week", icon: CalendarBlank, end: false },
    { to: "/config", label: "Config", icon: Gear, end: false },
];

export const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <nav className="flex items-center gap-1 px-4 h-12">
                    <span className="text-sm font-semibold text-primary mr-4 tracking-tight">
                        Sheet Logger
                    </span>
                    {navItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                )
                            }
                        >
                            <Icon size={15} weight="bold" />
                            {label}
                        </NavLink>
                    ))}
                    <div className="ml-auto">
                        <TimerWidget />
                    </div>
                </nav>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            {/* Timer widget — placeholder until Timer feature is built */}
            <div className="fixed bottom-4 right-4" id="timer-widget-root" />
        </div>
    );
};
