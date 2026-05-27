import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Background } from "@/components/Background";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — JobTrack" },
      { name: "description", content: "Sign in to your JobTrack dashboard." },
    ],
  }),
});

function LoginPage() {
  const { user, ready, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search as { redirect?: string } });

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (ready && user) {
      navigate({ to: (search?.redirect as any) || "/", replace: true });
    }
  }, [ready, user, navigate, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password);
      setLeaving(true);
      setTimeout(() => navigate({ to: (search?.redirect as any) || "/", replace: true }), 350);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      setShaking(true);
      setTimeout(() => setShaking(false), 550);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center px-4 py-12 transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <Background />
      <div className={`relative w-full max-w-md auth-fade ${shaking ? "shake" : ""}`}>
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-600/30 via-fuchsia-500/10 to-cyan-500/30 blur-2xl opacity-60" />
        <div className="relative glass rounded-3xl border border-white/10 p-8 md:p-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-1 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-violet-400" />
              <h1 className="text-3xl font-extrabold text-gradient-violet">JobTrack ✨</h1>
            </div>
            <p className="mt-2 text-sm text-slate-400">Your AI-powered job tracker</p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`relative rounded-lg py-2 font-medium transition-colors ${mode === m ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                {mode === m && <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600/80 to-cyan-500/60 shadow-[0_0_20px_-4px_rgba(124,58,237,0.6)]" />}
                <span className="relative">{m === "login" ? "Sign in" : "Create account"}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300">Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="auth-input w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type={showPw ? "text" : "password"} required autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="auth-input w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 transition" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-violet-500" />
                  Remember me
                </label>
                <button type="button" className="text-violet-300 hover:text-violet-200">Forgot password?</button>
              </div>
            )}

            {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div>}

            <button type="submit" disabled={loading} className="auth-btn group relative flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-70">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
            </button>
          </form>

          <div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-white/20"></div>
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-transparent px-2 text-slate-400">or</span>
  </div>
</div>

<button
  type="button"
  onClick={() => loginWithGoogle()}
  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
>
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A353" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
  </svg>
  Continue with Google
</button>
          <p className="mt-4 text-center text-xs text-slate-500">🔒 Secured by JobTrack</p>
        </div>
      </div>
    </div>
  );
}
