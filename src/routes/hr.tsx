import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, supabase } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/hr")({
  component: HRDashboard,
  head: () => ({
    meta: [{ title: "HR Dashboard — JobTrack" }],
  }),
});

export function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name || user?.email?.split("@")[0] || "HR";

  const [candidates, setCandidates] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", role: "", datetime: "" });
  const [interviews, setInterviews] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  const handleSchedule = () => {
    if (!form.name || !form.role || !form.datetime) return;
    setInterviews([...interviews, form]);
    setForm({ name: "", role: "", datetime: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-[#080811] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Good morning, <span className="text-gradient-violet">{firstName}</span> 👋
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

      {/* Candidates Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">👥 Candidates</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="text-left py-2 pr-4">Name</th>
              <th className="text-left py-2 pr-4">Role Applied</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No candidates yet.
                </td>
              </tr>
            ) : (
              candidates.map((c, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.role}</td>
                  <td className="py-2 pr-4">{c.status}</td>
                  <td className="py-2">
                    <button className="text-xs text-violet-400 hover:underline">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Schedule Interview
          </button>
          {saved && <p className="text-xs text-green-400">✅ Interview scheduled!</p>}
        </div>

        {/* Scheduled List */}
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
