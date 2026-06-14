const [role, setRole] = useState<"candidate" | "hr" | null>(null);

// mt-10 div ko yeh karo:
<div className="mt-10 flex flex-col items-center gap-4">
  
  {/* Step 1: Role Selection */}
  {!role && (
    <div className="w-full flex flex-col gap-3">
      <p className="text-sm text-slate-400 text-center mb-2">Select your role to continue</p>
      <button
        onClick={() => setRole("candidate")}
        className="w-full py-3 px-4 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-white font-medium transition-all"
      >
        🎯 Continue as Candidate
      </button>
      <button
        onClick={() => setRole("hr")}
        className="w-full py-3 px-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-white font-medium transition-all"
      >
        💼 Continue as HR
      </button>
    </div>
  )}

  {/* Step 2: Google Login after role selected */}
  {role && (
    <>
      <p className="text-sm text-slate-400">
        Signing in as <span className="text-violet-400 font-semibold">{role === "hr" ? "HR" : "Candidate"}</span>
      </p>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium transition-all disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A353" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>
      <button onClick={() => setRole(null)} className="text-xs text-slate-500 hover:text-slate-300">
        ← Change role
      </button>
    </>
  )}

  {error && (
    <div className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
      {error}
    </div>
  )}
</div>
