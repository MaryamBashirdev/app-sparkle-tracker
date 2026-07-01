// Supabase Edge Function — hr-inbox-scan
// HR users ki Gmail check karta hai, AI se screen karta hai,
// qualified candidates ko interviews table mein add karta hai.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rzmispdqrsvfhujslrbe.supabase.co";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ---- Google token refresh ----
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("Token refresh failed:", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.access_token ?? null;
}

// ---- Gmail helpers ----
async function listUnreadIds(token: string): Promise<string[]> {
  const q = "is:unread newer_than:7d";
  const url = `${GMAIL_API}/messages?maxResults=20&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Gmail list failed: ${res.status}`);
  const data = await res.json();
  return (data.messages ?? []).map((m: any) => m.id);
}

async function getMessage(token: string, id: string) {
  const url = `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const hdrs: Record<string, string> = {};
  for (const h of data.payload?.headers ?? []) hdrs[h.name.toLowerCase()] = h.value;
  return {
    messageId: data.id,
    from: hdrs["from"] ?? "",
    subject: hdrs["subject"] ?? "",
    snippet: data.snippet ?? "",
  };
}

// ---- Mistral AI screening ----
async function screenEmail(
  mistralKey: string,
  jobDescription: string,
  from: string,
  subject: string,
  snippet: string,
) {
  const system = `Tum ek HR recruiter assistant ho. Job description aur email dekh kar decide karo:
1. Kya yeh email job application hai? (newsletters/spam = false)
2. Agar haan, candidate qualify karta hai job description ke against?
Sirf JSON return karo:
{"is_application": true/false, "qualified": true/false, "candidate_name": "...", "role": "...", "reason": "..."}`;

  const user = `JOB DESCRIPTION:\n${jobDescription}\n\nFROM: ${from}\nSUBJECT: ${subject}\nSNIPPET: ${snippet}`;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mistralKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error("Mistral failed:", res.status);
    return { is_application: false, qualified: false, candidate_name: "Unknown", role: "", reason: "AI error" };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const p = JSON.parse(content);
    return {
      is_application: !!p.is_application,
      qualified: !!p.qualified,
      candidate_name: p.candidate_name || "Unknown",
      role: p.role || "—",
      reason: p.reason || "",
    };
  } catch {
    return { is_application: false, qualified: false, candidate_name: "Unknown", role: "", reason: "Parse error" };
  }
}

function pickSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

// ---- Main handler ----
Deno.serve(async (_req) => {
  console.log("[hr-inbox-scan] Starting...");

  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
  const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? "";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: hrUsers, error } = await supabase
    .from("user_tokens")
    .select("user_id, refresh_token, job_description")
    .not("refresh_token", "is", null)
    .not("job_description", "is", null);

  if (error) {
    console.error("[hr-inbox-scan] Supabase error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`[hr-inbox-scan] ${(hrUsers ?? []).length} HR user(s) to scan`);

  for (const hr of hrUsers ?? []) {
    try {
      const token = await refreshAccessToken(hr.refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      if (!token) {
        console.error(`[hr-inbox-scan] Token refresh failed for user ${hr.user_id}`);
        continue;
      }

      const ids = await listUnreadIds(token);
      console.log(`[hr-inbox-scan] User ${hr.user_id}: ${ids.length} unread email(s)`);
      if (ids.length === 0) continue;

      const { data: screened } = await supabase
        .from("screened_emails")
        .select("gmail_message_id")
        .eq("user_id", hr.user_id);
      const done = new Set((screened ?? []).map((r: any) => r.gmail_message_id));
      const newIds = ids.filter((id: string) => !done.has(id));

      console.log(`[hr-inbox-scan] ${newIds.length} new email(s) to screen`);

      for (const id of newIds) {
        const email = await getMessage(token, id);
        if (!email) continue;

        console.log(`[hr-inbox-scan] Screening: "${email.subject}" from ${email.from}`);
        const verdict = await screenEmail(
          MISTRAL_API_KEY,
          hr.job_description,
          email.from,
          email.subject,
          email.snippet,
        );

        console.log(`[hr-inbox-scan] Result: is_application=${verdict.is_application}, qualified=${verdict.qualified}`);

        await supabase.from("screened_emails").insert({
          user_id: hr.user_id,
          gmail_message_id: id,
          qualified: verdict.qualified,
        });

        if (verdict.is_application && verdict.qualified) {
          console.log(`[hr-inbox-scan] Adding candidate: ${verdict.candidate_name}`);
          await supabase.from("interviews").insert({
            user_id: hr.user_id,
            candidate_name: verdict.candidate_name,
            role: verdict.role,
            scheduled_at: pickSlot(),
          });
        }
      }
    } catch (e) {
      console.error(`[hr-inbox-scan] Error for user ${hr.user_id}:`, String(e));
    }
  }

  console.log("[hr-inbox-scan] Done.");
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});