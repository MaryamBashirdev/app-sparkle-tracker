import { useMemo, useState } from "react";
import { Search, Clock, AlertCircle, Mail, X } from "lucide-react";
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
  const [openEmail, setOpenEmail] = useState<AppRow | null>(null);

  const today = new Date();
today.setHours(0, 0, 0, 0);

const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        r.company.toLowerCase().includes(q.toLowerCase()) ||
        r.role.toLowerCase().includes(q.toLowerCase());
      const matchesS = status === "all" || statusKey(r.category) === status;
      const interviewDate = r.interview_date ? new Date(r.interview_date + "T00:00:00") : null;
      const matchesDate = !interviewDate || interviewDate >= today;
      return matchesQ && matchesS && matchesDate;
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
              <th className="py-3 pr-4 font-medium">Email</th>
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
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => setOpenEmail(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      View Email
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">No applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {openEmail && <EmailModal row={openEmail} onClose={() => setOpenEmail(null)} />}
    </div>
  );
}

function EmailModal({ row, onClose }: { row: AppRow; onClose: () => void }) {
  const dateStr = row.email_date
    ? new Date(row.email_date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b14]/95 shadow-[0_30px_80px_-20px_rgba(124,58,237,0.4)] flex flex-col"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-violet-300/80 mb-2">
            <Mail className="h-3.5 w-3.5" /> Email Details
          </div>
          <h2 className="text-lg font-bold text-white pr-10 leading-snug">
            {row.email_subject || row.role || row.company}
          </h2>
        </div>
        <div className="px-6 py-4 space-y-2 text-sm border-b border-white/5">
          <Field label="From" value={row.email_from || "—"} />
          <Field label="To" value={row.email_to || "—"} />
          <Field label="Date" value={dateStr} />
          <Field label="Subject" value={row.email_subject || "—"} />
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
            {row.email_body || "No email body available."}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 text-[11px] uppercase tracking-wider text-slate-500 pt-0.5">{label}</span>
      <span className="text-slate-200 break-all">{value}</span>
    </div>
  );
}
