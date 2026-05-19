import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";
import { useApplications } from "@/lib/useApplications";
import { statusKey, STATUS_META } from "@/lib/sheets";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — JobTrack" }] }),
});

function Analytics() {
  const { data: rows = [] } = useApplications();

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => {
      const k = statusKey(r.category);
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({
      name: STATUS_META[k]?.label ?? k,
      value: v,
      color: STATUS_META[k]?.color ?? "#94a3b8",
    }));
  }, [rows]);

  const weekData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      if (!r.interview_date) return;
      const d = new Date(r.interview_date + "T00:00:00");
      const wk = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString("en", { month: "short" })}`;
      map.set(wk, (map.get(wk) ?? 0) + 1);
    });
    return Array.from(map.entries()).slice(-8).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const lineData = useMemo(() => {
    const arr: { name: string; value: number }[] = [];
    let acc = 0;
    [...rows]
      .filter(r => r.interview_date)
      .sort((a,b) => a.interview_date! < b.interview_date! ? -1 : 1)
      .forEach(r => {
        acc++;
        arr.push({ name: r.interview_date!.slice(5), value: acc });
      });
    return arr.slice(-15);
  }, [rows]);

  const total = rows.length || 1;
  const offers = rows.filter(r => statusKey(r.category) === "offer").length;
  const interviews = rows.filter(r => statusKey(r.category) === "interview").length;
  const success = Math.round(((offers + interviews) / total) * 100);

  const roleCounts = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => r.role && m.set(r.role, (m.get(r.role) ?? 0) + 1));
    return [...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "—";
  }, [rows]);

  const topCategory = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => {
      const k = statusKey(r.category);
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    const top = [...m.entries()].sort((a,b)=>b[1]-a[1])[0];
    return top ? STATUS_META[top[0]]?.label : "—";
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Insights from your job search.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-5">
          <h3 className="font-semibold mb-4">Status Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none" animationBegin={0} animationDuration={1200}>
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0a0a14", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-300">{s.name}</span>
                <span className="text-slate-500">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-5">
          <h3 className="font-semibold mb-4">Applications per Week</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={weekData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0a0a14", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 12 }} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[8,8,0,0]} animationDuration={1100} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass p-5">
        <h3 className="font-semibold mb-4">Activity Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a14", border: "1px solid rgba(6,182,212,0.4)", borderRadius: 12 }} />
              <Line
                type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={false}
                style={{ filter: "drop-shadow(0 0 8px rgba(6,182,212,0.6))" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 flex flex-col items-center justify-center">
          <CircularProgress value={success} />
          <p className="text-xs uppercase tracking-wider text-slate-400 mt-3">Success Rate</p>
        </div>
        <KpiCard label="Most applied role" value={roleCounts} />
        <KpiCard label="Avg. response time" value="4.2 days" />
        <KpiCard label="Best category" value={topCategory} />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass glass-hover p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-bold text-gradient-violet truncate">{value}</p>
    </div>
  );
}

function CircularProgress({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
        <circle
          cx="50" cy="50" r={r} stroke="url(#circGrad)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out", filter: "drop-shadow(0 0 6px rgba(124,58,237,0.6))" }}
        />
        <defs>
          <linearGradient id="circGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">{value}%</div>
    </div>
  );
}
