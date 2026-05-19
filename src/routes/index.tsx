import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useApplications } from "@/lib/useApplications";
import { StatCards } from "@/components/StatCards";
import { InterviewBanner } from "@/components/InterviewBanner";
import { ApplicationsTable } from "@/components/ApplicationsTable";
import { MiniCalendar } from "@/components/MiniCalendar";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AddApplicationPanel } from "@/components/AddApplicationPanel";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — JobTrack" },
      { name: "description", content: "Track your job applications with live Google Sheets sync." },
    ],
  }),
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { data: rows = [], isLoading } = useApplications();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {greeting()}, <span className="text-gradient-violet">Maryam</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">Welcome back to your application command center.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:inline">{dateStr}</span>
          <button className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur p-2.5 hover:bg-white/10">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#080810]" />
          </button>
          <AddApplicationPanel />
        </div>
      </div>

      <StatCards rows={rows} />
      <InterviewBanner rows={rows} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-6">
        <ApplicationsTable rows={rows} />
        <div className="space-y-6">
          <MiniCalendar rows={rows} />
          <ActivityFeed rows={rows} />
        </div>
      </div>

      {isLoading && <p className="text-center text-xs text-slate-500">Syncing with Google Sheets...</p>}
    </div>
  );
}
