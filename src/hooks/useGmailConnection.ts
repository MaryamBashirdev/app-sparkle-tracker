import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth";

export function useGmailConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkAndSaveToken();
  }, []);

  async function checkAndSaveToken() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.provider_token && session?.user) {
      setIsConnected(true);
      
      // Token ko Supabase mein save karo
      await supabase.from("user_tokens").upsert({
        user_id: session.user.id,
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token ?? null,
        email: session.user.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } else {
      setIsConnected(false);
    }
  }

  async function connectGmail() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: window.location.origin,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  return { isConnected, connectGmail };
}
