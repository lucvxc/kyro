import type { User } from "discord.js";
import { albumInfo, artistInfo, trackInfo } from "./client.ts";
import { linked } from "./users.ts";

type Kind = "artist" | "album" | "track";
type Rank = { id: string; name: string; plays: number };

export async function getRanks(
  users: User[],
  kind: Kind,
  artist: string,
  name?: string,
): Promise<Rank[]> {
  const rows = await linked(users.map((user) => user.id));
  const names = new Map(users.map((user) => [user.id, user.username]));
  return rank(
    rows,
    kind,
    artist,
    name,
    (row) => names.get(row.id) ?? row.lastfm!,
  );
}

export async function getGlobalRanks(
  kind: Kind,
  artist: string,
  name?: string,
): Promise<Rank[]> {
  return rank(await linked(), kind, artist, name, (row) => row.lastfm!);
}

export function formatRanks(items: Rank[]): string {
  return (
    items
      .slice(0, 15)
      .map(
        (item, i) =>
          `${i + 1}. **${item.name}**  ·  **${item.plays.toLocaleString()}** plays`,
      )
      .join("\n") || "Nobody has any plays yet."
  );
}

export function formatGlobalRanks(items: Rank[]): string {
  return (
    items
      .slice(0, 15)
      .map(
        (item, i) =>
          `**${i + 1}.** <@${item.id}> · **${item.plays.toLocaleString()}** plays`,
      )
      .join("\n") || "Nobody has any plays yet."
  );
}

type LinkedUser = Awaited<ReturnType<typeof linked>>[number];

async function rank(
  users: LinkedUser[],
  kind: Kind,
  artist: string,
  name: string | undefined,
  displayName: (user: LinkedUser) => string,
): Promise<Rank[]> {
  const scores = await Promise.all(
    users.map(async (user) => ({
      id: user.id,
      name: displayName(user),
      plays: await playCount(user.lastfm!, kind, artist, name),
    })),
  );

  return scores
    .filter((item) => item.plays > 0)
    .sort((a, b) => b.plays - a.plays);
}

async function playCount(
  user: string,
  kind: Kind,
  artist: string,
  name?: string,
): Promise<number> {
  try {
    if (kind === "artist")
      return Number((await artistInfo(artist, user)).stats.userplaycount ?? 0);
    if (kind === "album")
      return Number((await albumInfo(artist, name!, user)).userplaycount ?? 0);
    return Number((await trackInfo(artist, name!, user)).userplaycount ?? 0);
  } catch {
    return 0;
  }
}
