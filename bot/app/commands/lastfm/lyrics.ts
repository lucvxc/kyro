import { cmd, UserError } from "../../../../index.ts";
import { recent } from "../../../features/lastfm/client.ts";
import { card, pair, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm lyrics",
  aliases: ["fm lyrics", "lf lyrics"],
  description: "Find lyrics for a track or your current song.",
  syntax: "lastfm lyrics (artist | track)",
  example: "fm lyrics Sade | No Ordinary Love",
  type: "message",
  run: async (ctx) => {
    let artist: string;
    let track: string;
    if (ctx.raw.length) [artist, track] = pair(ctx.raw.join(" "));
    else {
      const linked = await getLastfmUser(ctx.author);
      const current = (await recent(linked.name, 1))[0];
      if (!current) throw new UserError("No recent track was found.");
      artist = current.artist.name;
      track = current.name;
    }
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`,
    );
    const result = (await res.json()) as { lyrics?: string };
    if (!result.lyrics)
      throw new UserError("Lyrics were not found for that track.");
    await ctx.reply(card(`${track} · ${artist}`, result.lyrics.slice(0, 3500)));
  },
});
