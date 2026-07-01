import { createClient } from "@supabase/supabase-js";
import { refreshAccessToken } from "./googleToken";
import { screenEmail } from "./aiScreening";

const SUPABASE_URL = "https://rzmispdqrsvfhujslrbe.supabase.co";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export type ScanEnv = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MISTRAL_API_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type HrUserRow = {
  user_id: string;
  refresh_token: string;
  job_description: string;
};

type RawEmail = {
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
};

async function listUnreadMessageIds(token: string): Promise<string[]> {
  const query = "is:unread newer_than:7d";
  const url = `${GMAIL_API}/messages?maxResults=20&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Gmail list failed: ${res.status}`);
  const data = (await res.json()) as any;
  return (data.messages ?? []).map((m: any) => m.id);
}

async function getMessage(token: string, id: string): Promise<RawEmail | null> {
  const url = `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const headers: Record<string, string> = {};
  for (const h of data.payload?.headers ?? []) headers[h.name.toLowerCase()] = h.value;
  return {
    messageId: data.id,
    from: headers["from"] ?? "",
    subject: headers["subject"] ?? "",
    snippet: data.snippet ?? "",
  };
}

function pickInterviewSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

export async function scanAllHrInboxes(env: ScanEnv): Promise<void> {
  console.log("[HR Scan] Starting...");
  const supabase = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: hrUsers, error } = await supabase
    .from("user_tokens")
    .select("user_id, refresh_token, job_description")
    .not("refresh_token", "is", null)
    .not("job_description", "is", null);

  if (error) {
    console.error("[HR Scan] Supabase error:", error.message);
    return;
  }

  console.log(`[HR Scan] ${(hrUsers ?? []).length} user(s) to scan`);

  for (const hr of (hrUsers ?? []) as HrUserRow[]) {
    try {
      await scanOneHrInbox(supabase, env, hr);
    } catch (e) {
      console.error(`[HR Scan] Error for user ${hr.user_id}:`, String(e));
    }
  }
  console.log("[HR Scan] Done.");
}

async function scanOneHrInbox(
  supabase: ReturnType<typeof createClient>,
  env: ScanEnv,
  hr: HrUserRow,
): Promise<void> {
  console.log(`[HR Scan] Scanning inbox for user ${hr.user_id}...`);
  const accessToken = await refreshAccessToken(hr.refresh_token, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  if (!accessToken) {
    console.error(`[HR Scan] Could not refresh Gmail token for user ${hr.user_id}`);
    return;
  }

  const ids = await listUnreadMessageIds(accessToken);
  console.log(`[HR Scan] Found ${ids.length} unread email(s)`);
  if (ids.length === 0) return;

  const { data: screened } = await supabase
    .from("screened_emails")
    .select("gmail_message_id")
    .eq("user_id", hr.user_id);
  const alreadyScreened = new Set((screened ?? []).map((r: any) => r.gmail_message_id));

  const newIds = ids.filter((id) => !alreadyScreened.has(id));
  console.log(`[HR Scan] ${newIds.length} new email(s) to screen`);
  if (newIds.length === 0) return;

  for (const id of newIds) {
    const email = await getMessage(accessToken, id);
    if (!email) continue;

    console.log(`[HR Scan] Screening: "${email.subject}" from ${email.from}`);
    const verdict = await screenEmail(
      env.MISTRAL_API_KEY,
      hr.job_description,
      email.from,
      email.subject,
      email.snippet,
    );

    console.log(`[HR Scan] Verdict: is_application=${verdict.is_application}, qualified=${verdict.qualified}`);

    await supabase.from("screened_emails").insert({
      user_id: hr.user_id,
      gmail_message_id: id,
      qualified: verdict.qualified,
    });

    if (verdict.is_application && verdict.qualified) {
      console.log(`[HR Scan] Adding qualified candidate: ${verdict.candidate_name}`);
      await supabase.from("interviews").insert({
        user_id: hr.user_id,
        candidate_name: verdict.candidate_name,
        role: verdict.role,
        scheduled_at: pickInterviewSlot(),
      });
    }
  }
}