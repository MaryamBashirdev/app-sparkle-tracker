import type { AppRow } from "@/lib/sheets";
import { statusKey, STATUS_META } from "@/lib/sheets";
import { Briefcase, Calendar, Trophy, XCircle, AlertCircle } from "lucide-react";

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00").getTime();
  const diff = Date.now() - d;
  const days = Math.round(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 0) return `in ${-days}d`;
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function ActivityFeed({ rows }: { rows: AppRow[] }) {
  const items = [...rows]
    .filter(r => r.interview_date)
    .sort((a, b) => (b.interview_date! > a.interview_date! ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="glass p-5">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {items.map((r, i) => {
          const k = statusKey(r.category);
          const m = STATUS_META[k] ?? STATUS_META.default;
          const Icon = k === "interview" ? Calendar : k === "offer" ? Trophy : k === "rejected" ? XCircle : k === "follow_up" ? AlertCircle : Briefcase;
          return (
            <div
              key={r.id}
              className="fade-up flex gap-3 rounded-xl border-l-2 bg-white/[0.02] p-3"
              style={{ borderColor: m.color, animationDelay: `${i * 70}ms` }}
            >
              <div
                className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
                style={{ background: `${m.color}1f`, color: m.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{r.company}</span>
                  <span className="text-slate-400"> · {m.label.toLowerCase()}</span>
                </p>
                <p className="text-xs text-slate-500">{r.role || "—"} · {timeAgo(r.interview_date)}</p>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
      </div>
    </div>
  );
}
