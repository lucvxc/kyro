const endpoint = "https://ws.audioscrobbler.com/2.0/";

export interface Session {
  name: string;
  key: string;
}

export async function call<T>(
  method: string,
  params: Record<string, string> = {},
): Promise<T> {
  const key = process.env.LASTFM;
  if (!key) throw new Error("LASTFM is not configured.");
  const query = new URLSearchParams({
    method,
    api_key: key,
    format: "json",
    ...params,
  });
  const res = await fetch(`${endpoint}?${query}`);
  const body = (await res.json()) as T & { error?: number; message?: string };
  if (!res.ok || body.error)
    throw new Error(body.message ?? `Last.fm request failed (${res.status}).`);
  return body;
}

export async function session(token: string): Promise<Session> {
  const key = process.env.LASTFM;
  const secret = process.env.LASTFM_SECRET;
  if (!key || !secret)
    throw new Error("Last.fm authentication is not configured.");
  const sig = md5(`api_key${key}methodauth.getSessiontoken${token}${secret}`);
  const data = await call<{ session: Session }>("auth.getSession", {
    token,
    api_sig: sig,
  });
  return data.session;
}

function md5(value: string): string {
  return new Bun.CryptoHasher("md5").update(value).digest("hex");
}
