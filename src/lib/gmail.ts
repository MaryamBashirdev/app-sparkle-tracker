// Client-side Gmail sync using the provider access token from Supabase Google OAuth.
import { supabase } from "./auth";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

const ATS_SENDERS = [
  "linkedin.com", "indeed.com", "glassdoor.com", "ziprecruiter.com",
  "greenhouse.io", "lever.co", "workday.com", "myworkday.com",
  "ashbyhq.com", "smartrecruiters.com", "icims.com", "bamboohr.com",
  "jobvite.com", "hire.withgoogle.com", "recruitee.com", "workable.com",
  "rippling.com", "wellfound.com", "ycombinator.com",
];

const APPLY_QUERY = [
  "newer_than:90d",
  "(",
  ATS_SENDERS.map((d) => `from:${d}`).join(" OR "),
  "OR subject:(application OR applying OR interview OR offer OR \"thank you for applying\" OR \"next steps\" OR recruiter)",
  ")",
].join(" ");

export type ParsedEmail = {
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
  date: Date;
};

export type ClassifiedApp = {
  gmail_message_id: string;
  company: string;
  role: string;
  category: string; // applied | interview | offer | rejected | follow_up
  summary: string;
  action_required: string;
  interview_date: string | null;
  interview_time: string;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function getAccessToken(userId: string): Promise<string | null> {
  // Prefer fresh provider_token from current session
  const { data: s } = await supabase.auth.getSession();
  if (s.session?.provider_token) return s.session.provider_token;
  // Fallback to stored token
  const { data } = await supabase
    .from("users")
    .select("access_token")
    .eq("id", userId)
    .maybeSingle();
  return (data as any)?.access_token ?? null;
}

async function listMessageIds(token: string, max = 50): Promise<string[]> {
  const url = `${GMAIL_API}/messages?maxResults=${max}&q=${encodeURIComponent(APPLY_QUERY)}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) {
    if (res.status === 401) throw new Error("gmail_unauthorized");
    throw new Error(`Gmail list failed: ${res.status}`);
  }
  const j = await res.json();
  return (j.messages ?? []).map((m: any) => m.id);
}

async function getMessage(token: string, id: string): Promise<ParsedEmail | null> {
  const url = `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) return null;
  const j = await res.json();
  const headers: Record<string, string> = {};
  for (const h of j.payload?.headers ?? []) headers[h.name.toLowerCase()] = h.value;
  return {
    messageId: j.id,
    from: headers["from"] ?? "",
    subject: headers["subject"] ?? "",
    snippet: j.snippet ?? "",
    date: new Date(headers["date"] ?? Date.now()),
  };
}

function extractCompany(from: string, subject: string): string {
  // Try "Name <email@domain>" → use Name if not generic
  const nameMatch = from.match(/^"?([^"<]+?)"?\s*</);
  const name = nameMatch?.[1]?.trim();
  const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
  const email = emailMatch?.[1] ?? "";
  const domain = email.split("@")[1] ?? "";
  const root = domain.split(".").slice(-2, -1)[0] ?? domain;

  // Subject patterns: "Your application to X", "at X", "from X"
  const subj = subject;
  const pats = [
    /application (?:to|for|at) ([^-–|·,!?\n]+)/i,
    /from ([A-Z][\w& .]+)/,
    /at ([A-Z][\w& .]+)/,
  ];
  for (const p of pats) {
    const m = subj.match(p);
    if (m?.[1]) return m[1].trim().replace(/\s+/g, " ").slice(0, 80);
  }
  if (name && !/no.?reply|notification|team|careers|jobs|talent/i.test(name)) return name;
  if (root && !ATS_SENDERS.some((d) => d.startsWith(root))) {
    return root.charAt(0).toUpperCase() + root.slice(1);
  }
  return name || root || "Unknown";
}

