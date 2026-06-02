import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ data }) => {
        if (data.session) navigate({ to: "/", replace: true });
        else navigate({ to: "/login", replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Logging you in...</p>
    </div>
  );
}
