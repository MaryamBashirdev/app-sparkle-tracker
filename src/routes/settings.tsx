import { createFileRoute } from "@tanstack/react-router";
import { Zap, Bell, User, Database } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — JobTrack" }] }),
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your workspace.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card icon={User} title="Profile" desc="Maryam · maryam@example.com" />
        <Card icon={Database} title="Google Sheets Sync" desc="Connected · auto-refresh every 30s" badge="LIVE" />
        <Card icon={Zap} title="n8n Automation" desc="Workflow active · v2.1.0" badge="ON" />
        <Card icon={Bell} title="Notifications" desc="Interview reminders enabled" />
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, desc, badge }: any) {
  return (
    <div className="glass glass-hover p-5 flex items-start gap-4">
      <div className="rounded-xl bg-violet-500/15 border border-violet-500/30 p-2.5 text-violet-300"><Icon className="h-5 w-5"/></div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          {badge && <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{badge}</span>}
        </div>
        <p className="text-sm text-slate-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}
