import type { Track } from "./Types.ts";

export function song(track: Track): string {
  const title = track.info.uri ? `[${track.info.title}](${track.info.uri})` : track.info.title;
  return `**${title}** by **${track.info.author}**`;
}

export function songLength(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1_000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
