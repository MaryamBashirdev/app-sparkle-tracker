import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Clock } from "lucide-react";
import { useAuth, supabase } from "@/lib/auth";
import { useApplications } from "@/lib/useApplications";
import { StatCards } from "@/components/StatCards";
import { InterviewBanner } from "@/components/InterviewBanner";
import { ApplicationsTable } from "@/components/ApplicationsTable";
import { MiniCalendar } from "@/components/MiniCalendar";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AddApplicationPanel } from "@/components/AddApplicationPanel";
import { useEffect, useState } from "react";

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

// ── HR Dashboard ──────────────────────────────────────────
function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name || user?.email?.split("@")[0] || "HR";
  const [candidates, setCandidates] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", role: "", datetime: "" });
  const [interviews, setInterviews] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase se candidates fetch karo
  useEffect(() => {
    supabase
      .from("applications")
      .select("id, company, role, status, interview_time, meet_link, source_email, ai_summary")
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        if (data) setCandidates(data);
      });
  }, []);

  const handleSchedule = async () => {
    if (!form.name || !form.role || !form.datetime) return;
    setLoading(true);
    setInterviews([...interviews, form]);
    setForm({ name: "", role: "", datetime: "" });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {greeting()}, <span className="text-gradient-violet">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">HR Dashboard — Manage candidates & interviews</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Candidates Table — Supabase se */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">👥 Candidates</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left py-2 pr-4">Company</th>
                <th className="text-left py-2 pr-4">Role</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2 pr-4">Interview Time</th>
                <th className="text-left py-2">Meet Link</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No candidates yet.
                  </td>
                </tr>
              ) : (
                candidates.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{c.company}</td>
                    <td className="py-3 pr-4 text-slate-300">{c.role || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded-lg text-xs bg-violet-500/20 text-violet-300">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">
                      {c.interview_time || "—"}
                    </td>
                    <td className="py-3">
                      {c.meet_link ? (
                        
                          href={c.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-cyan-400 hover:underline"
                        >
                          🔗 Join Meet
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">No link</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Interview */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">📅 Schedule Interview</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input
            type="text"
            placeholder="Candidate name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
          <input
            type="text"
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
          <input
            type="datetime-local"
            value={form.datetime}
            onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Scheduling..." : "Schedule Interview"}
          </button>
          {saved && <p className="text-xs text-green-400">✅ Interview scheduled!</p>}
        </div>

        {interviews.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm text-slate-400 mb-2">Upcoming Interviews:</h3>
            {interviews.map((iv, i) => (
              <div key={i} className="flex gap-4 text-sm border border-white/10 rounded-xl px-4 py-2.5 bg-white/5">
                <span className="text-violet-400 font-medium">{iv.name}</span>
                <span className="text-slate-400">{iv.role}</span>
                <span className="text-slate-500 ml-auto">{new Date(iv.datetime).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Candidate Dashboard ───────────────────────────────────
function Dashboard() {
  const userRole = localStorage.getItem("userRole");
  if (userRole === "hr") return <HRDashboard />;

  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name || user?.email.split("@")[0] || "there";
  const { data: rows = [], isLoading } = useApplications();
  const [reportTime, setReportTime] = useState<string | null>(null);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("preferred_hour, preferred_minute")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          const h = data.preferred_hour;
          const m = String(data.preferred_minute).padStart(2, "0");
          const ampm = h >= 12 ? "PM" : "AM";
          const hour12 = h % 12 || 12;
          setReportTime(`${hour12}:${m} ${ampm}`);
        }
      });
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {greeting()}, <span className="text-gradient-violet">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">Welcome back to your application command center.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:inline">{dateStr}</span>
          <button className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur p-2.5 hover:bg-white/10">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#080811]" />
          </button>
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Clock className="h-4 w-4" />
            {reportTime ?? "Report Time"}
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
