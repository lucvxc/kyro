import { cmd } from "../../../../index.ts";
import { trackInfo } from "../../../features/lastfm/client.ts";
import { card, pair, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm plays track",
  aliases: ["lastfm playstrack", "fm playstrack", "lf playstrack"],
  description: "Check your plays for a track.",
  syntax: "lastfm plays track <artist | track>",
  example: "fm playstrack Sade | No Ordinary Love",
  type: "message",
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author);
    const [artist, track] = pair(ctx.raw.join(" "));
    const info = await trackInfo(artist, track, linked.name);
    await ctx.reply(
      card(
        track,
        `**${linked.discord.username}** has **${Number(info.userplaycount ?? 0).toLocaleString()}** plays\n${artist}`,
      ),
    );
  },
});
