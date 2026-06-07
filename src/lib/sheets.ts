// Google Sheets gviz fetcher + parser
import { supabase } from "./auth";

export type AppRow = {
  id: string;
  company: string;
  category: string;
  role: string;
  summary: string;
  action_required: string;
  interview_date: string | null; // ISO yyyy-mm-dd
  interview_time: string;
};

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/18lg5SnXLqIBgg8KOzTFhQ_wyKV4yCdX69vc0e5Niivo/gviz/tq?tqx=out:json&sheet=Sheet1";

function parseGvizDate(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") {
    // gviz: "Date(2026,4,25)" months 0-indexed
    const m = v.match(/^Date\((\d+),(\d+),(\d+)/);
    if (m) {
      const y = +m[1], mo = +m[2] + 1, d = +m[3];
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    const dt = new Date(v);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  return null;
}

export async function fetchSheet(): Promise<AppRow[]> {
  const res = await fetch(SHEET_URL, { cache: "no-store" });
  const text = await res.text();
  const jsonStr = text
    .replace(/^[^\{]*/, "")
    .replace(/\);?\s*$/, "");
  const data = JSON.parse(jsonStr);
  const rows = data?.table?.rows ?? [];
  const out: AppRow[] = [];
  rows.forEach((r: any, i: number) => {
    const c = r.c ?? [];
    const get = (idx: number) => (c[idx]?.v ?? c[idx]?.f ?? "") as any;
    const company = String(get(0) ?? "").trim();
    if (
      !company ||
      company.toLowerCase() === "unknown" ||
      company.toLowerCase() === "company"
    )
      return;
    const date = parseGvizDate(c[5]?.v ?? c[5]?.f);
    let time = "";
    const tRaw = c[6]?.f ?? c[6]?.v;
    if (tRaw) {
      if (typeof tRaw === "string" && /Date\(/.test(tRaw)) {
        const m = tRaw.match(/Date\(\d+,\d+,\d+,(\d+),(\d+)/);
        if (m) time = `${String(m[1]).padStart(2,"0")}:${String(m[2]).padStart(2,"0")}`;
      } else if (Array.isArray(tRaw)) {
        time = `${String(tRaw[0]).padStart(2,"0")}:${String(tRaw[1]).padStart(2,"0")}`;
      } else {
        time = String(tRaw);
      }
    }
    out.push({
      id: `r${i}`,
      company,
      category: String(get(1) ?? "").trim(),
      role: String(get(2) ?? "").trim(),
      summary: String(get(3) ?? "").trim(),
      action_required: String(get(4) ?? "").trim(),
      interview_date: date,
      interview_time: time,
    });
  });
  return out;
}

export async function fetchApplications(userId?: string): Promise<AppRow[]> {
  let query = supabase
    .from("applications")
    .select("id, company, role, status, interview_date, source_email, ai_summary, user_id, created_at")
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) {
    console.error("[fetchApplications] error:", error);
    throw error;
  }

  return (data ?? []).map((r: any) => {
    let interview_date: string | null = null;
    let interview_time = "";
    if (r.interview_date) {
      const s = String(r.interview_date);
      interview_date = s.slice(0, 10);
      const tMatch = s.match(/T(\d{2}):(\d{2})/);
      if (tMatch && !(tMatch[1] === "00" && tMatch[2] === "00")) {
        interview_time = `${tMatch[1]}:${tMatch[2]}`;
      }
    }
    return {
      id: String(r.id),
      company: r.company ?? "",
      category: r.status ?? "",
      role: r.role ?? "",
      summary: r.ai_summary ?? "",
      action_required: r.source_email ?? "",
      interview_date,
      interview_time,
    };
  });
}
export const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string; cls?: string }
> = {
  applied:   { label: "APPLIED",   color: "#a78bfa", bg: "rgba(124,58,237,0.15)", ring: "rgba(124,58,237,0.4)" },
  interview: { label: "INTERVIEW", color: "#34d399", bg: "rgba(16,185,129,0.15)", ring: "rgba(16,185,129,0.5)", cls: "badge-interview" },
  offer:     { label: "OFFER",     color: "#fff",    bg: "linear-gradient(110deg,#f59e0b,#fbbf24,#f59e0b)", ring: "rgba(245,158,11,0.5)", cls: "badge-offer" },
  rejected:  { label: "REJECTED",  color: "#fb7185", bg: "rgba(244,63,94,0.15)",  ring: "rgba(244,63,94,0.4)" },
  follow_up: { label: "FOLLOW UP", color: "#fbbf24", bg: "rgba(245,158,11,0.15)", ring: "rgba(245,158,11,0.4)", cls: "badge-followup" },
  follow:    { label: "FOLLOW UP", color: "#fbbf24", bg: "rgba(245,158,11,0.15)", ring: "rgba(245,158,11,0.4)", cls: "badge-followup" },
  default:   { label: "OTHER",     color: "#94a3b8", bg: "rgba(148,163,184,0.12)",ring: "rgba(148,163,184,0.3)" },
};

export function statusKey(category: string): string {
  const c = category.toLowerCase().replace(/[\s-]+/g, "_");
  if (c.includes("interview")) return "interview";
  if (c.includes("offer")) return "offer";
  if (c.includes("reject")) return "rejected";
  if (c.includes("follow")) return "follow_up";
  if (c.includes("appl")) return "applied";
  return "default";
}
