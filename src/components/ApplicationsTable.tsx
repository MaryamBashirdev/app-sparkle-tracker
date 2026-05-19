import { useMemo, useState } from "react";
import { Search, Clock, AlertCircle } from "lucide-react";
import type { AppRow } from "@/lib/sheets";
import { statusKey } from "@/lib/sheets";
import { StatusBadge } from "./StatusBadge";

const AVATAR_COLORS = [
  "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#6366f1", "#ec4899", "#14b8a6",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ApplicationsTable({ rows }: { rows: AppRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        r.company.toLowerCase().includes(q.toLowerCase()) ||
        r.role.toLowerCase().includes(q.toLowerCase());
      const matchesS = status === "all" || statusKey(r.category) === status;
      return matchesQ && matchesS;
    });
  }, [rows, q, status]);

  return (
    <div className="glass p-5">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company or role..."
            className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm placeholder-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2.5 text-sm focus:border-violet-500/60 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="follow_up">Follow up</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
              <th className="py-3 pr-4 font-medium">Company</th>
              <th className="py-3 pr-4 font-medium">Role</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Date</th>
              <th className="py-3 pr-4 font-medium">Time</th>
              <th className="py-3 pr-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const c = avatarColor(r.company);
              const needs = /yes|true|1/i.test(r.action_required);
              return (
                <tr
                  key={r.id}
                  className="group fade-up border-b border-white/5 last:border-0 relative hover:bg-white/[0.02] transition-colors"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <td className="py-3 pr-4 relative">
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-violet-500 origin-top scale-y-0 group-hover:scale-y-100 transition-transform" />
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                        style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)` }}
                      >
                        {r.company.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold">{r.company}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{r.role || "—"}</td>
                  <td className="py-3 pr-4"><StatusBadge category={r.category} /></td>
                  <td className="py-3 pr-4 text-slate-300">{formatDate(r.interview_date)}</td>
                  <td className="py-3 pr-4 text-slate-300">
                    {r.interview_time ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" /> {r.interview_time}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        needs
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {needs && <AlertCircle className="h-3 w-3" />}
                      {needs ? "YES" : "NO"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">No applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
