import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, Calendar, TrendingUp, Settings, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout } = useAuth();
  return (
    <aside className="sidebar group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/5 bg-[#06060c]/70 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center gap-2 px-5 overflow-hidden whitespace-nowrap">
        <Sparkles className="h-5 w-5 shrink-0 text-violet-400" />
        <span className="text-gradient-violet text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">
          JobTrack
        </span>
      </div>
      <nav className="flex-1 mt-4">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`sidebar-item ${active ? "active" : ""}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {it.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-white/5 space-y-2">
        <button
          onClick={logout}
          className="sidebar-item w-full text-rose-300 hover:text-rose-200"
          title="Log out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Log out
          </span>
        </button>
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap px-3">
          <span className="pulse-dot shrink-0" />
          <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            ⚡ n8n Automated
          </span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-white/5 bg-[#06060c]/90 backdrop-blur-xl py-2 md:hidden">
      {items.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${
              active ? "text-violet-300" : "text-slate-400"
            }`}
          >
            <Icon className="h-5 w-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
