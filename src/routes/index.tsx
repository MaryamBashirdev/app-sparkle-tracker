import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Clock, Plus, X, ChevronDown, Calendar, Activity, BarChart2, Briefcase } from "lucide-react";
import { useAuth, supabase } from "@/lib/auth";
import { useApplications } from "@/lib/useApplications";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────
export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — JobTrack" },
      { name: "description", content: "Track your job applications with live Google Sheets sync." },
    ],
  }),
});

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ─────────────────────────────────────────────
// StatCards
// ─────────────────────────────────────────────
function StatCards({ rows }: { rows: any[] }) {
  const total = rows.length;
  const interviews = rows.filter((r) => r.status === "INTERVIEW").length;
  const offers = rows.filter((r) => r.status === "OFFER").length;
  const rejected = rows.filter((r) => r.status === "REJECTED").length;

  const stats = [
    { label: "Total Applied", value: total, icon: Briefcase, color: "from-violet-600 to-fuchsia-600" },
    { label: "Interviews", value: interviews, icon: Calendar, color: "from-cyan-500 to-blue-600" },
    { label: "Offers", value: offers, icon: BarChart2, color: "from-emerald-500 to-teal-600" },
    { label: "Rejected", value: rejected, icon: X, color: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
          <div className={`rounded-xl bg-gradient-to-br ${color} p-3`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// InterviewBanner
// ─────────────────────────────────────────────
function InterviewBanner({ rows }: { rows: any[] }) {
  const upcoming = rows.filter(
    (r) => r.status === "INTERVIEW" && r.interview_date && new Date(r.interview_date) > new Date()
  );
  if (!upcoming.length) return null;

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 flex items-center gap-3">
      <Calendar className="h-5 w-5 text-cyan-400 shrink-0" />
      <div>
        <p className="text-sm font-medium text-cyan-300">
          Upcoming Interview — {upcoming[0].company}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{formatDate(upcoming[0].interview_date)}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ApplicationsTable
// ─────────────────────────────────────────────
function ApplicationsTable({ rows }: { rows: any[] }) {
  const statusColor: Record<string, string> = {
    APPLIED: "bg-blue-500/20 text-blue-300",
    INTERVIEW: "bg-violet-500/20 text-violet-300",
    OFFER: "bg-emerald-500/20 text-emerald-300",
    REJECTED: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold mb-4">📋 Applications</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="text-left py-2 pr-4">Company</th>
              <th className="text-left py-2 pr-4">Role</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2">Applied</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No applications yet. Add your first one!
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id ?? i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-medium text-white">{r.company || "—"}</td>
                  <td className="py-3 pr-4 text-slate-300">{r.role || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-lg text-xs ${statusColor[r.status] ?? "bg-white/10 text-slate-300"}`}>
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-xs">
                    {r.applied_date ? new Date(r.applied_date).toLocaleDateString("en-PK") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MiniCalendar
// ─────────────────────────────────────────────
function MiniCalendar({ rows }: { rows: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const interviewDays = new Set(
    rows
      .filter((r) => r.interview_date)
      .map((r) => new Date(r.interview_date).getDate())
  );

  const monthName = today.toLocaleString("en-US", { month: "long" });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold mb-3">
        {monthName} {year}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {Array.from({ length: firstDay }).map((_, i) => (
          <span key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isToday = day === today.getDate();
          const hasInterview = interviewDays.has(day);
          return (
            <span
              key={day}
              className={`rounded-lg py-1 font-medium ${
                isToday
                  ? "bg-violet-600 text-white"
                  : hasInterview
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:bg-white/10"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ActivityFeed
// ─────────────────────────────────────────────
function ActivityFeed({ rows }: { rows: any[] }) {
  const recent = [...rows]
    .sort((a, b) => new Date(b.updated_at ?? b.applied_date ?? 0).getTime() - new Date(a.updated_at ?? a.applied_date ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-400" />
        Recent Activity
      </h3>
      {recent.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((r, i) => (
            <li key={r.id ?? i} className="flex items-start gap-3 text-xs">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
              <div>
                <p className="text-slate-200 font-medium">{r.company}</p>
                <p className="text-slate-500">{r.status} · {r.role}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// AddApplicationPanel
// ─────────────────────────────────────────────
function AddApplicationPanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company: "", role: "", status: "APPLIED", applied_date: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  const handleAdd = async () => {
    if (!form.company || !form.role || !user?.id) return;
    setLoading(true);
    const { error } = await supabase
      .from("applications")
      .insert({ ...form, user_id: user.id });
    setLoading(false);
    if (!error) {
      setSaved(true);
      setForm({ company: "", role: "", status: "APPLIED", applied_date: "" });
      setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Add Application
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">New Application</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {(["company", "role"] as const).map((field) => (
              <input
                key={field}
                type="text"
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              />
            ))}
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {["APPLIED", "INTERVIEW", "OFFER", "REJECTED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <input
              type="date"
              value={form.applied_date}
              onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={handleAdd}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Application"}
            </button>
            {saved && <p className="text-xs text-green-400 text-center">✅ Application added!</p>}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// HR Dashboard
// ─────────────────────────────────────────────
function HRDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name || user?.email?.split("@")[0] || "HR";

  const [candidates, setCandidates] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", role: "", datetime: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [jobDesc, setJobDesc] = useState("");
  const [jobDescSaved, setJobDescSaved] = useState(false);
  const [jobDescLoading, setJobDescLoading] = useState(false);
  const [jobDescOpen, setJobDescOpen] = useState(false);

  const loadInterviews = () => {
    if (!user?.id) return;
    supabase
      .from("interviews")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true })
      .then(({ data, error }: any) => {
        if (error) { setFetchError(error.message); return; }
        setFetchError(null);
        if (data) setCandidates(data);
      });
  };

  const loadJobDescription = () => {
    if (!user?.id) return;
    supabase
      .from("user_tokens")
      .select("job_description")
      .eq("user_id", user.id)
      .single()
      .then(({ data }: any) => {
        if (data?.job_description) setJobDesc(data.job_description);
      });
  };

  const handleSaveJobDesc = async () => {
    if (!user?.id) return;
    setJobDescLoading(true);
    const { error } = await supabase
      .from("user_tokens")
      .update({ job_description: jobDesc })
      .eq("user_id", user.id);
    setJobDescLoading(false);
    if (!error) {
      setJobDescSaved(true);
      setTimeout(() => setJobDescSaved(false), 2000);
    }
  };

  useEffect(() => {
    loadInterviews();
    loadJobDescription();
  }, [user?.id]);

  const handleSchedule = async () => {
    if (!form.name || !form.role || !form.datetime || !user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("interviews")
      .insert({
        candidate_name: form.name,
        role: form.role,
        scheduled_at: new Date(form.datetime).toISOString(),
        user_id: user.id,
      })
      .select()
      .single();
    if (error) { setFetchError(error.message); setLoading(false); return; }
    setCandidates((prev) => [data, ...prev]);
    setForm({ name: "", role: "", datetime: "" });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const statusColor: Record<string, string> = {
    SCHEDULED: "bg-violet-500/20 text-violet-300",
    COMPLETED: "bg-emerald-500/20 text-emerald-300",
    CANCELLED: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {fetchError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          ⚠️ Data error: {fetchError}
        </div>
      )}

      {/* Candidates Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">
          👥 Candidates{" "}
          <span className="text-sm text-slate-400 font-normal">({candidates.length} total)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left py-2 pr-4">Candidate</th>
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
                    {fetchError ? "Error loading data." : "No candidates yet."}
                  </td>
                </tr>
              ) : (
                candidates.map((c, i) => (
                  <tr key={c.id ?? i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{c.candidate_name || "—"}</td>
                    <td className="py-3 pr-4 text-slate-300">{c.role || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${statusColor[c.status] ?? "bg-white/10 text-slate-300"}`}>
                        {c.status || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">
                      {c.scheduled_at ? formatDate(c.scheduled_at) : "—"}
                    </td>
                    <td className="py-3">
                      {c.meet_link ? (
                        <a href={c.meet_link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
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
      </div>

      {/* Job Description */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">📋 Job Description</h2>
          {!jobDescOpen && (
            <button
              onClick={() => setJobDescOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Description
            </button>
          )}
        </div>

        {jobDescOpen && (
          <div className="mt-4 flex flex-col gap-3 max-w-md">
            <p className="text-sm text-slate-400">
              Yeh job description AI candidate screening ke liye use hogi.
            </p>
            <textarea
              rows={6}
              autoFocus
              placeholder="Enter job description here... (e.g. We are looking for a React developer with 2+ years experience...)"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveJobDesc}
                disabled={jobDescLoading}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {jobDescLoading ? "Saving..." : "Save Job Description"}
              </button>
              <button
                onClick={() => setJobDescOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
            {jobDescSaved && <p className="text-xs text-green-400">✅ Job description saved!</p>}
          </div>
        )}

        {!jobDescOpen && jobDesc && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">{jobDesc}</p>
        )}
        {!jobDescOpen && !jobDesc && (
          <p className="mt-2 text-xs text-slate-600">Koi description nahi. "Add Description" par click karein.</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard (Job Seeker)
// ─────────────────────────────────────────────
function Dashboard() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const { data: rows = [], isLoading } = useApplications();
  const [reportTime, setReportTime] = useState<string | null>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

  if (!ready) return null;
  if (user?.role === "hr") return <HRDashboard />;

  const firstName = user?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {isLoading && (
        <p className="text-center text-xs text-slate-500">Syncing with Google Sheets...</p>
      )}
    </div>
  );
}
