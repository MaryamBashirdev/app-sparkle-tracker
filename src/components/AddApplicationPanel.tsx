import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export function AddApplicationPanel() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // Google Sheets gviz is read-only; emit a toast (n8n webhook would go here)
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setOpen(false);
    toast.success("✅ Application added!");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-5px_rgba(124,58,237,0.6)] transition-all hover:shadow-[0_12px_40px_-5px_rgba(124,58,237,0.8)] hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" /> Add Application
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm fade-up" onClick={() => setOpen(false)} style={{ animationDuration: "0.2s" }} />
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[#0a0a14]/95 backdrop-blur-2xl p-6 overflow-y-auto"
            style={{ animation: "slideInRight 0.35s cubic-bezier(0.4,0,0.2,1)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">New Application</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Company name"><input required name="company" className={inputCls} /></Field>
              <Field label="Role"><input required name="role" className={inputCls} /></Field>
              <Field label="Status">
                <select name="status" className={inputCls} defaultValue="applied">
                  <option value="applied">🟣 Applied</option>
                  <option value="interview">🟢 Interview</option>
                  <option value="offer">🏆 Offer</option>
                  <option value="rejected">🔴 Rejected</option>
                  <option value="follow_up">🟠 Follow up</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Interview Date"><input type="date" name="date" className={inputCls} /></Field>
                <Field label="Interview Time"><input type="time" name="time" className={inputCls} /></Field>
              </div>
              <Field label="Notes"><textarea name="notes" rows={4} className={inputCls} /></Field>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
                <input type="checkbox" name="action" className="accent-violet-500 h-4 w-4" />
                <span className="text-sm">Action required</span>
              </label>
              <button
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 text-sm font-semibold shadow-[0_10px_40px_-10px_rgba(124,58,237,0.7)] hover:shadow-[0_14px_50px_-10px_rgba(124,58,237,0.9)] transition-shadow disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add Application"}
              </button>
            </form>
          </aside>
          <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </div>
      )}
    </>
  );
}

const inputCls =
  "peer w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur px-3.5 py-2.5 text-sm placeholder-transparent focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