function extractRole(subject: string, snippet: string): string {
  const text = `${subject} ${snippet}`;
  const m =
    text.match(/(?:for the|for our|the|your application for(?: the)?) ([A-Z][\w &/-]+?(?:Engineer|Developer|Designer|Manager|Analyst|Intern|Scientist|Consultant|Specialist|Lead|Director|Architect|Officer|Associate))/) ||
    text.match(/(Software Engineer|Frontend Engineer|Backend Engineer|Full[- ]Stack Engineer|Data Scientist|Product Manager|UX Designer|UI Designer|Designer|Developer|Engineer|Intern|Analyst)/i);
  return m?.[1]?.trim().slice(0, 80) ?? "";
}

function classify(subject: string, snippet: string): { category: string; action: string } {
  const t = `${subject} ${snippet}`.toLowerCase();
  if (/offer|pleased to offer|extend an offer/.test(t)) return { category: "offer", action: "Review offer" };
  if (/regret|unfortunately|not moving forward|other candidates|decided to move forward with other/.test(t))
    return { category: "rejected", action: "" };
  if (/interview|phone screen|schedule a call|schedule a time|invite you|next round|technical screen|onsite/.test(t))
    return { category: "interview", action: "Prepare for interview" };
  if (/follow.?up|checking in|gentle reminder|any update/.test(t))
    return { category: "follow_up", action: "Reply to recruiter" };
  if (/thank you for applying|application received|received your application|we have received your/.test(t))
    return { category: "applied", action: "" };
  return { category: "applied", action: "" };
}

function parseInterviewDate(text: string): { date: string | null; time: string } {
  // Very light heuristic: look for ISO-ish or "Month Day" + optional time
  const dm = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  const tm = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  let date: string | null = null;
  if (dm) {
    const parsed = new Date(`${dm[0]} ${dm[3] ?? new Date().getFullYear()}`);
    if (!isNaN(parsed.getTime())) date = parsed.toISOString().slice(0, 10);
  }
  let time = "";
  if (tm) {
    let h = +tm[1];
    if (tm[3]?.toLowerCase() === "pm" && h < 12) h += 12;
    if (tm[3]?.toLowerCase() === "am" && h === 12) h = 0;
    time = `${String(h).padStart(2, "0")}:${tm[2]}`;
  }
  return { date, time };
}

export async function syncGmail(userId: string): Promise<{ added: number; skipped: number; total: number }> {
  const token = await getAccessToken(userId);
  if (!token) throw new Error("no_gmail_token");

  const ids = await listMessageIds(token, 50);
  if (ids.length === 0) return { added: 0, skipped: 0, total: 0 };

  // Fetch existing message ids for this user to skip duplicates
  const { data: existing } = await supabase
    .from("applications")
    .select("gmail_message_id")
    .eq("user_id", userId);
  const seen = new Set((existing ?? []).map((r: any) => r.gmail_message_id).filter(Boolean));

  const toFetch = ids.filter((id) => !seen.has(id));
  const messages = (await Promise.all(toFetch.map((id) => getMessage(token, id)))).filter(
    (m): m is ParsedEmail => !!m,
  );

  const rows = messages.map((m) => {
    const cls = classify(m.subject, m.snippet);
    const interview = cls.category === "interview" ? parseInterviewDate(`${m.subject} ${m.snippet}`) : { date: null, time: "" };
    return {
      user_id: userId,
      gmail_message_id: m.messageId,
      company: extractCompany(m.from, m.subject),
      role: extractRole(m.subject, m.snippet),
      category: cls.category,
      summary: m.snippet.slice(0, 280),
      action_required: cls.action,
      interview_date: interview.date,
      interview_time: interview.time,
      created_at: m.date.toISOString(),
    };
  });

  let added = 0;
  if (rows.length > 0) {
    const { error, count } = await supabase
      .from("applications")
      .upsert(rows, { onConflict: "user_id,gmail_message_id", count: "exact", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    added = count ?? rows.length;
  }

  // Mark user as gmail-connected
  await supabase.from("users").upsert({ id: userId, gmail_connected: true });

  return { added, skipped: ids.length - rows.length, total: ids.length };
}
