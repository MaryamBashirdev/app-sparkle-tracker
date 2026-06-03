import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") || hashParams.get("code");

      console.log("CODE:", code);

      if (!code) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/", replace: true });
        } else {
          navigate({ to: "/login", replace: true });
        }
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      console.log("ERROR:", error);
      console.log("DATA:", data);
      
      if (!error && data.session) {
        navigate({ to: "/", replace: true });
      } else {
        navigate({ to: "/login", replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Logging you in...</p>
    </div>
  );
}
