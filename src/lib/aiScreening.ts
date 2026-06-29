const SYSTEM_PROMPT = `Tum ek HR recruiter assistant ho. Tumhe ek open role ki job description,
aur ek incoming email (sender, subject, snippet) di jayegi.

1. Pehle decide karo: yeh email kisi job application/resume ke baare mein hai ya nahi
   (newsletters, spam, unrelated personal emails ko "is_application": false maro).
2. Agar haan, candidate ko job description ke requirements ke against qualify/disqualify karo.
3. Job description se hi role ka title nikal kar "role" field mein daalo.

Bilkul sirf JSON return karo, koi extra text nahi:
{"is_application": true/false, "qualified": true/false, "candidate_name": "...", "role": "...", "reason": "..."}`;

export type ScreeningResult = {
  is_application: boolean;
  qualified: boolean;
  candidate_name: string;
  role: string;
  reason: string;
};

export async function screenEmail(
  mistralApiKey: string,
  jobDescription: string,
  emailFrom: string,
  emailSubject: string,
  emailSnippet: string,
): Promise<ScreeningResult> {
  const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nEMAIL FROM: ${emailFrom}\nEMAIL SUBJECT: ${emailSubject}\nEMAIL SNIPPET: ${emailSnippet}`;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mistralApiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error("Mistral API call failed:", res.status, await res.text());
    return { is_application: false, qualified: false, candidate_name: "Unknown", role: "", reason: "AI call failed" };
  }

  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(content);
    return {
      is_application: !!parsed.is_application,
      qualified: !!parsed.qualified,
      candidate_name: parsed.candidate_name || "Unknown",
      role: parsed.role || "—",
      reason: parsed.reason || "",
    };
  } catch {
    return { is_application: false, qualified: false, candidate_name: "Unknown", role: "", reason: "AI response parse error" };
  }
}