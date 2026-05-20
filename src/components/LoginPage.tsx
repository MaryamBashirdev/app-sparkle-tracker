import { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Background } from "@/components/Background";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const ok = await login(email, password, remember);
    setLoading(false);
    if (!ok) {
      setError("Invalid email or password");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <Background />
      <div
        className={`relative w-full max-w-md glass shimmer p-8 md:p-10 fade-up ${
          shake ? "shake" : ""
        }`}
        style={{ boxShadow: "0 30px 80px -20px rgba(124,58,237,0.35)" }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-violet-400" />
            <h1 className="text-3xl font-bold">
              <span className="text-gradient-violet">JobTrack</span>
              <span className="ml-1">✨</span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">Your AI-powered job tracker</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="auth-field">
            <Mail className="auth-icon" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <Lock className="auth-icon" />
            <input
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {error}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-violet-500"
              />
              Remember me
            </label>
            <button type="button" className="text-violet-300 hover:text-violet-200">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full rounded-xl py-3 font-semibold text-white bg-gradient-violet-cyan transition hover:brightness-110 disabled:opacity-70"
            style={{ boxShadow: "0 10px 30px -8px rgba(124,58,237,0.6)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secured by JobTrack
        </div>
      </div>
    </div>
  );
}
