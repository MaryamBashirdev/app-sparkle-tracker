const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function refreshAccessToken(
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
    console.error("Google token refresh failed:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}