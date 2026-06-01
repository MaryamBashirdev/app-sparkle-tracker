import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth";

export function useGmailConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      setIsConnected(true);
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
