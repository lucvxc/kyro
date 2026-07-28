const endpoint = "https://ws.audioscrobbler.com/2.0/";

export type Image = { "#text": string; size: string };
export type Artist = {
  name: string;
  url: string;
  playcount?: string;
  image?: Image[];
};
export type Album = {
  name: string;
  url: string;
  playcount?: string;
  artist: Artist | string;
  image?: Image[];
};
export type Track = {
  name: string;
  url: string;
  artist: Artist;
  album?: { "#text": string };
  image?: Image[];
  date?: { uts: string; "#text": string };
  "@attr"?: { nowplaying?: string };
  playcount?: string;
  loved?: string;
};

export type Profile = {
  name: string;
  url: string;
  playcount: string;
  artist_count: string;
  album_count: string;
  track_count: string;
  registered: { unixtime: string };
  country?: string;
  image: Image[];
};

type Session = {
  name: string;
  key: string;
};

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
  const response = await call<{ session: Session }>("auth.getSession", {
    token,
    api_sig: sig,
  });
  return response.session;
}

export async function profile(user: string) {
  return (await call<{ user: Profile }>("user.getInfo", { user })).user;
}

export async function recent(user: string, limit = 10) {
  const response = await call<{ recenttracks: { track: Track[] } }>(
    "user.getRecentTracks",
    { user, limit: String(limit), extended: "1" },
  );
  return response.recenttracks.track;
}

export type Period =
  "7day" | "1month" | "3month" | "6month" | "12month" | "overall";
export type TopKind = "artists" | "albums" | "tracks";

export async function top(
  user: string,
  kind: TopKind,
  period: Period,
  limit = 10,
) {
  const method =
    kind === "artists"
      ? "user.getTopArtists"
      : kind === "albums"
        ? "user.getTopAlbums"
        : "user.getTopTracks";
  const key =
    kind === "artists"
      ? "topartists"
      : kind === "albums"
        ? "topalbums"
        : "toptracks";
  const item =
    kind === "artists" ? "artist" : kind === "albums" ? "album" : "track";
  const response = await call<
    Record<string, Record<string, (Artist | Album | Track)[]>>
  >(method, {
    user,
    period,
    limit: String(limit),
  });
  return response[key]?.[item] ?? [];
}

export async function loved(user: string, limit = 10) {
  const response = await call<{ lovedtracks: { track: Track[] } }>(
    "user.getLovedTracks",
    {
      user,
      limit: String(limit),
    },
  );
  return response.lovedtracks.track;
}

export async function artistInfo(artist: string, user?: string) {
  return (
    await call<{
      artist: Artist & {
        stats: { listeners: string; playcount: string; userplaycount?: string };
      };
    }>("artist.getInfo", { artist, ...(user ? { username: user } : {}) })
  ).artist;
}

export async function albumInfo(artist: string, album: string, user?: string) {
  return (
    await call<{
      album: Album & { userplaycount?: string; playcount: string };
    }>("album.getInfo", { artist, album, ...(user ? { username: user } : {}) })
  ).album;
}

export async function trackInfo(artist: string, track: string, user?: string) {
  return (
    await call<{
      track: Track & {
        userplaycount?: string;
        playcount: string;
        listeners: string;
      };
    }>("track.getInfo", { artist, track, ...(user ? { username: user } : {}) })
  ).track;
}

export function image(images?: Image[]): string | undefined {
  return images?.findLast((item) => item["#text"])?.["#text"] || undefined;
}

function md5(value: string): string {
  return new Bun.CryptoHasher("md5").update(value).digest("hex");
}
