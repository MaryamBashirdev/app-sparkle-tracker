import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Bell, User, Database, Mail, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth, supabase } from "@/lib/auth";
import { syncGmail } from "@/lib/gmail";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — JobTrack" }] }),
});

function SettingsPage() {
  const { user, loginWithGoogle } = useAuth();
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("gmail_connected")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setConnected(!!data?.gmail_connected));
  }, [user]);

  const connect = async () => {
    try {
      await loginWithGoogle();
    } catch (e: any) {
      toast.error(e.message ?? "Connect failed");
    }
  };

  const sync = async () => {
    if (!user) return;
    setSyncing(true);
    setLastResult(null);
    try {
      const r = await syncGmail(user.id);
      setLastResult(`Synced ${r.total} email${r.total === 1 ? "" : "s"} · ${r.added} new`);
      toast.success(`Imported ${r.added} new application${r.added === 1 ? "" : "s"}`);
      setConnected(true);
      qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (e: any) {
      if (e.message === "no_gmail_token" || e.message === "gmail_unauthorized") {
        toast.error("Gmail access expired. Please reconnect.");
        setConnected(false);
      } else {
        toast.error(e.message ?? "Sync failed");
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your workspace.</p>
      </div>

      <div className="glass p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-rose-300">
            <Mail className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">Gmail</h3>
              {connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> CONNECTED
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/15 border border-slate-500/30 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  NOT CONNECTED
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Connect your Gmail to automatically import job application emails (last 90 days) into your tracker.
            </p>
            {lastResult && <p className="text-xs text-slate-500 mt-2">{lastResult}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {!connected && (
                <button
                  onClick={connect}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  <Mail className="h-4 w-4" />
                  Connect Gmail
                </button>
              )}
              <button
                onClick={sync}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10 disabled:opacity-60"
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {syncing ? "Syncing…" : connected ? "Sync now" : "Connect & sync"}
              </button>
              {connected && (
                <button
                  onClick={connect}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card icon={User} title="Profile" desc={user?.email ?? ""} />
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
      <div className="rounded-xl bg-violet-500/15 border border-violet-500/30 p-2.5 text-violet-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          {badge && (
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}
